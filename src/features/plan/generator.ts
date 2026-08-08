import type { GeneratedPlanCandidate, PlanCandidateStrategy, TitanProfile, TitanTrainingAssessment } from '../profile/types';
import { buildSplitTemplate, getEligibleExercises, getPrescriptionRule } from '../exercise-library/prescription';
import { generateCardioSchedule } from '../cardio/generator';
import type { TitanPlan, TitanWorkoutDay } from './types';

const DAY_NAMES = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

function focusMatches(focus: string, muscle: string) {
  const m = muscle.toLowerCase();
  if (focus === 'full-body') return true;
  if (focus === 'push') return ['peitoral','deltoides','tríceps'].some((x) => m.includes(x));
  if (focus === 'pull') return ['costas','dorsais','bíceps'].some((x) => m.includes(x));
  if (focus === 'legs') return ['quadríceps','posteriores','panturrilhas'].some((x) => m.includes(x));
  if (focus === 'upper') return ['peitoral','deltoides','tríceps','costas','dorsais','bíceps'].some((x) => m.includes(x));
  if (focus === 'lower') return ['quadríceps','posteriores','panturrilhas','abdômen','core'].some((x) => m.includes(x));
  return true;
}

function candidateSettings(strategy: PlanCandidateStrategy) {
  if (strategy === 'adherence') return { setScale: 0.75, exerciseScale: 0.8, suffix: 'Maior aderência' };
  if (strategy === 'availability') return { setScale: 1.15, exerciseScale: 1, suffix: 'Maior disponibilidade' };
  return { setScale: 1, exerciseScale: 1, suffix: 'Equilíbrio' };
}

export function generateTitanPlanCandidates(profile: TitanProfile, assessment: TitanTrainingAssessment): Array<GeneratedPlanCandidate<TitanPlan>> {
  const input = { experience: assessment.experience, trainingDaysPerWeek: assessment.trainingDaysPerWeek, preferredSessionMinutes: assessment.preferredSessionMinutes, equipmentAccess: assessment.equipmentAccess };
  const rule = getPrescriptionRule(input);
  const eligible = getEligibleExercises(input);
  const split = buildSplitTemplate(assessment.trainingDaysPerWeek);
  const strategies: PlanCandidateStrategy[] = ['adherence','balanced','availability'];
  const cardioSchedule = generateCardioSchedule(assessment);

  return strategies.map((strategy) => {
    const config = candidateSettings(strategy);
    const workouts: TitanWorkoutDay[] = split.map(([focus], dayIndex) => {
      const pool = eligible.filter((exercise) => focusMatches(focus, exercise.primaryMuscle));
      const count = Math.max(4, Math.min(rule.maxExercisesPerSession, Math.round(rule.maxExercisesPerSession * config.exerciseScale)));
      const chosen = pool.slice(0, count);
      return {
        id: `${strategy}-${dayIndex + 1}`,
        day: DAY_NAMES[dayIndex] ?? `Dia ${dayIndex + 1}`,
        title: focus === 'full-body' ? 'Full Body' : focus === 'upper' ? 'Upper' : focus === 'lower' ? 'Lower' : focus === 'push' ? 'Push' : focus === 'pull' ? 'Pull' : 'Legs',
        focus,
        exercises: chosen.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.primaryMuscle,
          exerciseType: 'strength',
          sets: Math.max(2, Math.round(3 * config.setScale)),
          minReps: exercise.repRange[0],
          maxReps: exercise.repRange[1],
          targetRir: exercise.defaultRir,
          restSeconds: exercise.restSeconds,
          technique: exercise.technique,
          commonMistakes: exercise.commonMistakes,
          alternatives: exercise.substitutions,
        })),
      };
    });

    const plan: TitanPlan = {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      name: `Plano TITAN — ${config.suffix}`,
      description: `Plano gerado localmente para ${profile.displayName}, com base no perfil e disponibilidade informados.`,
      createdAt: new Date().toISOString(),
      author: 'TITAN',
      project: {
        name: `Projeto ${profile.displayName}`,
        objective: profile.primaryGoal ?? 'general-fitness',
        cardioGoal: assessment.cardioGoal,
        cardioSchedule,
      },
      workouts,
    };

    const rationale = strategy === 'adherence'
      ? ['Menor volume por sessão para facilitar consistência.', `Respeita ${assessment.trainingDaysPerWeek} dias disponíveis e cerca de ${assessment.preferredSessionMinutes} min por treino.`]
      : strategy === 'balanced'
        ? ['Equilibra estímulo, recuperação e tempo de sessão.', 'É a recomendação padrão do TITAN para este perfil.']
        : ['Aproveita mais da disponibilidade informada.', 'Usa volume um pouco maior sem ultrapassar os limites definidos para a experiência atual.'];

    if (cardioSchedule.length) rationale.push(`Inclui ${cardioSchedule.length} sessões de cardio alinhadas ao objetivo ${assessment.cardioGoal}.`);

    return { id: crypto.randomUUID(), profileId: profile.id, strategy, title: config.suffix, rationale, source:'titan-generated', plan, createdAt: new Date().toISOString() };
  });
}
