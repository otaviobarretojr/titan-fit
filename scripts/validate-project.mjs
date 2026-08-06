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
const viewer = await read('src/features/plan/PlanViewer.tsx');
const execution = await read('src/features/workout/WorkoutExecutionView.tsx');
const executionStorage = await read('src/features/workout/storage.ts');
const historyStorage = await read('src/features/history/storage.ts');
const progress = await read('src/features/history/ProgressPage.tsx');
const cardio = await read('src/features/cardio/CardioPage.tsx');
const cardioStorage = await read('src/features/cardio/storage.ts');
const cardioTypes = await read('src/features/cardio/types.ts');
const validation = await read('src/features/plan/validation.ts');
const readme = await read('README.md');

assert(pkg.version === '0.6.0', 'package.json deve usar a versão 0.6.0');
assert(vite.includes("base: '/titan-fit/'"), 'Vite deve usar base /titan-fit/');
assert(vite.includes("start_url: '/titan-fit/'"), 'Manifest deve usar start_url /titan-fit/');
assert(vite.includes("scope: '/titan-fit/'"), 'Manifest deve usar scope /titan-fit/');
assert(app.includes('Hoje') && app.includes('Ficha') && app.includes('Cardio') && app.includes('Evolução') && app.includes('Mais'), 'As cinco áreas principais devem existir');
assert(app.includes('CardioPage') && app.includes('v0.6.0'), 'O módulo de cardio e a versão 0.6 devem estar conectados');
assert(viewer.includes('WorkoutExecutionView') && viewer.includes('onHistoryChange'), 'O modo treino deve notificar alterações no histórico');
assert(execution.includes('Concluir e salvar treino') && execution.includes('createHistoryRecord'), 'A sessão deve poder virar histórico permanente');
assert(execution.includes('weightKg') && execution.includes('repetitions') && execution.includes('rir'), 'Carga, repetições e RIR devem continuar registráveis');
assert(executionStorage.includes('titan-fit:execution:'), 'A sessão ativa deve usar prefixo próprio');
assert(historyStorage.includes('titan-fit:history:v1') && historyStorage.includes('addWorkoutHistoryRecord'), 'O histórico deve persistir localmente e ser versionado');
assert(progress.includes('Progressão por exercício') && progress.includes('MELHOR CARGA') && progress.includes('VOLUME'), 'A evolução deve mostrar carga e volume');
assert(cardio.includes('PRIMEIROS 5 KM') && cardio.includes('Importar plano 5 km') && cardio.includes('Concluir sessão'), 'O módulo de cardio deve importar e concluir sessões do plano 5 km');
assert(cardioStorage.includes('titan-fit:cardio-plan') && cardioStorage.includes('titan-fit:cardio-records'), 'Plano e histórico de cardio devem persistir localmente');
assert(cardioTypes.includes("goal: 'first-5k'") && cardioTypes.includes('CardioPlanWeek'), 'O contrato do plano deve representar semanas e a meta dos primeiros 5 km');
assert(viewer.includes('youtube-nocookie.com/embed/') && viewer.includes('allowFullScreen'), 'O player seguro do YouTube deve continuar existindo');
assert(validation.includes('schemaVersion') && validation.includes('extractYouTubeVideoId'), 'A validação da ficha e dos vídeos deve existir');
assert(!/userProfile|login|signup|auth/i.test(app), 'O aplicativo não pode conter perfil ou autenticação');
assert(readme.includes('TITAN FIT'), 'README deve identificar o TITAN FIT');

const forbidden = ['IronFit', 'TreinoFit', 'Projeto Titan', 'Titan App'];
async function walk(dir) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry)) continue;
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) { await walk(full); continue; }
    if (entry.endsWith('.lock') || full === validatorPath) continue;
    const text = await readFile(full, 'utf8').catch(() => '');
    for (const term of forbidden) assert(!text.includes(term), `${full} contém termo proibido: ${term}`);
  }
}
await walk(root);

if (failures.length) { console.error('Validação falhou:\n- ' + failures.join('\n- ')); process.exit(1); }
console.log('Validação do TITAN FIT v0.6.0 concluída com sucesso.');
