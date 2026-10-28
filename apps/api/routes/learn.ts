import { Hono } from 'hono';
import { z } from 'zod';
import { lessons } from '../../../shared/content';
import { gradeQuiz } from '../domain/scoring';
import { body, fail, rateLimit, requireUser, success, type ApiEnv } from '../http';

const routes = new Hono<ApiEnv>();
routes.get('/learn', (c) => success(c, { lessons: lessons.map(({ slug, title, category, minutes, summary }) => ({ slug, title, category, minutes, summary })) }));
routes.get('/learn/:slug', (c) => {
  const lesson = lessons.find((item) => item.slug === c.req.param('slug'));
  if (!lesson) fail(404, 'LESSON_NOT_FOUND', 'That lesson could not be found.');
  return success(c, { ...lesson, quiz: lesson.quiz.map(({ question, options }) => ({ question, options })) });
});
routes.post('/learn/:slug/quiz', async (c) => {
  const user = requireUser(c);
  const lesson = lessons.find((item) => item.slug === c.req.param('slug'));
  if (!lesson) fail(404, 'LESSON_NOT_FOUND', 'That lesson could not be found.');
  const input = await body(c, z.object({ answers: z.array(z.number().int().min(0).max(3)).length(lesson.quiz.length) }).strict());
  if (input.answers.some((answer, index) => answer >= lesson.quiz[index].options.length)) fail(400, 'INVALID_ANSWER', 'Choose one of the listed answers.');
  await rateLimit(c, 'quiz', 20);
  const grade = gradeQuiz(lesson.quiz.map((item) => item.answerIndex), input.answers);
  const awarded = await c.get('repository').appendActivity(user.id, { key: `quiz:${lesson.slug}`, kind: 'quiz', title: `Completed ${lesson.title}`, description: `${grade.correct} of ${lesson.quiz.length} answers correct.`, xp: grade.xp, payload: { slug: lesson.slug, score: grade.score } });
  return success(c, { score: grade.score, correct: grade.correct, xpAwarded: awarded ? grade.xp : 0, results: lesson.quiz.map((item, index) => ({ correct: grade.results[index], answerIndex: item.answerIndex, explanation: item.explanation })) });
});
export default routes;
