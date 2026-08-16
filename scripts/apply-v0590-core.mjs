import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, v);

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

let validation = read('src/features/plan/validation.ts');
validation = validation.replace(/\s*type ExerciseVideoPolicy,\n/, '\n').replace(/\s*type TitanVideo,\n/, '\n').replace(/\s*type TitanVideoLibrary,\n/, '\n');
validation = validation.replace(/const VIDEO_POLICIES:[^\n]*\n/, '');
validation = validation.replace(/export function extractYouTubeVideoId[\s\S]*?function validateProgression/, 'function validateProgression');
validation = validation.replace(/\s*const video = validateVideo\(value\.video, path, errors\); const progression = validateProgression\(value\.progression, path, errors\); const rawPolicy = readString\(value\.videoPolicy\); const videoPolicy = VIDEO_POLICIES\.includes\(rawPolicy as ExerciseVideoPolicy\) \? rawPolicy as ExerciseVideoPolicy : undefined;/g, ' const progression = validateProgression(value.progression, path, errors);');
validation = validation.replace(/,?\s*\.\.\.\(video \? \{ video \} : \{\}\),?\s*\.\.\.\(videoPolicy \? \{ videoPolicy \} : \{\}\)/g, '');
validation = validation.replace(/\nfunction validateVideoLibrary[\s\S]*?\n}\n\nexport function validateTitanPlan/, '\nexport function validateTitanPlan');
validation = validation.replace(/\s*if \(!workouts\.some\([\s\S]*?warnings\.push\('O projeto não possui vídeos reproduzíveis vinculados\.'\);/, '');
validation = validation.replace(' const project = validateProject(input.project, errors); const videoLibrary = validateVideoLibrary(input.videoLibrary);', ' const project = validateProject(input.project, errors);');
validation = validation.replace(/, \.\.\.\(videoLibrary \? \{ videoLibrary \} : \{\}\)/, '');
write('src/features/plan/validation.ts', validation);

let execution = read('src/features/workout/WorkoutExecutionView.tsx');
execution = execution.replace("import { getExerciseVideo, type CuratedExerciseVideo } from '../exercise-library/videos';\n", '');
execution = execution.replace("  const [videoUnlocked, setVideoUnlocked] = useState<Record<string, boolean>>({});\n", '');
execution = execution.replace("  const exerciseVideo = getExerciseVideo(activeExercise);\n  const videoIsRequired = Boolean(exerciseVideo) && !videoUnlocked[activeExercise.id] && !exerciseCompleted;\n", '');
execution = execution.replace(/\n\s*\{exerciseVideo && <section className=\{`video-stage[\s\S]*?<\/section>\}\n/, '\n');
execution = execution.replace("      {!exerciseSkipped && !videoIsRequired && <div className=\"set-entry-list\">", "      {!exerciseSkipped && <div className=\"set-entry-list\">");
execution = execution.replace(/\nfunction WorkoutExerciseVideo[\s\S]*?\n}\n\nfunction SetEntry/, '\nfunction SetEntry');
execution = execution.replace(', video: undefined', '');
write('src/features/workout/WorkoutExecutionView.tsx', execution);

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
export function serializeTrainingPlan(plan: TitanPlan) { return JSON.stringify(stripLegacyVideoData(plan), null, 2); }
export function buildTrainingExportFilename(plan: TitanPlan, date = new Date()) {
  const safeId = String(plan.id || 'treino-atual').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'treino-atual';
  return 'TITAN-TREINO-' + safeId + '-' + date.toISOString().slice(0, 10) + '.json';
}
`);

let app = read('src/app/App.tsx');
app = app.replace("import { useEffect, useState } from 'react';", "import { useEffect, useRef, useState } from 'react';");
app = app.replace("  const [activePlan, setActivePlan]", "  const activeTabRef = useRef<TabId>(activeTab);\n  activeTabRef.current = activeTab;\n  const [activePlan, setActivePlan]");
app = app.replace("    const handlePopState = (event: PopStateEvent) => { setActiveTab(normalizeTabId(event.state?.titanTab)); clearTransientNavigation(); };", "    const handlePopState = (event: PopStateEvent) => { if (activeTabRef.current === 'workout') { window.history.replaceState({ ...(event.state ?? {}), titanRoot: true, titanTab: 'today' }, ''); setActiveTab('today'); clearTransientNavigation(); return; } setActiveTab(normalizeTabId(event.state?.titanTab)); clearTransientNavigation(); };");
write('src/app/App.tsx', app);

let main = read('src/main.tsx');
main = main.replace("import './styles/exercise-library-v048.css';\n", '').replace("import './styles/exercise-video-v059.css';\n", '');
if (!main.includes('rework-foundation-v059.css')) main = main.replace("import './styles/navigation-proportion-v05813.css';", "import './styles/navigation-proportion-v05813.css';\nimport './styles/rework-foundation-v059.css';");
write('src/main.tsx', main);

let validator = read('scripts/validate-project.mjs');
validator = validator.replace(', videoLibrary, database', ', database');
validator = validator.replace(", read('src/features/exercise-library/videos.ts'), read('src/core/database/indexedDb.ts')", ", read('src/core/database/indexedDb.ts')");
validator = validator.replace("assert(!programmingPage.includes('../cardio/currentCardio') && programmingPage.includes(\"ProgrammingTab = 'week' | 'library'\"), 'Programação deve manter somente treino e biblioteca');", "assert(!programmingPage.includes('../cardio/currentCardio') && !programmingPage.includes('ExerciseLibraryPage') && !programmingPage.includes('>Biblioteca</button>'), 'Programação deve permanecer sem biblioteca visual');");
validator = validator.replace("assert(programmingPage.includes('Treino, cardio e biblioteca organizados em uma única área.') && programmingPage.includes(\"exercise.exerciseType === 'cardio'\") && programmingPage.includes(\"exercise.exerciseType === 'distance'\"), 'Programação deve reunir musculação e cardio no projeto');", "assert(programmingPage.includes('musculação e cardio integrado') && programmingPage.includes(\"exercise.exerciseType === 'cardio'\") && programmingPage.includes(\"exercise.exerciseType === 'distance'\"), 'Programação deve reunir musculação e cardio no projeto');");
validator = validator.replace("assert(execution.includes('getExerciseVideo(activeExercise)') && execution.includes('exerciseOptions(baseExercise)') && execution.includes('selectedExerciseId: option.id'), 'Modo treino deve preservar vídeo e substituições');", "assert(!execution.includes('getExerciseVideo') && !execution.includes('WorkoutExerciseVideo') && !execution.includes('video-stage') && execution.includes('exerciseOptions(baseExercise)') && execution.includes('selectedExerciseId: option.id'), 'Modo treino deve permanecer sem vídeo e preservar substituições');");
validator = validator.replace("assert(videoLibrary.includes('youtube-nocookie.com/embed/') && videoLibrary.includes('player.vimeo.com/video/'), 'Biblioteca de vídeos deve permanecer multprovedor');", "assert(!types.includes('TitanVideo') && !types.includes('videoPolicy') && !types.includes('videoLibrary'), 'Schema ativo não deve manter sistema de vídeos');");
write('scripts/validate-project.mjs', validator);

const pkg = JSON.parse(read('package.json')); pkg.version = '0.59.0'; write('package.json', JSON.stringify(pkg, null, 2) + '\n');
const lock = JSON.parse(read('package-lock.json')); lock.version = '0.59.0'; lock.packages[''].version = '0.59.0'; write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
let changelog = read('CHANGELOG.md');
const marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n';
const section = `\n## v0.59.0 — Rework Foundation · Video-free\n- Remove a Biblioteca visual de exercícios da Programação.\n- Remove player, bloqueio e qualquer etapa de vídeo do modo treino.\n- Remove vídeo, videoPolicy e videoLibrary do schema ativo; projetos legados continuam importáveis e esses campos são descartados.\n- Exportação do treino elimina qualquer metadado de vídeo legado ainda persistido.\n- Botão Voltar do Android durante o modo treino retorna para Hoje/Home e preserva a sessão.\n- Detalhes da Programação passam a respeitar o histórico do navegador para o gesto/botão Voltar.\n- Nova camada final de layout centraliza safe areas do Android e evita sobreposição da navegação inferior com a barra do sistema.\n- Fundação preparada para a nova identidade visual do TITAN FIT.\n`;
if (!changelog.includes('## v0.59.0 — Rework Foundation')) changelog = changelog.replace(marker, marker + section);
write('CHANGELOG.md', changelog);
