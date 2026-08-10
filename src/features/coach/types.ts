import type { BodyEvolutionEntry } from '../evolution/types';
import type { HealthSample } from '../health/types';
import type { WorkoutHistoryRecord } from '../history/types';
import type { NutritionMealExecution } from '../nutrition/execution';
import type { TitanNutritionPlan } from '../nutrition/types';

export type CoachSeverity = 'positive' | 'attention' | 'neutral';
export type CoachConfidence = 'low' | 'medium' | 'high';

export type CoachInsight = {
  id: string;
  severity: CoachSeverity;
  title: string;
  message: string;
  pillar?: 'training' | 'nutrition' | 'recovery' | 'evolution';
};

export type CoachScore = {
  total: number;
  training: number;
  nutrition: number | null;
  recovery: number | null;
  evolution: number | null;
  dataConfidence: CoachConfidence;
};

export type CoachContext = {
  workouts: WorkoutHistoryRecord[];
  nutritionPlan?: TitanNutritionPlan | null;
  nutritionExecutions?: NutritionMealExecution[];
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
