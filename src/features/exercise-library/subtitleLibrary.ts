export type TitanSubtitleCue = {
  start: number;
  end: number;
  text: string;
};

export type TitanSubtitleTrack = {
  exerciseId: string;
  language: 'pt-BR';
  label: string;
  source: 'titan-curated';
  cues: TitanSubtitleCue[];
};

const track = (exerciseId: string, cues: TitanSubtitleCue[]): TitanSubtitleTrack => ({
  exerciseId,
  language: 'pt-BR',
  label: 'Português (TITAN)',
  source: 'titan-curated',
  cues,
});

export const TITAN_SUBTITLE_LIBRARY: Record<string, TitanSubtitleTrack> = {
  'barbell-bench-press': track('barbell-bench-press', [
    { start: 0, end: 5, text: 'Posicione os pés firmes no chão e mantenha as escápulas retraídas.' },
    { start: 5, end: 11, text: 'Desça a barra com controle em direção ao meio do peito.' },
    { start: 11, end: 18, text: 'Empurre mantendo punhos neutros e cotovelos sob controle.' },
  ]),
  'barbell-squat': track('barbell-squat', [
    { start: 0, end: 6, text: 'Ajuste a barra, firme o tronco e mantenha os pés estáveis.' },
    { start: 6, end: 13, text: 'Desça com joelhos acompanhando a linha dos pés e coluna neutra.' },
    { start: 13, end: 20, text: 'Suba pressionando o chão e mantendo o tronco rígido.' },
  ]),
  'lat-pulldown': track('lat-pulldown', [
    { start: 0, end: 6, text: 'Estabilize o tronco e inicie o movimento deprimindo as escápulas.' },
    { start: 6, end: 13, text: 'Puxe a barra em direção à parte superior do peito sem embalar o corpo.' },
    { start: 13, end: 20, text: 'Retorne devagar até alongar os dorsais, sem perder o controle.' },
  ]),
  'dumbbell-row': track('dumbbell-row', [
    { start: 0, end: 6, text: 'Mantenha a coluna neutra e o tronco estável.' },
    { start: 6, end: 13, text: 'Puxe o halter em direção ao quadril, guiando com o cotovelo.' },
    { start: 13, end: 20, text: 'Desça com controle e permita o alongamento da dorsal.' },
  ]),
  'barbell-overhead-press': track('barbell-overhead-press', [
    { start: 0, end: 6, text: 'Contraia abdômen e glúteos antes de iniciar a pressão.' },
    { start: 6, end: 13, text: 'Empurre a barra acima da cabeça sem hiperestender a lombar.' },
    { start: 13, end: 20, text: 'Retorne com controle até a posição inicial.' },
  ]),
};

export function getTitanSubtitleTrack(exerciseId: string): TitanSubtitleTrack | null {
  return TITAN_SUBTITLE_LIBRARY[exerciseId] ?? null;
}
