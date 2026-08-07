export const TITAN_PLAN_SCHEMA_VERSION = 1 as const;

export type ExerciseType = 'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility';

export type TitanVideo = {
  provider: 'youtube';
  url: string;
  videoId: string;
  title?: string;
};

export type CardioProgressionStep = {
  startWeek: number;
  endWeek: number;
  durationSeconds?: number;
  speedKmh?: number;
  speedMinKmh?: number;
  speedMaxKmh?: number;
  inclinePercent?: number;
  cardioZone?: string;
  note?: string;
};

export type TitanExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  exerciseType: ExerciseType;
  sets?: number;
  minReps?: number;
  maxReps?: number;
  targetRir?: number;
  restSeconds?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  minDistanceMeters?: number;
  maxDistanceMeters?: number;
  speedKmh?: number;
  speedMinKmh?: number;
  speedMaxKmh?: number;
  inclinePercent?: number;
  averagePace?: string;
  averageHeartRate?: number;
  targetHeartRateMin?: number;
  targetHeartRateMax?: number;
  calories?: number;
  cardioZone?: string;
  notes?: string;
  progression?: CardioProgressionStep[];
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
  week?: number;
  phase?: string;
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
