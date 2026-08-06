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

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ExercisePriority = 'priority' | 'secondary' | 'maintenance';

export type ExerciseProfile = {
  stability: 1 | 2 | 3 | 4 | 5;
  progressionEase: 1 | 2 | 3 | 4 | 5;
  systemicFatigue: 1 | 2 | 3 | 4 | 5;
  learningCurve: 1 | 2 | 3 | 4 | 5;
};

export type ExerciseDefinition = {
  id: string;
  slug: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  category: ExerciseCategory;
  equipment: Equipment[];
  difficulty: ExerciseDifficulty;
  priority: ExercisePriority;
  tags: string[];
  instructions: string[];
  commonMistakes: string[];
  alternatives: string[];
  youtubeId?: string;
  profile: ExerciseProfile;
};

export type ExercisePrescription = {
  exerciseId: string;
  sets: number;
  minReps?: number;
  maxReps?: number;
  targetRir: number;
  restSeconds: number;
  cadence?: string;
  notes?: string;
};

export type ExerciseSetExecution = {
  setNumber: number;
  loadKg?: number;
  reps?: number;
  rir?: number;
  completed: boolean;
};

export type ExerciseExecution = {
  id: string;
  exerciseId: string;
  workoutSessionId: string;
  performedAt: string;
  sets: ExerciseSetExecution[];
  notes?: string;
};
