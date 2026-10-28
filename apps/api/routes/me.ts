import { Hono } from 'hono';
import { deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { lessons, protectionChecks } from '../../../shared/content';
import { activityStreak, checklistScore } from '../domain/scoring';
import { body, rateLimit, requireUser, success, type ApiEnv } from '../http';

const routes = new Hono<ApiEnv>();
routes.get('/me/dashboard', async (c) => {
  const user = requireUser(c);
  const repo = c.get('repository');
  const [state, allEvents] = await Promise.all([repo.getState(user.id), repo.timeline(user.id)]);
  const events = allEvents.filter((event) => event.kind !== 'lab_assignment');
  const xp = events.reduce((sum, event) => sum + event.xp, 0);
  const labs = events.filter((event) => event.kind === 'lab');
  const quizzes = events.filter((event) => event.kind === 'quiz');
  const awareness = labs.length ? Math.round(labs.reduce((sum, event) => sum + Number(event.payload.score || 0), 0) / labs.length) : 0;
  const privacyScore = typeof state.privacy?.score === 'number' ? state.privacy.score : 0;
  const account = checklistScore(state.checklist, protectionChecks);
  const learned = new Set(quizzes.map((event) => String(event.payload.slug)));
  const deviceLessons = lessons.filter((lesson) => /app|wifi|wi-fi|device|password|passkey/i.test(`${lesson.slug} ${lesson.title}`));
  const device = Math.round(deviceLessons.filter((lesson) => learned.has(lesson.slug)).length / Math.max(deviceLessons.length, 1) * 100);
  const habits = Math.round(quizzes.length / Math.max(lessons.length, 1) * 100);
  const subScores = [{ name: 'Account Security', score: account }, { name: 'Privacy', score: privacyScore }, { name: 'Scam Awareness', score: awareness }, { name: 'Device Safety', score: device }, { name: 'Online Habits', score: habits }];
  const score = Math.round(subScores.reduce((sum, part) => sum + part.score, 0) / subScores.length);
  const badges = [...(labs.length ? ['First responder'] : []), ...(quizzes.length >= 3 ? ['Curious learner'] : []), ...(account === 100 ? ['Account guardian'] : []), ...(activityStreak(events.filter((event) => event.kind !== 'snapshot').map((event) => event.createdAt)) >= 3 ? ['Three-day streak'] : [])];
  const recommendation = account < 50 ? 'Start with your Account Security checklist. Turn on 2-step verification and review recovery options.' : !labs.length ? 'Try a Phishing Lab round to practise spotting pressure, payment requests, and suspicious links.' : !state.privacy ? 'Take the Privacy Check to choose your next practical action.' : 'Keep practising and revisit your account and privacy settings regularly.';
  const date = new Date().toISOString().slice(0, 10);
  if (events.length) await repo.appendActivity(user.id, { key: `snapshot:${date}`, kind: 'snapshot', title: 'Daily progress snapshot', description: '', xp: 0, payload: { score } });
  const snapshots = events.filter((event) => event.kind === 'snapshot').map((event) => ({ date: event.createdAt.slice(0, 10), score: Number(event.payload.score || 0) })).filter((entry) => entry.date !== date);
  return success(c, { score, subScores, xp, level: Math.floor(xp / 100) + 1, streak: activityStreak(events.filter((event) => event.kind !== 'snapshot').map((event) => event.createdAt)), badges, recommendation, trend: [...snapshots.reverse().slice(-13), ...(events.length ? [{ date, score }] : [])], activity: events.filter((event) => event.kind !== 'snapshot').slice(0, 12).map(({ id, title, description, createdAt }) => ({ id, title, description, createdAt })), checklist: state.checklist, privacy: state.privacy, scoreExplanation: 'A learning and self-reported habits score, not a scan or certification of device safety.' });
});
routes.get('/me/timeline', async (c) => {
  const user = requireUser(c);
  const events = await c.get('repository').timeline(user.id);
  return success(c, { activity: events.filter((event) => !['lab_assignment', 'snapshot'].includes(event.kind)).map(({ id, title, description, createdAt, xp }) => ({ id, title, description, createdAt, xp })) });
});
routes.get('/me/export', async (c) => {
  const user = requireUser(c);
  await rateLimit(c, 'export', 5);
  const data = await c.get('repository').exportUser(user.id);
  if (Array.isArray(data.activities)) data.activities = data.activities.filter((event: { kind?: string }) => event.kind !== 'lab_assignment');
  c.header('Content-Disposition', 'attachment; filename="sentinel-data.json"');
  return success(c, { exportedAt: new Date().toISOString(), ...data });
});
routes.delete('/me', async (c) => {
  const user = requireUser(c);
  await body(c, z.object({ confirm: z.literal(true) }).strict());
  await rateLimit(c, 'delete', 3);
  await c.get('repository').deleteUser(user.id);
  deleteCookie(c, 'sentinel_demo', { path: '/' });
  return success(c, { deleted: true, message: 'Your Sentinel data was deleted. Your Google/Firebase sign-in account is managed separately.' });
});
export default routes;
