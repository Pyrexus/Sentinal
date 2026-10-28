import { Hono } from 'hono';
import { z } from 'zod';
import { privacyQuestions, protectionChecks } from '../../../shared/content';
import { calculatePrivacy, checklistScore } from '../domain/scoring';
import { body, fail, rateLimit, requireUser, success, type ApiEnv } from '../http';

const routes = new Hono<ApiEnv>();
routes.post('/privacy/submit', async (c) => {
  const user = requireUser(c);
  const input = await body(c, z.object({ answers: z.record(z.number().int().min(0).max(5)) }).strict());
  if (Object.keys(input.answers).length !== privacyQuestions.length || privacyQuestions.some((q) => !Object.hasOwn(input.answers, q.id) || !q.options[input.answers[q.id]])) fail(400, 'INCOMPLETE_AUDIT', 'Answer each privacy question using the listed choices.');
  await rateLimit(c, 'privacy', 10);
  const result = calculatePrivacy(privacyQuestions, input.answers);
  await c.get('repository').savePrivacy(user.id, { ...result, answers: input.answers, source: 'rules', createdAt: new Date().toISOString() });
  await c.get('repository').appendActivity(user.id, { key: 'privacy:first', kind: 'privacy', title: 'Reviewed privacy habits', description: 'Completed the guided privacy check.', xp: 30 });
  return success(c, { ...result, source: 'rules' });
});
routes.post('/protect/update', async (c) => {
  const user = requireUser(c);
  const input = await body(c, z.object({ checks: z.record(z.boolean()) }).strict());
  if (Object.keys(input.checks).some((id) => !protectionChecks.some((check) => check.id === id))) fail(400, 'UNKNOWN_CHECK', 'The checklist contains an unknown item.');
  await rateLimit(c, 'protect', 30);
  const current = await c.get('repository').getState(user.id);
  const checks = { ...current.checklist, ...input.checks };
  await c.get('repository').updateChecklist(user.id, checks);
  if (Object.values(checks).some(Boolean)) await c.get('repository').appendActivity(user.id, { key: 'protect:first', kind: 'protect', title: 'Updated account protection', description: 'Recorded a self-reported security action.', xp: 20 });
  return success(c, { checks, score: checklistScore(checks, protectionChecks) });
});
export default routes;
