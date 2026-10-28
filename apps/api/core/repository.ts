import {and,desc,eq,gte,sql} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../db/schema';
import type {RadarItem} from '../../../shared/types';
import type {AnalysisResult} from '../ai/schemas';
import {isDemoMode,type RuntimeEnv,type UserIdentity} from './types';

export type AnalysisRecord={id:string;userId:string|null;inputHash:string;result:AnalysisResult;encryptedContent?:string;createdAt:string};
export type ActivityInput={key:string;kind:string;title:string;description:string;xp:number;payload?:Record<string,unknown>};
export type Activity=ActivityInput&{id:string;createdAt:string;payload:Record<string,unknown>};
export type UserState={checklist:Record<string,boolean>;privacy:Record<string,unknown>|null};
export type RateLimitResult={allowed:boolean;remaining:number;retryAfter:number};

export interface Repository {
  ensureUser(user:UserIdentity):Promise<void>;
  saveAnalysis(record:AnalysisRecord):Promise<void>;
  getCachedAnalysis(inputHash:string):Promise<AnalysisResult|null>;
  getRadar(date?:string):Promise<RadarItem[]>;
  upsertRadar(items:RadarItem[]):Promise<void>;
  getState(userId:string):Promise<UserState>;
  savePrivacy(userId:string,payload:Record<string,unknown>):Promise<void>;
  updateChecklist(userId:string,values:Record<string,boolean>):Promise<void>;
  appendActivity(userId:string,input:ActivityInput):Promise<boolean>;
  timeline(userId:string):Promise<Activity[]>;
  exportUser(userId:string):Promise<Record<string,unknown>>;
  deleteUser(userId:string):Promise<void>;
  consumeRateLimit(key:string,limit:number,windowMs:number,now?:number):Promise<RateLimitResult>;
  audit(actor:string|null,action:string,ipHash:string):Promise<void>;
  close():Promise<void>;
}

/** Demo state is intentionally temporary and may disappear when a Worker isolate restarts. */
export class MemoryRepository implements Repository {
  private users=new Map<string,UserIdentity>();
  private analyses:AnalysisRecord[]=[];
  private radar=new Map<string,RadarItem>();
  private states=new Map<string,UserState>();
  private events=new Map<string,Activity[]>();
  private limits=new Map<string,{count:number;expiresAt:number}>();
  private audits:{actor:string|null;action:string;ipHash:string;createdAt:string}[]=[];
  async ensureUser(user:UserIdentity){this.users.set(user.id,structuredClone(user));}
  async saveAnalysis(record:AnalysisRecord){this.analyses.push(structuredClone(record));if(this.analyses.length>1000)this.analyses.shift();}
  async getCachedAnalysis(inputHash:string){const cutoff=Date.now()-86400000;const entry=[...this.analyses].reverse().find(record=>record.inputHash===inputHash&&Date.parse(record.createdAt)>cutoff&&Date.parse(record.result.assessedAt||record.createdAt)>cutoff);return entry?structuredClone(entry.result):null;}
  async getRadar(date?:string){return [...this.radar.values()].filter(item=>!date||item.date===date).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50).map(item=>structuredClone(item));}
  async upsertRadar(items:RadarItem[]){for(const item of items)this.radar.set(item.id,structuredClone(item));if(this.radar.size>100){const keys=[...this.radar.keys()];for(const key of keys.slice(0,this.radar.size-100))this.radar.delete(key);}}
  async getState(userId:string){return structuredClone(this.states.get(userId)||{checklist:{},privacy:null});}
  async savePrivacy(userId:string,payload:Record<string,unknown>){const state=structuredClone(this.states.get(userId)||{checklist:{},privacy:null}) as UserState;state.privacy=structuredClone(payload);this.states.set(userId,state);}
  async updateChecklist(userId:string,values:Record<string,boolean>){const state=structuredClone(this.states.get(userId)||{checklist:{},privacy:null}) as UserState;state.checklist={...state.checklist,...values};this.states.set(userId,state);}
  async appendActivity(userId:string,input:ActivityInput){
    const events=this.events.get(userId)||[];if(events.some(event=>event.key===input.key))return false;
    events.push({...structuredClone(input),id:crypto.randomUUID(),createdAt:new Date().toISOString(),payload:structuredClone(input.payload||{})});this.events.set(userId,events);return true;
  }
  async timeline(userId:string){return structuredClone(this.events.get(userId)||[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  async exportUser(userId:string){return {user:structuredClone(this.users.get(userId)||null),state:await this.getState(userId),activities:await this.timeline(userId),analyses:structuredClone(this.analyses.filter(item=>item.userId===userId)),auditLog:structuredClone(this.audits.filter(item=>item.actor===userId))};}
  async deleteUser(userId:string){this.users.delete(userId);this.states.delete(userId);this.events.delete(userId);this.analyses=this.analyses.filter(item=>item.userId!==userId);this.audits=this.audits.filter(item=>item.actor!==userId);}
  async consumeRateLimit(key:string,limit:number,windowMs:number,now=Date.now()){
    if(this.limits.size>2000)for(const [entryKey,value]of this.limits){if(value.expiresAt<=now)this.limits.delete(entryKey);}
    if(this.limits.size>5000&&!this.limits.has(key))return {allowed:false,remaining:0,retryAfter:60};
    let entry=this.limits.get(key);if(!entry||entry.expiresAt<=now)entry={count:0,expiresAt:now+windowMs};entry.count++;this.limits.set(key,entry);
    return {allowed:entry.count<=limit,remaining:Math.max(0,limit-entry.count),retryAfter:Math.max(1,Math.ceil((entry.expiresAt-now)/1000))};
  }
  async audit(actor:string|null,action:string,ipHash:string){this.audits.push({actor,action,ipHash,createdAt:new Date().toISOString()});if(this.audits.length>2000)this.audits.shift();}
  async close(){}
}

class PostgresRepository implements Repository {
  private client:ReturnType<typeof postgres>;
  private db:ReturnType<typeof drizzle<typeof schema>>;
  constructor(connectionString:string){
    this.client=postgres(connectionString,{max:5,fetch_types:false,prepare:true,connect_timeout:10,idle_timeout:5});
    this.db=drizzle(this.client,{schema});
  }
  async ensureUser(user:UserIdentity){await this.db.insert(schema.users).values({id:user.id,displayName:user.displayName}).onConflictDoUpdate({target:schema.users.id,set:{displayName:user.displayName}});}
  async saveAnalysis(record:AnalysisRecord){await this.db.insert(schema.analyses).values({id:record.id,userId:record.userId,inputHash:record.inputHash,category:record.result.category,riskScore:record.result.riskScore,resultJson:record.result,encryptedContent:record.encryptedContent,createdAt:record.createdAt});}
  async getCachedAnalysis(inputHash:string){const cutoff=new Date(Date.now()-86400000).toISOString();const [row]=await this.db.select({result:schema.analyses.resultJson}).from(schema.analyses).where(and(eq(schema.analyses.inputHash,inputHash),gte(schema.analyses.createdAt,cutoff),sql`(${schema.analyses.resultJson}->>'assessedAt' IS NULL OR ${schema.analyses.resultJson}->>'assessedAt' >= ${cutoff})`)).orderBy(desc(schema.analyses.createdAt)).limit(1);return row?.result||null;}
  async getRadar(date?:string){const rows=await this.db.select({item:schema.radarItems.payloadJson}).from(schema.radarItems).where(date?eq(schema.radarItems.date,date):undefined).orderBy(desc(schema.radarItems.date)).limit(50);return rows.map(row=>row.item);}
  async upsertRadar(items:RadarItem[]){for(const item of items)await this.db.insert(schema.radarItems).values({id:item.id,date:item.date,title:item.title,type:item.type,severity:item.severity,source:item.source,payloadJson:item}).onConflictDoUpdate({target:schema.radarItems.id,set:{payloadJson:item,title:item.title,severity:item.severity,source:item.source}});}
  async getState(userId:string){
    const [checks,privacy]=await Promise.all([this.db.select().from(schema.checklistState).where(eq(schema.checklistState.userId,userId)),this.db.select().from(schema.privacyAudits).where(eq(schema.privacyAudits.userId,userId)).orderBy(desc(schema.privacyAudits.createdAt)).limit(1)]);
    return {checklist:Object.fromEntries(checks.map(check=>[check.key,check.checked===1])),privacy:privacy[0]?.payloadJson||null};
  }
  async savePrivacy(userId:string,payload:Record<string,unknown>){await this.db.insert(schema.privacyAudits).values({id:crypto.randomUUID(),userId,payloadJson:payload});}
  async updateChecklist(userId:string,values:Record<string,boolean>){for(const [key,checked]of Object.entries(values))await this.db.insert(schema.checklistState).values({userId,key,checked:checked?1:0}).onConflictDoUpdate({target:[schema.checklistState.userId,schema.checklistState.key],set:{checked:checked?1:0}});}
  async appendActivity(userId:string,input:ActivityInput){
    return this.db.transaction(async tx=>{
      const id=crypto.randomUUID();
      const inserted=await tx.insert(schema.activities).values({id,userId,...input,payload:input.payload||{}}).onConflictDoNothing({target:[schema.activities.userId,schema.activities.key]}).returning({id:schema.activities.id});
      if(!inserted.length)return false;
      const today=new Date().toISOString().slice(0,10);
      await tx.insert(schema.progress).values({userId,xp:input.xp,level:Math.floor(input.xp/100)+1,streak:1,lastActive:today}).onConflictDoUpdate({target:schema.progress.userId,set:{xp:sql`${schema.progress.xp} + ${input.xp}`,level:sql`floor((${schema.progress.xp} + ${input.xp}) / 100.0)::integer + 1`,lastActive:today}});
      if(input.kind==='lab'&&typeof input.payload?.scenarioId==='string'&&typeof input.payload?.score==='number')await tx.insert(schema.labAttempts).values({id,userId,scenarioId:input.payload.scenarioId,score:input.payload.score,payloadJson:input.payload});
      return true;
    });
  }
  async timeline(userId:string){const rows=await this.db.select().from(schema.activities).where(eq(schema.activities.userId,userId)).orderBy(desc(schema.activities.createdAt));return rows.map(({userId:_owner,...event})=>event);}
  async exportUser(userId:string){
    const [user,analyses,labAttempts,privacyAudits,auditLog]=await Promise.all([this.db.select().from(schema.users).where(eq(schema.users.id,userId)),this.db.select().from(schema.analyses).where(eq(schema.analyses.userId,userId)),this.db.select().from(schema.labAttempts).where(eq(schema.labAttempts.userId,userId)),this.db.select().from(schema.privacyAudits).where(eq(schema.privacyAudits.userId,userId)),this.db.select().from(schema.auditLog).where(eq(schema.auditLog.actor,userId))]);
    return {user:user[0]||null,state:await this.getState(userId),activities:await this.timeline(userId),analyses,labAttempts,privacyAudits,auditLog};
  }
  async deleteUser(userId:string){await this.db.delete(schema.users).where(eq(schema.users.id,userId));}
  async consumeRateLimit(key:string,limit:number,windowMs:number,now=Date.now()){
    const timestamp=new Date(now),expiresAt=new Date(now+windowMs);
    const [row]=await this.db.insert(schema.rateLimits).values({key,count:1,expiresAt}).onConflictDoUpdate({target:schema.rateLimits.key,set:{count:sql`CASE WHEN ${schema.rateLimits.expiresAt} <= ${timestamp} THEN 1 ELSE ${schema.rateLimits.count} + 1 END`,expiresAt:sql`CASE WHEN ${schema.rateLimits.expiresAt} <= ${timestamp} THEN ${expiresAt} ELSE ${schema.rateLimits.expiresAt} END`}}).returning();
    return {allowed:row.count<=limit,remaining:Math.max(0,limit-row.count),retryAfter:Math.max(1,Math.ceil((row.expiresAt.getTime()-now)/1000))};
  }
  async audit(actor:string|null,action:string,ipHash:string){await this.db.insert(schema.auditLog).values({id:crypto.randomUUID(),actor,action,ipHash});}
  async close(){await this.client.end({timeout:2});}
}

const demoRepository=new MemoryRepository();
export function createRepository(env:RuntimeEnv):Repository {
  if(isDemoMode(env))return demoRepository;
  if(!env.HYPERDRIVE)throw new Error('Hyperdrive is required for persistent mode');
  return new PostgresRepository(env.HYPERDRIVE.connectionString);
}
