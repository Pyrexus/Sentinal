export type Severity = 'low' | 'medium' | 'high';
export type ContentSource = 'seed' | 'gemini';

export interface RadarItem {
  id: string;
  date: string;
  title: string;
  type: string;
  severity: Severity;
  howItWorks: string;
  targetAudience: string;
  redFlags: string[];
  staySafe: string[];
  sampleMessage: string;
  source: ContentSource;
  fictional: true;
  labScenarioId: string;
}

export interface LabHotspot {
  id: string;
  text: string;
  explanation: string;
  suspicious: boolean;
}

export interface LabScenario {
  id: string;
  title: string;
  channel: 'sms' | 'email' | 'whatsapp' | 'login' | 'upi';
  sender: string;
  subject?: string;
  message: string;
  difficulty: 1 | 2 | 3;
  correctVerdict: 'safe' | 'scam';
  hotspots: LabHotspot[];
  explanation: string;
  lessonSlug: string;
  source: ContentSource;
  fictional: true;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Lesson {
  slug: string;
  title: string;
  category: string;
  minutes: number;
  summary: string;
  content: string[];
  tryIt: Omit<QuizQuestion, 'question'> & { prompt: string };
  quiz: QuizQuestion[];
  checklist: string[];
}

export interface PrivacyQuestion {
  id: string;
  question: string;
  options: { label: string; risk: number }[];
  category: string;
  action: string;
}

export interface ProtectionCheck {
  id: string;
  title: string;
  description: string;
  url: string;
  weight: number;
}
