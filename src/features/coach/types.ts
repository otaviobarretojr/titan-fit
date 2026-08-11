import type { BodyEvolutionEntry } from '../evolution/types';
import type { HealthSample } from '../health/types';
import type { WorkoutHistoryRecord } from '../history/types';

export type CoachSeverity = 'positive' | 'attention' | 'neutral';
export type CoachConfidence = 'low' | 'medium' | 'high';
export type CoachPillar = 'training' | 'recovery' | 'evolution';

export type CoachInsight = {
  id: string;
  severity: CoachSeverity;
  title: string;
  message: string;
  pillar?: CoachPillar;
};

export type CoachScore = {
  total: number;
  training: number;
  recovery: number | null;
  evolution: number | null;
  dataConfidence: CoachConfidence;
};

export type CoachContext = {
  workouts: WorkoutHistoryRecord[];
  healthSamples?: HealthSample[];
  bodyEntries?: BodyEvolutionEntry[];
};

export type CoachReport = {
  score: CoachScore;
  priority: CoachInsight;
  insights: CoachInsight[];
  availablePillars: number;
  generatedAt: string;
};
