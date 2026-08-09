import type {
  TitanEngineAssessment,
  TitanEngineCandidateBlueprint,
  TitanEngineExercise,
  TitanEngineMusclePriority,
  TitanEnginePrescriptionRule,
  TitanEngineResult,
  TitanEngineStrategy,
} from './types';

const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const PRIORITY_TERMS: Record<TitanEngineMusclePriority, string[]> = {
  chest: ['peitoral'], back: ['costas', 'dorsais'], shoulders: ['deltoides'], arms: ['bíceps', 'tríceps'],
  quadriceps: ['quadríceps'], 'hamstrings-glutes': ['posteriores', 'glúteos'], calves: ['panturrilhas'], core: ['abdômen', 'core'],
};

function buildSplit(days: number): string[] {
  const normalized = Math.max(1, Math.min(7, Math.round(days)));
  if (normalized <= 2) return Array.from({ length: normalized }, () => 'full-body');
  if (normalized === 3) return ['push', 'pull', 'legs'];
  if (normalized === 4) return ['upper', 'lower', 'upper', 'lower'];
  if (normalized === 5) return ['push', 'pull', 'legs', 'upper', 'lower'];
  if (normalized === 6) return ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
  return ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'full-body'];
}

function focusMatches(focus: string, muscle: string) {
  const normalized = muscle.toLowerCase();
  if (focus === 'full-body') return true;
  if (focus === 'push') return ['peitoral', 'deltoides', 'tríceps'].some((term) => normalized.includes(term));
  if (focus === 'pull') return ['costas', 'dorsais', 'bíceps'].some((term) => normalized.includes(term));
  if (focus === 'legs') return ['quadríceps', 'posteriores', 'panturrilhas', 'glúteos'].some((term) => normalized.includes(term));
  if (focus === 'upper') return ['peitoral', 'deltoides', 'tríceps', 'costas', 'dorsais', 'bíceps'].some((term) => normalized.includes(term));
  if (focus === 'lower') return ['quadríceps', 'posteriores', 'panturrilhas', 'glúteos', 'abdômen', 'core'].some((term) => normalized.includes(term));
  return true;
}

function strategySettings(strategy: TitanEngineStrategy) {
  if (strategy === 'adherence') return { setScale: 0.75, exerciseScale: 0.8, title: 'Maior aderência' };
  if (strategy === 'availability') return { setScale: 1.15, exerciseScale: 1, title: 'Maior disponibilidade' };
  return { setScale: 1, exerciseScale: 1, title: 'Equilíbrio' };
}

function priorityScore(muscle: string, priorities: TitanEngineMusclePriority[] = []) {
  const normalized = muscle.toLowerCase();
  return priorities.some((priority) => PRIORITY_TERMS[priority].some((term) => normalized.includes(term))) ? 1 : 0;
}

function limitationTerms(assessment: TitanEngineAssessment) {
  return (assessment.limitations ?? [])
    .flatMap((item) => `${item.area} ${item.note ?? ''}`.toLowerCase().split(/[^a-zà-ú]+/))
    .filter((term) => term.length > 4);
}

function isPotentiallyLimited(exercise: TitanEngineExercise, assessment: TitanEngineAssessment) {
  const terms = limitationTerms(assessment);
  if (!terms.length) return false;
  const text = `${exercise.name} ${exercise.primaryMuscle}`.toLowerCase();
  return terms.some((term) => text.includes(term));
}

function rationaleFor(strategy: TitanEngineStrategy, assessment: TitanEngineAssessment) {
  const rationale = strategy === 'adherence'
    ? ['Menor volume por sessão para facilitar consistência.', `Respeita ${assessment.trainingDaysPerWeek} dias disponíveis e cerca de ${assessment.preferredSessionMinutes} min por treino.`]
    : strategy === 'balanced'
      ? ['Equilibra estímulo, recuperação e tempo de sessão.', 'É a recomendação padrão do TITAN para este perfil.']
      : ['Aproveita mais da disponibilidade informada.', 'Usa volume um pouco maior sem ultrapassar os limites definidos para a experiência atual.'];
  if (assessment.musclePriorities?.length) rationale.push(`Prioriza ${assessment.musclePriorities.length} grupo(s) muscular(es) selecionado(s) sem abandonar o restante do corpo.`);
  if (assessment.limitations?.length) rationale.push('Considera as limitações informadas como filtro conservador; elas não substituem avaliação profissional.');
  return rationale;
}

function buildCandidate(
  strategy: TitanEngineStrategy,
  assessment: TitanEngineAssessment,
  exercises: TitanEngineExercise[],
  rule: TitanEnginePrescriptionRule,
): TitanEngineCandidateBlueprint {
  const config = strategySettings(strategy);
  const split = buildSplit(assessment.trainingDaysPerWeek);
  const avoided = new Set(assessment.avoidedExerciseIds ?? []);
  const workouts = split.map((focus, dayIndex) => {
    const pool = exercises
      .filter((exercise) => focusMatches(focus, exercise.primaryMuscle))
      .filter((exercise) => !avoided.has(exercise.id))
      .filter((exercise) => !isPotentiallyLimited(exercise, assessment))
      .sort((a, b) => priorityScore(b.primaryMuscle, assessment.musclePriorities) - priorityScore(a.primaryMuscle, assessment.musclePriorities));
    const requestedCount = Math.round(rule.maxExercisesPerSession * config.exerciseScale);
    const count = Math.max(1, Math.min(rule.maxExercisesPerSession, requestedCount));
    const chosen = pool.slice(0, count);
    return {
      dayIndex,
      dayLabel: assessment.availableTrainingDays?.[dayIndex] ?? DAY_NAMES[dayIndex] ?? `Dia ${dayIndex + 1}`,
      focus,
      exercises: chosen.map((exercise) => {
        const priority = priorityScore(exercise.primaryMuscle, assessment.musclePriorities) > 0;
        return { ...exercise, priority, sets: Math.max(2, Math.round((priority ? 3.5 : 3) * config.setScale)) };
      }),
    };
  });
  return { strategy, title: config.title, rationale: rationaleFor(strategy, assessment), workouts };
}

export function generateTitanEngineBlueprints(
  assessment: TitanEngineAssessment,
  exercises: TitanEngineExercise[],
  rule: TitanEnginePrescriptionRule,
): TitanEngineResult {
  const warnings: string[] = [];
  if (assessment.trainingDaysPerWeek < 1 || assessment.trainingDaysPerWeek > 7) warnings.push('Dias de treino ajustados para o intervalo suportado de 1 a 7.');
  if (!exercises.length) warnings.push('Nenhum exercício elegível foi fornecido à TITAN Engine.');
  const strategies: TitanEngineStrategy[] = ['adherence', 'balanced', 'availability'];
  return { engineVersion: 1, candidates: strategies.map((strategy) => buildCandidate(strategy, assessment, exercises, rule)), warnings };
}
