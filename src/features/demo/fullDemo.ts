import { demoBodyEvolution } from '../evolution/demoData';
import { saveBodyEvolution } from '../evolution/storage';
import { saveWorkoutHistory } from '../history/storage';
import type { HistoryExercise, HistorySet, WorkoutHistoryRecord } from '../history/types';
import { saveActivePlan } from '../plan/storage';
import type { ExerciseType, TitanCardioSession, TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';

const planId = 'titan-demo-qa-v0304';
const DAY_MS = 24 * 60 * 60 * 1000;

const strength = (
  id: string, name: string, muscleGroup: string, sets: number, minReps: number, maxReps: number,
  rir: number, restSeconds: number, technique: string, commonMistakes: string[], alternatives: string[],
): TitanExercise => ({
  id, name, muscleGroup, exerciseType: 'strength', sets, minReps, maxReps, targetRir: rir, restSeconds,
  technique, commonMistakes, alternatives,
});

const cardioExercise = (
  id: string, name: string, durationSeconds: number, speedKmh: number, inclinePercent: number, zone = 'Zona 2',
): TitanExercise => ({
  id, name, muscleGroup: 'Cardio', exerciseType: 'cardio', durationSeconds, speedKmh, inclinePercent, cardioZone: zone,
  notes: 'Mantenha o esforço dentro da zona planejada e registre tempo, distância, FC e percepção de esforço.',
});

const workouts: TitanWorkoutDay[] = [
  { id: 'demo-push-a', day: 'Segunda-feira', title: 'PUSH A — Peitoral superior e tríceps', focus: 'Peitoral superior, deltoide lateral e tríceps.', exercises: [
    strength('supino-inclinado-halteres', 'Supino inclinado com halteres', 'Peitoral superior', 4, 8, 12, 2, 120, 'Banco baixo, escápulas firmes e descida controlada.', ['Inclinação excessiva', 'Perder retração escapular'], ['Supino inclinado na máquina']),
    strength('chest-press', 'Chest press convergente', 'Peitoral', 3, 10, 15, 1, 90, 'Empurre em arco sem elevar os ombros.', ['Encurtar amplitude', 'Elevar os ombros'], ['Supino máquina']),
    strength('crucifixo-polia', 'Crucifixo na polia baixa', 'Peitoral superior', 3, 12, 15, 1, 75, 'Conduza as mãos para cima e para dentro mantendo tensão.', ['Dobrar demais os cotovelos'], ['Crucifixo inclinado']),
    strength('elevacao-lateral-polia', 'Elevação lateral unilateral na polia', 'Deltoide lateral', 3, 12, 20, 1, 60, 'Eleve no plano da escápula conduzindo pelo cotovelo.', ['Balançar o tronco', 'Subir com o trapézio'], ['Elevação lateral na máquina']),
    strength('triceps-corda', 'Tríceps na corda', 'Tríceps', 3, 10, 15, 1, 75, 'Fixe os cotovelos e separe a corda no final.', ['Mover os cotovelos', 'Usar impulso'], ['Tríceps barra V']),
  ]},
  { id: 'demo-pull-a', day: 'Terça-feira', title: 'PULL A — Costas e bíceps', focus: 'Dorsais, espessura de costas e bíceps.', exercises: [
    strength('puxada-frente', 'Puxada frente pegada neutra', 'Dorsais', 4, 8, 12, 2, 120, 'Depressa as escápulas antes de flexionar os cotovelos.', ['Inclinar demais o tronco'], ['Puxada articulada']),
    strength('remada-baixa', 'Remada baixa neutra', 'Costas', 4, 8, 12, 1, 120, 'Mantenha o peito alto e finalize com as escápulas.', ['Arredondar a lombar'], ['Remada máquina']),
    strength('remada-unilateral', 'Remada unilateral com halter', 'Costas', 3, 10, 12, 1, 90, 'Puxe o cotovelo em direção ao quadril.', ['Girar o tronco'], ['Remada unilateral máquina']),
    strength('rosca-inclinada', 'Rosca inclinada com halteres', 'Bíceps', 3, 8, 12, 1, 75, 'Mantenha o braço atrás do tronco e controle a descida.', ['Projetar o ombro'], ['Rosca alternada']),
    strength('rosca-martelo', 'Rosca martelo', 'Bíceps e braquial', 3, 10, 15, 1, 75, 'Punhos neutros e cotovelos estáveis.', ['Balançar o tronco'], ['Rosca martelo na corda']),
  ]},
  { id: 'demo-legs-a', day: 'Quarta-feira', title: 'LEGS A — Quadríceps e panturrilhas', focus: 'Quadríceps com execução estável e progressão controlada.', exercises: [
    strength('agachamento-hack', 'Agachamento Hack', 'Quadríceps', 4, 6, 10, 2, 150, 'Desça com joelhos acompanhando a linha dos pés.', ['Perder apoio do calcanhar'], ['Leg press 45°']),
    strength('leg-press', 'Leg press 45°', 'Quadríceps', 4, 10, 15, 1, 120, 'Controle a profundidade sem tirar o quadril do encosto.', ['Bloquear joelhos'], ['Hack squat']),
    strength('cadeira-extensora', 'Cadeira extensora', 'Quadríceps', 3, 12, 15, 1, 75, 'Estenda controlando e segure brevemente no topo.', ['Usar impulso'], ['Extensão unilateral']),
    strength('panturrilha-leg', 'Panturrilha no leg press', 'Panturrilhas', 4, 10, 15, 1, 60, 'Use amplitude completa e pausa no alongamento.', ['Repetições curtas'], ['Panturrilha em pé']),
  ]},
  { id: 'demo-shoulders', day: 'Quinta-feira', title: 'OMBROS — Deltoides e core', focus: 'Deltoide lateral e posterior com core.', exercises: [
    strength('desenvolvimento-maquina', 'Desenvolvimento na máquina', 'Ombros', 3, 8, 12, 2, 120, 'Mantenha costas apoiadas e não force amplitude dolorosa.', ['Arquear excessivamente'], ['Desenvolvimento com halteres']),
    strength('elevacao-lateral', 'Elevação lateral com halteres', 'Deltoide lateral', 4, 12, 20, 1, 60, 'Conduza pelos cotovelos com controle.', ['Usar balanço'], ['Elevação lateral na polia']),
    strength('crucifixo-inverso', 'Crucifixo inverso na máquina', 'Deltoide posterior', 3, 12, 15, 1, 75, 'Abra os braços sem projetar a cabeça.', ['Encolher os ombros'], ['Face pull']),
    { id: 'prancha', name: 'Prancha', muscleGroup: 'Core', exerciseType: 'isometric', sets: 3, durationSeconds: 45, restSeconds: 60, technique: 'Mantenha costelas e pelve alinhadas.', commonMistakes: ['Elevar o quadril', 'Perder a posição lombar'], alternatives: ['Dead bug'] },
  ]},
  { id: 'demo-legs-b', day: 'Sexta-feira', title: 'LEGS B — Posterior, glúteos e panturrilhas', focus: 'Posteriores de coxa e glúteos.', exercises: [
    strength('cadeira-flexora', 'Cadeira flexora', 'Posterior de coxa', 4, 8, 12, 2, 90, 'Mantenha quadril apoiado e controle a extensão.', ['Elevar o quadril'], ['Mesa flexora']),
    strength('levantamento-romeno', 'Levantamento terra romeno com halteres', 'Posterior e glúteos', 3, 8, 12, 2, 120, 'Leve o quadril para trás mantendo a coluna neutra.', ['Arredondar a lombar'], ['Stiff na máquina']),
    strength('hip-thrust', 'Hip thrust', 'Glúteos', 4, 8, 12, 1, 120, 'Finalize com pelve neutra e pausa no topo.', ['Hiperestender a lombar'], ['Glute drive']),
    strength('panturrilha-sentado', 'Panturrilha sentada', 'Panturrilhas', 4, 10, 15, 1, 60, 'Use amplitude completa e controle.', ['Quicar a carga'], ['Panturrilha em pé']),
  ]},
  { id: 'demo-upper-b', day: 'Domingo', title: 'UPPER B — Superior complementar', focus: 'Peito, costas, deltoides e braços.', exercises: [
    strength('supino-maquina', 'Supino máquina', 'Peitoral', 3, 8, 12, 2, 90, 'Escápulas apoiadas e amplitude controlada.', ['Elevar os ombros'], ['Supino com halteres']),
    strength('remada-maquina', 'Remada máquina articulada', 'Costas', 3, 8, 12, 2, 90, 'Mantenha o tórax estável.', ['Usar impulso'], ['Remada baixa']),
    strength('elevacao-lateral-upper', 'Elevação lateral na máquina', 'Deltoide lateral', 3, 12, 20, 1, 60, 'Suba controlando o ombro.', ['Encolher os ombros'], ['Elevação lateral com halteres']),
    strength('rosca-cabo', 'Rosca no cabo', 'Bíceps', 3, 10, 15, 1, 60, 'Cotovelos estáveis durante toda a série.', ['Balançar o tronco'], ['Rosca direta']),
    strength('triceps-barra', 'Tríceps barra V', 'Tríceps', 3, 10, 15, 1, 60, 'Mantenha cotovelos fixos.', ['Abrir cotovelos'], ['Tríceps na corda']),
  ]},
];

const cardioSchedule: TitanCardioSession[] = [
  { id: 'demo-cardio-mon', day: 'Segunda-feira', startTime: '20:35', title: 'Zona 2 pós-treino', type: 'zone2', durationMinutes: 25, phase: 'Base aeróbica', goal: 'Manter esforço contínuo em Zona 2.' },
  { id: 'demo-cardio-tue', day: 'Terça-feira', startTime: '20:35', title: 'Zona 2 pós-treino', type: 'zone2', durationMinutes: 25, phase: 'Base aeróbica', goal: 'Acumular volume cardiovascular com baixa interferência.' },
  { id: 'demo-cardio-wed', day: 'Quarta-feira', startTime: '20:40', title: 'Zona 2 leve', type: 'zone2', durationMinutes: 20, phase: 'Recuperação ativa', goal: 'Cardio leve após treino de pernas.' },
  { id: 'demo-cardio-thu', day: 'Quinta-feira', startTime: '20:30', title: 'HIIT controlado', type: 'hiit', durationMinutes: 18, phase: 'Condicionamento', goal: 'Blocos curtos com recuperação suficiente.' },
  { id: 'demo-cardio-fri', day: 'Sexta-feira', startTime: '20:35', title: 'Zona 2 pós-treino', type: 'zone2', durationMinutes: 20, phase: 'Base aeróbica', goal: 'Manter intensidade confortável após posterior.' },
  { id: 'demo-cardio-sat', day: 'Sábado', startTime: '09:00', title: 'Corrida contínua em Zona 2', type: 'zone2', durationMinutes: 35, phase: '5 km', goal: 'Evoluir tolerância à corrida sem musculação no dia.' },
  { id: 'demo-cardio-sun', day: 'Domingo', startTime: '20:30', title: 'Zona 2 regenerativa', type: 'zone2', durationMinutes: 25, phase: 'Recuperação', goal: 'Fechar a semana com trabalho aeróbico leve.' },
];

function startOfWeek(date = new Date()) {
  const result = new Date(date);
  const jsDay = result.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  result.setDate(result.getDate() + mondayOffset);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isoAt(date: Date, hour: number, minute = 0) {
  const value = new Date(date);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

function dateFor(weeksAgo: number, jsDay: number) {
  const monday = startOfWeek();
  const mondayBased = jsDay === 0 ? 6 : jsDay - 1;
  return new Date(monday.getTime() - weeksAgo * 7 * DAY_MS + mondayBased * DAY_MS);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function demoStartDate() {
  const date = new Date(startOfWeek().getTime() - 8 * 7 * DAY_MS);
  return dateKey(date);
}

export const demoPlan: TitanPlan = {
  schemaVersion: 1,
  id: planId,
  name: 'Projeto TITAN — Demonstração QA',
  description: 'Ambiente demonstrativo completo para testar treino, cardio, PRs, Coach, Score, histórico, evolução e backup.',
  createdAt: new Date().toISOString(),
  author: 'TITAN FIT',
  project: {
    name: 'Projeto TITAN — Hipertrofia + 5 km', objective: 'Hipertrofia com condicionamento cardiovascular',
    startDate: demoStartDate(), durationWeeks: 12, strengthStartTime: '19:30', cardioGoal: 'Cardio diário e progressão para 5 km', cardioSchedule,
  },  workouts,
};

const set = (setNumber: number, weightKg: number | null, repetitions: number | null, rir: number | null): HistorySet => ({
  setNumber, weightKg, repetitions, rir, durationSeconds: null, distanceMeters: null, speedKmh: null,
  inclinePercent: null, averagePace: null, averageHeartRate: null, calories: null, notes: null,
});

const cardioSet = (
  durationSeconds: number, distanceMeters: number, averageHeartRate: number, averagePace: string, notes: string,
): HistorySet => ({
  setNumber: 1, weightKg: null, repetitions: null, rir: null, durationSeconds, distanceMeters,
  speedKmh: distanceMeters > 0 ? (distanceMeters / 1000) / (durationSeconds / 3600) : null,
  inclinePercent: null, averagePace, averageHeartRate, calories: null, notes,
});

function historyExercise(exercise: TitanExercise, sets: HistorySet[], type: ExerciseType = exercise.exerciseType ?? 'strength'): HistoryExercise {
  const weights = sets.map((item) => item.weightKg).filter((value): value is number => value !== null);
  const distances = sets.map((item) => item.distanceMeters ?? 0);
  const durations = sets.map((item) => item.durationSeconds ?? 0);
  const speeds = sets.map((item) => item.speedKmh).filter((value): value is number => value !== null);
  const hrs = sets.map((item) => item.averageHeartRate).filter((value): value is number => value !== null);
  const volumeKg = sets.reduce((sum, item) => sum + ((item.weightKg ?? 0) * (item.repetitions ?? 0)), 0);
  return {
    exerciseId: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup, exerciseType: type, sets, volumeKg,
    bestWeightKg: weights.length ? Math.max(...weights) : null, totalDistanceMeters: distances.reduce((a, b) => a + b, 0),
    totalDurationSeconds: durations.reduce((a, b) => a + b, 0), bestSpeedKmh: speeds.length ? Math.max(...speeds) : null,
    bestInclinePercent: null, averageHeartRate: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null,
  };
}

function record(id: string, workoutId: string, title: string, day: string, date: Date, durationMinutes: number, exercises: HistoryExercise[]): WorkoutHistoryRecord {
  const startedAt = isoAt(date, 19, 30);
  const completedAt = new Date(new Date(startedAt).getTime() + durationMinutes * 60_000).toISOString();
  return {
    id, planId, planName: demoPlan.name, workoutId, workoutTitle: title, workoutDay: day, startedAt, completedAt,
    durationSeconds: durationMinutes * 60, totalSets: exercises.reduce((total, item) => total + item.sets.length, 0),
    totalVolumeKg: exercises.reduce((total, item) => total + item.volumeKg, 0), exercises,
  };
}

const baseLoads: Record<string, number> = {
  'supino-inclinado-halteres': 34, 'chest-press': 70, 'crucifixo-polia': 15, 'elevacao-lateral-polia': 8, 'triceps-corda': 35,
  'puxada-frente': 60, 'remada-baixa': 70, 'remada-unilateral': 32, 'rosca-inclinada': 12, 'rosca-martelo': 16,
  'agachamento-hack': 80, 'leg-press': 200, 'cadeira-extensora': 60, 'panturrilha-leg': 100,
  'desenvolvimento-maquina': 45, 'elevacao-lateral': 10, 'crucifixo-inverso': 35,
  'cadeira-flexora': 45, 'levantamento-romeno': 32, 'hip-thrust': 100, 'panturrilha-sentado': 65,
  'supino-maquina': 65, 'remada-maquina': 65, 'elevacao-lateral-upper': 30, 'rosca-cabo': 25, 'triceps-barra': 35,
};

function strengthSets(exercise: TitanExercise, sequenceIndex: number): HistorySet[] {
  if (exercise.exerciseType === 'isometric') return [42, 45, 50].map((seconds, index) => ({ ...set(index + 1, null, null, null), durationSeconds: seconds + sequenceIndex * 2 }));
  const count = exercise.sets ?? 3;
  const base = baseLoads[exercise.id] ?? 30;
  const stagnant = exercise.id === 'chest-press';
  const progress = stagnant ? 0 : sequenceIndex * Math.max(1, Math.round(base * 0.025));
  const top = base + progress;
  return Array.from({ length: count }, (_, index) => {
    const warmupDrop = Math.max(0, count - index - 1) * Math.max(1, Math.round(top * 0.04));
    const load = Math.max(1, top - warmupDrop);
    const reps = Math.max(exercise.minReps ?? 8, (exercise.maxReps ?? 12) - Math.max(0, index - 1));
    return set(index + 1, load, reps, index === 0 ? 2 : 1);
  });
}

function buildStrengthHistory(): WorkoutHistoryRecord[] {
  const result: WorkoutHistoryRecord[] = [];
  const now = new Date();
  for (let weeksAgo = 3; weeksAgo >= 0; weeksAgo -= 1) {
    const sequenceIndex = 3 - weeksAgo;
    workouts.forEach((workout) => {
      const date = dateFor(weeksAgo, dayIndex(workout.day));
      if (date > now) return;
      const exercises = workout.exercises.map((exercise) => historyExercise(exercise, strengthSets(exercise, sequenceIndex)));
      result.push(record(`demo-strength-${dateKey(date)}-${workout.id}`, workout.id, workout.title, workout.day, date, 56 + (sequenceIndex * 2) + (workout.exercises.length * 2), exercises));
    });
  }
  return result;
}

function dayIndex(day: string) {
  const normalized = day.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('domingo')) return 0;
  if (normalized.includes('segunda')) return 1;
  if (normalized.includes('terca')) return 2;
  if (normalized.includes('quarta')) return 3;
  if (normalized.includes('quinta')) return 4;
  if (normalized.includes('sexta')) return 5;
  return 6;
}

function cardioProfile(jsDay: number, sequenceIndex: number) {
  if (jsDay === 4) return { title: 'HIIT', minutes: 18, distanceKm: 2.45 + sequenceIndex * 0.08, hr: 154, pace: '7:05 /km' };
  if (jsDay === 6) return { title: 'Corrida', minutes: 35, distanceKm: 4.45 + sequenceIndex * 0.12, hr: 146 - sequenceIndex, pace: `${7 - Math.floor(sequenceIndex / 2)}:${50 - sequenceIndex * 3} /km` };
  if (jsDay === 3 || jsDay === 5) return { title: 'Zona 2', minutes: 20, distanceKm: 2.15 + sequenceIndex * 0.05, hr: 137 - Math.min(sequenceIndex, 2), pace: '9:10 /km' };
  return { title: 'Zona 2', minutes: 25, distanceKm: 2.75 + sequenceIndex * 0.06, hr: 138 - Math.min(sequenceIndex, 2), pace: '9:00 /km' };
}

function buildCardioHistory(): WorkoutHistoryRecord[] {
  const result: WorkoutHistoryRecord[] = [];
  const now = new Date();
  for (let daysAgo = 27; daysAgo >= 1; daysAgo -= 1) {
    const date = new Date(now.getTime() - daysAgo * DAY_MS);
    const sequenceIndex = Math.floor((27 - daysAgo) / 7);
    const profile = cardioProfile(date.getDay(), sequenceIndex);
    const durationSeconds = profile.minutes * 60;
    const distanceMeters = Math.round(profile.distanceKm * 1000);
    const fakeExercise = cardioExercise(`cardio-${profile.title.toLowerCase().replace(/\s+/g, '-')}`, profile.title, durationSeconds, 0, 0, profile.title === 'HIIT' ? 'HIIT' : 'Zona 2');
    const exercise = historyExercise(fakeExercise, [cardioSet(durationSeconds, distanceMeters, profile.hr, profile.pace, `RPE ${profile.title === 'HIIT' ? 8 : 5}/10 · DEMO QA`)], 'distance');
    result.push(record(`demo-cardio-${dateKey(date)}`, `cardio-${profile.title}`, profile.title, weekday(date), date, profile.minutes, [exercise]));
  }
  return result;
}

function weekday(date: Date) { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date); }

export const demoWorkoutHistory: WorkoutHistoryRecord[] = [...buildStrengthHistory(), ...buildCardioHistory()].sort((a, b) => b.completedAt.localeCompare(a.completedAt));

export async function loadFullDemo(): Promise<void> {
  saveActivePlan(demoPlan);
  saveWorkoutHistory(demoWorkoutHistory);
  await saveBodyEvolution(demoBodyEvolution);
  localStorage.setItem('titan-fit:demo-mode', 'true');
}

export function isDemoMode(): boolean { return localStorage.getItem('titan-fit:demo-mode') === 'true'; }
export function clearDemoFlag(): void { localStorage.removeItem('titan-fit:demo-mode'); }
