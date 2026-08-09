import type { TitanCatalogExercise } from './catalog';
import { getExerciseVisual, TITAN_HANDCRAFTED_VISUAL_COUNT } from './visualRegistry';

export function ExerciseMotionVisual({ exercise, compact = false }: { exercise: TitanCatalogExercise; compact?: boolean }) {
  const visual = getExerciseVisual(exercise);
  const handcrafted = TITAN_HANDCRAFTED_VISUAL_COUNT > 0;

  return <div className={`exercise-motion-visual${compact ? ' compact' : ''} specific`} aria-label={`Ilustração de ${visual.label}`}>
    <svg viewBox="0 0 220 150" role="img" aria-hidden="true">
      <defs><marker id={`arrow-${exercise.id}`} markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" /></marker></defs>
      <circle className="motion-head" cx="110" cy="28" r={10} />
      {visual.equipmentPath && <path className="motion-equipment" d={visual.equipmentPath} />}
      <path className="motion-body" d={visual.bodyPath} />
      <path className="motion-limb" d={visual.armPath} />
      <path className="motion-limb" d={visual.legPath} />
      <path className="motion-guide" d={visual.motionPath} markerEnd={`url(#arrow-${exercise.id})`} />
    </svg>
    {!compact && <div><strong>{visual.label}</strong><span>{visual.cue}</span>{handcrafted && <small>Visual TITAN · funciona offline</small>}</div>}
  </div>;
}
