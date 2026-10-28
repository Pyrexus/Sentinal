import type { AnalysisResult } from './schemas';
import { readBoundedJson } from './gemini';

export async function safeBrowsingSignal(content:string,key?:string,fetcher:typeof fetch=fetch):Promise<AnalysisResult['safeBrowsing']> {
  const urls=[...new Set(content.match(/https?:\/\/[^\s<>]+/gi)||[])].slice(0,8).filter(raw=>{try {return ['http:','https:'].includes(new URL(raw).protocol);}catch{return false;}});
  if(!key)return {status:'not_configured',detail:'Google Safe Browsing is not configured. No URL reputation signal is available.'};
  if(!urls.length)return {status:'no_match',detail:'No web URL was found in this input; there was nothing to query.'};
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);
  try {
    // The only request is to the fixed reputation API; submitted URLs are never visited.
    const response=await fetcher('https://safebrowsing.googleapis.com/v4/threatMatches:find',{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:controller.signal,
      body:JSON.stringify({client:{clientId:'sentinel-awareness',clientVersion:'1.0'},threatInfo:{threatTypes:['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE'],platformTypes:['ANY_PLATFORM'],threatEntryTypes:['URL'],threatEntries:urls.map(url=>({url}))}}),
    });
    if(!response.ok)throw new Error('Reputation unavailable');
    const body=await readBoundedJson(response,30000);
    if(!body||typeof body!=='object')throw new Error('Invalid reputation response');
    const matches='matches'in body ? body.matches : [];
    if(!Array.isArray(matches))throw new Error('Invalid reputation response');
    return matches.length ? {status:'match',detail:'Google Safe Browsing returned a threat match. Avoid the link and verify through the official app.'} : {status:'no_match',detail:'Google Safe Browsing returned no known match. New or unlisted threats can still be unsafe.'};
  } catch {return {status:'unavailable',detail:'The reputation service could not be reached. The content assessment still works.'};}
  finally {clearTimeout(timeout);}
}
