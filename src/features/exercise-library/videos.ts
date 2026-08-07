import type { TitanExercise } from '../plan/types';

export type CuratedExerciseVideo = {
  videoId: string;
  title: string;
  source: string;
};

const CURATED_VIDEOS: Array<{ match: RegExp; video: CuratedExerciseVideo }> = [
  {
    match: /cadeira flexora/i,
    video: {
      videoId: 'Zss6E3VU6X0',
      title: 'Como fazer cadeira flexora',
      source: 'YouTube · Leandro Twin'
    }
  }
];

export function getExerciseVideo(exercise: TitanExercise): CuratedExerciseVideo | null {
  if (exercise.video?.videoId) {
    return {
      videoId: exercise.video.videoId,
      title: exercise.video.title ?? `Execução de ${exercise.name}`,
      source: 'Vídeo da ficha'
    };
  }

  return CURATED_VIDEOS.find((entry) => entry.match.test(exercise.name))?.video ?? null;
}
