import { useEffect, useMemo, useState } from 'react';
import { BodyEvolutionPage } from '../evolution/BodyEvolutionPage';
import { calculateStrengthPr, getExerciseSessions } from './intelligence';
import { loadWorkoutHistory } from './storage';
import type { HistoryExercise, WorkoutHistoryRecord } from './types';

export function ProgressPage({ refreshKey }: { refreshKey: number }) {
  const [view, setView] = useState<'body' | 'training'>('body');
  return <>
    <section className="section-header evolution-center-header"><span className="eyebrow">CENTRO DE EVOLUÇÃO · v0.26.1</span><h2>Evolução</h2><p>Acompanhe o físico e seus recordes de treino no mesmo lugar.</p></section>
    <div className="evolution-switch" role="tablist" aria-label="Centro de evolução">
      <button type="button" role="tab" aria-selected={view === 'body'} className={view === 'body' ? 'active' : ''} onClick={() => setView('body')}>Corpo</button>
      <button type="button" role="tab" aria-selected={view === 'training'} className={view === 'training' ? 'active' : ''} onClick={() => setView('training')}>Treino</button>
    </div>
    {view === 'body' ? <BodyEvolutionPage /> : <PrHall refreshKey={refreshKey} />}
  </>;
}

type PrEvent = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  completedAt: string;
  weightKg: number;
  repetitions: number;
};

type ExercisePrSummary = {
  exercise: HistoryExercise;
  currentWeightKg: number | null;
  currentRepetitions: number | null;
  latestAt: string;
  events: PrEvent[];
};

type MusclePrGroup = {
  name: string;
  latestAt: string;
  prCount: number;
  exercises: ExercisePrSummary[];
};

function PrHall({ refreshKey }: { refreshKey: number }) {
  const [records, setRecords] = useState<WorkoutHistoryRecord[]>(() => loadWorkoutHistory());
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  useEffect(() => { setRecords(loadWorkoutHistory()); }, [refreshKey]);

  const groups = useMemo(() => buildPrGroups(records), [records]);

  if (!records.length) return <section className="hero-card compact"><span className="eyebrow">HALL DOS PRs</span><h2>Nenhum recorde ainda</h2><p>Finalize seus treinos para começar a construir seu painel de recordes pessoais.</p></section>;

  return <div className="pr-hall-view">
    <section className="section-header pr-hall-heading"><span className="eyebrow">🏆 HALL DOS PRs</span><h2>PRs conquistados</h2><p>Seus recordes organizados por grupo muscular. Toque em um bloco para ver os exercícios.</p></section>

    <div className="pr-muscle-grid">
      {groups.map((group) => {
        const active = openGroup === group.name;
        return <section className={`pr-muscle-section ${active ? 'open' : ''}`} key={group.name}>
          <button type="button" className="pr-muscle-card" aria-expanded={active} onClick={() => { setOpenGroup(active ? null : group.name); setOpenExercise(null); }}>
            <span className="pr-muscle-icon">{muscleIcon(group.name)}</span>
            <span className="pr-muscle-copy"><strong>{group.name}</strong><small>Último PR · {formatShortDate(group.latestAt)}</small></span>
            <span className="pr-muscle-count"><strong>{group.prCount}</strong><small>PR{group.prCount === 1 ? '' : 's'}</small></span>
            <span className="pr-chevron">{active ? '⌃' : '⌄'}</span>
          </button>

          {active && <div className="pr-exercise-list">
            {group.exercises.map((item) => {
              const exerciseOpen = openExercise === item.exercise.exerciseId;
              return <article className={`pr-exercise-card ${exerciseOpen ? 'open' : ''}`} key={item.exercise.exerciseId}>
                <button type="button" className="pr-exercise-summary" aria-expanded={exerciseOpen} onClick={() => setOpenExercise(exerciseOpen ? null : item.exercise.exerciseId)}>
                  <span><small>🏆 PR ATUAL</small><strong>{item.exercise.name}</strong><em>{formatPr(item.currentWeightKg, item.currentRepetitions)}</em></span>
                  <span className="pr-exercise-meta"><small>{item.events.length} conquista{item.events.length === 1 ? '' : 's'}</small><small>{formatShortDate(item.latestAt)}</small></span>
                </button>
                {exerciseOpen && <ExercisePrHistory item={item} records={records} />}
              </article>;
            })}
          </div>}
        </section>;
      })}
    </div>
  </div>;
}

function ExercisePrHistory({ item, records }: { item: ExercisePrSummary; records: WorkoutHistoryRecord[] }) {
  const sessions = getExerciseSessions(records, item.exercise.exerciseId).slice(0, 3);
  return <div className="pr-history-panel">
    <div className="pr-history-title"><span className="info-label">HISTÓRICO OCULTO</span><strong>Últimas referências</strong></div>
    <div className="pr-history-timeline">
      {item.events.slice(0, 5).map((event, index) => <div className="pr-history-event" key={`${event.completedAt}-${event.weightKg}-${event.repetitions}-${index}`}>
        <span className="pr-dot" />
        <div><strong>{event.weightKg} kg × {event.repetitions}</strong><small>{formatDate(event.completedAt)}</small></div>
      </div>)}
    </div>
    {sessions.length > 0 && <details className="pr-session-details"><summary>Ver últimas sessões</summary>{sessions.map(({ exercise, completedAt }) => <div className="pr-session-row" key={completedAt}><span>{formatDate(completedAt)}</span><strong>{formatSessionBest(exercise)}</strong></div>)}</details>}
  </div>;
}

function buildPrGroups(records: WorkoutHistoryRecord[]): MusclePrGroup[] {
  const strengthExercises = new Map<string, HistoryExercise>();
  for (const record of records) {
    for (const exercise of record.exercises) {
      if ((exercise.exerciseType ?? 'strength') !== 'strength') continue;
      if (!strengthExercises.has(exercise.exerciseId)) strengthExercises.set(exercise.exerciseId, exercise);
    }
  }

  const summaries: ExercisePrSummary[] = [];
  for (const exercise of strengthExercises.values()) {
    const pr = calculateStrengthPr(records, exercise.exerciseId);
    const events = buildExercisePrEvents(records, exercise.exerciseId, exercise.name, canonicalMuscleGroup(exercise.muscleGroup));
    const latestSession = getExerciseSessions(records, exercise.exerciseId)[0];
    if (!pr.bestSet || !latestSession) continue;
    summaries.push({
      exercise,
      currentWeightKg: pr.bestSet.weightKg,
      currentRepetitions: pr.bestSet.repetitions,
      latestAt: events[0]?.completedAt ?? latestSession.completedAt,
      events,
    });
  }

  const grouped = new Map<string, MusclePrGroup>();
  for (const summary of summaries) {
    const name = canonicalMuscleGroup(summary.exercise.muscleGroup);
    const current = grouped.get(name);
    if (!current) {
      grouped.set(name, { name, latestAt: summary.latestAt, prCount: summary.events.length, exercises: [summary] });
    } else {
      current.exercises.push(summary);
      current.prCount += summary.events.length;
      if (summary.latestAt > current.latestAt) current.latestAt = summary.latestAt;
    }
  }

  return [...grouped.values()]
    .map((group) => ({ ...group, exercises: group.exercises.sort((a, b) => b.latestAt.localeCompare(a.latestAt)) }))
    .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}

function buildExercisePrEvents(records: WorkoutHistoryRecord[], exerciseId: string, exerciseName: string, muscleGroup: string): PrEvent[] {
  const chronological = getExerciseSessions(records, exerciseId).slice().reverse();
  const events: PrEvent[] = [];
  let bestScore = -1;
  let bestWeight = -1;

  for (const { exercise, completedAt } of chronological) {
    const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
    if (!valid.length) continue;
    const best = [...valid].sort((a, b) => {
      const scoreA = (a.weightKg ?? 0) * (a.repetitions ?? 0);
      const scoreB = (b.weightKg ?? 0) * (b.repetitions ?? 0);
      return scoreB - scoreA || (b.weightKg ?? 0) - (a.weightKg ?? 0);
    })[0];
    const weightKg = best.weightKg ?? 0;
    const repetitions = best.repetitions ?? 0;
    const score = weightKg * repetitions;
    if (weightKg > bestWeight || score > bestScore) {
      events.push({ exerciseId, exerciseName, muscleGroup, completedAt, weightKg, repetitions });
      bestWeight = Math.max(bestWeight, weightKg);
      bestScore = Math.max(bestScore, score);
    }
  }
  return events.reverse();
}

function canonicalMuscleGroup(value: string) {
  const key = normalize(value);
  if (key.includes('peit') || key.includes('peitor')) return 'Peito';
  if (key.includes('cost') || key.includes('dors') || key.includes('latissim')) return 'Costas';
  if (key.includes('ombro') || key.includes('delto')) return 'Deltoides';
  if (key.includes('biceps') || key.includes('triceps') || key.includes('braco') || key.includes('antebraco')) return 'Braços';
  if (key.includes('quadr')) return 'Quadríceps';
  if (key.includes('posterior') || key.includes('isqui') || key.includes('glute')) return 'Posterior';
  if (key.includes('panturr')) return 'Panturrilhas';
  if (key.includes('abd') || key.includes('core')) return 'Core';
  return value || 'Outros';
}

function muscleIcon(group: string) {
  if (group === 'Peito') return '◒';
  if (group === 'Costas') return '◇';
  if (group === 'Deltoides') return '◉';
  if (group === 'Braços') return '◆';
  if (group === 'Quadríceps') return '▰';
  if (group === 'Posterior') return '◐';
  if (group === 'Panturrilhas') return '▲';
  if (group === 'Core') return '⬡';
  return '●';
}

function formatPr(weight: number | null, reps: number | null) { return weight && reps ? `${weight} kg × ${reps}` : weight ? `${weight} kg` : '—'; }
function formatSessionBest(exercise: HistoryExercise) { const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0); if (!valid.length) return '—'; const best = [...valid].sort((a, b) => ((b.weightKg ?? 0) * (b.repetitions ?? 0)) - ((a.weightKg ?? 0) * (a.repetitions ?? 0)))[0]; return `${best.weightKg ?? 0} kg × ${best.repetitions ?? 0}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)); }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
