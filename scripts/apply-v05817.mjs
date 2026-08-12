import fs from 'node:fs';

function replace(path, before, after) {
  const text = fs.readFileSync(path, 'utf8');
  if (!text.includes(before)) throw new Error(`Marker not found in ${path}: ${before.slice(0, 80)}`);
  fs.writeFileSync(path, text.replace(before, after));
}

replace('src/features/workout/WorkoutExecutionView.tsx',
  "{exerciseType === 'strength' && <><div className=\"strength-series-field\"><span>Série</span><strong>{set.setNumber}</strong></div>{numeric('weightKg', 'Peso (kg)', '0.5')}</>}",
  "{exerciseType === 'strength' && <>{numeric('repetitions', 'Repetições', '1')}{numeric('weightKg', 'Peso (kg)', '0.5')}</>}"
);
replace('src/features/workout/WorkoutExecutionView.tsx',
  "if (exerciseType === 'strength') return set.weightKg !== null && set.weightKg >= 0;",
  "if (exerciseType === 'strength') return (set.repetitions ?? 0) > 0 && set.weightKg !== null && set.weightKg >= 0;"
);

let test = fs.readFileSync('tests/WorkoutExecutionView.test.tsx', 'utf8');
test = test.replace("expect(screen.getAllByText('Série').length).toBeGreaterThan(0);", "expect(screen.getByLabelText('Supino máquina série 1 repetições')).toBeInTheDocument();\n    expect(screen.getByLabelText('Supino máquina série 1 carga')).toBeInTheDocument();");
test = test.replace("it('registra somente o peso mantendo o cabeçalho compacto'", "it('registra repetições e peso por série'");
test = test.replace("fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);", "fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '9' } });\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);", 1);
test = test.replace("expect(saved).toContain('\"repetitions\":null');", "expect(saved).toContain('\"repetitions\":9');");
test = test.replace("expect(screen.queryByLabelText('Supino máquina série 1 repetições')).not.toBeInTheDocument();\n    expect(register).toBeDisabled();\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    expect(register).toBeEnabled();", "expect(screen.getByLabelText('Supino máquina série 1 repetições')).toBeInTheDocument();\n    expect(register).toBeDisabled();\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    expect(register).toBeDisabled();\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '8' } });\n    expect(register).toBeEnabled();");
test = test.replace("fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);\n    expect(screen.getByText('DESCANSO AUTOMÁTICO'))", "fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);\n    expect(screen.getByText('DESCANSO AUTOMÁTICO'))");
test = test.replace("fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    fireEvent.change(screen.getByLabelText('Supino máquina série 2 carga'), { target: { value: '82.5' } });", "fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });\n    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });\n    fireEvent.change(screen.getByLabelText('Supino máquina série 2 repetições'), { target: { value: '8' } });\n    fireEvent.change(screen.getByLabelText('Supino máquina série 2 carga'), { target: { value: '82.5' } });");
test = test.replace("expect(screen.getByText('0 kg')).toBeInTheDocument();", "expect(screen.getByText('1.460 kg')).toBeInTheDocument();");
test = test.replace("expect(history).toContain('\"totalVolumeKg\":0');", "expect(history).toContain('\"totalVolumeKg\":1460');", 1);
fs.writeFileSync('tests/WorkoutExecutionView.test.tsx', test);

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.version = '0.58.17'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')); lock.version = '0.58.17'; lock.packages[''].version = '0.58.17'; fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n';
const section = `\n## v0.58.17 — Repetições + Peso\n- Cada série de musculação mantém sua identificação no cabeçalho (Série 1 de N, Série 2 de N...).\n- Os dois campos de preenchimento passam a ser Repetições e Peso (kg).\n- RIR continua removido do preenchimento manual.\n- Registro da série exige repetições válidas e peso informado, restaurando volume e PR por repetição/carga.\n`;
if (!changelog.includes('## v0.58.17 — Repetições + Peso')) changelog = changelog.replace(marker, marker + section);
fs.writeFileSync('CHANGELOG.md', changelog);
