import fs from 'node:fs';

function replace(path, before, after) {
  const text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(`Marker not found in ${path}: ${before.slice(0, 120)}`);
  fs.writeFileSync(path, text.replace(before, after));
}

// 1) History intelligence: canonical exercise identity + PR criteria aligned to load/reps.
const intelligencePath = 'src/features/history/intelligence.ts';
let intelligence = fs.readFileSync(intelligencePath, 'utf8');
intelligence = intelligence.replace(
`export function getExerciseSessions(records: WorkoutHistoryRecord[], exerciseId: string) {
  return records.flatMap((record) => record.exercises
    .filter((exercise) => exercise.exerciseId === exerciseId)
    .map((exercise) => ({ exercise, completedAt: record.completedAt })))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}`,
`export function canonicalExerciseId(exerciseId: string) {
  const marker = exerciseId.indexOf('--workout-');
  return marker >= 0 ? exerciseId.slice(0, marker) : exerciseId;
}

export function sameExerciseIdentity(leftId: string, rightId: string) {
  return leftId === rightId || canonicalExerciseId(leftId) === canonicalExerciseId(rightId);
}

export function getExerciseSessions(records: WorkoutHistoryRecord[], exerciseId: string) {
  return records.flatMap((record) => record.exercises
    .filter((exercise) => sameExerciseIdentity(exercise.exerciseId, exerciseId))
    .map((exercise) => ({ exercise, completedAt: record.completedAt })))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}`
);
intelligence = intelligence.replace(
`      const estimatedVolumeKg = weightKg * repetitions;
      if (!bestSet || estimatedVolumeKg > bestSet.estimatedVolumeKg || (estimatedVolumeKg === bestSet.estimatedVolumeKg && weightKg > bestSet.weightKg)) bestSet = { weightKg, repetitions, estimatedVolumeKg };`,
`      const estimatedVolumeKg = weightKg * repetitions;
      if (!bestSet || weightKg > bestSet.weightKg || (weightKg === bestSet.weightKg && repetitions > bestSet.repetitions)) bestSet = { weightKg, repetitions, estimatedVolumeKg };`
);
intelligence = intelligence.replace(
`  const catalogExercise = TITAN_COMPLETE_EXERCISE_CATALOG.find((exercise) => exercise.id === exerciseId);`,
`  const catalogExercise = TITAN_COMPLETE_EXERCISE_CATALOG.find((exercise) => sameExerciseIdentity(exercise.id, exerciseId));`
);
fs.writeFileSync(intelligencePath, intelligence);

// 2) Workout screen: first valid historical session is already a PR, and identity survives project revisions.
const workoutPath = 'src/features/workout/WorkoutExecutionView.tsx';
let workout = fs.readFileSync(workoutPath, 'utf8');
workout = workout.replace(
`import { getProgressionAdvice } from '../history/intelligence';`,
`import { getProgressionAdvice, sameExerciseIdentity } from '../history/intelligence';`
);
workout = workout.replace(
`  const advice = getProgressionAdvice(history, exercise.id);`,
`  const advice = getProgressionAdvice(history, exercise.id, { minReps: exercise.minReps, maxReps: exercise.maxReps, targetRir: exercise.targetRir });`
);
workout = workout.replace(
`    .flatMap((record) => record.exercises.filter((item) => item.exerciseId === exerciseId).map((item) => ({ exercise: item, completedAt: record.completedAt })))`,
`    .flatMap((record) => record.exercises.filter((item) => sameExerciseIdentity(item.exerciseId, exerciseId)).map((item) => ({ exercise: item, completedAt: record.completedAt })))`
);
workout = workout.replace(
`  const best = [...valid].sort((a, b) => {
    const scoreA = (a.weightKg ?? 0) * (a.repetitions ?? 0);
    const scoreB = (b.weightKg ?? 0) * (b.repetitions ?? 0);
    return scoreB - scoreA || (b.weightKg ?? 0) - (a.weightKg ?? 0);
  })[0];`,
`  const best = [...valid].sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0) || (b.repetitions ?? 0) - (a.repetitions ?? 0))[0];`
);
const oldFind = `function findValidPr(sessionsDescending: { exercise: HistoryExercise; completedAt: string }[]): StrengthReference | null {
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
}`;
const newFind = `function findValidPr(sessionsDescending: { exercise: HistoryExercise; completedAt: string }[]): StrengthReference | null {
  let currentPr: StrengthReference | null = null;
  for (const session of sessionsDescending) {
    const best = bestStrengthSet(session.exercise);
    if (best && isBetterStrengthReference(best, currentPr)) currentPr = best;
  }
  return currentPr;
}`;
if (!workout.includes(oldFind)) throw new Error('findValidPr marker not found');
workout = workout.replace(oldFind, newFind);
const oldLive = `function detectLivePr(history: WorkoutHistoryRecord[], exerciseId: string, currentSets: ExecutedSet[], candidateSet: ExecutedSet): StrengthReference | null {
  const sessions = getStrengthSessions(history, exerciseId);
  if (!sessions.length) return null;
  const candidate = toStrengthReference(candidateSet);
  if (!candidate) return null;

  let bestWeight = -1;
  let bestScore = -1;
  for (const session of sessions) {
    const best = bestStrengthSet(session.exercise);
    if (!best) continue;
    bestWeight = Math.max(bestWeight, best.weightKg);
    bestScore = Math.max(bestScore, best.weightKg * best.repetitions);
  }
  for (const set of currentSets) {
    if (!set.completed || set.setNumber === candidateSet.setNumber) continue;
    const completed = toStrengthReference(set);
    if (!completed) continue;
    bestWeight = Math.max(bestWeight, completed.weightKg);
    bestScore = Math.max(bestScore, completed.weightKg * completed.repetitions);
  }

  const candidateScore = candidate.weightKg * candidate.repetitions;
  return candidate.weightKg > bestWeight || candidateScore > bestScore ? candidate : null;
}`;
const newLive = `function detectLivePr(history: WorkoutHistoryRecord[], exerciseId: string, currentSets: ExecutedSet[], candidateSet: ExecutedSet): StrengthReference | null {
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
}`;
if (!workout.includes(oldLive)) throw new Error('detectLivePr marker not found');
workout = workout.replace(oldLive, newLive);
workout = workout.replace(
`function toStrengthReference(set: ExecutedSet): StrengthReference | null {
  if ((set.weightKg ?? 0) <= 0 || (set.repetitions ?? 0) <= 0) return null;
  return { weightKg: set.weightKg ?? 0, repetitions: set.repetitions ?? 0 };
}`,
`function toStrengthReference(set: ExecutedSet): StrengthReference | null {
  if ((set.weightKg ?? 0) <= 0 || (set.repetitions ?? 0) <= 0) return null;
  return { weightKg: set.weightKg ?? 0, repetitions: set.repetitions ?? 0 };
}

function isBetterStrengthReference(candidate: StrengthReference, current: StrengthReference | null) {
  return !current || candidate.weightKg > current.weightKg || (candidate.weightKg === current.weightKg && candidate.repetitions > current.repetitions);
}`
);
fs.writeFileSync(workoutPath, workout);

// 3) Regression tests for initial PR and continuity across project-specific exercise IDs.
const testPath = 'tests/WorkoutExecutionView.test.tsx';
let test = fs.readFileSync(testPath, 'utf8');
const insertBefore = `  it('salva o histórico, apresenta o resumo final e só então abre progresso', () => {`;
const newTests = `  it('mostra a primeira sessão válida como PR inicial', () => {
    localStorage.setItem('titan-fit:history:v1', JSON.stringify([{ id:'h1', planId:'old', planName:'Anterior', workoutId:'push', workoutTitle:'Push', workoutDay:'Segunda', startedAt:'2026-08-10T20:00:00.000Z', completedAt:'2026-08-10T21:00:00.000Z', durationSeconds:3600, totalSets:2, totalVolumeKg:1520, exercises:[{ exerciseId:'bench', name:'Supino máquina', muscleGroup:'Peitoral', exerciseType:'strength', volumeKg:1520, bestWeightKg:80, totalDistanceMeters:0, totalDurationSeconds:0, bestSpeedKmh:null, bestInclinePercent:null, averageHeartRate:null, sets:[{ setNumber:1, weightKg:80, repetitions:10, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null },{ setNumber:2, weightKg:80, repetitions:9, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null }] }] }]));
    render(<WorkoutExecutionView planId="plan-new" planName="Plano novo" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getByText('80 kg × 10')).toBeInTheDocument();
    expect(screen.queryByText('Ainda sem PR')).not.toBeInTheDocument();
  });

  it('preserva PR quando o mesmo exercício recebe sufixo de projeto', () => {
    localStorage.setItem('titan-fit:history:v1', JSON.stringify([{ id:'h2', planId:'old', planName:'Anterior', workoutId:'upper', workoutTitle:'Upper', workoutDay:'Quarta', startedAt:'2026-08-11T20:00:00.000Z', completedAt:'2026-08-11T21:00:00.000Z', durationSeconds:3600, totalSets:1, totalVolumeKg:900, exercises:[{ exerciseId:'bench', name:'Supino máquina', muscleGroup:'Peitoral', exerciseType:'strength', volumeKg:900, bestWeightKg:90, totalDistanceMeters:0, totalDurationSeconds:0, bestSpeedKmh:null, bestInclinePercent:null, averageHeartRate:null, sets:[{ setNumber:1, weightKg:90, repetitions:10, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null }] }] }]));
    const revisedWorkout: TitanWorkoutDay = { ...workout, exercises:[{ ...workout.exercises[0], id:'bench--workout-upper-b--p1' }] };
    render(<WorkoutExecutionView planId="plan-revised" planName="Plano revisado" workout={revisedWorkout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getByText('90 kg × 10')).toBeInTheDocument();
  });

`;
if (!test.includes(insertBefore)) throw new Error('Workout test insertion marker not found');
test = test.replace(insertBefore, newTests + insertBefore);
fs.writeFileSync(testPath, test);

// 4) Dedicated intelligence regression test.
fs.writeFileSync('tests/pr-engine-v0593.test.ts', `import { describe, expect, it } from 'vitest';\nimport { calculateStrengthPr, sameExerciseIdentity } from '../src/features/history/intelligence';\nimport type { WorkoutHistoryRecord } from '../src/features/history/types';\n\nconst record: WorkoutHistoryRecord = { id:'r1', planId:'p', planName:'P', workoutId:'w', workoutTitle:'W', workoutDay:'Segunda', startedAt:'2026-08-10T20:00:00.000Z', completedAt:'2026-08-10T21:00:00.000Z', durationSeconds:3600, totalSets:2, totalVolumeKg:0, exercises:[{ exerciseId:'machine-row', name:'Remada máquina', muscleGroup:'Costas', exerciseType:'strength', volumeKg:0, bestWeightKg:80, totalDistanceMeters:0, totalDurationSeconds:0, bestSpeedKmh:null, bestInclinePercent:null, averageHeartRate:null, sets:[{ setNumber:1, weightKg:80, repetitions:8, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null },{ setNumber:2, weightKg:70, repetitions:12, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null }] }] };\n\ndescribe('PR engine v0.59.3', () => {\n  it('reconhece identidade canônica entre revisões de projeto', () => { expect(sameExerciseIdentity('machine-row', 'machine-row--workout-upper-b--e2a2')).toBe(true); });\n  it('prioriza maior carga e usa repetições como desempate', () => { const pr = calculateStrengthPr([record], 'machine-row--workout-upper-b--e2a2'); expect(pr.bestSet?.weightKg).toBe(80); expect(pr.bestSet?.repetitions).toBe(8); });\n});\n`);

// 5) Version metadata/changelog.
const pkg = JSON.parse(fs.readFileSync('package.json','utf8')); pkg.version = '0.59.3'; fs.writeFileSync('package.json', JSON.stringify(pkg,null,2)+'\n');
const lock = JSON.parse(fs.readFileSync('package-lock.json','utf8')); lock.version = '0.59.3'; lock.packages[''].version = '0.59.3'; fs.writeFileSync('package-lock.json', JSON.stringify(lock,null,2)+'\n');
let changelog = fs.readFileSync('CHANGELOG.md','utf8');
const marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n';
const section = `\n## v0.59.3 — Motor de PR corrigido\n- A primeira sessão válida de um exercício passa a formar o PR inicial em vez de aparecer como “Ainda sem PR”.\n- PR de musculação passa a priorizar maior carga; repetições desempata quando a carga é a mesma.\n- Histórico e progressão reconhecem IDs canônicos entre revisões do mesmo projeto, preservando PRs ao trocar tabelas compatíveis.\n- Detecção de PR ao vivo usa o mesmo critério do card “PR válido”.\n`;
if (!changelog.includes('## v0.59.3 — Motor de PR corrigido')) changelog = changelog.replace(marker, marker + section);
fs.writeFileSync('CHANGELOG.md', changelog);
