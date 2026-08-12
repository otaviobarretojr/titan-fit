import { useEffect, useMemo, useState } from 'react';
import { readDailyActivitySummary, requestHealthPermissions } from '../features/health/bridge';
import type { DailyActivitySummary } from '../features/health/types';
import { DEFAULT_MEALS } from '../features/nutrition/defaultPlan';
import { formatMacros, mealStatusForTime, sumMacros } from '../features/nutrition/engine';
import { getFood } from '../features/nutrition/foodLibrary';
import { loadDailyMeals, saveDailyMeals } from '../features/nutrition/storage';
import type { PlannedMeal } from '../features/nutrition/types';

export function NutritionEntry() {
  const [meals, setMeals] = useState<PlannedMeal[]>(DEFAULT_MEALS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activity, setActivity] = useState<DailyActivitySummary | null>(null);
  const [healthMessage, setHealthMessage] = useState('Conectar relógio');
  const activeMeal = meals.find((meal) => meal.id === activeMealId) ?? null;

  useEffect(() => {
    let mounted = true;
    void Promise.all([loadDailyMeals(), readDailyActivitySummary()]).then(([storedMeals, dailyActivity]) => {
      if (!mounted) return;
      setMeals(storedMeals);
      setActivity(dailyActivity);
      setHealthMessage(dailyActivity ? 'Relógio conectado' : 'Conectar relógio');
      setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const todayMacros = useMemo(() => formatMacros(sumMacros(meals.filter((meal) => meal.status === 'completed').flatMap((meal) => meal.items))), [meals]);

  function persist(next: PlannedMeal[]) {
    setMeals(next);
    void saveDailyMeals(next);
  }

  async function connectHealth() {
    setHealthMessage('Conectando…');
    try {
      const granted = await requestHealthPermissions(['steps', 'active-calories', 'distance', 'exercise']);
      if (!granted) {
        setHealthMessage('Autorize o acesso à saúde');
        return;
      }
      const dailyActivity = await readDailyActivitySummary();
      setActivity(dailyActivity);
      setHealthMessage(dailyActivity ? 'Relógio conectado' : 'Sem dados de hoje');
    } catch {
      setHealthMessage('Não foi possível conectar');
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
          return <article className="nutrition-food-card" key={item.id}>
            <div className="nutrition-food-copy"><strong>{food.name}</strong><small>Planejado: {item.plannedAmount} {food.unit}</small></div>
            <label className="nutrition-amount"><input inputMode="decimal" type="number" min="0" step={food.unit === 'unit' ? 1 : 5} value={item.actualAmount} onChange={(event) => updateAmount(item.id, Number(event.target.value))} /><span>{food.unit}</span></label>
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
    <header className="nutrition-home-header"><div><span className="nutrition-eyebrow">TITAN NUTRITION</span><h1>Hoje</h1></div><button className="nutrition-health-chip" onClick={() => void connectHealth()}>⌚ {healthMessage}</button></header>

    <section className="nutrition-summary-card">
      <div><small>Consumido</small><strong>{todayMacros.caloriesKcal} kcal</strong></div>
      <div className="nutrition-summary-macros"><span>Proteína <b>{todayMacros.proteinG} g</b></span><span>Carbo <b>{todayMacros.carbohydrateG} g</b></span><span>Gordura <b>{todayMacros.fatG} g</b></span></div>
    </section>

    <section className="nutrition-health-card">
      <div><small>Calorias ativas</small><strong>{Math.round(activity?.activeCalories ?? 0)} kcal</strong></div>
      <div><small>Passos</small><strong>{Math.round(activity?.steps ?? 0).toLocaleString('pt-BR')}</strong></div>
      <div><small>Distância</small><strong>{((activity?.distanceMeters ?? 0) / 1000).toFixed(1)} km</strong></div>
      <p>{activity ? 'Dados de atividade de hoje recebidos do relógio/Health Connect.' : 'Conecte o relógio para acompanhar o gasto de atividade junto da alimentação.'}</p>
    </section>

    {pending.length > 0 && <section className="nutrition-section"><h2>Pendentes</h2>{pending.map((meal) => <button className="nutrition-meal-card is-pending" key={meal.id} onClick={() => setActiveMealId(meal.id)}><span><small>{meal.time}</small><strong>{meal.name}</strong></span><b>Pendente</b></button>)}</section>}

    {next && <section className="nutrition-section"><h2>Próxima refeição</h2><article className="nutrition-next-card"><div><span className="nutrition-eyebrow">{next.time}</span><h3>{next.name}</h3><p>{next.items.length} itens planejados</p></div><button className="nutrition-primary" onClick={() => setActiveMealId(next.id)}>Iniciar refeição</button></article></section>}

    <section className="nutrition-section"><h2>Seu dia</h2><div className="nutrition-timeline">{enriched.map((meal) => <button key={meal.id} className={`nutrition-timeline-row is-${meal.status}`} onClick={() => setActiveMealId(meal.id)}><span className="nutrition-time">{meal.time}</span><span className="nutrition-dot"/><span className="nutrition-timeline-copy"><strong>{meal.name}</strong><small>{meal.status === 'completed' ? 'Concluída' : meal.status === 'skipped' ? 'Pulada' : meal.status === 'pending' ? 'Pendente' : 'Programada'}</small></span></button>)}</div></section>
  </main>;
}
