import { demoBodyEvolution } from '../evolution/demoData';
import { saveBodyEvolution } from '../evolution/storage';
import { saveWorkoutHistory } from '../history/storage';
import type { HistoryExercise, HistorySet, WorkoutHistoryRecord } from '../history/types';
import { saveActivePlan } from '../plan/storage';
import type { ExerciseType, TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';

const planId = 'titan-demo-v023';

const strength = (id: string, name: string, muscleGroup: string, sets: number, minReps: number, maxReps: number, rir: number, restSeconds: number, technique: string, commonMistakes: string[], alternatives: string[]): TitanExercise => ({
  id, name, muscleGroup, exerciseType: 'strength', sets, minReps, maxReps, targetRir: rir, restSeconds, technique, commonMistakes, alternatives, videoPolicy: 'required'
});

const cardio = (id: string, name: string, durationSeconds: number, speedKmh: number, inclinePercent: number, zone = 'Zona 2'): TitanExercise => ({
  id, name, muscleGroup: 'Cardio', exerciseType: 'cardio', durationSeconds, speedKmh, inclinePercent, cardioZone: zone, notes: 'Mantenha ritmo contínuo e confortável, sem apoiar o peso do corpo nas barras.', videoPolicy: 'not-required'
});

const workouts: TitanWorkoutDay[] = [
  { id: 'demo-push-a', day: 'Segunda-feira', title: 'PUSH A — Peitoral superior e tríceps', focus: 'Prioridade para peitoral superior, deltoide lateral e tríceps.', exercises: [
    strength('supino-inclinado-halteres', 'Supino inclinado com halteres', 'Peitoral superior', 4, 8, 12, 2, 120, 'Banco baixo, escápulas firmes e descida controlada.', ['Inclinação excessiva', 'Perder retração escapular'], ['Supino inclinado na máquina']),
    strength('chest-press', 'Chest press convergente', 'Peitoral', 3, 10, 15, 1, 90, 'Empurre em arco sem elevar os ombros.', ['Encurtar amplitude', 'Elevar os ombros'], ['Supino máquina']),
    strength('crucifixo-polia', 'Crucifixo na polia baixa', 'Peitoral superior', 3, 12, 15, 1, 75, 'Conduza as mãos para cima e para dentro mantendo tensão.', ['Dobrar demais os cotovelos'], ['Crucifixo inclinado']),
    strength('elevacao-lateral-polia', 'Elevação lateral unilateral na polia', 'Deltoide lateral', 3, 12, 20, 1, 60, 'Eleve no plano da escápula conduzindo pelo cotovelo.', ['Balançar o tronco', 'Subir com o trapézio'], ['Elevação lateral na máquina']),
    strength('triceps-corda', 'Tríceps na corda', 'Tríceps', 3, 10, 15, 1, 75, 'Fixe os cotovelos e separe a corda no final.', ['Mover os cotovelos', 'Usar impulso'], ['Tríceps barra V'])
  ]},
  { id: 'demo-pull-a', day: 'Terça-feira', title: 'PULL A — Costas e bíceps', focus: 'Espessura de costas, dorsais e flexores do cotovelo.', exercises: [
    strength('puxada-frente', 'Puxada frente pegada neutra', 'Dorsais', 4, 8, 12, 2, 120, 'Depressa as escápulas antes de flexionar os cotovelos.', ['Inclinar demais o tronco'], ['Puxada articulada']),
    strength('remada-baixa', 'Remada baixa neutra', 'Costas', 4, 8, 12, 1, 120, 'Mantenha o peito alto e finalize com as escápulas.', ['Arredondar a lombar'], ['Remada máquina']),
    strength('remada-unilateral', 'Remada unilateral com halter', 'Costas', 3, 10, 12, 1, 90, 'Puxe o cotovelo em direção ao quadril.', ['Girar o tronco'], ['Remada unilateral máquina']),
    strength('rosca-inclinada', 'Rosca inclinada com halteres', 'Bíceps', 3, 8, 12, 1, 75, 'Mantenha o braço atrás do tronco e controle a descida.', ['Projetar o ombro'], ['Rosca alternada']),
    strength('rosca-martelo', 'Rosca martelo', 'Bíceps e braquial', 3, 10, 15, 1, 75, 'Punhos neutros e cotovelos estáveis.', ['Balançar o tronco'], ['Rosca martelo na corda'])
  ]},
  { id: 'demo-legs-a', day: 'Quarta-feira', title: 'LEGS A — Quadríceps e panturrilhas', focus: 'Quadríceps com execução estável e progressão controlada.', exercises: [
    strength('agachamento-hack', 'Agachamento Hack', 'Quadríceps', 4, 6, 10, 2, 150, 'Desça com joelhos acompanhando a linha dos pés.', ['Perder apoio do calcanhar'], ['Leg press 45°']),
    strength('leg-press', 'Leg press 45°', 'Quadríceps', 4, 10, 15, 1, 120, 'Controle a profundidade sem tirar o quadril do encosto.', ['Bloquear joelhos'], ['Hack squat']),
    strength('cadeira-extensora', 'Cadeira extensora', 'Quadríceps', 3, 12, 15, 1, 75, 'Estenda controlando e segure brevemente no topo.', ['Usar impulso'], ['Extensão unilateral']),
    strength('panturrilha-leg', 'Panturrilha no leg press', 'Panturrilhas', 4, 10, 15, 1, 60, 'Use amplitude completa e pausa no alongamento.', ['Repetições curtas'], ['Panturrilha em pé'])
  ]},
  { id: 'demo-shoulders', day: 'Quinta-feira', title: 'OMBROS — Deltoides e core', focus: 'Deltoide lateral e posterior com trabalho complementar de core.', exercises: [
    strength('desenvolvimento-maquina', 'Desenvolvimento na máquina', 'Ombros', 3, 8, 12, 2, 120, 'Mantenha costas apoiadas e não force amplitude dolorosa.', ['Arquear excessivamente'], ['Desenvolvimento com halteres']),
    strength('elevacao-lateral', 'Elevação lateral com halteres', 'Deltoide lateral', 4, 12, 20, 1, 60, 'Conduza pelos cotovelos com controle.', ['Usar balanço'], ['Elevação lateral na polia']),
    strength('crucifixo-inverso', 'Crucifixo inverso na máquina', 'Deltoide posterior', 3, 12, 15, 1, 75, 'Abra os braços sem projetar a cabeça.', ['Encolher os ombros'], ['Face pull']),
    { id: 'prancha', name: 'Prancha', muscleGroup: 'Core', exerciseType: 'isometric', sets: 3, durationSeconds: 45, restSeconds: 60, technique: 'Mantenha costelas e pelve alinhadas.', commonMistakes: ['Elevar o quadril', 'Perder a posição lombar'], alternatives: ['Dead bug'], videoPolicy: 'required' }
  ]},
  { id: 'demo-legs-b', day: 'Sexta-feira', title: 'LEGS B — Posterior, glúteos e panturrilhas', focus: 'Prioridade para posteriores de coxa e glúteos com exercícios estáveis.', exercises: [
    strength('cadeira-flexora', 'Cadeira flexora', 'Posterior de coxa', 4, 8, 12, 2, 90, 'Mantenha quadril apoiado e controle a extensão.', ['Elevar o quadril'], ['Mesa flexora']),
    strength('levantamento-romeno', 'Levantamento terra romeno com halteres', 'Posterior e glúteos', 3, 8, 12, 2, 120, 'Leve o quadril para trás mantendo a coluna neutra.', ['Arredondar a lombar'], ['Stiff na máquina']),
    strength('hip-thrust', 'Hip thrust', 'Glúteos', 4, 8, 12, 1, 120, 'Finalize com pelve neutra e pausa no topo.', ['Hiperestender a lombar'], ['Glute drive']),
    strength('panturrilha-sentado', 'Panturrilha sentada', 'Panturrilhas', 4, 10, 15, 1, 60, 'Use amplitude completa e controle.', ['Quicar a carga'], ['Panturrilha em pé']),
    cardio('caminhada-inclinada', 'Cardio — Caminhada inclinada em Zona 2', 1200, 5.8, 8)
  ]},
  { id: 'demo-upper-b', day: 'Domingo', title: 'UPPER B + CORRIDA', focus: 'Treino superior complementar com condicionamento.', exercises: [
    strength('supino-maquina', 'Supino máquina', 'Peitoral', 3, 8, 12, 2, 90, 'Escápulas apoiadas e amplitude controlada.', ['Elevar os ombros'], ['Supino com halteres']),
    strength('remada-maquina', 'Remada máquina articulada', 'Costas', 3, 8, 12, 2, 90, 'Mantenha o tórax estável.', ['Usar impulso'], ['Remada baixa']),
    strength('elevacao-lateral-upper', 'Elevação lateral na máquina', 'Deltoide lateral', 3, 12, 20, 1, 60, 'Suba controlando o ombro.', ['Encolher os ombros'], ['Elevação lateral com halteres']),
    strength('rosca-cabo', 'Rosca no cabo', 'Bíceps', 3, 10, 15, 1, 60, 'Cotovelos estáveis durante toda a série.', ['Balançar o tronco'], ['Rosca direta']),
    strength('triceps-barra', 'Tríceps barra V', 'Tríceps', 3, 10, 15, 1, 60, 'Mantenha cotovelos fixos.', ['Abrir cotovelos'], ['Tríceps na corda']),
    cardio('corrida-demo', 'Corrida leve', 1500, 8.0, 0, 'Zona 2–3')
  ]}
];

export const demoPlan: TitanPlan = {
  schemaVersion: 1,
  id: planId,
  name: 'Projeto TITAN — Demonstração',
  description: 'Projeto demonstrativo completo para explorar todas as áreas do TITAN FIT.',
  createdAt: '2026-08-01T12:00:00.000Z',
  author: 'TITAN FIT',
  project: { name: 'Projeto TITAN — Hipertrofia + 5 km', objective: 'Hipertrofia com condicionamento cardiovascular', startDate: '2026-06-01', durationWeeks: 12, strengthStartTime: '19:30', cardioGoal: 'Melhorar condicionamento e correr 5 km' },
  videoLibrary: { version: 'demo-v1', curatedVideos: 25, cardioWithoutVideo: 2 },
  workouts
};

const set = (setNumber: number, weightKg: number | null, repetitions: number | null, rir: number | null): HistorySet => ({ setNumber, weightKg, repetitions, rir, durationSeconds: null, distanceMeters: null, speedKmh: null, inclinePercent: null, averagePace: null, averageHeartRate: null, calories: null, notes: null });
const cardioSet = (durationSeconds: number, distanceMeters: number, speedKmh: number, inclinePercent: number, averageHeartRate: number, calories: number): HistorySet => ({ setNumber: 1, weightKg: null, repetitions: null, rir: null, durationSeconds, distanceMeters, speedKmh, inclinePercent, averagePace: null, averageHeartRate, calories, notes: 'Sessão demonstrativa concluída dentro da intensidade planejada.' });

function exercise(id: string, name: string, muscleGroup: string, sets: HistorySet[], exerciseType: ExerciseType = 'strength'): HistoryExercise {
  const weights = sets.map((item) => item.weightKg).filter((value): value is number => value !== null);
  const distances = sets.map((item) => item.distanceMeters ?? 0);
  const durations = sets.map((item) => item.durationSeconds ?? 0);
  const speeds = sets.map((item) => item.speedKmh).filter((value): value is number => value !== null);
  const inclines = sets.map((item) => item.inclinePercent).filter((value): value is number => value !== null);
  const hrs = sets.map((item) => item.averageHeartRate).filter((value): value is number => value !== null);
  return { exerciseId: id, name, muscleGroup, exerciseType, sets, volumeKg: 0, bestWeightKg: weights.length ? Math.max(...weights) : null, totalDistanceMeters: distances.reduce((a, b) => a + b, 0), totalDurationSeconds: durations.reduce((a, b) => a + b, 0), bestSpeedKmh: speeds.length ? Math.max(...speeds) : null, bestInclinePercent: inclines.length ? Math.max(...inclines) : null, averageHeartRate: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null };
}

function history(id: string, workoutId: string, title: string, day: string, date: string, durationMinutes: number, exercises: HistoryExercise[]): WorkoutHistoryRecord {
  const startedAt = `${date}T22:30:00.000Z`;
  const completedAt = new Date(new Date(startedAt).getTime() + durationMinutes * 60000).toISOString();
  return { id, planId, planName: demoPlan.name, workoutId, workoutTitle: title, workoutDay: day, startedAt, completedAt, durationSeconds: durationMinutes * 60, totalSets: exercises.reduce((total, item) => total + item.sets.length, 0), totalVolumeKg: 0, exercises };
}

export const demoWorkoutHistory: WorkoutHistoryRecord[] = [
  history('demo-history-06', 'demo-shoulders', 'OMBROS — Deltoides e core', 'Quinta-feira', '2026-08-06', 58, [
    exercise('desenvolvimento-maquina', 'Desenvolvimento na máquina', 'Ombros', [set(1, 45, 12, 2), set(2, 50, 10, 2), set(3, 50, 10, 1)]),
    exercise('elevacao-lateral', 'Elevação lateral com halteres', 'Deltoide lateral', [set(1, 10, 16, 2), set(2, 12, 14, 1), set(3, 12, 13, 1), set(4, 12, 12, 1)]),
    exercise('crucifixo-inverso', 'Crucifixo inverso na máquina', 'Deltoide posterior', [set(1, 35, 15, 2), set(2, 40, 13, 1), set(3, 40, 12, 1)]),
    { ...exercise('prancha', 'Prancha', 'Core', [{ ...set(1, null, null, null), durationSeconds: 45 }, { ...set(2, null, null, null), durationSeconds: 45 }, { ...set(3, null, null, null), durationSeconds: 50 }], 'isometric') }
  ]),
  history('demo-history-05', 'demo-legs-a', 'LEGS A — Quadríceps e panturrilhas', 'Quarta-feira', '2026-08-05', 67, [
    exercise('agachamento-hack', 'Agachamento Hack', 'Quadríceps', [set(1, 70, 10, 2), set(2, 80, 9, 2), set(3, 85, 8, 1), set(4, 85, 8, 1)]),
    exercise('leg-press', 'Leg press 45°', 'Quadríceps', [set(1, 180, 15, 2), set(2, 200, 13, 1), set(3, 210, 12, 1), set(4, 210, 11, 1)]),
    exercise('cadeira-extensora', 'Cadeira extensora', 'Quadríceps', [set(1, 55, 15, 2), set(2, 60, 14, 1), set(3, 65, 12, 1)]),
    exercise('panturrilha-leg', 'Panturrilha no leg press', 'Panturrilhas', [set(1, 100, 15, 2), set(2, 110, 14, 1), set(3, 110, 13, 1), set(4, 110, 12, 1)])
  ]),
  history('demo-history-04', 'demo-pull-a', 'PULL A — Costas e bíceps', 'Terça-feira', '2026-08-04', 64, [
    exercise('puxada-frente', 'Puxada frente pegada neutra', 'Dorsais', [set(1, 55, 12, 2), set(2, 60, 11, 2), set(3, 65, 10, 1), set(4, 65, 9, 1)]),
    exercise('remada-baixa', 'Remada baixa neutra', 'Costas', [set(1, 60, 12, 2), set(2, 70, 11, 1), set(3, 75, 10, 1), set(4, 75, 9, 1)]),
    exercise('remada-unilateral', 'Remada unilateral com halter', 'Costas', [set(1, 32, 12, 2), set(2, 36, 11, 1), set(3, 36, 10, 1)]),
    exercise('rosca-inclinada', 'Rosca inclinada com halteres', 'Bíceps', [set(1, 12, 12, 2), set(2, 14, 10, 1), set(3, 14, 9, 1)]),
    exercise('rosca-martelo', 'Rosca martelo', 'Bíceps e braquial', [set(1, 16, 14, 2), set(2, 18, 12, 1), set(3, 18, 11, 1)])
  ]),
  history('demo-history-03', 'demo-push-a', 'PUSH A — Peitoral superior e tríceps', 'Segunda-feira', '2026-08-03', 62, [
    exercise('supino-inclinado-halteres', 'Supino inclinado com halteres', 'Peitoral superior', [set(1, 32, 12, 2), set(2, 36, 11, 2), set(3, 38, 10, 1), set(4, 40, 9, 1)]),
    exercise('chest-press', 'Chest press convergente', 'Peitoral', [set(1, 60, 15, 2), set(2, 70, 13, 1), set(3, 75, 11, 1)]),
    exercise('crucifixo-polia', 'Crucifixo na polia baixa', 'Peitoral superior', [set(1, 15, 15, 2), set(2, 17.5, 14, 1), set(3, 17.5, 13, 1)]),
    exercise('elevacao-lateral-polia', 'Elevação lateral unilateral na polia', 'Deltoide lateral', [set(1, 7.5, 18, 2), set(2, 10, 15, 1), set(3, 10, 14, 1)]),
    exercise('triceps-corda', 'Tríceps na corda', 'Tríceps', [set(1, 30, 15, 2), set(2, 35, 13, 1), set(3, 40, 11, 1)])
  ]),
  history('demo-history-02', 'demo-upper-b', 'UPPER B + CORRIDA', 'Domingo', '2026-08-02', 71, [
    exercise('supino-maquina', 'Supino máquina', 'Peitoral', [set(1, 55, 12, 2), set(2, 65, 11, 1), set(3, 70, 9, 1)]),
    exercise('remada-maquina', 'Remada máquina articulada', 'Costas', [set(1, 55, 12, 2), set(2, 65, 10, 1), set(3, 70, 9, 1)]),
    exercise('elevacao-lateral-upper', 'Elevação lateral na máquina', 'Deltoide lateral', [set(1, 30, 16, 2), set(2, 35, 14, 1), set(3, 35, 13, 1)]),
    exercise('corrida-demo', 'Corrida leve', 'Cardio', [cardioSet(1500, 3300, 8.0, 0, 143, 245)], 'cardio')
  ]),
  history('demo-history-01', 'demo-legs-b', 'LEGS B — Posterior, glúteos e panturrilhas', 'Sexta-feira', '2026-07-31', 69, [
    exercise('cadeira-flexora', 'Cadeira flexora', 'Posterior de coxa', [set(1, 40, 12, 2), set(2, 45, 11, 2), set(3, 50, 10, 1), set(4, 50, 9, 1)]),
    exercise('levantamento-romeno', 'Levantamento terra romeno com halteres', 'Posterior e glúteos', [set(1, 28, 12, 2), set(2, 32, 10, 2), set(3, 34, 9, 1)]),
    exercise('hip-thrust', 'Hip thrust', 'Glúteos', [set(1, 80, 12, 2), set(2, 100, 11, 1), set(3, 110, 10, 1), set(4, 110, 9, 1)]),
    exercise('caminhada-inclinada', 'Cardio — Caminhada inclinada em Zona 2', 'Cardio', [cardioSet(1200, 1900, 5.8, 8, 136, 160)], 'cardio')
  ])
];

export async function loadFullDemo(): Promise<void> {
  saveActivePlan(demoPlan);
  saveWorkoutHistory(demoWorkoutHistory);
  await saveBodyEvolution(demoBodyEvolution);
  localStorage.setItem('titan-fit:demo-mode', 'true');
}

export function isDemoMode(): boolean { return localStorage.getItem('titan-fit:demo-mode') === 'true'; }
export function clearDemoFlag(): void { localStorage.removeItem('titan-fit:demo-mode'); }
