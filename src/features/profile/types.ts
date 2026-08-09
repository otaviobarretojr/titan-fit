export type BiologicalSex = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type PrimaryGoal = 'hypertrophy' | 'fat-loss' | 'recomposition' | 'strength' | 'conditioning' | 'general-fitness';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentAccess = 'full-gym' | 'home-gym' | 'minimal' | 'bodyweight';
export type CardioGoal = 'health' | 'conditioning' | '5k' | '10k' | 'fat-loss-support' | 'none';
export type CardioLevel = 'low' | 'moderate' | 'high';
export type MusclePriority = 'chest' | 'back' | 'shoulders' | 'arms' | 'quadriceps' | 'hamstrings-glutes' | 'calves' | 'core';

export type TitanProfile = {
  id: string;
  displayName: string;
  birthDate?: string;
  biologicalSex?: BiologicalSex;
  heightCm?: number;
  currentWeightKg?: number;
  primaryGoal?: PrimaryGoal;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
};

export type TitanTrainingAssessment = {
  id: string;
  profileId: string;
  experience: TrainingExperience;
  trainingDaysPerWeek: number;
  preferredSessionMinutes: number;
  equipmentAccess: EquipmentAccess;
  availableEquipment?: string[];
  limitations?: Array<{ area: string; note?: string }>;
  musclePriorities?: MusclePriority[];
  preferredExerciseIds?: string[];
  avoidedExerciseIds?: string[];
  availableTrainingDays?: string[];
  cardioGoal: CardioGoal;
  cardioDaysPerWeek?: number;
  currentCardioLevel?: CardioLevel;
  createdAt: string;
  updatedAt: string;
};

export type PlanSource = 'titan-generated' | 'imported' | 'manual';
export type PlanGenerationRequest = { profile: TitanProfile; assessment: TitanTrainingAssessment; requestedAt: string };
export type PlanCandidateStrategy = 'adherence' | 'balanced' | 'availability';
export type GeneratedPlanCandidate<TPlan = unknown> = {
  id: string;
  profileId: string;
  strategy: PlanCandidateStrategy;
  title: string;
  rationale: string[];
  source: 'titan-generated';
  plan: TPlan;
  createdAt: string;
  recommended?: boolean;
  titanScore?: number;
  engineMetrics?: {
    volumeTargetCoverage: number;
    sessionBalance: number;
    fatigueScore: number;
    strategyFit: number;
  };
};
