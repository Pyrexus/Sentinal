import type { LabScenario, PrivacyQuestion, ProtectionCheck } from '../../../shared/types';

export function gradeLab(scenario: LabScenario, verdict: 'safe' | 'scam', selected: string[]) {
  const correct = verdict === scenario.correctVerdict;
  const flagged = new Set(selected);
  const suspicious = scenario.hotspots.filter((item) => item.suspicious);
  const hits = suspicious.filter((item) => flagged.has(item.id)).length;
  const falsePositives = scenario.hotspots.filter((item) => !item.suspicious && flagged.has(item.id)).length;
  const elementScore = suspicious.length ? Math.max(0, (hits - falsePositives) / suspicious.length) : Number(flagged.size === 0);
  const score = Math.round((correct ? 60 : 0) + elementScore * 40);
  return { correct, score, xp: Math.round(score / 4) };
}

export function gradeQuiz(answerIndices: number[], submitted: number[]) {
  const results = answerIndices.map((answer, index) => answer === submitted[index]);
  const correct = results.filter(Boolean).length;
  return { results, correct, score: Math.round((correct / Math.max(answerIndices.length, 1)) * 100), xp: correct * 10 };
}

export function calculatePrivacy(questions: PrivacyQuestion[], answers: Record<string, number>) {
  const risks = questions.map((question) => ({ question, risk: question.options[answers[question.id]]?.risk ?? 100 }));
  const maxRisk = questions.reduce((sum, question) => sum + Math.max(...question.options.map((option) => option.risk)), 0);
  const exposureScore = Math.round((risks.reduce((sum, item) => sum + item.risk, 0) / Math.max(maxRisk, 1)) * 100);
  const exposure = exposureScore >= 65 ? 'High' : exposureScore >= 30 ? 'Medium' : 'Low';
  const actions = risks.filter((item) => item.risk > 0).sort((a, b) => b.risk - a.risk).map(({ question, risk }) => ({
    title: question.action,
    priority: risk >= Math.max(...question.options.map((option) => option.risk)) ? 'high' as const : 'medium' as const,
  }));
  return {
    score: 100 - exposureScore,
    exposure,
    summary: actions.length ? `Your answers suggest ${exposure.toLowerCase()} exposure. Start with the first action below and repeat this check after making changes.` : 'Your answers describe careful privacy habits. Keep reviewing permissions and recovery options regularly.',
    actions,
  };
}

export function checklistScore(checks: Record<string, boolean>, definitions: ProtectionCheck[]) {
  const total = definitions.reduce((sum, check) => sum + check.weight, 0);
  return Math.round((definitions.reduce((sum, check) => sum + (checks[check.id] ? check.weight : 0), 0) / Math.max(total, 1)) * 100);
}

export function activityStreak(dates: string[], now = new Date()) {
  const days = new Set(dates.map((value) => value.slice(0, 10)));
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
