import type { TitanCatalogExercise } from './catalog';
import { TITAN_FULL_EXERCISE_CATALOG } from './library';
import { SPECIFIC_EXERCISE_VISUALS, type ExerciseVisualSpec } from './specificVisuals';
import { SPECIFIC_EXERCISE_VISUALS_EXTRA } from './specificVisualsExtra';
import { SPECIFIC_EXERCISE_VISUALS_BATCH3 } from './specificVisualsBatch3';

const HANDCRAFTED_VISUALS: Record<string, ExerciseVisualSpec> = {
  ...SPECIFIC_EXERCISE_VISUALS,
  ...SPECIFIC_EXERCISE_VISUALS_EXTRA,
  ...SPECIFIC_EXERCISE_VISUALS_BATCH3,
};

const PATTERN_GEOMETRY: Record<TitanCatalogExercise['pattern'], Pick<ExerciseVisualSpec, 'bodyPath' | 'armPath' | 'legPath' | 'motionPath'>> = {
  'horizontal-push': { bodyPath:'M110 40 L110 88', armPath:'M110 54 L82 64 L54 64 M110 54 L138 64 L166 64', legPath:'M110 88 L92 126 M110 88 L128 126', motionPath:'M144 82 L184 82' },
  'vertical-push': { bodyPath:'M110 40 L110 90', armPath:'M110 54 L86 38 L84 12 M110 54 L134 38 L136 12', legPath:'M110 90 L92 126 M110 90 L128 126', motionPath:'M166 52 L166 12' },
  'horizontal-pull': { bodyPath:'M110 42 L110 90', armPath:'M110 56 L84 68 L58 58 M110 56 L136 68 L162 58', legPath:'M110 90 L92 126 M110 90 L128 126', motionPath:'M48 88 L96 82' },
  'vertical-pull': { bodyPath:'M110 42 L110 90', armPath:'M110 52 L88 32 L80 8 M110 52 L132 32 L140 8', legPath:'M110 90 L92 126 M110 90 L128 126', motionPath:'M170 18 L170 64' },
  'squat': { bodyPath:'M110 36 L110 82', armPath:'M110 52 L88 64 M110 52 L132 64', legPath:'M110 82 L86 104 L76 132 M110 82 L134 104 L144 132', motionPath:'M180 48 L180 112' },
  'hinge': { bodyPath:'M100 42 L126 78', armPath:'M106 54 L86 78 M116 60 L138 80', legPath:'M126 78 L108 126 M126 78 L144 124', motionPath:'M154 80 L190 80' },
  'knee-flexion': { bodyPath:'M110 44 L110 88', armPath:'M110 58 L88 72 M110 58 L132 72', legPath:'M110 88 L136 100 L116 124 M110 88 L86 102', motionPath:'M170 116 L138 116' },
  'elbow-flexion': { bodyPath:'M110 40 L110 90', armPath:'M110 54 L88 70 L78 50 M110 54 L132 70 L142 50', legPath:'M110 90 L92 126 M110 90 L128 126', motionPath:'M62 82 Q76 54 90 52' },
  'elbow-extension': { bodyPath:'M110 40 L110 90', armPath:'M110 54 L88 64 L78 90 M110 54 L132 64 L142 90', legPath:'M110 90 L92 126 M110 90 L128 126', motionPath:'M66 60 L78 94' },
  'calf': { bodyPath:'M110 38 L110 90', armPath:'M110 54 L88 68 M110 54 L132 68', legPath:'M110 90 L94 126 L88 138 M110 90 L126 126 L132 138', motionPath:'M172 130 L172 92' },
  'core': { bodyPath:'M72 86 L148 86', armPath:'M94 82 L72 104 M106 82 L86 104', legPath:'M148 86 L168 108 M140 86 L122 112', motionPath:'M58 122 L166 122' },
};

function equipmentPath(exercise: TitanCatalogExercise) {
  if (exercise.equipment.includes('machine')) return 'M48 24 L48 128 M172 24 L172 128';
  if (exercise.equipment.includes('cable')) return 'M34 20 L34 130 M34 70 L70 70';
  if (exercise.equipment.includes('barbell')) return 'M72 72 L148 72';
  if (exercise.equipment.includes('dumbbell')) return 'M68 72 L82 72 M138 72 L152 72';
  return undefined;
}

function buildGeneratedVisual(exercise: TitanCatalogExercise): ExerciseVisualSpec {
  const geometry = PATTERN_GEOMETRY[exercise.pattern];
  return {
    label: exercise.name,
    cue: exercise.technique,
    bodyPath: geometry.bodyPath,
    armPath: geometry.armPath,
    legPath: geometry.legPath,
    equipmentPath: equipmentPath(exercise),
    motionPath: geometry.motionPath,
  };
}

export const TITAN_EXERCISE_VISUALS: Record<string, ExerciseVisualSpec> = Object.fromEntries(
  TITAN_FULL_EXERCISE_CATALOG.map((exercise) => [exercise.id, HANDCRAFTED_VISUALS[exercise.id] ?? buildGeneratedVisual(exercise)]),
);

export const TITAN_HANDCRAFTED_VISUAL_COUNT = Object.keys(HANDCRAFTED_VISUALS).filter((id) => TITAN_FULL_EXERCISE_CATALOG.some((exercise) => exercise.id === id)).length;
export const TITAN_VISUAL_COVERAGE_COUNT = Object.keys(TITAN_EXERCISE_VISUALS).length;

export function getExerciseVisual(exercise: TitanCatalogExercise) {
  return TITAN_EXERCISE_VISUALS[exercise.id] ?? buildGeneratedVisual(exercise);
}
