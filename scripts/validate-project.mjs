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
const workoutTypes = await read('src/features/workout/types.ts');
const historyTypes = await read('src/features/history/types.ts');
const historyPage = await read('src/features/history/ProgressPage.tsx');
const intelligence = await read('src/features/history/intelligence.ts');
const videoLibrary = await read('src/features/exercise-library/videos.ts');
const database = await read('src/core/database/indexedDb.ts');
const backup = await read('src/core/backup/backup.ts');
const deploy = await read('.github/workflows/deploy-pages.yml');

assert(pkg.version === '0.19.0', 'package.json deve usar a versão 0.19.0');
assert(vite.includes("base: '/titan-fit/'") && vite.includes("display: 'standalone'"), 'PWA e base do GitHub Pages devem permanecer configurados');
assert(deploy.includes('actions/deploy-pages@v4') && deploy.includes('npm run validate'), 'Deploy deve validar e publicar no GitHub Pages');
assert(app.includes('Hoje') && app.includes('Projeto') && app.includes('Progresso') && app.includes('Mais') && app.includes('v0.19.0'), 'Navegação e versão v0.19 devem permanecer disponíveis');
assert(types.includes("'strength' | 'distance' | 'cardio' | 'isometric' | 'mobility'"), 'ExerciseType deve suportar os cinco tipos');
assert(types.includes('durationSeconds') && types.includes('distanceMeters') && types.includes('inclinePercent') && types.includes('averageHeartRate'), 'Campos avançados devem existir no plano');
assert(types.includes('CardioProgressionStep') && types.includes('progression?'), 'Progressão planejada de cardio deve existir');
assert(validation.includes("readString(value.exerciseType) || 'strength'"), 'Ficha antiga sem exerciseType deve assumir strength');
assert(validation.includes("exerciseType === 'distance'") && validation.includes("['cardio', 'isometric', 'mobility'].includes(exerciseType)"), 'Validação deve variar conforme o tipo');
assert(workoutTypes.includes('distanceMeters') && workoutTypes.includes('speedKmh') && workoutTypes.includes('notes'), 'Execução deve persistir métricas avançadas');
assert(historyTypes.includes('totalDistanceMeters') && historyTypes.includes('bestInclinePercent') && historyTypes.includes('averageHeartRate'), 'Histórico deve preservar métricas de cardio');
assert(execution.includes("exerciseType === 'strength'") && execution.includes("exerciseType === 'distance'") && execution.includes("exerciseType === 'cardio'"), 'Interface deve renderizar automaticamente por tipo');
assert(execution.includes('Distância (m)') && execution.includes('Inclinação (%)') && execution.includes('FC média (bpm)'), 'Campos especializados devem aparecer na execução');
assert(execution.includes('youtube-nocookie.com/embed/') && execution.includes('Rever execução') && execution.includes('começar séries'), 'Experiência visual por vídeo deve permanecer funcional');
assert(videoLibrary.includes('Cadeira flexora') && videoLibrary.includes('Zss6E3VU6X0'), 'Biblioteca inicial deve conter o vídeo curado da cadeira flexora');
assert(historyPage.includes('ExerciseIntelligenceCard') && historyPage.includes('Recuperação estimada') && historyPage.includes('COACH TITAN'), 'Histórico deve exibir inteligência, PRs e recuperação');
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
console.log('Validação do TITAN FIT v0.19.0 concluída com sucesso.');
