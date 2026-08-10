import { useEffect, useState } from 'react';
import { loadNutritionExecutionsForDate, nutritionTotalsForDate, saveNutritionMealExecution, todayKey } from './execution';
import { loadActiveNutritionPlan } from './storage';
import type { NutritionFood, NutritionMacroTotals, NutritionMeal } from './types';
import '../../styles/nutrition-v053.css';

const DAY_NAMES = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
type Redistribution = { deficit: NutritionMacroTotals; mealNames: string[]; perMeal: NutritionMacroTotals } | null;

export function NutritionTodayPanel() {
  const [,setRevision]=useState(0);
  const [activeMeal,setActiveMeal]=useState<NutritionMeal|null>(null);
  const [quantities,setQuantities]=useState<Record<string,number>>({});
  const [alternatives,setAlternatives]=useState<Record<string,number>>({});
  const [redistribution,setRedistribution]=useState<Redistribution>(null);
  const plan=loadActiveNutritionPlan();
  const date=todayKey();
  const executions=loadNutritionExecutionsForDate(date);
  const totals=nutritionTotalsForDate(date);

  useEffect(()=>{
    const refresh=()=>setRevision(v=>v+1);
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
    setAlternatives({});
    setQuantities(Object.fromEntries(meal.foods.map(food=>[food.id,food.quantity])));
  }

  function closeMeal(){setActiveMeal(null);setQuantities({});setAlternatives({});}

  function chooseAlternative(food:NutritionFood,index:number){
    setAlternatives(current=>({...current,[food.id]:index}));
    const option=index>=0?food.alternatives?.[index]:undefined;
    setQuantities(current=>({...current,[food.id]:option?.quantity??food.quantity}));
  }

  function save(status:'consumed'|'partial'|'skipped'){
    if(!activeMeal)return;
    const macros=status==='skipped'?zeroMacros():activeMeal.foods.reduce<NutritionMacroTotals>((sum,food)=>{
      const selectedIndex=alternatives[food.id]??-1;
      const selected=selectedIndex>=0?food.alternatives?.[selectedIndex]:undefined;
      const baseQuantity=selected?.quantity??food.quantity;
      const qty=Math.max(0,Number(quantities[food.id]??baseQuantity));
      const ratio=baseQuantity>0?qty/baseQuantity:0;
      const baseMacros=selected?.macros?mergeMacros(food.macros,selected.macros):food.macros;
      return addMacros(sum,scaleMacros(baseMacros,ratio));
    },zeroMacros());
    const rounded=roundMacros(macros);
    saveNutritionMealExecution({date,mealId:activeMeal.id,status,completedAt:new Date().toISOString(),foods:activeMeal.foods.map(food=>({foodId:food.id,quantity:status==='skipped'?0:Math.max(0,Number(quantities[food.id]??food.quantity))})),macros:rounded});

    const deficit=positiveDifference(activeMeal.macros,rounded);
    const remaining=meals.filter(meal=>meal.id!==activeMeal.id&&!done.has(meal.id));
    const hasDeficit=macroSum(deficit)>0.5;
    setRedistribution(hasDeficit&&remaining.length?{deficit,mealNames:remaining.map(meal=>meal.name),perMeal:divideMacros(deficit,remaining.length)}:null);
    closeMeal();
    setRevision(v=>v+1);
  }

  return <>
    <section className="nutrition-today-card" aria-label="Nutrição de hoje">
      <div className="nutrition-today-head"><div><span className="eyebrow">NUTRIÇÃO DE HOJE</span><h3>{next?'Próxima refeição':'Programação concluída'}</h3></div>{pending.length>0&&<span className="nutrition-pending-badge">{pending.length} pendente{pending.length>1?'s':''}</span>}</div>
      {next?<button type="button" className="nutrition-next-meal" onClick={()=>openMeal(next)}><span className="nutrition-next-time">{next.plannedTime}</span><div><strong>{next.name}</strong><small>{next.macros.caloriesKcal} kcal · P {next.macros.proteinG} · C {next.macros.carbohydrateG} · G {next.macros.fatG}</small></div><span>›</span></button>:<p className="nutrition-all-done">Todas as refeições programadas de hoje já foram registradas.</p>}
      {pending.length>0&&<div className="nutrition-pending-list">{pending.map(meal=><button key={meal.id} type="button" onClick={()=>openMeal(meal)}><span>{meal.plannedTime}</span><strong>{meal.name}</strong><small>Registrar agora</small></button>)}</div>}
      {redistribution&&<section className="nutrition-redistribution" aria-label="Redistribuição sugerida"><div><span className="eyebrow">SALDO A REDISTRIBUIR</span><strong>{Math.round(redistribution.deficit.caloriesKcal)} kcal restantes</strong><small>P {round1(redistribution.deficit.proteinG)} g · C {round1(redistribution.deficit.carbohydrateG)} g · G {round1(redistribution.deficit.fatG)} g</small></div><p>Dividindo entre {redistribution.mealNames.length} refeição{redistribution.mealNames.length>1?'ões':''} restante{redistribution.mealNames.length>1?'s':''}: <strong>+{Math.round(redistribution.perMeal.caloriesKcal)} kcal</strong> por refeição, com aproximadamente P {round1(redistribution.perMeal.proteinG)} · C {round1(redistribution.perMeal.carbohydrateG)} · G {round1(redistribution.perMeal.fatG)} g.</p><button type="button" className="text-action" onClick={()=>setRedistribution(null)}>Ocultar sugestão</button></section>}
      <div className="nutrition-day-progress"><Progress label="Calorias" value={totals.caloriesKcal} target={target.caloriesKcal} unit="kcal"/><Progress label="Proteína" value={totals.proteinG} target={target.proteinG} unit="g"/><Progress label="Carbo" value={totals.carbohydrateG} target={target.carbohydrateG} unit="g"/><Progress label="Gordura" value={totals.fatG} target={target.fatG} unit="g"/></div>
    </section>

    {activeMeal&&<div className="nutrition-meal-overlay" role="dialog" aria-modal="true" aria-label={`Registrar ${activeMeal.name}`}><section className="nutrition-meal-modal"><div className="nutrition-modal-head"><div><span className="eyebrow">{activeMeal.plannedTime}</span><h3>{activeMeal.name}</h3></div><button type="button" className="text-action" onClick={closeMeal}>Fechar</button></div><p>Informe o que realmente consumiu. Você pode usar uma alternativa prevista no plano e ajustar a quantidade.</p><div className="nutrition-food-execution">{activeMeal.foods.map(food=>{const selectedIndex=alternatives[food.id]??-1;const selected=selectedIndex>=0?food.alternatives?.[selectedIndex]:undefined;const unit=selected?.unit??food.unit;return <div className="nutrition-food-row" key={food.id}><div className="nutrition-food-copy"><strong>{selected?.name??food.name}</strong><small>Planejado: {selected?.quantity??food.quantity} {unit}</small>{food.alternatives?.length?<select aria-label={`Substituir ${food.name}`} value={selectedIndex} onChange={event=>chooseAlternative(food,Number(event.target.value))}><option value={-1}>Manter {food.name}</option>{food.alternatives.map((alt,index)=><option key={`${food.id}-${index}`} value={index}>{alt.name} · {alt.quantity} {alt.unit}</option>)}</select>:null}</div><div className="nutrition-quantity-input"><input aria-label={`Quantidade de ${selected?.name??food.name}`} type="number" min="0" step="1" value={quantities[food.id]??selected?.quantity??food.quantity} onChange={event=>setQuantities(current=>({...current,[food.id]:Number(event.target.value)}))}/><span>{unit}</span></div></div>})}</div><div className="nutrition-modal-actions"><button type="button" className="primary-action" onClick={()=>save('consumed')}>Concluir refeição</button><button type="button" className="secondary-action" onClick={()=>save('partial')}>Registrar parcial</button><button type="button" className="text-action nutrition-skip" onClick={()=>save('skipped')}>Não realizada</button></div></section></div>}
  </>;
}

function Progress({label,value,target,unit}:{label:string;value:number;target:number;unit:string}){const pct=target>0?Math.min(120,(value/target)*100):0;return <div className="nutrition-progress-row"><div><span>{label}</span><strong>{Math.round(value)} / {Math.round(target)} {unit}</strong></div><div className="nutrition-progress-track"><i style={{width:`${Math.min(100,pct)}%`}} className={pct>110?'over':pct>=90?'target':''}/></div></div>}
function toMinutes(value:string){const [h,m]=value.split(':').map(Number);return (h||0)*60+(m||0)}
function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function zeroMacros():NutritionMacroTotals{return {caloriesKcal:0,proteinG:0,carbohydrateG:0,fatG:0}}
function addMacros(a:NutritionMacroTotals,b:NutritionMacroTotals):NutritionMacroTotals{return {caloriesKcal:a.caloriesKcal+b.caloriesKcal,proteinG:a.proteinG+b.proteinG,carbohydrateG:a.carbohydrateG+b.carbohydrateG,fatG:a.fatG+b.fatG}}
function scaleMacros(m:NutritionMacroTotals,ratio:number):NutritionMacroTotals{return {caloriesKcal:m.caloriesKcal*ratio,proteinG:m.proteinG*ratio,carbohydrateG:m.carbohydrateG*ratio,fatG:m.fatG*ratio}}
function mergeMacros(base:NutritionMacroTotals,override:Partial<NutritionMacroTotals>):NutritionMacroTotals{return {caloriesKcal:override.caloriesKcal??base.caloriesKcal,proteinG:override.proteinG??base.proteinG,carbohydrateG:override.carbohydrateG??base.carbohydrateG,fatG:override.fatG??base.fatG}}
function positiveDifference(planned:NutritionMacroTotals,actual:NutritionMacroTotals):NutritionMacroTotals{return {caloriesKcal:Math.max(0,planned.caloriesKcal-actual.caloriesKcal),proteinG:Math.max(0,planned.proteinG-actual.proteinG),carbohydrateG:Math.max(0,planned.carbohydrateG-actual.carbohydrateG),fatG:Math.max(0,planned.fatG-actual.fatG)}}
function divideMacros(m:NutritionMacroTotals,count:number):NutritionMacroTotals{return scaleMacros(m,count>0?1/count:0)}
function macroSum(m:NutritionMacroTotals){return m.caloriesKcal+m.proteinG+m.carbohydrateG+m.fatG}
function round1(value:number){return Math.round(value*10)/10}
function roundMacros(m:NutritionMacroTotals):NutritionMacroTotals{return {caloriesKcal:Math.round(m.caloriesKcal),proteinG:round1(m.proteinG),carbohydrateG:round1(m.carbohydrateG),fatG:round1(m.fatG)}}
