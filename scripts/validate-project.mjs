import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const pkg = JSON.parse(await read('package.json'));
const vite = await read('vite.config.ts');
const app = await read('src/app/App.tsx');
const readme = await read('README.md');

assert(pkg.version === '0.1.0', 'package.json deve usar a versão 0.1.0');
assert(vite.includes("base: '/titan-fit/'"), 'Vite deve usar base /titan-fit/');
assert(vite.includes("start_url: '/titan-fit/'"), 'Manifest deve usar start_url /titan-fit/');
assert(vite.includes("scope: '/titan-fit/'"), 'Manifest deve usar scope /titan-fit/');
assert(app.includes('Hoje') && app.includes('Ficha') && app.includes('Cardio') && app.includes('Evolução') && app.includes('Mais'), 'As cinco áreas principais devem existir');
assert(!/userProfile|login|signup|auth/i.test(app), 'O shell não pode conter perfil ou autenticação');
assert(!/supino|agachamento|puxada|treino a|treino b/i.test(app), 'O shell não pode conter treino fixo');
assert(readme.includes('TITAN FIT'), 'README deve identificar o TITAN FIT');

const forbidden = ['IronFit', 'TreinoFit', 'Projeto Titan', 'Titan App'];
async function walk(dir) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry)) continue;
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) await walk(full);
    else if (!entry.endsWith('.lock')) {
      const text = await readFile(full, 'utf8').catch(() => '');
      for (const term of forbidden) assert(!text.includes(term), `${full} contém termo proibido: ${term}`);
    }
  }
}
await walk(root);

if (failures.length) {
  console.error('Validação falhou:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('Validação do TITAN FIT v0.1.0 concluída com sucesso.');
