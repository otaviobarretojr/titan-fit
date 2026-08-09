import { generateTitanEngineBlueprints, type TitanEngineExercise } from '../../core/titan-engine';
import { generateCardioSchedule } from '../cardio/generator';
import { getEligibleExercises, getPrescriptionRule } from '../exercise-library/prescription';
import type { GeneratedPlanCandidate, TitanProfile, TitanTrainingAssessment } from '../profile/types';
import type { TitanPlan, TitanWorkoutDay } from './types';

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
    repRange: exercise.repRange,
    defaultRir: exercise.defaultRir,
    restSeconds: exercise.restSeconds,
    technique: exercise.technique,
    commonMistakes: exercise.commonMistakes,
    substitutions: exercise.substitutions,
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
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.primaryMuscle,
        exerciseType: 'strength',
        sets: exercise.sets,
        minReps: exercise.repRange[0],
        maxReps: exercise.repRange[1],
        targetRir: exercise.defaultRir,
        restSeconds: exercise.restSeconds,
        technique: exercise.technique,
        commonMistakes: exercise.commonMistakes,
        alternatives: exercise.substitutions,
      })),
    }));

    const rationale = [...candidate.rationale];
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
    };
  });
}
