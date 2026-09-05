import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const [pkgText, vite, app, appTest, main, focusStyles, simpleExecution, planViewer, types, validation, execution, healthPage, healthHub, healthBridge, nativeHealthDocs, dashboard, programmingPage, activeSelection, workoutTypes, historyTypes, progressPage, intelligence, evolution, evolutionStorage, evolutionTypes, resetData, database, backup, deploy, ci] = await Promise.all([
  read('package.json'), read('vite.config.ts'), read('src/app/App.tsx'), read('tests/App.test.tsx'), read('src/main.tsx'), read('src/styles/titan-focus-v061.css'), read('src/features/workout/SimpleWorkoutExecutionView.tsx'), read('src/features/plan/PlanViewer.tsx'), read('src/features/plan/types.ts'), read('src/features/plan/validation.ts'), read('src/features/workout/WorkoutExecutionView.tsx'), read('src/features/health/SamsungHealthPage.tsx'), read('src/features/health/HealthHubPage.tsx'), read('src/features/health/bridge.ts'), read('native/android-health-connect/README.md'), read('src/features/dashboard/DashboardPage.tsx'), read('src/features/programming/ProgrammingPage.tsx'), read('src/features/programming/activeWorkoutSelection.ts'), read('src/features/workout/types.ts'), read('src/features/history/types.ts'), read('src/features/history/ProgressPage.tsx'), read('src/features/history/intelligence.ts'), read('src/features/evolution/BodyEvolutionPage.tsx'), read('src/features/evolution/storage.ts'), read('src/features/evolution/types.ts'), read('src/core/database/resetAppData.ts'), read('src/core/database/indexedDb.ts'), read('src/core/backup/backup.ts'), read('.github/workflows/deploy-pages.yml'), read('.github/workflows/ci.yml')
]);

const pkg = JSON.parse(pkgText);
assert(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json deve declarar uma versão semântica válida');
assert(pkg.scripts?.lint?.includes('--max-warnings 0'), 'Lint deve falhar quando houver warnings');
assert(app.includes("import packageInfo from '../../package.json'") && app.includes('const APP_VERSION = packageInfo.version;'), 'Versão visível deve vir do package.json');
assert(appTest.includes("import packageInfo from '../package.json'") && appTest.includes('`v${packageInfo.version}`'), 'Teste do App deve usar a versão dinâmica');
assert(vite.includes("base: isAndroid ? './' : '/titan-fit/'") && vite.includes("display: 'standalone'") && vite.includes('disable: isAndroid'), 'Build PWA/Android deve manter configuração oficial');
assert(ci.includes('node-version: 24') && deploy.includes('node-version: 24'), 'CI e deploy devem usar Node 24');
assert(deploy.includes('actions/deploy-pages@v4') && deploy.includes('npm run validate'), 'Deploy deve validar antes de publicar');

// Produto v0.61+: interface workout-first. A barra principal deve conter somente o essencial.
for (const tab of ["{ id: 'today', label: 'Hoje' }", "{ id: 'plans', label: 'Treinos' }", "{ id: 'history', label: 'Histórico' }"]) {
  assert(app.includes(tab), `Navegação principal workout-first ausente: ${tab}`);
}
for (const legacyTab of ["{ id: 'programming', label: 'Programação' }", "{ id: 'health', label: 'Saúde' }", "{ id: 'progress', label: 'Progresso' }", "{ id: 'cardio', label: 'Cardio' }", "{ id: 'settings', label: 'Ajustes' }"]) {
  assert(!app.includes(legacyTab), `Navegação principal não deve manter item legado: ${legacyTab}`);
}
assert(app.includes('aria-label="Abrir ajustes"') && app.includes("activeTab === 'settings'"), 'Ajustes devem permanecer acessíveis fora da barra principal');
assert(app.includes('Iniciar treino') && app.includes('<HistoryPage'), 'Home deve priorizar início do treino e preservar histórico');
assert(!app.includes('Score TITAN') && !app.includes('Coach TITAN') && !app.includes('NutritionPage') && !app.includes('HealthHubPage'), 'Fluxo principal não deve carregar score, coach, nutrição ou saúde');
assert(!app.includes("CardioPage") && !app.includes("'cardio' |") && !app.includes("activeTab === 'cardio'") && !app.includes('directCardioId') && !app.includes('startCardio'), 'App não deve manter rota ou execução de cardio standalone');

// Rework visual deve usar uma camada única e focada em treino.
assert(main.includes("'./styles/titan-focus-v061.css'") && !main.includes("'./styles/dashboard") && !main.includes("'./styles/health"), 'Entrada do app deve usar a camada visual workout-first sem CSS legado de dashboard/saúde');
for (const token of ['focus-workout-mode', 'focus-set-row', 'focus-rest-timer', 'load-guidance', 'titan-focus-nav']) {
  assert(focusStyles.includes(token), `CSS workout-first deve preservar ${token}`);
}

// Execução deve privilegiar exercício, carga, repetições, descanso e dica curta.
assert(simpleExecution.includes("field: 'weightKg' | 'repetitions'") && simpleExecution.includes('CARGA') && simpleExecution.includes('REPS'), 'Execução simples deve registrar carga e repetições por série');
assert(simpleExecution.includes('DESCANSO') && simpleExecution.includes('restSeconds') && simpleExecution.includes('setRestRunning(true)'), 'Execução simples deve iniciar descanso automático');
assert(simpleExecution.includes('Dica de execução') && simpleExecution.includes('commonMistakes'), 'Execução simples deve preservar dicas e erros comuns de forma recolhível');
assert(simpleExecution.includes('CARGA SUGERIDA') && simpleExecution.includes('findPreviousPerformance') && simpleExecution.includes('suggestLoad'), 'Execução simples deve usar histórico para sugerir carga');
assert(planViewer.includes('Seus treinos') && planViewer.includes('SÉRIES') && planViewer.includes('REPS') && planViewer.includes('DESCANSO'), 'Biblioteca de treinos deve exibir somente a prescrição essencial');

// Módulos legados podem permanecer no código como infraestrutura/compatibilidade, mas não fazem parte da navegação ativa.
assert(!dashboard.includes('../cardio/currentCardio') && !dashboard.includes('onStartCardio') && !dashboard.includes('Iniciar cardio'), 'Dashboard legado não deve iniciar cardio por módulo isolado');
assert(activeSelection.includes("'pull' | 'push' | 'legs' | 'rest'") && activeSelection.includes('loadTrainingChoice') && activeSelection.includes('saveTrainingChoice') && activeSelection.includes('resolveSelectedWorkout'), 'Seleção manual legada deve continuar compatível com dados existentes');
assert(!programmingPage.includes('../cardio/currentCardio') && !programmingPage.includes('NutritionProgramPanel'), 'Programação legada não deve reintroduzir cardio isolado ou nutrição');

// Saúde/Android permanece como infraestrutura disponível para futuras integrações, sem ocupar a experiência principal.
assert(healthHub.includes('<SamsungHealthPage />') && healthHub.includes('<ProgressPage refreshKey={refreshKey} />'), 'HealthHub legado deve continuar íntegro para compatibilidade');
assert(healthPage.includes('Health Connect'), 'Infraestrutura de saúde deve continuar disponível no código');
assert(healthBridge.includes('window.Capacitor?.Plugins?.TitanHealthConnect') && healthBridge.includes('readSamples'), 'Ponte Health Connect deve permanecer ativa');
assert(nativeHealthDocs.includes('Galaxy Watch → Samsung Health → Health Connect') && nativeHealthDocs.includes('TitanHealthConnect'), 'Documentação Health Connect deve permanecer presente');

assert(types.includes("'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility'"), 'ExerciseType deve preservar compatibilidade de schema');
assert(types.includes('TitanExerciseAlternative') && types.includes('alternativeExercises?: TitanExerciseAlternative[]'), 'Plano deve preservar alternativas estruturadas');
assert(validation.includes("readString(value.exerciseType) || 'strength'"), 'Planos legados devem assumir strength quando exerciseType não existir');
assert(validation.includes('validateAlternativeExercise') && validation.includes('alternativeExercises'), 'Importador deve validar alternativas');
assert(workoutTypes.includes('distanceMeters') && workoutTypes.includes('speedKmh') && workoutTypes.includes('notes'), 'Persistência deve manter compatibilidade com métricas históricas');
assert(historyTypes.includes('totalDistanceMeters') && historyTypes.includes('averageHeartRate'), 'Histórico deve preservar dados já registrados');
assert(!execution.includes('getExerciseVideo') && !execution.includes('WorkoutExerciseVideo') && !execution.includes('video-stage'), 'Modo treino legado também deve permanecer sem vídeo');

assert(progressPage.includes('BodyEvolutionPage') && progressPage.includes('PrHall'), 'Módulo de evolução legado deve permanecer íntegro para dados existentes');
assert(evolution.includes('Bioimpedância automática do relógio') && evolution.includes('Medidas e fotos'), 'Evolução corporal legada deve permanecer íntegra para dados existentes');
assert(evolutionTypes.includes('BodyEvolutionEntry') && evolutionTypes.includes('BioimpedanceData'), 'Modelo de evolução deve permanecer versionado');
assert(evolutionStorage.includes('body-evolution-v1'), 'Evolução deve permanecer persistida');
assert(intelligence.includes('calculateStrengthPr') && intelligence.includes('getProgressionAdvice'), 'Motor de progressão deve permanecer disponível');
assert(resetData.includes('localStorage.clear()') && resetData.includes('STORE_NAMES'), 'Reset deve limpar persistência local');
assert(database.includes('indexedDB.open') && backup.includes('restoreBackup'), 'IndexedDB e backup devem permanecer funcionais');
assert(!types.includes('TitanVideo') && !types.includes('videoPolicy') && !types.includes('videoLibrary'), 'Schema ativo não deve manter sistema de vídeos');

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
console.log(`Validação do TITAN FIT v${pkg.version} workout-first concluída com sucesso.`);
