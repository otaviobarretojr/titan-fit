import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const validatorPath = path.join(root, 'scripts', 'validate-project.mjs');
const read = (file) => readFile(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const pkg = JSON.parse(await read('package.json'));
const vite = await read('vite.config.ts');
const app = await read('src/app/App.tsx');
const types = await read('src/features/plan/types.ts');
const validation = await read('src/features/plan/validation.ts');
const execution = await read('src/features/workout/WorkoutExecutionView.tsx');
const cardioPage = await read('src/features/cardio/CardioPage.tsx');
const programmingPage = await read('src/features/programming/ProgrammingPage.tsx');
const workoutTypes = await read('src/features/workout/types.ts');
const historyTypes = await read('src/features/history/types.ts');
const progressPage = await read('src/features/history/ProgressPage.tsx');
const sessionHistoryPage = await read('src/features/history/HistoryPage.tsx');
const intelligence = await read('src/features/history/intelligence.ts');
const evolution = await read('src/features/evolution/BodyEvolutionPage.tsx');
const evolutionStorage = await read('src/features/evolution/storage.ts');
const evolutionTypes = await read('src/features/evolution/types.ts');
const demoEvolution = await read('src/features/evolution/demoData.ts');
const fullDemo = await read('src/features/demo/fullDemo.ts');
const resetData = await read('src/core/database/resetAppData.ts');
const videoLibrary = await read('src/features/exercise-library/videos.ts');
const database = await read('src/core/database/indexedDb.ts');
const backup = await read('src/core/backup/backup.ts');
const deploy = await read('.github/workflows/deploy-pages.yml');

assert(pkg.version === '0.37.0', 'package.json deve manter a versão técnica atual v0.37.0');
assert(vite.includes("base: '/titan-fit/'") && vite.includes("display: 'standalone'") && vite.includes("cacheId: 'titan-fit-v0.37.0'"), 'PWA, base do GitHub Pages e cache da versão atual devem permanecer configurados');
assert(deploy.includes('actions/deploy-pages@v4') && deploy.includes('npm run validate'), 'Deploy deve validar e publicar no GitHub Pages');
assert(app.includes("const APP_VERSION = '0.37.0'") && app.includes('Hoje') && app.includes('Programação') && app.includes('Cardio') && app.includes('Progresso') && app.includes('Configurações') && !app.includes("{ id: 'history', label: 'Histórico' }") && !app.includes("{ id: 'week', label: 'Semana' }"), 'Navegação principal deve usar Programação no lugar de Histórico, manter Cardio e exibir a versão atual');
assert(!app.includes("{ id: 'plan', label: 'Projeto' }"), 'Projeto não deve ocupar uma aba principal');
assert(app.includes('Ativar demonstração completa') && app.includes('Remover dados da demonstração') && app.includes('Resetar TITAN FIT') && app.includes('Digite RESETAR'), 'Configurações deve separar demo, remoção da demo e reset protegido');
assert(app.includes('Histórico, cardio e evolução corporal são preservados') && app.includes('Remover apenas o projeto ativo?'), 'Remover projeto deve declarar que preserva os dados históricos');
assert(fullDemo.includes('demoPlan') && fullDemo.includes('demoWorkoutHistory') && fullDemo.includes('loadFullDemo') && fullDemo.includes('saveWorkoutHistory') && fullDemo.includes('saveBodyEvolution'), 'Modo demonstração deve popular projeto, histórico e evolução corporal');
assert(fullDemo.includes('cardioSchedule') && fullDemo.includes('buildCardioHistory') && fullDemo.includes('averageHeartRate') && fullDemo.includes('distanceMeters'), 'Modo demonstração deve incluir cardio diário com métricas reais');
assert(fullDemo.includes('buildStrengthHistory') && fullDemo.includes('sequenceIndex') && fullDemo.includes("exercise.id === 'chest-press'"), 'Modo demonstração deve incluir histórico suficiente para progressão, PR e estagnação');
assert(sessionHistoryPage.includes('Histórico') && sessionHistoryPage.includes('loadWorkoutHistory') && sessionHistoryPage.includes('history-session-card'), 'Histórico interno deve continuar disponível para PR, Coach, Score e diagnóstico');
assert(programmingPage.includes('Treinos da semana') && programmingPage.includes('Cardio da semana') && programmingPage.includes('Erros comuns') && programmingPage.includes('Alternativas'), 'Programação deve reunir semana de musculação, cardio e consulta de execução');
assert(demoEvolution.includes("Array.from({ length: 6 }") && demoEvolution.includes('bodyFatPercent') && demoEvolution.includes('muscleMassKg') && demoEvolution.includes('measurements'), 'Dados demo devem conter série mensal completa de evolução corporal');
assert(resetData.includes('localStorage.clear()') && resetData.includes('clearStore') && resetData.includes('STORE_NAMES'), 'Reset total deve limpar LocalStorage e todas as stores IndexedDB');
assert(types.includes("'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility'"), 'ExerciseType deve suportar os cinco tipos');
assert(types.includes('videoPolicy') && types.includes('TitanVideoLibrary') && types.includes('channel?'), 'Metadados de vídeo v2.4 devem existir');
assert(types.includes('TitanExerciseAlternative') && types.includes('alternativeExercises?: TitanExerciseAlternative[]'), 'Plano deve suportar alternativas estruturadas com identidade própria');
assert(validation.includes("readString(value.exerciseType) || 'strength'"), 'Ficha antiga sem exerciseType deve assumir strength');
assert(validation.includes('explicitId') && validation.includes('pending-curation') && validation.includes('videoLibrary'), 'Importação deve aceitar videoId e metadados da biblioteca');
assert(validation.includes('validateAlternativeExercise') && validation.includes('alternativeExercises'), 'Importador deve validar alternativas estruturadas de exercício');
assert(workoutTypes.includes('distanceMeters') && workoutTypes.includes('speedKmh') && workoutTypes.includes('notes'), 'Execução deve persistir métricas avançadas');
assert(historyTypes.includes('totalDistanceMeters') && historyTypes.includes('bestInclinePercent') && historyTypes.includes('averageHeartRate'), 'Histórico deve preservar métricas de cardio');
assert(execution.includes('youtube-nocookie.com/embed/') && execution.includes('Rever execução') && execution.includes('começar séries'), 'Experiência visual por vídeo deve permanecer funcional dentro do treino');
assert(execution.includes('exerciseOptions(baseExercise)') && execution.includes('selectedExerciseId: option.id') && execution.includes('histórico, PR e progressão'), 'Modo treino deve permitir trocar para alternativa e usar a identidade do exercício executado');
assert(cardioPage.includes('Condicionamento + 5 km') && cardioPage.includes('loadWorkoutHistory') && cardioPage.includes('cardioSchedule') && cardioPage.includes("exercise.exerciseType === 'cardio'") && cardioPage.includes('Último cardio'), 'Aba Cardio deve reunir planejamento e histórico cardiovascular');
assert(progressPage.includes('BodyEvolutionPage') && progressPage.includes("'body' | 'training'") && progressPage.includes('PrHall'), 'Progresso deve reunir evolução corporal e Hall dos PRs de treino');
assert(evolution.includes('EVOLUÇÃO CORPORAL') && evolution.includes('Última vs. anterior') && evolution.includes('Evolução mensal') && evolution.includes('Nova avaliação corporal') && evolution.includes('Avaliação corporal completa') && evolution.includes('evolution-register-screen'), 'Centro de evolução deve funcionar como dashboard corporal');
assert(!progressPage.includes('🏆 Volume:') && !progressPage.includes('de volume'), 'Volume total não deve aparecer na interface de progresso');
assert(evolutionTypes.includes('BodyEvolutionEntry') && evolutionTypes.includes('EvolutionPhoto') && evolutionTypes.includes('BioimpedanceData'), 'Modelo de evolução corporal deve permanecer versionado');
assert(evolutionStorage.includes('STORE_NAMES.preferences') && evolutionStorage.includes('body-evolution-v1'), 'Evolução corporal deve ser persistida no IndexedDB e incluída no backup');
assert(videoLibrary.toLowerCase().includes('cadeira flexora') && videoLibrary.includes('Zss6E3VU6X0') && videoLibrary.toLowerCase().includes('eleva[cç][aã]o lateral unilateral na polia'), 'Biblioteca interna de fallback deve permanecer funcional');
assert(progressPage.includes('HALL DOS PRs') && progressPage.includes('PRs conquistados') && progressPage.includes('buildPrGroups') && progressPage.includes('ExercisePrHistory'), 'Progresso de treino deve exibir PRs agrupados com histórico sob demanda');
assert(!progressPage.includes('Recuperação estimada') && !progressPage.includes('calculateRecovery'), 'Recuperação e fadiga não devem poluir o Hall dos PRs');
assert(intelligence.includes('calculateStrengthPr') && intelligence.includes('getProgressionAdvice') && intelligence.includes('calculateRecovery'), 'Motor de inteligência do Coach deve permanecer disponível para uso contextual no treino');
assert(database.includes('indexedDB.open') && backup.includes('restoreBackup'), 'Persistência e backup devem permanecer funcionais');

const forbidden = ['IronFit', 'TreinoFit', 'Projeto Titan', 'Titan App'];
async function walk(dir) {
  for (const entry of await readdir(dir)) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry)) continue;
    const full = path.join(dir, entry); const info = await stat(full);
    if (info.isDirectory()) { await walk(full); continue; }
    if (entry.endsWith('.lock') || full === validatorPath) continue;
    const text = await readFile(full, 'utf8').catch(() => '');
    for (const term of forbidden) assert(!text.includes(term), `${full} contém termo proibido: ${term}`);
  }
}
await walk(root);
if (failures.length) { console.error('Validação falhou:\n- ' + failures.join('\n- ')); process.exit(1); }
console.log('Validação do TITAN FIT v0.37.0 concluída com sucesso.');
