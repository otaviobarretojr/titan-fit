import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getExerciseVideo } from '../src/features/exercise-library/videos';
import type { TitanExercise, TitanPlan } from '../src/features/plan/types';

const plan = JSON.parse(readFileSync('docs/plans/otavio-hipertrofia-enfase-v1.titan', 'utf8')) as TitanPlan;

function asExercise(base: TitanExercise, name: string): TitanExercise {
  return { ...base, id: `${base.id}::audit::${name}`, name, alternatives: undefined, alternativeExercises: undefined, video: undefined };
}

describe('Modo treino — cobertura de vídeo das alternativas', () => {
  it('mantém vídeo para todos os exercícios principais do plano auditado', () => {
    const missing = plan.workouts.flatMap((workout) => workout.exercises)
      .filter((exercise) => !getExerciseVideo(exercise))
      .map((exercise) => exercise.name);
    expect(missing, `Exercícios principais sem vídeo: ${missing.join(', ')}`).toEqual([]);
  });

  it('mantém vídeo para todas as alternativas oferecidas no treino', () => {
    const missing = plan.workouts.flatMap((workout) => workout.exercises.flatMap((exercise) => [
      ...(exercise.alternativeExercises ?? []).map((alternative) => ({ base: exercise, exercise: { ...exercise, ...alternative, alternatives: undefined, alternativeExercises: undefined } as TitanExercise })),
      ...(exercise.alternatives ?? []).map((name) => ({ base: exercise, exercise: asExercise(exercise, name) })),
    ]))
      .filter(({ exercise }) => !getExerciseVideo(exercise))
      .map(({ base, exercise }) => `${base.name} → ${exercise.name}`);
    expect(missing, `Alternativas sem vídeo: ${missing.join(' | ')}`).toEqual([]);
  });
});
