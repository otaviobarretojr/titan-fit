export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core';

export type ExerciseCategory = 'compound' | 'isolation';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'smith'
  | 'bodyweight';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ExercisePriority = 'primary' | 'secondary' | 'maintenance';

export type ExerciseMetrics = {
  stability: 1 | 2 | 3 | 4 | 5;
  progressionEase: 1 | 2 | 3 | 4 | 5;
  systemicFatigue: 1 | 2 | 3 | 4 | 5;
  safety: 1 | 2 | 3 | 4 | 5;
  learningCurve: 1 | 2 | 3 | 4 | 5;
};

export type ExerciseDefinition = {
  id: string;
  code: string;
  slug: string;
  name: string;
  muscleGroup: MuscleGroup;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: ExerciseCategory;
  equipment: Equipment[];
  difficulty: Difficulty;
  priority: ExercisePriority;
  tags: string[];
  youtubeId?: string;
  technique: string[];
  commonMistakes: string[];
  alternativeExerciseCodes: string[];
  metrics: ExerciseMetrics;
};

export type ExercisePrescription = {
  exerciseCode: string;
  sets: number;
  minReps?: number;
  maxReps?: number;
  durationSeconds?: number;
  targetRir: number;
  restSeconds: number;
  cadence?: string;
  progressionRule?: string;
};

export type ExerciseSetExecution = {
  setNumber: number;
  weightKg?: number;
  repetitions?: number;
  durationSeconds?: number;
  rir?: number;
  completedAt?: string;
};

export type ExerciseExecution = {
  id: string;
  exerciseCode: string;
  workoutSessionId: string;
  performedAt: string;
  sets: ExerciseSetExecution[];
  notes?: string;
};

export interface ExerciseRepository {
  findAll(): ExerciseDefinition[];
  findByCode(code: string): ExerciseDefinition | undefined;
  findBySlug(slug: string): ExerciseDefinition | undefined;
  findByMuscleGroup(group: MuscleGroup): ExerciseDefinition[];
  findByEquipment(equipment: Equipment): ExerciseDefinition[];
  findAlternatives(code: string): ExerciseDefinition[];
  search(query: string): ExerciseDefinition[];
}
