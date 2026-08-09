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

export function getTodayCardioSession(plan: TitanPlan, now = new Date()): TitanCardioSession | null {
  const schedule = plan.project?.cardioSchedule ?? [];
  if (!schedule.length) return null;
  const today = WEEKDAYS[now.getDay()];
  const week = currentProjectWeek(plan, now);
  const sameDay = schedule.filter((session) => normalizeDay(session.day).includes(today));
  return sameDay.find((session) => session.week === week)
    ?? sameDay.find((session) => session.week === undefined)
    ?? null;
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

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
