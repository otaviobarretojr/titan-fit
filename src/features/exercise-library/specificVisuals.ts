export type ExerciseVisualSpec = {
  label: string;
  cue: string;
  bodyPath: string;
  armPath: string;
  legPath: string;
  equipmentPath?: string;
  motionPath: string;
};

export const SPECIFIC_EXERCISE_VISUALS: Record<string, ExerciseVisualSpec> = {
  'bench-press': { label:'Supino reto', cue:'Desça a barra ao peito com escápulas estáveis e empurre mantendo os pés firmes.', bodyPath:'M70 86 L150 86', armPath:'M92 78 L108 58 L132 58 L148 78', legPath:'M82 88 L64 116 M138 88 L156 116', equipmentPath:'M48 92 L172 92 M55 116 L55 76 M165 116 L165 76 M102 54 L138 54', motionPath:'M120 52 L120 30' },
  'dumbbell-bench-press': { label:'Supino com halteres', cue:'Mantenha os punhos alinhados e controle a descida dos halteres.', bodyPath:'M70 86 L150 86', armPath:'M92 78 L108 58 M148 78 L132 58', legPath:'M82 88 L64 116 M138 88 L156 116', equipmentPath:'M102 54 L112 54 M128 54 L138 54', motionPath:'M120 52 L120 30' },
  'lat-pulldown': { label:'Puxada alta', cue:'Conduza os cotovelos para baixo sem inclinar demais o tronco.', bodyPath:'M110 42 L110 90', armPath:'M110 48 L82 30 L68 8 M110 48 L138 30 L152 8', legPath:'M110 90 L92 124 M110 90 L128 124', equipmentPath:'M54 6 L166 6 M60 6 L60 132 M160 6 L160 132', motionPath:'M178 16 L178 64' },
  'seated-row': { label:'Remada sentada', cue:'Puxe o cabo em direção ao tronco sem usar balanço.', bodyPath:'M110 46 L110 88', armPath:'M110 54 L84 68 L58 58 M110 54 L136 68 L162 58', legPath:'M110 88 L86 112 L62 112 M110 88 L134 112 L158 112', equipmentPath:'M36 56 L54 56 M36 44 L36 72', motionPath:'M46 84 L96 84' },
  'machine-shoulder-press': { label:'Desenvolvimento máquina', cue:'Empurre acima da cabeça sem perder o apoio do tronco.', bodyPath:'M110 42 L110 90', armPath:'M110 50 L86 34 L82 10 M110 50 L134 34 L138 10', legPath:'M110 90 L92 124 M110 90 L128 124', equipmentPath:'M72 8 L92 8 M128 8 L148 8 M70 128 L70 40 M150 128 L150 40', motionPath:'M166 54 L166 12' },
  'hack-squat': { label:'Agachamento hack', cue:'Desça com o tronco apoiado e joelhos acompanhando os pés.', bodyPath:'M104 34 L118 82', armPath:'M108 48 L88 66 M112 48 L132 66', legPath:'M118 82 L94 104 L82 128 M118 82 L142 104 L154 128', equipmentPath:'M72 22 L128 22 M68 20 L92 132 M148 20 L166 132', motionPath:'M186 42 L186 108' },
  'leg-press': { label:'Leg press', cue:'Empurre a plataforma mantendo quadril e lombar apoiados.', bodyPath:'M74 96 L108 70', armPath:'M82 88 L66 74 M92 82 L76 68', legPath:'M108 70 L136 70 L164 48 M108 70 L140 82 L168 64', equipmentPath:'M176 30 L192 76 M56 108 L90 82', motionPath:'M146 96 L184 66' },
  'barbell-squat': { label:'Agachamento com barra', cue:'Mantenha o tronco firme e desça com joelhos acompanhando os pés.', bodyPath:'M110 34 L110 82', armPath:'M110 50 L84 46 M110 50 L136 46', legPath:'M110 82 L86 104 L76 132 M110 82 L134 104 L144 132', equipmentPath:'M74 42 L146 42', motionPath:'M178 46 L178 112' },
  'romanian-deadlift': { label:'Levantamento romeno', cue:'Leve o quadril para trás e mantenha a barra próxima das pernas.', bodyPath:'M100 40 L122 76', armPath:'M106 48 L92 74 M114 54 L104 80', legPath:'M122 76 L106 126 M122 76 L140 124', equipmentPath:'M82 84 L122 84', motionPath:'M154 76 L188 76' },
  'seated-leg-curl': { label:'Flexora sentada', cue:'Flexione os joelhos mantendo o quadril apoiado.', bodyPath:'M110 40 L110 84', armPath:'M110 54 L86 70 M110 54 L134 70', legPath:'M110 84 L136 88 L116 112 M110 84 L84 88 L104 112', equipmentPath:'M76 118 L144 118 M74 40 L74 118', motionPath:'M170 108 L138 108' },
  'cable-curl': { label:'Rosca no cabo', cue:'Flexione os cotovelos mantendo-os próximos ao corpo.', bodyPath:'M110 38 L110 88', armPath:'M110 52 L88 68 L74 48 M110 52 L132 68 L146 48', legPath:'M110 88 L92 126 M110 88 L128 126', equipmentPath:'M38 36 L38 130 M38 118 L72 72', motionPath:'M58 76 Q72 46 88 48' },
  'cable-pushdown': { label:'Tríceps na polia', cue:'Estenda os cotovelos sem projetar os ombros para frente.', bodyPath:'M110 38 L110 88', armPath:'M110 52 L88 62 L78 88 M110 52 L132 62 L142 88', legPath:'M110 88 L92 126 M110 88 L128 126', equipmentPath:'M40 18 L40 128 M40 26 L90 58', motionPath:'M66 54 L80 90' },
  'standing-calf-raise': { label:'Panturrilha em pé', cue:'Suba pelos tornozelos e controle a descida até o alongamento.', bodyPath:'M110 36 L110 88', armPath:'M110 52 L84 68 M110 52 L136 68', legPath:'M110 88 L94 124 L88 136 M110 88 L126 124 L132 136', motionPath:'M170 128 L170 88' },
  'cable-crunch': { label:'Crunch no cabo', cue:'Flexione o tronco usando o abdômen sem puxar apenas com os braços.', bodyPath:'M112 38 Q100 64 114 86', armPath:'M110 48 L90 38 M110 48 L130 38', legPath:'M114 86 L94 126 M114 86 L134 126', equipmentPath:'M44 12 L44 130 M44 18 L92 42', motionPath:'M164 42 Q150 70 160 94' },
  'plank': { label:'Prancha', cue:'Mantenha ombros, quadril e tornozelos alinhados.', bodyPath:'M58 72 L148 92', armPath:'M70 76 L54 102 M82 80 L66 106', legPath:'M148 92 L174 104 M144 92 L168 112', motionPath:'M92 122 L142 122' },
};
