import type { ExerciseVideoMetadata } from './videoRegistry';

const vimeo = (exerciseId: string, videoId: string, title: string, author: string): ExerciseVideoMetadata => ({
  exerciseId,
  provider: 'vimeo',
  videoId,
  title,
  sourceName: `Vimeo · ${author}`,
  author,
  licenseStatus: 'embedded-reference',
  attributionUrl: `https://vimeo.com/${videoId}`,
});

const youtube = (exerciseId: string, videoId: string, title: string, author: string): ExerciseVideoMetadata => ({
  exerciseId,
  provider: 'youtube',
  videoId,
  title,
  sourceName: `YouTube · ${author}`,
  author,
  licenseStatus: 'embedded-reference',
  attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
});

export const RESIDUAL_EXERCISE_VIDEO_FINAL_BATCH: Record<string, ExerciseVideoMetadata> = {
  'cable-crunch': vimeo('cable-crunch', '536996836', 'Crunch no cabo — execução', 'angela ellefson'),
  'cable-pushdown': youtube('cable-pushdown', 'FRuTxfkr6Tg', 'Tríceps na polia com barra V — execução', 'FITTR'),
  'decline-machine-press': vimeo('decline-machine-press', '435238776', 'Supino declinado máquina — execução', 'POTD TRAINING'),
  'donkey-calf-raise': vimeo('donkey-calf-raise', '1138126290', 'Panturrilha donkey — execução', 'GymNation'),
  'hip-abduction-machine': vimeo('hip-abduction-machine', '1100439134', 'Cadeira abdutora — execução', 'Julie Harvey'),
  'parallel-dip': vimeo('parallel-dip', '1017955675', 'Paralelas com foco em tríceps — execução', 'plataforma a24'),
  'reverse-lunge': vimeo('reverse-lunge', '34542852', 'Afundo reverso — execução', 'Steve Becker'),
  'smith-squat': vimeo('smith-squat', '84100138', 'Agachamento Smith — execução', 'Assisi HPE'),
  'trap-bar-deadlift': vimeo('trap-bar-deadlift', '547595375', 'Levantamento terra trap bar — execução', 'Strive & Uplift'),
  'underhand-lat-pulldown': vimeo('underhand-lat-pulldown', '1098112218', 'Puxada supinada — execução', 'Julie Harvey'),
  'wrist-curl': vimeo('wrist-curl', '644585291', 'Flexão de punho — execução', 'Strive & Uplift'),
};
