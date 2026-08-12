import { balanceTargetCenter, loadNutritionSettings } from './settings';

export type EnergyDay = {
  date: string;
  consumedKcal: number;
  expenditureKcal: number;
  balanceKcal: number;
  projectedBalanceKcal: number;
  updatedAt: string;
};

export type BodyMetricEntry = {
  id: string;
  date: string;
  weightKg?: number;
  waistCm?: number;
  note?: string;
  createdAt: string;
};

const ENERGY_KEY = 'titan-nutrition:energy-history:v1';
const BODY_KEY = 'titan-nutrition:body-metrics:v1';

function localDateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function readEnergyMap(): Record<string, EnergyDay> {
  try { return JSON.parse(localStorage.getItem(ENERGY_KEY) ?? '{}') as Record<string, EnergyDay>; } catch { return {}; }
}

export function saveEnergySnapshot(input: Omit<EnergyDay, 'date' | 'updatedAt'>) {
  const date = localDateKey();
  const all = readEnergyMap();
  all[date] = { date, ...input, updatedAt: new Date().toISOString() };
  localStorage.setItem(ENERGY_KEY, JSON.stringify(all));
  return all[date];
}

export function readEnergyHistory(days = 30): EnergyDay[] {
  const all = readEnergyMap();
  const result: EnergyDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = localDateKey(date);
    if (all[key]) result.push(all[key]);
  }
  return result;
}

export function loadBodyMetrics(): BodyMetricEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BODY_KEY) ?? '[]') as BodyMetricEntry[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => a.date.localeCompare(b.date)) : [];
  } catch { return []; }
}

export function addBodyMetric(input: { date?: string; weightKg?: number; waistCm?: number; note?: string }) {
  const entry: BodyMetricEntry = {
    id: `body-${Date.now()}`,
    date: input.date || localDateKey(),
    weightKg: input.weightKg && input.weightKg > 0 ? Math.round(input.weightKg * 10) / 10 : undefined,
    waistCm: input.waistCm && input.waistCm > 0 ? Math.round(input.waistCm * 10) / 10 : undefined,
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const next = [...loadBodyMetrics(), entry].sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(BODY_KEY, JSON.stringify(next));
  return next;
}

export function deleteBodyMetric(id: string) {
  const next = loadBodyMetrics().filter((item) => item.id !== id);
  localStorage.setItem(BODY_KEY, JSON.stringify(next));
  return next;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function buildDynamicCalorieSuggestion() {
  const settings = loadNutritionSettings();
  const body = loadBodyMetrics().filter((item) => typeof item.weightKg === 'number');
  const energy = readEnergyHistory(21);
  if (body.length < 3 || energy.length < 7) return { delta: 0, target: settings.calorieTarget, label: 'Dados insuficientes', reason: 'Registre peso em pelo menos 3 datas e use o app por 7 dias para gerar uma sugestão.' };

  const recentBody = body.slice(-6);
  const first = recentBody[0].weightKg ?? 0;
  const last = recentBody.at(-1)?.weightKg ?? 0;
  const days = Math.max(1, (new Date(`${recentBody.at(-1)?.date}T12:00:00`).getTime() - new Date(`${recentBody[0].date}T12:00:00`).getTime()) / 86400000);
  const weeklyChange = ((last - first) / days) * 7;
  const avgBalance = Math.round(average(energy.slice(-14).map((day) => day.balanceKcal)));
  const targetCenter = balanceTargetCenter(settings);

  if (weeklyChange < -0.7 || avgBalance < settings.balanceMin - 150) return { delta: 100, target: settings.calorieTarget + 100, label: 'Considerar +100 kcal', reason: `Peso caiu cerca de ${Math.abs(weeklyChange).toFixed(2).replace('.', ',')} kg/sem e/ou o déficit médio está mais agressivo que a faixa.` };
  if (weeklyChange > 0.25 && avgBalance > settings.balanceMax + 100) return { delta: -100, target: Math.max(1200, settings.calorieTarget - 100), label: 'Considerar −100 kcal', reason: `Peso subiu cerca de ${weeklyChange.toFixed(2).replace('.', ',')} kg/sem com saldo médio acima da faixa-alvo.` };
  if (Math.abs(avgBalance - targetCenter) <= 120) return { delta: 0, target: settings.calorieTarget, label: 'Manter meta', reason: 'Saldo energético médio está próximo do centro da faixa e a tendência de peso não pede ajuste.' };
  return { delta: 0, target: settings.calorieTarget, label: 'Manter e observar', reason: 'Ainda não há sinal consistente para alterar a meta. Reavalie após mais registros.' };
}
