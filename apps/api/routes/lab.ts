import { Hono } from 'hono';
import { z } from 'zod';
import { labScenarios, radarSeeds } from '../../../shared/content';
import type { LabScenario, RadarItem } from '../../../shared/types';
import { generateLab } from '../ai/service';
import { gradeLab } from '../domain/scoring';
import { body, fail, rateLimit, requireUser, success, type ApiEnv } from '../http';

const routes = new Hono<ApiEnv>();
const scenarioSchema = z.object({ id: z.string(), title: z.string(), channel: z.enum(['sms', 'email', 'whatsapp', 'login', 'upi']), sender: z.string(), subject: z.string().optional(), message: z.string(), difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]), correctVerdict: z.enum(['safe', 'scam']), hotspots: z.array(z.object({ id: z.string(), text: z.string(), explanation: z.string(), suspicious: z.boolean() })), explanation: z.string(), lessonSlug: z.string(), source: z.enum(['seed', 'gemini']), fictional: z.literal(true) });

function radarScenario(item: RadarItem): LabScenario {
  const known = labScenarios.find((scenario) => scenario.id === item.labScenarioId);
  if (known) return known;
  const quotes = item.redFlags.filter((flag) => item.sampleMessage.includes(flag));
  return { id: item.id, title: item.title, channel: 'sms', sender: 'Fictional practice sender', message: item.sampleMessage, difficulty: 2, correctVerdict: 'scam', hotspots: quotes.length ? quotes.map((text, index) => ({ id: `clue-${index}`, text, explanation: item.redFlags[index], suspicious: true })) : [{ id: 'sample', text: item.sampleMessage, explanation: item.howItWorks, suspicious: true }], explanation: item.howItWorks, lessonSlug: 'phishing', source: item.source, fictional: true };
}

routes.get('/lab/next', async (c) => {
  const user = requireUser(c);
  const parsed = z.object({ radarId: z.string().max(100).optional() }).strict().safeParse(c.req.query());
  if (!parsed.success) fail(400, 'INVALID_QUERY', 'Choose a valid practice round.');
  await rateLimit(c, 'lab-next', 12);
  const repo = c.get('repository');
  const history = await repo.timeline(user.id);
  const attempts = history.filter((event) => event.kind === 'lab');
  const average = attempts.slice(0, 5).reduce((sum, event) => sum + Number(event.payload.score || 0), 0) / Math.max(attempts.slice(0, 5).length, 1);
  const difficulty = attempts.length < 2 || average < 60 ? 1 : average < 85 ? 2 : 3;
  let scenario: LabScenario;
  if (parsed.data.radarId) {
    const item = [...await repo.getRadar(), ...radarSeeds].find((entry) => entry.id === parsed.data.radarId);
    if (!item) fail(404, 'ROUND_NOT_FOUND', 'That awareness sample is no longer available.');
    scenario = radarScenario(item);
  } else {
    scenario = await generateLab(c.env, difficulty, attempts.length);
  }
  const roundId = crypto.randomUUID();
  await repo.appendActivity(user.id, { key: `assignment:${roundId}`, kind: 'lab_assignment', title: 'Practice round', description: '', xp: 0, payload: { scenario, roundId } });
  return success(c, { ...scenario, id: roundId, correctVerdict: undefined, explanation: undefined, hotspots: scenario.hotspots.map(({ id, text }) => ({ id, text })) });
});
routes.post('/lab/submit', async (c) => {
  const user = requireUser(c);
  const input = await body(c, z.object({ scenarioId: z.string().uuid(), verdict: z.enum(['safe', 'scam']), selectedHotspots: z.array(z.string().max(100)).max(20) }).strict());
  await rateLimit(c, 'lab-submit', 20);
  const repo = c.get('repository');
  const assignment = (await repo.timeline(user.id)).find((event) => event.key === `assignment:${input.scenarioId}`);
  if (!assignment || Date.parse(assignment.createdAt) < Date.now() - 3600000) fail(404, 'ROUND_EXPIRED', 'Start a fresh practice round before submitting.');
  const scenario = scenarioSchema.parse(assignment.payload.scenario);
  if (new Set(input.selectedHotspots).size !== input.selectedHotspots.length || input.selectedHotspots.some((id) => !scenario.hotspots.some((hotspot) => hotspot.id === id))) fail(400, 'INVALID_HOTSPOTS', 'Choose only the highlighted parts of this round.');
  const grade = gradeLab(scenario, input.verdict, input.selectedHotspots);
  const awarded = await repo.appendActivity(user.id, { key: `lab:${scenario.id}`, kind: 'lab', title: 'Completed a practice round', description: `${grade.score}% on ${scenario.title}`, xp: grade.xp, payload: { scenarioId: scenario.id, score: grade.score, correct: grade.correct } });
  return success(c, { correct: grade.correct, score: grade.score, xpAwarded: awarded ? grade.xp : 0, explanation: scenario.explanation, correctVerdict: scenario.correctVerdict, hotspots: scenario.hotspots, progress: { difficulty: scenario.difficulty }, lessonSlug: scenario.lessonSlug });
});
export default routes;
