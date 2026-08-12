import { useEffect, useMemo, useState } from 'react';
import { readDailyActivitySummary, requestHealthPermissions, requestSamsungHealthPermissions, samsungHealthStatus } from '../features/health/bridge';
import type { DailyActivitySummary } from '../features/health/types';
import { estimateEnergyExpenditure } from '../features/nutrition/advanced';
import { formatMacros, sumMacros } from '../features/nutrition/engine';
import { addHydration, hydrationTotal, loadTodayHydration, setHydrationGoal, undoLastHydration, type HydrationDay } from '../features/nutrition/hydration';
import { loadDailyMeals } from '../features/nutrition/storage';
import type { PlannedMeal } from '../features/nutrition/types';

const SURPLUS_TARGET = 300;

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

function sourceLabel(activity: DailyActivitySummary | null) {
  if (!activity) return 'Conectar relógio';
  if (activity.source === 'samsung-health') return 'Samsung Health';
  if (activity.source === 'health-connect-aggregate') return 'Health Connect';
  return 'Relógio conectado';
}

function balanceState(balance: number) {
  const delta = balance - SURPLUS_TARGET;
  if (Math.abs(delta) <= 100) return { label: 'Na faixa', className: 'is-range' };
  if (delta < -450) return { label: 'Déficit maior', className: 'is-low' };
  if (delta < -100) return { label: 'Déficit leve', className: 'is-soft-low' };
  if (delta > 500) return { label: 'Superávit maior', className: 'is-high' };
  return { label: 'Superávit leve', className: 'is-soft-high' };
}

export function TitanTodayHero() {
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [activity, setActivity] = useState<DailyActivitySummary | null>(null);
  const [healthBusy, setHealthBusy] = useState(false);
  const [water, setWater] = useState<HydrationDay>(() => loadTodayHydration());
  const [waterOpen, setWaterOpen] = useState(false);
  const [customMl, setCustomMl] = useState('');

  async function refresh() {
    const [dailyMeals, dailyActivity] = await Promise.all([loadDailyMeals(), readDailyActivitySummary()]);
    setMeals(dailyMeals);
    setActivity(dailyActivity);
    setWater(loadTodayHydration());
  }

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 12000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
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
  const projectedBalance = Math.round(planned.caloriesKcal - expenditure.projectedTotalDay);
  const state = balanceState(projectedBalance);
  const intakeProgress = clamp(consumed.caloriesKcal / Math.max(1, planned.caloriesKcal));
  const burnProgress = clamp(expenditure.totalElapsed / Math.max(1, expenditure.projectedTotalDay));
  const circumference = 100;
  const waterMl = hydrationTotal(water);
  const waterProgress = clamp(waterMl / water.goalMl);

  function registerWater(amount: number) {
    if (!amount) return;
    setWater(addHydration(amount));
    setCustomMl('');
  }

  const macros = [
    { label: 'Proteína', value: consumed.proteinG, target: planned.proteinG, unit: 'g' },
    { label: 'Carboidratos', value: consumed.carbohydrateG, target: planned.carbohydrateG, unit: 'g' },
    { label: 'Gorduras', value: consumed.fatG, target: planned.fatG, unit: 'g' },
  ];

  return <section className="titan-v4-home-head">
    <header className="titan-v4-brandbar">
      <div><strong>TITAN</strong><span>NUTRITION</span></div>
      <button onClick={() => void connectHealth()} disabled={healthBusy}>⌚ {healthBusy ? 'Sincronizando…' : sourceLabel(activity)}</button>
    </header>

    <article className={`titan-metabolic-card ${state.className}`}>
      <div className="titan-metabolic-title"><div><span>BALANÇO ENERGÉTICO</span><small>Consumo × gasto em tempo real</small></div><div className="titan-surplus-target"><small>Meta do dia</small><strong>+{SURPLUS_TARGET} kcal</strong></div></div>
      <div className="titan-metabolic-core">
        <div className="titan-side-stat is-intake"><small>CONSUMIDO</small><strong>{consumed.caloriesKcal.toLocaleString('pt-BR')}</strong><span>kcal</span></div>
        <div className="titan-dual-ring">
          <svg viewBox="0 0 140 140" aria-label="Consumo e gasto energético">
            <circle className="titan-ring-track titan-ring-outer" cx="70" cy="70" r="58" pathLength={circumference}/>
            <circle className="titan-ring-track titan-ring-inner" cx="70" cy="70" r="47" pathLength={circumference}/>
            <circle className="titan-ring-intake" cx="70" cy="70" r="58" pathLength={circumference} strokeDasharray={circumference} strokeDashoffset={circumference - intakeProgress * circumference}/>
            <circle className="titan-ring-burn" cx="70" cy="70" r="47" pathLength={circumference} strokeDasharray={circumference} strokeDashoffset={circumference - burnProgress * circumference}/>
          </svg>
          <div className="titan-ring-center"><strong>{currentBalance >= 0 ? '+' : ''}{currentBalance}</strong><span>kcal</span><small>saldo atual</small></div>
        </div>
        <div className="titan-side-stat is-burn"><small>GASTO</small><strong>{expenditure.totalElapsed.toLocaleString('pt-BR')}</strong><span>kcal</span></div>
      </div>
      <div className="titan-balance-status"><i/><strong>{state.label}</strong><span>Projeção: {projectedBalance >= 0 ? '+' : ''}{projectedBalance} kcal</span></div>
      <div className="titan-macro-cards">{macros.map((macro) => <div key={macro.label}><small>{macro.label}</small><strong>{macro.value} <span>/ {macro.target} {macro.unit}</span></strong><div><i style={{ width: `${clamp(macro.value / Math.max(1, macro.target)) * 100}%` }}/></div></div>)}</div>
      <div className="titan-energy-detail"><div><small>Basal até agora</small><strong>{expenditure.basalElapsed} kcal</strong></div><div><small>Atividade</small><strong>{expenditure.activeCalories} kcal</strong></div><div><small>Passos</small><strong>{Math.round(activity?.steps ?? 0).toLocaleString('pt-BR')}</strong></div><div><small>Tempo ativo</small><strong>{Math.round(activity?.activeMinutes ?? 0)} min</strong></div></div>
    </article>

    <article className="titan-water-card" onClick={() => setWaterOpen(true)}>
      <div className="titan-water-icon"><span style={{ height: `${waterProgress * 100}%` }}/><b>💧</b></div>
      <div className="titan-water-copy"><small>HIDRATAÇÃO</small><strong>{(waterMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L <span>/ {(water.goalMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L</span></strong><div><i style={{ width: `${waterProgress * 100}%` }}/></div><p>{Math.max(0, water.goalMl - waterMl).toLocaleString('pt-BR')} ml restantes</p></div>
      <div className="titan-water-card-actions">
        <button onClick={(event) => { event.stopPropagation(); registerWater(300); }}>+ 300 ml</button>
        <button onClick={(event) => { event.stopPropagation(); registerWater(500); }}>+ 500 ml</button>
      </div>
    </article>

    {waterOpen && <div className="titan-water-modal" role="dialog" aria-modal="true" onClick={() => setWaterOpen(false)}><section onClick={(event) => event.stopPropagation()}>
      <header><div><span>HIDRATAÇÃO</span><h2>Registrar água</h2></div><button onClick={() => setWaterOpen(false)}>×</button></header>
      <div className="titan-water-total"><small>Consumido hoje</small><strong>{waterMl.toLocaleString('pt-BR')} ml</strong><span>{Math.round(waterProgress * 100)}% da meta</span></div>
      <div className="titan-water-quick">{[300, 500].map((amount) => <button key={amount} onClick={() => registerWater(amount)}>+ {amount} ml</button>)}</div>
      <label className="titan-water-custom"><span>Outra quantidade</span><div><input inputMode="numeric" value={customMl} onChange={(event) => setCustomMl(event.target.value.replace(/\D/g, ''))} placeholder="Ex.: 600"/><button onClick={() => registerWater(Number(customMl))}>Adicionar</button></div></label>
      <div className="titan-water-goal"><span>Meta diária</span><div>{[4000, 4250, 4500].map((goal) => <button className={water.goalMl === goal ? 'is-active' : ''} key={goal} onClick={() => setWater(setHydrationGoal(goal))}>{(goal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L</button>)}</div></div>
      <footer><button onClick={() => setWater(undoLastHydration())} disabled={!water.entries.length}>Desfazer último registro</button></footer>
    </section></div>}
  </section>;
}
