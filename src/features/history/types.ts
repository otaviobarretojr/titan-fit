import type { ExerciseType } from '../plan/types';

export type HistorySet = {
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
};

export type HistoryExercise = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  exerciseType: ExerciseType;
  sets: HistorySet[];
  volumeKg: number;
  bestWeightKg: number | null;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  bestSpeedKmh: number | null;
  bestInclinePercent: number | null;
  averageHeartRate: number | null;
};

export type WorkoutHistoryRecord = {
  id: string;
  planId: string;
  planName: string;
  workoutId: string;
  workoutTitle: string;
  workoutDay: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  totalSets: number;
  totalVolumeKg: number;
  exercises: HistoryExercise[];
};
