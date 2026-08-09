import { useState } from 'react';
import type { TitanCatalogExercise } from './catalog';
import { getCatalogExerciseVideo } from './videoLibrary';
import { getTitanSubtitleTrack } from './subtitleLibrary';
import { TitanSubtitleGuide } from './TitanSubtitleGuide';
import { ExerciseMotionVisual } from './ExerciseMotionVisual';

function SourceLink({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return <a className="exercise-video-source" href={href} target="_blank" rel="noreferrer noopener" aria-label={`Abrir vídeo de ${label} no provedor`}>Abrir no provedor ↗</a>;
}

function PortugueseModeNotice({ hasTitanTrack }: { hasTitanTrack: boolean }) {
  return <small className="exercise-video-language">{hasTitanTrack ? 'Guia TITAN PT-BR disponível' : 'PT-BR preferido · legendas ativadas quando disponíveis'}</small>;
}

export function ExerciseVideoPlayer({ exercise }: { exercise: TitanCatalogExercise }) {
  const video = getCatalogExerciseVideo(exercise);
  const subtitleTrack = getTitanSubtitleTrack(exercise.id);
  const [failed, setFailed] = useState(false);

  if (!video || failed) {
    return <div className="exercise-video-fallback"><ExerciseMotionVisual exercise={exercise} /><div><strong>{video ? 'Vídeo indisponível' : 'Vídeo em preparação'}</strong><small>A ilustração TITAN continua disponível como referência visual.</small>{video && <SourceLink href={video.attributionUrl} label={video.sourceName} />}</div></div>;
  }

  const guide = subtitleTrack ? <TitanSubtitleGuide track={subtitleTrack} /> : null;

  if (video.provider === 'youtube' && video.videoId) {
    return <div className="exercise-video-block"><div className="exercise-video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&playsinline=1&hl=pt-BR&cc_lang_pref=pt&cc_load_policy=1`} title={`${exercise.name} — ${video.title}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen onError={() => setFailed(true)} /></div>{guide}<div className="exercise-video-meta"><div><strong>Vídeo demonstrativo</strong><small>{video.sourceName}</small><PortugueseModeNotice hasTitanTrack={Boolean(subtitleTrack)} /></div><SourceLink href={video.attributionUrl} label={video.sourceName} /><small className="exercise-video-rights">O TITAN prioriza português no provedor e pode oferecer um guia PT-BR próprio, independente do áudio original.</small></div></div>;
  }

  if (video.provider === 'vimeo' && video.videoId) {
    return <div className="exercise-video-block"><div className="exercise-video-frame"><iframe src={`https://player.vimeo.com/video/${video.videoId}?dnt=1&playsinline=1&texttrack=pt`} title={`${exercise.name} — ${video.title}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen onError={() => setFailed(true)} /></div>{guide}<div className="exercise-video-meta"><div><strong>Vídeo demonstrativo</strong><small>{video.sourceName}</small><PortugueseModeNotice hasTitanTrack={Boolean(subtitleTrack)} /></div><SourceLink href={video.attributionUrl} label={video.sourceName} /><small className="exercise-video-rights">O TITAN prioriza português no provedor e pode oferecer um guia PT-BR próprio, independente do áudio original.</small></div></div>;
  }

  if (video.provider === 'hosted' && video.videoUrl) {
    return <div className="exercise-video-block"><video className="exercise-video-hosted" src={video.videoUrl} poster={video.posterUrl} controls muted loop playsInline preload="metadata" onError={() => setFailed(true)} aria-label={`Vídeo demonstrativo de ${exercise.name}`} />{guide}<div className="exercise-video-meta"><div><strong>Vídeo demonstrativo</strong><small>{video.author ?? video.sourceName}</small><PortugueseModeNotice hasTitanTrack={Boolean(subtitleTrack)} /></div><SourceLink href={video.attributionUrl} label={video.sourceName} />{video.licenseName && <small className="exercise-video-rights">Licença: {video.licenseName}</small>}</div></div>;
  }

  return <ExerciseMotionVisual exercise={exercise} />;
}
