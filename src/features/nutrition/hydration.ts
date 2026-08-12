export type HydrationEntry = { id: string; amountMl: number; createdAt: string };
export type HydrationDay = { date: string; goalMl: number; entries: HydrationEntry[] };

const KEY = 'titan-nutrition:hydration:v1';
const DEFAULT_GOAL = 4250;

function todayKey() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
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
  const date = todayKey();
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
  const bounded = Math.min(4500, Math.max(4000, Math.round(goalMl / 250) * 250));
  const current = loadTodayHydration();
  const next = { ...current, goalMl: bounded };
  const all = readAll(); all[next.date] = next; writeAll(all); return next;
}
