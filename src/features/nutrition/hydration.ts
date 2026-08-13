export type HydrationEntry = { id: string; amountMl: number; createdAt: string };
export type HydrationDay = { date: string; goalMl: number; entries: HydrationEntry[] };

const KEY = 'titan-nutrition:hydration:v1';
const DEFAULT_GOAL = 4250;

function localDateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function readAll(): Record<string, HydrationDay> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, HydrationDay>; }
  catch { return {}; }
}

function writeAll(data: Record<string, HydrationDay>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadTodayHydration(): HydrationDay {
  const date = localDateKey();
  const all = readAll();
  return all[date] ?? { date, goalMl: DEFAULT_GOAL, entries: [] };
}

export function hydrationTotal(day: HydrationDay) {
  return day.entries.reduce((sum, entry) => sum + entry.amountMl, 0);
}

export function addHydration(amountMl: number): HydrationDay {
  const safe = Math.max(0, Math.round(amountMl));
  const current = loadTodayHydration();
  const next = { ...current, entries: [...current.entries, { id: `water-${Date.now()}`, amountMl: safe, createdAt: new Date().toISOString() }] };
  const all = readAll(); all[next.date] = next; writeAll(all); return next;
}

export function undoLastHydration(): HydrationDay {
  const current = loadTodayHydration();
  const next = { ...current, entries: current.entries.slice(0, -1) };
  const all = readAll(); all[next.date] = next; writeAll(all); return next;
}

export function setHydrationGoal(goalMl: number): HydrationDay {
  const bounded = Math.min(6000, Math.max(1500, Math.round(goalMl / 50) * 50));
  const current = loadTodayHydration();
  const next = { ...current, goalMl: bounded };
  const all = readAll(); all[next.date] = next; writeAll(all); return next;
}

export function readHydrationHistory(days = 7): HydrationDay[] {
  const all = readAll();
  const result: HydrationDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = localDateKey(date);
    result.push(all[key] ?? { date: key, goalMl: DEFAULT_GOAL, entries: [] });
  }
  return result;
}

function minutesOf(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

export function hydrationPace(day: HydrationDay, wakeTime = '06:00', sleepTime = '22:30', now = new Date()) {
  const start = minutesOf(wakeTime);
  const end = minutesOf(sleepTime);
  const current = now.getHours() * 60 + now.getMinutes();
  const span = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(1, (current - start) / span));
  const expectedMl = Math.round(day.goalMl * elapsed);
  const totalMl = hydrationTotal(day);
  const deltaMl = totalMl - expectedMl;
  if (current < start) return { expectedMl: 0, deltaMl: totalMl, label: 'Dia ainda não iniciado', state: 'neutral' as const };
  if (current >= end) return { expectedMl: day.goalMl, deltaMl: totalMl - day.goalMl, label: totalMl >= day.goalMl ? 'Meta concluída' : 'Meta não concluída', state: totalMl >= day.goalMl ? 'good' as const : 'late' as const };
  if (deltaMl >= -250) return { expectedMl, deltaMl, label: 'No ritmo', state: 'good' as const };
  if (deltaMl >= -700) return { expectedMl, deltaMl, label: 'Um pouco atrasado', state: 'attention' as const };
  return { expectedMl, deltaMl, label: 'Hidratação atrasada', state: 'late' as const };
}
