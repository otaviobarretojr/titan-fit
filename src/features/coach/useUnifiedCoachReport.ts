import { useEffect, useState } from 'react';
import { loadBodyEvolution } from '../evolution/storage';
import type { BodyEvolutionEntry } from '../evolution/types';
import { loadHealthSamples } from '../health/repository';
import type { HealthSample } from '../health/types';
import { loadWorkoutHistory } from '../history/storage';
import { createUnifiedCoachReport } from './engine';
import type { CoachReport } from './types';

export function useUnifiedCoachReport() {
  const [report, setReport] = useState<CoachReport | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      let healthSamples: HealthSample[] = [];
      let bodyEntries: BodyEvolutionEntry[] = [];

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
        healthSamples,
        bodyEntries,
      }));
    }

    void load();
    const refresh = () => void load();
    window.addEventListener('titan:health-changed', refresh);
    window.addEventListener('titan:evolution-changed', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      active = false;
      window.removeEventListener('titan:health-changed', refresh);
      window.removeEventListener('titan:evolution-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return report;
}
