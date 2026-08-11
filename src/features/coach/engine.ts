import { buildCardioEvolution } from '../cardio/evolution';
import { analyzeMuscleTrends } from '../history/trends';
import type { WorkoutHistoryRecord } from '../history/types';
import type { CoachContext, CoachInsight, CoachReport } from './types';

const DAY = 86_400_000;

function daysSince(date: string, now: Date) { return Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / DAY)); }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function isTrainingSession(record: WorkoutHistoryRecord) {
  if (!record.exercises.length) return true;
  return record.exercises.some((exercise) => exercise.exerciseType !== 'cardio' && exercise.exerciseType !== 'distance');
}

export function createCoachReport(workouts: WorkoutHistoryRecord[], now = new Date()): CoachReport {
  return createUnifiedCoachReport({ workouts }, now);
}

export function createUnifiedCoachReport(context: CoachContext, now = new Date()): CoachReport {
  const { workouts, healthSamples = [], bodyEntries = [] } = context;
  const trainingWorkouts = workouts.filter(isTrainingSession);
  const recentWorkouts = trainingWorkouts.filter((item) => daysSince(item.completedAt, now) <= 7);
  const trainingScore = clamp((recentWorkouts.length / 4) * 100);
  const insights: CoachInsight[] = [];

  if (!trainingWorkouts.length) insights.push({ id: 'no-training-data', pillar: 'training', severity: 'neutral', title: 'Treino ainda sem histórico', message: 'Conclua treinos de musculação para o Coach identificar consistência, progressão e fadiga.' });
  else if (recentWorkouts.length >= 4) insights.push({ id: 'training-consistency', pillar: 'training', severity: 'positive', title: 'Boa consistência de treino', message: `Você concluiu ${recentWorkouts.length} treinos nos últimos 7 dias.` });
  else insights.push({ id: 'training-low', pillar: 'training', severity: 'attention', title: 'Frequência abaixo da referência', message: `Foram ${recentWorkouts.length} treinos nos últimos 7 dias. A referência atual do Coach é 4 sessões semanais.` });

  const latestWorkout = trainingWorkouts[0];
  if (latestWorkout) {
    const previousSame = trainingWorkouts.find((item) => item.id !== latestWorkout.id && item.workoutId === latestWorkout.workoutId);
    if (previousSame && previousSame.totalVolumeKg > 0) {
      const change = ((latestWorkout.totalVolumeKg - previousSame.totalVolumeKg) / previousSame.totalVolumeKg) * 100;
      if (change >= 5) insights.push({ id: 'volume-up', pillar: 'training', severity: 'positive', title: 'Volume de treino aumentou', message: `${latestWorkout.workoutTitle} teve aumento de ${Math.round(change)}% em relação à execução anterior.` });
      if (change <= -10) insights.push({ id: 'volume-down', pillar: 'training', severity: 'attention', title: 'Queda relevante de volume', message: `${latestWorkout.workoutTitle} caiu ${Math.abs(Math.round(change))}% em relação à execução anterior. Verifique recuperação, carga e técnica.` });
    }
  }

  for (const trend of analyzeMuscleTrends(trainingWorkouts)) {
    if (trend.status === 'fatigued') insights.push({ id: `muscle-fatigue:${trend.muscleGroup}`, pillar: 'training', severity: 'attention', title: `Fadiga acumulada · ${trend.muscleGroup}`, message: trend.message });
    else if (trend.status === 'stalled') insights.push({ id: `muscle-stalled:${trend.muscleGroup}`, pillar: 'training', severity: 'attention', title: `Desempenho em queda · ${trend.muscleGroup}`, message: trend.message });
    else if (trend.status === 'progressing') insights.push({ id: `muscle-progress:${trend.muscleGroup}`, pillar: 'training', severity: 'positive', title: `Progressão · ${trend.muscleGroup}`, message: trend.message });
  }

  const cardio = buildCardioEvolution(workouts, 7, now);
  if (cardio.sessions > 0) {
    const distance = cardio.totalDistanceMeters >= 1000 ? `${(cardio.totalDistanceMeters / 1000).toFixed(1)} km` : `${Math.round(cardio.totalDistanceMeters)} m`;
    const heartRate = cardio.averageHeartRate ? ` · FC média ${cardio.averageHeartRate} bpm` : '';
    insights.push({ id: 'integrated-cardio', pillar: 'training', severity: 'neutral', title: 'Cardio integrado acompanhado', message: `${cardio.sessions} treino${cardio.sessions === 1 ? '' : 's'} com cardio nos últimos 7 dias · ${distance} · ${Math.round(cardio.totalDurationSeconds / 60)} min${heartRate}.` });
  }

  const recovery = analyzeRecovery(healthSamples, now);
  if (recovery.insight) insights.push(recovery.insight);
  const evolution = analyzeEvolution(bodyEntries, now);
  if (evolution.insight) insights.push(evolution.insight);

  const availableScores = [
    ...(trainingWorkouts.length ? [trainingScore] : []),
    recovery.score,
    evolution.score,
  ].filter((value): value is number => value !== null);
  const availablePillars = availableScores.length;
  const total = clamp(average(availableScores));
  const confidencePoints = Math.min(2, trainingWorkouts.length / 4) + (recovery.score !== null ? 1 : 0) + (evolution.score !== null ? 1 : 0);
  const dataConfidence = confidencePoints >= 3 ? 'high' : confidencePoints >= 2 ? 'medium' : 'low';

  const pillarScores = {
    training: trainingWorkouts.length ? trainingScore : null,
    recovery: recovery.score,
    evolution: evolution.score,
  };
  const attentionByLowestScore = insights
    .filter((item) => item.severity === 'attention')
    .sort((a, b) => (pillarScores[a.pillar ?? 'training'] ?? 101) - (pillarScores[b.pillar ?? 'training'] ?? 101))[0];

  const priority = insights.find((item) => item.id.startsWith('muscle-fatigue:'))
    ?? attentionByLowestScore
    ?? insights.find((item) => item.severity === 'positive')
    ?? { id: 'priority-start', severity: 'neutral' as const, title: 'Continue registrando', message: 'O Coach melhora conforme treino, saúde, recuperação e evolução acumulam dados.' };

  return {
    score: { total, training: trainingScore, recovery: recovery.score, evolution: evolution.score, dataConfidence },
    priority,
    insights,
    availablePillars,
    generatedAt: now.toISOString(),
  };
}

function analyzeRecovery(samples: NonNullable<CoachContext['healthSamples']>, now: Date) {
  const sleep = samples.filter((sample) => sample.type === 'sleep' && daysSince(sample.startedAt, now) <= 6).map((sample) => sleepHours(sample.value, sample.unit)).filter((value) => value > 0 && value <= 24);
  if (!sleep.length) return { score: null, insight: { id: 'recovery-data-missing', pillar: 'recovery', severity: 'neutral', title: 'Recuperação sem dados suficientes', message: 'Sincronize dados de sono para o Coach incluir recuperação na análise.' } satisfies CoachInsight };
  const avg = average(sleep);
  const score = clamp((avg / 8) * 100);
  const insight: CoachInsight = avg >= 7
    ? { id: 'sleep-on-track', pillar: 'recovery', severity: 'positive', title: 'Sono favorecendo recuperação', message: `Média recente de ${avg.toFixed(1)} h de sono nos registros disponíveis.` }
    : { id: 'sleep-review', pillar: 'recovery', severity: 'attention', title: 'Recuperação merece atenção', message: `Média recente de ${avg.toFixed(1)} h de sono. Considere a recuperação antes de forçar progressões.` };
  return { score, insight };
}

function analyzeEvolution(entries: NonNullable<CoachContext['bodyEntries']>, now: Date) {
  const recent = entries.filter((entry) => daysSince(entry.recordedAt, now) <= 30);
  if (!recent.length) return { score: null, insight: { id: 'evolution-data-missing', pillar: 'evolution', severity: 'neutral', title: 'Evolução sem registro recente', message: 'Um registro corporal recente melhora a leitura de tendência do Coach.' } satisfies CoachInsight };
  const score = clamp(Math.min(1, recent.length / 4) * 100);
  return { score, insight: { id: 'evolution-tracked', pillar: 'evolution', severity: 'positive', title: 'Evolução acompanhada', message: `${recent.length} registro${recent.length === 1 ? '' : 's'} corporal${recent.length === 1 ? '' : 'is'} nos últimos 30 dias.` } satisfies CoachInsight };
}

function sleepHours(value: number, unit: string) {
  const normalized = unit.toLowerCase();
  if (normalized.includes('min')) return value / 60;
  if (normalized.includes('sec') || normalized === 's') return value / 3600;
  if (normalized.includes('ms')) return value / 3_600_000;
  return value;
}
