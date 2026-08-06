import type { Equipment, ExerciseDefinition, ExerciseRepository, MuscleGroup } from './domain';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export class InMemoryExerciseRepository implements ExerciseRepository {
  private readonly exercises: ExerciseDefinition[];

  constructor(exercises: ExerciseDefinition[]) {
    const seenCodes = new Set<string>();
    const seenIds = new Set<string>();

    for (const exercise of exercises) {
      if (seenCodes.has(exercise.code)) throw new Error(`Código de exercício duplicado: ${exercise.code}`);
      if (seenIds.has(exercise.id)) throw new Error(`ID de exercício duplicado: ${exercise.id}`);
      seenCodes.add(exercise.code);
      seenIds.add(exercise.id);
    }

    this.exercises = exercises.map((exercise) => ({
      ...exercise,
      primaryMuscles: [...exercise.primaryMuscles],
      secondaryMuscles: [...exercise.secondaryMuscles],
      equipment: [...exercise.equipment],
      tags: [...exercise.tags],
      technique: [...exercise.technique],
      commonMistakes: [...exercise.commonMistakes],
      alternativeExerciseCodes: [...exercise.alternativeExerciseCodes],
      metrics: { ...exercise.metrics }
    }));
  }

  findAll(): ExerciseDefinition[] {
    return [...this.exercises];
  }

  findByCode(code: string): ExerciseDefinition | undefined {
    return this.exercises.find((exercise) => exercise.code === code);
  }

  findBySlug(slug: string): ExerciseDefinition | undefined {
    return this.exercises.find((exercise) => exercise.slug === slug);
  }

  findByMuscleGroup(group: MuscleGroup): ExerciseDefinition[] {
    return this.exercises.filter((exercise) => exercise.muscleGroup === group);
  }

  findByEquipment(equipment: Equipment): ExerciseDefinition[] {
    return this.exercises.filter((exercise) => exercise.equipment.includes(equipment));
  }

  findAlternatives(code: string): ExerciseDefinition[] {
    const exercise = this.findByCode(code);
    if (!exercise) return [];

    return exercise.alternativeExerciseCodes
      .map((alternativeCode) => this.findByCode(alternativeCode))
      .filter((alternative): alternative is ExerciseDefinition => Boolean(alternative));
  }

  search(query: string): ExerciseDefinition[] {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return this.findAll();

    return this.exercises.filter((exercise) => {
      const searchable = [
        exercise.code,
        exercise.name,
        exercise.slug,
        exercise.muscleGroup,
        ...exercise.primaryMuscles,
        ...exercise.secondaryMuscles,
        ...exercise.tags
      ];

      return searchable.some((value) => normalize(value).includes(normalizedQuery));
    });
  }
}
