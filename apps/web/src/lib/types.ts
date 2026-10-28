export type Severity = 'low' | 'medium' | 'high';
export interface Analysis {
  id?: string;
  riskScore: number;
  verdict: 'Low' | 'Medium' | 'High';
  category: string;
  redFlags: { text: string; reason: string; severity: Severity }[];
  explanation: string;
  nextSteps: string[];
  confidence: Severity;
  uncertainty: string;
  source: 'gemini' | 'heuristic';
  saved?: boolean;
  safeBrowsing?: { status: string; detail: string };
}
export interface RadarItem {
  id: string; date: string; title: string; type: string; severity: Severity;
  howItWorks: string; targetAudience: string; redFlags: string[];
  staySafe: string[]; sampleMessage: string; source: 'seed' | 'gemini';
  fictional: true; labScenarioId: string;
}
export interface Dashboard {
  score: number; subScores: { name: string; score: number }[];
  xp: number; level: number; streak: number; badges: string[];
  recommendation: string; trend: { date: string; score: number }[];
  activity: { id: string; title: string; description: string; createdAt: string }[];
  checklist?: Record<string, boolean>;
}
export interface LabScenario {
  id: string; title: string; channel: string; sender: string; subject?: string;
  message: string; difficulty: 1 | 2 | 3;
  hotspots: { id: string; text: string }[];
  source: 'seed' | 'gemini'; fictional: true;
}
export interface LabResult {
  correct: boolean; score: number; xpAwarded: number; explanation: string;
  hotspots: { id: string; text?: string; suspicious: boolean; explanation: string }[];
  progress?: { xp: number; level: number; streak: number };
}
export interface Lesson {
  slug: string; title: string; category: string; minutes: number; summary: string;
  content: string[];
  tryIt: { prompt: string; options: string[]; answerIndex?: number; explanation?: string };
  quiz: { question: string; options: string[]; answerIndex?: number; explanation?: string }[];
  checklist: string[];
}
export interface PublicConfig {
  demo: boolean;
  features?: { ai?: boolean; safeBrowsing?: boolean; encryptedSave?: boolean };
  firebase?: { apiKey: string; authDomain: string; projectId: string; appId: string };
}
