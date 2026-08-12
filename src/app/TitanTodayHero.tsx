import { useEffect, useMemo, useState } from 'react';
import { readDailyActivitySummary, requestHealthPermissions, requestSamsungHealthPermissions, samsungHealthStatus } from '../features/health/bridge';
import type { DailyActivitySummary } from '../features/health/types';
import { estimateEnergyExpenditure } from '../features/nutrition/advanced';
import { formatMacros, sumMacros } from '../features/nutrition/engine';
import { addHydration, hydrationPace, hydrationTotal, loadTodayHydration, readHydrationHistory, setHydrationGoal, undoLastHydration, type HydrationDay } from '../features/nutrition/hydration';
import { loadNutritionSettings, saveNutritionSettings, type NutritionSettings } from '../features/nutrition/settings';
import { loadDailyMeals } from '../features/nutrition/storage';
import type { PlannedMeal } from '../features/nutrition/types';

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
function signed(value: number) { return `${value > 0 ? '+' : ''}${value}`; }

function sourceLabel(activity: DailyActivitySummary | null) {
  if (!activity) return 'Conectar relógio';
  if (activity.source === 'samsung-health') return 'Samsung Health';
  if (activity.source === 'health-connect-aggregate') return 'Health Connect';
  return 'Relógio conectado';
}

function balanceState(balance: number, settings: NutritionSettings) {
  if (balance >= settings.balanceMin && balance <= settings.balanceMax) return { label: 'Na meta', detail: 'Saldo dentro da faixa-alvo', className: 'is-range' };
  if (balance < settings.balanceMin - 300) return { label: 'Déficit alto', detail: 'Gasto muito acima do consumo-alvo', className: 'is-low' };
  if (balance < settings.balanceMin) return { label: 'Abaixo da meta', detail: 'Déficit maior que o planejado', className: 'is-soft-low' };
  if (balance > 0) return { label: 'Superávit', detail: 'Consumo projetado acima do gasto', className: 'is-high' };
  return { label: 'Acima da meta', detail: 'Déficit menor que o planejado', className: 'is-soft-high' };
}

export function TitanTodayHero() {
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [activity, setActivity] = useState<DailyActivitySummary | null>(null);
  const [healthBusy, setHealthBusy] = useState(false);
  const [settings, setSettings] = useState<NutritionSettings>(() => loadNutritionSettings());
  const [water, setWater] = useState<HydrationDay>(() => loadTodayHydration());
  const [waterOpen, setWaterOpen] = useState(false);
  const [customMl, setCustomMl] = useState('');

  async function refresh() {
    const [dailyMeals, dailyActivity] = await Promise.all([loadDailyMeals(), readDailyActivitySummary()]);
    setMeals(dailyMeals);
    setActivity(dailyActivity);
    setWater(loadTodayHydration());
    setSettings(loadNutritionSettings());
  }

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 12000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onSettings = () => void refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('titan-nutrition-settings-updated', onSettings);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('titan-nutrition-settings-updated', onSettings); };
  }, []);

  async function connectHealth() {
    setHealthBusy(true);
    try {
      const samsung = await samsungHealthStatus();
      if (samsung.available) {
        const granted = samsung.granted ? samsung : await requestSamsungHealthPermissions();
        if (granted.granted) { await refresh(); return; }
      }
      await requestHealthPermissions(['steps', 'active-calories', 'distance', 'exercise']);
      await refresh();
    } finally { setHealthBusy(false); }
  }

  const consumed = useMemo(() => formatMacros(sumMacros(meals.filter((meal) => meal.status === 'completed').flatMap((meal) => meal.items))), [meals]);
  const planned = useMemo(() => formatMacros(sumMacros(meals.flatMap((meal) => meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))))), [meals]);
  const expenditure = estimateEnergyExpenditure(activity?.activeCalories ?? 0);
  const currentBalance = Math.round(consumed.caloriesKcal - expenditure.totalElapsed);
  const projectedBalance = Math.round(settings.calorieTarget - expenditure.projectedTotalDay);
  const state = balanceState(projectedBalance, settings);
  const intakeProgress = clamp(consumed.caloriesKcal / Math.max(1, settings.calorieTarget));
  const burnProgress = clamp(expenditure.totalElapsed / Math.max(1, expenditure.projectedTotalDay));
  const circumference = 100;
  const waterMl = hydrationTotal(water);
  const waterProgress = clamp(waterMl / Math.max(1, water.goalMl));
  const pace = hydrationPace(water, settings.wakeTime, settings.sleepTime);
  const waterHistory = readHydrationHistory(7);

  function registerWater(amount: number) {
    if (!amount) return;
    setWater(addHydration(amount));
    setCustomMl('');
  }

  function changeWaterGoal(goal: number) {
    const nextSettings = saveNutritionSettings({ ...settings, hydrationGoalMl: goal });
    setSettings(nextSettings);
    setWater(setHydrationGoal(goal));
  }

  const macros = [
    { label: 'Proteína', value: consumed.proteinG, target: settings.proteinTarget, unit: 'g' },
    { label: 'Carboidratos', value: consumed.carbohydrateG, target: planned.carbohydrateG, unit: 'g' },
    { label: 'Gorduras', value: consumed.fatG, target: planned.fatG, unit: 'g' },
  ];

  return <section className="titan-v4-home-head">
    <header className="titan-v4-brandbar"><div><strong>TITAN</strong><span>NUTRITION</span></div><button onClick={() => void connectHealth()} disabled={healthBusy}>⌚ {healthBusy ? 'Sincronizando…' : sourceLabel(activity)}</button></header>

    <article className={`titan-metabolic-card ${state.className}`}>
      <div className="titan-metabolic-title"><div><span>BALANÇO ENERGÉTICO</span><small>Consumo × gasto em tempo real</small></div><div className="titan-surplus-target"><small>Faixa alvo</small><strong>{signed(settings.balanceMin)} a {signed(settings.balanceMax)}</strong><small>kcal</small></div></div>
      <div className="titan-metabolic-core">
        <div className="titan-side-stat is-intake"><small>CONSUMIDO</small><strong>{consumed.caloriesKcal.toLocaleString('pt-BR')}</strong><span>de {settings.calorieTarget.toLocaleString('pt-BR')} kcal</span></div>
        <div className="titan-dual-ring"><svg viewBox="0 0 140 140" aria-label="Consumo e gasto energético"><circle className="titan-ring-track titan-ring-outer" cx="70" cy="70" r="58" pathLength={circumference}/><circle className="titan-ring-track titan-ring-inner" cx="70" cy="70" r="47" pathLength={circumference}/><circle className="titan-ring-intake" cx="70" cy="70" r="58" pathLength={circumference} strokeDasharray={circumference} strokeDashoffset={circumference - intakeProgress * circumference}/><circle className="titan-ring-burn" cx="70" cy="70" r="47" pathLength={circumference} strokeDasharray={circumference} strokeDashoffset={circumference - burnProgress * circumference}/></svg><div className="titan-ring-center"><strong>{signed(currentBalance)}</strong><span>kcal</span><small>saldo atual</small></div></div>
        <div className="titan-side-stat is-burn"><small>GASTO</small><strong>{expenditure.totalElapsed.toLocaleString('pt-BR')}</strong><span>kcal até agora</span></div>
      </div>
      <div className="titan-balance-status"><i/><strong>{state.label}</strong><span>Projeção: {signed(projectedBalance)} kcal • {state.detail}</span></div>
      <div className="titan-macro-cards">{macros.map((macro) => <div key={macro.label}><small>{macro.label}</small><strong>{macro.value} <span>/ {macro.target} {macro.unit}</span></strong><div><i style={{ width: `${clamp(macro.value / Math.max(1, macro.target)) * 100}%` }}/></div></div>)}</div>
      <div className="titan-energy-detail"><div><small>Basal até agora</small><strong>{expenditure.basalElapsed} kcal</strong></div><div><small>Atividade</small><strong>{expenditure.activeCalories} kcal</strong></div><div><small>Passos</small><strong>{Math.round(activity?.steps ?? 0).toLocaleString('pt-BR')}</strong></div><div><small>Tempo ativo</small><strong>{Math.round(activity?.activeMinutes ?? 0)} min</strong></div></div>
    </article>

    <article className={`titan-water-card hydration-${pace.state}`} onClick={() => setWaterOpen(true)}><div className="titan-water-icon"><span style={{ height: `${waterProgress * 100}%` }}/><b>💧</b></div><div className="titan-water-copy"><small>HIDRATAÇÃO • {pace.label.toUpperCase()}</small><strong>{(waterMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L <span>/ {(water.goalMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L</span></strong><div><i style={{ width: `${waterProgress * 100}%` }}/></div><p>{pace.deltaMl >= 0 ? `${pace.deltaMl.toLocaleString('pt-BR')} ml à frente do ritmo` : `${Math.abs(pace.deltaMl).toLocaleString('pt-BR')} ml atrás do ritmo`}</p></div><div className="titan-water-card-actions"><button onClick={(event) => { event.stopPropagation(); registerWater(300); }}>+ 300 ml</button><button onClick={(event) => { event.stopPropagation(); registerWater(500); }}>+ 500 ml</button></div></article>

    {waterOpen && <div className="titan-water-modal" role="dialog" aria-modal="true" onClick={() => setWaterOpen(false)}><section onClick={(event) => event.stopPropagation()}><header><div><span>HIDRATAÇÃO</span><h2>Registrar água</h2></div><button onClick={() => setWaterOpen(false)}>×</button></header><div className="titan-water-total"><small>Consumido hoje</small><strong>{waterMl.toLocaleString('pt-BR')} ml</strong><span>{Math.round(waterProgress * 100)}% da meta • {pace.label}</span></div><div className="titan-water-quick">{[300, 500].map((amount) => <button key={amount} onClick={() => registerWater(amount)}>+ {amount} ml</button>)}</div><label className="titan-water-custom"><span>Outra quantidade</span><div><input inputMode="numeric" value={customMl} onChange={(event) => setCustomMl(event.target.value.replace(/\D/g, ''))} placeholder="Ex.: 600"/><button onClick={() => registerWater(Number(customMl))}>Adicionar</button></div></label><div className="titan-water-goal"><span>Meta diária</span><div>{[4000, 4250, 4500].map((goal) => <button className={water.goalMl === goal ? 'is-active' : ''} key={goal} onClick={() => changeWaterGoal(goal)}>{(goal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L</button>)}</div></div><div className="titan-water-timeline"><span>Registros de hoje</span>{water.entries.length ? water.entries.slice().reverse().map((entry) => <div key={entry.id}><strong>+{entry.amountMl} ml</strong><small>{new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></div>) : <small>Nenhum registro ainda.</small>}</div><div className="titan-water-history"><span>Últimos 7 dias</span>{waterHistory.map((day) => { const total = hydrationTotal(day); return <div key={day.date}><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })}</small><i><b style={{ width: `${clamp(total / Math.max(1, day.goalMl)) * 100}%` }}/></i><strong>{(total / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L</strong></div>; })}</div><footer><button onClick={() => setWater(undoLastHydration())} disabled={!water.entries.length}>Desfazer último registro</button></footer></section></div>}
  </section>;
}
