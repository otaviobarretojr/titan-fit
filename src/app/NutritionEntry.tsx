import { useEffect, useMemo, useState } from 'react';
import {
  readDailyActivitySummary,
  requestHealthPermissions,
  requestSamsungHealthPermissions,
  samsungHealthStatus,
} from '../features/health/bridge';
import type { DailyActivitySummary } from '../features/health/types';
import { DEFAULT_MEALS } from '../features/nutrition/defaultPlan';
import { calculateFoodMacros, formatMacros, mealStatusForTime, sumMacros } from '../features/nutrition/engine';
import { getFood } from '../features/nutrition/foodLibrary';
import { loadDailyMeals, saveDailyMeals } from '../features/nutrition/storage';
import type { Food, PlannedMeal } from '../features/nutrition/types';

function normalizeAmount(raw: string, food: Food): number {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) return 0;
  const parsed = Number(normalized);
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

export function NutritionEntry() {
  const [meals, setMeals] = useState<PlannedMeal[]>(DEFAULT_MEALS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activity, setActivity] = useState<DailyActivitySummary | null>(null);
  const [healthMessage, setHealthMessage] = useState('Conectar relógio');
  const [animateDashboard, setAnimateDashboard] = useState(false);
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

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshActivity();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const frame = requestAnimationFrame(() => setAnimateDashboard(true));
    return () => cancelAnimationFrame(frame);
  }, [isLoading]);

  const todayMacros = useMemo(() => formatMacros(sumMacros(meals.filter((meal) => meal.status === 'completed').flatMap((meal) => meal.items))), [meals]);
  const plannedMacros = useMemo(() => formatMacros(sumMacros(meals.flatMap((meal) => meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))))), [meals]);
  const calorieProgress = clampProgress(todayMacros.caloriesKcal, plannedMacros.caloriesKcal);
  const remainingCalories = Math.max(0, plannedMacros.caloriesKcal - todayMacros.caloriesKcal);
  const macroProgress = [
    { label: 'Proteína', value: todayMacros.proteinG, target: plannedMacros.proteinG, short: 'P' },
    { label: 'Carbo', value: todayMacros.carbohydrateG, target: plannedMacros.carbohydrateG, short: 'C' },
    { label: 'Gordura', value: todayMacros.fatG, target: plannedMacros.fatG, short: 'G' },
  ];

  function persist(next: PlannedMeal[]) {
    setMeals(next);
    void saveDailyMeals(next);
  }

  async function connectHealth() {
    setHealthMessage('Conectando…');
    try {
      const samsungStatus = await samsungHealthStatus();
      if (samsungStatus.available) {
        const samsungPermission = samsungStatus.granted ? samsungStatus : await requestSamsungHealthPermissions();
        if (samsungPermission.granted) {
          const directActivity = await refreshActivity();
          if (directActivity) return;
        }
      }

      const granted = await requestHealthPermissions(['steps', 'active-calories', 'distance', 'exercise']);
      if (!granted) {
        setHealthMessage('Autorize Samsung Health/Health Connect');
        return;
      }

      const dailyActivity = await refreshActivity();
      if (!dailyActivity) setHealthMessage('Autorizado • sem dados de hoje');
    } catch {
      setHealthMessage('Falha ao ler dados de saúde');
    }
  }

  function updateAmount(itemId: string, amount: number) {
    if (!activeMeal) return;
    persist(meals.map((meal) => meal.id !== activeMeal.id ? meal : {
      ...meal,
      items: meal.items.map((item) => item.id === itemId ? { ...item, actualAmount: Math.max(0, amount) } : item),
    }));
  }

  function finishMeal(status: 'completed' | 'skipped') {
    if (!activeMeal) return;
    persist(meals.map((meal) => meal.id === activeMeal.id ? { ...meal, status } : meal));
    setActiveMealId(null);
  }

  if (isLoading) {
    return <main className="nutrition-app nutrition-loading"><span className="nutrition-eyebrow">TITAN NUTRITION</span><h1>Preparando seu dia…</h1></main>;
  }

  if (activeMeal) {
    const macros = formatMacros(sumMacros(activeMeal.items));
    return <main className="nutrition-app nutrition-meal-mode">
      <header className="nutrition-header">
        <button className="nutrition-back" onClick={() => setActiveMealId(null)}>←</button>
        <div><span className="nutrition-eyebrow">REFEIÇÃO • {activeMeal.time}</span><h1>{activeMeal.name}</h1></div>
      </header>

      <section className="nutrition-macro-strip">
        <strong>{macros.caloriesKcal} kcal</strong><span>P {macros.proteinG} g</span><span>C {macros.carbohydrateG} g</span><span>G {macros.fatG} g</span>
      </section>

      <section className="nutrition-items">
        {activeMeal.items.map((item) => {
          const food = getFood(item.foodId);
          if (!food) return null;
          const itemMacros = formatMacros(calculateFoodMacros(item.foodId, item.actualAmount));
          const unusuallyHigh = item.plannedAmount > 0 && item.actualAmount > item.plannedAmount * 3;
          const increment = food.unit === 'unit' ? 1 : 5;
          return <article className={`nutrition-food-card${unusuallyHigh ? ' is-warning' : ''}`} key={item.id}>
            <div className="nutrition-food-copy">
              <strong>{food.name}</strong>
              <small>Planejado: {item.plannedAmount} {food.unit}</small>
              <small className="nutrition-item-macros">{itemMacros.caloriesKcal} kcal • P {itemMacros.proteinG} • C {itemMacros.carbohydrateG} • G {itemMacros.fatG}</small>
              {unusuallyHigh && <small className="nutrition-amount-warning">Quantidade muito acima do planejado — confira.</small>}
            </div>
            <div className="nutrition-amount-control">
              <button type="button" aria-label={`Diminuir ${food.name}`} onClick={() => updateAmount(item.id, Math.max(0, item.actualAmount - increment))}>−</button>
              <label className="nutrition-amount">
                <input
                  inputMode={food.unit === 'unit' ? 'numeric' : 'decimal'}
                  type="text"
                  value={String(item.actualAmount).replace('.', ',')}
                  onChange={(event) => updateAmount(item.id, normalizeAmount(event.target.value, food))}
                  aria-label={`Quantidade consumida de ${food.name}`}
                />
                <span>{food.unit}</span>
              </label>
              <button type="button" aria-label={`Aumentar ${food.name}`} onClick={() => updateAmount(item.id, item.actualAmount + increment)}>+</button>
            </div>
          </article>;
        })}
      </section>

      <footer className="nutrition-actions">
        <button className="nutrition-secondary" onClick={() => finishMeal('skipped')}>Pular refeição</button>
        <button className="nutrition-primary" onClick={() => finishMeal('completed')}>Finalizar refeição</button>
      </footer>
    </main>;
  }

  const enriched = meals.map((meal) => ({ ...meal, status: mealStatusForTime(meal) }));
  const pending = enriched.filter((meal) => meal.status === 'pending');
  const next = enriched.find((meal) => meal.status === 'upcoming');

  return <main className="nutrition-app">
    <header className="nutrition-home-header">
      <div><span className="nutrition-eyebrow">TITAN NUTRITION</span><h1>Hoje</h1></div>
      <button className="nutrition-health-chip" onClick={() => void connectHealth()}>⌚ {healthMessage}</button>
    </header>

    <section className="nutrition-balance-card">
      <div className="nutrition-balance-heading">
        <div><span className="nutrition-eyebrow">BALANÇO DO DIA</span><h2>Consumo e atividade</h2></div>
        <span className="nutrition-goal-pill">Meta {plannedMacros.caloriesKcal} kcal</span>
      </div>

      <div className="nutrition-balance-main">
        <div className="nutrition-calorie-ring" aria-label={`${todayMacros.caloriesKcal} de ${plannedMacros.caloriesKcal} calorias consumidas`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="nutrition-ring-track" cx="60" cy="60" r="50" pathLength="100" />
            <circle className="nutrition-ring-progress" cx="60" cy="60" r="50" pathLength="100" strokeDasharray="100" strokeDashoffset={animateDashboard ? 100 - calorieProgress * 100 : 100} />
          </svg>
          <div className="nutrition-ring-copy"><strong>{todayMacros.caloriesKcal}</strong><span>de {plannedMacros.caloriesKcal} kcal</span></div>
        </div>

        <div className="nutrition-calorie-summary">
          <span className="nutrition-summary-label">Restante</span>
          <strong>{remainingCalories} <small>kcal</small></strong>
          <p>{Math.round(calorieProgress * 100)}% da meta alimentar de hoje</p>
        </div>
      </div>

      <div className="nutrition-macro-progress-list">
        {macroProgress.map((macro) => {
          const progress = clampProgress(macro.value, macro.target);
          return <div className="nutrition-macro-progress" key={macro.label}>
            <div className="nutrition-macro-progress-copy">
              <span><b>{macro.short}</b> {macro.label}</span>
              <strong>{macro.value} <small>/ {macro.target} g</small></strong>
            </div>
            <div className="nutrition-progress-track"><span style={{ width: animateDashboard ? `${progress * 100}%` : '0%' }} /></div>
          </div>;
        })}
      </div>

      <div className={`nutrition-activity-panel${activity ? ' has-data' : ''}`}>
        <div className="nutrition-activity-title">
          <span>⌚ Atividade</span>
          <small>{activity ? healthSourceLabel(activity) : 'Relógio não sincronizado'}</small>
        </div>
        <div className="nutrition-activity-metrics">
          <div><small>Calorias ativas</small><strong>{Math.round(activity?.activeCalories ?? 0)} <span>kcal</span></strong></div>
          <div><small>Passos</small><strong>{Math.round(activity?.steps ?? 0).toLocaleString('pt-BR')}</strong></div>
          <div><small>Tempo ativo</small><strong>{Math.round(activity?.activeMinutes ?? 0)} <span>min</span></strong></div>
        </div>
        {!activity && <button type="button" className="nutrition-connect-inline" onClick={() => void connectHealth()}>Conectar relógio</button>}
      </div>
    </section>

    {pending.length > 0 && <section className="nutrition-section"><h2>Pendentes</h2>{pending.map((meal) => <button className="nutrition-meal-card is-pending" key={meal.id} onClick={() => setActiveMealId(meal.id)}><span><small>{meal.time}</small><strong>{meal.name}</strong></span><b>Pendente</b></button>)}</section>}

    {next && <section className="nutrition-section"><h2>Próxima refeição</h2><article className="nutrition-next-card"><div><span className="nutrition-eyebrow">{next.time}</span><h3>{next.name}</h3><p>{next.items.length} itens planejados</p></div><button className="nutrition-primary" onClick={() => setActiveMealId(next.id)}>Iniciar refeição</button></article></section>}

    <section className="nutrition-section"><h2>Seu dia</h2><div className="nutrition-timeline">{enriched.map((meal) => <button key={meal.id} className={`nutrition-timeline-row is-${meal.status}`} onClick={() => setActiveMealId(meal.id)}><span className="nutrition-time">{meal.time}</span><span className="nutrition-dot"/><span className="nutrition-timeline-copy"><strong>{meal.name}</strong><small>{meal.status === 'completed' ? 'Concluída' : meal.status === 'skipped' ? 'Pulada' : meal.status === 'pending' ? 'Pendente' : 'Programada'}</small></span></button>)}</div></section>
  </main>;
}
