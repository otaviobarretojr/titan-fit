import type { TitanExercise } from '../plan/types';
import { TITAN_FULL_EXERCISE_CATALOG } from './library';
import { TITAN_EXERCISE_VIDEO_REGISTRY } from './videoLibrary';
import type { ExerciseVideoProvider } from './videoRegistry';

export type CuratedExerciseVideo = {
  provider: ExerciseVideoProvider;
  videoId?: string;
  videoUrl?: string;
  title: string;
  source: string;
  attributionUrl?: string;
};

const CURATED_VIDEOS: Array<{ match: RegExp; video: CuratedExerciseVideo }> = [
  { match: /supino inclinado.*barra/i, video: youtube('GhfwvlZbLGM', 'Supino Inclinado com Barra — execução', 'YouTube · MyTrainingPRO') },
  { match: /supino inclinado.*halter/i, video: youtube('7V6kFe82iKk', 'Supino Inclinado com Halteres — execução', 'YouTube · MyTrainingPRO') },
  { match: /chest press convergente/i, video: youtube('pnmUJSzBvXM', 'Chest Press Convergente — execução', 'YouTube · Vinicius Piffardini') },
  { match: /crucifixo.*polia baixa/i, video: youtube('QUcXXwxa6hE', 'Crucifixo na Polia Baixa — execução', 'YouTube · Miqueias Alves Personal') },
  { match: /eleva[cç][aã]o lateral unilateral na polia/i, video: youtube('GMuw8OAelS4', 'Elevação Lateral Unilateral na Polia', 'YouTube · Artagnan Consultoria Online') },
  { match: /tr[ií]ceps.*corda/i, video: youtube('4weS5P02X9k', 'Tríceps na Corda — execução', 'YouTube · Gean Vernes') },
  { match: /tr[ií]ceps.*acima.*cabe[cç]a/i, video: youtube('osFW51jFGgU', 'Overhead Rope Triceps Extension', 'YouTube · T Nation') },
  { match: /barra fixa.*neutra/i, video: youtube('hp2ufLBH4VU', 'Barra Fixa com Pegada Neutra', 'YouTube · Jauan Treinos') },
  { match: /puxada unilateral/i, video: youtube('t0yzt3Ba8kY', 'Puxada Unilateral na Polia Alta', 'YouTube · Prof. Matheus Gomes') },
  { match: /remada articulada.*peito|remada.*peito apoiado/i, video: youtube('wDoIGNbiny0', 'Chest Supported Machine Row', 'YouTube · Gaintrust Bodybuilding') },
  { match: /pulldown.*bra[cç]os estendidos/i, video: youtube('WDOV2PDpkiU', 'Straight Arm Pulldown — execução', 'YouTube · Colossus Fitness') },
  { match: /rosca scott.*m[aá]quina/i, video: youtube('AR-oARBkYxI', 'Machine Preacher Curl — execução', 'YouTube · Colossus Fitness') },
  { match: /rosca martelo.*corda/i, video: youtube('1Quc_tOv97I', 'Rope Hammer Curl — execução', 'YouTube · ScottHermanFitness') },
  { match: /rosca punho inversa/i, video: youtube('SngocRgAkvY', 'Reverse Wrist Curl — execução', 'YouTube · AthleticMuscle') },
  { match: /hack squat/i, video: youtube('weyTbC-AjRg', 'Hack Squat — execução e erros', 'YouTube · FISIculturismo.com.br') },
  { match: /leg press 45/i, video: youtube('SV3-hWw50_A', 'Leg Press 45° — execução', 'YouTube · Training Fit') },
  { match: /afundo.*smith/i, video: youtube('vV_o81dSZoc', 'Smith Machine Lunge Tutorial', 'YouTube · DUNAMISXP') },
  { match: /cadeira extensora/i, video: youtube('y6juG3XuRe4', 'Cadeira Extensora — execução', 'YouTube · Tay Training') },
  { match: /mesa flexora/i, video: youtube('vl5nUdE9mWM', 'Lying Leg Curl — técnica e erros', 'YouTube · Physique Development') },
  { match: /panturrilha.*em p[eé].*smith/i, video: youtube('jZynHLSRxys', 'Panturrilha em Pé no Smith', 'YouTube · Adilson Silva') },
  { match: /panturrilha.*sentad/i, video: youtube('y2ueC0LggrI', 'Seated Calf Raise Tutorial', 'YouTube · AMOFitnessTraining') },
  { match: /desenvolvimento.*m[aá]quina/i, video: youtube('WvLMauqrnK8', 'Machine Shoulder Press', 'YouTube · Renaissance Periodization') },
  { match: /eleva[cç][aã]o lateral.*polia.*atr[aá]s/i, video: youtube('j-tCEMmnqfk', 'Cable Lateral Raise Behind the Body', 'YouTube · TylerPath') },
  { match: /eleva[cç][aã]o lateral.*m[aá]quina/i, video: youtube('LLZ0k0doyJs', 'Elevação Lateral — execução', 'YouTube · Cezar Bononi') },
  { match: /crucifixo inverso.*m[aá]quina/i, video: youtube('Q8DqRXPJk7g', 'Reverse Pec Deck — execução', 'YouTube · Cutler Nutrition') },
  { match: /face pull/i, video: youtube('ljgqer1ZpXg', 'Face Pull — execução correta', 'YouTube · ATHLEAN-X') },
  { match: /rosca inclinada/i, video: youtube('PAnypqTfEuU', 'Incline Dumbbell Curl — execução', 'YouTube · Colossus Fitness') },
  { match: /tr[ií]ceps unilateral/i, video: youtube('BnQ2rqS2K18', 'Single Arm Cable Triceps Extension', 'YouTube · Blueprint Fitness') },
  { match: /farmer'?s walk|farmer.*walk|farmer.*carry/i, video: youtube('vi4X2iSOyiA', "Farmer's Carry — técnica", 'YouTube · Rogue Fitness') },
  { match: /cadeira flexora/i, video: youtube('Zss6E3VU6X0', 'Como fazer cadeira flexora', 'YouTube · Leandro Twin') },
  { match: /rdl.*smith|romeno.*smith/i, video: youtube('Ghc9V73wTyQ', 'Smith Machine Romanian Deadlift', 'YouTube · Team Evolve') },
  { match: /hip thrust.*m[aá]quina/i, video: youtube('tztHvSLdXLA', 'Machine Hip Thrust — execução', 'YouTube · Colossus Fitness') },
  { match: /flexora unilateral/i, video: youtube('J88VHzTDPyQ', 'Single-Leg Curl Machine — execução', 'YouTube · Miqueias Alves Personal') },
  { match: /ab wheel/i, video: youtube('nCh8VfWY5_g', 'Ab Wheel Rollout — execução e erros', 'YouTube · Redefining Strength') },
  { match: /pallof press/i, video: youtube('_2xWmYNnFS8', 'Pallof Press — execução correta', 'YouTube · Colossus Fitness') },
  { match: /extens[aã]o de quadril.*45/i, video: youtube('IJ2Cw-qV25s', '45 Degree Back Extension Tutorial', 'YouTube · Luke Johnson') },
  { match: /panturrilha.*leg press/i, video: youtube('8k435cj30gc', 'Leg Press Calf Raise', 'YouTube · NASM') },
  { match: /tibial|ponta dos p[eé]s.*tibial/i, video: youtube('gNS_QjGAs_k', 'Tibialis Raise', 'YouTube · The Kneesovertoesguy') },
  { match: /remada baixa.*neutra/i, video: youtube('qqZHnqzvbXs', 'Seated Cable Row — Neutral Grip', 'YouTube · Functional AF') },
  { match: /remada unilateral.*m[aá]quina/i, video: youtube('veciiO2SU2c', 'Single Arm Machine Row', 'YouTube · Kiki Cunningham') },
  { match: /puxada.*aberta/i, video: youtube('VM4IQ4-km14', 'Wide-Grip Lat Pulldown Tutorial', 'YouTube · Marzrodie') },
  { match: /supino inclinado.*m[aá]quina/i, video: youtube('5OayotgIe9M', 'Supino Inclinado na Máquina', 'YouTube · Pedro Lonngren') },
  { match: /crucifixo inclinado/i, video: youtube('DBHJKvY8mX0', 'Incline Cable Fly', 'YouTube · Exercises.com.au') },
  { match: /encolhimento.*m[aá]quina/i, video: youtube('fChAG371a-s', 'Machine Shrug Exercise', 'YouTube · MrSupplement.com.au') },
  { match: /rosca inversa.*ez|rosca inversa.*barra/i, video: youtube('f7FOpwcB-Rg', 'Reverse Curl EZ Bar', 'YouTube · YST Exercises') }
];

const NAME_ALIASES: Record<string, string> = {
  'supino inclinado smith': 'incline-machine-press',
  'chest press inclinado': 'incline-machine-press',
  'peck deck': 'pec-deck',
  'crucifixo inclinado com halter': 'incline-dumbbell-fly',
  'crucifixo inclinado com halteres': 'incline-dumbbell-fly',
  'desenvolvimento com barra': 'barbell-shoulder-press',
  'arnold press': 'arnold-press',
  'elevacao lateral no cabo': 'cable-lateral-raise',
  'elevacao lateral maquina': 'machine-lateral-raise',
  'triceps testa': 'skull-crusher',
  'mergulho maquina': 'machine-dip',
  'stiff com barra': 'barbell-stiff',
  'levantamento romeno com halter': 'dumbbell-romanian-deadlift',
  'levantamento romeno com halteres': 'dumbbell-romanian-deadlift',
  'flexora em pe': 'standing-leg-curl',
  'hip thrust maquina': 'machine-hip-thrust',
  'ponte de gluteos': 'glute-bridge',
  'panturrilha smith': 'smith-calf-raise',
  'panturrilha unilateral': 'single-leg-calf-raise',
  'panturrilha no leg press': 'leg-press-calf-raise',
  'barra fixa assistida': 'assisted-pull-up',
  'puxada alta': 'lat-pulldown',
  'barra fixa': 'pull-up',
  'remada unilateral com halter': 'one-arm-dumbbell-row',
  'remada unilateral com halteres': 'one-arm-dumbbell-row',
  'remada sentada': 'seated-row',
  'pullover maquina': 'machine-pullover',
  'rosca w': 'ez-bar-curl',
  'rosca no cabo': 'cable-curl',
  'rosca inversa': 'reverse-curl',
  'extensao de punho': 'reverse-wrist-curl',
  'flexao de punho': 'wrist-curl',
  "farmer's walk": 'farmers-walk',
  'farmers walk': 'farmers-walk',
  'reverse peck deck': 'rear-delt-fly',
  'face pull': 'face-pull',
  'desenvolvimento com halteres': 'dumbbell-shoulder-press',
  'supino inclinado com barra': 'incline-barbell-press',
  'supino inclinado com halteres': 'incline-dumbbell-press',
  'cadeira flexora': 'seated-leg-curl',
  'mesa flexora': 'lying-leg-curl',
  'flexora unilateral': 'single-leg-curl',
  'leg press': 'leg-press',
  'hack squat': 'hack-squat',
  'triceps frances com halter': 'dumbbell-overhead-extension',
  'rosca direta': 'barbell-curl',
  'rosca scott': 'preacher-curl',
  'rosca martelo': 'dumbbell-hammer-curl',
  'pullover no cabo': 'straight-arm-pulldown',
  'puxada articulada': 'machine-lat-pulldown',
  'remada com peito apoiado': 'chest-supported-row',
  'remada t': 't-bar-row',
};

export function getExerciseVideo(exercise: TitanExercise): CuratedExerciseVideo | null {
  if (exercise.video?.videoId) {
    return {
      provider: 'youtube',
      videoId: exercise.video.videoId,
      title: exercise.video.title ?? `Execução de ${exercise.name}`,
      source: exercise.video.channel ? `YouTube · ${exercise.video.channel}` : 'Vídeo da ficha'
    };
  }

  const catalogVideo = resolveFullLibraryVideo(exercise.name);
  if (catalogVideo) return catalogVideo;

  return CURATED_VIDEOS.find((entry) => entry.match.test(exercise.name))?.video ?? null;
}

function resolveFullLibraryVideo(name: string): CuratedExerciseVideo | null {
  const normalized = normalizeName(name);
  const aliasId = NAME_ALIASES[normalized];
  if (aliasId) {
    const video = TITAN_EXERCISE_VIDEO_REGISTRY[aliasId];
    if (video) return fromRegistry(video);
  }

  const exact = TITAN_FULL_EXERCISE_CATALOG.find((exercise) => normalizeName(exercise.name) === normalized);
  if (exact) {
    const video = TITAN_EXERCISE_VIDEO_REGISTRY[exact.id];
    if (video) return fromRegistry(video);
  }

  const queryTokens = meaningfulTokens(normalized);
  if (queryTokens.length < 2) return null;
  const candidates = TITAN_FULL_EXERCISE_CATALOG
    .map((exercise) => ({ exercise, score: tokenScore(queryTokens, meaningfulTokens(normalizeName(exercise.name))) }))
    .filter((item) => item.score >= 0.72 && TITAN_EXERCISE_VIDEO_REGISTRY[item.exercise.id])
    .sort((a, b) => b.score - a.score);
  return candidates[0] ? fromRegistry(TITAN_EXERCISE_VIDEO_REGISTRY[candidates[0].exercise.id]) : null;
}

function fromRegistry(video: (typeof TITAN_EXERCISE_VIDEO_REGISTRY)[string]): CuratedExerciseVideo {
  return { provider: video.provider, videoId: video.videoId, videoUrl: video.videoUrl, title: video.title, source: video.sourceName, attributionUrl: video.attributionUrl };
}

function youtube(videoId: string, title: string, source: string): CuratedExerciseVideo { return { provider: 'youtube', videoId, title, source }; }
function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function meaningfulTokens(value: string) {
  const stop = new Set(['com','de','da','do','das','dos','no','na','nos','nas','em','para','e','a','o']);
  return value.split(' ').filter((token) => token.length > 1 && !stop.has(token));
}
function tokenScore(query: string[], candidate: string[]) {
  if (!query.length || !candidate.length) return 0;
  const q = new Set(query); const c = new Set(candidate);
  const common = [...q].filter((token) => c.has(token)).length;
  return common / Math.max(q.size, c.size);
}
