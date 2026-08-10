import { loadActiveNutritionPlan } from '../features/nutrition/storage';
import { loadNutritionExecutionsForDate, nutritionTotalsForDate, saveNutritionMealExecution, todayKey } from '../features/nutrition/execution';
import type { NutritionMacroTotals, NutritionMeal } from '../features/nutrition/types';

const ROOT_ID = 'titan-nutrition-today';
const DAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getTodayMeals() {
  const plan = loadActiveNutritionPlan();
  if (!plan) return null;
  const today = DAYS[new Date().getDay()];
  const day = plan.days.find((item) => normalize(item.day).includes(today));
  return { plan, day, meals: [...(day?.meals ?? [])].sort((a, b) => a.plannedTime.localeCompare(b.plannedTime)), target: day?.target ?? plan.defaultTarget };
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function format(value: number) {
  return Math.round(value).toLocaleString('pt-BR');
}

function percent(value: number, target: number) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function macroScale(meal: NutritionMeal, quantities: Map<string, number>): NutritionMacroTotals {
  return meal.foods.reduce<NutritionMacroTotals>((totals, food) => {
    const quantity = Math.max(0, quantities.get(food.id) ?? food.quantity);
    const ratio = food.quantity > 0 ? quantity / food.quantity : 0;
    return {
      caloriesKcal: totals.caloriesKcal + food.macros.caloriesKcal * ratio,
      proteinG: totals.proteinG + food.macros.proteinG * ratio,
      carbohydrateG: totals.carbohydrateG + food.macros.carbohydrateG * ratio,
      fatG: totals.fatG + food.macros.fatG * ratio,
    };
  }, { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 });
}

function macroBar(label: string, value: number, target: number, unit: string) {
  const progress = percent(value, target);
  return `<div class="nutrition-progress-item"><div><span>${label}</span><strong>${format(value)} / ${format(target)} ${unit}</strong></div><div class="nutrition-progress-track"><span style="width:${progress}%"></span></div></div>`;
}

function renderMealEditor(container: HTMLElement, meal: NutritionMeal) {
  const quantities = new Map(meal.foods.map((food) => [food.id, food.quantity]));
  container.innerHTML = `<section class="nutrition-meal-editor" aria-label="Registrar ${meal.name}">
    <div class="nutrition-editor-head"><button type="button" class="nutrition-back">‹</button><div><span class="eyebrow">${meal.plannedTime} · REFEIÇÃO</span><h3>${meal.name}</h3></div></div>
    <p>Informe o que realmente foi consumido. Os macros serão calculados pelas quantidades registradas.</p>
    <div class="nutrition-food-list">${meal.foods.map((food) => `<label class="nutrition-food-row"><div><strong>${food.name}</strong><small>Planejado: ${food.quantity} ${food.unit}</small></div><div class="nutrition-food-input"><input type="number" min="0" step="0.1" inputmode="decimal" data-food-id="${food.id}" value="${food.quantity}"><span>${food.unit}</span></div></label>`).join('')}</div>
    <div class="nutrition-editor-actions"><button type="button" class="primary-action nutrition-save">Concluir refeição</button><button type="button" class="secondary-action nutrition-skip">Não realizada</button></div>
  </section>`;

  container.querySelector('.nutrition-back')?.addEventListener('click', () => render());
  container.querySelectorAll<HTMLInputElement>('input[data-food-id]').forEach((input) => input.addEventListener('input', () => {
    quantities.set(input.dataset.foodId ?? '', Number(input.value) || 0);
  }));
  container.querySelector('.nutrition-save')?.addEventListener('click', () => {
    const macros = macroScale(meal, quantities);
    const plannedTotal = meal.foods.reduce((sum, food) => sum + Math.max(0, food.quantity), 0);
    const consumedTotal = meal.foods.reduce((sum, food) => sum + Math.max(0, quantities.get(food.id) ?? 0), 0);
    const status = plannedTotal > 0 && consumedTotal < plannedTotal * 0.95 ? 'partial' : 'consumed';
    saveNutritionMealExecution({ date: todayKey(), mealId: meal.id, status, completedAt: new Date().toISOString(), foods: meal.foods.map((food) => ({ foodId: food.id, quantity: Math.max(0, quantities.get(food.id) ?? 0) })), macros });
    render();
  });
  container.querySelector('.nutrition-skip')?.addEventListener('click', () => {
    saveNutritionMealExecution({ date: todayKey(), mealId: meal.id, status: 'skipped', completedAt: new Date().toISOString(), foods: [], macros: { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 } });
    render();
  });
}

function render() {
  const existing = document.getElementById(ROOT_ID);
  const dashboard = document.querySelector<HTMLElement>('.dashboard-page-clean');
  if (!dashboard) { existing?.remove(); return; }

  const data = getTodayMeals();
  if (!data || !data.meals.length) { existing?.remove(); return; }

  let root = existing;
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    const heading = dashboard.querySelector('.dashboard-heading');
    heading?.insertAdjacentElement('afterend', root);
  }

  const executions = loadNutritionExecutionsForDate(todayKey());
  const completedIds = new Set(executions.map((item) => item.mealId));
  const pending = data.meals.filter((meal) => !completedIds.has(meal.id) && timeToMinutes(meal.plannedTime) < nowMinutes());
  const future = data.meals.filter((meal) => !completedIds.has(meal.id) && timeToMinutes(meal.plannedTime) >= nowMinutes());
  const nextMeal = future[0] ?? pending[0] ?? data.meals.find((meal) => !completedIds.has(meal.id)) ?? null;
  const totals = nutritionTotalsForDate(todayKey());

  root.innerHTML = `<section class="nutrition-today-card" aria-label="Nutrição de hoje">
    <div class="nutrition-card-head"><div><span class="eyebrow">NUTRIÇÃO DE HOJE</span><h3>${nextMeal ? 'Próxima refeição' : 'Plano do dia concluído'}</h3></div>${pending.length ? `<span class="nutrition-pending-badge">${pending.length} pendente${pending.length > 1 ? 's' : ''}</span>` : ''}</div>
    ${nextMeal ? `<button type="button" class="nutrition-next-meal"><div class="nutrition-time">${nextMeal.plannedTime}</div><div class="nutrition-next-copy"><strong>${nextMeal.name}</strong><small>${format(nextMeal.macros.caloriesKcal)} kcal · P ${format(nextMeal.macros.proteinG)}g · C ${format(nextMeal.macros.carbohydrateG)}g · G ${format(nextMeal.macros.fatG)}g</small></div><span>›</span></button>` : '<p class="nutrition-complete-copy">Todas as refeições programadas de hoje já foram registradas.</p>'}
    <div class="nutrition-day-progress">${macroBar('Calorias', totals.caloriesKcal, data.target.caloriesKcal, 'kcal')}${macroBar('Proteína', totals.proteinG, data.target.proteinG, 'g')}${macroBar('Carboidratos', totals.carbohydrateG, data.target.carbohydrateG, 'g')}${macroBar('Gorduras', totals.fatG, data.target.fatG, 'g')}</div>
  </section>`;

  root.querySelector('.nutrition-next-meal')?.addEventListener('click', () => nextMeal && renderMealEditor(root!, nextMeal));
}

export function enableNutritionToday() {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; render(); });
  };
  window.addEventListener('titan:nutrition-changed', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('click', () => setTimeout(schedule, 0));
  const observer = new MutationObserver(schedule);
  const start = () => {
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
    schedule();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
