import { useEffect, useState } from 'react';
import { loadBodyEvolution } from '../evolution/storage';
import { loadHealthSamples } from '../health/repository';
import { loadWorkoutHistory } from '../history/storage';
import { loadNutritionExecutions } from '../nutrition/execution';
import { loadActiveNutritionPlan } from '../nutrition/storage';
import { createUnifiedCoachReport } from './engine';
import type { CoachReport } from './types';

export function useUnifiedCoachReport() {
  const [report, setReport] = useState<CoachReport | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      let healthSamples = [];
      let bodyEntries = [];

      try {
        const [samples, bodyState] = await Promise.all([loadHealthSamples(), loadBodyEvolution()]);
        healthSamples = samples;
        bodyEntries = bodyState.entries;
      } catch {
        // O Coach continua funcional com as fontes locais disponíveis.
      }

      if (!active) return;
      setReport(createUnifiedCoachReport({
        workouts: loadWorkoutHistory(),
        nutritionPlan: loadActiveNutritionPlan(),
        nutritionExecutions: loadNutritionExecutions(),
        healthSamples,
        bodyEntries,
      }));
    }

    void load();
    const refresh = () => void load();
    window.addEventListener('titan:nutrition-changed', refresh);
    window.addEventListener('titan:health-changed', refresh);
    window.addEventListener('titan:evolution-changed', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      active = false;
      window.removeEventListener('titan:nutrition-changed', refresh);
      window.removeEventListener('titan:health-changed', refresh);
      window.removeEventListener('titan:evolution-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return report;
}
