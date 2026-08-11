import type { CoachContext } from '../coach/types';
import type { NutritionMacroTotals } from '../nutrition/types';

const DAY = 86_400_000;
const ZERO: NutritionMacroTotals = { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };

export type TitanReportPeriod = 7 | 30;
export type TitanReportTrend = 'up' | 'down' | 'stable' | 'unavailable';

export type TitanReportComparison = {
  current: number | null;
  previous: number | null;
  delta: number | null;
  deltaPercent: number | null;
  trend: TitanReportTrend;
};

export type TitanReport = {
  periodDays: TitanReportPeriod;
  training: {
    sessions: number;
    totalVolumeKg: number;
    sessionsComparison: TitanReportComparison;
    volumeComparison: TitanReportComparison;
  };
  nutrition: {
    registeredDays: number;
    averageCaloriesKcal: number | null;
    averageProteinG: number | null;
    calorieAdherencePercent: number | null;
    proteinAdherencePercent: number | null;
    registeredDaysComparison: TitanReportComparison;
    calorieAdherenceComparison: TitanReportComparison;
    proteinAdherenceComparison: TitanReportComparison;
  };
  recovery: {
    sleepDays: number;
    averageSleepHours: number | null;
    sleepComparison: TitanReportComparison;
  };
  evolution: {
    records: number;
    latestWeightKg: number | null;
    weightChangeKg: number | null;
    recordsComparison: TitanReportComparison;
    weightComparison: TitanReportComparison;
  };
  availableSections: number;
  previousAvailableSections: number;
};

type ReportWindow = {
  trainingSessions: number;
  totalVolumeKg: number;
  nutritionDays: number;
  averageCaloriesKcal: number | null;
  averageProteinG: number | null;
  calorieAdherencePercent: number | null;
  proteinAdherencePercent: number | null;
  sleepDays: number;
  averageSleepHours: number | null;
  bodyRecords: number;
  latestWeightKg: number | null;
  firstWeightKg: number | null;
  availableSections: number;
};

export function buildTitanReport(context: CoachContext, periodDays: TitanReportPeriod, now = new Date()): TitanReport {
  const current = summarizeWindow(context, periodDays, now, 0);
  const previous = summarizeWindow(context, periodDays, now, periodDays);
  const weightChangeKg = current.latestWeightKg !== null && current.firstWeightKg !== null && current.bodyRecords > 1
    ? round1(current.latestWeightKg - current.firstWeightKg)
    : null;

  return {
    periodDays,
    training: {
      sessions: current.trainingSessions,
      totalVolumeKg: Math.round(current.totalVolumeKg),
      sessionsComparison: compare(current.trainingSessions, previous.trainingSessions),
      volumeComparison: compare(Math.round(current.totalVolumeKg), Math.round(previous.totalVolumeKg)),
    },
    nutrition: {
      registeredDays: current.nutritionDays,
      averageCaloriesKcal: current.averageCaloriesKcal === null ? null : Math.round(current.averageCaloriesKcal),
      averageProteinG: current.averageProteinG === null ? null : round1(current.averageProteinG),
      calorieAdherencePercent: current.calorieAdherencePercent,
      proteinAdherencePercent: current.proteinAdherencePercent,
      registeredDaysComparison: compare(current.nutritionDays, previous.nutritionDays),
      calorieAdherenceComparison: compare(current.calorieAdherencePercent, previous.calorieAdherencePercent),
      proteinAdherenceComparison: compare(current.proteinAdherencePercent, previous.proteinAdherencePercent),
    },
    recovery: {
      sleepDays: current.sleepDays,
      averageSleepHours: current.averageSleepHours,
      sleepComparison: compare(current.averageSleepHours, previous.averageSleepHours),
    },
    evolution: {
      records: current.bodyRecords,
      latestWeightKg: current.latestWeightKg,
      weightChangeKg,
      recordsComparison: compare(current.bodyRecords, previous.bodyRecords),
      weightComparison: compare(current.latestWeightKg, previous.latestWeightKg),
    },
    availableSections: current.availableSections,
    previousAvailableSections: previous.availableSections,
  };
}

function summarizeWindow(context: CoachContext, periodDays: TitanReportPeriod, now: Date, offsetDays: number): ReportWindow {
  const { workouts, nutritionPlan, nutritionExecutions = [], healthSamples = [], bodyEntries = [] } = context;
  const end = now.getTime() - offsetDays * DAY;
  const start = end - periodDays * DAY;
  const inWindow = (value: string) => {
    const time = new Date(value).getTime();
    return time >= start && time < end;
  };

  const workoutsInWindow = workouts.filter((item) => inWindow(item.completedAt) && item.exercises.some((exercise) => (exercise.exerciseType ?? 'strength') === 'strength'));
  const totalVolumeKg = workoutsInWindow.reduce((sum, item) => sum + Math.max(0, item.totalVolumeKg || 0), 0);

  const nutritionInWindow = nutritionExecutions.filter((item) => inWindow(`${item.date}T12:00:00`));
  const nutritionByDate = new Map<string, NutritionMacroTotals>();
  for (const item of nutritionInWindow) {
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

  const sleep = healthSamples
    .filter((sample) => sample.type === 'sleep' && inWindow(sample.startedAt))
    .map((sample) => sleepHours(sample.value, sample.unit))
    .filter((value) => value > 0 && value <= 24);

  const body = bodyEntries.filter((entry) => inWindow(entry.recordedAt)).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const weighted = body.filter((entry) => typeof entry.weightKg === 'number');
  const latestWeightKg = weighted.length ? weighted[weighted.length - 1].weightKg ?? null : null;
  const firstWeightKg = weighted.length ? weighted[0].weightKg ?? null : null;

  const availableSections = [
    workoutsInWindow.length > 0,
    nutritionDays.length > 0,
    sleep.length > 0,
    body.length > 0,
  ].filter(Boolean).length;

  return {
    trainingSessions: workoutsInWindow.length,
    totalVolumeKg,
    nutritionDays: nutritionDays.length,
    averageCaloriesKcal,
    averageProteinG,
    calorieAdherencePercent,
    proteinAdherencePercent,
    sleepDays: sleep.length,
    averageSleepHours: sleep.length ? round1(average(sleep)) : null,
    bodyRecords: body.length,
    latestWeightKg,
    firstWeightKg,
    availableSections,
  };
}

function compare(current: number | null, previous: number | null): TitanReportComparison {
  if (current === null || previous === null) return { current, previous, delta: null, deltaPercent: null, trend: 'unavailable' };
  const delta = round1(current - previous);
  const deltaPercent = previous === 0 ? (current === 0 ? 0 : null) : Math.round(((current - previous) / Math.abs(previous)) * 100);
  const threshold = Math.max(0.1, Math.abs(previous) * 0.01);
  const trend: TitanReportTrend = Math.abs(current - previous) <= threshold ? 'stable' : current > previous ? 'up' : 'down';
  return { current, previous, delta, deltaPercent, trend };
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
