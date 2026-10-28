import { z } from 'zod';
import { radarSeeds, labScenarios } from '../../../shared/content';
import type { RadarItem, LabScenario } from '../../../shared/types';
import type { RuntimeEnv } from '../core/types';
import { heuristicAnalyze } from './heuristics';
import { generateJson } from './gemini';
import { ANALYZER_SYSTEM, analysisPrompt, RADAR_SYSTEM } from './prompts';
import { analysisModelSchema,analysisSchema,analysisResponseSchema,radarBatchSchema,radarResponseSchema,type AnalysisResult } from './schemas';
import { safeBrowsingSignal } from './safe-browsing';
import { ExpiringCache } from './cache';
import { sha256 } from '../core/crypto';

export async function analyzeContent(env:RuntimeEnv,input:{type:'text'|'url';content:string}):Promise<AnalysisResult> {
  const baseline=heuristicAnalyze(input.content);
  let result=baseline;
  if(env.GEMINI_API_KEY) {
    try {
      const assessment=await generateJson(env.GEMINI_API_KEY,ANALYZER_SYSTEM,analysisPrompt(input.type,input.content),analysisResponseSchema,analysisModelSchema);
      // Evidence must be present in the submitted text; model labels cannot override obvious dangerous requests.
      assessment.redFlags=assessment.redFlags.filter(flag=>input.content.includes(flag.text));
      const riskScore=Math.max(assessment.riskScore,baseline.riskScore>=65 ? baseline.riskScore : 0);
      result=analysisSchema.parse({...assessment,riskScore,verdict:riskScore>=65?'High':riskScore>=30?'Medium':'Low',source:'gemini',safeBrowsing:baseline.safeBrowsing});
    } catch {result=baseline;}
  }
  result.safeBrowsing=await safeBrowsingSignal(input.content,env.SAFE_BROWSING_API_KEY);
  return result;
}

export function isFictionalRadarSample(message:string):boolean {
  if(!/\(fictional\)/i.test(message)||/\+?\d[\d\s()-]{7,}\d/.test(message))return false;
  const links=message.match(/(?:https?:\/\/|www\.)[^\s<>]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|net|org|example)(?:\/[^\s<>]*)?/gi)||[];
  for(const link of links){try {const url=new URL(link.startsWith('http')?link:`https://${link}`);if(!url.hostname.endsWith('.example')||url.username||url.password)return false;}catch{return false;}}
  return !/\b(?:sbi|hdfc|icici|axis bank|paytm|phonepe|google pay|amazon|flipkart|reserve bank|rbi|delhi police|mumbai police)\b/i.test(message);
}

export async function generateRadar(env:RuntimeEnv,date=new Date().toISOString().slice(0,10)):Promise<RadarItem[]> {
  if(env.GEMINI_API_KEY) {
    try {
      const data=await generateJson(env.GEMINI_API_KEY,RADAR_SYSTEM,`Awareness sample date: ${date}. Produce varied fictional practice patterns; do not assert that these happened today.`,radarResponseSchema,radarBatchSchema);
      if(data.items.some(item=>!isFictionalRadarSample(item.sampleMessage)))throw new Error('Unsafe fictional sample');
      return data.items.map((item,index)=>({...item,id:`radar-${date}-${index+1}`,date,source:'gemini' as const,fictional:true as const,labScenarioId:`radar-${date}-${index+1}`}));
    }catch { /* A validated, labeled sample bank remains available if generation fails. */ }
  }
  return radarSeeds.slice(0,5).map((item,index)=>({...item,id:`seed-${date}-${index+1}`,date,source:'seed',labScenarioId:item.labScenarioId}));
}

const labSchema=z.object({
  title:z.string().min(3).max(120),channel:z.enum(['sms','email','whatsapp','login','upi']),sender:z.string().min(2).max(100),
  message:z.string().min(10).max(1600),correctVerdict:z.enum(['safe','scam']),
  hotspots:z.array(z.object({id:z.string().regex(/^[a-z0-9-]{1,30}$/),text:z.string().min(2).max(300),explanation:z.string().min(10).max(500),suspicious:z.boolean()}).strict()).min(2).max(5),
  explanation:z.string().min(10).max(1000),
}).strict().superRefine((scenario,context)=>{
  if(!isFictionalRadarSample(scenario.message))context.addIssue({code:'custom',message:'Scenario must be fictional with safe domains'});
  if(new Set(scenario.hotspots.map(item=>item.id)).size!==scenario.hotspots.length)context.addIssue({code:'custom',message:'Hotspot IDs must be unique'});
  if(scenario.hotspots.some(item=>!scenario.message.includes(item.text)))context.addIssue({code:'custom',message:'Hotspot must quote exact message text'});
  if(scenario.correctVerdict==='scam'&&!scenario.hotspots.some(item=>item.suspicious))context.addIssue({code:'custom',message:'Scam requires evidence'});
  if(scenario.correctVerdict==='safe'&&scenario.hotspots.some(item=>item.suspicious))context.addIssue({code:'custom',message:'Safe scenario cannot have marked suspicious evidence'});
});
const labResponseSchema={type:'OBJECT',required:['title','channel','sender','message','correctVerdict','hotspots','explanation'],properties:{title:{type:'STRING'},channel:{type:'STRING',enum:['sms','email','whatsapp','login','upi']},sender:{type:'STRING'},message:{type:'STRING'},correctVerdict:{type:'STRING',enum:['safe','scam']},explanation:{type:'STRING'},hotspots:{type:'ARRAY',minItems:2,maxItems:5,items:{type:'OBJECT',required:['id','text','explanation','suspicious'],properties:{id:{type:'STRING'},text:{type:'STRING'},explanation:{type:'STRING'},suspicious:{type:'BOOLEAN'}}}}}};
// Only fictional curriculum values are retained here; no identity or request data is cached.
const labCache=new ExpiringCache<LabScenario>(12);
export async function generateLab(env:RuntimeEnv,difficulty:1|2|3,variant=0):Promise<LabScenario> {
  const date=new Date().toISOString().slice(0,10),cacheKey=`${date}:${difficulty}:${variant%3}`;
  const cached=labCache.get(cacheKey);if(cached&&(!env.GEMINI_API_KEY||cached.source==='gemini'))return cached;
  if(env.GEMINI_API_KEY){
    try{
      const scenario=await generateJson(env.GEMINI_API_KEY,`${RADAR_SYSTEM} Create ONE simulated inbox practice round instead of radar items. Include exact clickable message excerpts as hotspots; explain why each is suspicious or ordinary. Include safe and scam examples. A safe verdict must have no suspicious hotspots. Do not use personal data.`, `Create difficulty ${difficulty} of 3, variant ${variant%3}, on ${date}.`,labResponseSchema,labSchema);
      const id=`generated-${(await sha256(JSON.stringify(scenario))).slice(0,20)}`;
      const result:LabScenario={...scenario,id,difficulty,lessonSlug:'phishing',source:'gemini',fictional:true};
      labCache.set(cacheKey,result,86400000);return result;
    }catch{/* Validated fictional practice remains available when the model is unavailable. */}
  }
  const bank=labScenarios.filter(item=>item.difficulty===difficulty);
  return structuredClone(bank[Math.abs(variant)%bank.length]||labScenarios[0]);
}
