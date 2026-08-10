import { analyzeMuscleTrends } from '../history/trends';
import type { WorkoutHistoryRecord } from '../history/types';
import type { NutritionMacroTotals } from '../nutrition/types';
import type { CoachContext, CoachInsight, CoachReport } from './types';

const DAY = 86_400_000;
const ZERO_MACROS: NutritionMacroTotals = { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };

function daysSince(date: string, now: Date) { return Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / DAY)); }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }

export function createCoachReport(workouts: WorkoutHistoryRecord[], now = new Date()): CoachReport {
  return createUnifiedCoachReport({ workouts }, now);
}

export function createUnifiedCoachReport(context: CoachContext, now = new Date()): CoachReport {
  const { workouts, nutritionPlan, nutritionExecutions = [], healthSamples = [], bodyEntries = [] } = context;
  const recentWorkouts = workouts.filter((item) => daysSince(item.completedAt, now) <= 7);
  const trainingScore = clamp((recentWorkouts.length / 4) * 100);
  const insights: CoachInsight[] = [];

  if (!workouts.length) insights.push({ id: 'no-training-data', pillar: 'training', severity: 'neutral', title: 'Treino ainda sem histórico', message: 'Conclua treinos para o Coach identificar consistência, progressão e fadiga.' });
  else if (recentWorkouts.length >= 4) insights.push({ id: 'training-consistency', pillar: 'training', severity: 'positive', title: 'Boa consistência de treino', message: `Você concluiu ${recentWorkouts.length} treinos nos últimos 7 dias.` });
  else insights.push({ id: 'training-low', pillar: 'training', severity: 'attention', title: 'Frequência abaixo da referência', message: `Foram ${recentWorkouts.length} treinos nos últimos 7 dias. A referência atual do Coach é 4 sessões semanais.` });

  const latestWorkout = workouts[0];
  if (latestWorkout) {
    const previousSame = workouts.find((item) => item.id !== latestWorkout.id && item.workoutId === latestWorkout.workoutId);
    if (previousSame && previousSame.totalVolumeKg > 0) {
      const change = ((latestWorkout.totalVolumeKg - previousSame.totalVolumeKg) / previousSame.totalVolumeKg) * 100;
      if (change >= 5) insights.push({ id: 'volume-up', pillar: 'training', severity: 'positive', title: 'Volume de treino aumentou', message: `${latestWorkout.workoutTitle} teve aumento de ${Math.round(change)}% em relação à execução anterior.` });
      if (change <= -10) insights.push({ id: 'volume-down', pillar: 'training', severity: 'attention', title: 'Queda relevante de volume', message: `${latestWorkout.workoutTitle} caiu ${Math.abs(Math.round(change))}% em relação à execução anterior. Verifique recuperação, carga e técnica.` });
    }
  }

  for (const trend of analyzeMuscleTrends(workouts)) {
    if (trend.status === 'fatigued') insights.push({ id: `muscle-fatigue:${trend.muscleGroup}`, pillar: 'training', severity: 'attention', title: `Fadiga acumulada · ${trend.muscleGroup}`, message: trend.message });
    else if (trend.status === 'stalled') insights.push({ id: `muscle-stalled:${trend.muscleGroup}`, pillar: 'training', severity: 'attention', title: `Desempenho em queda · ${trend.muscleGroup}`, message: trend.message });
    else if (trend.status === 'progressing') insights.push({ id: `muscle-progress:${trend.muscleGroup}`, pillar: 'training', severity: 'positive', title: `Progressão · ${trend.muscleGroup}`, message: trend.message });
  }

  const nutrition = analyzeNutrition(nutritionPlan ?? null, nutritionExecutions, now);
  if (nutrition.insight) insights.push(nutrition.insight);

  const recovery = analyzeRecovery(healthSamples, now);
  if (recovery.insight) insights.push(recovery.insight);

  const evolution = analyzeEvolution(bodyEntries, now);
  if (evolution.insight) insights.push(evolution.insight);

  const availableScores = [trainingScore, nutrition.score, recovery.score, evolution.score].filter((value): value is number => value !== null);
  const availablePillars = availableScores.length;
  const total = clamp(average(availableScores));
  const confidencePoints = Math.min(2, workouts.length / 4) + (nutrition.score !== null ? 1 : 0) + (recovery.score !== null ? 1 : 0) + (evolution.score !== null ? 1 : 0);
  const dataConfidence = confidencePoints >= 4 ? 'high' : confidencePoints >= 2 ? 'medium' : 'low';

  const priority = insights.find((item) => item.id.startsWith('muscle-fatigue:'))
    ?? insights.find((item) => item.severity === 'attention')
    ?? insights.find((item) => item.severity === 'positive')
    ?? { id: 'priority-start', severity: 'neutral' as const, title: 'Continue registrando', message: 'O Coach melhora conforme treino, nutrição, saúde e evolução acumulam dados.' };

  return {
    score: { total, training: trainingScore, nutrition: nutrition.score, recovery: recovery.score, evolution: evolution.score, dataConfidence },
    priority,
    insights,
    availablePillars,
    generatedAt: now.toISOString(),
  };
}

function analyzeNutrition(plan: CoachContext['nutritionPlan'], executions: NonNullable<CoachContext['nutritionExecutions']>, now: Date) {
  if (!plan) return { score: null, insight: { id: 'nutrition-plan-missing', pillar: 'nutrition', severity: 'neutral', title: 'Nutrição sem referência', message: 'Ative um plano alimentar para o Coach comparar o consumo real com suas metas.' } satisfies CoachInsight };
  const recent = executions.filter((item) => daysSince(`${item.date}T12:00:00`, now) <= 6);
  if (!recent.length) return { score: null, insight: { id: 'nutrition-data-missing', pillar: 'nutrition', severity: 'neutral', title: 'Nutrição ainda sem registros', message: 'Conclua ou marque suas refeições para liberar a análise de aderência nutricional.' } satisfies CoachInsight };

  const byDate = new Map<string, NutritionMacroTotals>();
  for (const item of recent) {
    const totals = byDate.get(item.date) ?? { ...ZERO_MACROS };
    totals.caloriesKcal += item.macros.caloriesKcal;
    totals.proteinG += item.macros.proteinG;
    totals.carbohydrateG += item.macros.carbohydrateG;
    totals.fatG += item.macros.fatG;
    byDate.set(item.date, totals);
  }
  const target = plan.defaultTarget;
  const days = [...byDate.values()];
  const calorieAdherence = average(days.map((day) => target.caloriesKcal > 0 ? Math.max(0, 1 - Math.abs(day.caloriesKcal - target.caloriesKcal) / target.caloriesKcal) : 1));
  const proteinAdherence = average(days.map((day) => target.proteinG > 0 ? Math.min(1, day.proteinG / target.proteinG) : 1));
  const score = clamp((calorieAdherence * 0.55 + proteinAdherence * 0.45) * 100);
  const insight: CoachInsight = score >= 85
    ? { id: 'nutrition-on-track', pillar: 'nutrition', severity: 'positive', title: 'Nutrição consistente', message: `A aderência combinada de calorias e proteína está em ${score}% nos dias registrados.` }
    : { id: 'nutrition-review', pillar: 'nutrition', severity: 'attention', title: 'Ajuste nutricional prioritário', message: `A aderência combinada está em ${score}%. Revise principalmente refeições pendentes, parciais ou fora da meta.` };
  return { score, insight };
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
