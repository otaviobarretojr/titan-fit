export type BodyMeasurements = {
  waistCm?: number;
  armCm?: number;
  chestCm?: number;
  thighCm?: number;
  calfCm?: number;
};

export type BioimpedanceData = {
  bodyFatPercent?: number;
  muscleMassKg?: number;
  leanMassKg?: number;
  visceralFat?: number;
  bodyWaterPercent?: number;
  basalMetabolicRate?: number;
};

export type EvolutionPhoto = {
  id: string;
  angle: 'front' | 'side' | 'back';
  dataUrl: string;
};

export type BodyEvolutionEntry = {
  id: string;
  recordedAt: string;
  weightKg?: number;
  measurements?: BodyMeasurements;
  bioimpedance?: BioimpedanceData;
  photos?: EvolutionPhoto[];
  notes?: string;
};

export type BodyEvolutionState = {
  version: 1;
  entries: BodyEvolutionEntry[];
};
