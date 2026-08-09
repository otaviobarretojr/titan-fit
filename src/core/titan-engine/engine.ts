import type {
  TitanEngineAssessment,
  TitanEngineCandidateBlueprint,
  TitanEngineCandidateMetrics,
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

function clampScore(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

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
  rationale.push('Combina padrões e papéis complementares, controlando redundância e custo de fadiga dentro da sessão.');
  if (assessment.musclePriorities?.length) rationale.push(`Prioriza ${assessment.musclePriorities.length} grupo(s) muscular(es) selecionado(s) sem abandonar o restante do corpo.`);
  if (assessment.limitations?.length) rationale.push('Considera as limitações informadas como filtro conservador; elas não substituem avaliação profissional.');
  return rationale;
}

function weeklySetsByMuscle(workouts: TitanEngineCandidateBlueprint['workouts']) {
  return workouts.flatMap((workout) => workout.exercises).reduce<Record<string, number>>((accumulator, exercise) => {
    accumulator[exercise.primaryMuscle] = (accumulator[exercise.primaryMuscle] ?? 0) + exercise.sets;
    return accumulator;
  }, {});
}

function weeklyFrequencyByMuscle(workouts: TitanEngineCandidateBlueprint['workouts']) {
  return workouts.reduce<Record<string, number>>((accumulator, workout) => {
    const muscles = new Set(workout.exercises.map((exercise) => exercise.primaryMuscle));
    for (const muscle of muscles) accumulator[muscle] = (accumulator[muscle] ?? 0) + 1;
    return accumulator;
  }, {});
}

function volumeCoverage(setsByMuscle: Record<string, number>, target: [number, number]) {
  const totals = Object.values(setsByMuscle);
  if (!totals.length) return 0;
  const [minimum, maximum] = target;
  const scores = totals.map((sets) => sets >= minimum && sets <= maximum ? 100 : sets < minimum ? (sets / Math.max(1, minimum)) * 100 : Math.max(0, 100 - ((sets - maximum) / Math.max(1, maximum)) * 100));
  return clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function frequencyCoverage(frequencyByMuscle: Record<string, number>, assessment: TitanEngineAssessment) {
  const entries = Object.entries(frequencyByMuscle);
  if (!entries.length) return 0;
  const baseTarget = assessment.trainingDaysPerWeek >= 4 ? 2 : 1;
  const scores = entries.map(([muscle, frequency]) => {
    const priority = priorityScore(muscle, assessment.musclePriorities) > 0;
    const target = priority && assessment.trainingDaysPerWeek >= 3 ? 2 : baseTarget;
    return frequency >= target ? 100 : (frequency / Math.max(1, target)) * 100;
  });
  return clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function sessionBalance(workouts: TitanEngineCandidateBlueprint['workouts']) {
  const totals = workouts.map((workout) => workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0));
  if (!totals.length) return 0;
  const average = totals.reduce((sum, total) => sum + total, 0) / totals.length;
  if (average === 0) return 0;
  const meanDeviation = totals.reduce((sum, total) => sum + Math.abs(total - average), 0) / totals.length;
  return clampScore(100 - (meanDeviation / average) * 100);
}

function fatigueMultiplier(exercise: TitanEngineExercise) {
  const fatigue = exercise.fatigueCost === 'high' ? 1.3 : exercise.fatigueCost === 'low' ? 0.8 : 1;
  const stability = exercise.stabilityDemand === 'high' ? 1.1 : exercise.stabilityDemand === 'low' ? 0.95 : 1;
  return fatigue * stability;
}

function fatigueScore(workouts: TitanEngineCandidateBlueprint['workouts'], preferredSessionMinutes: number) {
  if (!workouts.length) return 0;
  const expectedLoadCapacity = Math.max(8, preferredSessionMinutes / 3);
  const sessionScores = workouts.map((workout) => {
    const weightedLoad = workout.exercises.reduce((sum, exercise) => {
      const restWeight = Math.max(0.75, Math.min(1.5, exercise.restSeconds / 120));
      return sum + exercise.sets * restWeight * fatigueMultiplier(exercise);
    }, 0);
    return clampScore(100 - Math.max(0, weightedLoad - expectedLoadCapacity) * 6);
  });
  return clampScore(sessionScores.reduce((sum, score) => sum + score, 0) / sessionScores.length);
}

function strategyFit(strategy: TitanEngineStrategy, assessment: TitanEngineAssessment) {
  if (strategy === 'balanced') return 95;
  if (strategy === 'adherence') return assessment.preferredSessionMinutes <= 60 || assessment.trainingDaysPerWeek <= 4 ? 92 : 82;
  return assessment.preferredSessionMinutes >= 60 && assessment.trainingDaysPerWeek >= 4 ? 90 : 76;
}

function metricsFor(candidate: TitanEngineCandidateBlueprint, assessment: TitanEngineAssessment, rule: TitanEnginePrescriptionRule): TitanEngineCandidateMetrics {
  const weekly = weeklySetsByMuscle(candidate.workouts);
  const frequency = weeklyFrequencyByMuscle(candidate.workouts);
  const volume = volumeCoverage(weekly, rule.weeklySetsPerMuscle);
  const frequencyScore = frequencyCoverage(frequency, assessment);
  const balance = sessionBalance(candidate.workouts);
  const fatigue = fatigueScore(candidate.workouts, assessment.preferredSessionMinutes);
  const fit = strategyFit(candidate.strategy, assessment);
  const score = clampScore(volume * 0.35 + frequencyScore * 0.15 + balance * 0.15 + fatigue * 0.2 + fit * 0.15);
  return { weeklySetsByMuscle: weekly, weeklyFrequencyByMuscle: frequency, volumeTargetCoverage: volume, frequencyScore, sessionBalance: balance, fatigueScore: fatigue, strategyFit: fit, score };
}

function usageKey(exercise: TitanEngineExercise) { return `${exercise.primaryMuscle}::${exercise.movementPattern ?? 'unknown'}`; }

function selectionScore(
  exercise: TitanEngineExercise,
  assessment: TitanEngineAssessment,
  exerciseUsage: Record<string, number>,
  patternUsage: Record<string, number>,
  sessionMuscleUsage: Record<string, number>,
  sessionPatternUsage: Record<string, number>,
  sessionRoleUsage: Record<string, number>,
  sessionTensionUsage: Record<string, number>,
  highFatigueCount: number,
) {
  const pattern = exercise.movementPattern ?? 'unknown';
  const role = exercise.exerciseRole ?? 'compound';
  const tension = exercise.tensionBias ?? 'unknown';
  const rolePenalty = (sessionRoleUsage[role] ?? 0) >= 2 ? 12 : 0;
  const tensionPenalty = tension !== 'unknown' ? (sessionTensionUsage[tension] ?? 0) * 10 : 0;
  const fatiguePenalty = exercise.fatigueCost === 'high' ? highFatigueCount * 18 : 0;
  return priorityScore(exercise.primaryMuscle, assessment.musclePriorities) * 100
    - (exerciseUsage[exercise.id] ?? 0) * 28
    - (patternUsage[usageKey(exercise)] ?? 0) * 8
    - (sessionMuscleUsage[exercise.primaryMuscle] ?? 0) * 18
    - (sessionPatternUsage[pattern] ?? 0) * 24
    - rolePenalty - tensionPenalty - fatiguePenalty;
}

function selectSessionExercises(pool: TitanEngineExercise[], count: number, assessment: TitanEngineAssessment, exerciseUsage: Record<string, number>, patternUsage: Record<string, number>) {
  const remaining = [...pool];
  const selected: TitanEngineExercise[] = [];
  const sessionMuscleUsage: Record<string, number> = {};
  const sessionPatternUsage: Record<string, number> = {};
  const sessionRoleUsage: Record<string, number> = {};
  const sessionTensionUsage: Record<string, number> = {};
  let highFatigueCount = 0;

  while (remaining.length && selected.length < count) {
    remaining.sort((a, b) => {
      const scoreDiff = selectionScore(b, assessment, exerciseUsage, patternUsage, sessionMuscleUsage, sessionPatternUsage, sessionRoleUsage, sessionTensionUsage, highFatigueCount)
        - selectionScore(a, assessment, exerciseUsage, patternUsage, sessionMuscleUsage, sessionPatternUsage, sessionRoleUsage, sessionTensionUsage, highFatigueCount);
      return scoreDiff || a.id.localeCompare(b.id);
    });
    const next = remaining.shift();
    if (!next) break;
    selected.push(next);
    sessionMuscleUsage[next.primaryMuscle] = (sessionMuscleUsage[next.primaryMuscle] ?? 0) + 1;
    const pattern = next.movementPattern ?? 'unknown';
    sessionPatternUsage[pattern] = (sessionPatternUsage[pattern] ?? 0) + 1;
    const role = next.exerciseRole ?? 'compound';
    sessionRoleUsage[role] = (sessionRoleUsage[role] ?? 0) + 1;
    const tension = next.tensionBias ?? 'unknown';
    if (tension !== 'unknown') sessionTensionUsage[tension] = (sessionTensionUsage[tension] ?? 0) + 1;
    if (next.fatigueCost === 'high') highFatigueCount += 1;
  }
  return selected;
}

function buildCandidate(strategy: TitanEngineStrategy, assessment: TitanEngineAssessment, exercises: TitanEngineExercise[], rule: TitanEnginePrescriptionRule): TitanEngineCandidateBlueprint {
  const config = strategySettings(strategy);
  const split = buildSplit(assessment.trainingDaysPerWeek);
  const avoided = new Set(assessment.avoidedExerciseIds ?? []);
  const accumulatedSets: Record<string, number> = {};
  const exerciseUsage: Record<string, number> = {};
  const patternUsage: Record<string, number> = {};
  const workouts = split.map((focus, dayIndex) => {
    const pool = exercises.filter((exercise) => focusMatches(focus, exercise.primaryMuscle)).filter((exercise) => !avoided.has(exercise.id)).filter((exercise) => !isPotentiallyLimited(exercise, assessment));
    const requestedCount = Math.round(rule.maxExercisesPerSession * config.exerciseScale);
    const count = Math.max(1, Math.min(rule.maxExercisesPerSession, requestedCount));
    const chosen = selectSessionExercises(pool, count, assessment, exerciseUsage, patternUsage);
    const prescribed: TitanEngineCandidateBlueprint['workouts'][number]['exercises'] = [];
    for (const exercise of chosen) {
      const priority = priorityScore(exercise.primaryMuscle, assessment.musclePriorities) > 0;
      const desiredSets = Math.max(2, Math.round((priority ? 3.5 : 3) * config.setScale));
      const weeklyCeiling = Math.round(rule.weeklySetsPerMuscle[1] * (priority ? 1.15 : 1));
      const currentSets = accumulatedSets[exercise.primaryMuscle] ?? 0;
      const remaining = weeklyCeiling - currentSets;
      if (remaining < 2) continue;
      const sets = Math.min(desiredSets, remaining);
      accumulatedSets[exercise.primaryMuscle] = currentSets + sets;
      exerciseUsage[exercise.id] = (exerciseUsage[exercise.id] ?? 0) + 1;
      patternUsage[usageKey(exercise)] = (patternUsage[usageKey(exercise)] ?? 0) + 1;
      prescribed.push({ ...exercise, priority, sets });
    }
    return { dayIndex, dayLabel: assessment.availableTrainingDays?.[dayIndex] ?? DAY_NAMES[dayIndex] ?? `Dia ${dayIndex + 1}`, focus, exercises: prescribed };
  });
  const base = { strategy, title: config.title, rationale: rationaleFor(strategy, assessment), workouts, metrics: {} as TitanEngineCandidateMetrics, recommended: false };
  return { ...base, metrics: metricsFor(base, assessment, rule) };
}

function recommendationReasons(candidate: TitanEngineCandidateBlueprint) {
  const reasons = [`Score TITAN ${candidate.metrics.score}/100.`];
  if (candidate.metrics.volumeTargetCoverage >= 80) reasons.push('Mantém boa cobertura do volume semanal alvo.');
  if (candidate.metrics.frequencyScore >= 85) reasons.push('Distribui os músculos em frequência compatível com a rotina semanal.');
  if (candidate.metrics.sessionBalance >= 85) reasons.push('Distribui o trabalho de forma equilibrada entre as sessões.');
  if (candidate.metrics.fatigueScore >= 85) reasons.push('Mantém a carga por sessão compatível com tempo, estabilidade e custo de fadiga dos exercícios.');
  if (candidate.strategy === 'balanced') reasons.push('Equilibra aderência, estímulo e recuperação como padrão da Engine.');
  return reasons;
}

export function generateTitanEngineBlueprints(assessment: TitanEngineAssessment, exercises: TitanEngineExercise[], rule: TitanEnginePrescriptionRule): TitanEngineResult {
  const warnings: string[] = [];
  if (assessment.trainingDaysPerWeek < 1 || assessment.trainingDaysPerWeek > 7) warnings.push('Dias de treino ajustados para o intervalo suportado de 1 a 7.');
  if (!exercises.length) warnings.push('Nenhum exercício elegível foi fornecido à TITAN Engine.');
  const strategies: TitanEngineStrategy[] = ['adherence', 'balanced', 'availability'];
  const scored = strategies.map((strategy) => buildCandidate(strategy, assessment, exercises, rule));
  const recommended = [...scored].sort((a, b) => b.metrics.score - a.metrics.score || strategies.indexOf(a.strategy) - strategies.indexOf(b.strategy))[0];
  const candidates = scored.map((candidate) => ({ ...candidate, recommended: candidate.strategy === recommended.strategy }));
  return { engineVersion: 1, candidates, recommendedStrategy: recommended.strategy, recommendationReasons: recommendationReasons(recommended), warnings };
}
