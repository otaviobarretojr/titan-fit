import type { TitanExercise } from '../plan/types';
import { TITAN_FULL_EXERCISE_CATALOG } from './library';
import { TITAN_EXERCISE_VIDEO_REGISTRY } from './videoLibrary';
import type { ExerciseVideoProvider } from './videoRegistry';

export type CuratedExerciseVideo = {
  provider: ExerciseVideoProvider;
  videoId?: string;
  videoUrl?: string;
  embedUrl: string;
  title: string;
  source: string;
};

type LegacyYoutubeVideo = {
  videoId: string;
  title: string;
  source: string;
};

const CURATED_VIDEOS: Array<{ match: RegExp; video: LegacyYoutubeVideo }> = [
  { match: /supino inclinado.*barra/i, video: { videoId: 'GhfwvlZbLGM', title: 'Supino Inclinado com Barra — execução', source: 'YouTube · MyTrainingPRO' } },
  { match: /supino inclinado.*halter/i, video: { videoId: '7V6kFe82iKk', title: 'Supino Inclinado com Halteres — execução', source: 'YouTube · MyTrainingPRO' } },
  { match: /chest press convergente/i, video: { videoId: 'pnmUJSzBvXM', title: 'Chest Press Convergente — execução', source: 'YouTube · Vinicius Piffardini' } },
  { match: /crucifixo.*polia baixa/i, video: { videoId: 'QUcXXwxa6hE', title: 'Crucifixo na Polia Baixa — execução', source: 'YouTube · Miqueias Alves Personal' } },
  { match: /eleva[cç][aã]o lateral unilateral na polia/i, video: { videoId: 'GMuw8OAelS4', title: 'Elevação Lateral Unilateral na Polia', source: 'YouTube · Artagnan Consultoria Online' } },
  { match: /tr[ií]ceps.*corda/i, video: { videoId: '4weS5P02X9k', title: 'Tríceps na Corda — execução', source: 'YouTube · Gean Vernes' } },
  { match: /tr[ií]ceps.*acima.*cabe[cç]a/i, video: { videoId: 'osFW51jFGgU', title: 'Overhead Rope Triceps Extension', source: 'YouTube · T Nation' } },
  { match: /barra fixa.*neutra/i, video: { videoId: 'hp2ufLBH4VU', title: 'Barra Fixa com Pegada Neutra', source: 'YouTube · Jauan Treinos' } },
  { match: /puxada unilateral/i, video: { videoId: 't0yzt3Ba8kY', title: 'Puxada Unilateral na Polia Alta', source: 'YouTube · Prof. Matheus Gomes' } },
  { match: /remada articulada.*peito|remada.*peito apoiado/i, video: { videoId: 'wDoIGNbiny0', title: 'Chest Supported Machine Row', source: 'YouTube · Gaintrust Bodybuilding' } },
  { match: /pulldown.*bra[cç]os estendidos/i, video: { videoId: 'WDOV2PDpkiU', title: 'Straight Arm Pulldown — execução', source: 'YouTube · Colossus Fitness' } },
  { match: /rosca scott.*m[aá]quina/i, video: { videoId: 'AR-oARBkYxI', title: 'Machine Preacher Curl — execução', source: 'YouTube · Colossus Fitness' } },
  { match: /rosca martelo.*corda/i, video: { videoId: '1Quc_tOv97I', title: 'Rope Hammer Curl — execução', source: 'YouTube · ScottHermanFitness' } },
  { match: /rosca punho inversa/i, video: { videoId: 'SngocRgAkvY', title: 'Reverse Wrist Curl — execução', source: 'YouTube · AthleticMuscle' } },
  { match: /hack squat/i, video: { videoId: 'weyTbC-AjRg', title: 'Hack Squat — execução e erros', source: 'YouTube · FISIculturismo.com.br' } },
  { match: /leg press 45/i, video: { videoId: 'SV3-hWw50_A', title: 'Leg Press 45° — execução', source: 'YouTube · Training Fit' } },
  { match: /afundo.*smith/i, video: { videoId: 'vV_o81dSZoc', title: 'Smith Machine Lunge Tutorial', source: 'YouTube · DUNAMISXP' } },
  { match: /cadeira extensora/i, video: { videoId: 'y6juG3XuRe4', title: 'Cadeira Extensora — execução', source: 'YouTube · Tay Training' } },
  { match: /mesa flexora/i, video: { videoId: 'vl5nUdE9mWM', title: 'Lying Leg Curl — técnica e erros', source: 'YouTube · Physique Development' } },
  { match: /panturrilha.*em p[eé].*smith/i, video: { videoId: 'jZynHLSRxys', title: 'Panturrilha em Pé no Smith', source: 'YouTube · Adilson Silva' } },
  { match: /panturrilha.*sentad/i, video: { videoId: 'y2ueC0LggrI', title: 'Seated Calf Raise Tutorial', source: 'YouTube · AMOFitnessTraining' } },
  { match: /desenvolvimento.*m[aá]quina/i, video: { videoId: 'WvLMauqrnK8', title: 'Machine Shoulder Press', source: 'YouTube · Renaissance Periodization' } },
  { match: /eleva[cç][aã]o lateral.*polia.*atr[aá]s/i, video: { videoId: 'j-tCEMmnqfk', title: 'Cable Lateral Raise Behind the Body', source: 'YouTube · TylerPath' } },
  { match: /eleva[cç][aã]o lateral.*m[aá]quina/i, video: { videoId: 'LLZ0k0doyJs', title: 'Elevação Lateral — execução', source: 'YouTube · Cezar Bononi' } },
  { match: /crucifixo inverso.*m[aá]quina/i, video: { videoId: 'Q8DqRXPJk7g', title: 'Reverse Pec Deck — execução', source: 'YouTube · Cutler Nutrition' } },
  { match: /face pull/i, video: { videoId: 'ljgqer1ZpXg', title: 'Face Pull — execução correta', source: 'YouTube · ATHLEAN-X' } },
  { match: /rosca inclinada/i, video: { videoId: 'PAnypqTfEuU', title: 'Incline Dumbbell Curl — execução', source: 'YouTube · Colossus Fitness' } },
  { match: /tr[ií]ceps unilateral/i, video: { videoId: 'BnQ2rqS2K18', title: 'Single Arm Cable Triceps Extension', source: 'YouTube · Blueprint Fitness' } },
  { match: /farmer'?s walk|farmer.*walk|farmer.*carry/i, video: { videoId: 'vi4X2iSOyiA', title: "Farmer's Carry — técnica", source: 'YouTube · Rogue Fitness' } },
  { match: /cadeira flexora/i, video: { videoId: 'Zss6E3VU6X0', title: 'Como fazer cadeira flexora', source: 'YouTube · Leandro Twin' } },
  { match: /rdl.*smith|romeno.*smith/i, video: { videoId: 'Ghc9V73wTyQ', title: 'Smith Machine Romanian Deadlift', source: 'YouTube · Team Evolve' } },
  { match: /hip thrust.*m[aá]quina/i, video: { videoId: 'tztHvSLdXLA', title: 'Machine Hip Thrust — execução', source: 'YouTube · Colossus Fitness' } },
  { match: /flexora unilateral/i, video: { videoId: 'J88VHzTDPyQ', title: 'Single-Leg Curl Machine — execução', source: 'YouTube · Miqueias Alves Personal' } },
  { match: /ab wheel/i, video: { videoId: 'nCh8VfWY5_g', title: 'Ab Wheel Rollout — execução e erros', source: 'YouTube · Redefining Strength' } },
  { match: /pallof press/i, video: { videoId: '_2xWmYNnFS8', title: 'Pallof Press — execução correta', source: 'YouTube · Colossus Fitness' } },
  { match: /extens[aã]o de quadril.*45/i, video: { videoId: 'IJ2Cw-qV25s', title: '45 Degree Back Extension Tutorial', source: 'YouTube · Luke Johnson' } },
  { match: /panturrilha.*leg press/i, video: { videoId: '8k435cj30gc', title: 'Leg Press Calf Raise', source: 'YouTube · NASM' } },
  { match: /tibial|ponta dos p[eé]s.*tibial/i, video: { videoId: 'gNS_QjGAs_k', title: 'Tibialis Raise', source: 'YouTube · The Kneesovertoesguy' } },
  { match: /remada baixa.*neutra/i, video: { videoId: 'qqZHnqzvbXs', title: 'Seated Cable Row — Neutral Grip', source: 'YouTube · Functional AF' } },
  { match: /remada unilateral.*m[aá]quina/i, video: { videoId: 'veciiO2SU2c', title: 'Single Arm Machine Row', source: 'YouTube · Kiki Cunningham' } },
  { match: /puxada.*aberta/i, video: { videoId: 'VM4IQ4-km14', title: 'Wide-Grip Lat Pulldown Tutorial', source: 'YouTube · Marzrodie' } },
  { match: /supino inclinado.*m[aá]quina/i, video: { videoId: '5OayotgIe9M', title: 'Supino Inclinado na Máquina', source: 'YouTube · Pedro Lonngren' } },
  { match: /crucifixo inclinado/i, video: { videoId: 'DBHJKvY8mX0', title: 'Incline Cable Fly', source: 'YouTube · Exercises.com.au' } },
  { match: /encolhimento.*m[aá]quina/i, video: { videoId: 'fChAG371a-s', title: 'Machine Shrug Exercise', source: 'YouTube · MrSupplement.com.au' } },
  { match: /rosca inversa.*ez|rosca inversa.*barra/i, video: { videoId: 'f7FOpwcB-Rg', title: 'Reverse Curl EZ Bar', source: 'YouTube · YST Exercises' } },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function youtubeVideo(videoId: string, title: string, source: string): CuratedExerciseVideo {
  return {
    provider: 'youtube',
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
    title,
    source,
  };
}

function registeredVideo(exercise: TitanExercise): CuratedExerciseVideo | null {
  const direct = TITAN_EXERCISE_VIDEO_REGISTRY[exercise.id];
  const catalogMatch = direct
    ? null
    : TITAN_FULL_EXERCISE_CATALOG.find((item) => normalize(item.name) === normalize(exercise.name));
  const metadata = direct ?? (catalogMatch ? TITAN_EXERCISE_VIDEO_REGISTRY[catalogMatch.id] : undefined);
  if (!metadata) return null;

  if (metadata.provider === 'youtube' && metadata.videoId) {
    return youtubeVideo(metadata.videoId, metadata.title, metadata.sourceName);
  }

  if (metadata.provider === 'vimeo' && metadata.videoId) {
    return {
      provider: 'vimeo',
      videoId: metadata.videoId,
      embedUrl: `https://player.vimeo.com/video/${metadata.videoId}`,
      title: metadata.title,
      source: metadata.sourceName,
    };
  }

  if (metadata.provider === 'hosted' && metadata.videoUrl) {
    return {
      provider: 'hosted',
      videoUrl: metadata.videoUrl,
      embedUrl: metadata.videoUrl,
      title: metadata.title,
      source: metadata.sourceName,
    };
  }

  return null;
}

export function getExerciseVideo(exercise: TitanExercise): CuratedExerciseVideo | null {
  if (exercise.video?.videoId) {
    return youtubeVideo(
      exercise.video.videoId,
      exercise.video.title ?? `Execução de ${exercise.name}`,
      exercise.video.channel ? `YouTube · ${exercise.video.channel}` : 'Vídeo da ficha',
    );
  }

  const central = registeredVideo(exercise);
  if (central) return central;

  const legacy = CURATED_VIDEOS.find((entry) => entry.match.test(exercise.name))?.video;
  return legacy ? youtubeVideo(legacy.videoId, legacy.title, legacy.source) : null;
}
