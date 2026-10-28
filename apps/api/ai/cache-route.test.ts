import {Hono} from 'hono';
import {describe,it,expect,vi} from 'vitest';
import analyzeRoute from '../routes/analyze';
import {MemoryRepository} from '../core/repository';
import type {ApiEnv} from '../http';
import {heuristicAnalyze} from './heuristics';

function fixture(){
  const repository=new MemoryRepository();const app=new Hono<ApiEnv>();
  app.use('*',async(c,next)=>{c.set('repository',repository);c.set('identity',null);c.set('demo',true);c.set('ipHash','test-cache-caller');await next();});
  app.route('/api',analyzeRoute);
  const content='Urgent: share your OTP immediately.';
  const request=()=>app.request('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'text',content})},{GEMINI_API_KEY:'test-key'});
  const {source:_source,safeBrowsing:_signal,...assessment}=heuristicAnalyze(content);
  const response=()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...assessment,nextSteps:['Open your official app to verify the request.']})}]}}]}),{status:200});
  return {repository,request,response,content};
}

describe('private analysis caching',()=>{
  it('reuses scores without storing quoted input and rebuilds current evidence',async()=>{
    const setup=fixture();const fetcher=vi.fn<typeof fetch>().mockImplementation(async()=>setup.response());vi.stubGlobal('fetch',fetcher);
    try {
      const first=await (await setup.request()).json() as {data:{source:string;assessedAt:string;cached:boolean}};
      const second=await (await setup.request()).json() as {data:{source:string;assessedAt:string;cached:boolean;redFlags:{text:string}[];explanation:string}};
      expect(first.data.source).toBe('gemini');expect(first.data.cached).toBe(false);expect(second.data.cached).toBe(true);expect(second.data.assessedAt).toBe(first.data.assessedAt);
      expect(second.data.redFlags.length).toBeGreaterThan(0);expect(second.data.explanation).toContain('fresh basic pattern check');expect(fetcher).toHaveBeenCalledTimes(1);
    } finally {vi.unstubAllGlobals();}
  });
  it('deduplicates concurrent provider calls with a temporary lease',async()=>{
    const setup=fixture();let release:()=>void=()=>{};let started:()=>void=()=>{};
    const gate=new Promise<void>(resolve=>{release=resolve;});const entered=new Promise<void>(resolve=>{started=resolve;});
    const fetcher=vi.fn<typeof fetch>().mockImplementation(async()=>{started();await gate;return setup.response();});vi.stubGlobal('fetch',fetcher);
    try{
      const pending=setup.request();await entered;
      const concurrent=await (await setup.request()).json() as {data:{source:string;uncertainty:string}};
      expect(concurrent.data.source).toBe('heuristic');expect(concurrent.data.uncertainty).toContain('in progress');expect(fetcher).toHaveBeenCalledTimes(1);
      release();expect((await pending).status).toBe(200);
    }finally{release();vi.unstubAllGlobals();}
  });
  it('does not renew a cached assessment beyond its original 24-hour lifetime',async()=>{
    const repo=new MemoryRepository();const now=Date.now();const result={...heuristicAnalyze('Meet at the library.'),assessedAt:new Date(now-86400001).toISOString(),cached:true};
    await repo.saveAnalysis({id:'expired',userId:null,inputHash:'hash',result,createdAt:new Date(now).toISOString()});expect(await repo.getCachedAnalysis('hash')).toBeNull();
  });
});
