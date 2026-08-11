import { useMemo, useState } from 'react';
import { loadActiveNutritionPlan, removeActiveNutritionPlan, saveActiveNutritionPlan, validateNutritionPlan } from './storage';
import type { NutritionDay, NutritionMacroTotals, TitanNutritionPlan } from './types';

const DAY_ORDER = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const TODAY = DAY_ORDER[new Date().getDay()];

type Props = { managementOnly?: boolean };

export function NutritionProgramPanel({ managementOnly = false }: Props) {
  const [plan, setPlan] = useState<TitanNutritionPlan | null>(() => loadActiveNutritionPlan());
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<TitanNutritionPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<NutritionDay | null>(null);
  const days = useMemo(() => !plan ? [] : [...plan.days].sort((a, b) => dayIndex(a.day) - dayIndex(b.day)), [plan]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError('');
    setPreview(null);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!validateNutritionPlan(parsed)) throw new Error('Formato de plano alimentar incompatível com o TITAN FIT.');
      setPreview(parsed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível ler o arquivo.');
    }
  }

  function activatePreview() {
    if (!preview) return;
    saveActiveNutritionPlan(preview);
    setPlan(preview);
    setPreview(null);
    setSelectedDay(null);
  }

  function removePlan() {
    if (!window.confirm('Remover somente o plano nutricional ativo? Seus treinos e demais registros serão preservados.')) return;
    removeActiveNutritionPlan();
    setPlan(null);
    setPreview(null);
    setSelectedDay(null);
  }

  if (!managementOnly && plan && selectedDay) return <NutritionDayDetail day={selectedDay} onBack={() => setSelectedDay(null)} />;

  return <div className={`nutrition-program${managementOnly ? ' nutrition-management-only' : ''}`}>
    <section className="nutrition-plan-card">
      <div><span className="eyebrow">PLANO NUTRICIONAL</span><h3>{plan?.name ?? 'Nenhuma dieta ativa'}</h3><p>{plan ? plan.objective ?? `${plan.days.length} dias programados` : 'Importe um arquivo TITAN de dieta para adicionar refeições à programação semanal.'}</p></div>
      {plan && <div className="nutrition-target-grid"><Metric label="Calorias" value={`${Math.round(plan.defaultTarget.caloriesKcal)} kcal`} /><Metric label="Proteína" value={`${Math.round(plan.defaultTarget.proteinG)} g`} /><Metric label="Carbo" value={`${Math.round(plan.defaultTarget.carbohydrateG)} g`} /><Metric label="Gordura" value={`${Math.round(plan.defaultTarget.fatG)} g`} /></div>}
    </section>

    {managementOnly && <section className="nutrition-import-card">
      <div><span className="eyebrow">IMPORTAR</span><h3>Inserir plano de dieta</h3><p>O arquivo é validado e pré-visualizado antes de substituir a dieta ativa. O projeto de treino permanece independente.</p></div>
      <label className="nutrition-file-action">Selecionar arquivo JSON<input type="file" accept="application/json,.json" onChange={(event) => void onFile(event.target.files?.[0])} /></label>
      <a className="secondary-action nutrition-template-action" href="./templates/titan-nutrition-plan-template.json" download="titan-nutrition-plan-template.json">Baixar modelo de dieta TITAN</a>
      {error && <p className="nutrition-import-error" role="alert">{error}</p>}
      {preview && <div className="nutrition-preview"><strong>{preview.name}</strong><span>{preview.days.length} dias · {preview.days.reduce((sum, day) => sum + day.meals.length, 0)} refeições</span><span>{Math.round(preview.defaultTarget.caloriesKcal)} kcal · P {Math.round(preview.defaultTarget.proteinG)} g · C {Math.round(preview.defaultTarget.carbohydrateG)} g · G {Math.round(preview.defaultTarget.fatG)} g</span><button type="button" className="secondary-action" onClick={activatePreview}>Ativar plano alimentar</button></div>}
      {plan && <button type="button" className="text-action nutrition-remove" onClick={removePlan}>Remover plano nutricional</button>}
    </section>}

    {!managementOnly && plan && <section className="nutrition-week nutrition-week-compact" aria-label="Dieta da semana">
      <div className="programming-section-head"><div><span className="programming-section-icon strength">◫</span><div><span className="eyebrow">DOMINGO → SÁBADO</span><h3>Dieta da semana</h3></div></div><small>Toque no dia para ver as refeições</small></div>
      <div className="nutrition-day-list nutrition-day-list-compact">{DAY_ORDER.map((dayName) => {
        const day = days.find((item) => normalize(item.day).includes(dayName));
        const totals = day ? dayTotals(day) : null;
        const isToday = dayName === TODAY;
        return <button type="button" className={`nutrition-day-summary${isToday ? ' today' : ''}`} key={dayName} disabled={!day} onClick={() => day && setSelectedDay(day)}>
          <span className={`nutrition-day-label${isToday ? ' active' : ''}`}><strong>{dayName.slice(0, 3).toUpperCase()}</strong></span>
          <span className="nutrition-day-summary-copy"><strong>{day ? `${day.meals.length} refeições` : 'Sem programação'}</strong>{totals && <small>{Math.round(totals.caloriesKcal)} kcal · P {Math.round(totals.proteinG)} · C {Math.round(totals.carbohydrateG)} · G {Math.round(totals.fatG)}</small>}</span>
          {isToday ? <span className="programming-tag today-tag">HOJE</span> : <span className="programming-chevron">›</span>}
        </button>;
      })}</div>
    </section>}
  </div>;
}

function NutritionDayDetail({ day, onBack }: { day: NutritionDay; onBack: () => void }) {
  const totals = dayTotals(day);
  const meals = [...day.meals].sort((a, b) => a.plannedTime.localeCompare(b.plannedTime));
  return <div className="nutrition-day-detail">
    <button type="button" className="secondary-action programming-back" onClick={onBack}>‹ Voltar à dieta</button>
    <section className="nutrition-day-detail-hero"><span className="eyebrow">{day.day.toUpperCase()} · PLANO NUTRICIONAL</span><h2>{Math.round(totals.caloriesKcal)} kcal</h2><div className="nutrition-day-detail-macros"><span>P <strong>{Math.round(totals.proteinG)} g</strong></span><span>C <strong>{Math.round(totals.carbohydrateG)} g</strong></span><span>G <strong>{Math.round(totals.fatG)} g</strong></span></div></section>
    <div className="nutrition-day-meals">{meals.map((meal) => <article className="nutrition-day-meal-card" key={meal.id}><header><span>{meal.plannedTime}</span><div><strong>{meal.name}</strong><small>{Math.round(meal.macros.caloriesKcal)} kcal · P {Math.round(meal.macros.proteinG)} · C {Math.round(meal.macros.carbohydrateG)} · G {Math.round(meal.macros.fatG)}</small></div></header><div className="nutrition-day-foods">{meal.foods.map((food) => <div key={food.id}><span>{food.name}</span><strong>{formatQuantity(food.quantity)} {food.unit}</strong></div>)}</div>{meal.notes && <p className="nutrition-day-note">{meal.notes}</p>}</article>)}</div>
  </div>;
}

function dayTotals(day: NutritionDay): NutritionMacroTotals {
  if (day.target) return day.target;
  return day.meals.reduce<NutritionMacroTotals>((sum, meal) => ({ caloriesKcal: sum.caloriesKcal + meal.macros.caloriesKcal, proteinG: sum.proteinG + meal.macros.proteinG, carbohydrateG: sum.carbohydrateG + meal.macros.carbohydrateG, fatG: sum.fatG + meal.macros.fatG }), { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 });
}
function Metric({ label, value }: { label: string; value: string }) { return <span><small>{label}</small><strong>{value}</strong></span>; }
function formatQuantity(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ','); }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function dayIndex(value: string) { const normalized = normalize(value); const index = DAY_ORDER.findIndex((day) => normalized.includes(day)); return index === -1 ? 99 : index; }
