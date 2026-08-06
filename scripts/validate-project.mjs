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
const database = await read('src/core/database/indexedDb.ts');
const migration = await read('src/core/database/migrateLegacyStorage.ts');
const backup = await read('src/core/backup/backup.ts');
const backupPanel = await read('src/core/backup/BackupPanel.tsx');
const viewer = await read('src/features/plan/PlanViewer.tsx');
const execution = await read('src/features/workout/WorkoutExecutionView.tsx');
const cardio = await read('src/features/cardio/CardioPage.tsx');
const coach = await read('src/features/coach/CoachPage.tsx');
const validation = await read('src/features/plan/validation.ts');
const readme = await read('README.md');

assert(pkg.version === '0.8.0', 'package.json deve usar a versão 0.8.0');
assert(vite.includes("base: '/titan-fit/'"), 'Vite deve usar base /titan-fit/');
assert(vite.includes("start_url: '/titan-fit/'"), 'Manifest deve usar start_url /titan-fit/');
assert(vite.includes("scope: '/titan-fit/'"), 'Manifest deve usar scope /titan-fit/');
assert(app.includes('Hoje') && app.includes('Ficha') && app.includes('Cardio') && app.includes('Coach') && app.includes('Evolução') && app.includes('Mais'), 'As seis áreas principais devem existir');
assert(app.includes('migrateLegacyStorage') && app.includes('BackupPanel') && app.includes('v0.8.0'), 'A Engine e o backup devem estar conectados ao app');
assert(database.includes('indexedDB.open') && database.includes('putRecord') && database.includes('getAllRecords'), 'O adaptador IndexedDB deve oferecer operações básicas');
assert(migration.includes('migratedFromLocalStorageAt') && migration.includes('titan-fit:history:v1'), 'A migração deve preservar os dados legados');
assert(backup.includes("format: 'titan-fit-backup'") && backup.includes('restoreBackup'), 'O contrato de backup e restauração deve existir');
assert(backupPanel.includes('Exportar backup') && backupPanel.includes('Restaurar backup'), 'Os controles de backup devem existir');
assert(viewer.includes('WorkoutExecutionView'), 'A visualização da ficha deve continuar funcional');
assert(execution.includes('Concluir e salvar treino') && execution.includes('weightKg'), 'A execução série por série deve continuar existindo');
assert(cardio.includes('PRIMEIROS 5 KM') && cardio.includes('Concluir sessão'), 'O módulo de cardio deve continuar funcional');
assert(coach.includes('SCORE TITAN') && coach.includes('Escopo atual'), 'O Coach deve continuar funcional');
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
console.log('Validação do TITAN FIT v0.8.0 concluída com sucesso.');
