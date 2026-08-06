export type ExecutedSet = {
  setNumber: number;
  weightKg: number | null;
  repetitions: number | null;
  rir: number | null;
  completed: boolean;
};

export type ExerciseExecution = {
  exerciseId: string;
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
