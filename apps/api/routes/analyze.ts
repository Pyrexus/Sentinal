import { Hono } from 'hono';
import { analyzeContent } from '../ai/service';
import { heuristicAnalyze } from '../ai/heuristics';
import { safeBrowsingSignal } from '../ai/safe-browsing';
import { PROMPT_VERSION } from '../ai/prompts';
import { analysisInputSchema, type AnalysisResult } from '../ai/schemas';
import { encryptText, sha256 } from '../core/crypto';
import { body, fail, rateLimit, requireUser, success, type ApiEnv } from '../http';

const routes = new Hono<ApiEnv>();

// Persist assessment metadata without retaining quoted message fragments or free-form model prose.
function storedAssessment(result: AnalysisResult): AnalysisResult {
  return { ...result, category: 'Message risk assessment', redFlags: [], explanation: 'Message content and quoted evidence are not retained in this record.', nextSteps: ['Verify requests through an official app or a trusted contact channel.'], uncertainty: 'An automated check can miss threats or flag legitimate messages.' };
}

routes.post('/analyze', async (c) => {
  const input = await body(c, analysisInputSchema);
  await rateLimit(c, 'analyze', c.get('identity') ? 10 : 4);
  if (input.save && !c.env.DATA_ENCRYPTION_KEY) fail(503, 'ENCRYPTION_UNAVAILABLE', 'Saving message text is unavailable until encrypted storage is configured. You can still check it without saving.');
  const owner = input.save ? requireUser(c) : c.get('identity');
  const hash = await sha256(`${PROMPT_VERSION}\u0000${input.type}\u0000${input.content}`);
  const repo = c.get('repository');
  const cached = await repo.getCachedAnalysis(hash);
  let result: AnalysisResult;
  if (cached && (!c.env.GEMINI_API_KEY || cached.source === 'gemini')) {
    const basic = heuristicAnalyze(input.content);
    const riskScore = Math.max(cached.riskScore, basic.riskScore >= 65 ? basic.riskScore : 0);
    result = { ...cached, cached: true, riskScore, verdict: riskScore >= 65 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low',
      redFlags: basic.redFlags, category: basic.redFlags.length ? basic.category : 'Cached risk assessment',
      explanation: `This score uses an assessment from the past 24 hours. Highlighted evidence comes from a fresh basic pattern check; message text was not retained. ${basic.explanation}`,
      nextSteps: basic.nextSteps, uncertainty: `I can’t be certain. Cached scores can miss threats or flag legitimate messages. ${basic.uncertainty}`,
      safeBrowsing: await safeBrowsingSignal(input.content, c.env.SAFE_BROWSING_API_KEY) };
  } else {
    // A database-backed short lease prevents concurrent copies from making duplicate paid requests.
    const lease = c.env.GEMINI_API_KEY ? await repo.consumeRateLimit(`generation:${hash}`, 1, 30000) : { allowed: true };
    if (lease.allowed) result = await analyzeContent(c.env, input);
    else {
      result = heuristicAnalyze(input.content);
      result.uncertainty = 'I can’t be certain. Another assessment of this text is in progress; this result is a fresh basic check.';
      result.safeBrowsing = await safeBrowsingSignal(input.content, c.env.SAFE_BROWSING_API_KEY);
    }
    result.assessedAt = new Date().toISOString();
    result.cached = false;
  }
  const encryptedContent = input.save ? await encryptText(input.content, c.env.DATA_ENCRYPTION_KEY!, c.env.DATA_ENCRYPTION_KEY_VERSION || 'v1') : undefined;
  await repo.saveAnalysis({ id: crypto.randomUUID(), userId: owner?.id || null, inputHash: hash, result: storedAssessment(result), encryptedContent, createdAt: new Date().toISOString() });
  if (owner) await repo.appendActivity(owner.id, { key: `analysis:${hash}`, kind: 'analysis', title: 'Checked a message', description: `${result.verdict} risk signals. Message text is not shown in your activity.`, xp: 0 });
  return success(c, result);
});

export default routes;
