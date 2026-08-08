import type { ExerciseType } from '../plan/types';

export type ExecutedSet = {
  [key: string]: number | string | boolean | null | undefined;
  setNumber: number;
  weightKg: number | null;
  repetitions: number | null;
  rir: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  speedKmh: number | null;
  inclinePercent: number | null;
  averagePace: string | null;
  averageHeartRate: number | null;
  calories: number | null;
  notes: string | null;
  completed: boolean;
};

export type ExerciseExecution = {
  exerciseId: string;
  exerciseType: ExerciseType;
  selectedExerciseId?: string;
  selectedExerciseName?: string;
  sets: ExecutedSet[];
};

export type WorkoutExecution = {
  planId: string;
  workoutId: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  exercises: Record<string, ExerciseExecution>;
};
