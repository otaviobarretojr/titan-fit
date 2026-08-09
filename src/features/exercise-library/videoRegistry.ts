import type { TitanCatalogExercise } from './catalog';

export type ExerciseVideoLicenseStatus = 'embedded-reference' | 'licensed-external' | 'titan-owned';
export type ExerciseVideoProvider = 'youtube' | 'hosted';

export type ExerciseVideoMetadata = {
  exerciseId: string;
  provider: ExerciseVideoProvider;
  title: string;
  sourceName: string;
  licenseStatus: ExerciseVideoLicenseStatus;
  videoId?: string;
  videoUrl?: string;
  posterUrl?: string;
  author?: string;
  licenseName?: string;
  licenseUrl?: string;
  attributionUrl?: string;
};

/**
 * Registro formal de mídia da Biblioteca TITAN.
 * `embedded-reference` significa que o TITAN apenas incorpora uma mídia pública
 * do provedor; o arquivo não é copiado nem tratado como conteúdo TITAN.
 * `licensed-external` só deve ser usado quando autor e licença forem verificados.
 */
export const EXERCISE_VIDEO_REGISTRY: Record<string, ExerciseVideoMetadata> = {
  'chest-press-machine': embedded('chest-press-machine','pnmUJSzBvXM','Chest press convergente — execução','Vinicius Piffardini'),
  'incline-barbell-press': embedded('incline-barbell-press','GhfwvlZbLGM','Supino inclinado com barra — execução','MyTrainingPRO'),
  'incline-dumbbell-press': embedded('incline-dumbbell-press','7V6kFe82iKk','Supino inclinado com halteres — execução','MyTrainingPRO'),
  'incline-machine-press': embedded('incline-machine-press','5OayotgIe9M','Supino inclinado máquina','Pedro Lonngren'),
  'lat-pulldown': embedded('lat-pulldown','VM4IQ4-km14','Puxada alta — execução','Marzrodie'),
  'one-arm-lat-pulldown': embedded('one-arm-lat-pulldown','t0yzt3Ba8kY','Puxada unilateral na polia alta','Prof. Matheus Gomes'),
  'straight-arm-pulldown': embedded('straight-arm-pulldown','WDOV2PDpkiU','Pulldown com braços estendidos','Colossus Fitness'),
  'seated-row': embedded('seated-row','qqZHnqzvbXs','Remada baixa sentada — pegada neutra','Functional AF'),
  'chest-supported-row': embedded('chest-supported-row','wDoIGNbiny0','Remada com peito apoiado','Gaintrust Bodybuilding'),
  'machine-row': embedded('machine-row','veciiO2SU2c','Remada unilateral máquina — execução','Kiki Cunningham'),
  'machine-shoulder-press': embedded('machine-shoulder-press','WvLMauqrnK8','Desenvolvimento na máquina','Renaissance Periodization'),
  'dumbbell-lateral-raise': embedded('dumbbell-lateral-raise','JeYouxFZZiI','Elevação lateral com halteres — execução','FITTR'),
  'cable-lateral-raise': embedded('cable-lateral-raise','GMuw8OAelS4','Elevação lateral unilateral na polia','Artagnan Consultoria Online'),
  'machine-lateral-raise': embedded('machine-lateral-raise','LLZ0k0doyJs','Elevação lateral na máquina','Cezar Bononi'),
  'arnold-press': embedded('arnold-press','TEzehbTzBD0','Desenvolvimento Arnold — execução','FITTR'),
  'rear-delt-fly': embedded('rear-delt-fly','Q8DqRXPJk7g','Crucifixo inverso máquina','Cutler Nutrition'),
  'face-pull': embedded('face-pull','ljgqer1ZpXg','Face pull — execução','ATHLEAN-X'),
  'barbell-curl': embedded('barbell-curl','doiWKI0SgC8','Rosca direta com barra — execução','FITTR'),
  'ez-bar-curl': embedded('ez-bar-curl','Bi9GdTBXZtw','Rosca com barra W — execução','FITTR'),
  'preacher-curl': embedded('preacher-curl','AR-oARBkYxI','Rosca Scott — execução','Colossus Fitness'),
  'incline-dumbbell-curl': embedded('incline-dumbbell-curl','PAnypqTfEuU','Rosca inclinada — execução','Colossus Fitness'),
  'rope-hammer-curl': embedded('rope-hammer-curl','1Quc_tOv97I','Rosca martelo na corda — execução','ScottHermanFitness'),
  'skull-crusher': embedded('skull-crusher','4FWMMVhdBg8','Tríceps testa / skull crusher — execução','FITTR'),
  'dumbbell-overhead-extension': embedded('dumbbell-overhead-extension','T1EO7u2n7WU','Tríceps francês com halter — execução','FITTR'),
  'single-arm-pushdown': embedded('single-arm-pushdown','BnQ2rqS2K18','Tríceps unilateral na polia','Blueprint Fitness'),
  'rope-pushdown': embedded('rope-pushdown','4weS5P02X9k','Tríceps corda — execução','Gean Vernes'),
  'overhead-cable-extension': embedded('overhead-cable-extension','osFW51jFGgU','Extensão de tríceps acima da cabeça','T Nation'),
  'hack-squat': embedded('hack-squat','weyTbC-AjRg','Hack squat — execução e erros','FISIculturismo.com.br'),
  'leg-press': embedded('leg-press','SV3-hWw50_A','Leg press 45° — execução','Training Fit'),
  'leg-extension': embedded('leg-extension','y6juG3XuRe4','Cadeira extensora — execução','Tay Training'),
  'seated-leg-curl': embedded('seated-leg-curl','Zss6E3VU6X0','Cadeira flexora — execução','Leandro Twin'),
  'lying-leg-curl': embedded('lying-leg-curl','vl5nUdE9mWM','Mesa flexora — execução','Physique Development'),
  'single-leg-curl': embedded('single-leg-curl','J88VHzTDPyQ','Flexora unilateral — execução','Miqueias Alves Personal'),
  'machine-hip-thrust': embedded('machine-hip-thrust','tztHvSLdXLA','Hip thrust máquina — execução','Colossus Fitness'),
  'leg-press-calf-raise': embedded('leg-press-calf-raise','8k435cj30gc','Panturrilha no leg press','NASM'),
  'smith-calf-raise': embedded('smith-calf-raise','jZynHLSRxys','Panturrilha em pé no Smith','Adilson Silva'),
  'seated-calf-raise': embedded('seated-calf-raise','y2ueC0LggrI','Panturrilha sentada','AMOFitnessTraining'),
  'pallof-press': embedded('pallof-press','_2xWmYNnFS8','Pallof press — execução','Colossus Fitness'),
  'ab-wheel': embedded('ab-wheel','nCh8VfWY5_g','Roda abdominal — execução e erros','Redefining Strength'),
  'reverse-wrist-curl': embedded('reverse-wrist-curl','SngocRgAkvY','Extensão de punho — execução','AthleticMuscle'),
  'reverse-curl': embedded('reverse-curl','f7FOpwcB-Rg','Rosca inversa com barra W — execução','YST Exercises'),
  'farmers-walk': embedded('farmers-walk','vi4X2iSOyiA','Caminhada do fazendeiro — técnica','Rogue Fitness'),
  'machine-shrug': embedded('machine-shrug','fChAG371a-s','Encolhimento máquina — execução','MrSupplement.com.au'),
};

function embedded(exerciseId:string,videoId:string,title:string,channel:string):ExerciseVideoMetadata{
  return {exerciseId,provider:'youtube',videoId,title,sourceName:`YouTube · ${channel}`,author:channel,licenseStatus:'embedded-reference',attributionUrl:`https://www.youtube.com/watch?v=${videoId}`};
}

export function getCatalogExerciseVideo(exercise: Pick<TitanCatalogExercise,'id'>): ExerciseVideoMetadata | null {
  return EXERCISE_VIDEO_REGISTRY[exercise.id] ?? null;
}

export function getVideoCoverage(exercises: Array<Pick<TitanCatalogExercise,'id'>>) {
  const covered=exercises.filter((exercise)=>Boolean(EXERCISE_VIDEO_REGISTRY[exercise.id])).length;
  return {covered,total:exercises.length,pending:Math.max(0,exercises.length-covered),percentage:exercises.length?Math.round((covered/exercises.length)*100):0};
}
