import { Hono } from 'hono';

const app = new Hono();
app.get('/api/health', (c) => c.json({ apiVersion: '1', demo: true, data: { status: 'ok', service: 'Sentinel' } }));
export default app;
