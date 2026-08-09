import { useState } from 'react';
import type { TitanSubtitleTrack } from './subtitleLibrary';

export function TitanSubtitleGuide({ track }: { track: TitanSubtitleTrack }) {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const cue = track.cues[index];

  return <div className="titan-subtitle-guide" aria-label="Guia TITAN em português">
    <div className="titan-subtitle-toolbar">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? 'Ocultar guia PT-BR' : 'Mostrar guia PT-BR'}</button>
      <span>{track.label}</span>
    </div>
    {open && <div className="titan-subtitle-panel" aria-live="polite">
      <p>{cue.text}</p>
      <div className="titan-subtitle-nav">
        <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>‹ Anterior</button>
        <small>{index + 1}/{track.cues.length}</small>
        <button type="button" onClick={() => setIndex((value) => Math.min(track.cues.length - 1, value + 1))} disabled={index === track.cues.length - 1}>Próxima ›</button>
      </div>
    </div>}
  </div>;
}
