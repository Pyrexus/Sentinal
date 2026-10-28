import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod';
import type { Repository } from './core/repository';
import type { RuntimeEnv, UserIdentity } from './core/types';

export type Bindings = RuntimeEnv & { ASSETS?: Fetcher; FIREBASE_WEB_CONFIG?: string };
export type ApiEnv = { Bindings: Bindings; Variables: { repository: Repository; identity: UserIdentity | null; demo: boolean; ipHash: string } };
export type ApiContext = Context<ApiEnv>;

export function fail(status: 400 | 401 | 403 | 404 | 413 | 415 | 429 | 503, code: string, message: string): never {
  throw new HTTPException(status, { res: Response.json({ error: { code, message } }, { status }) });
}
export function success<T>(c: ApiContext, data: T) {
  return c.json({ apiVersion: '1' as const, demo: c.get('demo'), data });
}
export function requireUser(c: ApiContext): UserIdentity {
  const identity = c.get('identity');
  if (!identity) fail(401, 'SIGN_IN_REQUIRED', 'Sign in to save your progress and manage your data.');
  return identity;
}
export async function body<T extends z.ZodTypeAny>(c: ApiContext, schema: T): Promise<z.infer<T>> {
  if (!c.req.header('Content-Type')?.toLowerCase().includes('application/json')) fail(415, 'JSON_REQUIRED', 'Send an application/json request.');
  let input: unknown;
  try { input = await c.req.json(); } catch { fail(400, 'INVALID_JSON', 'The request must contain valid JSON.'); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) fail(400, 'INVALID_INPUT', parsed.error.issues[0]?.message || 'Please check your answers.');
  return parsed.data;
}
export async function rateLimit(c: ApiContext, action: string, limit: number, windowMs = 60000) {
  const repo = c.get('repository');
  const identity = c.get('identity');
  const keys = [`ip:${c.get('ipHash')}:${action}`, ...(identity ? [`user:${identity.id}:${action}`] : [])];
  for (const key of keys) {
    const result = await repo.consumeRateLimit(key, limit, windowMs);
    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfter));
      fail(429, 'RATE_LIMITED', 'Please pause before trying again.');
    }
  }
}
