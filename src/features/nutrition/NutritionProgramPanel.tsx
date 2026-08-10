import { useMemo, useState } from 'react';
import { loadActiveNutritionPlan, removeActiveNutritionPlan, saveActiveNutritionPlan, validateNutritionPlan } from './storage';
import type { TitanNutritionPlan } from './types';

const DAY_ORDER = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

type Props = { managementOnly?: boolean };

export function NutritionProgramPanel({ managementOnly = false }: Props) {
  const [plan, setPlan] = useState<TitanNutritionPlan | null>(() => loadActiveNutritionPlan());
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<TitanNutritionPlan | null>(null);
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
  }

  function removePlan() {
    if (!window.confirm('Remover somente o plano nutricional ativo? Seus treinos e demais registros serão preservados.')) return;
    removeActiveNutritionPlan();
    setPlan(null);
    setPreview(null);
  }

  return <div className={`nutrition-program${managementOnly ? ' nutrition-management-only' : ''}`}>
    <section className="nutrition-plan-card">
      <div><span className="eyebrow">PLANO NUTRICIONAL</span><h3>{plan?.name ?? 'Nenhuma dieta ativa'}</h3><p>{plan ? plan.objective ?? `${plan.days.length} dias programados` : 'Importe um arquivo TITAN de dieta para adicionar refeições à programação semanal.'}</p></div>
      {plan && <div className="nutrition-target-grid"><Metric label="Calorias" value={`${plan.defaultTarget.caloriesKcal} kcal`} /><Metric label="Proteína" value={`${plan.defaultTarget.proteinG} g`} /><Metric label="Carbo" value={`${plan.defaultTarget.carbohydrateG} g`} /><Metric label="Gordura" value={`${plan.defaultTarget.fatG} g`} /></div>}
    </section>

    <section className="nutrition-import-card">
      <div><span className="eyebrow">IMPORTAR</span><h3>Inserir plano de dieta</h3><p>O arquivo é validado e pré-visualizado antes de substituir a dieta ativa. O projeto de treino permanece independente.</p></div>
      <label className="nutrition-file-action">Selecionar arquivo JSON<input type="file" accept="application/json,.json" onChange={(event) => void onFile(event.target.files?.[0])} /></label>
      <a className="secondary-action nutrition-template-action" href="./templates/titan-nutrition-plan-template.json" download="titan-nutrition-plan-template.json">Baixar modelo de dieta TITAN</a>
      {error && <p className="nutrition-import-error" role="alert">{error}</p>}
      {preview && <div className="nutrition-preview"><strong>{preview.name}</strong><span>{preview.days.length} dias · {preview.days.reduce((sum, day) => sum + day.meals.length, 0)} refeições</span><span>{preview.defaultTarget.caloriesKcal} kcal · P {preview.defaultTarget.proteinG} g · C {preview.defaultTarget.carbohydrateG} g · G {preview.defaultTarget.fatG} g</span><button type="button" className="secondary-action" onClick={activatePreview}>Ativar plano alimentar</button></div>}
      {plan && <button type="button" className="text-action nutrition-remove" onClick={removePlan}>Remover plano nutricional</button>}
    </section>

    {!managementOnly && plan && <section className="nutrition-week" aria-label="Dieta da semana"><div className="programming-section-head"><div><span className="programming-section-icon strength">◫</span><div><span className="eyebrow">DOMINGO → SÁBADO</span><h3>Dieta da semana</h3></div></div><small>{days.reduce((sum, day) => sum + day.meals.length, 0)} refeições</small></div><div className="nutrition-day-list">{DAY_ORDER.map((dayName) => {
      const day = days.find((item) => normalize(item.day).includes(dayName));
      return <article className="nutrition-day-card" key={dayName}><div className="nutrition-day-head"><strong>{dayName.slice(0, 3).toUpperCase()}</strong><span>{day?.meals.length ?? 0} refeições</span></div>{day?.meals.length ? <div className="nutrition-meal-list">{day.meals.sort((a, b) => a.plannedTime.localeCompare(b.plannedTime)).map((meal) => <div className="nutrition-meal-row" key={meal.id}><span className="nutrition-meal-time">{meal.plannedTime}</span><div><strong>{meal.name}</strong><small>{meal.macros.caloriesKcal} kcal · P {meal.macros.proteinG} · C {meal.macros.carbohydrateG} · G {meal.macros.fatG}</small></div></div>)}</div> : <small>Sem refeições programadas.</small>}</article>;
    })}</div></section>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <span><small>{label}</small><strong>{value}</strong></span>; }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function dayIndex(value: string) { const normalized = normalize(value); const index = DAY_ORDER.findIndex((day) => normalized.includes(day)); return index === -1 ? 99 : index; }
