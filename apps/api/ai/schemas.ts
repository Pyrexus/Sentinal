import { z } from 'zod';

export const severitySchema = z.enum(['low', 'medium', 'high']);
const text = (max: number) => z.string().min(1).max(max);
export const analysisInputSchema = z.object({
  type: z.enum(['text', 'url']),
  content: z.string().trim().min(3).max(4000),
  save: z.boolean().optional().default(false),
}).strict().superRefine((value, context) => {
  if (value.type === 'url') {
    try {
      const url = new URL(value.content);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid URL');
    } catch { context.addIssue({ code: 'custom', path: ['content'], message: 'Enter an http or https URL without embedded credentials.' }); }
  }
});

export const analysisModelSchema = z.object({
  riskScore: z.number().finite().transform(value => Math.round(Math.max(0, Math.min(100, value)))),
  verdict: z.enum(['Low', 'Medium', 'High']),
  category: text(80),
  redFlags: z.array(z.object({ text: text(300), reason: text(500), severity: severitySchema }).strict()).max(12),
  explanation: text(1800),
  nextSteps: z.array(text(500)).min(1).max(8),
  confidence: severitySchema,
  uncertainty: text(600),
}).strict();

export const safeBrowsingSchema = z.object({
  status: z.enum(['not_configured', 'no_match', 'match', 'unavailable']),
  detail: text(500),
}).strict();
export const analysisSchema = analysisModelSchema.extend({
  source: z.enum(['gemini', 'heuristic']),
  safeBrowsing: safeBrowsingSchema,
});
export type AnalysisResult = z.infer<typeof analysisSchema>;
export type AnalysisInput = z.infer<typeof analysisInputSchema>;

export const radarModelItemSchema = z.object({
  title: text(120), type: text(80), severity: severitySchema,
  howItWorks: text(1600), targetAudience: text(300),
  redFlags: z.array(text(300)).min(2).max(6),
  staySafe: z.array(text(400)).min(2).max(6), sampleMessage: text(1600),
}).strict();
export const radarBatchSchema = z.object({ items: z.array(radarModelItemSchema).min(3).max(5) }).strict();

export const analysisResponseSchema = {
  type: 'OBJECT', required: ['riskScore','verdict','category','redFlags','explanation','nextSteps','confidence','uncertainty'],
  properties: {
    riskScore: {type: 'NUMBER'}, verdict: {type: 'STRING', enum: ['Low','Medium','High']}, category: {type: 'STRING'},
    redFlags: {type: 'ARRAY', items: {type: 'OBJECT', required: ['text','reason','severity'], properties: {text: {type: 'STRING'}, reason: {type: 'STRING'}, severity: {type: 'STRING', enum: ['low','medium','high']}}}},
    explanation: {type: 'STRING'}, nextSteps: {type: 'ARRAY', items: {type: 'STRING'}}, confidence: {type: 'STRING', enum: ['low','medium','high']}, uncertainty: {type: 'STRING'},
  },
};
export const radarResponseSchema = {
  type: 'OBJECT', required: ['items'], properties: {items: {type: 'ARRAY', minItems: 3, maxItems: 5, items: {
    type: 'OBJECT', required: ['title','type','severity','howItWorks','targetAudience','redFlags','staySafe','sampleMessage'],
    properties: {title: {type: 'STRING'}, type: {type: 'STRING'}, severity: {type: 'STRING', enum: ['low','medium','high']}, howItWorks: {type: 'STRING'}, targetAudience: {type: 'STRING'}, redFlags: {type: 'ARRAY', items: {type:'STRING'}}, staySafe: {type:'ARRAY',items:{type:'STRING'}},sampleMessage:{type:'STRING'}},
  }}},
};

/** All rendered strings are text; removing tags also keeps exported model text inert. */
export function stripHtml<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') as T;
  if (Array.isArray(value)) return value.map(stripHtml) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stripHtml(item)])) as T;
  return value;
}
