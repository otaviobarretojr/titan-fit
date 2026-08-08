import { loadWorkoutHistory } from '../features/history/storage';
import type { HistoryExercise, HistorySet, WorkoutHistoryRecord } from '../features/history/types';

type ExerciseResult = {
  name: string;
  status: 'pr' | 'improved' | 'stable' | 'below' | 'baseline';
  label: string;
};

function bestStrengthSet(exercise: HistoryExercise): HistorySet | null {
  const valid = exercise.sets.filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!valid.length) return null;
  return [...valid].sort((a, b) => {
    const weightDiff = (b.weightKg ?? 0) - (a.weightKg ?? 0);
    if (weightDiff !== 0) return weightDiff;
    return (b.repetitions ?? 0) - (a.repetitions ?? 0);
  })[0];
}

function previousExerciseSessions(records: WorkoutHistoryRecord[], current: WorkoutHistoryRecord, exerciseId: string) {
  return records
    .filter((record) => record.id !== current.id && record.completedAt < current.completedAt)
    .flatMap((record) => record.exercises)
    .filter((exercise) => exercise.exerciseId === exerciseId && exercise.exerciseType === 'strength');
}

function isNewPr(current: HistorySet, previous: HistoryExercise[]) {
  if (!previous.length) return false;
  const previousSets = previous.flatMap((exercise) => exercise.sets).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!previousSets.length) return false;
  const currentWeight = current.weightKg ?? 0;
  const currentReps = current.repetitions ?? 0;
  const maxWeight = Math.max(...previousSets.map((set) => set.weightKg ?? 0));
  const maxRepsAtCurrentWeight = Math.max(0, ...previousSets.filter((set) => (set.weightKg ?? 0) === currentWeight).map((set) => set.repetitions ?? 0));
  return currentWeight > maxWeight || (currentWeight === maxWeight && currentReps > maxRepsAtCurrentWeight);
}

function analyzeExercise(records: WorkoutHistoryRecord[], current: WorkoutHistoryRecord, exercise: HistoryExercise): ExerciseResult | null {
  if (exercise.exerciseType !== 'strength') return null;
  const currentBest = bestStrengthSet(exercise);
  if (!currentBest) return null;
  const previous = previousExerciseSessions(records, current, exercise.exerciseId);
  if (!previous.length) return { name: exercise.name, status: 'baseline', label: 'Linha de base criada' };
  if (isNewPr(currentBest, previous)) return { name: exercise.name, status: 'pr', label: `Novo PR · ${currentBest.weightKg} kg × ${currentBest.repetitions}` };

  const lastBest = bestStrengthSet(previous[0]);
  if (!lastBest) return { name: exercise.name, status: 'baseline', label: 'Referência criada' };
  const currentWeight = currentBest.weightKg ?? 0;
  const currentReps = currentBest.repetitions ?? 0;
  const lastWeight = lastBest.weightKg ?? 0;
  const lastReps = lastBest.repetitions ?? 0;
  if (currentWeight > lastWeight || (currentWeight === lastWeight && currentReps > lastReps)) return { name: exercise.name, status: 'improved', label: 'Evoluiu nesta sessão' };
  if (currentWeight === lastWeight && currentReps === lastReps) return { name: exercise.name, status: 'stable', label: 'Desempenho mantido' };
  return { name: exercise.name, status: 'below', label: 'Abaixo da última referência' };
}

function buildRecommendation(results: ExerciseResult[]) {
  const below = results.find((item) => item.status === 'below');
  if (below) return `Próximo ${below.name}: mantenha a carga de referência e recupere as repetições antes de tentar progredir.`;
  const stable = results.find((item) => item.status === 'stable');
  if (stable) return `Próximo ${stable.name}: mantenha a carga e busque +1 repetição com a mesma qualidade de execução.`;
  const progressed = results.find((item) => item.status === 'pr' || item.status === 'improved');
  if (progressed) return `Boa sessão. Em ${progressed.name}, consolide o novo nível antes do próximo aumento de carga.`;
  return 'Sessão registrada. Repita os exercícios para o Coach criar comparações e orientar a próxima progressão.';
}

function metric(label: string, value: number, tone: string) {
  return `<div class="post-coach-metric ${tone}"><strong>${value}</strong><span>${label}</span></div>`;
}

function renderPostWorkoutCoach(summary: Element) {
  if (summary.querySelector('[data-post-workout-coach]')) return;
  const records = loadWorkoutHistory();
  const current = records[0];
  if (!current) return;

  const results = current.exercises.map((exercise) => analyzeExercise(records, current, exercise)).filter((item): item is ExerciseResult => Boolean(item));
  if (!results.length) return;

  const prs = results.filter((item) => item.status === 'pr').length;
  const evolved = results.filter((item) => item.status === 'pr' || item.status === 'improved').length;
  const stable = results.filter((item) => item.status === 'stable').length;
  const notable = [...results.filter((item) => item.status === 'pr'), ...results.filter((item) => item.status === 'below'), ...results.filter((item) => item.status === 'improved'), ...results.filter((item) => item.status === 'stable')].slice(0, 3);

  const card = document.createElement('section');
  card.className = 'post-workout-coach-card';
  card.dataset.postWorkoutCoach = 'true';
  card.innerHTML = `
    <div class="post-coach-heading">
      <div><span class="post-coach-kicker">♛ COACH TITAN · PÓS-TREINO</span><strong>Leitura da sessão</strong></div>
      <span class="post-coach-status">ANALISADO</span>
    </div>
    <div class="post-coach-metrics">
      ${metric('PRs', prs, 'pr')}
      ${metric('evoluíram', evolved, 'up')}
      ${metric('estáveis', stable, 'steady')}
    </div>
    <div class="post-coach-results">
      ${notable.map((item) => `<div class="post-coach-result status-${item.status}"><span></span><div><strong>${item.name}</strong><small>${item.label}</small></div></div>`).join('')}
    </div>
    <div class="post-coach-next"><span>PRÓXIMA PRIORIDADE</span><p>${buildRecommendation(results)}</p></div>
  `;

  const action = summary.querySelector('.primary-action');
  if (action) action.before(card); else summary.append(card);
}

export function enablePostWorkoutCoach() {
  const apply = () => document.querySelectorAll('.workout-summary').forEach(renderPostWorkoutCoach);
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
