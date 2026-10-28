const base = (process.env.SMOKE_URL || process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');
const cases = [
  ['/api/health', {}],
  ['/api/radar', {}],
  ['/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'text', content: 'Bharat Trust Bank sample: share your OTP urgently at bt-bank-kyc.example' }) }],
];
for (const [path, init] of cases) {
  const response = await fetch(base + path, { ...init, signal: AbortSignal.timeout(35000) });
  const body = await response.json();
  if (!response.ok || body.apiVersion !== '1' || !body.data) throw new Error(`${path}: unexpected response (${response.status})`);
  if (path.endsWith('/radar') && !body.data.items?.length) throw new Error('Radar is empty');
  if (path.endsWith('/analyze') && body.data.riskScore < 50) throw new Error('Obvious fictional OTP sample was not flagged');
  console.log(`PASS ${path} (${body.demo ? 'demo' : 'live'} mode)`);
}
