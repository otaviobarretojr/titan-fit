import type { BodyEvolutionState } from './types';

export const demoBodyEvolution: BodyEvolutionState = {
  version: 1,
  entries: [
    {
      id: 'demo-body-2026-08',
      recordedAt: '2026-08-07T12:00:00.000Z',
      weightKg: 92.2,
      measurements: { waistCm: 86, armCm: 39.4, chestCm: 108.5, thighCm: 62.5, calfCm: 39.2 },
      bioimpedance: { bodyFatPercent: 16.1, muscleMassKg: 43.8, leanMassKg: 77.4, visceralFat: 8, bodyWaterPercent: 58.4, basalMetabolicRate: 1958 },
      notes: 'DADOS DE DEMONSTRAÇÃO — avaliação mensal para testar gráficos e comparativos.'
    },
    {
      id: 'demo-body-2026-07',
      recordedAt: '2026-07-07T12:00:00.000Z',
      weightKg: 92.9,
      measurements: { waistCm: 87.5, armCm: 39.0, chestCm: 108.0, thighCm: 62.0, calfCm: 39.0 },
      bioimpedance: { bodyFatPercent: 17.0, muscleMassKg: 43.2, leanMassKg: 77.1, visceralFat: 9, bodyWaterPercent: 57.8, basalMetabolicRate: 1948 },
      notes: 'DADOS DE DEMONSTRAÇÃO — avaliação mensal para testar gráficos e comparativos.'
    },
    {
      id: 'demo-body-2026-06',
      recordedAt: '2026-06-07T12:00:00.000Z',
      weightKg: 93.8,
      measurements: { waistCm: 89.0, armCm: 38.6, chestCm: 107.2, thighCm: 61.4, calfCm: 38.8 },
      bioimpedance: { bodyFatPercent: 18.2, muscleMassKg: 42.6, leanMassKg: 76.7, visceralFat: 10, bodyWaterPercent: 57.0, basalMetabolicRate: 1938 },
      notes: 'DADOS DE DEMONSTRAÇÃO — avaliação mensal para testar gráficos e comparativos.'
    }
  ]
};
