import { TITAN_EXERCISES } from './exercises';
import { InMemoryExerciseRepository } from './repository';

export * from './domain';
export * from './exercises';
export * from './repository';

export const exerciseLibrary = new InMemoryExerciseRepository(TITAN_EXERCISES);
