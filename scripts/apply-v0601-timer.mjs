import fs from 'node:fs';

function replace(path, before, after) {
  const text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(`Marker not found in ${path}: ${before.slice(0, 100)}`);
  fs.writeFileSync(path, text.replace(before, after));
}

replace('src/features/workout/types.ts',
  '  startedAt: string;\n  updatedAt: string;',
  '  startedAt: string;\n  timerStartedAt?: string;\n  updatedAt: string;'
);

replace('src/features/workout/WorkoutExecutionView.tsx',
  "  const [sessionSeconds, setSessionSeconds] = useState(() => secondsSince(initial.startedAt));",
  "  const [sessionSeconds, setSessionSeconds] = useState(() => initial.timerStartedAt ? secondsSince(initial.timerStartedAt) : 0);"
);

replace('src/features/workout/WorkoutExecutionView.tsx',
  "  useEffect(() => { const interval = window.setInterval(() => setSessionSeconds(secondsSince(execution.startedAt)), 1000); return () => window.clearInterval(interval); }, [execution.startedAt]);",
  "  useEffect(() => {\n    if (!execution.timerStartedAt) { setSessionSeconds(0); return; }\n    setSessionSeconds(secondsSince(execution.timerStartedAt));\n    const interval = window.setInterval(() => setSessionSeconds(secondsSince(execution.timerStartedAt!)), 1000);\n    return () => window.clearInterval(interval);\n  }, [execution.timerStartedAt]);"
);

replace('src/features/workout/WorkoutExecutionView.tsx',
  "  function updateSet(setNumber: number, patch: Partial<ExecutedSet>) {\n    setExecution((current) => ({ ...current, updatedAt: new Date().toISOString(), exercises: { ...current.exercises, [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: false, sets: current.exercises[baseExercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set) } } }));\n  }",
  "  function updateSet(setNumber: number, patch: Partial<ExecutedSet>, executionPatch: Partial<WorkoutExecution> = {}) {\n    setExecution((current) => ({ ...current, ...executionPatch, updatedAt: new Date().toISOString(), exercises: { ...current.exercises, [baseExercise.id]: { ...current.exercises[baseExercise.id], skipped: false, sets: current.exercises[baseExercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set) } } }));\n  }"
);

replace('src/features/workout/WorkoutExecutionView.tsx',
  "    updateSet(set.setNumber, { completed });",
  "    const timerStartedAt = completed && !execution.timerStartedAt ? new Date().toISOString() : execution.timerStartedAt;\n    updateSet(set.setNumber, { completed }, timerStartedAt ? { timerStartedAt } : {});"
);

replace('src/features/workout/WorkoutExecutionView.tsx',
  "  return { ...fresh, startedAt: saved.startedAt ?? fresh.startedAt, updatedAt: saved.updatedAt ?? fresh.updatedAt };",
  "  const hasCompletedSet = Object.values(saved.exercises ?? {}).some((item) => item.sets?.some((set) => set.completed));\n  return { ...fresh, startedAt: saved.startedAt ?? fresh.startedAt, timerStartedAt: saved.timerStartedAt ?? (hasCompletedSet ? saved.startedAt : undefined), updatedAt: saved.updatedAt ?? fresh.updatedAt };"
);

replace('src/features/workout/WorkoutExecutionView.tsx',
  "  return { id: `${planId}:${workout.id}:${completedAt}`, planId, planName, workoutId: workout.id, workoutTitle: workout.title, workoutDay: workout.day, startedAt: execution.startedAt, completedAt, durationSeconds: Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)), totalSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0), totalVolumeKg: exercises.reduce((total, exercise) => total + exercise.volumeKg, 0), exercises };",
  "  const effectiveStartedAt = execution.timerStartedAt ?? completedAt;\n  return { id: `${planId}:${workout.id}:${completedAt}`, planId, planName, workoutId: workout.id, workoutTitle: workout.title, workoutDay: workout.day, startedAt: effectiveStartedAt, completedAt, durationSeconds: Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(effectiveStartedAt).getTime()) / 1000)), totalSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0), totalVolumeKg: exercises.reduce((total, exercise) => total + exercise.volumeKg, 0), exercises };"
);

let test = fs.readFileSync('tests/WorkoutExecutionView.test.tsx', 'utf8');
const anchor = "  it('registra repetições e peso por série', () => {";
const newTest = `  it('inicia o cronômetro da sessão somente no primeiro registro válido', () => {\n    vi.useFakeTimers();\n    vi.setSystemTime(new Date('2026-08-17T20:00:00.000Z'));\n    render(<WorkoutExecutionView planId=\"plan-timer\" planName=\"Plano A\" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);\n    expect(screen.getByText(/Tempo 00:00/i)).toBeInTheDocument();\n    vi.setSystemTime(new Date('2026-08-17T20:05:00.000Z'));\n    vi.advanceTimersByTime(1000);\n    expect(screen.getByText(/Tempo 00:00/i)).toBeInTheDocument();\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);\n    vi.setSystemTime(new Date('2026-08-17T20:05:10.000Z'));\n    vi.advanceTimersByTime(1000);\n    expect(screen.getByText(/Tempo 00:10/i)).toBeInTheDocument();\n    vi.useRealTimers();\n  });\n\n`;
if (!test.includes(newTest.trim())) test = test.replace(anchor, newTest + anchor);
fs.writeFileSync('tests/WorkoutExecutionView.test.tsx', test);

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '0.60.1';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
lock.version = '0.60.1';
if (lock.packages?.['']) lock.packages[''].version = '0.60.1';
fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');

let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n';
const section = `\n## v0.60.1 — Cronômetro real do treino\n- Abrir o modo treino não inicia mais o cronômetro da sessão.\n- O tempo começa somente quando o primeiro registro válido da sessão é concluído.\n- Retomar um treino iniciado preserva o instante real do primeiro registro.\n- O tempo salvo no histórico passa a usar esse mesmo início real, sem contabilizar espera antes da primeira série.\n`;
if (!changelog.includes('## v0.60.1 — Cronômetro real do treino')) changelog = changelog.replace(marker, marker + section);
fs.writeFileSync('CHANGELOG.md', changelog);

// Trigger validation after workflow exists.
