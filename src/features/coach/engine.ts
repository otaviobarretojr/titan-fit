import type { CardioRecord } from '../cardio/types';
import type { WorkoutHistoryRecord } from '../history/types';
import type { CoachInsight, CoachReport } from './types';

const DAY = 86_400_000;

function daysSince(date: string, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / DAY));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createCoachReport(workouts: WorkoutHistoryRecord[], cardio: CardioRecord[], now = new Date()): CoachReport {
  const recentWorkouts = workouts.filter((item) => daysSince(item.completedAt, now) <= 7);
  const recentCardio = cardio.filter((item) => daysSince(item.completedAt, now) <= 7);
  const trainingScore = clamp((recentWorkouts.length / 4) * 100);
  const cardioScore = clamp((recentCardio.length / 3) * 100);
  const total = clamp(trainingScore * 0.7 + cardioScore * 0.3);
  const insights: CoachInsight[] = [];

  if (!workouts.length && !cardio.length) {
    insights.push({ id: 'no-data', severity: 'neutral', title: 'Ainda faltam registros', message: 'Conclua um treino ou uma sessão de cardio para o Coach começar a identificar tendências.' });
  }

  if (recentWorkouts.length >= 4) {
    insights.push({ id: 'training-consistency', severity: 'positive', title: 'Boa consistência na musculação', message: `Você concluiu ${recentWorkouts.length} treinos nos últimos 7 dias.` });
  } else if (workouts.length) {
    insights.push({ id: 'training-low', severity: 'attention', title: 'Frequência de treino abaixo da referência', message: `Foram ${recentWorkouts.length} treinos nos últimos 7 dias. A referência atual do Coach é 4 sessões semanais.` });
  }

  if (recentCardio.length >= 3) {
    insights.push({ id: 'cardio-consistency', severity: 'positive', title: 'Meta semanal de cardio atingida', message: `Você concluiu ${recentCardio.length} sessões de cardio nos últimos 7 dias.` });
  } else if (cardio.length) {
    insights.push({ id: 'cardio-low', severity: 'attention', title: 'Cardio precisa de atenção', message: `Você concluiu ${recentCardio.length} de 3 sessões de referência nesta semana.` });
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

  const lastCardio = cardio[0];
  if (lastCardio?.distanceKm && lastCardio.distanceKm >= 5) {
    insights.push({ id: 'first-5k', severity: 'positive', title: 'Primeiros 5 km registrados', message: `Você concluiu ${lastCardio.distanceKm.toFixed(2)} km. Marco desbloqueado no TITAN FIT.` });
  }

  const priority = insights.find((item) => item.severity === 'attention')
    ?? insights.find((item) => item.severity === 'positive')
    ?? { id: 'priority-start', severity: 'neutral' as const, title: 'Comece registrando', message: 'Use o aplicativo normalmente. O Coach melhora conforme o histórico cresce.' };

  const dataPoints = workouts.length + cardio.length;
  return {
    score: { total, training: trainingScore, cardio: cardioScore, dataConfidence: dataPoints >= 12 ? 'high' : dataPoints >= 4 ? 'medium' : 'low' },
    priority,
    insights,
    generatedAt: now.toISOString()
  };
}
