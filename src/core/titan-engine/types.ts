export type TitanEngineStrategy = 'adherence' | 'balanced' | 'availability';
export type TitanEngineExperience = 'beginner' | 'intermediate' | 'advanced';
export type TitanEngineEquipmentAccess = 'full-gym' | 'home-gym' | 'minimal' | 'bodyweight';
export type TitanEngineMusclePriority = 'chest' | 'back' | 'shoulders' | 'arms' | 'quadriceps' | 'hamstrings-glutes' | 'calves' | 'core';

export type TitanEngineLimitation = { area: string; note?: string };

export type TitanEngineAssessment = {
  experience: TitanEngineExperience;
  trainingDaysPerWeek: number;
  preferredSessionMinutes: number;
  equipmentAccess: TitanEngineEquipmentAccess;
  musclePriorities?: TitanEngineMusclePriority[];
  avoidedExerciseIds?: string[];
  availableTrainingDays?: string[];
  limitations?: TitanEngineLimitation[];
};

export type TitanEngineExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  repRange: [number, number];
  defaultRir: number;
  restSeconds: number;
  technique: string[];
  commonMistakes: string[];
  substitutions: string[];
};

export type TitanEnginePrescriptionRule = {
  weeklySetsPerMuscle: [number, number];
  maxExercisesPerSession: number;
};

export type TitanEngineExercisePrescription = TitanEngineExercise & {
  sets: number;
  priority: boolean;
};

export type TitanEngineWorkoutBlueprint = {
  dayIndex: number;
  dayLabel: string;
  focus: string;
  exercises: TitanEngineExercisePrescription[];
};

export type TitanEngineCandidateBlueprint = {
  strategy: TitanEngineStrategy;
  title: string;
  rationale: string[];
  workouts: TitanEngineWorkoutBlueprint[];
};

export type TitanEngineResult = {
  engineVersion: 1;
  candidates: TitanEngineCandidateBlueprint[];
  warnings: string[];
};