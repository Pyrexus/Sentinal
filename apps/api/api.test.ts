import { describe, expect, it } from 'vitest';
import { app } from './index';
import { z } from 'zod';
import { labScenarios, lessons, privacyQuestions, protectionChecks } from '../../shared/content';

let requester = 0;
const envelope = z.object({
  data: z.object({
    items: z.array(z.object({ fictional: z.boolean(), source: z.string() })).default([]),
    id: z.string().optional(), message: z.string().optional(), correctVerdict: z.string().optional(),
    hotspots: z.array(z.object({ suspicious: z.boolean().optional() })).default([]),
    quiz: z.array(z.object({ answerIndex: z.number().optional() })).default([]),
    riskScore: z.number().optional(), xpAwarded: z.number().optional(), score: z.number().optional(), xp: z.number().optional(),
    checklist: z.preprocess((value) => Array.isArray(value) ? {} : value, z.record(z.string(), z.boolean())).default({}),
  }).optional(),
  error: z.object({ code: z.string() }).optional(),
});
async function decoded(response: Response) { return envelope.parse(await response.json()); }
async function request(path: string, options: { cookie?: string; data?: unknown; method?: string; ip?: string; origin?: string } = {}) {
  const headers = new Headers({ 'CF-Connecting-IP': options.ip || `test-client-${++requester}` });
  if (options.cookie) headers.set('Cookie', options.cookie);
  if (options.origin) headers.set('Origin', options.origin);
  if (options.data !== undefined) headers.set('Content-Type', 'application/json');
  return app.request(`https://sentinel.example/api${path}`, { method: options.method || (options.data === undefined ? 'GET' : 'POST'), headers, body: options.data === undefined ? undefined : JSON.stringify(options.data) }, {});
}
async function session() {
  const response = await request('/config');
  expect(response.status).toBe(200);
  return response.headers.get('Set-Cookie')!.split(';')[0];
}

describe('integrated safety and learning API', () => {
  it('serves a fictional public feed without a session cookie', async () => {
    const response = await request('/radar');
    const { data } = await decoded(response);
    if (!data) throw new Error('Expected a data envelope');
    expect(data.items).toHaveLength(10);
    expect(data.items.every((item: { fictional: boolean; source: string }) => item.fictional && item.source === 'seed')).toBe(true);
    expect(response.headers.get('Set-Cookie')).toBeNull();
  });
  it('rejects unknown fields, unsupported protocols, oversized bodies and cross-origin writes', async () => {
    for (const data of [{ type: 'text', content: 'hello', ignored: true }, { type: 'url', content: 'file:///private' }]) {
      const response = await request('/analyze', { data });
      expect(response.status).toBe(400);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    }
    expect((await request('/analyze', { data: { type: 'text', content: 'x'.repeat(19000) } })).status).toBe(413);
    expect((await request('/analyze', { data: { type: 'text', content: 'hello world' }, origin: 'https://unrelated.example' })).status).toBe(403);
  });
  it('returns Retry-After and prevents quota resets by changing the demo session', async () => {
    let response: Response | undefined;
    for (let index = 0; index < 11; index++) response = await request('/analyze', { ip: 'shared-quota-test', data: { type: 'text', content: `Sample ordinary class notice ${index}` } });
    expect(response!.status).toBe(429);
    expect(Number(response!.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect((await decoded(response!)).error?.code).toBe('RATE_LIMITED');
  });
  it('keeps raw pasted text out of data exports by default', async () => {
    const cookie = await session();
    const content = 'FICTIONALPRIVATE123 Bharat Trust Bank asks you to share OTP urgently';
    const response = await request('/analyze', { cookie, data: { type: 'text', content } });
    expect(response.status).toBe(200);
    expect((await decoded(response)).data?.riskScore).toBeGreaterThanOrEqual(65);
    const exported = await request('/me/export', { cookie });
    expect(await exported.text()).not.toContain('FICTIONALPRIVATE123');
    expect((await request('/analyze', { cookie, data: { type: 'text', content, save: true } })).status).toBe(503);
  });
  it('binds practice rounds to the owner and prevents repeated XP awards', async () => {
    const owner = await session();
    const other = await session();
    const response = await request('/lab/next', { cookie: owner });
    const { data: round } = await decoded(response);
    if (!round) throw new Error('Expected a round');
    expect(round.correctVerdict).toBeUndefined();
    expect(round.hotspots[0]?.suspicious).toBeUndefined();
    const original = labScenarios.find((item) => item.message === round.message)!;
    const submission = { scenarioId: round.id, verdict: original.correctVerdict, selectedHotspots: original.hotspots.filter((item) => item.suspicious).map((item) => item.id) };
    expect((await request('/lab/submit', { cookie: other, data: submission })).status).toBe(404);
    const first = await request('/lab/submit', { cookie: owner, data: submission });
    expect((await decoded(first)).data?.xpAwarded).toBeGreaterThan(0);
    const repeated = await request('/lab/submit', { cookie: owner, data: submission });
    expect((await decoded(repeated)).data?.xpAwarded).toBe(0);
  });
  it('grades lesson answers on the server and preserves isolated progress', async () => {
    const owner = await session();
    const other = await session();
    const lesson = lessons[0];
    const detail = await request(`/learn/${lesson.slug}`);
    expect((await decoded(detail)).data?.quiz[0].answerIndex).toBeUndefined();
    const result = await request(`/learn/${lesson.slug}/quiz`, { cookie: owner, data: { answers: lesson.quiz.map((question) => question.answerIndex) } });
    expect((await decoded(result)).data?.score).toBe(100);
    const ownerDashboard = await request('/me/dashboard', { cookie: owner });
    expect((await decoded(ownerDashboard)).data?.xp).toBe(30);
    const otherDashboard = await request('/me/dashboard', { cookie: other });
    expect((await decoded(otherDashboard)).data?.xp).toBe(0);
  });
  it('validates complete audits, persists checks and deletes only the requesting user data', async () => {
    const owner = await session();
    const other = await session();
    expect((await request('/privacy/submit', { cookie: owner, data: { answers: {} } })).status).toBe(400);
    const answers = Object.fromEntries(privacyQuestions.map((question) => [question.id, 0]));
    expect((await request('/privacy/submit', { cookie: owner, data: { answers } })).status).toBe(200);
    const checkId = protectionChecks[0].id;
    expect((await request('/protect/update', { cookie: other, data: { checks: { [checkId]: true } } })).status).toBe(200);
    expect((await request('/me', { cookie: owner, method: 'DELETE', data: { confirm: true } })).status).toBe(200);
    const second = await request('/me/dashboard', { cookie: other });
    expect((await decoded(second)).data?.checklist[checkId]).toBe(true);
  });
  it('rejects administrative generation without a configured secret', async () => {
    expect((await request('/radar/generate', { data: {} })).status).toBe(503);
  });
});
