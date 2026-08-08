import { useEffect, useMemo, useState } from 'react';
import { getProgressionAdvice } from './intelligence';
import { loadWorkoutHistory } from './storage';
import type { WorkoutHistoryRecord } from './types';

type CoachItem = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  status: 'insufficient' | 'maintain' | 'progress' | 'review';
  title: string;
  message: string;
  confidence: 'low' | 'medium' | 'high';
};

export function CoachTitanPanel({ refreshKey }: { refreshKey: number }) {
  const [records, setRecords] = useState<WorkoutHistoryRecord[]>(() => loadWorkoutHistory());
  useEffect(() => { setRecords(loadWorkoutHistory()); }, [refreshKey]);

  const items = useMemo(() => buildCoachItems(records), [records]);

  return <div className="coach-titan-view">
    <section className="section-header coach-titan-heading">
      <span className="eyebrow">COACH TITAN · v0.27.6</span>
      <h2>Prioridades atuais</h2>
      <p>As recomendações usam seu histórico real e a mesma lógica de progressão aplicada durante o treino.</p>
    </section>

    {!records.length ? <section className="hero-card compact">
      <span className="eyebrow">CRIANDO BASE</span>
      <h2>Complete seus primeiros treinos</h2>
      <p>A primeira execução cria a linha de base. Depois das próximas referências, o Coach começa a comparar desempenho.</p>
    </section> : !items.length ? <section className="hero-card compact">
      <span className="eyebrow">BASE EM FORMAÇÃO</span>
      <h2>Ainda faltam comparações</h2>
      <p>Continue registrando seus exercícios. O Coach precisa de pelo menos duas referências válidas para gerar recomendações úteis.</p>
    </section> : <div className="coach-priority-stack">
      {items.map((item, index) => <article className={`coach-priority-card status-${item.status}`} key={item.exerciseId}>
        <div className="coach-priority-topline">
          <span className="coach-priority-rank">{index + 1}</span>
          <span className="coach-priority-status">{statusLabel(item.status)}</span>
        </div>
        <div className="coach-priority-main">
          <small>{item.muscleGroup}</small>
          <h3>{item.exerciseName}</h3>
          <strong>{item.title}</strong>
        </div>
        <details className="coach-priority-details">
          <summary>Ver orientação</summary>
          <p>{item.message}</p>
          <small>Confiança: {confidenceLabel(item.confidence)}</small>
        </details>
      </article>)}
    </div>}
  </div>;
}

function buildCoachItems(records: WorkoutHistoryRecord[]): CoachItem[] {
  const latestExercise = new Map<string, { exerciseName: string; muscleGroup: string; completedAt: string }>();
  for (const record of records) {
    for (const exercise of record.exercises) {
      if ((exercise.exerciseType ?? 'strength') !== 'strength') continue;
      const current = latestExercise.get(exercise.exerciseId);
      if (!current || record.completedAt > current.completedAt) {
        latestExercise.set(exercise.exerciseId, { exerciseName: exercise.name, muscleGroup: exercise.muscleGroup, completedAt: record.completedAt });
      }
    }
  }

  const priority: Record<CoachItem['status'], number> = { review: 0, progress: 1, maintain: 2, insufficient: 3 };
  return [...latestExercise.entries()]
    .map(([exerciseId, info]) => {
      const advice = getProgressionAdvice(records, exerciseId);
      return { exerciseId, exerciseName: info.exerciseName, muscleGroup: info.muscleGroup, status: advice.status, title: advice.title, message: advice.message, confidence: advice.confidence } satisfies CoachItem;
    })
    .filter((item) => item.status !== 'insufficient')
    .sort((a, b) => priority[a.status] - priority[b.status] || a.exerciseName.localeCompare(b.exerciseName))
    .slice(0, 3);
}

function statusLabel(status: CoachItem['status']) {
  if (status === 'progress') return 'PROGREDIR';
  if (status === 'review') return 'ATENÇÃO';
  if (status === 'maintain') return 'MANTER';
  return 'BASE';
}
function confidenceLabel(value: CoachItem['confidence']) { return value === 'high' ? 'alta' : value === 'medium' ? 'média' : 'baixa'; }
