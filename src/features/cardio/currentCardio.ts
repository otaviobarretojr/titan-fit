import type { TitanCardioSession, TitanPlan } from '../plan/types';

const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export function normalizeDay(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function currentProjectWeek(plan: TitanPlan, now = new Date()) {
  const start = plan.project?.startDate ? new Date(`${plan.project.startDate}T00:00:00`) : null;
  if (!start || Number.isNaN(start.getTime())) return 1;
  const elapsedDays = Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(start).getTime()) / 86_400_000));
  return Math.max(1, Math.floor(elapsedDays / 7) + 1);
}

export function getPlannedCardioWeeks(plan: TitanPlan) {
  return [...new Set((plan.project?.cardioSchedule ?? [])
    .map((session) => session.week)
    .filter((week): week is number => typeof week === 'number' && Number.isFinite(week) && week > 0))]
    .sort((a, b) => a - b);
}

export function effectiveCardioWeek(plan: TitanPlan, now = new Date()) {
  const plannedWeeks = getPlannedCardioWeeks(plan);
  if (!plannedWeeks.length) return currentProjectWeek(plan, now);
  const projectWeek = currentProjectWeek(plan, now);
  const reachedWeeks = plannedWeeks.filter((week) => week <= projectWeek);
  return reachedWeeks.at(-1) ?? plannedWeeks[0];
}

export function getCardioWeekSchedule(plan: TitanPlan, now = new Date()) {
  const schedule = plan.project?.cardioSchedule ?? [];
  if (!schedule.length) return [];
  const plannedWeeks = getPlannedCardioWeeks(plan);
  if (!plannedWeeks.length) return [...schedule];

  const activeWeek = effectiveCardioWeek(plan, now);
  const weekly = schedule.filter((session) => session.week === activeWeek);
  const recurring = schedule.filter((session) => session.week === undefined);
  if (!recurring.length) return weekly;

  const daysWithWeeklySession = new Set(weekly.map((session) => weekdayFromValue(session.day)).filter(Boolean));
  return [...weekly, ...recurring.filter((session) => !daysWithWeeklySession.has(weekdayFromValue(session.day)))];
}

export function getTodayCardioSession(plan: TitanPlan, now = new Date()): TitanCardioSession | null {
  const schedule = getCardioWeekSchedule(plan, now);
  if (!schedule.length) return null;
  const today = WEEKDAYS[now.getDay()];
  return schedule.find((session) => normalizeDay(session.day).includes(today)) ?? null;
}

export function cardioZoneLabel(session: TitanCardioSession | null) {
  if (!session) return '—';
  if (session.type === 'zone2') return 'Zona 2';
  if (session.type === 'hiit') return 'HIIT';
  if (session.type === 'run') return 'Corrida';
  if (session.type === 'run-walk') return 'Corrida/Caminhada';
  if (session.type === 'walk') return 'Caminhada';
  if (session.type === 'bike') return 'Bike';
  if (session.type === 'stairs') return 'Escada';
  return 'Cardio';
}

function weekdayFromValue(value: string) {
  const normalized = normalizeDay(value);
  return WEEKDAYS.find((day) => normalized.includes(day)) ?? '';
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
