// v0.58.18 rerun after separating Fast Refresh-safe utilities
import fs from 'node:fs';

function replace(path, before, after) {
  const text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(`Marker not found in ${path}: ${before.slice(0, 100)}`);
  fs.writeFileSync(path, text.replace(before, after));
}

replace(
  'src/features/programming/ProgrammingPage.tsx',
  "import { ExerciseLibraryPage } from '../exercise-library/ExerciseLibraryPage';",
  "import { ExerciseLibraryPage } from '../exercise-library/ExerciseLibraryPage';\nimport { TrainingPlanExport } from './TrainingPlanExport';"
);
replace(
  'src/features/programming/ProgrammingPage.tsx',
  "    <div className=\"programming-tabs programming-tabs-two\" role=\"tablist\" aria-label=\"Conteúdo da programação\"><button type=\"button\" role=\"tab\" aria-selected={activeTab === 'week'} className={activeTab === 'week' ? 'active' : ''} onClick={() => setActiveTab('week')}>Treino</button><button type=\"button\" role=\"tab\" aria-selected={activeTab === 'library'} className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>Biblioteca</button></div>\n    {activeTab === 'library' && <ExerciseLibraryPage />}",
  "    <div className=\"programming-tabs programming-tabs-two\" role=\"tablist\" aria-label=\"Conteúdo da programação\"><button type=\"button\" role=\"tab\" aria-selected={activeTab === 'week'} className={activeTab === 'week' ? 'active' : ''} onClick={() => setActiveTab('week')}>Treino</button><button type=\"button\" role=\"tab\" aria-selected={activeTab === 'library'} className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>Biblioteca</button></div>\n    {activeTab === 'week' && plan && <TrainingPlanExport plan={plan} />}\n    {activeTab === 'library' && <ExerciseLibraryPage />}"
);

replace(
  'src/main.tsx',
  "import './styles/programming-v033.css';",
  "import './styles/programming-v033.css';\nimport './styles/programming-export-v05818.css';"
);

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '0.58.18';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
lock.version = '0.58.18';
lock.packages[''].version = '0.58.18';
fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');

let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n';
const section = `\n## v0.58.18 — Exportação do treino atual\n- Programação ganha a ação Exportar treino atual.\n- Exportação gera o próprio TitanPlan em JSON, compatível com o fluxo de revisão e futura reimportação do TITAN FIT.\n- Arquivo contém somente a programação ativa; histórico, fotos e dados de saúde não são incluídos.\n- Em dispositivos compatíveis, abre o compartilhamento nativo; nos demais, baixa o arquivo JSON.\n- Nome do arquivo inclui o ID do projeto e a data da exportação.\n`;
if (!changelog.includes('## v0.58.18 — Exportação do treino atual')) changelog = changelog.replace(marker, marker + section);
fs.writeFileSync('CHANGELOG.md', changelog);
