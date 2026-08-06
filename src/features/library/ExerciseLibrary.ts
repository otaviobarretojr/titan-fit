import { TITAN_EXERCISES } from './exercises';
import type { Equipment, ExerciseDefinition, ExercisePriority, MuscleGroup } from './types';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export class ExerciseLibrary {
  private readonly exercises: readonly ExerciseDefinition[];

  constructor(exercises: readonly ExerciseDefinition[] = TITAN_EXERCISES) {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const exercise of exercises) {
      if (ids.has(exercise.id)) throw new Error(`Exercise id duplicado: ${exercise.id}`);
      if (slugs.has(exercise.slug)) throw new Error(`Exercise slug duplicado: ${exercise.slug}`);
      ids.add(exercise.id);
      slugs.add(exercise.slug);
    }

    this.exercises = exercises;
  }

  findAll() {
    return [...this.exercises];
  }

  findById(id: string) {
    return this.exercises.find((exercise) => exercise.id === id) ?? null;
  }

  findBySlug(slug: string) {
    return this.exercises.find((exercise) => exercise.slug === slug) ?? null;
  }

  findByMuscleGroup(muscleGroup: MuscleGroup) {
    return this.exercises.filter((exercise) => exercise.primaryMuscle === muscleGroup);
  }

  findByPriority(priority: ExercisePriority) {
    return this.exercises.filter((exercise) => exercise.priority === priority);
  }

  findByEquipment(equipment: Equipment) {
    return this.exercises.filter((exercise) => exercise.equipment.includes(equipment));
  }

  findAlternatives(exerciseId: string) {
    const exercise = this.findById(exerciseId);
    if (!exercise) return [];
    return exercise.alternatives
      .map((alternativeId) => this.findById(alternativeId))
      .filter((alternative): alternative is ExerciseDefinition => alternative !== null);
  }

  search(query: string) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return this.findAll();

    return this.exercises.filter((exercise) => {
      const searchable = [
        exercise.name,
        exercise.slug,
        exercise.primaryMuscle,
        ...exercise.secondaryMuscles,
        ...exercise.tags,
        ...exercise.equipment
      ];

      return searchable.some((value) => normalize(value).includes(normalizedQuery));
    });
  }
}

export const exerciseLibrary = new ExerciseLibrary();
