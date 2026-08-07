import { useEffect, useMemo, useState } from 'react';
import { getExerciseVideo } from '../exercise-library/videos';
import { addWorkoutHistoryRecord, loadWorkoutHistory } from '../history/storage';
import type { HistoryExercise, WorkoutHistoryRecord } from '../history/types';
import type { ExerciseType, TitanExercise, TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution, removeWorkoutExecution, saveWorkoutExecution } from './storage';
import type { ExecutedSet, WorkoutExecution } from './types';

type Props = { planId: string; planName: string; workout: TitanWorkoutDay; onBack: () => void; onCompleted: () => void };
type WorkoutSummary = { durationSeconds: number; totalVolumeKg: number; totalSets: number; cardioMinutes: number };
type NumericField = 'weightKg' | 'repetitions' | 'rir' | 'durationSeconds' | 'distanceMeters' | 'speedKmh' | 'inclinePercent' | 'averageHeartRate' | 'calories';
type StrengthReference = { weightKg: number; repetitions: number };

export function WorkoutExecutionView({ planId, planName, workout, onBack, onCompleted }: Props) {
  const previousHistory = useMemo(() => loadWorkoutHistory(), []);
  const initial = useMemo(() => normalizeExecution(loadWorkoutExecution(planId, workout.id), planId, workout), [planId, workout]);
  const [execution, setExecution] = useState<WorkoutExecution>(initial);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => findFirstPendingExercise(workout, initial));
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(() => secondsSince(initial.startedAt));
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [videoUnlocked, setVideoUnlocked] = useState<Record<string, boolean>>({});

  useEffect(() => { saveWorkoutExecution(execution); }, [execution]);
  useEffect(() => { const interval = window.setInterval(() => setSessionSeconds(secondsSince(execution.startedAt)), 1000); return () => window.clearInterval(interval); }, [execution.startedAt]);
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = window.setInterval(() => setTimerSeconds((current) => {
      if (current <= 1) { setTimerRunning(false); navigator.vibrate?.([180, 100, 180]); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const totals = useMemo(() => {
    const entries = Object.values(execution.exercises).flatMap((exercise) => exercise.sets);
    const completed = entries.filter((set) => set.completed);
    const volume = completed.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0);
    return { completed: completed.length, total: entries.length, volume };
  }, [execution]);

  const activeExercise = workout.exercises[activeExerciseIndex];
  const exerciseType = resolveExerciseType(activeExercise);
  const activeSets = execution.exercises[activeExercise.id].sets;
  const exerciseCompleted = activeSets.every((set) => set.completed);
  const progress = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
  const strengthSnapshot = useMemo(() => getStrengthSnapshot(previousHistory, activeExercise), [previousHistory, activeExercise]);
  const exerciseVideo = getExerciseVideo(activeExercise);
  const videoIsRequired = Boolean(exerciseVideo) && !videoUnlocked[activeExercise.id] && !exerciseCompleted;

  function updateSet(setNumber: number, patch: Partial<ExecutedSet>) {
    setExecution((current) => ({ ...current, updatedAt: new Date().toISOString(), exercises: { ...current.exercises, [activeExercise.id]: { ...current.exercises[activeExercise.id], sets: current.exercises[activeExercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set) } } }));
  }
  function updateNumeric(setNumber: number, field: NumericField, value: string) { updateSet(setNumber, { [field]: value === '' ? null : Number(value) }); }
  function completeSet(set: ExecutedSet) {
    const completed = !set.completed; updateSet(set.setNumber, { completed });
    if (completed && (activeExercise.restSeconds ?? 0) > 0) { setTimerSeconds(activeExercise.restSeconds ?? 0); setTimerRunning(true); }
  }
  function nextExercise() { setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function previousExerciseNav() { setActiveExerciseIndex((value) => Math.max(0, value - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function finishWorkout() {
    if (totals.completed !== totals.total) return;
    const completedAt = new Date().toISOString(); const record = createHistoryRecord(planId, planName, workout, execution, completedAt);
    addWorkoutHistoryRecord(record); removeWorkoutExecution(planId, workout.id); setTimerRunning(false); setTimerSeconds(0);
    const cardioMinutes = record.exercises.filter((exercise) => exercise.exerciseType === 'cardio').reduce((total, exercise) => total + Math.round(exercise.totalDurationSeconds / 60), 0);
    setSummary({ durationSeconds: record.durationSeconds, totalVolumeKg: record.totalVolumeKg, totalSets: record.totalSets, cardioMinutes });
  }
  function resetSession() {
    if (!window.confirm('Apagar todos os registros desta sessão?')) return;
    const next = createExecution(planId, workout); removeWorkoutExecution(planId, workout.id); setExecution(next); setActiveExerciseIndex(0); setTimerRunning(false); setTimerSeconds(0); setSessionSeconds(0);
  }

  if (summary) return <section className="workout-summary"><span className="eyebrow">TREINO CONCLUÍDO</span><h2>{workout.title}</h2><p>Sessão salva com todas as métricas registradas.</p><div className="summary-grid"><div><span>Tempo</span><strong>{formatDuration(summary.durationSeconds)}</strong></div><div><span>Volume</span><strong>{Math.round(summary.totalVolumeKg).toLocaleString('pt-BR')} kg</strong></div><div><span>Registros</span><strong>{summary.totalSets}</strong></div><div><span>Cardio</span><strong>{summary.cardioMinutes ? `${summary.cardioMinutes} min` : '—'}</strong></div></div><button type="button" className="primary-action" onClick={onCompleted}>Ver progresso</button></section>;

  return <div className="workout-mode">
    <button type="button" className="secondary-action back-action" onClick={onBack}>← Sair do modo treino</button>
    <section className="workout-progress-card compact-workout-progress"><div><span className="eyebrow">EXERCÍCIO {activeExerciseIndex + 1} DE {workout.exercises.length}</span><h2>{workout.title}</h2><p>{totals.completed} / {totals.total} concluídos · Tempo {formatSessionTime(sessionSeconds)}</p></div><strong>{progress}%</strong><div className="workout-progress-track"><span style={{ width: `${progress}%` }} /></div></section>
    {timerSeconds > 0 && <section className="rest-timer active" aria-label="Cronômetro de descanso"><div><span className="info-label">DESCANSO AUTOMÁTICO</span><strong>{formatTimer(timerSeconds)}</strong></div><div className="timer-actions"><button type="button" className="secondary-action" onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? 'Pausar' : 'Continuar'}</button><button type="button" className="secondary-action" onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}>Pular</button></div></section>}

    <article className={`active-exercise-card ${exerciseType === 'cardio' ? 'cardio-exercise' : ''}`}>
      <header><span className="exercise-order">{activeExerciseIndex + 1}</span><div><span className="info-label">{activeExercise.muscleGroup} · {typeLabel(exerciseType)}</span><h3>{activeExercise.name}</h3></div></header>

      {exerciseVideo && <section className={`video-stage ${videoIsRequired ? 'expanded' : 'collapsed'}`}>
        {videoIsRequired ? <>
          <div className="exercise-video"><iframe title={exerciseVideo.title} src={`https://www.youtube-nocookie.com/embed/${exerciseVideo.videoId}?rel=0&modestbranding=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
          <div className="video-stage-meta"><strong>{exerciseVideo.title}</strong><small>{exerciseVideo.source}</small></div>
          <button type="button" className="primary-action" onClick={() => setVideoUnlocked((current) => ({ ...current, [activeExercise.id]: true }))}>Já assisti · começar séries</button>
          <button type="button" className="text-action" onClick={() => setVideoUnlocked((current) => ({ ...current, [activeExercise.id]: true }))}>Pular demonstração</button>
        </> : <button type="button" className="video-replay-action" onClick={() => setVideoUnlocked((current) => ({ ...current, [activeExercise.id]: false }))}>▶ Rever execução</button>}
      </section>}

      <Prescription exercise={activeExercise} />
      {exerciseType === 'strength' && <div className="progression-panel workout-pr-panel">
        <div><span>Última sessão</span><strong>{strengthSnapshot.last}</strong></div>
        <div><span>🏆 PR válido</span><strong>{strengthSnapshot.pr}</strong></div>
        <div><span>Meta de hoje</span><strong>{strengthSnapshot.target}</strong></div>
      </div>}
      {activeExercise.technique && <p className="exercise-cue">{activeExercise.technique}</p>}
      {activeExercise.commonMistakes?.length ? <details className="exercise-details"><summary>Erros comuns</summary><ul>{activeExercise.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></details> : null}
      {exerciseType === 'cardio' && activeExercise.progression?.length ? <ProgressionPlan exercise={activeExercise} /> : null}

      {!videoIsRequired && <div className="set-entry-list">{activeSets.map((set) => <SetEntry key={set.setNumber} exercise={activeExercise} exerciseType={exerciseType} set={set} totalSets={activeSets.length} onNumeric={updateNumeric} onText={(field, value) => updateSet(set.setNumber, { [field]: value || null })} onComplete={() => completeSet(set)} />)}</div>}
    </article>

    {workout.exercises[activeExerciseIndex + 1] && <aside className="next-exercise-preview"><span>Próximo exercício</span><strong>{workout.exercises[activeExerciseIndex + 1].name}</strong></aside>}
    <div className="exercise-navigation"><button type="button" className="secondary-action" disabled={activeExerciseIndex === 0} onClick={previousExerciseNav}>Anterior</button>{activeExerciseIndex < workout.exercises.length - 1 ? <button type="button" className="primary-action" disabled={!exerciseCompleted} onClick={nextExercise}>Próximo exercício</button> : <button type="button" className="primary-action" disabled={totals.completed !== totals.total} onClick={finishWorkout}>Concluir e salvar treino</button>}</div>
    <button type="button" className="danger-action reset-session" onClick={resetSession}>Resetar sessão</button>
  </div>;
}

function SetEntry({ exercise, exerciseType, set, totalSets, onNumeric, onText, onComplete }: { exercise: TitanExercise; exerciseType: ExerciseType; set: ExecutedSet; totalSets: number; onNumeric: (setNumber: number, field: NumericField, value: string) => void; onText: (field: 'averagePace' | 'notes', value: string) => void; onComplete: () => void }) {
  const label = ['cardio', 'mobility'].includes(exerciseType) ? typeLabel(exerciseType) : `Série ${set.setNumber} de ${totalSets}`;
  const numeric = (field: NumericField, title: string, step = '1') => <label>{title}<input aria-label={`${exercise.name} série ${set.setNumber} ${ariaField(field)}`} type="number" inputMode="decimal" min="0" step={step} value={set[field] ?? ''} onChange={(event) => onNumeric(set.setNumber, field, event.target.value)} /></label>;
  return <div className={`set-entry ${set.completed ? 'completed' : ''}`}><div className="set-entry-title"><strong>{label}</strong><span>{set.completed ? 'Concluído' : 'Pendente'}</span></div><div className="set-entry-fields typed-fields">
    {exerciseType === 'strength' && <>{numeric('weightKg', 'Carga (kg)', '0.5')}{numeric('repetitions', 'Repetições')}{numeric('rir', 'RIR')}</>}
    {exerciseType === 'distance' && <>{numeric('weightKg', 'Carga (kg)', '0.5')}{numeric('distanceMeters', 'Distância (m)', '0.5')}</>}
    {exerciseType === 'isometric' && numeric('durationSeconds', 'Tempo (segundos)')}
    {exerciseType === 'mobility' && <>{numeric('durationSeconds', 'Tempo (segundos)')}<label>Observações<textarea aria-label={`${exercise.name} observações`} value={set.notes ?? ''} onChange={(event) => onText('notes', event.target.value)} /></label></>}
    {exerciseType === 'cardio' && <>{numeric('durationSeconds', 'Tempo (segundos)')}{numeric('distanceMeters', 'Distância (m)', '1')}{numeric('speedKmh', 'Velocidade (km/h)', '0.1')}{numeric('inclinePercent', 'Inclinação (%)', '0.5')}<label>Ritmo médio<input aria-label={`${exercise.name} ritmo médio`} value={set.averagePace ?? ''} placeholder="ex.: 6:30/km" onChange={(event) => onText('averagePace', event.target.value)} /></label>{numeric('averageHeartRate', 'FC média (bpm)')}{numeric('calories', 'Calorias')}<label>Observações<textarea aria-label={`${exercise.name} observações`} value={set.notes ?? ''} onChange={(event) => onText('notes', event.target.value)} /></label></>}
  </div><button type="button" className="complete-set-action" aria-pressed={set.completed} onClick={onComplete}>{set.completed ? '✓ Registro concluído' : exerciseType === 'strength' ? 'Registrar série' : `Concluir ${typeLabel(exerciseType).toLowerCase()}`}</button></div>;
}

function Prescription({ exercise }: { exercise: TitanExercise }) {
  const type = resolveExerciseType(exercise); const items: string[] = [];
  if (exercise.sets) items.push(`${exercise.sets} ${exercise.sets === 1 ? 'série' : 'séries'}`);
  if (type === 'strength') items.push(`${exercise.minReps ?? '—'}–${exercise.maxReps ?? '—'} reps`, `RIR ${exercise.targetRir ?? '—'}`);
  if (type === 'distance') items.push(exercise.minDistanceMeters && exercise.maxDistanceMeters ? `${exercise.minDistanceMeters}–${exercise.maxDistanceMeters} m` : `${exercise.distanceMeters ?? '—'} m`);
  if (['cardio', 'isometric', 'mobility'].includes(type)) items.push(formatPlannedDuration(exercise.durationSeconds));
  if (type === 'cardio') { if (exercise.speedMinKmh || exercise.speedMaxKmh) items.push(`${exercise.speedMinKmh ?? exercise.speedKmh}–${exercise.speedMaxKmh ?? exercise.speedKmh} km/h`); if (exercise.inclinePercent !== undefined) items.push(`${exercise.inclinePercent}% inclinação`); if (exercise.cardioZone) items.push(exercise.cardioZone); }
  return <div className="exercise-prescription">{items.map((item) => <span key={item}><strong>{item}</strong></span>)}</div>;
}

function ProgressionPlan({ exercise }: { exercise: TitanExercise }) { return <details className="exercise-details" open><summary>Progressão planejada</summary><div className="progression-list">{exercise.progression?.map((step) => <div key={`${step.startWeek}-${step.endWeek}`}><strong>Semanas {step.startWeek}–{step.endWeek}</strong><span>{formatPlannedDuration(step.durationSeconds)} · {step.inclinePercent ?? '—'}% · {step.speedMinKmh ?? step.speedKmh ?? '—'}–{step.speedMaxKmh ?? step.speedKmh ?? '—'} km/h</span>{step.note && <small>{step.note}</small>}</div>)}</div><p>Os valores planejados podem ser ajustados nos campos da sessão sem alterar o histórico anterior.</p></details>; }

function resolveExerciseType(exercise: TitanExercise): ExerciseType { return exercise.exerciseType ?? 'strength'; }
function typeLabel(type: ExerciseType) { return ({ strength: 'Musculação', distance: 'Distância', cardio: 'Cardio', isometric: 'Isometria', mobility: 'Mobilidade' })[type]; }
function ariaField(field: NumericField) { return ({ weightKg: 'carga', repetitions: 'repetições', rir: 'RIR', durationSeconds: 'tempo', distanceMeters: 'distância', speedKmh: 'velocidade', inclinePercent: 'inclinação', averageHeartRate: 'frequência cardíaca', calories: 'calorias' })[field]; }
function blankSet(setNumber: number, exercise: TitanExercise): ExecutedSet { return { setNumber, weightKg: null, repetitions: null, rir: resolveExerciseType(exercise) === 'strength' ? exercise.targetRir ?? null : null, durationSeconds: exercise.durationSeconds ?? null, distanceMeters: exercise.distanceMeters ?? exercise.minDistanceMeters ?? null, speedKmh: exercise.speedKmh ?? exercise.speedMinKmh ?? null, inclinePercent: exercise.inclinePercent ?? null, averagePace: exercise.averagePace ?? null, averageHeartRate: exercise.averageHeartRate ?? null, calories: exercise.calories ?? null, notes: exercise.notes ?? null, completed: false }; }
function createExecution(planId: string, workout: TitanWorkoutDay): WorkoutExecution { const now = new Date().toISOString(); return { planId, workoutId: workout.id, startedAt: now, updatedAt: now, exercises: Object.fromEntries(workout.exercises.map((exercise) => [exercise.id, { exerciseId: exercise.id, exerciseType: resolveExerciseType(exercise), sets: Array.from({ length: Math.max(1, exercise.sets ?? 1) }, (_, index) => blankSet(index + 1, exercise)) }])) }; }
function normalizeExecution(saved: WorkoutExecution | null, planId: string, workout: TitanWorkoutDay): WorkoutExecution {
  if (!saved) return createExecution(planId, workout);
  const fresh = createExecution(planId, workout);
  for (const exercise of workout.exercises) {
    const previous = saved.exercises?.[exercise.id]; if (!previous) continue;
    fresh.exercises[exercise.id] = { exerciseId: exercise.id, exerciseType: resolveExerciseType(exercise), sets: fresh.exercises[exercise.id].sets.map((fallback, index) => ({ ...fallback, ...(previous.sets?.[index] ?? {}) })) };
  }
  return { ...fresh, startedAt: saved.startedAt ?? fresh.startedAt, updatedAt: saved.updatedAt ?? fresh.updatedAt };
}
function findFirstPendingExercise(workout: TitanWorkoutDay, execution: WorkoutExecution) { const index = workout.exercises.findIndex((exercise) => execution.exercises[exercise.id]?.sets.some((set) => !set.completed)); return index < 0 ? workout.exercises.length - 1 : index; }

function getStrengthSnapshot(history: WorkoutHistoryRecord[], exercise: TitanExercise) {
  const sessions = history
    .flatMap((record) => record.exercises.filter((item) => item.exerciseId === exercise.id).map((item) => ({ exercise: item, completedAt: record.completedAt })))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  if (!sessions.length) return { last: 'Sem histórico', pr: 'Ainda sem PR', target: 'Criar referência inicial' };

  const lastBest = bestStrengthSet(sessions[0].exercise);
  const last = lastBest ? formatStrengthReference(lastBest) : 'Sem carga registrada';
  const pr = findValidPr(sessions);
  const target = buildTodayTarget(lastBest, exercise);
  return { last, pr: pr ? formatStrengthReference(pr) : 'Ainda sem PR', target };
}

function bestStrengthSet(exercise: HistoryExercise): StrengthReference | null {
  const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!valid.length) return null;
  const best = [...valid].sort((a, b) => {
    const scoreA = (a.weightKg ?? 0) * (a.repetitions ?? 0);
    const scoreB = (b.weightKg ?? 0) * (b.repetitions ?? 0);
    return scoreB - scoreA || (b.weightKg ?? 0) - (a.weightKg ?? 0);
  })[0];
  return { weightKg: best.weightKg ?? 0, repetitions: best.repetitions ?? 0 };
}

function findValidPr(sessionsDescending: { exercise: HistoryExercise; completedAt: string }[]): StrengthReference | null {
  const chronological = [...sessionsDescending].reverse();
  let bestWeight = -1;
  let bestScore = -1;
  let validSessions = 0;
  let currentPr: StrengthReference | null = null;

  for (const session of chronological) {
    const best = bestStrengthSet(session.exercise);
    if (!best) continue;
    validSessions += 1;
    const score = best.weightKg * best.repetitions;
    if (validSessions === 1) {
      bestWeight = best.weightKg;
      bestScore = score;
      continue;
    }
    if (best.weightKg > bestWeight || score > bestScore) {
      currentPr = best;
      bestWeight = Math.max(bestWeight, best.weightKg);
      bestScore = Math.max(bestScore, score);
    }
  }
  return currentPr;
}

function buildTodayTarget(last: StrengthReference | null, exercise: TitanExercise) {
  if (!last) return 'Criar referência inicial';
  const minReps = exercise.minReps ?? 6;
  const maxReps = exercise.maxReps ?? Math.max(minReps, last.repetitions + 1);
  if (last.repetitions < maxReps) return `${last.weightKg} kg × ${Math.min(maxReps, last.repetitions + 1)}`;
  return `${formatWeight(last.weightKg + 2.5)} kg × ${minReps}`;
}

function formatStrengthReference(value: StrengthReference) { return `${formatWeight(value.weightKg)} kg × ${value.repetitions}`; }
function formatWeight(value: number) { return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1))); }

function createHistoryRecord(planId: string, planName: string, workout: TitanWorkoutDay, execution: WorkoutExecution, completedAt: string): WorkoutHistoryRecord {
  const exercises = workout.exercises.map((exercise) => {
    const exerciseType = resolveExerciseType(exercise); const sets = execution.exercises[exercise.id].sets.map(({ completed: _completed, ...set }) => set);
    const volumeKg = exerciseType === 'strength' ? sets.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0) : 0;
    const values = (key: keyof ExecutedSet) => sets.map((set) => set[key]).filter((value): value is number => typeof value === 'number');
    const heartRates = values('averageHeartRate');
    return { exerciseId: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup, exerciseType, sets, volumeKg, bestWeightKg: values('weightKg').length ? Math.max(...values('weightKg')) : null, totalDistanceMeters: values('distanceMeters').reduce((a, b) => a + b, 0), totalDurationSeconds: values('durationSeconds').reduce((a, b) => a + b, 0), bestSpeedKmh: values('speedKmh').length ? Math.max(...values('speedKmh')) : null, bestInclinePercent: values('inclinePercent').length ? Math.max(...values('inclinePercent')) : null, averageHeartRate: heartRates.length ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null };
  });
  return { id: `${planId}:${workout.id}:${completedAt}`, planId, planName, workoutId: workout.id, workoutTitle: workout.title, workoutDay: workout.day, startedAt: execution.startedAt, completedAt, durationSeconds: Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)), totalSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0), totalVolumeKg: exercises.reduce((total, exercise) => total + exercise.volumeKg, 0), exercises };
}
function secondsSince(startedAt: string) { return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)); }
function formatTimer(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function formatSessionTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function formatDuration(seconds: number) { const minutes = Math.max(1, Math.round(seconds / 60)); return `${minutes} min`; }
function formatPlannedDuration(seconds?: number) { if (!seconds) return 'Tempo livre'; const minutes = Math.round(seconds / 60); return minutes >= 1 ? `${minutes} min` : `${seconds}s`; }