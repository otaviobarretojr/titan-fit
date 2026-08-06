export const TITAN_PLAN_SCHEMA_VERSION = 1 as const;

export type TitanVideo = {
  provider: 'youtube';
  url: string;
  videoId: string;
  title?: string;
};

export type TitanExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  minReps?: number;
  maxReps?: number;
  durationSeconds?: number;
  targetRir?: number;
  restSeconds: number;
  technique?: string;
  commonMistakes?: string[];
  alternatives?: string[];
  video?: TitanVideo;
};

export type TitanWorkoutDay = {
  id: string;
  day: string;
  title: string;
  focus?: string;
  exercises: TitanExercise[];
};

export type TitanCardioSession = {
  id: string;
  day: string;
  startTime: string;
  title: string;
  type: 'walk' | 'zone2' | 'run-walk' | 'run' | 'hiit' | 'bike' | 'stairs' | 'other';
  durationMinutes: number;
  goal?: string;
  instructions?: string[];
};

export type TitanProject = {
  name: string;
  objective: string;
  startDate?: string;
  durationWeeks?: number;
  strengthStartTime?: string;
  cardioGoal?: string;
  cardioSchedule?: TitanCardioSession[];
};

export type TitanPlan = {
  schemaVersion: typeof TITAN_PLAN_SCHEMA_VERSION;
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  author?: string;
  project?: TitanProject;
  workouts: TitanWorkoutDay[];
};

export type PlanValidationResult =
  | { ok: true; plan: TitanPlan; warnings: string[] }
  | { ok: false; errors: string[] };
