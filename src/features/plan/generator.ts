import { generateTitanEngineBlueprints, type TitanEngineExercise } from '../../core/titan-engine';
import { generateCardioSchedule } from '../cardio/generator';
import { TITAN_COMPLETE_EXERCISE_CATALOG, getEligibleExercises, getPrescriptionRule } from '../exercise-library/prescription';
import type { GeneratedPlanCandidate, TitanProfile, TitanTrainingAssessment } from '../profile/types';
import type { TitanExerciseAlternative, TitanPlan, TitanWorkoutDay } from './types';

function workoutTitle(focus: string) {
  if (focus === 'full-body') return 'Full Body';
  if (focus === 'upper') return 'Upper';
  if (focus === 'lower') return 'Lower';
  if (focus === 'push') return 'Push';
  if (focus === 'pull') return 'Pull';
  return 'Legs';
}

function toEngineExercise(exercise: ReturnType<typeof getEligibleExercises>[number]): TitanEngineExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    movementPattern: exercise.pattern,
    repRange: exercise.repRange,
    defaultRir: exercise.defaultRir,
    restSeconds: exercise.restSeconds,
    technique: exercise.technique,
    commonMistakes: exercise.commonMistakes,
    substitutions: exercise.substitutions,
  };
}

function toStructuredAlternative(id: string): TitanExerciseAlternative | null {
  const exercise = TITAN_COMPLETE_EXERCISE_CATALOG.find((item) => item.id === id);
  if (!exercise) return null;
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.primaryMuscle,
    exerciseType: 'strength',
    minReps: exercise.repRange[0],
    maxReps: exercise.repRange[1],
    targetRir: exercise.defaultRir,
    restSeconds: exercise.restSeconds,
    technique: exercise.technique,
    commonMistakes: exercise.commonMistakes,
  };
}

export function generateTitanPlanCandidates(
  profile: TitanProfile,
  assessment: TitanTrainingAssessment,
): Array<GeneratedPlanCandidate<TitanPlan>> {
  const prescriptionInput = {
    experience: assessment.experience,
    trainingDaysPerWeek: assessment.trainingDaysPerWeek,
    preferredSessionMinutes: assessment.preferredSessionMinutes,
    equipmentAccess: assessment.equipmentAccess,
  };
  const rule = getPrescriptionRule(prescriptionInput);
  const eligible = getEligibleExercises(prescriptionInput).map(toEngineExercise);
  const engine = generateTitanEngineBlueprints(assessment, eligible, {
    weeklySetsPerMuscle: rule.weeklySetsPerMuscle,
    maxExercisesPerSession: rule.maxExercisesPerSession,
  });
  const cardioSchedule = generateCardioSchedule(assessment);
  const createdAt = new Date().toISOString();

  return engine.candidates.map((candidate) => {
    const workouts: TitanWorkoutDay[] = candidate.workouts.map((workout) => ({
      id: `${candidate.strategy}-${workout.dayIndex + 1}`,
      day: workout.dayLabel,
      title: workoutTitle(workout.focus),
      focus: workout.focus,
      exercises: workout.exercises.map((exercise) => {
        const structuredAlternatives = exercise.substitutions
          .map(toStructuredAlternative)
          .filter((item): item is TitanExerciseAlternative => Boolean(item));
        const resolvedIds = new Set(structuredAlternatives.map((item) => item.id));
        const unresolvedAlternatives = exercise.substitutions.filter((id) => !resolvedIds.has(id));
        return {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.primaryMuscle,
          exerciseType: 'strength' as const,
          sets: exercise.sets,
          minReps: exercise.repRange[0],
          maxReps: exercise.repRange[1],
          targetRir: exercise.defaultRir,
          restSeconds: exercise.restSeconds,
          technique: exercise.technique,
          commonMistakes: exercise.commonMistakes,
          alternatives: unresolvedAlternatives.length ? unresolvedAlternatives : undefined,
          alternativeExercises: structuredAlternatives.length ? structuredAlternatives : undefined,
        };
      }),
    }));

    const rationale = [...candidate.rationale];
    if (candidate.recommended) rationale.unshift(...engine.recommendationReasons);
    if (cardioSchedule.length) rationale.push(`Inclui ${cardioSchedule.length} sessões de cardio alinhadas ao objetivo ${assessment.cardioGoal}.`);
    rationale.push(`Prescrição processada pela TITAN Engine v${engine.engineVersion}.`);
    rationale.push(...engine.warnings);

    const plan: TitanPlan = {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      name: `Plano TITAN — ${candidate.title}`,
      description: `Plano gerado localmente para ${profile.displayName}, com base no perfil, prioridades e disponibilidade informados.`,
      createdAt,
      author: 'TITAN',
      project: {
        name: `Projeto ${profile.displayName}`,
        objective: profile.primaryGoal ?? 'general-fitness',
        cardioGoal: assessment.cardioGoal,
        cardioSchedule,
      },
      workouts,
    };

    return {
      id: crypto.randomUUID(),
      profileId: profile.id,
      strategy: candidate.strategy,
      title: candidate.title,
      rationale,
      source: 'titan-generated',
      plan,
      createdAt,
      recommended: candidate.recommended,
      titanScore: candidate.metrics.score,
      engineMetrics: {
        volumeTargetCoverage: candidate.metrics.volumeTargetCoverage,
        sessionBalance: candidate.metrics.sessionBalance,
        fatigueScore: candidate.metrics.fatigueScore,
        strategyFit: candidate.metrics.strategyFit,
      },
    };
  });
}
