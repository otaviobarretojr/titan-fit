import { useEffect, useMemo, useState } from 'react';
import { readDailyActivitySummary, requestHealthPermissions, requestSamsungHealthPermissions, samsungHealthStatus } from '../features/health/bridge';
import type { DailyActivitySummary } from '../features/health/types';
import { DEFAULT_MEALS } from '../features/nutrition/defaultPlan';
import { calculateFoodMacros, formatMacros, mealStatusForTime, sumMacros } from '../features/nutrition/engine';
import { getAllFoods, getFoodById } from '../features/nutrition/foodRepository';
import { MealFoodPicker } from '../features/nutrition/MealFoodPicker';
import { NutritionLibraryView } from '../features/nutrition/NutritionLibraryView';
import { buildWeeklyShoppingList } from '../features/nutrition/shoppingList';
import { loadDailyMeals, saveDailyMeals } from '../features/nutrition/storage';
import type { Food, PlannedMeal } from '../features/nutrition/types';
import { TITAN_RECIPES, buildCoachMessage, estimateEnergyExpenditure, readRecentNutritionHistory, recipeMacros } from '../features/nutrition/advanced';
import { loadWeeklyPlan, resetWeeklyPlan, saveWeeklyPlan } from '../features/nutrition/weeklyPlanStorage';
import type { NutritionDayPlan } from '../features/nutrition/weeklyPlan';

type AppView = 'home' | 'library' | 'week' | 'shopping' | 'recipes' | 'insights';

function normalizeAmount(raw: string, food: Food): number {
  const parsed = Number(raw.trim().replace(',', '.'));
  if (!Number.isFinite(parsed)) return 0;
  const safe = Math.max(0, parsed);
  return food.unit === 'unit' ? Math.round(safe) : Math.round(safe * 10) / 10;
}

function healthSourceLabel(activity: DailyActivitySummary | null): string {
  if (!activity) return 'Sem dados de hoje';
  if (activity.source === 'samsung-health') return 'Samsung Health';
  if (activity.source === 'health-connect-aggregate') return 'Health Connect';
  return 'Relógio conectado';
}

function clampProgress(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, value / target));
}

function BackHeader({ title, eyebrow, onBack }: { title: string; eyebrow: string; onBack: () => void }) {
  return <header className="nutrition-header"><button className="nutrition-back" onClick={onBack}>←</button><div><span className="nutrition-eyebrow">{eyebrow}</span><h1>{title}</h1></div></header>;
}

export function NutritionEntry() {
  const [meals, setMeals] = useState<PlannedMeal[]>(DEFAULT_MEALS);
  const [weeklyPlans, setWeeklyPlans] = useState<NutritionDayPlan[]>(() => loadWeeklyPlan());
  const [isLoading, setIsLoading] = useState(true);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activity, setActivity] = useState<DailyActivitySummary | null>(null);
  const [healthMessage, setHealthMessage] = useState('Conectar relógio');
  const [animateDashboard, setAnimateDashboard] = useState(false);
  const [view, setView] = useState<AppView>('home');
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [replaceItemId, setReplaceItemId] = useState<string | null>(null);
  const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('titan-nutrition:shopping-checked:v1') ?? '{}') as Record<string, boolean>; } catch { return {}; }
  });
  const activeMeal = meals.find((meal) => meal.id === activeMealId) ?? null;

  async function refreshActivity() {
    const dailyActivity = await readDailyActivitySummary();
    setActivity(dailyActivity);
    setHealthMessage(healthSourceLabel(dailyActivity));
    return dailyActivity;
  }

  useEffect(() => {
    let mounted = true;
    void Promise.all([loadDailyMeals(), readDailyActivitySummary()]).then(([storedMeals, dailyActivity]) => {
      if (!mounted) return;
      setMeals(storedMeals);
      setActivity(dailyActivity);
      setHealthMessage(dailyActivity ? healthSourceLabel(dailyActivity) : 'Conectar relógio');
      setIsLoading(false);
    });
    const onVisibility = () => { if (document.visibilityState === 'visible') void refreshActivity(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { mounted = false; document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const frame = requestAnimationFrame(() => setAnimateDashboard(true));
    return () => cancelAnimationFrame(frame);
  }, [isLoading]);

  const todayMacros = useMemo(() => formatMacros(sumMacros(meals.filter((meal) => meal.status === 'completed').flatMap((meal) => meal.items))), [meals]);
  const plannedMacros = useMemo(() => formatMacros(sumMacros(meals.flatMap((meal) => meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))))), [meals]);
  const shoppingList = useMemo(() => buildWeeklyShoppingList(weeklyPlans), [weeklyPlans]);
  const history7 = readRecentNutritionHistory(7);
  const history30 = readRecentNutritionHistory(30);
  const expenditure = estimateEnergyExpenditure(activity?.activeCalories ?? 0);

  function persist(next: PlannedMeal[]) { setMeals(next); void saveDailyMeals(next); }

  async function connectHealth() {
    setHealthMessage('Conectando…');
    try {
      const samsungStatus = await samsungHealthStatus();
      if (samsungStatus.available) {
        const samsungPermission = samsungStatus.granted ? samsungStatus : await requestSamsungHealthPermissions();
        if (samsungPermission.granted && await refreshActivity()) return;
      }
      const granted = await requestHealthPermissions(['steps', 'active-calories', 'distance', 'exercise']);
      if (!granted) return setHealthMessage('Autorize Samsung Health/Health Connect');
      if (!await refreshActivity()) setHealthMessage('Autorizado • sem dados de hoje');
    } catch { setHealthMessage('Falha ao ler dados de saúde'); }
  }

  function updateAmount(itemId: string, amount: number) {
    if (!activeMeal) return;
    persist(meals.map((meal) => meal.id !== activeMeal.id ? meal : { ...meal, items: meal.items.map((item) => item.id === itemId ? { ...item, actualAmount: Math.max(0, amount) } : item) }));
  }

  function addFoodToMeal(food: Food, amount: number) {
    if (!activeMeal) return;
    const next = meals.map((meal) => {
      if (meal.id !== activeMeal.id) return meal;
      if (replaceItemId) return { ...meal, items: meal.items.map((item) => item.id === replaceItemId ? { ...item, foodId: food.id, plannedAmount: amount, actualAmount: amount } : item) };
      return { ...meal, items: [...meal.items, { id: `${meal.id}-${food.id}-${Date.now()}`, foodId: food.id, plannedAmount: 0, actualAmount: amount }] };
    });
    persist(next); setShowFoodPicker(false); setReplaceItemId(null);
  }

  function addRecipe(recipeId: string) {
    if (!activeMeal) return;
    const recipe = TITAN_RECIPES.find((item) => item.id === recipeId); if (!recipe) return;
    const stamp = Date.now();
    const additions = recipe.ingredients.map((ingredient, index) => ({ id: `${activeMeal.id}-${recipe.id}-${index}-${stamp}`, foodId: ingredient.foodId, plannedAmount: 0, actualAmount: ingredient.amount }));
    persist(meals.map((meal) => meal.id === activeMeal.id ? { ...meal, items: [...meal.items, ...additions] } : meal));
  }

  function removeFoodFromMeal(itemId: string) {
    if (!activeMeal) return;
    persist(meals.map((meal) => meal.id !== activeMeal.id ? meal : { ...meal, items: meal.items.filter((item) => item.id !== itemId) }));
  }

  function finishMeal(status: 'completed' | 'skipped') {
    if (!activeMeal) return;
    persist(meals.map((meal) => meal.id === activeMeal.id ? { ...meal, status } : meal));
    setActiveMealId(null); setShowFoodPicker(false); setReplaceItemId(null);
  }

  function commitWeekly(next: NutritionDayPlan[]) { setWeeklyPlans(next); saveWeeklyPlan(next); }

  function editWeeklyAmount(dayId: string, mealId: string, itemId: string, amount: number) {
    commitWeekly(weeklyPlans.map((day) => day.id !== dayId ? day : { ...day, meals: day.meals.map((meal) => meal.id !== mealId ? meal : { ...meal, items: meal.items.map((item) => item.id === itemId ? { ...item, plannedAmount: Math.max(0, amount), actualAmount: Math.max(0, amount) } : item) }) }));
  }

  function removeWeeklyItem(dayId: string, mealId: string, itemId: string) {
    commitWeekly(weeklyPlans.map((day) => day.id !== dayId ? day : { ...day, meals: day.meals.map((meal) => meal.id !== mealId ? meal : { ...meal, items: meal.items.filter((item) => item.id !== itemId) }) }));
  }

  function addWeeklyFood(dayId: string, mealId: string, foodId: string) {
    if (!foodId) return;
    const food = getFoodById(foodId); if (!food) return;
    const stamp = Date.now();
    commitWeekly(weeklyPlans.map((day) => day.id !== dayId ? day : { ...day, meals: day.meals.map((meal) => meal.id !== mealId ? meal : { ...meal, items: [...meal.items, { id: `${meal.id}-${food.id}-${stamp}`, foodId: food.id, plannedAmount: food.referenceAmount, actualAmount: food.referenceAmount }] }) }));
  }

  function copyMealToNextDay(dayId: string, mealId: string) {
    const sourceDayIndex = weeklyPlans.findIndex((day) => day.id === dayId);
    const sourceMeal = weeklyPlans[sourceDayIndex]?.meals.find((meal) => meal.id === mealId);
    if (!sourceMeal || sourceDayIndex < 0) return;
    const targetIndex = (sourceDayIndex + 1) % weeklyPlans.length;
    const stamp = Date.now();
    const copied: PlannedMeal = { ...sourceMeal, id: `${weeklyPlans[targetIndex].id}-${sourceMeal.time.replace(':', '')}-${stamp}`, status: 'upcoming', items: sourceMeal.items.map((item, index) => ({ ...item, id: `${weeklyPlans[targetIndex].id}-${item.foodId}-${stamp}-${index}` })) };
    commitWeekly(weeklyPlans.map((day, index) => index !== targetIndex ? day : { ...day, meals: [...day.meals.filter((meal) => meal.time !== sourceMeal.time), copied].sort((a, b) => a.time.localeCompare(b.time)) }));
  }

  function toggleShopping(foodId: string) {
    const next = { ...shoppingChecked, [foodId]: !shoppingChecked[foodId] };
    setShoppingChecked(next); localStorage.setItem('titan-nutrition:shopping-checked:v1', JSON.stringify(next));
  }

  if (isLoading) return <main className="nutrition-app nutrition-loading"><span className="nutrition-eyebrow">TITAN NUTRITION</span><h1>Preparando seu dia…</h1></main>;

  if (activeMeal) {
    const macros = formatMacros(sumMacros(activeMeal.items));
    const planned = formatMacros(sumMacros(activeMeal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))));
    const replacingItem = activeMeal.items.find((item) => item.id === replaceItemId);
    return <main className="nutrition-app nutrition-meal-mode"><BackHeader eyebrow={`REFEIÇÃO • ${activeMeal.time}`} title={activeMeal.name} onBack={() => { setActiveMealId(null); setShowFoodPicker(false); setReplaceItemId(null); }} /><section className="nutrition-meal-compare"><div><small>PLANEJADO</small><strong>{planned.caloriesKcal} kcal</strong><span>P {planned.proteinG} • C {planned.carbohydrateG} • G {planned.fatG}</span></div><div><small>CONSUMO ATUAL</small><strong>{macros.caloriesKcal} kcal</strong><span>P {macros.proteinG} • C {macros.carbohydrateG} • G {macros.fatG}</span></div></section><div className="nutrition-meal-tools"><button className="nutrition-primary nutrition-meal-add" onClick={() => { setReplaceItemId(null); setShowFoodPicker(true); }}>+ Biblioteca</button><button className="nutrition-secondary" onClick={() => { setActiveMealId(null); setView('recipes'); }}>Preparações</button></div><section className="nutrition-recipe-quick">{TITAN_RECIPES.slice(0, 4).map((recipe) => <button key={recipe.id} onClick={() => addRecipe(recipe.id)}>+ {recipe.name}</button>)}</section><section className="nutrition-items">{activeMeal.items.map((item) => { const food = getFoodById(item.foodId); if (!food) return null; const itemMacros = formatMacros(calculateFoodMacros(item.foodId, item.actualAmount)); const unusuallyHigh = item.plannedAmount > 0 && item.actualAmount > item.plannedAmount * 3; const increment = food.unit === 'unit' ? 1 : 5; return <article className={`nutrition-food-card${unusuallyHigh ? ' is-warning' : ''}`} key={item.id}><div className="nutrition-food-copy"><strong>{food.name}</strong><small>{item.plannedAmount > 0 ? `Planejado: ${item.plannedAmount} ${food.unit}` : 'Adicionado nesta refeição'}</small><small className="nutrition-item-macros">{itemMacros.caloriesKcal} kcal • P {itemMacros.proteinG} • C {itemMacros.carbohydrateG} • G {itemMacros.fatG}</small>{unusuallyHigh && <small className="nutrition-amount-warning">Quantidade muito acima do planejado — confira.</small>}<button className="nutrition-link-button" onClick={() => { setReplaceItemId(item.id); setShowFoodPicker(true); }}>Substituir pela Biblioteca</button></div><div className="nutrition-amount-control"><button onClick={() => updateAmount(item.id, Math.max(0, item.actualAmount - increment))}>−</button><label className="nutrition-amount"><input inputMode={food.unit === 'unit' ? 'numeric' : 'decimal'} type="text" value={String(item.actualAmount).replace('.', ',')} onChange={(event) => updateAmount(item.id, normalizeAmount(event.target.value, food))}/><span>{food.unit}</span></label><button onClick={() => updateAmount(item.id, item.actualAmount + increment)}>+</button>{item.plannedAmount === 0 && <button className="nutrition-remove-food" onClick={() => removeFoodFromMeal(item.id)}>×</button>}</div></article>; })}</section>{showFoodPicker && <MealFoodPicker onAdd={addFoodToMeal} onClose={() => { setShowFoodPicker(false); setReplaceItemId(null); }} replaceFoodId={replacingItem?.foodId} replaceAmount={replacingItem?.actualAmount} />}<footer className="nutrition-actions"><button className="nutrition-secondary" onClick={() => finishMeal('skipped')}>Pular refeição</button><button className="nutrition-primary" onClick={() => finishMeal('completed')}>Finalizar refeição</button></footer></main>;
  }

  if (view === 'library') return <NutritionLibraryView onBack={() => setView('home')} />;

  if (view === 'recipes') return <main className="nutrition-app"><BackHeader eyebrow="PREPARAÇÕES" title="Receitas TITAN" onBack={() => setView('home')} /><section className="nutrition-recipe-list">{TITAN_RECIPES.map((recipe) => { const macros = recipeMacros(recipe); return <article key={recipe.id}><div><strong>{recipe.name}</strong><small>{recipe.description}</small></div><p>{recipe.ingredients.map((ingredient) => `${getFoodById(ingredient.foodId)?.name ?? ingredient.foodId} · ${ingredient.amount}${getFoodById(ingredient.foodId)?.unit ?? ''}`).join(' • ')}</p><span>{macros.caloriesKcal} kcal • P {macros.proteinG} • C {macros.carbohydrateG} • G {macros.fatG}</span></article>; })}</section></main>;

  if (view === 'week') return <main className="nutrition-app"><BackHeader eyebrow="PLANEJAMENTO EDITÁVEL" title="Sua semana" onBack={() => setView('home')} /><div className="nutrition-week-actions"><button className="nutrition-secondary" onClick={() => { const defaults = resetWeeklyPlan(); setWeeklyPlans(defaults); }}>Restaurar padrão</button></div><section className="nutrition-week-list">{weeklyPlans.map((day) => { const macros = formatMacros(sumMacros(day.meals.flatMap((meal) => meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))))); return <article className="nutrition-week-card" key={day.id}><div className="nutrition-week-card-head"><div><span className="nutrition-eyebrow">{day.meals.length} REFEIÇÕES</span><h3>{day.label}</h3></div><b>{macros.caloriesKcal} kcal</b></div><p>P {macros.proteinG} g • C {macros.carbohydrateG} g • G {macros.fatG} g</p><div className="nutrition-week-meals editable">{day.meals.map((meal) => <div key={meal.id}><strong>{meal.time} · {meal.name}</strong><div className="nutrition-week-meal-actions"><button onClick={() => copyMealToNextDay(day.id, meal.id)}>Copiar para próximo dia</button></div>{meal.items.map((item) => { const food = getFoodById(item.foodId); if (!food) return null; return <label key={item.id}><span>{food.name}</span><input inputMode="decimal" value={item.plannedAmount} onChange={(event) => editWeeklyAmount(day.id, meal.id, item.id, normalizeAmount(event.target.value, food))}/><small>{food.unit}</small><span className="nutrition-week-item-actions"><button onClick={() => removeWeeklyItem(day.id, meal.id, item.id)}>Remover</button></span></label>; })}<div className="nutrition-week-add-select"><select defaultValue="" onChange={(event) => { addWeeklyFood(day.id, meal.id, event.target.value); event.currentTarget.value = ''; }}><option value="">+ Adicionar alimento…</option>{getAllFoods().map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}</select></div></div>)}</div></article>; })}</section></main>;

  if (view === 'shopping') return <main className="nutrition-app"><BackHeader eyebrow="7 DIAS" title="Lista de compras" onBack={() => setView('home')} /><section className="nutrition-shopping-intro"><strong>Compras da semana</strong><p>Atualiza automaticamente quando você altera o planejamento semanal.</p></section><section className="nutrition-shopping-list">{shoppingList.map((item) => <article key={item.foodId} className={shoppingChecked[item.foodId] ? 'is-checked' : ''} onClick={() => toggleShopping(item.foodId)}><input type="checkbox" readOnly checked={Boolean(shoppingChecked[item.foodId])}/><span><small>{item.category ?? 'Outros'}</small>{item.name}</span><strong>{item.amount.toLocaleString('pt-BR')} {item.unit}</strong></article>)}</section></main>;

  if (view === 'insights') {
    const coach = buildCoachMessage(history30, plannedMacros.caloriesKcal || 2900, plannedMacros.proteinG || 195);
    const avg = (field: 'calories' | 'protein' | 'carbs' | 'fat') => history30.length ? Math.round(history30.reduce((sum, day) => sum + day[field], 0) / history30.length) : 0;
    const avgCalories = avg('calories'); const avgProtein = avg('protein'); const avgCarbs = avg('carbs'); const avgFat = avg('fat');
    const adherence = plannedMacros.caloriesKcal > 0 && avgCalories > 0 ? Math.round((avgCalories / plannedMacros.caloriesKcal) * 100) : 0;
    return <main className="nutrition-app"><BackHeader eyebrow="EVOLUÇÃO E ADERÊNCIA" title="Coach TITAN" onBack={() => setView('home')} /><section className="nutrition-coach-card"><span className="nutrition-eyebrow">PRIORIDADE</span><p>{coach}</p></section><section className="nutrition-insight-summary"><article><small>Média kcal · até 30 dias</small><strong>{avgCalories || '—'}</strong></article><article><small>Aderência calórica</small><strong>{adherence ? `${adherence}%` : '—'}</strong></article><article><small>Proteína média</small><strong>{avgProtein ? `${avgProtein} g` : '—'}</strong></article><article><small>Carbo / gordura</small><strong>{avgCarbs || '—'} / {avgFat || '—'} g</strong></article></section><span className="nutrition-eyebrow">CALORIAS · ÚLTIMOS 7 DIAS</span><section className="nutrition-trend-chart">{history7.length ? history7.map((day) => <div className="nutrition-trend-column" key={day.date}><span style={{ height: `${Math.max(3, Math.min(100, (day.calories / Math.max(1, plannedMacros.caloriesKcal)) * 100))}%` }} /><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'narrow' })}</small></div>) : <small>Ainda não há dias suficientes para o gráfico.</small>}</section><section className="nutrition-history-list">{history30.slice().reverse().map((day) => <article key={day.date}><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span><strong>{day.calories} kcal</strong><small>P {day.protein} • C {day.carbs} • G {day.fat} g • {day.completedMeals} concluídas • {day.skippedMeals} puladas</small></article>)}</section></main>;
  }

  const calorieProgress = clampProgress(todayMacros.caloriesKcal, plannedMacros.caloriesKcal);
  const remainingCalories = Math.max(0, plannedMacros.caloriesKcal - todayMacros.caloriesKcal);
  const enriched = meals.map((meal) => ({ ...meal, status: mealStatusForTime(meal) }));
  const pending = enriched.filter((meal) => meal.status === 'pending');
  const next = enriched.find((meal) => meal.status === 'upcoming');
  const macroProgress = [{ label: 'Proteína', value: todayMacros.proteinG, target: plannedMacros.proteinG, short: 'P' }, { label: 'Carbo', value: todayMacros.carbohydrateG, target: plannedMacros.carbohydrateG, short: 'C' }, { label: 'Gordura', value: todayMacros.fatG, target: plannedMacros.fatG, short: 'G' }];
  const foodCount = getAllFoods().length;

  return <main className="nutrition-app"><header className="nutrition-home-header"><div><span className="nutrition-eyebrow">TITAN NUTRITION</span><h1>Hoje</h1></div><button className="nutrition-health-chip" onClick={() => void connectHealth()}>⌚ {healthMessage}</button></header><section className="nutrition-balance-card"><div className="nutrition-balance-heading"><div><span className="nutrition-eyebrow">BALANÇO DO DIA</span><h2>Consumo e gasto</h2></div><span className="nutrition-goal-pill">Meta {plannedMacros.caloriesKcal} kcal</span></div><div className="nutrition-balance-main"><div className="nutrition-calorie-ring"><svg viewBox="0 0 120 120"><circle className="nutrition-ring-track" cx="60" cy="60" r="50" pathLength="100"/><circle className="nutrition-ring-progress" cx="60" cy="60" r="50" pathLength="100" strokeDasharray="100" strokeDashoffset={animateDashboard ? 100 - calorieProgress * 100 : 100}/></svg><div className="nutrition-ring-copy"><strong>{todayMacros.caloriesKcal}</strong><span>de {plannedMacros.caloriesKcal} kcal</span></div></div><div className="nutrition-calorie-summary"><span className="nutrition-summary-label">Restante</span><strong>{remainingCalories} <small>kcal</small></strong><p>{Math.round(calorieProgress * 100)}% da meta alimentar</p></div></div><div className="nutrition-macro-progress-list">{macroProgress.map((macro) => <div className="nutrition-macro-progress" key={macro.label}><div className="nutrition-macro-progress-copy"><span><b>{macro.short}</b> {macro.label}</span><strong>{macro.value} <small>/ {macro.target} g</small></strong></div><div className="nutrition-progress-track"><span style={{ width: animateDashboard ? `${clampProgress(macro.value, macro.target) * 100}%` : '0%' }}/></div></div>)}</div><div className={`nutrition-activity-panel${activity ? ' has-data' : ''}`}><div className="nutrition-activity-title"><span>⌚ Gasto energético</span><small>{activity ? healthSourceLabel(activity) : 'Relógio não sincronizado'}</small></div><div className="nutrition-total-burn"><small>Gasto total estimado até agora</small><strong>{expenditure.totalElapsed.toLocaleString('pt-BR')} <span>kcal</span></strong></div><div className="nutrition-energy-grid"><div><small>Basal até agora</small><strong>{expenditure.basalElapsed} <span>kcal</span></strong></div><div><small>Atividade</small><strong>{expenditure.activeCalories} <span>kcal</span></strong></div><div><small>Treino</small><strong>incluído <span>na atividade</span></strong></div><div><small>Projeção mínima do dia</small><strong>{expenditure.projectedTotalDay} <span>kcal</span></strong></div></div><div className="nutrition-activity-metrics"><div><small>Calorias ativas</small><strong>{Math.round(activity?.activeCalories ?? 0)} <span>kcal</span></strong></div><div><small>Passos</small><strong>{Math.round(activity?.steps ?? 0).toLocaleString('pt-BR')}</strong></div><div><small>Tempo ativo</small><strong>{Math.round(activity?.activeMinutes ?? 0)} <span>min</span></strong></div></div><small className="nutrition-burn-note">Basal de referência: {expenditure.projectedBasalDay} kcal/dia. O relógio não separa sempre as calorias do treino das demais calorias ativas; por isso não duplicamos esse gasto e não adicionamos calorias automaticamente à dieta.</small>{!activity && <button className="nutrition-connect-inline" onClick={() => void connectHealth()}>Conectar relógio</button>}</div></section><section className="nutrition-quick-grid nutrition-quick-grid-5"><button onClick={() => setView('library')}><span>◫</span><strong>Biblioteca</strong><small>{foodCount} alimentos</small></button><button onClick={() => setView('week')}><span>▦</span><strong>Semana</strong><small>Editar plano</small></button><button onClick={() => setView('shopping')}><span>🛒</span><strong>Compras</strong><small>Checklist</small></button><button onClick={() => setView('recipes')}><span>🥤</span><strong>Receitas</strong><small>{TITAN_RECIPES.length} preparações</small></button><button onClick={() => setView('insights')}><span>◆</span><strong>Coach</strong><small>7/30 dias</small></button></section>{pending.length > 0 && <section className="nutrition-section"><h2>Pendentes</h2>{pending.map((meal) => <button className="nutrition-meal-card is-pending" key={meal.id} onClick={() => setActiveMealId(meal.id)}><span><small>{meal.time}</small><strong>{meal.name}</strong></span><b>Pendente</b></button>)}</section>}{next && <section className="nutrition-section"><h2>Próxima refeição</h2><article className="nutrition-next-card"><div><span className="nutrition-eyebrow">{next.time}</span><h3>{next.name}</h3><p>{next.items.length} itens planejados</p></div><button className="nutrition-primary" onClick={() => setActiveMealId(next.id)}>Iniciar refeição</button></article></section>}<section className="nutrition-section"><h2>Seu dia</h2><div className="nutrition-timeline">{enriched.map((meal) => <button key={meal.id} className={`nutrition-timeline-row is-${meal.status}`} onClick={() => setActiveMealId(meal.id)}><span className="nutrition-time">{meal.time}</span><span className="nutrition-dot"/><span className="nutrition-timeline-copy"><strong>{meal.name}</strong><small>{meal.status === 'completed' ? 'Concluída' : meal.status === 'skipped' ? 'Pulada' : meal.status === 'pending' ? 'Pendente' : 'Programada'}</small></span></button>)}</div></section></main>;
}
