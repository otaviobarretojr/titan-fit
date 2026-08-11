import { generateTitanEngineBlueprints, orderTitanSessionExercises, type TitanEngineExercise, type TitanEngineTensionBias } from '../../core/titan-engine';
import { TITAN_COMPLETE_EXERCISE_CATALOG, getEligibleExercises, getPrescriptionRule } from '../exercise-library/prescription';
import type { TitanCatalogExercise } from '../exercise-library/catalog';
import type { GeneratedPlanCandidate, TitanProfile, TitanTrainingAssessment } from '../profile/types';
import type { TitanExercise, TitanExerciseAlternative, TitanPlan, TitanWorkoutDay } from './types';

function workoutTitle(focus: string) {
  if (focus === 'full-body') return 'Full Body';
  if (focus === 'upper') return 'Upper';
  if (focus === 'lower') return 'Lower';
  if (focus === 'push') return 'Push';
  if (focus === 'pull') return 'Pull';
  return 'Legs';
}

const ISOLATION_IDS = new Set([
  'cable-fly','pec-deck','dumbbell-fly','straight-arm-pulldown','dumbbell-lateral-raise','cable-lateral-raise','machine-lateral-raise',
  'rear-delt-fly','cable-rear-delt-fly','face-pull','leg-extension','cable-kickback','hip-abduction-machine','cable-hip-abduction',
]);
const LENGTHENED_BIAS_IDS = new Set([
  'romanian-deadlift','stiff-deadlift','seated-leg-curl','incline-dumbbell-curl','bayesian-curl','overhead-cable-extension','dumbbell-overhead-extension',
]);
const SHORTENED_BIAS_IDS = new Set(['barbell-hip-thrust','machine-hip-thrust','glute-bridge','cable-kickback','cable-pushdown','rope-pushdown']);

function exerciseRole(exercise: TitanCatalogExercise): 'compound' | 'isolation' {
  if (ISOLATION_IDS.has(exercise.id)) return 'isolation';
  if (['elbow-flexion','elbow-extension','knee-flexion','calf','core'].includes(exercise.pattern)) return 'isolation';
  return 'compound';
}

function stabilityDemand(exercise: TitanCatalogExercise): 'low' | 'medium' | 'high' {
  if (exercise.equipment.includes('machine')) return 'low';
  if (exercise.equipment.includes('cable')) return 'medium';
  if (exercise.equipment.includes('barbell') || exercise.equipment.includes('bodyweight')) return 'high';
  return 'medium';
}

function fatigueCost(exercise: TitanCatalogExercise): 'low' | 'medium' | 'high' {
  const role = exerciseRole(exercise);
  if (role === 'isolation' && exercise.restSeconds <= 90) return 'low';
  if (exercise.restSeconds >= 150) return 'high';
  return 'medium';
}

function tensionBias(exercise: TitanCatalogExercise): TitanEngineTensionBias {
  if (LENGTHENED_BIAS_IDS.has(exercise.id)) return 'lengthened';
  if (SHORTENED_BIAS_IDS.has(exercise.id)) return 'shortened';
  return 'unknown';
}

function toEngineExercise(exercise: ReturnType<typeof getEligibleExercises>[number]): TitanEngineExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    movementPattern: exercise.pattern,
    exerciseRole: exerciseRole(exercise),
    stabilityDemand: stabilityDemand(exercise),
    fatigueCost: fatigueCost(exercise),
    tensionBias: tensionBias(exercise),
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

function integratedCardioExercises(assessment: TitanTrainingAssessment): TitanExercise[] {
  if (assessment.cardioGoal === 'none') return [];
  const level = assessment.currentCardioLevel ?? 'low';
  const baseMinutes = level === 'low' ? 20 : level === 'moderate' ? 30 : 40;
  const requested = Math.max(1, Math.min(assessment.cardioDaysPerWeek ?? (assessment.trainingDaysPerWeek >= 5 ? 2 : 3), assessment.trainingDaysPerWeek));
  const make = (id: string, name: string, minutes: number, zone: string, notes: string): TitanExercise => ({
    id,
    name,
    muscleGroup: 'Cardio',
    exerciseType: 'cardio',
    sets: 1,
    durationSeconds: minutes * 60,
    cardioZone: zone,
    notes,
  });

  if (assessment.cardioGoal === '5k' || assessment.cardioGoal === '10k') {
    const options = [
      make('cardio-integrated-runwalk', 'Corrida + caminhada', baseMinutes, 'Zona 2–3', 'Alterne corrida leve e caminhada, mantendo esforço controlado e técnica estável.'),
      make('cardio-integrated-zone2', 'Cardio Zona 2', baseMinutes + 10, 'Zona 2', 'Ritmo confortável e sustentável. Registre duração, distância, velocidade/ritmo e frequência cardíaca.'),
      make('cardio-integrated-easy-run', 'Corrida leve', baseMinutes, 'Zona 2', 'Corrida contínua leve. Reduza para caminhada se a respiração ou a técnica degradarem.'),
    ];
    return options.slice(0, requested);
  }

  if (assessment.cardioGoal === 'conditioning') {
    const options = [
      make('cardio-integrated-zone2', 'Cardio Zona 2', baseMinutes + 10, 'Zona 2', 'Mantenha intensidade confortável e contínua.'),
      make('cardio-integrated-intervals', 'Intervalado moderado', Math.max(15, baseMinutes - 5), 'Zona 3–4', 'Use blocos curtos de esforço mais forte com recuperação suficiente.'),
    ];
    return Array.from({ length: requested }, (_, index) => options[index % options.length]);
  }

  const label = assessment.cardioGoal === 'fat-loss-support' ? 'Cardio leve a moderado' : 'Cardio Zona 2';
  const zone = 'Zona 2';
  const note = assessment.cardioGoal === 'fat-loss-support'
    ? 'Aumente o gasto sem comprometer a recuperação da musculação.'
    : 'Construa consistência cardiovascular em intensidade sustentável.';
  return Array.from({ length: requested }, (_, index) => make(`cardio-integrated-${index + 1}`, label, baseMinutes + (index === 0 ? 10 : 0), zone, note));
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
  const cardioExercises = integratedCardioExercises(assessment);
  const createdAt = new Date().toISOString();

  return engine.candidates.map((candidate) => {
    const totalWorkouts = Math.max(1, candidate.workouts.length);
    const workouts: TitanWorkoutDay[] = candidate.workouts.map((workout, workoutIndex) => {
      const strengthExercises: TitanExercise[] = orderTitanSessionExercises(workout.exercises).map((exercise) => {
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
      });
      const cardioForWorkout = cardioExercises.filter((_, cardioIndex) => cardioIndex % totalWorkouts === workoutIndex);
      return {
        id: `${candidate.strategy}-${workout.dayIndex + 1}`,
        day: workout.dayLabel,
        title: workoutTitle(workout.focus),
        focus: workout.focus,
        exercises: [...strengthExercises, ...cardioForWorkout],
      };
    });

    const rationale = [...candidate.rationale];
    if (candidate.recommended) rationale.unshift(...engine.recommendationReasons);
    if (cardioExercises.length) rationale.push(`Inclui ${cardioExercises.length} etapa(s) de cardio dentro dos próprios treinos, alinhadas ao objetivo ${assessment.cardioGoal}.`);
    rationale.push('A ordem da sessão prioriza músculos-alvo, compostos de maior demanda e acessórios de menor custo no fim.');
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
