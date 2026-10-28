import { Hono } from 'hono';
import { z } from 'zod';
import { radarSeeds } from '../../../shared/content';
import { generateRadar } from '../ai/service';
import { constantTimeEqual } from '../core/crypto';
import { body, fail, rateLimit, success, type ApiEnv, type Bindings } from '../http';
import { createRepository } from '../core/repository';

const routes = new Hono<ApiEnv>();
routes.get('/radar', async (c) => {
  const items = await c.get('repository').getRadar();
  c.header('Cache-Control', 'public, max-age=300');
  return success(c, { items: items.length ? items : radarSeeds });
});
routes.post('/radar/generate', async (c) => {
  if (!c.env.ADMIN_SECRET) fail(503, 'ADMIN_NOT_CONFIGURED', 'Radar generation has not been enabled by the administrator.');
  if (!(await constantTimeEqual(c.req.header('X-Admin-Secret') || '', c.env.ADMIN_SECRET))) fail(403, 'FORBIDDEN', 'Administrator authorization is required.');
  await body(c, z.object({}).strict());
  await rateLimit(c, 'radar-generation', 2, 3600000);
  const date = new Date().toISOString().slice(0, 10);
  const existing = await c.get('repository').getRadar(date);
  if (existing.some((item) => item.source === 'gemini')) return success(c, { items: existing, cached: true });
  const items = await generateRadar(c.env, date);
  await c.get('repository').upsertRadar(items);
  await c.get('repository').audit(c.get('identity')?.id || null, 'radar.generate', c.get('ipHash'));
  return success(c, { items, cached: false });
});

export async function runDailyRadar(env: Bindings) {
  const repo = createRepository(env);
  try {
    const date = new Date().toISOString().slice(0, 10);
    if ((await repo.getRadar(date)).length) return;
    await repo.upsertRadar(await generateRadar(env, date));
  } finally { await repo.close(); }
}
export default routes;
