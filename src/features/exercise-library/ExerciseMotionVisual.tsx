import type { TitanCatalogExercise } from './catalog';
import { SPECIFIC_EXERCISE_VISUALS } from './specificVisuals';
import { SPECIFIC_EXERCISE_VISUALS_EXTRA } from './specificVisualsExtra';
import { SPECIFIC_EXERCISE_VISUALS_BATCH3 } from './specificVisualsBatch3';

export const ALL_SPECIFIC_EXERCISE_VISUALS = { ...SPECIFIC_EXERCISE_VISUALS, ...SPECIFIC_EXERCISE_VISUALS_EXTRA, ...SPECIFIC_EXERCISE_VISUALS_BATCH3 };

export function ExerciseMotionVisual({ exercise, compact = false }: { exercise: TitanCatalogExercise; compact?: boolean }) {
  const specific = ALL_SPECIFIC_EXERCISE_VISUALS[exercise.id];
  const generic = visualConfig(exercise.pattern);
  const label = specific?.label ?? generic.label;
  const cue = specific?.cue ?? generic.cue;
  const bodyPath = specific?.bodyPath ?? 'M110 40 L110 82';
  const armPath = specific?.armPath ?? generic.arms;
  const legPath = specific?.legPath ?? generic.legs;
  const motionPath = specific?.motionPath ?? generic.arrow;

  return <div className={`exercise-motion-visual${compact ? ' compact' : ''}${specific ? ' specific' : ''}`} aria-label={`Ilustração de ${label}`}>
    <svg viewBox="0 0 220 150" role="img" aria-hidden="true">
      <defs><marker id={`arrow-${exercise.id}`} markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" /></marker></defs>
      <circle className="motion-head" cx="110" cy="28" r={specific ? 10 : 11} />
      {specific?.equipmentPath && <path className="motion-equipment" d={specific.equipmentPath} />}
      <path className="motion-body" d={bodyPath} />
      <path className="motion-limb" d={armPath} />
      <path className="motion-limb" d={legPath} />
      <path className="motion-guide" d={motionPath} markerEnd={`url(#arrow-${exercise.id})`} />
    </svg>
    {!compact && <div><strong>{label}</strong><span>{cue}</span>{specific && <small>Ilustração específica TITAN</small>}</div>}
  </div>;
}

function visualConfig(pattern: TitanCatalogExercise['pattern']) {
  const map: Record<TitanCatalogExercise['pattern'], { label: string; cue: string; arms: string; legs: string; arrow: string }> = {
    'horizontal-push': { label:'Empurrar horizontal', cue:'Conduza a carga para frente mantendo o tronco estável.', arms:'M110 48 L76 62 M110 48 L144 62 M76 62 L48 62 M144 62 L172 62', legs:'M110 82 L92 122 M110 82 L128 122', arrow:'M145 52 L188 52' },
    'vertical-push': { label:'Empurrar vertical', cue:'Empurre acima da cabeça sem perder o alinhamento do tronco.', arms:'M110 48 L82 38 M110 48 L138 38 M82 38 L82 8 M138 38 L138 8', legs:'M110 82 L92 122 M110 82 L128 122', arrow:'M154 48 L154 10' },
    'horizontal-pull': { label:'Puxar horizontal', cue:'Conduza os cotovelos para trás e controle as escápulas.', arms:'M110 50 L82 62 M110 50 L138 62 M82 62 L58 50 M138 62 L162 50', legs:'M110 82 L92 122 M110 82 L128 122', arrow:'M58 76 L100 76' },
    'vertical-pull': { label:'Puxar vertical', cue:'Puxe de cima para baixo mantendo o tronco controlado.', arms:'M110 50 L84 34 M110 50 L136 34 M84 34 L72 8 M136 34 L148 8', legs:'M110 82 L92 122 M110 82 L128 122', arrow:'M168 12 L168 52' },
    'squat': { label:'Agachamento', cue:'Flexione quadril e joelhos com pés estáveis e subida controlada.', arms:'M110 50 L82 64 M110 50 L138 64', legs:'M110 82 L86 102 L74 126 M110 82 L134 102 L146 126', arrow:'M184 50 L184 108' },
    'hinge': { label:'Dobradiça de quadril', cue:'Leve o quadril para trás mantendo a coluna neutra.', arms:'M102 52 L74 76 M102 52 L132 76', legs:'M102 82 L88 122 M102 82 L128 118', arrow:'M152 84 L184 84' },
    'knee-flexion': { label:'Flexão de joelho', cue:'Flexione os joelhos sem perder estabilidade do quadril.', arms:'M110 50 L84 66 M110 50 L136 66', legs:'M110 82 L88 102 L112 118 M110 82 L132 102 L108 118', arrow:'M170 112 L138 112' },
    'elbow-flexion': { label:'Flexão de cotovelo', cue:'Aproxime a carga mantendo o cotovelo estável.', arms:'M110 50 L82 68 L66 46 M110 50 L138 68 L154 46', legs:'M110 82 L92 122 M110 82 L128 122', arrow:'M44 72 Q60 44 78 48' },
    'elbow-extension': { label:'Extensão de cotovelo', cue:'Estenda os cotovelos mantendo ombros e tronco firmes.', arms:'M110 50 L82 58 L62 82 M110 50 L138 58 L158 82', legs:'M110 82 L92 122 M110 82 L128 122', arrow:'M42 52 L62 82' },
    'calf': { label:'Flexão plantar', cue:'Suba pelos tornozelos e controle o retorno.', arms:'M110 50 L84 66 M110 50 L136 66', legs:'M110 82 L94 122 L86 134 M110 82 L126 122 L134 134', arrow:'M174 126 L174 88' },
    'core': { label:'Estabilização do core', cue:'Mantenha costelas e pelve controladas durante o movimento.', arms:'M110 50 L78 70 M110 50 L142 70', legs:'M110 82 L84 112 M110 82 L136 112', arrow:'M74 90 Q110 70 146 90' },
  };
  return map[pattern];
}
