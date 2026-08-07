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
const dashboard = await read('src/features/dashboard/DashboardPage.tsx');
const database = await read('src/core/database/indexedDb.ts');
const migration = await read('src/core/database/migrateLegacyStorage.ts');
const backup = await read('src/core/backup/backup.ts');
const backupPanel = await read('src/core/backup/BackupPanel.tsx');
const viewer = await read('src/features/plan/PlanViewer.tsx');
const execution = await read('src/features/workout/WorkoutExecutionView.tsx');
const validation = await read('src/features/plan/validation.ts');
const readme = await read('README.md');
const deploy = await read('.github/workflows/deploy-pages.yml');

assert(pkg.version === '0.16.0', 'package.json deve usar a versão 0.16.0');
assert(vite.includes("base: '/titan-fit/'"), 'Vite deve usar base /titan-fit/');
assert(vite.includes("start_url: '/titan-fit/'"), 'Manifest deve usar start_url /titan-fit/');
assert(vite.includes("scope: '/titan-fit/'"), 'Manifest deve usar scope /titan-fit/');
assert(vite.includes("display: 'standalone'"), 'Manifest deve permitir instalação como aplicativo');
assert(vite.includes('cleanupOutdatedCaches') && vite.includes('navigateFallback'), 'PWA deve limpar cache antigo e funcionar offline');
assert(deploy.includes('actions/deploy-pages@v4') && deploy.includes('actions/upload-pages-artifact@v3'), 'Deploy automático do GitHub Pages deve existir');
assert(deploy.includes('npm run lint') && deploy.includes('npm run build') && deploy.includes('npm run validate'), 'Deploy deve validar o aplicativo antes da publicação');
assert(app.includes('Hoje') && app.includes('Projeto') && app.includes('Progresso') && app.includes('Mais'), 'As quatro áreas principais devem existir');
assert(!app.includes('CardioExecutionView') && !app.includes('startCardio'), 'Não deve existir fluxo separado de cardio');
assert(!dashboard.includes('Iniciar cardio') && dashboard.includes('Iniciar treino'), 'O Dashboard deve iniciar apenas o treino completo');
assert(dashboard.includes('cardioCount') && dashboard.includes('muscleGroup'), 'O cardio deve ser reconhecido como exercício do treino');
assert(app.includes('migrateLegacyStorage') && app.includes('BackupPanel') && app.includes('v0.16.0'), 'Engine, backup e versão devem estar conectados ao app');
assert(execution.includes('MODO TREINO') && execution.includes('Próximo exercício'), 'O modo treino deve guiar exercício por exercício');
assert(execution.includes('DESCANSO AUTOMÁTICO') && execution.includes('Registrar série'), 'O modo treino deve oferecer descanso automático e registro rápido');
assert(execution.includes('Última sessão') && execution.includes('Meta de hoje'), 'A progressão deve mostrar histórico e meta da sessão');
assert(execution.includes('Novo PR') && execution.includes('pr-banner'), 'A detecção visual de recordes deve existir');
assert(execution.includes('Volume') && execution.includes('totals.volume'), 'O volume em tempo real deve existir');
assert(execution.includes('Coach TITAN · próxima sessão') && execution.includes('buildCoachRecommendation'), 'O Coach deve recomendar aumentar, manter ou reduzir carga');
assert(execution.includes('Recomendação:') && execution.includes('Motivo:'), 'O Coach deve explicar recomendação e motivo');
assert(execution.includes('VEJA ANTES DE COMEÇAR') && execution.includes('Já assisti · iniciar séries'), 'O exercício com vídeo deve mostrar introdução antes das séries');
assert(execution.includes('youtube-nocookie.com/embed/') && execution.includes('allowFullScreen'), 'O vídeo inicial deve usar player seguro do YouTube');
assert(execution.includes('Pular demonstração') && execution.includes('Assistir execução novamente'), 'O usuário deve poder pular ou rever a demonstração');
assert(execution.includes('TREINO CONCLUÍDO') && execution.includes('summary-grid'), 'O resumo final do treino deve existir');
assert(execution.includes("muscleGroup.toLowerCase() === 'cardio'") && execution.includes('Concluir cardio'), 'O cardio deve funcionar como exercício integrado');
assert(database.includes('indexedDB.open') && database.includes('putRecord') && database.includes('getAllRecords'), 'O adaptador IndexedDB deve oferecer operações básicas');
assert(migration.includes('migratedFromLocalStorageAt') && migration.includes('titan-fit:history:v1'), 'A migração deve preservar os dados legados');
assert(backup.includes("format: 'titan-fit-backup'") && backup.includes('restoreBackup'), 'O contrato de backup e restauração deve existir');
assert(backupPanel.includes('Exportar backup') && backupPanel.includes('Restaurar backup'), 'Os controles de backup devem existir');
assert(viewer.includes('WorkoutExecutionView'), 'A visualização do projeto deve manter o treino funcional');
assert(validation.includes('schemaVersion') && validation.includes('extractYouTubeVideoId'), 'A validação do projeto e dos vídeos deve existir');
assert(!/userProfile|login|signup|auth/i.test(app), 'O aplicativo não pode conter perfil ou autenticação');
assert(readme.includes('v0.16.0') && readme.includes('GitHub Pages'), 'README deve documentar a versão publicável');

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
console.log('Validação do TITAN FIT v0.16.0 concluída com sucesso.');
