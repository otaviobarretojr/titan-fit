import type { CoachContext } from '../coach/types';
import type { NutritionMacroTotals } from '../nutrition/types';

const DAY = 86_400_000;
const ZERO: NutritionMacroTotals = { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };

export type TitanReportPeriod = 7 | 30;

export type TitanReport = {
  periodDays: TitanReportPeriod;
  training: {
    sessions: number;
    totalVolumeKg: number;
  };
  nutrition: {
    registeredDays: number;
    averageCaloriesKcal: number | null;
    averageProteinG: number | null;
    calorieAdherencePercent: number | null;
    proteinAdherencePercent: number | null;
  };
  recovery: {
    sleepDays: number;
    averageSleepHours: number | null;
  };
  evolution: {
    records: number;
    latestWeightKg: number | null;
    weightChangeKg: number | null;
  };
  availableSections: number;
};

export function buildTitanReport(context: CoachContext, periodDays: TitanReportPeriod, now = new Date()): TitanReport {
  const { workouts, nutritionPlan, nutritionExecutions = [], healthSamples = [], bodyEntries = [] } = context;
  const inPeriod = (value: string) => {
    const age = now.getTime() - new Date(value).getTime();
    return age >= 0 && age < periodDays * DAY;
  };

  const recentWorkouts = workouts.filter((item) => inPeriod(item.completedAt));
  const totalVolumeKg = recentWorkouts.reduce((sum, item) => sum + Math.max(0, item.totalVolumeKg || 0), 0);

  const recentNutrition = nutritionExecutions.filter((item) => inPeriod(`${item.date}T12:00:00`));
  const nutritionByDate = new Map<string, NutritionMacroTotals>();
  for (const item of recentNutrition) {
    const totals = nutritionByDate.get(item.date) ?? { ...ZERO };
    totals.caloriesKcal += item.macros.caloriesKcal;
    totals.proteinG += item.macros.proteinG;
    totals.carbohydrateG += item.macros.carbohydrateG;
    totals.fatG += item.macros.fatG;
    nutritionByDate.set(item.date, totals);
  }
  const nutritionDays = [...nutritionByDate.values()];
  const averageCaloriesKcal = averageOrNull(nutritionDays.map((day) => day.caloriesKcal));
  const averageProteinG = averageOrNull(nutritionDays.map((day) => day.proteinG));
  const calorieAdherencePercent = nutritionPlan && nutritionDays.length && nutritionPlan.defaultTarget.caloriesKcal > 0
    ? Math.round(average(nutritionDays.map((day) => Math.max(0, 1 - Math.abs(day.caloriesKcal - nutritionPlan.defaultTarget.caloriesKcal) / nutritionPlan.defaultTarget.caloriesKcal))) * 100)
    : null;
  const proteinAdherencePercent = nutritionPlan && nutritionDays.length && nutritionPlan.defaultTarget.proteinG > 0
    ? Math.round(average(nutritionDays.map((day) => Math.min(1, day.proteinG / nutritionPlan.defaultTarget.proteinG))) * 100)
    : null;

  const recentSleep = healthSamples
    .filter((sample) => sample.type === 'sleep' && inPeriod(sample.startedAt))
    .map((sample) => sleepHours(sample.value, sample.unit))
    .filter((value) => value > 0 && value <= 24);

  const recentBody = bodyEntries.filter((entry) => inPeriod(entry.recordedAt)).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const weighted = recentBody.filter((entry) => typeof entry.weightKg === 'number');
  const latestWeightKg = weighted.length ? weighted[weighted.length - 1].weightKg ?? null : null;
  const firstWeightKg = weighted.length ? weighted[0].weightKg ?? null : null;
  const weightChangeKg = latestWeightKg !== null && firstWeightKg !== null && weighted.length > 1
    ? round1(latestWeightKg - firstWeightKg)
    : null;

  const availableSections = [
    recentWorkouts.length > 0,
    nutritionDays.length > 0,
    recentSleep.length > 0,
    recentBody.length > 0,
  ].filter(Boolean).length;

  return {
    periodDays,
    training: { sessions: recentWorkouts.length, totalVolumeKg: Math.round(totalVolumeKg) },
    nutrition: {
      registeredDays: nutritionDays.length,
      averageCaloriesKcal: averageCaloriesKcal === null ? null : Math.round(averageCaloriesKcal),
      averageProteinG: averageProteinG === null ? null : round1(averageProteinG),
      calorieAdherencePercent,
      proteinAdherencePercent,
    },
    recovery: {
      sleepDays: recentSleep.length,
      averageSleepHours: recentSleep.length ? round1(average(recentSleep)) : null,
    },
    evolution: {
      records: recentBody.length,
      latestWeightKg,
      weightChangeKg,
    },
    availableSections,
  };
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageOrNull(values: number[]) {
  return values.length ? average(values) : null;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function sleepHours(value: number, unit: string) {
  const normalized = unit.toLowerCase();
  if (normalized.includes('min')) return value / 60;
  if (normalized.includes('sec') || normalized === 's') return value / 3600;
  if (normalized.includes('ms')) return value / 3_600_000;
  return value;
}
