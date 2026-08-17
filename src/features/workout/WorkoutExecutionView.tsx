import { useEffect, useMemo, useState } from 'react';
import { getProgressionAdvice, sameExerciseIdentity } from '../history/intelligence';
import { addWorkoutHistoryRecord, loadWorkoutHistory } from '../history/storage';
import type { HistoryExercise, WorkoutHistoryRecord } from '../history/types';
import type { ExerciseType, TitanExercise, TitanExerciseAlternative, TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution, removeWorkoutExecution, saveWorkoutExecution } from './storage';
import type { ExecutedSet, ExerciseExecution, WorkoutExecution } from './types';

type Props = { planId: string; planName: string; workout: TitanWorkoutDay; onBack: () => void; onCompleted: () => void };
type WorkoutSummary = { durationSeconds: number; totalVolumeKg: number; totalSets: number; cardioMinutes: number };
type NumericField = 'weightKg' | 'repetitions' | 'rir' | 'durationSeconds' | 'distanceMeters' | 'speedKmh' | 'inclinePercent' | 'averageHeartRate' | 'calories' | 'rpe';
type StrengthReference = { weightKg: number; repetitions: number };
type PrCelebration = { exerciseName: string; reference: StrengthReference };

export function WorkoutExecutionView({ planId, planName, workout, onBack, onCompleted }: Props) {
  const previousHistory = useMemo(() => loadWorkoutHistory(), []);
  const initial = useMemo(() => normalizeExecution(loadWorkoutExecution(planId, workout.id), planId, workout), [planId, workout]);
  const [execution, setExecution] = useState<WorkoutExecution>(initial);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => findFirstPendingExercise(workout, initial));
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(() => initial.timerStartedAt ? secondsSince(initial.timerStartedAt) : 0);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [prCelebration, setPrCelebration] = useState<PrCelebration | null>(null);

  useEffect(() => { saveWorkoutExecution(execution); }, [execution]);
  useEffect(() => {
    if (!execution.timerStartedAt) { setSessionSeconds(0); return; }
    setSessionSeconds(secondsSince(execution.timerStartedAt));
    const interval = window.setInterval(() => setSessionSeconds(secondsSince(execution.timerStartedAt!)), 1000);
    return () => window.clearInterval(interval);
  }, [execution.timerStartedAt]);
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = window.setInterval(() => setTimerSeconds((current) => {
      if (current <= 1) { setTimerRunning(false); navigator.vibrate?.([180, 100, 180]); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerSeconds]);
  useEffect(() => {
    if (!prCelebration) return;
    const timeout = window.setTimeout(() => setPrCelebration(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [prCelebration]);

  const totals = useMemo(() => {
    const exerciseEntries = Object.values(execution.exercises);
    const entries = exerciseEntries.flatMap((exercise) => exercise.sets);
    const completed = entries.filter((set) => set.completed);
    const resolved = exerciseEntries.reduce((total, exercise) => total + (exercise.skipped ? exercise.sets.length : exercise.sets.filter((set) => set.completed).length), 0);
    const volume = completed.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0);
    return { completed: completed.length, resolved, total: entries.length, volume };
  }, [execution]);

  const baseExercise = workout.exercises[activeExerciseIndex];
  const activeExecution = execution.exercises[baseExercise.id];
  const activeExercise = effectiveExercise(baseExercise, activeExecution);
  const availableOptions = exerciseOptions(baseExercise);
  const alternativeSelected = activeExercise.id !== baseExercise.id;
  const exerciseType = resolveExerciseType(activeExercise);
  const activeSets = activeExecution.sets;
  const exerciseSkipped = Boolean(activeExecution.skipped);
  const exerciseCompleted = exerciseSkipped || activeSets.every((set) => set.completed);
  const progress = totals.total ? Math.round((totals.resolved / totals.total) * 100) : 0;
  const strengthSnapshot = useMemo(() => getStrengthSnapshot(previousHistory, activeExercise), [previousHistory, activeExercise]);

  function updateSet(setNumber: number, patch: Partial<ExecutedSet>, executionPatch: Partial<WorkoutExecution> = {}) {
    setExecution((current) => ({ ...current, ...executionPatch, updatedAt: new Date().toISOString(), exercises: { ...current.exercises, [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: false, sets: current.exercises[baseExercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set) } } }));
  }
  function updateNumeric(setNumber: number, field: NumericField, value: string) { updateSet(setNumber, { [field]: value === '' ? null : Number(value) }); }
  function selectExerciseOption(option: TitanExercise) {
    const current = execution.exercises[baseExercise.id];
    if (current.selectedExerciseId === option.id && current.selectedExerciseName === option.name) return;
    const hasRecordedData = current.sets.some(hasRecordedExerciseData);
    if (hasRecordedData && !window.confirm('Já existem séries registradas neste exercício. Trocar a opção irá limpar as séries desta sessão. Deseja continuar?')) return;
    const freshSets = Array.from({ length: Math.max(1, option.sets ?? baseExercise.sets ?? 1) }, (_, index) => blankSet(index + 1, option));
    setExecution((state) => ({
      ...state,
      updatedAt: new Date().toISOString(),
      exercises: {
        ...state.exercises,
        [baseExercise.id]: {
          ...state.exercises[baseExercise.id],
          selectedExerciseId: option.id,
          selectedExerciseName: option.name,
          exerciseType: resolveExerciseType(option),
          skipped: false,
          sets: freshSets,
        },
      },
    }));
    setTimerRunning(false);
    setTimerSeconds(0);
    setPrCelebration(null);
  }
  function completeSet(set: ExecutedSet) {
    const completed = !set.completed;
    if (completed && exerciseType === 'strength') {
      const newPr = detectLivePr(previousHistory, activeExercise.id, activeSets, set);
      if (newPr) {
        setPrCelebration({ exerciseName: activeExercise.name, reference: newPr });
        navigator.vibrate?.([120, 70, 220]);
      }
    }
    const timerStartedAt = completed && !execution.timerStartedAt ? new Date().toISOString() : execution.timerStartedAt;
    updateSet(set.setNumber, { completed }, timerStartedAt ? { timerStartedAt } : {});
    if (completed && (activeExercise.restSeconds ?? 0) > 0) { setTimerSeconds(activeExercise.restSeconds ?? 0); setTimerRunning(true); }
  }
  function skipExercise() {
    const completedSets = activeSets.filter((set) => set.completed).length;
    const message = completedSets > 0
      ? `Pular o restante de "${activeExercise.name}"? As ${completedSets} série(s) já concluída(s) serão mantidas no histórico.`
      : `Pular "${activeExercise.name}" nesta sessão? O exercício ficará sem volume e sem PR.`;
    if (!window.confirm(message)) return;
    setExecution((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      exercises: {
        ...current.exercises,
        [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: true },
      },
    }));
    setTimerRunning(false);
    setTimerSeconds(0);
    setPrCelebration(null);
    if (activeExerciseIndex < workout.exercises.length - 1) {
      setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  function restoreSkippedExercise() {
    setExecution((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      exercises: {
        ...current.exercises,
        [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: false },
      },
    }));
  }
  function nextExercise() { setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function previousExerciseNav() { setActiveExerciseIndex((value) => Math.max(0, value - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function finishWorkout() {
    if (totals.resolved !== totals.total) return;
    const completedAt = new Date().toISOString(); const record = createHistoryRecord(planId, planName, workout, execution, completedAt);
    addWorkoutHistoryRecord(record); removeWorkoutExecution(planId, workout.id); setTimerRunning(false); setTimerSeconds(0);
    const cardioMinutes = record.exercises.filter((exercise) => exercise.exerciseType === 'cardio').reduce((total, exercise) => total + Math.round(exercise.totalDurationSeconds / 60), 0);
    setSummary({ durationSeconds: record.durationSeconds, totalVolumeKg: record.totalVolumeKg, totalSets: record.totalSets, cardioMinutes });
  }
  function resetSession() {
    if (!window.confirm('Apagar todos os registros desta sessão?')) return;
    const next = createExecution(planId, workout); saveWorkoutExecution(next); setExecution(next); setActiveExerciseIndex(0); setTimerRunning(false); setTimerSeconds(0); setSessionSeconds(0); setPrCelebration(null);
  }

  if (summary) return <section className="workout-summary"><span className="eyebrow">TREINO CONCLUÍDO</span><h2>{workout.title}</h2><p>Sessão salva com todas as métricas registradas.</p><div className="summary-grid"><div><span>Tempo</span><strong>{formatDuration(summary.durationSeconds)}</strong></div><div><span>Volume</span><strong>{Math.round(summary.totalVolumeKg).toLocaleString('pt-BR')} kg</strong></div><div><span>Registros</span><strong>{summary.totalSets}</strong></div><div><span>Cardio</span><strong>{summary.cardioMinutes ? `${summary.cardioMinutes} min` : '—'}</strong></div></div><button type="button" className="primary-action" onClick={onCompleted}>Ver progresso</button></section>;

  return <div className="workout-mode">
    {prCelebration && <div className="live-pr-celebration" role="status" aria-live="polite"><span className="live-pr-trophy">🏆</span><div><small>NOVO PR</small><strong>{prCelebration.exerciseName}</strong><span>{formatStrengthReference(prCelebration.reference)}</span></div></div>}
    <button type="button" className="secondary-action back-action" onClick={onBack}>← Sair do modo treino</button>
    <section className="workout-progress-card compact-workout-progress"><div><span className="eyebrow">EXERCÍCIO {activeExerciseIndex + 1} DE {workout.exercises.length}</span><h2>{workout.title}</h2><p>{totals.completed} séries feitas · {totals.resolved} / {totals.total} resolvidas · Tempo {formatSessionTime(sessionSeconds)}</p></div><strong>{progress}%</strong><div className="workout-progress-track"><span style={{ width: `${progress}%` }} /></div></section>
    {timerSeconds > 0 && <section className="rest-timer active" aria-label="Cronômetro de descanso"><div><span className="info-label">DESCANSO AUTOMÁTICO</span><strong>{formatTimer(timerSeconds)}</strong></div><div className="timer-actions"><button type="button" className="secondary-action" onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? 'Pausar' : 'Continuar'}</button><button type="button" className="secondary-action" onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}>Pular</button></div></section>}

    <article className={`active-exercise-card ${exerciseType === 'cardio' ? 'cardio-exercise' : ''}`}>
      <header><span className="exercise-order">{activeExerciseIndex + 1}</span><div><span className="info-label">{activeExercise.muscleGroup} · {typeLabel(exerciseType)}</span><h3>{activeExercise.name}</h3>{alternativeSelected && <small className="alternative-active-label">Alternativa selecionada · histórico próprio</small>}{exerciseSkipped && <small className="workout-skipped-label">PULADO NESTA SESSÃO</small>}</div></header>

      {availableOptions.length > 1 ? <details className="exercise-alternative-picker">
        <summary><span><small>EXERCÍCIO DA SESSÃO</small><strong>{activeExercise.name}</strong></span><b>Trocar</b></summary>
        <div className="exercise-alternative-options">
          {availableOptions.map((option, index) => {
            const selected = activeExercise.id === option.id;
            return <button type="button" className={selected ? 'selected' : ''} key={option.id} onClick={() => selectExerciseOption(option)}><span>{index === 0 ? 'Principal' : 'Alternativa'}</span><strong>{option.name}</strong>{selected && <b>✓</b>}</button>;
          })}
        </div>
        <p>A opção escolhida vale para esta sessão. Peso, histórico e evolução ficam vinculados ao exercício realmente executado.</p>
      </details> : null}

      <Prescription exercise={activeExercise} />
      {exerciseType === 'strength' && <>
        <div className="progression-panel workout-pr-panel">
          <div><span>Última sessão</span><strong>{strengthSnapshot.last}</strong></div>
          <div><span>🏆 PR válido</span><strong>{strengthSnapshot.pr}</strong></div>
          <div><span>Meta de hoje</span><strong>{strengthSnapshot.target}</strong></div>
        </div>
        <div className={`smart-workout-target ${strengthSnapshot.status}`}>
          <div><span className="smart-target-label">COACH TITAN · {strengthSnapshot.statusLabel}</span><strong>{strengthSnapshot.title}</strong></div>
          <p>{strengthSnapshot.message}</p>
        </div>
      </>}
      {activeExercise.technique && <p className="exercise-cue">{activeExercise.technique}</p>}
      {activeExercise.commonMistakes?.length ? <details className="exercise-details"><summary>Erros comuns</summary><ul>{activeExercise.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></details> : null}
      {exerciseType === 'cardio' && activeExercise.progression?.length ? <ProgressionPlan exercise={activeExercise} /> : null}

      {!exerciseSkipped && <div className="set-entry-list">{activeSets.map((set) => <SetEntry key={set.setNumber} exercise={activeExercise} exerciseType={exerciseType} set={set} totalSets={activeSets.length} onNumeric={updateNumeric} onText={(field, value) => updateSet(set.setNumber, { [field]: value || null })} onComplete={() => completeSet(set)} />)}</div>}
      {exerciseSkipped && <div className="workout-skipped-state"><strong>Exercício pulado</strong><span>Não gera séries, volume ou PR para o que não foi executado.</span><button type="button" className="secondary-action" onClick={restoreSkippedExercise}>Voltar e fazer exercício</button></div>}
    </article>

    {!exerciseCompleted && <button type="button" className="workout-skip-exercise" onClick={skipExercise}>Pular exercício</button>}
    {workout.exercises[activeExerciseIndex + 1] && <aside className="next-exercise-preview"><span>Próximo exercício</span><strong>{effectiveExercise(workout.exercises[activeExerciseIndex + 1], execution.exercises[workout.exercises[activeExerciseIndex + 1].id]).name}</strong></aside>}
    <div className="exercise-navigation"><button type="button" className="secondary-action" disabled={activeExerciseIndex === 0} onClick={previousExerciseNav}>Anterior</button>{activeExerciseIndex < workout.exercises.length - 1 ? <button type="button" className="primary-action" disabled={!exerciseCompleted} onClick={nextExercise}>Próximo exercício</button> : <button type="button" className="primary-action" disabled={totals.resolved !== totals.total} onClick={finishWorkout}>Concluir e salvar treino</button>}</div>
    <button type="button" className="danger-action reset-session" onClick={resetSession}>Resetar sessão</button>
  </div>;
}

function SetEntry({ exercise, exerciseType, set, totalSets, onNumeric, onText, onComplete }: { exercise: TitanExercise; exerciseType: ExerciseType; set: ExecutedSet; totalSets: number; onNumeric: (setNumber: number, field: NumericField, value: string) => void; onText: (field: 'averagePace' | 'cardioZone' | 'notes', value: string) => void; onComplete: () => void }) {
  const label = ['cardio', 'mobility'].includes(exerciseType) ? typeLabel(exerciseType) : `Série ${set.setNumber} de ${totalSets}`;
  const numeric = (field: NumericField, title: string, step = '1') => <label>{title}<input aria-label={`${exercise.name} série ${set.setNumber} ${ariaField(field)}`} type="number" inputMode="decimal" min="0" step={step} value={set[field] ?? ''} onChange={(event) => onNumeric(set.setNumber, field, event.target.value)} /></label>;
  return <div className={`set-entry ${set.completed ? 'completed' : ''}`}><div className="set-entry-title"><strong>{label}</strong><span>{set.completed ? 'Concluído' : 'Pendente'}</span></div><div className="set-entry-fields typed-fields">
    {exerciseType === 'strength' && <>{numeric('repetitions', 'Repetições', '1')}{numeric('weightKg', 'Peso (kg)', '0.5')}</>}
    {exerciseType === 'distance' && <>{numeric('weightKg', 'Carga (kg)', '0.5')}{numeric('distanceMeters', 'Distância (m)', '0.5')}</>}
    {exerciseType === 'isometric' && numeric('durationSeconds', 'Tempo (segundos)')}
    {exerciseType === 'mobility' && <>{numeric('durationSeconds', 'Tempo (segundos)')}<label>Observações<textarea aria-label={`${exercise.name} observações`} value={set.notes ?? ''} onChange={(event) => onText('notes', event.target.value)} /></label></>}
    {exerciseType === 'cardio' && <><label>Duração (min)<input aria-label={`${exercise.name} duração em minutos`} type="number" inputMode="decimal" min="0" step="1" value={set.durationSeconds == null ? '' : Number((set.durationSeconds / 60).toFixed(1))} onChange={(event) => onNumeric(set.setNumber, 'durationSeconds', event.target.value === '' ? '' : String(Number(event.target.value) * 60))} /></label>{numeric('distanceMeters', 'Distância (m)', '1')}{numeric('speedKmh', 'Velocidade (km/h)', '0.1')}{numeric('inclinePercent', 'Inclinação (%)', '0.5')}<label>Ritmo médio<input aria-label={`${exercise.name} ritmo médio`} value={set.averagePace ?? ''} placeholder="ex.: 6:30/km" onChange={(event) => onText('averagePace', event.target.value)} /></label><label>Zona realizada<input aria-label={`${exercise.name} zona realizada`} value={set.cardioZone ?? ''} placeholder={exercise.cardioZone ?? 'ex.: Zona 2'} onChange={(event) => onText('cardioZone', event.target.value)} /></label>{numeric('averageHeartRate', 'FC média (bpm)')}<label>RPE (0–10)<input aria-label={`${exercise.name} RPE`} type="number" inputMode="decimal" min="0" max="10" step="1" value={set.rpe ?? ''} onChange={(event) => onNumeric(set.setNumber, 'rpe', event.target.value)} /></label>{numeric('calories', 'Calorias')}<CardioCalculatedSummary set={set} /><label>Observações<textarea aria-label={`${exercise.name} observações`} value={set.notes ?? ''} onChange={(event) => onText('notes', event.target.value)} /></label></>}
  </div><button type="button" className="complete-set-action" aria-pressed={set.completed} disabled={!set.completed && !canCompleteSet(exerciseType, set)} onClick={onComplete}>{set.completed ? '✓ Registro concluído' : exerciseType === 'strength' ? 'Registrar série' : exerciseType === 'cardio' ? 'Registrar cardio' : `Concluir ${typeLabel(exerciseType).toLowerCase()}`}</button></div>;
}

function CardioCalculatedSummary({ set }: { set: ExecutedSet }) {
  const durationHours = (set.durationSeconds ?? 0) / 3600;
  const distanceKm = (set.distanceMeters ?? 0) / 1000;
  const derivedSpeed = durationHours > 0 && distanceKm > 0 ? distanceKm / durationHours : null;
  const paceSecondsPerKm = (set.durationSeconds ?? 0) > 0 && distanceKm > 0 ? (set.durationSeconds ?? 0) / distanceKm : null;
  if (!derivedSpeed && !paceSecondsPerKm) return null;
  const pace = paceSecondsPerKm ? `${Math.floor(paceSecondsPerKm / 60)}:${String(Math.round(paceSecondsPerKm % 60)).padStart(2, '0')}/km` : '—';
  return <div className="cardio-calculated-summary"><span>Média calculada</span><strong>{derivedSpeed ? `${derivedSpeed.toFixed(1)} km/h` : '—'} · {pace}</strong></div>;
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
function ariaField(field: NumericField) { return ({ weightKg: 'carga', repetitions: 'repetições', rir: 'RIR', durationSeconds: 'tempo', distanceMeters: 'distância', speedKmh: 'velocidade', inclinePercent: 'inclinação', averageHeartRate: 'frequência cardíaca', calories: 'calorias', rpe: 'RPE' })[field]; }
function blankSet(setNumber: number, exercise: TitanExercise): ExecutedSet { return { setNumber, weightKg: null, repetitions: null, rir: null, durationSeconds: exercise.durationSeconds ?? null, distanceMeters: exercise.distanceMeters ?? exercise.minDistanceMeters ?? null, speedKmh: exercise.speedKmh ?? exercise.speedMinKmh ?? null, inclinePercent: exercise.inclinePercent ?? null, averagePace: exercise.averagePace ?? null, averageHeartRate: exercise.averageHeartRate ?? null, calories: exercise.calories ?? null, rpe: null, cardioZone: exercise.cardioZone ?? null, notes: exercise.notes ?? null, completed: false }; }
function createExecution(planId: string, workout: TitanWorkoutDay): WorkoutExecution { const now = new Date().toISOString(); return { planId, workoutId: workout.id, startedAt: now, updatedAt: now, exercises: Object.fromEntries(workout.exercises.map((exercise) => [exercise.id, { exerciseId: exercise.id, exerciseType: resolveExerciseType(exercise), selectedExerciseId: exercise.id, selectedExerciseName: exercise.name, sets: Array.from({ length: Math.max(1, exercise.sets ?? 1) }, (_, index) => blankSet(index + 1, exercise)) }])) }; }
function normalizeExecution(saved: WorkoutExecution | null, planId: string, workout: TitanWorkoutDay): WorkoutExecution {
  if (!saved) return createExecution(planId, workout);
  const fresh = createExecution(planId, workout);
  for (const exercise of workout.exercises) {
    const previous = saved.exercises?.[exercise.id]; if (!previous) continue;
    const selected = effectiveExercise(exercise, previous);
    const fallbackSets = Array.from({ length: Math.max(1, selected.sets ?? exercise.sets ?? 1) }, (_, index) => blankSet(index + 1, selected));
    fresh.exercises[exercise.id] = { exerciseId: exercise.id, exerciseType: resolveExerciseType(selected), selectedExerciseId: selected.id, selectedExerciseName: selected.name, skipped: Boolean(previous.skipped), sets: fallbackSets.map((fallback, index) => ({ ...fallback, ...(previous.sets?.[index] ?? {}) })) };
  }
  const hasCompletedSet = Object.values(saved.exercises ?? {}).some((item) => item.sets?.some((set) => set.completed));
  return { ...fresh, startedAt: saved.startedAt ?? fresh.startedAt, timerStartedAt: saved.timerStartedAt ?? (hasCompletedSet ? saved.startedAt : undefined), updatedAt: saved.updatedAt ?? fresh.updatedAt };
}
function findFirstPendingExercise(workout: TitanWorkoutDay, execution: WorkoutExecution) { const index = workout.exercises.findIndex((exercise) => { const entry = execution.exercises[exercise.id]; return entry && !entry.skipped && entry.sets.some((set) => !set.completed); }); return index < 0 ? workout.exercises.length - 1 : index; }
function resolveStructuredAlternative(base: TitanExercise, alternative: TitanExerciseAlternative): TitanExercise {
  return { ...base, ...alternative, muscleGroup: alternative.muscleGroup ?? base.muscleGroup, alternatives: undefined, alternativeExercises: undefined };
}
function legacyAlternative(base: TitanExercise, name: string): TitanExercise {
  return { ...base, id: alternativeExerciseId(base.id, name), name, technique: undefined, commonMistakes: undefined, alternatives: undefined, alternativeExercises: undefined };
}
function exerciseOptions(base: TitanExercise): TitanExercise[] {
  const structured = (base.alternativeExercises ?? []).map((alternative) => resolveStructuredAlternative(base, alternative));
  const structuredNames = new Set(structured.map((item) => item.name.toLowerCase()));
  const legacy = (base.alternatives ?? []).filter((name) => !structuredNames.has(name.toLowerCase())).map((name) => legacyAlternative(base, name));
  return [base, ...structured, ...legacy];
}
function effectiveExercise(base: TitanExercise, execution?: ExerciseExecution): TitanExercise {
  const selectedId = execution?.selectedExerciseId ?? base.id; const selectedName = execution?.selectedExerciseName ?? base.name;
  return exerciseOptions(base).find((option) => option.id === selectedId) ?? exerciseOptions(base).find((option) => option.name === selectedName) ?? (selectedId === base.id ? base : legacyAlternative(base, selectedName));
}
function alternativeExerciseId(baseId: string, name: string) { const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); return `${baseId}::alt::${slug || 'alternativa'}`; }
function hasRecordedExerciseData(set: ExecutedSet) { return set.completed || set.weightKg !== null || set.repetitions !== null || set.rir !== null || set.durationSeconds !== null || set.distanceMeters !== null || set.speedKmh !== null || set.averageHeartRate !== null || set.rpe !== null || Boolean(set.averagePace) || Boolean(set.cardioZone) || Boolean(set.notes); }
function canCompleteSet(exerciseType: ExerciseType, set: ExecutedSet) {
  if (exerciseType === 'strength') return (set.repetitions ?? 0) > 0 && set.weightKg !== null && set.weightKg >= 0;
  if (exerciseType === 'cardio') return (set.durationSeconds ?? 0) > 0;
  if (exerciseType === 'distance') return (set.distanceMeters ?? 0) > 0;
  if (exerciseType === 'isometric' || exerciseType === 'mobility') return (set.durationSeconds ?? 0) > 0;
  return true;
}

function getStrengthSnapshot(history: WorkoutHistoryRecord[], exercise: TitanExercise) {
  const sessions = getStrengthSessions(history, exercise.id);
  const advice = getProgressionAdvice(history, exercise.id, { minReps: exercise.minReps, maxReps: exercise.maxReps, targetRir: exercise.targetRir });
  if (!sessions.length) return { last: 'Sem histórico', pr: 'Ainda sem PR', target: 'Criar referência inicial', status: 'insufficient', statusLabel: 'CRIANDO BASE', title: advice.title, message: advice.message };

  const lastBest = bestStrengthSet(sessions[0].exercise);
  const last = lastBest ? formatStrengthReference(lastBest) : 'Sem carga registrada';
  const pr = findValidPr(sessions);
  const target = buildSmartTodayTarget(advice.suggestedWeightKg, advice.suggestedReps, advice.status, lastBest, exercise);
  return { last, pr: pr ? formatStrengthReference(pr) : 'Ainda sem PR', target, status: advice.status, statusLabel: statusLabel(advice.status), title: advice.title, message: advice.message };
}

function getStrengthSessions(history: WorkoutHistoryRecord[], exerciseId: string) {
  return history
    .flatMap((record) => record.exercises.filter((item) => sameExerciseIdentity(item.exerciseId, exerciseId)).map((item) => ({ exercise: item, completedAt: record.completedAt })))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

function bestStrengthSet(exercise: HistoryExercise): StrengthReference | null {
  const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!valid.length) return null;
  const best = [...valid].sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0) || (b.repetitions ?? 0) - (a.repetitions ?? 0))[0];
  return { weightKg: best.weightKg ?? 0, repetitions: best.repetitions ?? 0 };
}

function findValidPr(sessionsDescending: { exercise: HistoryExercise; completedAt: string }[]): StrengthReference | null {
  let currentPr: StrengthReference | null = null;
  for (const session of sessionsDescending) {
    const best = bestStrengthSet(session.exercise);
    if (best && isBetterStrengthReference(best, currentPr)) currentPr = best;
  }
  return currentPr;
}

function detectLivePr(history: WorkoutHistoryRecord[], exerciseId: string, currentSets: ExecutedSet[], candidateSet: ExecutedSet): StrengthReference | null {
  const sessions = getStrengthSessions(history, exerciseId);
  if (!sessions.length) return null;
  const candidate = toStrengthReference(candidateSet);
  if (!candidate) return null;

  let currentPr = findValidPr(sessions);
  for (const set of currentSets) {
    if (!set.completed || set.setNumber === candidateSet.setNumber) continue;
    const completed = toStrengthReference(set);
    if (completed && isBetterStrengthReference(completed, currentPr)) currentPr = completed;
  }
  return isBetterStrengthReference(candidate, currentPr) ? candidate : null;
}

function toStrengthReference(set: ExecutedSet): StrengthReference | null {
  if ((set.weightKg ?? 0) <= 0 || (set.repetitions ?? 0) <= 0) return null;
  return { weightKg: set.weightKg ?? 0, repetitions: set.repetitions ?? 0 };
}

function isBetterStrengthReference(candidate: StrengthReference, current: StrengthReference | null) {
  return !current || candidate.weightKg > current.weightKg || (candidate.weightKg === current.weightKg && candidate.repetitions > current.repetitions);
}

function buildSmartTodayTarget(suggestedWeightKg: number | null, suggestedReps: number | null, status: 'insufficient' | 'maintain' | 'progress' | 'review', last: StrengthReference | null, exercise: TitanExercise) {
  if (!last || status === 'insufficient') return 'Criar referência inicial';
  const minReps = exercise.minReps ?? 6;
  const maxReps = exercise.maxReps ?? Math.max(minReps, last.repetitions + 1);
  const weight = suggestedWeightKg ?? last.weightKg;
  if (status === 'progress') return `${formatWeight(weight)} kg × ${minReps}–${Math.min(maxReps, minReps + 1)}`;
  if (suggestedReps) return `${formatWeight(weight)} kg × ${Math.max(minReps, Math.min(maxReps, suggestedReps))}`;
  if (status === 'review') return `${formatWeight(weight)} kg · ${minReps}–${maxReps} reps`;
  return `${formatWeight(weight)} kg × ${Math.max(minReps, Math.min(maxReps, last.repetitions))}–${maxReps}`;
}
function statusLabel(status: 'insufficient' | 'maintain' | 'progress' | 'review') { return ({ insufficient: 'CRIANDO BASE', maintain: 'CONSOLIDAR', progress: 'PROGREDIR', review: 'REVISAR' })[status]; }

function formatStrengthReference(value: StrengthReference) { return `${formatWeight(value.weightKg)} kg × ${value.repetitions}`; }
function formatWeight(value: number) { return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1))); }

function createHistoryRecord(planId: string, planName: string, workout: TitanWorkoutDay, execution: WorkoutExecution, completedAt: string): WorkoutHistoryRecord {
  const exercises = workout.exercises.flatMap((exercise) => {
    const exerciseExecution = execution.exercises[exercise.id];
    const selectedExercise = effectiveExercise(exercise, exerciseExecution);
    const completedSets = exerciseExecution.sets.filter((set) => set.completed);
    if (exerciseExecution.skipped && completedSets.length === 0) return [];
    const exerciseType = resolveExerciseType(selectedExercise); const sets = completedSets.map(({ completed: _completed, ...set }) => set);
    const volumeKg = exerciseType === 'strength' ? sets.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0) : 0;
    const values = (key: keyof ExecutedSet) => sets.map((set) => set[key]).filter((value): value is number => typeof value === 'number');
    const heartRates = values('averageHeartRate');
    return [{ exerciseId: selectedExercise.id, name: selectedExercise.name, muscleGroup: selectedExercise.muscleGroup, exerciseType, sets, volumeKg, bestWeightKg: values('weightKg').length ? Math.max(...values('weightKg')) : null, totalDistanceMeters: values('distanceMeters').reduce((a, b) => a + b, 0), totalDurationSeconds: values('durationSeconds').reduce((a, b) => a + b, 0), bestSpeedKmh: values('speedKmh').length ? Math.max(...values('speedKmh')) : null, bestInclinePercent: values('inclinePercent').length ? Math.max(...values('inclinePercent')) : null, averageHeartRate: heartRates.length ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null }];
  });
  const effectiveStartedAt = execution.timerStartedAt ?? completedAt;
  return { id: `${planId}:${workout.id}:${completedAt}`, planId, planName, workoutId: workout.id, workoutTitle: workout.title, workoutDay: workout.day, startedAt: effectiveStartedAt, completedAt, durationSeconds: Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(effectiveStartedAt).getTime()) / 1000)), totalSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0), totalVolumeKg: exercises.reduce((total, exercise) => total + exercise.volumeKg, 0), exercises };
}
function secondsSince(startedAt: string) { return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)); }
function formatTimer(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function formatSessionTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function formatDuration(seconds: number) { const minutes = Math.max(1, Math.round(seconds / 60)); return `${minutes} min`; }
function formatPlannedDuration(seconds?: number) { if (!seconds) return 'Tempo livre'; const minutes = Math.round(seconds / 60); return minutes >= 1 ? `${minutes} min` : `${seconds}s`; }
