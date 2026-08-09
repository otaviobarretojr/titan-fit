import { useState } from 'react';
import type { TitanCatalogExercise } from './catalog';
import { getCatalogExerciseVideo } from './videoLibrary';
import { ExerciseMotionVisual } from './ExerciseMotionVisual';

function SourceLink({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return <a className="exercise-video-source" href={href} target="_blank" rel="noreferrer noopener" aria-label={`Abrir vídeo de ${label} no provedor`}>Abrir no provedor ↗</a>;
}

export function ExerciseVideoPlayer({ exercise }: { exercise: TitanCatalogExercise }) {
  const video = getCatalogExerciseVideo(exercise);
  const [failed, setFailed] = useState(false);

  if (!video || failed) {
    return <div className="exercise-video-fallback"><ExerciseMotionVisual exercise={exercise} /><div><strong>{video ? 'Vídeo indisponível' : 'Vídeo em preparação'}</strong><small>A ilustração TITAN continua disponível como referência visual.</small>{video && <SourceLink href={video.attributionUrl} label={video.sourceName} />}</div></div>;
  }

  if (video.provider === 'youtube' && video.videoId) {
    return <div className="exercise-video-block"><div className="exercise-video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&playsinline=1`} title={`${exercise.name} — ${video.title}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen onError={() => setFailed(true)} /></div><div className="exercise-video-meta"><div><strong>Vídeo demonstrativo</strong><small>{video.sourceName}</small></div><SourceLink href={video.attributionUrl} label={video.sourceName} /><small className="exercise-video-rights">Conteúdo incorporado do provedor. O TITAN não hospeda nem reivindica autoria deste vídeo.</small></div></div>;
  }

  if (video.provider === 'vimeo' && video.videoId) {
    return <div className="exercise-video-block"><div className="exercise-video-frame"><iframe src={`https://player.vimeo.com/video/${video.videoId}?dnt=1&playsinline=1`} title={`${exercise.name} — ${video.title}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen onError={() => setFailed(true)} /></div><div className="exercise-video-meta"><div><strong>Vídeo demonstrativo</strong><small>{video.sourceName}</small></div><SourceLink href={video.attributionUrl} label={video.sourceName} /><small className="exercise-video-rights">Conteúdo incorporado do provedor. O TITAN não hospeda nem reivindica autoria deste vídeo.</small></div></div>;
  }

  if (video.provider === 'hosted' && video.videoUrl) {
    return <div className="exercise-video-block"><video className="exercise-video-hosted" src={video.videoUrl} poster={video.posterUrl} controls muted loop playsInline preload="metadata" onError={() => setFailed(true)} aria-label={`Vídeo demonstrativo de ${exercise.name}`} /><div className="exercise-video-meta"><div><strong>Vídeo demonstrativo</strong><small>{video.author ?? video.sourceName}</small></div><SourceLink href={video.attributionUrl} label={video.sourceName} />{video.licenseName && <small className="exercise-video-rights">Licença: {video.licenseName}</small>}</div></div>;
  }

  return <ExerciseMotionVisual exercise={exercise} />;
}
