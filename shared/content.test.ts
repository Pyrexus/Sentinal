import { describe, expect, it } from 'vitest';
import { labScenarios, lessons, privacyQuestions, protectionChecks, radarSeeds } from './content';

describe('fictional teaching corpus', () => {
  it('provides complete, distinct fallback banks', () => {
    expect(radarSeeds).toHaveLength(10);
    expect(labScenarios).toHaveLength(20);
    expect(lessons).toHaveLength(12);
    expect(privacyQuestions).toHaveLength(12);
    for (const ids of [radarSeeds.map((item) => item.id), labScenarios.map((item) => item.id), lessons.map((item) => item.slug), privacyQuestions.map((item) => item.id), protectionChecks.map((item) => item.id)]) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('keeps every actionable sample domain reserved for examples', () => {
    const messages = [...radarSeeds.map((item) => item.sampleMessage), ...labScenarios.map((item) => item.message)];
    for (const message of messages) {
      const domains = message.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi) ?? [];
      for (const domain of domains) expect(new URL(`https://${domain}`).hostname.endsWith('.example')).toBe(true);
      expect(message).not.toMatch(/\b[6-9]\d{9}\b/);
    }
    expect([...radarSeeds, ...labScenarios].every((item) => item.fictional && item.source === 'seed')).toBe(true);
  });

  it('grades phrases that exist in the actual message and links to real lessons', () => {
    for (const scenario of labScenarios) {
      expect(lessons.some((lesson) => lesson.slug === scenario.lessonSlug)).toBe(true);
      expect(scenario.hotspots.length).toBeGreaterThan(0);
      for (const hotspot of scenario.hotspots) expect(scenario.message).toContain(hotspot.text);
      expect(scenario.hotspots.some((hotspot) => hotspot.suspicious)).toBe(scenario.correctVerdict === 'scam');
    }
    for (const item of radarSeeds) expect(labScenarios.some((scenario) => scenario.id === item.labScenarioId)).toBe(true);
  });

  it('has usable answer keys and balanced audit weights', () => {
    for (const lesson of lessons) {
      expect(lesson.quiz).toHaveLength(3);
      for (const quiz of [lesson.tryIt, ...lesson.quiz]) {
        expect(quiz.options.length).toBeGreaterThanOrEqual(3);
        expect(quiz.answerIndex).toBeGreaterThanOrEqual(0);
        expect(quiz.answerIndex).toBeLessThan(quiz.options.length);
        expect(quiz.explanation.length).toBeGreaterThan(20);
      }
    }
    expect(protectionChecks.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    for (const check of protectionChecks) expect(new URL(check.url).hostname).toMatch(/^(myaccount|passwords)\.google\.com$/);
    for (const question of privacyQuestions) expect(question.options.map((option) => option.risk)).toEqual([0, 1, 2]);
  });
});
