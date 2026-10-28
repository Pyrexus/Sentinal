import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = (process.env.SMOKE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const directory = new URL('../docs/screenshots/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark', reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const captures = [];
async function open(path) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (await page.locator('.error-state').count()) throw new Error(`Visible error on ${path}`);
}
async function capture(name) {
  const file = `${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(file, directory)), fullPage: true, animations: 'disabled' });
  captures.push(file);
}
try {
  await open('/');
  await capture('01-dashboard-desktop');
  await open('/analyze');
  await page.getByRole('button', { name: 'Urgent KYC request' }).click();
  await page.getByRole('button', { name: 'Analyze message', exact: false }).click();
  await page.locator('.analysis-results').waitFor();
  await capture('02-analyzer-result');
  await page.getByRole('button', { name: /Why is this suspicious/ }).click();
  await page.getByRole('button', { name: /Open the official app or website independently/ }).click();
  await page.getByText('That’s it. A trusted route gives you control.', { exact: false }).waitFor();
  await open('/radar');
  await capture('03-scam-radar');
  await open('/lab');
  await page.locator('.scenario-card').waitFor();
  await page.locator('.hotspot').first().click();
  await capture('04-phishing-lab');
  await page.getByRole('button', { name: /Looks like a scam/ }).click();
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.locator('.lab-results').waitFor();
  await open('/privacy');
  for (let index = 0; index < 12; index++) {
    const currentQuestion = await page.getByRole('radio').first().getAttribute('name');
    await page.getByRole('radio').first().check();
    if (index < 11) {
      await page.getByRole('button', { name: 'Continue', exact: false }).click();
      await page.locator(`input[type="radio"][name="${currentQuestion}"]`).first().waitFor({ state: 'detached' });
    }
  }
  await page.getByRole('button', { name: 'See my privacy plan', exact: false }).click();
  await page.locator('.audit-result').waitFor();
  await capture('05-privacy-plan');
  await open('/protect');
  await capture('06-account-protection');
  await open('/learn');
  await capture('07-learn-hub');
  await open('/learn/phishing');
  for (const fieldset of await page.locator('.quiz-question').all()) await fieldset.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Check my answers' }).click();
  await page.locator('.quiz-result').waitFor();
  await open('/settings');
  await capture('08-data-settings');
  await page.keyboard.press('Control+k');
  await page.getByRole('dialog').waitFor();
  await page.getByRole('textbox', { name: 'Search pages' }).fill('privacy');
  await page.getByRole('dialog').getByRole('button', { name: /Privacy Check/ }).click();
  await page.waitForURL('**/privacy');
  await page.setViewportSize({ width: 390, height: 844 });
  await open('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  if (overflow) throw new Error('Dashboard overflows the mobile viewport');
  await capture('09-dashboard-mobile');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await capture('10-dashboard-mobile-light');
  if (errors.length) throw new Error(`Browser errors: ${[...new Set(errors)].join('; ')}`);
  await writeFile(new URL('verification.json', directory), JSON.stringify({ capturedAt: new Date().toISOString(), mode: 'demo', base, viewport: { desktop: '1440×1000', mobile: '390×844' }, captures, checks: ['Analyzer result and micro-lesson', 'Lab submission', 'Twelve-question privacy plan', 'Navigation command palette', 'Mobile overflow', 'Theme toggle', 'No browser console/page errors'] }, null, 2));
  console.log(`PASS browser interaction checks; saved ${captures.length} screenshots.`);
} finally { await browser.close(); }
