import { loadWorkoutHistory } from '../history/storage';
import { createCoachReport } from './engine';

const confidenceLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' } as const;

export function CoachPage() {
  const report = createCoachReport(loadWorkoutHistory());

  return <>
    <section className="section-header">
      <span className="eyebrow">COACH TITAN</span>
      <h2>Leitura dos seus dados</h2>
      <p>Recomendações locais baseadas apenas nos treinos registrados no TITAN FIT.</p>
    </section>

    <section className="coach-score-card" aria-label="Score TITAN">
      <div className="score-ring"><strong>{report.score.total}</strong><span>/100</span></div>
      <div><span className="info-label">SCORE TITAN</span><h3>{report.priority.title}</h3><p>{report.priority.message}</p></div>
    </section>

    <section className="coach-pillars" aria-label="Pilares do score">
      <article><span>Treinos</span><strong>{report.score.training}</strong></article>
      <article><span>Confiança</span><strong>{confidenceLabels[report.score.dataConfidence]}</strong></article>
    </section>

    <section className="coach-disclaimer">
      <strong>Escopo atual</strong>
      <p>O cardio integrado conta como exercício dentro do treino. Não existe análise ou histórico separado de cardio nesta versão.</p>
    </section>

    <section className="progress-section">
      <h3>Insights recentes</h3>
      <div className="coach-insight-list">
        {report.insights.length ? report.insights.map((insight) => <article className={`coach-insight ${insight.severity}`} key={insight.id}><span className="insight-dot" /><div><strong>{insight.title}</strong><p>{insight.message}</p></div></article>) : <article className="coach-insight neutral"><span className="insight-dot" /><div><strong>Sem novos insights</strong><p>Continue registrando para ampliar a análise.</p></div></article>}
      </div>
    </section>
  </>;
}
