import { Hono } from 'hono';
import { analyzeContent } from '../ai/service';
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
  const hash = await sha256(`${input.type}\u0000${input.content}`);
  const result = await analyzeContent(c.env, input);
  const encryptedContent = input.save ? await encryptText(input.content, c.env.DATA_ENCRYPTION_KEY!, c.env.DATA_ENCRYPTION_KEY_VERSION || 'v1') : undefined;
  const repo = c.get('repository');
  await repo.saveAnalysis({ id: crypto.randomUUID(), userId: owner?.id || null, inputHash: hash, result: storedAssessment(result), encryptedContent, createdAt: new Date().toISOString() });
  if (owner) await repo.appendActivity(owner.id, { key: `analysis:${hash}`, kind: 'analysis', title: 'Checked a message', description: `${result.verdict} risk signals. Message text is not shown in your activity.`, xp: 0 });
  return success(c, result);
});

export default routes;
