import { useEffect, useState } from 'react';
import { loadBodyEvolution } from '../evolution/storage';
import { loadHealthSamples } from '../health/repository';
import { loadWorkoutHistory } from '../history/storage';
import { loadNutritionExecutions } from '../nutrition/execution';
import { loadActiveNutritionPlan } from '../nutrition/storage';
import { createUnifiedCoachReport } from './engine';
import type { CoachReport } from './types';

const confidenceLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' } as const;

export function CoachPage() {
  const [report, setReport] = useState<CoachReport | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const [healthSamples, bodyState] = await Promise.all([loadHealthSamples(), loadBodyEvolution()]);
      if (!active) return;
      setReport(createUnifiedCoachReport({
        workouts: loadWorkoutHistory(),
        nutritionPlan: loadActiveNutritionPlan(),
        nutritionExecutions: loadNutritionExecutions(),
        healthSamples,
        bodyEntries: bodyState.entries,
      }));
    }
    void load();
    const refresh = () => void load();
    window.addEventListener('titan:nutrition-changed', refresh);
    return () => { active = false; window.removeEventListener('titan:nutrition-changed', refresh); };
  }, []);

  if (!report) return <section className="hero-card compact"><span className="eyebrow">COACH TITAN</span><h2>Analisando seus dados</h2><p>Reunindo treino, nutrição, saúde e evolução.</p></section>;

  return <div className="coach-page-v054">
    <section className="section-header">
      <span className="eyebrow">COACH TITAN 1.0</span>
      <h2>Leitura integrada</h2>
      <p>Prioridades geradas localmente a partir dos dados que você já registrou no TITAN FIT.</p>
    </section>

    <section className="coach-score-card" aria-label="Score do Coach TITAN">
      <div className="score-ring"><strong>{report.score.total}</strong><span>/100</span></div>
      <div><span className="info-label">PRIORIDADE AGORA</span><h3>{report.priority.title}</h3><p>{report.priority.message}</p></div>
    </section>

    <section className="coach-pillars coach-pillars-v054" aria-label="Pilares do Coach">
      <Pillar label="Treino" value={report.score.training} />
      <Pillar label="Nutrição" value={report.score.nutrition} />
      <Pillar label="Recuperação" value={report.score.recovery} />
      <Pillar label="Evolução" value={report.score.evolution} />
    </section>

    <section className="coach-disclaimer">
      <strong>Confiança dos dados: {confidenceLabels[report.score.dataConfidence]}</strong>
      <p>{report.availablePillars} de 4 pilares possuem dados suficientes. Pilares sem registros ficam fora da média e não reduzem artificialmente seu score.</p>
    </section>

    <section className="progress-section">
      <h3>Insights prioritários</h3>
      <div className="coach-insight-list">
        {report.insights.map((insight) => <article className={`coach-insight ${insight.severity}`} key={insight.id}><span className="insight-dot" /><div><small>{pillarLabel(insight.pillar)}</small><strong>{insight.title}</strong><p>{insight.message}</p></div></article>)}
      </div>
    </section>
  </div>;
}

function Pillar({ label, value }: { label: string; value: number | null }) {
  return <article><span>{label}</span><strong>{value === null ? '—' : value}</strong><small>{value === null ? 'Sem dados' : '/100'}</small></article>;
}

function pillarLabel(value?: 'training' | 'nutrition' | 'recovery' | 'evolution') {
  if (value === 'nutrition') return 'NUTRIÇÃO';
  if (value === 'recovery') return 'RECUPERAÇÃO';
  if (value === 'evolution') return 'EVOLUÇÃO';
  return 'TREINO';
}
