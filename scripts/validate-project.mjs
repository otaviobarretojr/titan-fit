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
const weeklyLibrary = await read('src/features/plan/WeeklyLibraryPage.tsx');
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

assert(pkg.version === '0.21.0', 'package.json deve manter a versão técnica atual');
assert(vite.includes("base: '/titan-fit/'") && vite.includes("display: 'standalone'"), 'PWA e base do GitHub Pages devem permanecer configurados');
assert(deploy.includes('actions/deploy-pages@v4') && deploy.includes('npm run validate'), 'Deploy deve validar e publicar no GitHub Pages');
assert(app.includes('Hoje') && app.includes('Histórico') && app.includes('Semana') && app.includes('Progresso') && app.includes('Configurações') && app.includes('v0.23'), 'Navegação v0.23 deve usar Histórico no lugar de Projeto');
assert(!app.includes("{ id: 'plan', label: 'Projeto' }"), 'Projeto não deve ocupar uma aba principal');
assert(app.includes('Ativar demonstração completa') && app.includes('Resetar TITAN FIT') && app.includes('Digite RESETAR'), 'Configurações deve oferecer demo completa e reset protegido');
assert(fullDemo.includes('demoPlan') && fullDemo.includes('demoWorkoutHistory') && fullDemo.includes('loadFullDemo') && fullDemo.includes('saveWorkoutHistory') && fullDemo.includes('saveBodyEvolution'), 'Modo demonstração deve popular projeto, histórico e evolução corporal');
assert(fullDemo.includes('caminhada-inclinada') && fullDemo.includes('corrida-demo') && fullDemo.includes('averageHeartRate'), 'Modo demonstração deve incluir cardio com métricas reais');
assert(sessionHistoryPage.includes('Histórico') && sessionHistoryPage.includes('loadWorkoutHistory') && sessionHistoryPage.includes('history-session-card'), 'Aba Histórico deve listar e detalhar sessões concluídas');
assert(demoEvolution.includes('demo-body-2026-06') && demoEvolution.includes('demo-body-2026-07') && demoEvolution.includes('demo-body-2026-08') && demoEvolution.includes('bodyFatPercent') && demoEvolution.includes('muscleMassKg'), 'Dados demo devem conter três avaliações mensais completas');
assert(resetData.includes('localStorage.clear()') && resetData.includes('clearStore') && resetData.includes('STORE_NAMES'), 'Reset total deve limpar LocalStorage e todas as stores IndexedDB');
assert(types.includes("'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility'"), 'ExerciseType deve suportar os cinco tipos');
assert(types.includes('videoPolicy') && types.includes('TitanVideoLibrary') && types.includes('channel?'), 'Metadados de vídeo v2.4 devem existir');
assert(validation.includes("readString(value.exerciseType) || 'strength'"), 'Ficha antiga sem exerciseType deve assumir strength');
assert(validation.includes('explicitId') && validation.includes('pending-curation') && validation.includes('videoLibrary'), 'Importação deve aceitar videoId e metadados da biblioteca');
assert(workoutTypes.includes('distanceMeters') && workoutTypes.includes('speedKmh') && workoutTypes.includes('notes'), 'Execução deve persistir métricas avançadas');
assert(historyTypes.includes('totalDistanceMeters') && historyTypes.includes('bestInclinePercent') && historyTypes.includes('averageHeartRate'), 'Histórico deve preservar métricas de cardio');
assert(execution.includes('youtube-nocookie.com/embed/') && execution.includes('Rever execução') && execution.includes('começar séries'), 'Experiência visual por vídeo deve permanecer funcional');
assert(weeklyLibrary.includes('Grupos e exercícios') && weeklyLibrary.includes('getExerciseVideo(exercise)') && weeklyLibrary.includes('youtube-nocookie.com/embed/') && weeklyLibrary.includes('ERROS COMUNS') && weeklyLibrary.includes('ALTERNATIVAS'), 'Aba semanal deve mostrar informações e vídeos com fallback interno');
assert(progressPage.includes('BodyEvolutionPage') && progressPage.includes("'body' | 'training'") && progressPage.includes('ExerciseIntelligenceCard'), 'Progresso deve reunir evolução corporal e de treino');
assert(evolution.includes('EVOLUÇÃO CORPORAL') && evolution.includes('Última vs. anterior') && evolution.includes('Evolução mensal') && evolution.includes('Nova avaliação corporal') && evolution.includes('Avaliação corporal completa') && evolution.includes('evolution-register-screen'), 'Centro de evolução deve funcionar como dashboard corporal');
assert(!progressPage.includes('🏆 Volume:') && !progressPage.includes('de volume'), 'Volume total não deve aparecer na interface de progresso');
assert(evolutionTypes.includes('BodyEvolutionEntry') && evolutionTypes.includes('EvolutionPhoto') && evolutionTypes.includes('BioimpedanceData'), 'Modelo de evolução corporal deve permanecer versionado');
assert(evolutionStorage.includes('STORE_NAMES.preferences') && evolutionStorage.includes('body-evolution-v1'), 'Evolução corporal deve ser persistida no IndexedDB e incluída no backup');
assert(videoLibrary.toLowerCase().includes('cadeira flexora') && videoLibrary.includes('Zss6E3VU6X0') && videoLibrary.toLowerCase().includes('eleva[cç][aã]o lateral unilateral na polia'), 'Biblioteca interna de fallback deve permanecer funcional');
assert(progressPage.includes('Recuperação estimada') && progressPage.includes('COACH TITAN'), 'Progresso deve exibir inteligência, PRs e recuperação');
assert(intelligence.includes('calculateStrengthPr') && intelligence.includes('getProgressionAdvice') && intelligence.includes('calculateRecovery'), 'Motor de inteligência do Coach deve permanecer disponível');
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
console.log('Validação do TITAN FIT v0.23 concluída com sucesso.');
