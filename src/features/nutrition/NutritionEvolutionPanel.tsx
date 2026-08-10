import { useMemo, useState } from 'react';
import { loadNutritionExecutions, nutritionTotalsForDate, todayKey } from './execution';
import { loadActiveNutritionPlan } from './storage';
import type { NutritionMacroTotals } from './types';

const PERIODS = [7, 30, 90] as const;

type Period = typeof PERIODS[number];

export function NutritionEvolutionPanel() {
  const [period, setPeriod] = useState<Period>(7);
  const plan = loadActiveNutritionPlan();
  const target = plan?.defaultTarget;

  const days = useMemo(() => buildDays(period), [period]);
  const recorded = days.filter(day => day.hasData);
  const adherence = target && recorded.length
    ? Math.round(recorded.filter(day => withinRange(day.totals.caloriesKcal, target.caloriesKcal)).length / recorded.length * 100)
    : 0;
  const average = recorded.length
    ? Math.round(recorded.reduce((sum, day) => sum + day.totals.caloriesKcal, 0) / recorded.length)
    : 0;
  const proteinAdherence = target && recorded.length
    ? Math.round(recorded.filter(day => day.totals.proteinG >= target.proteinG * .9 && day.totals.proteinG <= target.proteinG * 1.1).length / recorded.length * 100)
    : 0;

  if (!plan || !target) return <section className="nutrition-evolution-card"><span className="eyebrow">NUTRIÇÃO</span><h3>Sem plano nutricional ativo</h3><p>Importe e ative uma dieta para acompanhar calorias e macros na evolução.</p></section>;

  const maxCalories = Math.max(target.caloriesKcal * 1.25, ...days.map(day => day.totals.caloriesKcal), 1);

  return <div className="nutrition-evolution-view">
    <section className="nutrition-evolution-card">
      <div className="nutrition-evolution-head"><div><span className="eyebrow">NUTRIÇÃO</span><h3>Evolução alimentar</h3></div><div className="nutrition-period-switch">{PERIODS.map(value => <button key={value} type="button" className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{value}d</button>)}</div></div>
      <div className="nutrition-evolution-kpis"><div><small>Aderência calórica</small><strong>{adherence}%</strong></div><div><small>Média do período</small><strong>{average.toLocaleString('pt-BR')} kcal</strong></div><div><small>Proteína na meta</small><strong>{proteinAdherence}%</strong></div><div><small>Dias registrados</small><strong>{recorded.length}/{period}</strong></div></div>
    </section>

    <section className="nutrition-evolution-card"><div className="nutrition-evolution-title"><div><span className="info-label">CALORIAS × META</span><h3>Consumo diário</h3></div><strong>{target.caloriesKcal.toLocaleString('pt-BR')} kcal</strong></div><div className={`nutrition-calorie-chart ${period > 7 ? 'scroll' : ''}`}><div className="nutrition-calorie-bars" style={{minWidth: period === 90 ? 900 : period === 30 ? 520 : undefined}}>{days.map(day => {const pct = Math.min(100, day.totals.caloriesKcal / maxCalories * 100);const goalPct = Math.min(100, target.caloriesKcal / maxCalories * 100);const state = !day.hasData ? 'empty' : withinRange(day.totals.caloriesKcal,target.caloriesKcal) ? 'target' : day.totals.caloriesKcal > target.caloriesKcal * 1.1 ? 'over' : 'under';return <div className={`nutrition-calorie-day ${state}`} key={day.date} title={`${day.label}: ${Math.round(day.totals.caloriesKcal)} kcal`}><div className="nutrition-calorie-column"><i className="nutrition-goal-line" style={{bottom:`${goalPct}%`}}/><span style={{height:`${pct}%`}}/></div><small>{day.shortLabel}</small></div>})}</div></div><div className="nutrition-chart-legend"><span><i className="target"/>Dentro da meta</span><span><i className="under"/>Abaixo</span><span><i className="over"/>Acima</span></div></section>

    <section className="nutrition-evolution-card"><div className="nutrition-evolution-title"><div><span className="info-label">MACROS</span><h3>Média dos dias registrados</h3></div></div><div className="nutrition-macro-average"><MacroAverage label="Proteína" value={averageMacro(recorded,'proteinG')} target={target.proteinG} unit="g"/><MacroAverage label="Carboidratos" value={averageMacro(recorded,'carbohydrateG')} target={target.carbohydrateG} unit="g"/><MacroAverage label="Gorduras" value={averageMacro(recorded,'fatG')} target={target.fatG} unit="g"/></div></section>
  </div>;
}

function buildDays(period: Period) {
  const executions = loadNutritionExecutions();
  const dates = new Set(executions.map(item => item.date));
  return Array.from({length:period},(_,index)=>{
    const date = new Date();
    date.setHours(12,0,0,0);
    date.setDate(date.getDate() - (period - 1 - index));
    const key = todayKey(date);
    return {date:key,label:date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),shortLabel:period === 7 ? date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').slice(0,3) : String(date.getDate()).padStart(2,'0'),totals:nutritionTotalsForDate(key),hasData:dates.has(key)};
  });
}
function withinRange(value:number,target:number){return target>0 && value>=target*.9 && value<=target*1.1}
function averageMacro(days:ReturnType<typeof buildDays>,key:keyof NutritionMacroTotals){if(!days.length)return 0;return days.reduce((sum,day)=>sum+day.totals[key],0)/days.length}
function MacroAverage({label,value,target,unit}:{label:string;value:number;target:number;unit:string}){const pct=target>0?Math.min(120,value/target*100):0;return <div className="nutrition-macro-average-row"><div><span>{label}</span><strong>{Math.round(value)} / {Math.round(target)} {unit}</strong></div><div className="nutrition-progress-track"><i style={{width:`${Math.min(100,pct)}%`}} className={pct>110?'over':pct>=90?'target':''}/></div></div>}
