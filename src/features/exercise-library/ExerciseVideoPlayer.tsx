import { useState } from 'react';
import type { TitanCatalogExercise } from './catalog';
import { getCatalogExerciseVideo } from './videoLibrary';
import { ExerciseMotionVisual } from './ExerciseMotionVisual';

export function ExerciseVideoPlayer({ exercise }: { exercise: TitanCatalogExercise }) {
  const video = getCatalogExerciseVideo(exercise);
  const [failed, setFailed] = useState(false);

  if (!video || failed) {
    return <div className="exercise-video-fallback"><ExerciseMotionVisual exercise={exercise} /><div><strong>{video ? 'Vídeo indisponível' : 'Vídeo em preparação'}</strong><small>A ilustração TITAN continua disponível como referência visual.</small></div></div>;
  }

  if (video.provider === 'youtube' && video.videoId) {
    return <div className="exercise-video-block"><div className="exercise-video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&playsinline=1`} title={video.title} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onError={() => setFailed(true)} /></div><div className="exercise-video-meta"><strong>Vídeo demonstrativo</strong><small>{video.sourceName}</small><small className="exercise-video-rights">Conteúdo incorporado do provedor. O TITAN não hospeda nem reivindica autoria deste vídeo.</small></div></div>;
  }

  if (video.provider === 'vimeo' && video.videoId) {
    return <div className="exercise-video-block"><div className="exercise-video-frame"><iframe src={`https://player.vimeo.com/video/${video.videoId}?dnt=1&playsinline=1`} title={video.title} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen onError={() => setFailed(true)} /></div><div className="exercise-video-meta"><strong>Vídeo demonstrativo</strong><small>{video.sourceName}</small><small className="exercise-video-rights">Conteúdo incorporado do provedor. O TITAN não hospeda nem reivindica autoria deste vídeo.</small></div></div>;
  }

  if (video.provider === 'hosted' && video.videoUrl) {
    return <div className="exercise-video-block"><video className="exercise-video-hosted" src={video.videoUrl} poster={video.posterUrl} controls muted loop playsInline preload="metadata" onError={() => setFailed(true)} /><div className="exercise-video-meta"><strong>Vídeo demonstrativo</strong><small>{video.author ?? video.sourceName}</small>{video.licenseName && <small className="exercise-video-rights">Licença: {video.licenseName}</small>}</div></div>;
  }

  return <ExerciseMotionVisual exercise={exercise} />;
}
