import fs from 'node:fs';

const file = 'src/features/workout/WorkoutExecutionView.tsx';
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(from, to, label) {
  if (!source.includes(from)) throw new Error(`Patch point not found: ${label}`);
  source = source.replace(from, to);
}

replaceOnce(
`  const totals = useMemo(() => {\n    const entries = Object.values(execution.exercises).flatMap((exercise) => exercise.sets);\n    const completed = entries.filter((set) => set.completed);\n    const volume = completed.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0);\n    return { completed: completed.length, total: entries.length, volume };\n  }, [execution]);`,
`  const totals = useMemo(() => {\n    const exerciseEntries = Object.values(execution.exercises);\n    const entries = exerciseEntries.flatMap((exercise) => exercise.sets);\n    const completed = entries.filter((set) => set.completed);\n    const resolved = exerciseEntries.reduce((total, exercise) => total + (exercise.skipped ? exercise.sets.length : exercise.sets.filter((set) => set.completed).length), 0);\n    const volume = completed.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0);\n    return { completed: completed.length, resolved, total: entries.length, volume };\n  }, [execution]);`,
'workout totals');

replaceOnce(
`  const activeSets = activeExecution.sets;\n  const exerciseCompleted = activeSets.every((set) => set.completed);\n  const progress = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;`,
`  const activeSets = activeExecution.sets;\n  const exerciseSkipped = Boolean(activeExecution.skipped);\n  const exerciseCompleted = exerciseSkipped || activeSets.every((set) => set.completed);\n  const progress = totals.total ? Math.round((totals.resolved / totals.total) * 100) : 0;`,
'exercise status');

replaceOnce(
`    setExecution((current) => ({ ...current, updatedAt: new Date().toISOString(), exercises: { ...current.exercises, [baseExercise.id]: { ...current.exercises[baseExercise.id], sets: current.exercises[baseExercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set) } } }));`,
`    setExecution((current) => ({ ...current, updatedAt: new Date().toISOString(), exercises: { ...current.exercises, [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: false, sets: current.exercises[baseExercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set) } } }));`,
'editing restores skipped exercise');

replaceOnce(
`          exerciseType: resolveExerciseType(option),\n          sets: freshSets,`,
`          exerciseType: resolveExerciseType(option),\n          skipped: false,\n          sets: freshSets,`,
'alternative restores skipped exercise');

replaceOnce(
`  function nextExercise() { setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }`,
`  function skipExercise() {\n    const completedSets = activeSets.filter((set) => set.completed).length;\n    const message = completedSets > 0\n      ? \`Pular o restante de \\"\${activeExercise.name}\\"? As \${completedSets} série(s) já concluída(s) serão mantidas no histórico.\`\n      : \`Pular \\"\${activeExercise.name}\\" nesta sessão? O exercício ficará sem volume e sem PR.\`;\n    if (!window.confirm(message)) return;\n    setExecution((current) => ({\n      ...current,\n      updatedAt: new Date().toISOString(),\n      exercises: {\n        ...current.exercises,\n        [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: true },\n      },\n    }));\n    setTimerRunning(false);\n    setTimerSeconds(0);\n    setPrCelebration(null);\n    if (activeExerciseIndex < workout.exercises.length - 1) {\n      setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1));\n      window.scrollTo({ top: 0, behavior: 'smooth' });\n    }\n  }\n  function restoreSkippedExercise() {\n    setExecution((current) => ({\n      ...current,\n      updatedAt: new Date().toISOString(),\n      exercises: {\n        ...current.exercises,\n        [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: false },\n      },\n    }));\n  }\n  function nextExercise() { setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }`,
'skip exercise actions');

replaceOnce(
`    if (totals.completed !== totals.total) return;`,
`    if (totals.resolved !== totals.total) return;`,
'finish workout guard');

replaceOnce(
`    <section className="workout-progress-card compact-workout-progress"><div><span className="eyebrow">EXERCÍCIO {activeExerciseIndex + 1} DE {workout.exercises.length}</span><h2>{workout.title}</h2><p>{totals.completed} / {totals.total} concluídos · Tempo {formatSessionTime(sessionSeconds)}</p></div><strong>{progress}%</strong><div className="workout-progress-track"><span style={{ width: \`\${progress}%\` }} /></div></section>`,
`    <section className="workout-progress-card compact-workout-progress"><div><span className="eyebrow">EXERCÍCIO {activeExerciseIndex + 1} DE {workout.exercises.length}</span><h2>{workout.title}</h2><p>{totals.completed} séries feitas · {totals.resolved} / {totals.total} resolvidas · Tempo {formatSessionTime(sessionSeconds)}</p></div><strong>{progress}%</strong><div className="workout-progress-track"><span style={{ width: \`\${progress}%\` }} /></div></section>`,
'progress copy');

replaceOnce(
`      <header><span className="exercise-order">{activeExerciseIndex + 1}</span><div><span className="info-label">{activeExercise.muscleGroup} · {typeLabel(exerciseType)}</span><h3>{activeExercise.name}</h3>{alternativeSelected && <small className="alternative-active-label">Alternativa selecionada · histórico próprio</small>}</div></header>`,
`      <header><span className="exercise-order">{activeExerciseIndex + 1}</span><div><span className="info-label">{activeExercise.muscleGroup} · {typeLabel(exerciseType)}</span><h3>{activeExercise.name}</h3>{alternativeSelected && <small className="alternative-active-label">Alternativa selecionada · histórico próprio</small>}{exerciseSkipped && <small className="workout-skipped-label">PULADO NESTA SESSÃO</small>}</div></header>`,
'skipped label');

replaceOnce(
`      {!videoIsRequired && <div className="set-entry-list">{activeSets.map((set) => <SetEntry key={set.setNumber} exercise={activeExercise} exerciseType={exerciseType} set={set} totalSets={activeSets.length} onNumeric={updateNumeric} onText={(field, value) => updateSet(set.setNumber, { [field]: value || null })} onComplete={() => completeSet(set)} />)}</div>}\n    </article>`,
`      {!exerciseSkipped && !videoIsRequired && <div className="set-entry-list">{activeSets.map((set) => <SetEntry key={set.setNumber} exercise={activeExercise} exerciseType={exerciseType} set={set} totalSets={activeSets.length} onNumeric={updateNumeric} onText={(field, value) => updateSet(set.setNumber, { [field]: value || null })} onComplete={() => completeSet(set)} />)}</div>}\n      {exerciseSkipped && <div className="workout-skipped-state"><strong>Exercício pulado</strong><span>Não gera séries, volume ou PR para o que não foi executado.</span><button type="button" className="secondary-action" onClick={restoreSkippedExercise}>Voltar e fazer exercício</button></div>}\n    </article>`,
'skipped state');

replaceOnce(
`    {workout.exercises[activeExerciseIndex + 1] && <aside className="next-exercise-preview"><span>Próximo exercício</span><strong>{effectiveExercise(workout.exercises[activeExerciseIndex + 1], execution.exercises[workout.exercises[activeExerciseIndex + 1].id]).name}</strong></aside>}\n    <div className="exercise-navigation"><button type="button" className="secondary-action" disabled={activeExerciseIndex === 0} onClick={previousExerciseNav}>Anterior</button>{activeExerciseIndex < workout.exercises.length - 1 ? <button type="button" className="primary-action" disabled={!exerciseCompleted} onClick={nextExercise}>Próximo exercício</button> : <button type="button" className="primary-action" disabled={totals.completed !== totals.total} onClick={finishWorkout}>Concluir e salvar treino</button>}</div>`,
`    {!exerciseCompleted && <button type="button" className="workout-skip-exercise" onClick={skipExercise}>Pular exercício · sem tempo</button>}\n    {workout.exercises[activeExerciseIndex + 1] && <aside className="next-exercise-preview"><span>Próximo exercício</span><strong>{effectiveExercise(workout.exercises[activeExerciseIndex + 1], execution.exercises[workout.exercises[activeExerciseIndex + 1].id]).name}</strong></aside>}\n    <div className="exercise-navigation"><button type="button" className="secondary-action" disabled={activeExerciseIndex === 0} onClick={previousExerciseNav}>Anterior</button>{activeExerciseIndex < workout.exercises.length - 1 ? <button type="button" className="primary-action" disabled={!exerciseCompleted} onClick={nextExercise}>Próximo exercício</button> : <button type="button" className="primary-action" disabled={totals.resolved !== totals.total} onClick={finishWorkout}>Concluir e salvar treino</button>}</div>`,
'navigation skip action');

replaceOnce(
`    fresh.exercises[exercise.id] = { exerciseId: exercise.id, exerciseType: resolveExerciseType(selected), selectedExerciseId: selected.id, selectedExerciseName: selected.name, sets: fallbackSets.map((fallback, index) => ({ ...fallback, ...(previous.sets?.[index] ?? {}) })) };`,
`    fresh.exercises[exercise.id] = { exerciseId: exercise.id, exerciseType: resolveExerciseType(selected), selectedExerciseId: selected.id, selectedExerciseName: selected.name, skipped: Boolean(previous.skipped), sets: fallbackSets.map((fallback, index) => ({ ...fallback, ...(previous.sets?.[index] ?? {}) })) };`,
'normalize skipped state');

replaceOnce(
`function findFirstPendingExercise(workout: TitanWorkoutDay, execution: WorkoutExecution) { const index = workout.exercises.findIndex((exercise) => execution.exercises[exercise.id]?.sets.some((set) => !set.completed)); return index < 0 ? workout.exercises.length - 1 : index; }`,
`function findFirstPendingExercise(workout: TitanWorkoutDay, execution: WorkoutExecution) { const index = workout.exercises.findIndex((exercise) => { const entry = execution.exercises[exercise.id]; return entry && !entry.skipped && entry.sets.some((set) => !set.completed); }); return index < 0 ? workout.exercises.length - 1 : index; }`,
'pending exercise finder');

replaceOnce(
`  const exercises = workout.exercises.map((exercise) => {\n    const exerciseExecution = execution.exercises[exercise.id];\n    const selectedExercise = effectiveExercise(exercise, exerciseExecution);\n    const exerciseType = resolveExerciseType(selectedExercise); const sets = exerciseExecution.sets.map(({ completed: _completed, ...set }) => set);`,
`  const exercises = workout.exercises.flatMap((exercise) => {\n    const exerciseExecution = execution.exercises[exercise.id];\n    const selectedExercise = effectiveExercise(exercise, exerciseExecution);\n    const completedSets = exerciseExecution.sets.filter((set) => set.completed);\n    if (exerciseExecution.skipped && completedSets.length === 0) return [];\n    const exerciseType = resolveExerciseType(selectedExercise); const sets = completedSets.map(({ completed: _completed, ...set }) => set);`,
'history excludes unperformed skipped exercises');

replaceOnce(
`    return { exerciseId: selectedExercise.id, name: selectedExercise.name, muscleGroup: selectedExercise.muscleGroup, exerciseType, sets, volumeKg, bestWeightKg: values('weightKg').length ? Math.max(...values('weightKg')) : null, totalDistanceMeters: values('distanceMeters').reduce((a, b) => a + b, 0), totalDurationSeconds: values('durationSeconds').reduce((a, b) => a + b, 0), bestSpeedKmh: values('speedKmh').length ? Math.max(...values('speedKmh')) : null, bestInclinePercent: values('inclinePercent').length ? Math.max(...values('inclinePercent')) : null, averageHeartRate: heartRates.length ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null };\n  });`,
`    return [{ exerciseId: selectedExercise.id, name: selectedExercise.name, muscleGroup: selectedExercise.muscleGroup, exerciseType, sets, volumeKg, bestWeightKg: values('weightKg').length ? Math.max(...values('weightKg')) : null, totalDistanceMeters: values('distanceMeters').reduce((a, b) => a + b, 0), totalDurationSeconds: values('durationSeconds').reduce((a, b) => a + b, 0), bestSpeedKmh: values('speedKmh').length ? Math.max(...values('speedKmh')) : null, bestInclinePercent: values('inclinePercent').length ? Math.max(...values('inclinePercent')) : null, averageHeartRate: heartRates.length ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null }];\n  });`,
'history flatMap return');

fs.writeFileSync(file, source);

const typesFile = 'src/features/workout/types.ts';
let types = fs.readFileSync(typesFile, 'utf8');
const typeNeedle = `  selectedExerciseName?: string;\n  sets: ExecutedSet[];`;
if (!types.includes(typeNeedle)) throw new Error('Type patch point not found');
types = types.replace(typeNeedle, `  selectedExerciseName?: string;\n  skipped?: boolean;\n  sets: ExecutedSet[];`);
fs.writeFileSync(typesFile, types);

const cssFile = 'src/styles/workout-mode-v038.css';
fs.appendFileSync(cssFile, `\n.workout-skip-exercise{width:100%;min-height:44px;border:1px dashed #d5a25a;border-radius:15px;background:#fffaf3;color:#9a5b14;font:inherit;font-weight:800}.workout-skipped-label{display:inline-flex;margin-top:5px;padding:4px 7px;border-radius:999px;background:#fff0df;color:#a45a17;font-size:10px;font-weight:900;letter-spacing:.05em}.workout-skipped-state{display:grid;gap:7px;margin-top:14px;padding:14px;border-radius:16px;background:#fffaf3;border:1px solid #f0d9b8}.workout-skipped-state span{color:var(--text-muted,#68707d);font-size:12px;line-height:1.4}\n`);

console.log('Workout skip patch applied successfully.');
// trigger: 2026-08-10
