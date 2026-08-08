import type { HistoryExercise, WorkoutHistoryRecord } from './types';

type Props = { records: WorkoutHistoryRecord[] };

type ExerciseWeekSummary = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  currentScore: number;
  previousScore: number;
  deltaPercent: number;
};

export function WeeklyCoachSummary({ records }: Props) {
  const summary = buildWeeklySummary(records);

  return <section className="weekly-coach-summary" aria-label="Resumo semanal do Coach TITAN">
    <div className="weekly-coach-header">
      <div><span className="eyebrow">COACH TITAN · v0.27.6</span><h3>Resumo da semana</h3></div>
      <span className={`weekly-coach-trend ${summary.trend}`}>{summary.trendLabel}</span>
    </div>

    <div className="weekly-coach-metrics">
      <div><span>Treinos</span><strong>{summary.workouts}</strong><small>{summary.workoutsDeltaLabel}</small></div>
      <div><span>PRs</span><strong>{summary.prs}</strong><small>{summary.prs ? 'conquistados' : 'sem novos PRs'}</small></div>
    </div>

    {summary.hasComparison ? <>
      <div className="weekly-coach-insights">
        {summary.bestExercise && <div className="weekly-insight positive"><span>↗ Maior evolução</span><strong>{summary.bestExercise.name}</strong><small>+{summary.bestExercise.deltaPercent.toFixed(1)}% vs. semana anterior</small></div>}
        {summary.stagnantExercise && <div className="weekly-insight neutral"><span>→ Estável</span><strong>{summary.stagnantExercise.name}</strong><small>desempenho praticamente igual</small></div>}
      </div>
      <div className="weekly-coach-priority"><span className="eyebrow">PRIORIDADE DA PRÓXIMA SEMANA</span><strong>{summary.priorityTitle}</strong><p>{summary.priorityMessage}</p></div>
    </> : <div className="weekly-coach-empty"><strong>Construindo comparação semanal</strong><p>Complete treinos em semanas diferentes para o Coach comparar evolução, PRs e estabilidade sem antecipar conclusões.</p></div>}
  </section>;
}

function buildWeeklySummary(records: WorkoutHistoryRecord[]) {
  const now = new Date();
  const currentStart = startOfWeek(now);
  const nextStart = addDays(currentStart, 7);
  const previousStart = addDays(currentStart, -7);

  const current = records.filter((record) => inRange(record.completedAt, currentStart, nextStart));
  const previous = records.filter((record) => inRange(record.completedAt, previousStart, currentStart));
  const currentExercises = aggregateExercises(current);
  const previousExercises = aggregateExercises(previous);

  const comparisons: ExerciseWeekSummary[] = [];
  for (const [exerciseId, currentExercise] of currentExercises.entries()) {
    const previousExercise = previousExercises.get(exerciseId);
    if (!previousExercise || previousExercise.score <= 0 || currentExercise.score <= 0) continue;
    const deltaPercent = ((currentExercise.score - previousExercise.score) / previousExercise.score) * 100;
    comparisons.push({
      exerciseId,
      name: currentExercise.name,
      muscleGroup: currentExercise.muscleGroup,
      currentScore: currentExercise.score,
      previousScore: previousExercise.score,
      deltaPercent,
    });
  }

  const bestExercise = comparisons.filter((item) => item.deltaPercent > 1).sort((a, b) => b.deltaPercent - a.deltaPercent)[0] ?? null;
  const stagnantExercise = comparisons.filter((item) => Math.abs(item.deltaPercent) <= 1).sort((a, b) => Math.abs(a.deltaPercent) - Math.abs(b.deltaPercent))[0] ?? null;
  const decliningExercise = comparisons.filter((item) => item.deltaPercent < -1).sort((a, b) => a.deltaPercent - b.deltaPercent)[0] ?? null;
  const prs = countPrsInRange(records, currentStart, nextStart);
  const hasComparison = current.length > 0 && previous.length > 0 && comparisons.length > 0;

  let priorityTitle = 'Consolidar consistência';
  let priorityMessage = 'Repita os principais exercícios com técnica estável e busque pequenas melhorias antes de aumentar a carga.';
  if (decliningExercise) {
    priorityTitle = `Recuperar ${decliningExercise.name}`;
    priorityMessage = 'Mantenha a carga de referência e recupere repetições e execução antes de tentar progredir.';
  } else if (stagnantExercise) {
    priorityTitle = `Destravar ${stagnantExercise.name}`;
    priorityMessage = 'Na próxima sessão, mantenha a carga e tente ganhar pelo menos 1 repetição total antes de subir o peso.';
  } else if (bestExercise) {
    priorityTitle = `Consolidar ${bestExercise.name}`;
    priorityMessage = 'A evolução foi clara. Repita o desempenho e, se técnica e RIR permitirem, avance para a próxima progressão.';
  }

  const trend = decliningExercise ? 'attention' : bestExercise ? 'positive' : 'stable';
  const trendLabel = decliningExercise ? 'ATENÇÃO' : bestExercise ? 'EVOLUINDO' : 'ESTÁVEL';
  const workoutDelta = current.length - previous.length;
  const workoutsDeltaLabel = previous.length ? `${workoutDelta >= 0 ? '+' : ''}${workoutDelta} vs. anterior` : 'sem comparação';

  return {
    workouts: current.length,
    prs,
    workoutsDeltaLabel,
    bestExercise,
    stagnantExercise,
    decliningExercise,
    priorityTitle,
    priorityMessage,
    trend,
    trendLabel,
    hasComparison,
  };
}

function aggregateExercises(records: WorkoutHistoryRecord[]) {
  const result = new Map<string, { name: string; muscleGroup: string; score: number }>();
  for (const record of records) {
    for (const exercise of record.exercises) {
      if ((exercise.exerciseType ?? 'strength') !== 'strength') continue;
      const score = bestExerciseScore(exercise);
      if (score <= 0) continue;
      const current = result.get(exercise.exerciseId);
      if (!current || score > current.score) result.set(exercise.exerciseId, { name: exercise.name, muscleGroup: exercise.muscleGroup, score });
    }
  }
  return result;
}

function bestExerciseScore(exercise: HistoryExercise) {
  return (exercise.sets ?? []).reduce((best, set) => {
    const weight = set.weightKg ?? 0;
    const reps = set.repetitions ?? 0;
    return Math.max(best, weight * reps);
  }, 0);
}

function countPrsInRange(records: WorkoutHistoryRecord[], start: Date, end: Date) {
  const chronological = [...records].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const bestByExercise = new Map<string, { weight: number; score: number }>();
  let count = 0;

  for (const record of chronological) {
    for (const exercise of record.exercises) {
      if ((exercise.exerciseType ?? 'strength') !== 'strength') continue;
      const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
      if (!valid.length) continue;
      const best = [...valid].sort((a, b) => ((b.weightKg ?? 0) * (b.repetitions ?? 0)) - ((a.weightKg ?? 0) * (a.repetitions ?? 0)))[0];
      const weight = best.weightKg ?? 0;
      const score = weight * (best.repetitions ?? 0);
      const previous = bestByExercise.get(exercise.exerciseId);
      if (!previous) {
        bestByExercise.set(exercise.exerciseId, { weight, score });
        continue;
      }
      const isPr = weight > previous.weight || score > previous.score;
      if (isPr && inRange(record.completedAt, start, end)) count += 1;
      bestByExercise.set(exercise.exerciseId, { weight: Math.max(previous.weight, weight), score: Math.max(previous.score, score) });
    }
  }
  return count;
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function inRange(value: string, start: Date, end: Date) {
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}
