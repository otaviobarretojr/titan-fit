import type { TitanEngineExercisePrescription } from './types';

function fatigueRank(cost: TitanEngineExercisePrescription['fatigueCost']) {
  if (cost === 'high') return 0;
  if (cost === 'medium') return 1;
  return 2;
}

function stabilityRank(demand: TitanEngineExercisePrescription['stabilityDemand']) {
  if (demand === 'high') return 0;
  if (demand === 'medium') return 1;
  return 2;
}

function roleRank(role: TitanEngineExercisePrescription['exerciseRole']) {
  return role === 'isolation' ? 1 : 0;
}

function baseOrder(a: TitanEngineExercisePrescription, b: TitanEngineExercisePrescription) {
  if (a.priority !== b.priority) return a.priority ? -1 : 1;
  const roleDiff = roleRank(a.exerciseRole) - roleRank(b.exerciseRole);
  if (roleDiff) return roleDiff;
  const fatigueDiff = fatigueRank(a.fatigueCost) - fatigueRank(b.fatigueCost);
  if (fatigueDiff) return fatigueDiff;
  const stabilityDiff = stabilityRank(a.stabilityDemand) - stabilityRank(b.stabilityDemand);
  if (stabilityDiff) return stabilityDiff;
  if (a.restSeconds !== b.restSeconds) return b.restSeconds - a.restSeconds;
  return a.id.localeCompare(b.id);
}

/**
 * Ordena a sessão para preservar performance: prioridade primeiro, compostos antes de isoladores
 * e exercícios de maior demanda cedo. Quando houver opção equivalente, evita iniciar com dois
 * exercícios de alto custo de fadiga em sequência.
 */
export function orderTitanSessionExercises(exercises: TitanEngineExercisePrescription[]) {
  const ordered = [...exercises].sort(baseOrder);
  if (ordered.length < 3) return ordered;

  if (ordered[0]?.fatigueCost === 'high' && ordered[1]?.fatigueCost === 'high') {
    const alternativeIndex = ordered.findIndex((exercise, index) => index > 1
      && exercise.fatigueCost !== 'high'
      && exercise.priority === ordered[1].priority
      && exercise.exerciseRole === ordered[1].exerciseRole);
    if (alternativeIndex > 1) {
      const [alternative] = ordered.splice(alternativeIndex, 1);
      ordered.splice(1, 0, alternative);
    }
  }

  return ordered;
}
