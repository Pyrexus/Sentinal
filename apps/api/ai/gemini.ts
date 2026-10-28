import type { z } from 'zod';
import { stripHtml } from './schemas';

export async function readBoundedJson(response:Response,maxBytes=100_000):Promise<unknown> {
  if(Number(response.headers.get('content-length')||0)>maxBytes) throw new Error('Response too large');
  const reader=response.body?.getReader();if(!reader) throw new Error('Empty response');
  const chunks:Uint8Array[]=[];let size=0;
  try {for(;;) {const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw new Error('Response too large');chunks.push(value);}}
  catch(error) {await reader.cancel();throw error;}
  const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(result));
}

export async function generateJson<T>(apiKey:string,system:string,prompt:string,responseSchema:object,validator:z.ZodType<T>,fetcher:typeof fetch=fetch,model='gemini-2.5-flash'):Promise<T> {
  if(!/^gemini-[a-z0-9.-]{1,100}$/i.test(model))throw new Error('Invalid Gemini model');
  const thinkingConfig=/^gemini-2\.5-flash(?:-lite)?(?:-\d{3})?$/.test(model)?{thinkingConfig:{thinkingBudget:0}}:{};
  let lastError:unknown;
  for(let attempt=0;attempt<2;attempt++) {
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
    try {
      // The configurable model stays on the fixed Gemini API origin.
      const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},signal:controller.signal,
        body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema,temperature:0.2,maxOutputTokens:5000,...thinkingConfig}}),
      });
      if(!response.ok) throw new Error(`AI response status ${response.status}`);
      const envelope=await readBoundedJson(response);
      if(!envelope||typeof envelope!=='object'||!('candidates'in envelope)||!Array.isArray(envelope.candidates))throw new Error('Invalid AI envelope');
      const candidate=envelope.candidates[0] as {content?:{parts?:{text?:string}[]};finishReason?:string}|undefined;
      if(candidate?.finishReason && candidate.finishReason!=='STOP') throw new Error('Incomplete AI response');
      const text=candidate?.content?.parts?.map(part=>part.text||'').join('');
      if(!text)throw new Error('Empty AI response');
      return validator.parse(stripHtml(JSON.parse(text)));
    } catch(error) {lastError=error;} finally {clearTimeout(timeout);}
    if(attempt===0)await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw lastError instanceof Error ? lastError : new Error('AI generation failed');
}
