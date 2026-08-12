from pathlib import Path

workout = Path('src/features/workout/WorkoutExecutionView.tsx')
s = workout.read_text()
replacements = [
    ("{exerciseType === 'strength' && <>{numeric('weightKg', 'Carga (kg)', '0.5')}{numeric('repetitions', 'Repetições')}{numeric('rir', 'RIR')}</>}", "{exerciseType === 'strength' && numeric('weightKg', 'Peso (kg)', '0.5')}"),
    ('Carga, repetições, RIR, histórico, PR e progressão ficam vinculados ao exercício realmente executado.', 'Peso, histórico e evolução ficam vinculados ao exercício realmente executado.'),
    ("if (exerciseType === 'strength') return set.weightKg !== null && set.weightKg >= 0 && (set.repetitions ?? 0) > 0 && set.rir !== null && set.rir >= 0 && set.rir <= 10;", "if (exerciseType === 'strength') return set.weightKg !== null && set.weightKg >= 0;"),
    ('Conclua o exercício em 6–12 reps e registre o RIR para liberar uma progressão segura.', 'Registre a carga executada em cada série. Sem dados suficientes, o TITAN mantém a progressão conservadora.'),
    ('Conclua o exercício dentro da faixa e registre o RIR para confirmar a progressão.', 'Registre a carga executada em cada série para manter o histórico atualizado.'),
]
for before, after in replacements:
    s = s.replace(before, after)
workout.write_text(s)

test = Path('tests/WorkoutExecutionView.test.tsx')
s = test.read_text()
s = s.replace("it('registra carga, repetições e RIR mantendo o cabeçalho compacto'", "it('registra somente o peso mantendo o cabeçalho compacto'")
for line in [
    "    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '9' } });\n",
    "    fireEvent.change(screen.getByLabelText('Supino máquina série 1 RIR'), { target: { value: '1' } });\n",
    "    fireEvent.change(screen.getByLabelText('Supino máquina série 1 RIR'), { target: { value: '2' } });\n",
    "    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });\n",
    "    fireEvent.change(screen.getByLabelText('Supino máquina série 2 repetições'), { target: { value: '8' } });\n",
    "    fireEvent.change(screen.getByLabelText('Supino máquina série 2 RIR'), { target: { value: '2' } });\n",
]:
    s = s.replace(line, '')
s = s.replace("    expect(saved).toContain('\"repetitions\":9');\n    expect(saved).toContain('\"rir\":1');", "    expect(saved).toContain('\"repetitions\":null');\n    expect(saved).toContain('\"rir\":null');")
start = """    const register = screen.getAllByRole('button', { name: 'Registrar série' })[0];
    expect(screen.getByLabelText('Supino máquina série 1 RIR')).toHaveValue(null);
    expect(register).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    expect(register).toBeDisabled();
    expect(register).toBeEnabled();
"""
replacement = """    const register = screen.getAllByRole('button', { name: 'Registrar série' })[0];
    expect(screen.queryByLabelText('Supino máquina série 1 RIR')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Supino máquina série 1 repetições')).not.toBeInTheDocument();
    expect(register).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    expect(register).toBeEnabled();
"""
if start in s:
    s = s.replace(start, replacement)
else:
    old = """    const register = screen.getAllByRole('button', { name: 'Registrar série' })[0];
    expect(screen.getByLabelText('Supino máquina série 1 RIR')).toHaveValue(null);
    expect(register).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '9' } });
    expect(register).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 RIR'), { target: { value: '2' } });
    expect(register).toBeEnabled();
"""
    s = s.replace(old, replacement)
s = s.replace("    expect(screen.getByText('1.460 kg')).toBeInTheDocument();", "    expect(screen.getByText('0 kg')).toBeInTheDocument();")
s = s.replace("    expect(history).toContain('\"totalVolumeKg\":1460');", "    expect(history).toContain('\"totalVolumeKg\":0');")
test.write_text(s)

regression = Path('src/features/workout/WorkoutExecutionView.rir.test.tsx')
regression.write_text("""import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkoutExecutionView } from './WorkoutExecutionView';
import type { TitanWorkoutDay } from '../plan/types';

describe('strength set entry', () => {
  it('asks only for the weight in each strength set', () => {
    const workout: TitanWorkoutDay = { id:'weight-only-test', day:'Segunda', title:'Teste', exercises:[{ id:'bench-test', name:'Supino teste', muscleGroup:'Peito', exerciseType:'strength', sets:1, minReps:8, maxReps:12, restSeconds:60 }] };
    render(<WorkoutExecutionView planId=\"test-plan\" planName=\"Teste\" workout={workout} onBack={() => {}} onCompleted={() => {}} />);
    expect(screen.getByText('Peso (kg)')).toBeInTheDocument();
    expect(screen.queryByText(/^RIR$/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Repetições')).not.toBeInTheDocument();
  });
});
""")

pkg = Path('package.json')
import json
obj = json.loads(pkg.read_text()); obj['version'] = '0.58.15'; pkg.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
lock = Path('package-lock.json'); obj = json.loads(lock.read_text()); obj['version']='0.58.15'; obj['packages']['']['version']='0.58.15'; lock.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

changelog = Path('CHANGELOG.md')
s = changelog.read_text()
marker = 'Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.\n'
section = '''\n## v0.58.15 — Registro de séries simplificado\n- Cada série de musculação pede somente o peso/carga executado.\n- Campos manuais de repetições e RIR foram removidos do modo treino.\n- O TITAN não inventa repetições ou esforço; sem esses dados, análises dependentes deles ficam conservadoras.\n'''
if '## v0.58.15 — Registro de séries simplificado' not in s:
    s = s.replace(marker, marker + section)
changelog.write_text(s)
