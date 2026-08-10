import { loadNutritionExecutions, nutritionTotalsForDate, todayKey } from '../features/nutrition/execution';
import { loadActiveNutritionPlan } from '../features/nutrition/storage';
import type { NutritionMacroTotals, TitanNutritionPlan } from '../features/nutrition/types';

const CARD_ID = 'titan-nutrition-health-card';
const EMPTY: NutritionMacroTotals = { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };
let selectedPeriod: 7 | 30 | 90 = 7;

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function targetForDate(plan: TitanNutritionPlan, date: Date): NutritionMacroTotals {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
  const day = plan.days.find((item) => normalize(item.day).includes(normalize(weekday)));
  return day?.target ?? plan.defaultTarget;
}

function clampPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(120, Math.round((value / target) * 100)));
}

function bar(label: string, value: number, target: number, unit: string) {
  const percent = clampPercent(value, target);
  const state = percent > 105 ? 'over' : percent >= 90 ? 'goal' : '';
  return `<div class="nutrition-health-progress ${state}"><div><span>${label}</span><strong>${Math.round(value)} / ${Math.round(target)} ${unit}</strong></div><div class="nutrition-health-track"><i style="width:${Math.min(percent, 100)}%"></i></div><small>${percent}% da meta</small></div>`;
}

function periodRows(plan: TitanNutritionPlan, days: number) {
  const executions = loadNutritionExecutions();
  const rows: Array<{ key: string; label: string; calories: number; target: number; percent: number; hasData: boolean }> = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = todayKey(date);
    const target = targetForDate(plan, date).caloriesKcal;
    const dayExecutions = executions.filter((item) => item.date === key);
    const calories = dayExecutions.reduce((sum, item) => sum + item.macros.caloriesKcal, 0);
    const compact = days <= 7
      ? new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '').slice(0, 3)
      : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
    rows.push({ key, label: compact, calories, target, percent: clampPercent(calories, target), hasData: dayExecutions.length > 0 });
  }
  return rows;
}

function periodStats(plan: TitanNutritionPlan, days: number) {
  const rows = periodRows(plan, days);
  const tracked = rows.filter((row) => row.hasData);
  if (!tracked.length) return { rows, trackedDays: 0, adherenceDays: 0, adherencePercent: 0, averageCalories: 0, averageTarget: 0 };
  const adherenceDays = tracked.filter((row) => row.percent >= 90 && row.percent <= 105).length;
  const averageCalories = tracked.reduce((sum, row) => sum + row.calories, 0) / tracked.length;
  const averageTarget = tracked.reduce((sum, row) => sum + row.target, 0) / tracked.length;
  return {
    rows,
    trackedDays: tracked.length,
    adherenceDays,
    adherencePercent: Math.round((adherenceDays / tracked.length) * 100),
    averageCalories,
    averageTarget,
  };
}

function periodButton(days: 7 | 30 | 90) {
  return `<button type="button" data-nutrition-period="${days}" class="${selectedPeriod === days ? 'active' : ''}">${days} dias</button>`;
}

function renderCard() {
  const healthDaily = document.querySelector<HTMLElement>('.health-daily-card');
  const existing = document.getElementById(CARD_ID);
  if (!healthDaily) {
    existing?.remove();
    return false;
  }

  const plan = loadActiveNutritionPlan();
  if (!plan) {
    existing?.remove();
    return true;
  }

  const totals = nutritionTotalsForDate();
  const target = targetForDate(plan, new Date()) ?? EMPTY;
  const history = periodStats(plan, selectedPeriod);
  const todayExecutions = loadNutritionExecutions().filter((item) => item.date === todayKey());
  const completed = todayExecutions.filter((item) => item.status === 'consumed' || item.status === 'partial').length;

  let card = existing as HTMLElement | null;
  if (!card) {
    card = document.createElement('section');
    card.id = CARD_ID;
    card.className = 'nutrition-health-card';
    card.setAttribute('aria-label', 'Nutrição de hoje');
    healthDaily.insertAdjacentElement('afterend', card);
  }

  card.innerHTML = `
    <div class="nutrition-health-head"><div><span class="info-label">NUTRIÇÃO DE HOJE</span><h3>Calorias e macros</h3></div><span class="nutrition-health-badge">${completed} registradas</span></div>
    <div class="nutrition-health-calories"><strong>${Math.round(totals.caloriesKcal)}</strong><span>de ${Math.round(target.caloriesKcal)} kcal</span><small>${clampPercent(totals.caloriesKcal, target.caloriesKcal)}% da meta diária</small></div>
    <div class="nutrition-health-progress-list">
      ${bar('Proteína', totals.proteinG, target.proteinG, 'g')}
      ${bar('Carboidratos', totals.carbohydrateG, target.carbohydrateG, 'g')}
      ${bar('Gorduras', totals.fatG, target.fatG, 'g')}
    </div>
    <div class="nutrition-health-history">
      <div class="nutrition-health-history-head"><div><span>HISTÓRICO NUTRICIONAL</span><small>Calorias consumidas × meta planejada</small></div><div class="nutrition-period-tabs" role="tablist" aria-label="Período do histórico nutricional">${periodButton(7)}${periodButton(30)}${periodButton(90)}</div></div>
      <div class="nutrition-history-summary"><span><small>Dias registrados</small><strong>${history.trackedDays}</strong></span><span><small>Na faixa da meta</small><strong>${history.adherencePercent}%</strong></span><span><small>Média</small><strong>${Math.round(history.averageCalories)} kcal</strong></span></div>
      <div class="nutrition-health-chart-scroll"><div class="nutrition-health-period-bars period-${selectedPeriod}">${history.rows.map((day) => `<span title="${day.hasData ? `${Math.round(day.calories)} / ${Math.round(day.target)} kcal` : 'Sem registro'}"><i style="height:${day.hasData ? Math.max(6, Math.min(68, day.percent * 0.56)) : 4}px" class="${!day.hasData ? 'empty' : day.percent > 105 ? 'over' : day.percent >= 90 ? 'goal' : ''}"></i><small>${day.label}</small></span>`).join('')}</div></div>
      <p class="nutrition-history-note">${history.trackedDays ? `${history.adherenceDays} de ${history.trackedDays} dias registrados ficaram entre 90% e 105% da meta calórica.` : 'O histórico será preenchido conforme as refeições forem registradas.'}</p>
    </div>
  `;

  card.querySelectorAll<HTMLButtonElement>('[data-nutrition-period]').forEach((button) => button.addEventListener('click', () => {
    const value = Number(button.dataset.nutritionPeriod);
    if (value === 7 || value === 30 || value === 90) {
      selectedPeriod = value;
      renderCard();
    }
  }));
  return true;
}

export function enableNutritionHealthInsights() {
  let attempts = 0;
  let timer = 0;

  const mountSoon = () => {
    attempts = 0;
    window.clearTimeout(timer);
    const tryMount = () => {
      attempts += 1;
      if (renderCard() || attempts >= 12) return;
      timer = window.setTimeout(tryMount, 120);
    };
    tryMount();
  };

  window.addEventListener('titan:nutrition-changed', mountSoon as EventListener);
  window.addEventListener('popstate', mountSoon);
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.bottom-navigation')) window.setTimeout(mountSoon, 0);
  });
  mountSoon();
}
