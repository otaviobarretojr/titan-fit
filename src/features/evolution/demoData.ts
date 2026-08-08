import type { BodyEvolutionState } from './types';

function monthEntry(monthsAgo: number, index: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(7);
  date.setHours(8, 0, 0, 0);

  const progress = 5 - index;
  const weightKg = Number((94.4 - progress * 0.44).toFixed(1));
  const bodyFatPercent = Number((18.7 - progress * 0.5).toFixed(1));
  const muscleMassKg = Number((42.3 + progress * 0.32).toFixed(1));
  const leanMassKg = Number((76.4 + progress * 0.22).toFixed(1));

  return {
    id: `demo-body-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    recordedAt: date.toISOString(),
    weightKg,
    measurements: {
      waistCm: Number((90.2 - progress * 0.82).toFixed(1)),
      armCm: Number((38.4 + progress * 0.22).toFixed(1)),
      chestCm: Number((107.0 + progress * 0.34).toFixed(1)),
      thighCm: Number((61.2 + progress * 0.26).toFixed(1)),
      calfCm: Number((38.7 + progress * 0.11).toFixed(1)),
    },
    bioimpedance: {
      bodyFatPercent,
      muscleMassKg,
      leanMassKg,
      visceralFat: Math.max(7, 10 - Math.floor(progress / 2)),
      bodyWaterPercent: Number((56.8 + progress * 0.34).toFixed(1)),
      basalMetabolicRate: 1935 + progress * 6,
    },
    notes: 'DADOS DE DEMONSTRAÇÃO QA — série histórica completa para gráficos, comparativos e tendências.',
  };
}

export const demoBodyEvolution: BodyEvolutionState = {
  version: 1,
  entries: Array.from({ length: 6 }, (_, index) => monthEntry(index, index)),
};
