import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, value) => fs.writeFileSync(path, value);
const replace = (path, before, after) => {
  const text = read(path);
  if (!text.includes(before)) throw new Error(`Marker not found in ${path}: ${before.slice(0, 120)}`);
  write(path, text.replace(before, after));
};

// 1) Remove visible Exercise Library and simplify Programming to a single training surface.
write('src/features/programming/ProgrammingPage.tsx', `import { useEffect, useMemo, useState } from 'react';
import { TrainingPlanExport } from './TrainingPlanExport';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution } from '../workout/storage';

type Props = { plan: TitanPlan | null; onStartWorkout?: (workoutId: string) => void };
const DAY_ORDER = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const JS_DAY_TO_TITAN = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export function ProgrammingPage({ plan, onStartWorkout }: Props) {
  const [selected, setSelected] = useState<TitanWorkoutDay | null>(null);
  const today = JS_DAY_TO_TITAN[new Date().getDay()];
  const workouts = useMemo(() => !plan ? [] : [...plan.workouts].sort((a, b) => dayIndex(a.day) - dayIndex(b.day)), [plan]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const detailId = typeof event.state?.titanProgrammingWorkoutId === 'string' ? event.state.titanProgrammingWorkoutId : null;
      setSelected(detailId ? workouts.find((item) => item.id === detailId) ?? null : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [workouts]);

  function openWorkout(workout: TitanWorkoutDay) {
    window.history.pushState({ ...window.history.state, titanProgrammingWorkoutId: workout.id }, '');
    setSelected(workout);
  }
  function closeWorkout() {
    if (window.history.state?.titanProgrammingWorkoutId) window.history.back();
    else setSelected(null);
  }

  if (selected) return <WorkoutDetail workout={selected} plan={plan} isToday={normalize(selected.day).includes(today)} onBack={closeWorkout} onStartWorkout={onStartWorkout} />;

  const todayWorkout = workouts.find((item) => normalize(item.day).includes(today));
  const nextDay = DAY_ORDER[(DAY_ORDER.indexOf(today) + 1) % DAY_ORDER.length];
  const todayExecution = plan && todayWorkout ? loadWorkoutExecution(plan.id, todayWorkout.id) : null;

  return <div className="programming-page">
    <section className="section-header programming-header"><span className="eyebrow">PLANEJAMENTO TITAN</span><h2>Programação</h2><p>Sua semana de musculação e cardio integrado, sem distrações.</p></section>
    {plan && <TrainingPlanExport plan={plan} />}
    {!plan ? <ProgrammingEmpty /> : <>
      <section className="programming-today" aria-label="Treino de hoje"><div><span className="eyebrow">HOJE · {today.slice(0, 3).toUpperCase()}</span><h3>{todayWorkout?.title ?? 'Recuperação'}</h3><p>{todayWorkout ? workoutSummary(todayWorkout) : 'Sem sessão programada para hoje'}</p>{todayExecution && <span className="programming-tag today-tag">SESSÃO EM ANDAMENTO</span>}{todayWorkout && onStartWorkout && <button type="button" className="primary-action" onClick={() => onStartWorkout(todayWorkout.id)}>{todayExecution ? 'Retomar treino' : 'Iniciar treino'}</button>}</div></section>
      <section className="programming-section" aria-labelledby="week-program-title"><div className="programming-section-head"><div><span className="programming-section-icon strength">⌁</span><div><span className="eyebrow">DOMINGO → SÁBADO</span><h3 id="week-program-title">Treinos da semana</h3></div></div><small>{workouts.length} dias programados</small></div><div className="programming-list">{DAY_ORDER.map((day) => { const workout = workouts.find((item) => normalize(item.day).includes(day)); const isToday = day === today; const isTomorrow = day === nextDay; if (!workout) return <article className={\`programming-day-card rest\${isToday ? ' today' : ''}\`} key={day}><DayLabel day={day} isToday={isToday} /><div className="programming-day-copy"><strong>Recuperação</strong><small>Sem sessão programada</small></div><DayStatus isToday={isToday} isTomorrow={isTomorrow} fallback="DESCANSO" /></article>; return <button type="button" className={\`programming-day-card\${isToday ? ' today' : ''}\`} key={workout.id} onClick={() => openWorkout(workout)}><DayLabel day={day} isToday={isToday} /><div className="programming-day-copy"><strong>{workout.title}</strong><small>{workoutSummary(workout)}</small></div><DayStatus isToday={isToday} isTomorrow={isTomorrow} /></button>; })}</div></section>
    </>}
  </div>;
}

function ProgrammingEmpty() { return <section className="programming-empty"><span className="eyebrow">PROGRAMAÇÃO</span><h2>Nenhum projeto de treino ativo</h2><p>Importe ou gere um projeto de treino para preencher esta área.</p></section>; }
function WorkoutDetail({ workout, plan, isToday, onBack, onStartWorkout }: { workout: TitanWorkoutDay; plan: TitanPlan | null; isToday: boolean; onBack: () => void; onStartWorkout?: (workoutId: string) => void }) { const strength = workout.exercises.filter(isStrength); const cardio = workout.exercises.filter(isCardio); const activeExecution = plan ? loadWorkoutExecution(plan.id, workout.id) : null; return <div className="programming-detail"><button type="button" className="secondary-action programming-back" onClick={onBack}>‹ Voltar à programação</button><section className="programming-detail-hero"><span className="eyebrow">{workout.day.toUpperCase()} · PROJETO TITAN</span><h2>{workout.title}</h2><p>{workout.focus ?? 'Sessão programada no projeto ativo.'}</p><div className="programming-detail-summary"><span><small>Etapas</small><strong>{workout.exercises.length}</strong></span>{strength.length > 0 && <span><small>Séries</small><strong>{strength.reduce((sum, exercise) => sum + (exercise.sets ?? 1), 0)}</strong></span>}{cardio.length > 0 && <span><small>Cardio</small><strong>{cardio.length}</strong></span>}</div>{isToday && activeExecution && <span className="programming-tag today-tag">SESSÃO EM ANDAMENTO</span>}{isToday && onStartWorkout && <button type="button" className="primary-action" onClick={() => onStartWorkout(workout.id)}>{activeExecution ? 'Retomar treino' : 'Iniciar treino'}</button>}</section><div className="programming-exercise-list">{workout.exercises.map((exercise, index) => <ExerciseGuide key={exercise.id} exercise={exercise} index={index + 1} />)}</div></div>; }
function ExerciseGuide({ exercise, index }: { exercise: TitanExercise; index: number }) { const cardio = isCardio(exercise); return <details className="programming-exercise-card"><summary><span className="programming-exercise-order">{index}</span><span><strong>{exercise.name}</strong><small>{cardio ? cardioPrescription(exercise) : \`${exercise.sets ?? 1} séries · ${repRange(exercise)}\`}</small></span><span className="programming-chevron">⌄</span></summary><div className="programming-exercise-guide"><InfoRow label="Tipo" value={exerciseTypeLabel(exercise)} /><InfoRow label="Grupo / foco" value={exercise.muscleGroup} />{!cardio && <InfoRow label="Descanso" value={exercise.restSeconds ? \`${exercise.restSeconds}s\` : 'A definir'} />}{exercise.cardioZone && <InfoRow label="Zona" value={exercise.cardioZone} />}{exercise.technique && <GuideBlock title="Execução" text={exercise.technique} />}{exercise.notes && <GuideBlock title="Orientação" text={exercise.notes} />}{exercise.commonMistakes?.length ? <GuideList title="Erros comuns" items={exercise.commonMistakes} /> : null}{exercise.alternativeExercises?.length ? <GuideList title="Alternativas" items={exercise.alternativeExercises.map((item) => item.name)} /> : exercise.alternatives?.length ? <GuideList title="Alternativas" items={exercise.alternatives} /> : null}</div></details>; }
function DayLabel({ day, isToday = false }: { day: string; isToday?: boolean }) { return <span className={\`programming-day-label\${isToday ? ' active' : ''}\`}><strong>{day.slice(0, 3).toUpperCase()}</strong></span>; }
function DayStatus({ isToday, isTomorrow, fallback }: { isToday: boolean; isTomorrow: boolean; fallback?: string }) { if (isToday) return <span className="programming-tag today-tag">HOJE</span>; if (isTomorrow) return <span className="programming-tag tomorrow-tag">AMANHÃ</span>; if (fallback) return <span className="programming-tag">{fallback}</span>; return <span className="programming-chevron">›</span>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="programming-info-row"><span>{label}</span><strong>{value}</strong></div>; }
function GuideBlock({ title, text }: { title: string; text: string }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><p>{text}</p></div>; }
function GuideList({ title, items }: { title: string; items: string[] }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function isStrength(exercise: TitanExercise) { return (exercise.exerciseType ?? 'strength') === 'strength'; }
function isCardio(exercise: TitanExercise) { return exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance'; }
function workoutSummary(workout: TitanWorkoutDay) { const strength = workout.exercises.filter(isStrength).length; const cardio = workout.exercises.filter(isCardio).length; const parts = [\`${workout.exercises.length} etapas\`]; if (strength) parts.push(\`${strength} de musculação\`); if (cardio) parts.push(\`${cardio} de cardio\`); return \`${workout.focus ?? 'Sessão programada'} · ${parts.join(' · ')}\`; }
function cardioPrescription(exercise: TitanExercise) { const parts: string[] = []; if (exercise.durationSeconds) parts.push(\`${Math.round(exercise.durationSeconds / 60)} min\`); if (exercise.distanceMeters) parts.push(\`${(exercise.distanceMeters / 1000).toFixed(1).replace('.', ',')} km\`); if (exercise.cardioZone) parts.push(exercise.cardioZone); if (exercise.targetHeartRateMin || exercise.targetHeartRateMax) parts.push(\`FC ${exercise.targetHeartRateMin ?? '—'}–${exercise.targetHeartRateMax ?? '—'}\`); return parts.join(' · ') || 'Cardio programado'; }
function exerciseTypeLabel(exercise: TitanExercise) { if (exercise.exerciseType === 'distance') return 'Distância'; if (exercise.exerciseType === 'cardio') return 'Cardio'; if (exercise.exerciseType === 'mobility') return 'Mobilidade'; if (exercise.exerciseType === 'isometric') return 'Isometria'; return 'Musculação'; }
function repRange(exercise: TitanExercise) { if (exercise.minReps && exercise.maxReps) return \`${exercise.minReps}–${exercise.maxReps} reps\`; if (exercise.maxReps) return \`até ${exercise.maxReps} reps\`; if (exercise.minReps) return \`${exercise.minReps}+ reps\`; return 'reps a definir'; }
function dayIndex(value: string) { const normalized = normalize(value); const index = DAY_ORDER.findIndex((day) => normalized.includes(day)); return index === -1 ? 99 : index; }
function normalize(value: string) { return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase(); }
`);

// 2) Video-free public plan schema. Legacy JSON video keys are simply ignored by validation.
write('src/features/plan/types.ts', `export const TITAN_PLAN_SCHEMA_VERSION = 1 as const;

export type ExerciseType = 'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility';
export type PlanOrigin = 'titan-generated' | 'imported' | 'manual';
export type CardioProgressionStep = { startWeek:number; endWeek:number; durationSeconds?:number; speedKmh?:number; speedMinKmh?:number; speedMaxKmh?:number; inclinePercent?:number; cardioZone?:string; note?:string };
export type TitanExerciseAlternative = { id:string; name:string; muscleGroup?:string; exerciseType?:ExerciseType; sets?:number; minReps?:number; maxReps?:number; targetRir?:number; restSeconds?:number; durationSeconds?:number; distanceMeters?:number; minDistanceMeters?:number; maxDistanceMeters?:number; speedKmh?:number; speedMinKmh?:number; speedMaxKmh?:number; inclinePercent?:number; averagePace?:string; averageHeartRate?:number; targetHeartRateMin?:number; targetHeartRateMax?:number; calories?:number; cardioZone?:string; notes?:string; progression?:CardioProgressionStep[]; technique?:string; commonMistakes?:string[] };
export type TitanExercise = { id:string; name:string; muscleGroup:string; exerciseType?:ExerciseType; sets?:number; minReps?:number; maxReps?:number; targetRir?:number; restSeconds?:number; durationSeconds?:number; distanceMeters?:number; minDistanceMeters?:number; maxDistanceMeters?:number; speedKmh?:number; speedMinKmh?:number; speedMaxKmh?:number; inclinePercent?:number; averagePace?:string; averageHeartRate?:number; targetHeartRateMin?:number; targetHeartRateMax?:number; calories?:number; cardioZone?:string; notes?:string; progression?:CardioProgressionStep[]; technique?:string; commonMistakes?:string[]; alternatives?:string[]; alternativeExercises?: TitanExerciseAlternative[] };
export type TitanWorkoutDay = { id:string; day:string; title:string; focus?:string; exercises:TitanExercise[] };
export type TitanCardioSession = { id:string; day:string; startTime:string; title:string; type:'walk'|'zone2'|'run-walk'|'run'|'hiit'|'bike'|'stairs'|'other'; durationMinutes:number; week?:number; phase?:string; goal?:string; instructions?:string[] };
export type TitanProject = { name:string; objective:string; startDate?:string; durationWeeks?:number; strengthStartTime?:string; cardioGoal?:string; cardioSchedule?:TitanCardioSession[]; source?:PlanOrigin; originalAuthor?:string; importedAt?:string; sourceFile?:string };
export type TitanPlan = { schemaVersion:typeof TITAN_PLAN_SCHEMA_VERSION; id:string; profileId?:string; projectId?:string; name:string; description?:string; createdAt:string; author?:string; project?:TitanProject; workouts:TitanWorkoutDay[] };
export type PlanValidationResult = { ok:true; plan:TitanPlan; warnings:string[] } | { ok:false; errors:string[] };
`);

// 3) Strip video concepts from plan validation while keeping old plan files importable.
let validation = read('src/features/plan/validation.ts');
validation = validation.replace(/\s*type ExerciseVideoPolicy,\n/, '\n');
validation = validation.replace(/\s*type TitanVideo,\n/, '\n');
validation = validation.replace(/\s*type TitanVideoLibrary,\n/, '\n');
validation = validation.replace(/const VIDEO_POLICIES:[\s\S]*?;\n/, '');
validation = validation.replace(/export function extractYouTubeVideoId[\s\S]*?\n}\n\nfunction validateVideo[\s\S]*?\n}\n\nfunction validateProgression/, 'function validateProgression');
validation = validation.replace(/\s*const video = validateVideo\(value\.video, path, errors\); const progression = validateProgression\(value\.progression, path, errors\); const rawPolicy = readString\(value\.videoPolicy\); const videoPolicy = VIDEO_POLICIES\.includes\(rawPolicy as ExerciseVideoPolicy\) \? rawPolicy as ExerciseVideoPolicy : undefined;/g, ' const progression = validateProgression(value.progression, path, errors);');
validation = validation.replace(/,\s*\.\.\.\(video \? \{ video \} : \{\}\), \.\.\.\(videoPolicy \? \{ videoPolicy \} : \{\}\)/g, '');
validation = validation.replace(/\s*\.\.\.\(video \? \{ video \} : \{\}\), \.\.\.\(videoPolicy \? \{ videoPolicy \} : \{\}\)/g, '');
validation = validation.replace(/\nfunction validateVideoLibrary[\s\S]*?\n}\n\nexport function validateTitanPlan/, '\nexport function validateTitanPlan');
validation = validation.replace(/\n\s*if \(!workouts\.some\([\s\S]*?warnings\.push\('O projeto não possui vídeos reproduzíveis vinculados\.'\);/, '');
validation = validation.replace(/ const project = validateProject\(input\.project, errors\); const videoLibrary = validateVideoLibrary\(input\.videoLibrary\);/, ' const project = validateProject(input.project, errors);');
validation = validation.replace(/, \.\.\.\(videoLibrary \? \{ videoLibrary \} : \{\}\)/, '');
write('src/features/plan/validation.ts', validation);

// 4) Remove video import, lock state, player gate and player component from workout execution.
let execution = read('src/features/workout/WorkoutExecutionView.tsx');
execution = execution.replace("import { getExerciseVideo, type CuratedExerciseVideo } from '../exercise-library/videos';\n", '');
execution = execution.replace("  const [videoUnlocked, setVideoUnlocked] = useState<Record<string, boolean>>({});\n", '');
execution = execution.replace("  const exerciseVideo = getExerciseVideo(activeExercise);\n  const videoIsRequired = Boolean(exerciseVideo) && !videoUnlocked[activeExercise.id] && !exerciseCompleted;\n", '');
execution = execution.replace(/\n\s*\{exerciseVideo && <section className=\{`video-stage[\s\S]*?<\/section>\}\n/, '\n');
execution = execution.replace("      {!exerciseSkipped && !videoIsRequired && <div className=\"set-entry-list\">", "      {!exerciseSkipped && <div className=\"set-entry-list\">");
execution = execution.replace(/\nfunction WorkoutExerciseVideo[\s\S]*?\n}\n\nfunction SetEntry/, '\nfunction SetEntry');
execution = execution.replace(', video: undefined', '');
write('src/features/workout/WorkoutExecutionView.tsx', execution);

// 5) Export always sanitizes legacy video fields from already-persisted old plans.
write('src/features/programming/trainingPlanExport.ts', `import type { TitanPlan } from '../plan/types';

function stripLegacyVideoData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripLegacyVideoData);
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'video' || key === 'videoPolicy' || key === 'videoLibrary') continue;
    output[key] = stripLegacyVideoData(child);
  }
  return output;
}

export function serializeTrainingPlan(plan: TitanPlan) {
  return JSON.stringify(stripLegacyVideoData(plan), null, 2);
}

export function buildTrainingExportFilename(plan: TitanPlan, date = new Date()) {
  const safeId = String(plan.id || 'treino-atual').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'treino-atual';
  const stamp = date.toISOString().slice(0, 10);
  return \`TITAN-TREINO-\${safeId}-\${stamp}.json\`;
}
`);

// 6) Navigation: Android/system back exits workout to Home; nested programming detail uses browser history.
let app = read('src/app/App.tsx');
app = app.replace("import { useEffect, useState } from 'react';", "import { useEffect, useRef, useState } from 'react';");
app = app.replace("  const [activePlan, setActivePlan]", "  const activeTabRef = useRef<TabId>(activeTab);\n  activeTabRef.current = activeTab;\n  const [activePlan, setActivePlan]");
app = app.replace("    const handlePopState = (event: PopStateEvent) => { setActiveTab(normalizeTabId(event.state?.titanTab)); clearTransientNavigation(); };", "    const handlePopState = (event: PopStateEvent) => {\n      if (activeTabRef.current === 'workout') {\n        const state = { ...(event.state ?? {}), titanRoot: true, titanTab: 'today' };\n        window.history.replaceState(state, '');\n        setActiveTab('today');\n        clearTransientNavigation();\n        return;\n      }\n      setActiveTab(normalizeTabId(event.state?.titanTab));\n      clearTransientNavigation();\n    };");
write('src/app/App.tsx', app);

// 7) Remove obsolete video/library CSS from runtime and load a single authoritative rework foundation last.
let main = read('src/main.tsx');
main = main.replace("import './styles/exercise-library-v048.css';\n", '');
main = main.replace("import './styles/exercise-video-v059.css';\n", '');
if (!main.includes("rework-foundation-v059.css")) main = main.replace("import './styles/navigation-proportion-v05813.css';", "import './styles/navigation-proportion-v05813.css';\nimport './styles/rework-foundation-v059.css';");
write('src/main.tsx', main);

// 8) Validation contract now enforces video-free runtime and single programming surface.
let validator = read('scripts/validate-project.mjs');
validator = validator.replace(', videoLibrary, database', ', database');
validator = validator.replace(", read('src/features/exercise-library/videos.ts'), read('src/core/database/indexedDb.ts')", ", read('src/core/database/indexedDb.ts')");
validator = validator.replace("assert(!programmingPage.includes('../cardio/currentCardio') && programmingPage.includes(\"ProgrammingTab = 'week' | 'library'\"), 'Programação deve manter somente treino e biblioteca');", "assert(!programmingPage.includes('../cardio/currentCardio') && !programmingPage.includes('ExerciseLibraryPage') && !programmingPage.includes('>Biblioteca</button>'), 'Programação deve manter somente a programação de treino, sem biblioteca visual');");
validator = validator.replace("assert(programmingPage.includes('Treino, cardio e biblioteca organizados em uma única área.') && programmingPage.includes(\"exercise.exerciseType === 'cardio'\") && programmingPage.includes(\"exercise.exerciseType === 'distance'\"), 'Programação deve reunir musculação e cardio no projeto');", "assert(programmingPage.includes('musculação e cardio integrado') && programmingPage.includes(\"exercise.exerciseType === 'cardio'\") && programmingPage.includes(\"exercise.exerciseType === 'distance'\"), 'Programação deve reunir musculação e cardio no projeto');");
validator = validator.replace("assert(execution.includes('getExerciseVideo(activeExercise)') && execution.includes('exerciseOptions(baseExercise)') && execution.includes('selectedExerciseId: option.id'), 'Modo treino deve preservar vídeo e substituições');", "assert(!execution.includes('getExerciseVideo') && !execution.includes('WorkoutExerciseVideo') && !execution.includes('video-stage') && execution.includes('exerciseOptions(baseExercise)') && execution.includes('selectedExerciseId: option.id'), 'Modo treino deve permanecer sem vídeo e preservar substituições');");
validator = validator.replace("assert(videoLibrary.includes('youtube-nocookie.com/embed/') && videoLibrary.includes('player.vimeo.com/video/'), 'Biblioteca de vídeos deve permanecer multprovedor');", "assert(!types.includes('TitanVideo') && !types.includes('videoPolicy') && !types.includes('videoLibrary'), 'Schema ativo não deve manter sistema de vídeos');");
write('scripts/validate-project.mjs', validator);

// 9) Version + changelog.
const pkg = JSON.parse(read('package.json')); pkg.version = '0.59.0'; write('package.json', JSON.stringify(pkg, null, 2) + '\n');
const lock = JSON.parse(read('package-lock.json')); lock.version = '0.59.0'; lock.packages[''].version = '0.59.0'; write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
let changelog = read('CHANGELOG.md');
const marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n';
const section = `\n## v0.59.0 — Rework Foundation · Video-free\n- Remove a Biblioteca visual de exercícios da Programação.\n- Remove player, bloqueio e qualquer etapa de vídeo do modo treino.\n- Remove vídeo, videoPolicy e videoLibrary do schema ativo; projetos legados continuam importáveis e esses campos são descartados.\n- Exportação do treino elimina qualquer metadado de vídeo legado ainda persistido.\n- Botão Voltar do Android durante o modo treino retorna para Hoje/Home e preserva a sessão.\n- Detalhes da Programação passam a respeitar o histórico do navegador para o gesto/botão Voltar.\n- Nova camada final de layout centraliza safe areas do Android e evita sobreposição da navegação inferior com a barra do sistema.\n- Fundação preparada para a nova identidade visual do TITAN FIT.\n`;
if (!changelog.includes('## v0.59.0 — Rework Foundation')) changelog = changelog.replace(marker, marker + section);
write('CHANGELOG.md', changelog);
