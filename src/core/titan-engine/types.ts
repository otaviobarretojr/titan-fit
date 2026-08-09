export type TitanEngineStrategy = 'adherence' | 'balanced' | 'availability';
export type TitanEngineExperience = 'beginner' | 'intermediate' | 'advanced';
export type TitanEngineEquipmentAccess = 'full-gym' | 'home-gym' | 'minimal' | 'bodyweight';
export type TitanEngineMusclePriority = 'chest' | 'back' | 'shoulders' | 'arms' | 'quadriceps' | 'hamstrings-glutes' | 'calves' | 'core';
export type TitanEngineMovementPattern = 'horizontal-push' | 'vertical-push' | 'horizontal-pull' | 'vertical-pull' | 'squat' | 'hinge' | 'knee-flexion' | 'elbow-flexion' | 'elbow-extension' | 'calf' | 'core';
export type TitanEngineExerciseRole = 'compound' | 'isolation';
export type TitanEngineStabilityDemand = 'low' | 'medium' | 'high';
export type TitanEngineFatigueCost = 'low' | 'medium' | 'high';
export type TitanEngineTensionBias = 'lengthened' | 'mid-range' | 'shortened' | 'mixed' | 'unknown';

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
  movementPattern?: TitanEngineMovementPattern;
  exerciseRole?: TitanEngineExerciseRole;
  stabilityDemand?: TitanEngineStabilityDemand;
  fatigueCost?: TitanEngineFatigueCost;
  tensionBias?: TitanEngineTensionBias;
  repRange: [number, number];
  defaultRir: number;
  restSeconds: number;
  technique: string;
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

export type TitanEngineCandidateMetrics = {
  weeklySetsByMuscle: Record<string, number>;
  weeklyFrequencyByMuscle: Record<string, number>;
  volumeTargetCoverage: number;
  frequencyScore: number;
  sessionBalance: number;
  fatigueScore: number;
  strategyFit: number;
  score: number;
};

export type TitanEngineCandidateBlueprint = {
  strategy: TitanEngineStrategy;
  title: string;
  rationale: string[];
  workouts: TitanEngineWorkoutBlueprint[];
  metrics: TitanEngineCandidateMetrics;
  recommended: boolean;
};

export type TitanEngineResult = {
  engineVersion: 1;
  candidates: TitanEngineCandidateBlueprint[];
  recommendedStrategy: TitanEngineStrategy;
  recommendationReasons: string[];
  warnings: string[];
};