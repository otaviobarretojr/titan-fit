import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const [pkgText, vite, app, appTest, types, validation, execution, healthPage, healthBridge, nativeHealthDocs, dashboard, programmingPage, workoutTypes, historyTypes, progressPage, intelligence, evolution, evolutionStorage, evolutionTypes, resetData, videoLibrary, database, backup, deploy, ci] = await Promise.all([
  read('package.json'), read('vite.config.ts'), read('src/app/App.tsx'), read('tests/App.test.tsx'), read('src/features/plan/types.ts'), read('src/features/plan/validation.ts'), read('src/features/workout/WorkoutExecutionView.tsx'), read('src/features/health/SamsungHealthPage.tsx'), read('src/features/health/bridge.ts'), read('native/android-health-connect/README.md'), read('src/features/dashboard/DashboardPage.tsx'), read('src/features/programming/ProgrammingPage.tsx'), read('src/features/workout/types.ts'), read('src/features/history/types.ts'), read('src/features/history/ProgressPage.tsx'), read('src/features/history/intelligence.ts'), read('src/features/evolution/BodyEvolutionPage.tsx'), read('src/features/evolution/storage.ts'), read('src/features/evolution/types.ts'), read('src/core/database/resetAppData.ts'), read('src/features/exercise-library/videos.ts'), read('src/core/database/indexedDb.ts'), read('src/core/backup/backup.ts'), read('.github/workflows/deploy-pages.yml'), read('.github/workflows/ci.yml')
]);

const pkg = JSON.parse(pkgText);
assert(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json deve declarar uma versão semântica válida');
assert(pkg.scripts?.lint?.includes('--max-warnings 0'), 'Lint deve falhar quando houver warnings');
assert(app.includes("import packageInfo from '../../package.json'") && app.includes('const APP_VERSION = packageInfo.version;'), 'Versão visível deve vir do package.json');
assert(appTest.includes("import packageInfo from '../package.json'") && appTest.includes('`v${packageInfo.version}`'), 'Teste do App deve usar a versão dinâmica');

assert(vite.includes("base: isAndroid ? './' : '/titan-fit/'") && vite.includes("display: 'standalone'") && vite.includes('disable: isAndroid'), 'Build PWA/Android deve manter configuração oficial');
assert(ci.includes('node-version: 24') && deploy.includes('node-version: 24'), 'CI e deploy devem usar Node 24');
assert(deploy.includes('actions/deploy-pages@v4') && deploy.includes('npm run validate'), 'Deploy deve validar antes de publicar');

for (const tab of ["{ id: 'today', label: 'Hoje' }", "{ id: 'programming', label: 'Treinos' }", "{ id: 'health', label: 'Saúde' }", "{ id: 'progress', label: 'Progresso' }", "{ id: 'settings', label: 'Ajustes' }"]) assert(app.includes(tab), `Navegação principal ausente: ${tab}`);
assert(!app.includes("CardioPage") && !app.includes("'cardio' |") && !app.includes("activeTab === 'cardio'") && !app.includes('directCardioId') && !app.includes('startCardio'), 'App não deve manter rota ou execução de cardio standalone');
assert(!dashboard.includes('../cardio/currentCardio') && !dashboard.includes('onStartCardio') && !dashboard.includes('Iniciar cardio'), 'Dashboard não deve iniciar cardio por módulo isolado');
assert(dashboard.includes('dayPlan?.exercises') && dashboard.includes("exercise.exerciseType === 'cardio'") && dashboard.includes('onStartWorkout(dayPlan.id)'), 'Dashboard deve executar musculação e cardio pelo treino do projeto');
assert(!programmingPage.includes('../cardio/currentCardio') && !programmingPage.includes("ProgrammingTab = 'strength' | 'cardio'") && programmingPage.includes("ProgrammingTab = 'week' | 'library'"), 'Treinos deve remover aba de cardio isolada');
assert(programmingPage.includes('Musculação e cardio agora fazem parte da mesma programação semanal.') && programmingPage.includes("exercise.exerciseType === 'cardio'") && programmingPage.includes("exercise.exerciseType === 'distance'"), 'Programação deve reunir cardio e musculação por dia do projeto');
assert(programmingPage.includes("const DAY_ORDER = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']"), 'Semana oficial deve começar no domingo');

assert(app.includes("activeTab === 'health' && <SamsungHealthPage />") && healthPage.includes('Atividade diária') && healthPage.includes('Treinos da semana') && healthPage.includes('Health Connect'), 'Saúde deve manter dashboard e Health Connect');
assert(healthBridge.includes('window.Capacitor?.Plugins?.TitanHealthConnect') && healthBridge.includes('readSamples'), 'Ponte Health Connect deve permanecer ativa');
assert(nativeHealthDocs.includes('Galaxy Watch → Samsung Health → Health Connect') && nativeHealthDocs.includes('TitanHealthConnect'), 'Documentação Health Connect deve permanecer presente');

assert(types.includes("'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility'"), 'ExerciseType deve suportar musculação e cardio no mesmo projeto');
assert(types.includes('TitanExerciseAlternative') && types.includes('alternativeExercises?: TitanExerciseAlternative[]'), 'Plano deve preservar alternativas estruturadas');
assert(validation.includes("readString(value.exerciseType) || 'strength'"), 'Planos legados devem assumir strength quando exerciseType não existir');
assert(validation.includes('validateAlternativeExercise') && validation.includes('alternativeExercises'), 'Importador deve validar alternativas');
assert(workoutTypes.includes('distanceMeters') && workoutTypes.includes('speedKmh') && workoutTypes.includes('notes'), 'Execução deve persistir métricas de cardio no treino');
assert(historyTypes.includes('totalDistanceMeters') && historyTypes.includes('averageHeartRate'), 'Histórico deve preservar métricas cardiovasculares');
assert(execution.includes('getExerciseVideo(activeExercise)') && execution.includes('exerciseOptions(baseExercise)') && execution.includes('selectedExerciseId: option.id'), 'Modo treino deve preservar vídeo e substituições');

assert(progressPage.includes('BodyEvolutionPage') && progressPage.includes('PrHall'), 'Progresso deve manter evolução e PRs');
assert(evolution.includes('Bioimpedância automática do relógio') && evolution.includes('Medidas e fotos') && evolution.includes('A bioimpedância vem automaticamente do Samsung Health'), 'Evolução corporal deve manter bioimpedância automática e registros manuais complementares');
assert(evolutionTypes.includes('BodyEvolutionEntry') && evolutionTypes.includes('BioimpedanceData'), 'Modelo de evolução deve permanecer versionado');
assert(evolutionStorage.includes('body-evolution-v1'), 'Evolução deve permanecer persistida');
assert(intelligence.includes('calculateStrengthPr') && intelligence.includes('getProgressionAdvice'), 'Motor de progressão deve permanecer disponível');
assert(resetData.includes('localStorage.clear()') && resetData.includes('STORE_NAMES'), 'Reset deve limpar persistência local');
assert(database.includes('indexedDB.open') && backup.includes('restoreBackup'), 'IndexedDB e backup devem permanecer funcionais');
assert(videoLibrary.includes('youtube-nocookie.com/embed/') && videoLibrary.includes('player.vimeo.com/video/'), 'Biblioteca de vídeos deve permanecer multprovedor');

const forbidden = ['IronFit', 'TreinoFit', 'Projeto Titan', 'Titan App'];
async function walk(dir) {
  for (const entry of await readdir(dir)) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry)) continue;
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) { await walk(full); continue; }
    if (entry.endsWith('.lock') || full.endsWith('scripts/validate-project.mjs')) continue;
    const text = await readFile(full, 'utf8').catch(() => '');
    for (const term of forbidden) assert(!text.includes(term), `${full} contém termo proibido: ${term}`);
  }
}
await walk(root);

if (failures.length) {
  console.error('Validação falhou:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`Validação do TITAN FIT v${pkg.version} concluída com sucesso.`);
