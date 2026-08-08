import { TITAN_EXERCISE_CATALOG, type TitanCatalogExercise, type TitanEquipment } from './catalog';
import { TITAN_EXTENDED_EXERCISE_CATALOG } from './extendedCatalog';

export const TITAN_FULL_EXERCISE_CATALOG: TitanCatalogExercise[] = [...TITAN_EXERCISE_CATALOG, ...TITAN_EXTENDED_EXERCISE_CATALOG];

export type ExerciseLibraryFilters = {
  query: string;
  muscle: string;
  equipment: TitanEquipment | 'all';
  experience: TitanCatalogExercise['minExperience'] | 'all';
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filterExerciseLibrary(filters: ExerciseLibraryFilters) {
  const query = normalize(filters.query);
  return TITAN_FULL_EXERCISE_CATALOG.filter((exercise) => {
    const searchable = normalize([exercise.name, exercise.primaryMuscle, ...exercise.secondaryMuscles].join(' '));
    const matchesQuery = !query || searchable.includes(query);
    const matchesMuscle = filters.muscle === 'all' || normalize(exercise.primaryMuscle) === normalize(filters.muscle);
    const matchesEquipment = filters.equipment === 'all' || exercise.equipment.includes(filters.equipment);
    const matchesExperience = filters.experience === 'all' || exercise.minExperience === filters.experience;
    return matchesQuery && matchesMuscle && matchesEquipment && matchesExperience;
  });
}

export const EXERCISE_LIBRARY_MUSCLES = [...new Set(TITAN_FULL_EXERCISE_CATALOG.map((exercise) => exercise.primaryMuscle))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
