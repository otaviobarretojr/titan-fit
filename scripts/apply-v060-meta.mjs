import fs from 'node:fs';

const version = '0.60.0';
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
lock.version = version;
if (lock.packages?.['']) lock.packages[''].version = version;
fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');

const changelogPath = 'CHANGELOG.md';
let changelog = fs.readFileSync(changelogPath, 'utf8');
const marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n';
const section = `\n## v0.60.0 — Visual Rework\n- Nova camada visual definitiva para celular, preservando integralmente regras, dados e comportamento do TITAN FIT.\n- Cabeçalho global compactado e hierarquia tipográfica revisada.\n- Navegação inferior redesenhada com quatro zonas equilibradas, estado ativo discreto e safe-area Android preservada.\n- Home reorganizada com treino do dia como ação dominante e Coach TITAN mais compacto.\n- Programação recebe cards semanais mais enxutos, detalhe de treino mais limpo e melhor densidade de informação.\n- Saúde/Evolução ganha seletor horizontal compacto e padrão visual unificado entre suas áreas.\n- Ajustes passa a usar cards mais simples, menos profundidade visual e ações secundárias consistentes.\n- Modo treino recebe cabeçalho de saída compacto, progresso enxuto, PR/Meta priorizados, campos de execução mais legíveis e navegação de exercício fixa ao alcance do polegar.\n- Paleta, raios, bordas, sombras e espaçamentos passam a seguir um único sistema visual v0.60.\n`;
if (!changelog.includes('## v0.60.0 — Visual Rework')) changelog = changelog.replace(marker, marker + section);
fs.writeFileSync(changelogPath, changelog);
