import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { resolveIdentity } from './core/auth';
import { hashIp, sha256 } from './core/crypto';
import { createRepository } from './core/repository';
import { isDemoMode } from './core/types';
import { fail, rateLimit, success, type ApiEnv, type Bindings } from './http';
import analyze from './routes/analyze';
import radar, { runDailyRadar } from './routes/radar';
import lab from './routes/lab';
import learn from './routes/learn';
import audits from './routes/audits';
import me from './routes/me';

export const app = new Hono<ApiEnv>();
const publicPaths = new Set(['/api/health', '/api/radar', '/api/learn']);
// A temporary random demo salt is configuration, never request content or identity.
let demoHashSalt = '';
const firebaseConfigSchema = z.object({ apiKey: z.string(), authDomain: z.string(), projectId: z.string(), appId: z.string(), storageBucket: z.string().optional(), messagingSenderId: z.string().optional(), measurementId: z.string().optional() }).strict();

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  c.header('X-Frame-Options', 'DENY');
  let authDomain = '';
  try { const configured = firebaseConfigSchema.parse(JSON.parse(c.env.FIREBASE_WEB_CONFIG || '{}')); if (/^[a-z0-9.-]+\.firebaseapp\.com$/.test(configured.authDomain)) authDomain = `https://${configured.authDomain}`; } catch { /* Demo uses no external identity frame. */ }
  c.header('Content-Security-Policy', `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://lh3.googleusercontent.com; font-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://apis.google.com ${authDomain}; frame-src https://accounts.google.com ${authDomain}; upgrade-insecure-requests`);
  await next();
});
app.use('/api/*', bodyLimit({ maxSize: 18000, onError: (c) => c.json({ error: { code: 'BODY_TOO_LARGE', message: 'This request is too large.' } }, 413) }));
app.use('/api/*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  const url = new URL(c.req.url);
  const origin = c.req.header('Origin');
  const allowed = new Set([url.origin, c.env.ALLOWED_ORIGIN].filter(Boolean));
  if (['localhost', '127.0.0.1'].includes(url.hostname)) { allowed.add('http://localhost:5173'); allowed.add('http://127.0.0.1:5173'); }
  if (origin && !allowed.has(origin)) fail(403, 'ORIGIN_NOT_ALLOWED', 'This browser origin is not allowed.');
  if (origin) { c.header('Access-Control-Allow-Origin', origin); c.header('Access-Control-Allow-Credentials', 'true'); c.header('Vary', 'Origin'); }
  if (c.req.method === 'OPTIONS') { c.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS'); c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Admin-Secret'); return c.body(null, 204); }
  const demo = isDemoMode(c.env);
  c.set('demo', demo);
  c.set('identity', null);
  if (!demo && (!c.env.IP_HASH_SALT || c.env.IP_HASH_SALT.length < 16)) fail(503, 'CONFIGURATION_REQUIRED', 'The service administrator must configure secure rate limiting.');
  if (!demoHashSalt && demo) demoHashSalt = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  c.set('ipHash', await hashIp(c.req.header('CF-Connecting-IP') || 'local-development', c.env.IP_HASH_SALT || demoHashSalt));
  const repo = createRepository(c.env);
  c.set('repository', repo);
  try {
    const publicRead = c.req.method === 'GET' && (publicPaths.has(c.req.path) || c.req.path.startsWith('/api/learn/'));
    if (!publicRead) {
      if (demo) {
        let token = getCookie(c, 'sentinel_demo');
        if (!token || !/^[a-f0-9]{64}$/.test(token)) {
          token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');
          setCookie(c, 'sentinel_demo', token, { httpOnly: true, secure: url.protocol === 'https:', sameSite: 'Strict', path: '/', maxAge: 86400 });
        }
        c.set('identity', { id: `demo_${await sha256(token)}`, displayName: 'Demo explorer', demo: true });
      } else {
        try { c.set('identity', await resolveIdentity(c.req.raw, c.env)); } catch { fail(401, 'INVALID_TOKEN', 'Your sign-in has expired. Please sign in again.'); }
      }
      const identity = c.get('identity');
      if (identity) await repo.ensureUser(identity);
    }
    await rateLimit(c, 'api', 180);
    await next();
  } finally { await repo.close(); }
});
app.get('/api/health', (c) => success(c, { status: 'ok', service: 'Sentinel', storage: c.get('demo') ? 'temporary-memory' : 'postgres' }));
app.get('/api/config', (c) => {
  let firebase: z.infer<typeof firebaseConfigSchema> | null = null;
  if (!c.get('demo')) { try { firebase = firebaseConfigSchema.parse(JSON.parse(c.env.FIREBASE_WEB_CONFIG || '{}')); } catch { /* Configuration remains visibly unavailable. */ } }
  return success(c, { demo: c.get('demo'), firebase, features: { ai: Boolean(c.env.GEMINI_API_KEY), safeBrowsing: Boolean(c.env.SAFE_BROWSING_API_KEY), encryptedSave: Boolean(c.env.DATA_ENCRYPTION_KEY) } });
});
app.route('/api', analyze);
app.route('/api', radar);
app.route('/api', lab);
app.route('/api', learn);
app.route('/api', audits);
app.route('/api', me);
app.all('/api/*', (c) => c.json({ error: { code: 'NOT_FOUND', message: 'This API endpoint does not exist.' } }, 404));
app.all('*', async (c) => c.env.ASSETS ? c.env.ASSETS.fetch(c.req.raw) : c.text('Sentinel frontend is not built yet. Run npm run build.', 503));
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    const response = error.getResponse();
    return c.newResponse(response.body, error.status, Object.fromEntries(response.headers));
  }
  console.error(JSON.stringify({ event: 'request_failed', path: c.req.path, kind: error instanceof z.ZodError ? 'validation' : 'internal' }));
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again shortly.' } }, 500);
});
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(runDailyRadar(env).catch(() => { console.error(JSON.stringify({ event: 'radar_generation_failed' })); }));
  },
};
