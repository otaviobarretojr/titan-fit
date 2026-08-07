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
const historyPage = await read('src/features/history/ProgressPage.tsx');
const intelligence = await read('src/features/history/intelligence.ts');
const evolution = await read('src/features/evolution/BodyEvolutionPage.tsx');
const evolutionStorage = await read('src/features/evolution/storage.ts');
const evolutionTypes = await read('src/features/evolution/types.ts');
const videoLibrary = await read('src/features/exercise-library/videos.ts');
const database = await read('src/core/database/indexedDb.ts');
const backup = await read('src/core/backup/backup.ts');
const deploy = await read('.github/workflows/deploy-pages.yml');

assert(pkg.version === '0.21.0', 'package.json deve usar a versão 0.21.0');
assert(vite.includes("base: '/titan-fit/'") && vite.includes("display: 'standalone'"), 'PWA e base do GitHub Pages devem permanecer configurados');
assert(deploy.includes('actions/deploy-pages@v4') && deploy.includes('npm run validate'), 'Deploy deve validar e publicar no GitHub Pages');
assert(app.includes('Hoje') && app.includes('Projeto') && app.includes('Semana') && app.includes('Progresso') && app.includes('Mais') && app.includes('v0.21.0'), 'Navegação e versão v0.21 devem permanecer disponíveis');
assert(types.includes("'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility'"), 'ExerciseType deve suportar os cinco tipos');
assert(types.includes('videoPolicy') && types.includes('TitanVideoLibrary') && types.includes('channel?'), 'Metadados de vídeo v2.4 devem existir');
assert(validation.includes("readString(value.exerciseType) || 'strength'"), 'Ficha antiga sem exerciseType deve assumir strength');
assert(validation.includes('explicitId') && validation.includes('pending-curation') && validation.includes('videoLibrary'), 'Importação deve aceitar videoId e metadados da biblioteca');
assert(workoutTypes.includes('distanceMeters') && workoutTypes.includes('speedKmh') && workoutTypes.includes('notes'), 'Execução deve persistir métricas avançadas');
assert(historyTypes.includes('totalDistanceMeters') && historyTypes.includes('bestInclinePercent') && historyTypes.includes('averageHeartRate'), 'Histórico deve preservar métricas de cardio');
assert(execution.includes('youtube-nocookie.com/embed/') && execution.includes('Rever execução') && execution.includes('começar séries'), 'Experiência visual por vídeo deve permanecer funcional');
assert(weeklyLibrary.includes('Grupos e exercícios') && weeklyLibrary.includes('getExerciseVideo(exercise)') && weeklyLibrary.includes('youtube-nocookie.com/embed/') && weeklyLibrary.includes('ERROS COMUNS') && weeklyLibrary.includes('ALTERNATIVAS'), 'Aba semanal deve mostrar informações e vídeos com fallback interno');
assert(historyPage.includes('BodyEvolutionPage') && historyPage.includes("'body' | 'training'") && historyPage.includes('ExerciseIntelligenceCard'), 'Progresso deve reunir evolução corporal e de treino');
assert(evolution.includes('Seu físico ao longo do tempo') && evolution.includes('Bioimpedância') && evolution.includes('Fotos') && evolution.includes('Tendências'), 'Centro de evolução deve incluir peso, medidas, bioimpedância, fotos e tendências');
assert(evolutionTypes.includes('BodyEvolutionEntry') && evolutionTypes.includes('EvolutionPhoto') && evolutionTypes.includes('BioimpedanceData'), 'Modelo de evolução corporal deve permanecer versionado');
assert(evolutionStorage.includes('STORE_NAMES.preferences') && evolutionStorage.includes('body-evolution-v1'), 'Evolução corporal deve ser persistida no IndexedDB e incluída no backup');
assert(videoLibrary.toLowerCase().includes('cadeira flexora') && videoLibrary.includes('Zss6E3VU6X0') && videoLibrary.toLowerCase().includes('eleva[cç][aã]o lateral unilateral na polia'), 'Biblioteca interna de fallback deve permanecer funcional e ampliada');
assert(historyPage.includes('Recuperação estimada') && historyPage.includes('COACH TITAN'), 'Histórico deve exibir inteligência, PRs e recuperação');
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
console.log('Validação do TITAN FIT v0.21.0 concluída com sucesso.');
