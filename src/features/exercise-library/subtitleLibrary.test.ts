import { describe, expect, it } from 'vitest';
import { TITAN_SUBTITLE_LIBRARY, getTitanSubtitleTrack } from './subtitleLibrary';

describe('Legendas TITAN PT-BR', () => {
  it('mantém trilhas em português válidas', () => {
    const tracks = Object.values(TITAN_SUBTITLE_LIBRARY);
    expect(tracks.length).toBeGreaterThanOrEqual(5);
    for (const item of tracks) {
      expect(item.language).toBe('pt-BR');
      expect(item.cues.length).toBeGreaterThan(0);
      for (const cue of item.cues) {
        expect(cue.start).toBeGreaterThanOrEqual(0);
        expect(cue.end).toBeGreaterThan(cue.start);
        expect(cue.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('encontra trilha pelo ID do exercício', () => {
    expect(getTitanSubtitleTrack('barbell-bench-press')?.language).toBe('pt-BR');
    expect(getTitanSubtitleTrack('exercise-without-track')).toBeNull();
  });
});
