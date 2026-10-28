import { describe, expect, it } from 'vitest';
import { activityStreak, calculatePrivacy, checklistScore, gradeLab, gradeQuiz } from './scoring';
import type { LabScenario } from '../../../shared/types';

const scenario: LabScenario = { id: 'test', title: 'Fictional test', channel: 'sms', sender: 'Campus Desk', message: 'Send OTP urgently', difficulty: 1, correctVerdict: 'scam', hotspots: [{ id: 'otp', text: 'OTP', suspicious: true, explanation: 'Private code' }, { id: 'greeting', text: 'Campus', suspicious: false, explanation: 'A greeting is not evidence' }], explanation: 'Never share codes.', lessonSlug: 'otp', source: 'seed', fictional: true };

describe('progress is tied to demonstrated and self-reported actions', () => {
  it('rewards correct verdicts and evidence, penalizing indiscriminate clicks', () => {
    expect(gradeLab(scenario, 'scam', ['otp']).score).toBe(100);
    expect(gradeLab(scenario, 'scam', ['otp', 'greeting']).score).toBe(60);
    expect(gradeLab(scenario, 'safe', []).score).toBe(0);
  });
  it('grades quizzes without accepting missing answers as correct', () => {
    expect(gradeQuiz([1, 0, 2], [1, 1, 2])).toMatchObject({ score: 67, xp: 20 });
    expect(gradeQuiz([1], [])).toMatchObject({ score: 0, xp: 0 });
  });
  it('does not invent streaks and handles the previous day', () => {
    expect(activityStreak([], new Date('2026-10-28'))).toBe(0);
    expect(activityStreak(['2026-10-27T02:00:00Z', '2026-10-26T03:00:00Z'], new Date('2026-10-28'))).toBe(2);
    expect(activityStreak(['2026-10-25T00:00:00Z'], new Date('2026-10-28'))).toBe(0);
  });
  it('calculates risk using the configured question scale', () => {
    const result = calculatePrivacy([{ id: 'q', question: '?', category: 'Privacy', action: 'Review visibility', options: [{ label: 'Private', risk: 0 }, { label: 'Public', risk: 3 }] }], { q: 1 });
    expect(result).toMatchObject({ exposure: 'High', score: 0 });
    expect(result.actions).toHaveLength(1);
  });
  it('weights security actions without credit for unknown ids', () => {
    expect(checklistScore({ unknown: true }, [{ id: 'mfa', title: 'MFA', description: '', url: '', weight: 5 }])).toBe(0);
  });
});
