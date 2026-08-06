export type HistorySet = {
  setNumber: number;
  weightKg: number | null;
  repetitions: number | null;
  rir: number | null;
};

export type HistoryExercise = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: HistorySet[];
  volumeKg: number;
  bestWeightKg: number | null;
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
