import { analyzeMuscleTrends } from '../history/trends';
import type { WorkoutHistoryRecord } from '../history/types';
import type { CoachInsight, CoachReport } from './types';

const DAY = 86_400_000;

function daysSince(date: string, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / DAY));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createCoachReport(workouts: WorkoutHistoryRecord[], now = new Date()): CoachReport {
  const recentWorkouts = workouts.filter((item) => daysSince(item.completedAt, now) <= 7);
  const trainingScore = clamp((recentWorkouts.length / 4) * 100);
  const insights: CoachInsight[] = [];

  if (!workouts.length) {
    insights.push({ id: 'no-data', severity: 'neutral', title: 'Ainda faltam registros', message: 'Conclua um treino para o Coach começar a identificar tendências.' });
  }

  if (recentWorkouts.length >= 4) {
    insights.push({ id: 'training-consistency', severity: 'positive', title: 'Boa consistência de treino', message: `Você concluiu ${recentWorkouts.length} treinos nos últimos 7 dias.` });
  } else if (workouts.length) {
    insights.push({ id: 'training-low', severity: 'attention', title: 'Frequência abaixo da referência', message: `Foram ${recentWorkouts.length} treinos nos últimos 7 dias. A referência atual do Coach é 4 sessões semanais.` });
  }

  const latestWorkout = workouts[0];
  if (latestWorkout) {
    const previousSame = workouts.find((item) => item.id !== latestWorkout.id && item.workoutId === latestWorkout.workoutId);
    if (previousSame && previousSame.totalVolumeKg > 0) {
      const change = ((latestWorkout.totalVolumeKg - previousSame.totalVolumeKg) / previousSame.totalVolumeKg) * 100;
      if (change >= 5) insights.push({ id: 'volume-up', severity: 'positive', title: 'Volume de treino aumentou', message: `${latestWorkout.workoutTitle} teve aumento de ${Math.round(change)}% em relação à execução anterior.` });
      if (change <= -10) insights.push({ id: 'volume-down', severity: 'attention', title: 'Queda relevante de volume', message: `${latestWorkout.workoutTitle} caiu ${Math.abs(Math.round(change))}% em relação à execução anterior. Verifique recuperação, carga e técnica.` });
    }
  }

  for (const trend of analyzeMuscleTrends(workouts)) {
    if (trend.status === 'fatigued') {
      insights.push({
        id: `muscle-fatigue:${trend.muscleGroup}`,
        severity: 'attention',
        title: `Fadiga acumulada · ${trend.muscleGroup}`,
        message: `${trend.message} ${trend.recommendation === 'consider-deload' ? 'Há dados suficientes para considerar uma semana mais leve antes de retomar a progressão.' : ''}`.trim(),
      });
      continue;
    }
    if (trend.status === 'stalled') {
      insights.push({ id: `muscle-stalled:${trend.muscleGroup}`, severity: 'attention', title: `Desempenho em queda · ${trend.muscleGroup}`, message: trend.message });
      continue;
    }
    if (trend.status === 'progressing') {
      insights.push({ id: `muscle-progress:${trend.muscleGroup}`, severity: 'positive', title: `Progressão · ${trend.muscleGroup}`, message: trend.message });
      continue;
    }
    if (trend.recommendation === 'consider-volume-increase') {
      insights.push({ id: `muscle-volume-opportunity:${trend.muscleGroup}`, severity: 'neutral', title: `Margem de estímulo · ${trend.muscleGroup}`, message: trend.message });
    }
  }

  const priority = insights.find((item) => item.id.startsWith('muscle-fatigue:'))
    ?? insights.find((item) => item.severity === 'attention')
    ?? insights.find((item) => item.severity === 'positive')
    ?? { id: 'priority-start', severity: 'neutral' as const, title: 'Comece registrando', message: 'Use o aplicativo normalmente. O Coach melhora conforme o histórico cresce.' };

  return {
    score: { total: trainingScore, training: trainingScore, dataConfidence: workouts.length >= 12 ? 'high' : workouts.length >= 4 ? 'medium' : 'low' },
    priority,
    insights,
    generatedAt: now.toISOString(),
  };
}
