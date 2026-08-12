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
import { WEEKLY_NUTRITION_PLAN } from '../features/nutrition/weeklyPlan';

type AppView = 'home' | 'library' | 'week' | 'shopping';

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
  const [isLoading, setIsLoading] = useState(true);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activity, setActivity] = useState<DailyActivitySummary | null>(null);
  const [healthMessage, setHealthMessage] = useState('Conectar relógio');
  const [animateDashboard, setAnimateDashboard] = useState(false);
  const [view, setView] = useState<AppView>('home');
  const [showFoodPicker, setShowFoodPicker] = useState(false);
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
  const shoppingList = useMemo(() => buildWeeklyShoppingList(), []);

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
    const next = meals.map((meal) => meal.id !== activeMeal.id ? meal : {
      ...meal,
      items: [...meal.items, { id: `${meal.id}-${food.id}-${Date.now()}`, foodId: food.id, plannedAmount: 0, actualAmount: amount }],
    });
    persist(next);
    setShowFoodPicker(false);
  }

  function removeFoodFromMeal(itemId: string) {
    if (!activeMeal) return;
    persist(meals.map((meal) => meal.id !== activeMeal.id ? meal : { ...meal, items: meal.items.filter((item) => item.id !== itemId) }));
  }

  function finishMeal(status: 'completed' | 'skipped') {
    if (!activeMeal) return;
    persist(meals.map((meal) => meal.id === activeMeal.id ? { ...meal, status } : meal));
    setActiveMealId(null);
    setShowFoodPicker(false);
  }

  if (isLoading) return <main className="nutrition-app nutrition-loading"><span className="nutrition-eyebrow">TITAN NUTRITION</span><h1>Preparando seu dia…</h1></main>;

  if (activeMeal) {
    const macros = formatMacros(sumMacros(activeMeal.items));
    return <main className="nutrition-app nutrition-meal-mode">
      <BackHeader eyebrow={`REFEIÇÃO • ${activeMeal.time}`} title={activeMeal.name} onBack={() => { setActiveMealId(null); setShowFoodPicker(false); }} />
      <section className="nutrition-macro-strip"><strong>{macros.caloriesKcal} kcal</strong><span>P {macros.proteinG} g</span><span>C {macros.carbohydrateG} g</span><span>G {macros.fatG} g</span></section>
      <button className="nutrition-primary nutrition-meal-add" onClick={() => setShowFoodPicker(true)}>+ Adicionar alimento da Biblioteca</button>
      <section className="nutrition-items">{activeMeal.items.map((item) => {
        const food = getFoodById(item.foodId); if (!food) return null;
        const itemMacros = formatMacros(calculateFoodMacros(item.foodId, item.actualAmount));
        const unusuallyHigh = item.plannedAmount > 0 && item.actualAmount > item.plannedAmount * 3;
        const increment = food.unit === 'unit' ? 1 : 5;
        return <article className={`nutrition-food-card${unusuallyHigh ? ' is-warning' : ''}`} key={item.id}>
          <div className="nutrition-food-copy"><strong>{food.name}</strong><small>{item.plannedAmount > 0 ? `Planejado: ${item.plannedAmount} ${food.unit}` : 'Adicionado nesta refeição'}</small><small className="nutrition-item-macros">{itemMacros.caloriesKcal} kcal • P {itemMacros.proteinG} • C {itemMacros.carbohydrateG} • G {itemMacros.fatG}</small>{unusuallyHigh && <small className="nutrition-amount-warning">Quantidade muito acima do planejado — confira.</small>}</div>
          <div className="nutrition-amount-control"><button onClick={() => updateAmount(item.id, Math.max(0, item.actualAmount - increment))}>−</button><label className="nutrition-amount"><input inputMode={food.unit === 'unit' ? 'numeric' : 'decimal'} type="text" value={String(item.actualAmount).replace('.', ',')} onChange={(event) => updateAmount(item.id, normalizeAmount(event.target.value, food))}/><span>{food.unit}</span></label><button onClick={() => updateAmount(item.id, item.actualAmount + increment)}>+</button>{item.plannedAmount === 0 && <button className="nutrition-remove-food" onClick={() => removeFoodFromMeal(item.id)}>×</button>}</div>
        </article>;
      })}</section>
      {showFoodPicker && <MealFoodPicker onAdd={addFoodToMeal} onClose={() => setShowFoodPicker(false)} />}
      <footer className="nutrition-actions"><button className="nutrition-secondary" onClick={() => finishMeal('skipped')}>Pular refeição</button><button className="nutrition-primary" onClick={() => finishMeal('completed')}>Finalizar refeição</button></footer>
    </main>;
  }

  if (view === 'library') return <NutritionLibraryView onBack={() => setView('home')} />;

  if (view === 'week') return <main className="nutrition-app"><BackHeader eyebrow="PLANEJAMENTO" title="Sua semana" onBack={() => setView('home')} />
    <section className="nutrition-week-list">{WEEKLY_NUTRITION_PLAN.map((day) => {
      const macros = formatMacros(sumMacros(day.meals.flatMap((meal) => meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount })))));
      return <article className="nutrition-week-card" key={day.id}><div className="nutrition-week-card-head"><div><span className="nutrition-eyebrow">{day.meals.length} REFEIÇÕES</span><h3>{day.label}</h3></div><b>{macros.caloriesKcal} kcal</b></div><p>P {macros.proteinG} g • C {macros.carbohydrateG} g • G {macros.fatG} g</p><div className="nutrition-week-meals">{day.meals.map((meal) => <span key={meal.id}>{meal.time} · {meal.name}</span>)}</div></article>;
    })}</section>
  </main>;

  if (view === 'shopping') return <main className="nutrition-app"><BackHeader eyebrow="7 DIAS" title="Lista de compras" onBack={() => setView('home')} />
    <section className="nutrition-shopping-intro"><strong>Compras da semana</strong><p>Quantidades calculadas automaticamente a partir do seu planejamento atual.</p></section>
    <section className="nutrition-shopping-list">{shoppingList.map((item) => <article key={item.foodId}><span>{item.name}</span><strong>{item.amount.toLocaleString('pt-BR')} {item.unit}</strong></article>)}</section>
  </main>;

  const calorieProgress = clampProgress(todayMacros.caloriesKcal, plannedMacros.caloriesKcal);
  const remainingCalories = Math.max(0, plannedMacros.caloriesKcal - todayMacros.caloriesKcal);
  const enriched = meals.map((meal) => ({ ...meal, status: mealStatusForTime(meal) }));
  const pending = enriched.filter((meal) => meal.status === 'pending');
  const next = enriched.find((meal) => meal.status === 'upcoming');
  const macroProgress = [
    { label: 'Proteína', value: todayMacros.proteinG, target: plannedMacros.proteinG, short: 'P' },
    { label: 'Carbo', value: todayMacros.carbohydrateG, target: plannedMacros.carbohydrateG, short: 'C' },
    { label: 'Gordura', value: todayMacros.fatG, target: plannedMacros.fatG, short: 'G' },
  ];
  const foodCount = getAllFoods().length;

  return <main className="nutrition-app">
    <header className="nutrition-home-header"><div><span className="nutrition-eyebrow">TITAN NUTRITION</span><h1>Hoje</h1></div><button className="nutrition-health-chip" onClick={() => void connectHealth()}>⌚ {healthMessage}</button></header>
    <section className="nutrition-balance-card"><div className="nutrition-balance-heading"><div><span className="nutrition-eyebrow">BALANÇO DO DIA</span><h2>Consumo e atividade</h2></div><span className="nutrition-goal-pill">Meta {plannedMacros.caloriesKcal} kcal</span></div><div className="nutrition-balance-main"><div className="nutrition-calorie-ring"><svg viewBox="0 0 120 120"><circle className="nutrition-ring-track" cx="60" cy="60" r="50" pathLength="100"/><circle className="nutrition-ring-progress" cx="60" cy="60" r="50" pathLength="100" strokeDasharray="100" strokeDashoffset={animateDashboard ? 100 - calorieProgress * 100 : 100}/></svg><div className="nutrition-ring-copy"><strong>{todayMacros.caloriesKcal}</strong><span>de {plannedMacros.caloriesKcal} kcal</span></div></div><div className="nutrition-calorie-summary"><span className="nutrition-summary-label">Restante</span><strong>{remainingCalories} <small>kcal</small></strong><p>{Math.round(calorieProgress * 100)}% da meta alimentar de hoje</p></div></div><div className="nutrition-macro-progress-list">{macroProgress.map((macro) => <div className="nutrition-macro-progress" key={macro.label}><div className="nutrition-macro-progress-copy"><span><b>{macro.short}</b> {macro.label}</span><strong>{macro.value} <small>/ {macro.target} g</small></strong></div><div className="nutrition-progress-track"><span style={{ width: animateDashboard ? `${clampProgress(macro.value, macro.target) * 100}%` : '0%' }}/></div></div>)}</div><div className={`nutrition-activity-panel${activity ? ' has-data' : ''}`}><div className="nutrition-activity-title"><span>⌚ Atividade</span><small>{activity ? healthSourceLabel(activity) : 'Relógio não sincronizado'}</small></div><div className="nutrition-activity-metrics"><div><small>Calorias ativas</small><strong>{Math.round(activity?.activeCalories ?? 0)} <span>kcal</span></strong></div><div><small>Passos</small><strong>{Math.round(activity?.steps ?? 0).toLocaleString('pt-BR')}</strong></div><div><small>Tempo ativo</small><strong>{Math.round(activity?.activeMinutes ?? 0)} <span>min</span></strong></div></div>{!activity && <button className="nutrition-connect-inline" onClick={() => void connectHealth()}>Conectar relógio</button>}</div></section>
    <section className="nutrition-quick-grid"><button onClick={() => setView('library')}><span>◫</span><strong>Biblioteca</strong><small>{foodCount} alimentos</small></button><button onClick={() => setView('week')}><span>▦</span><strong>Semana</strong><small>7 dias</small></button><button onClick={() => setView('shopping')}><span>🛒</span><strong>Compras</strong><small>Lista automática</small></button></section>
    {pending.length > 0 && <section className="nutrition-section"><h2>Pendentes</h2>{pending.map((meal) => <button className="nutrition-meal-card is-pending" key={meal.id} onClick={() => setActiveMealId(meal.id)}><span><small>{meal.time}</small><strong>{meal.name}</strong></span><b>Pendente</b></button>)}</section>}
    {next && <section className="nutrition-section"><h2>Próxima refeição</h2><article className="nutrition-next-card"><div><span className="nutrition-eyebrow">{next.time}</span><h3>{next.name}</h3><p>{next.items.length} itens planejados</p></div><button className="nutrition-primary" onClick={() => setActiveMealId(next.id)}>Iniciar refeição</button></article></section>}
    <section className="nutrition-section"><h2>Seu dia</h2><div className="nutrition-timeline">{enriched.map((meal) => <button key={meal.id} className={`nutrition-timeline-row is-${meal.status}`} onClick={() => setActiveMealId(meal.id)}><span className="nutrition-time">{meal.time}</span><span className="nutrition-dot"/><span className="nutrition-timeline-copy"><strong>{meal.name}</strong><small>{meal.status === 'completed' ? 'Concluída' : meal.status === 'skipped' ? 'Pulada' : meal.status === 'pending' ? 'Pendente' : 'Programada'}</small></span></button>)}</div></section>
  </main>;
}
