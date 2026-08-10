import { useEffect, useMemo, useState } from 'react';
import { loadNutritionExecutionsForDate, nutritionTotalsForDate, saveNutritionMealExecution, todayKey } from './execution';
import { loadActiveNutritionPlan } from './storage';
import type { NutritionMacroTotals, NutritionMeal } from './types';
import '../../styles/nutrition-v053.css';

const DAY_NAMES = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];

export function NutritionTodayPanel() {
  const [refreshKey,setRefreshKey]=useState(0);
  const [activeMeal,setActiveMeal]=useState<NutritionMeal|null>(null);
  const [quantities,setQuantities]=useState<Record<string,number>>({});
  const plan=useMemo(()=>loadActiveNutritionPlan(),[refreshKey]);
  const date=todayKey();
  const executions=useMemo(()=>loadNutritionExecutionsForDate(date),[date,refreshKey]);
  const totals=useMemo(()=>nutritionTotalsForDate(date),[date,refreshKey]);

  useEffect(()=>{
    const refresh=()=>setRefreshKey(v=>v+1);
    window.addEventListener('titan:nutrition-changed',refresh);
    return()=>window.removeEventListener('titan:nutrition-changed',refresh);
  },[]);

  if(!plan) return null;
  const todayName=DAY_NAMES[new Date().getDay()];
  const day=plan.days.find(item=>normalize(item.day).includes(todayName));
  const meals=[...(day?.meals??[])].sort((a,b)=>a.plannedTime.localeCompare(b.plannedTime));
  const done=new Set(executions.map(item=>item.mealId));
  const now=new Date();
  const minutes=now.getHours()*60+now.getMinutes();
  const pending=meals.filter(meal=>!done.has(meal.id)&&toMinutes(meal.plannedTime)<minutes);
  const next=meals.find(meal=>!done.has(meal.id)&&toMinutes(meal.plannedTime)>=minutes)??meals.find(meal=>!done.has(meal.id))??null;
  const target=day?.target??plan.defaultTarget;

  function openMeal(meal:NutritionMeal){
    setActiveMeal(meal);
    setQuantities(Object.fromEntries(meal.foods.map(food=>[food.id,food.quantity])));
  }

  function closeMeal(){setActiveMeal(null);setQuantities({});}

  function save(status:'consumed'|'partial'|'skipped'){
    if(!activeMeal)return;
    const macros=status==='skipped'?zeroMacros():activeMeal.foods.reduce<NutritionMacroTotals>((sum,food)=>{
      const qty=Math.max(0,Number(quantities[food.id]??food.quantity));
      const ratio=food.quantity>0?qty/food.quantity:0;
      return addMacros(sum,scaleMacros(food.macros,ratio));
    },zeroMacros());
    saveNutritionMealExecution({date,mealId:activeMeal.id,status,completedAt:new Date().toISOString(),foods:activeMeal.foods.map(food=>({foodId:food.id,quantity:status==='skipped'?0:Math.max(0,Number(quantities[food.id]??food.quantity))})),macros:roundMacros(macros)});
    closeMeal();
    setRefreshKey(v=>v+1);
  }

  return <>
    <section className="nutrition-today-card" aria-label="Nutrição de hoje">
      <div className="nutrition-today-head"><div><span className="eyebrow">NUTRIÇÃO DE HOJE</span><h3>{next?'Próxima refeição':'Programação concluída'}</h3></div>{pending.length>0&&<span className="nutrition-pending-badge">{pending.length} pendente{pending.length>1?'s':''}</span>}</div>
      {next?<button type="button" className="nutrition-next-meal" onClick={()=>openMeal(next)}><span className="nutrition-next-time">{next.plannedTime}</span><div><strong>{next.name}</strong><small>{next.macros.caloriesKcal} kcal · P {next.macros.proteinG} · C {next.macros.carbohydrateG} · G {next.macros.fatG}</small></div><span>›</span></button>:<p className="nutrition-all-done">Todas as refeições programadas de hoje já foram registradas.</p>}
      {pending.length>0&&<div className="nutrition-pending-list">{pending.map(meal=><button key={meal.id} type="button" onClick={()=>openMeal(meal)}><span>{meal.plannedTime}</span><strong>{meal.name}</strong><small>Registrar agora</small></button>)}</div>}
      <div className="nutrition-day-progress"><Progress label="Calorias" value={totals.caloriesKcal} target={target.caloriesKcal} unit="kcal"/><Progress label="Proteína" value={totals.proteinG} target={target.proteinG} unit="g"/><Progress label="Carbo" value={totals.carbohydrateG} target={target.carbohydrateG} unit="g"/><Progress label="Gordura" value={totals.fatG} target={target.fatG} unit="g"/></div>
    </section>

    {activeMeal&&<div className="nutrition-meal-overlay" role="dialog" aria-modal="true" aria-label={`Registrar ${activeMeal.name}`}><section className="nutrition-meal-modal"><div className="nutrition-modal-head"><div><span className="eyebrow">{activeMeal.plannedTime}</span><h3>{activeMeal.name}</h3></div><button type="button" className="text-action" onClick={closeMeal}>Fechar</button></div><p>Informe o que realmente consumiu. Os macros do dia serão calculados pelas quantidades registradas.</p><div className="nutrition-food-execution">{activeMeal.foods.map(food=><label key={food.id}><div><strong>{food.name}</strong><small>Planejado: {food.quantity} {food.unit}</small></div><div className="nutrition-quantity-input"><input type="number" min="0" step="1" value={quantities[food.id]??food.quantity} onChange={event=>setQuantities(current=>({...current,[food.id]:Number(event.target.value)}))}/><span>{food.unit}</span></div></label>)}</div><div className="nutrition-modal-actions"><button type="button" className="primary-action" onClick={()=>save('consumed')}>Concluir refeição</button><button type="button" className="secondary-action" onClick={()=>save('partial')}>Registrar parcial</button><button type="button" className="text-action nutrition-skip" onClick={()=>save('skipped')}>Não realizada</button></div></section></div>}
  </>;
}

function Progress({label,value,target,unit}:{label:string;value:number;target:number;unit:string}){const pct=target>0?Math.min(120,(value/target)*100):0;return <div className="nutrition-progress-row"><div><span>{label}</span><strong>{Math.round(value)} / {Math.round(target)} {unit}</strong></div><div className="nutrition-progress-track"><i style={{width:`${Math.min(100,pct)}%`}} className={pct>110?'over':pct>=90?'target':''}/></div></div>}
function toMinutes(value:string){const [h,m]=value.split(':').map(Number);return (h||0)*60+(m||0)}
function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function zeroMacros():NutritionMacroTotals{return {caloriesKcal:0,proteinG:0,carbohydrateG:0,fatG:0}}
function addMacros(a:NutritionMacroTotals,b:NutritionMacroTotals):NutritionMacroTotals{return {caloriesKcal:a.caloriesKcal+b.caloriesKcal,proteinG:a.proteinG+b.proteinG,carbohydrateG:a.carbohydrateG+b.carbohydrateG,fatG:a.fatG+b.fatG}}
function scaleMacros(m:NutritionMacroTotals,ratio:number):NutritionMacroTotals{return {caloriesKcal:m.caloriesKcal*ratio,proteinG:m.proteinG*ratio,carbohydrateG:m.carbohydrateG*ratio,fatG:m.fatG*ratio}}
function roundMacros(m:NutritionMacroTotals):NutritionMacroTotals{return {caloriesKcal:Math.round(m.caloriesKcal),proteinG:Math.round(m.proteinG*10)/10,carbohydrateG:Math.round(m.carbohydrateG*10)/10,fatG:Math.round(m.fatG*10)/10}}
