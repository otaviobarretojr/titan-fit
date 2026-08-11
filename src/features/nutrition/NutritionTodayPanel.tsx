import { useEffect, useMemo, useState } from 'react';
import { loadNutritionExecutionsForDate, nutritionTotalsForDate, saveNutritionMealExecution, todayKey } from './execution';
import { loadActiveNutritionPlan } from './storage';
import type { NutritionFood, NutritionMacroTotals, NutritionMeal } from './types';
import '../../styles/nutrition-v053.css';

const DAY_NAMES = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];

export function NutritionTodayPanel() {
  const [, setRevision] = useState(0);
  const [activeMeal, setActiveMeal] = useState<NutritionMeal | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [alternatives, setAlternatives] = useState<Record<string, number>>({});
  const plan = loadActiveNutritionPlan();
  const date = todayKey();
  const executions = loadNutritionExecutionsForDate(date);
  const totals = nutritionTotalsForDate(date);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('titan:nutrition-changed', refresh);
    return () => window.removeEventListener('titan:nutrition-changed', refresh);
  }, []);

  useEffect(() => {
    if (!activeMeal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [activeMeal]);

  if (!plan) return null;

  const todayName = DAY_NAMES[new Date().getDay()];
  const day = plan.days.find((item) => normalize(item.day).includes(todayName));
  const meals = [...(day?.meals ?? [])].sort((a, b) => a.plannedTime.localeCompare(b.plannedTime));
  const done = new Set(executions.map((item) => item.mealId));
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const next = meals.find((meal) => !done.has(meal.id) && toMinutes(meal.plannedTime) >= minutes)
    ?? meals.find((meal) => !done.has(meal.id))
    ?? null;
  const target = day?.target ?? plan.defaultTarget;

  function openMeal(meal: NutritionMeal) {
    setActiveMeal(meal);
    setAlternatives({});
    setQuantities(Object.fromEntries(meal.foods.map((food) => [food.id, food.quantity])));
  }

  function closeMeal() {
    setActiveMeal(null);
    setQuantities({});
    setAlternatives({});
  }

  function chooseAlternative(food: NutritionFood, index: number) {
    setAlternatives((current) => ({ ...current, [food.id]: index }));
    const option = index >= 0 ? food.alternatives?.[index] : undefined;
    setQuantities((current) => ({ ...current, [food.id]: option?.quantity ?? food.quantity }));
  }

  function calculateCurrentMacros(meal: NutritionMeal) {
    return roundMacros(meal.foods.reduce<NutritionMacroTotals>((sum, food) => {
      const selectedIndex = alternatives[food.id] ?? -1;
      const selected = selectedIndex >= 0 ? food.alternatives?.[selectedIndex] : undefined;
      const baseQuantity = selected?.quantity ?? food.quantity;
      const quantity = Math.max(0, Number(quantities[food.id] ?? baseQuantity));
      const ratio = baseQuantity > 0 ? quantity / baseQuantity : 0;
      const baseMacros = selected?.macros ? mergeMacros(food.macros, selected.macros) : food.macros;
      return addMacros(sum, scaleMacros(baseMacros, ratio));
    }, zeroMacros()));
  }

  function save(status: 'consumed' | 'partial' | 'skipped') {
    if (!activeMeal) return;
    const macros = status === 'skipped' ? zeroMacros() : calculateCurrentMacros(activeMeal);
    saveNutritionMealExecution({
      date,
      mealId: activeMeal.id,
      status,
      completedAt: new Date().toISOString(),
      foods: activeMeal.foods.map((food) => ({
        foodId: food.id,
        quantity: status === 'skipped' ? 0 : Math.max(0, Number(quantities[food.id] ?? food.quantity)),
      })),
      macros,
    });
    closeMeal();
    setRevision((value) => value + 1);
  }

  return <>
    <section className="nutrition-today-card" aria-label="Próxima refeição">
      <div className="nutrition-today-head">
        <div><span className="eyebrow">NUTRIÇÃO DE HOJE</span><h3>{next ? 'Próxima refeição' : 'Nutrição concluída'}</h3></div>
      </div>

      {next ? <>
        <div className="nutrition-next-meal" style={{ cursor: 'default' }}>
          <span className="nutrition-next-time">{next.plannedTime}</span>
          <div>
            <strong>{next.name}</strong>
            <small>{next.macros.caloriesKcal} kcal · P {next.macros.proteinG} · C {next.macros.carbohydrateG} · G {next.macros.fatG}</small>
          </div>
        </div>
        <button type="button" className="primary-action" onClick={() => openMeal(next)}>Consumir refeição</button>
      </> : <p className="nutrition-all-done">Todas as refeições programadas de hoje já foram registradas.</p>}
    </section>

    {activeMeal && <MealExecutionPage
      meal={activeMeal}
      quantities={quantities}
      alternatives={alternatives}
      currentMacros={calculateCurrentMacros(activeMeal)}
      onBack={closeMeal}
      onQuantityChange={(foodId, quantity) => setQuantities((current) => ({ ...current, [foodId]: quantity }))}
      onAlternativeChange={chooseAlternative}
      onSave={save}
      dayTotals={totals}
      dayTarget={target}
    />}
  </>;
}

type MealExecutionPageProps = {
  meal: NutritionMeal;
  quantities: Record<string, number>;
  alternatives: Record<string, number>;
  currentMacros: NutritionMacroTotals;
  dayTotals: NutritionMacroTotals;
  dayTarget: NutritionMacroTotals;
  onBack: () => void;
  onQuantityChange: (foodId: string, quantity: number) => void;
  onAlternativeChange: (food: NutritionFood, index: number) => void;
  onSave: (status: 'consumed' | 'partial' | 'skipped') => void;
};

function MealExecutionPage({ meal, quantities, alternatives, currentMacros, dayTotals, dayTarget, onBack, onQuantityChange, onAlternativeChange, onSave }: MealExecutionPageProps) {
  const difference = useMemo(() => subtractMacros(currentMacros, meal.macros), [currentMacros, meal.macros]);
  const projectedDay = addMacros(dayTotals, currentMacros);

  return <div role="dialog" aria-modal="true" aria-label={`Consumir ${meal.name}`} style={pageOverlayStyle}>
    <section style={pageStyle}>
      <header style={pageHeaderStyle}>
        <button type="button" className="text-action" onClick={onBack} aria-label="Voltar">← Voltar</button>
        <div style={{ textAlign: 'right' }}><span className="eyebrow">{meal.plannedTime}</span><div style={{ fontSize: 11, color: 'var(--text-muted,#737b86)', marginTop: 2 }}>REGISTRAR REFEIÇÃO</div></div>
      </header>

      <div style={{ padding: '2px 16px 0' }}>
        <h2 style={{ margin: '8px 0 4px', fontSize: 24 }}>{meal.name}</h2>
        {meal.notes && <p style={{ margin: '0 0 14px', color: 'var(--text-muted,#68707d)', fontSize: 12, lineHeight: 1.45 }}>{meal.notes}</p>}

        <section style={macroCardStyle}>
          <div><span className="eyebrow">META DA REFEIÇÃO</span><strong style={macroMainStyle}>{Math.round(meal.macros.caloriesKcal)} kcal</strong></div>
          <div style={macroGridStyle}><Macro label="Proteína" value={meal.macros.proteinG} /><Macro label="Carbo" value={meal.macros.carbohydrateG} /><Macro label="Gordura" value={meal.macros.fatG} /></div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, margin: '18px 0 8px' }}>
          <div><span className="eyebrow">ALIMENTOS PROGRAMADOS</span><div style={{ fontSize: 12, color: 'var(--text-muted,#68707d)', marginTop: 3 }}>Informe o que realmente consumiu.</div></div>
        </div>

        <div className="nutrition-food-execution">
          {meal.foods.map((food) => {
            const selectedIndex = alternatives[food.id] ?? -1;
            const selected = selectedIndex >= 0 ? food.alternatives?.[selectedIndex] : undefined;
            const baseQuantity = selected?.quantity ?? food.quantity;
            const unit = selected?.unit ?? food.unit;
            const baseMacros = selected?.macros ? mergeMacros(food.macros, selected.macros) : food.macros;
            return <article className="nutrition-food-row" key={food.id} style={{ alignItems: 'start' }}>
              <div className="nutrition-food-copy">
                <strong>{selected?.name ?? food.name}</strong>
                <small>Programado: {baseQuantity} {unit}</small>
                <small>{Math.round(baseMacros.caloriesKcal)} kcal · P {round1(baseMacros.proteinG)} · C {round1(baseMacros.carbohydrateG)} · G {round1(baseMacros.fatG)}</small>
                {food.alternatives?.length ? <select aria-label={`Substituir ${food.name}`} value={selectedIndex} onChange={(event) => onAlternativeChange(food, Number(event.target.value))}>
                  <option value={-1}>Manter {food.name}</option>
                  {food.alternatives.map((alt, index) => <option key={`${food.id}-${index}`} value={index}>{alt.name} · {alt.quantity} {alt.unit}</option>)}
                </select> : null}
              </div>
              <label className="nutrition-quantity-input" style={{ display: 'grid', justifyItems: 'end', gap: 4 }}>
                <small>Consumido</small>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><input aria-label={`Quantidade consumida de ${selected?.name ?? food.name}`} type="number" min="0" step="1" value={quantities[food.id] ?? baseQuantity} onChange={(event) => onQuantityChange(food.id, Number(event.target.value))}/><span>{unit}</span></span>
              </label>
            </article>;
          })}
        </div>

        <section style={{ ...macroCardStyle, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end' }}>
            <div><span className="eyebrow">CONSUMO ATUAL</span><strong style={macroMainStyle}>{Math.round(currentMacros.caloriesKcal)} kcal</strong></div>
            <small style={{ color: 'var(--text-muted,#68707d)', textAlign: 'right' }}>Δ {signed(Math.round(difference.caloriesKcal))} kcal</small>
          </div>
          <div style={macroGridStyle}><Macro label="Proteína" value={currentMacros.proteinG} delta={difference.proteinG} /><Macro label="Carbo" value={currentMacros.carbohydrateG} delta={difference.carbohydrateG} /><Macro label="Gordura" value={currentMacros.fatG} delta={difference.fatG} /></div>
        </section>

        <section style={dayProjectionStyle}>
          <span className="eyebrow">PROJEÇÃO DO DIA APÓS CONCLUIR</span>
          <div style={{ marginTop: 7, fontSize: 12, lineHeight: 1.6 }}>Calorias <strong>{Math.round(projectedDay.caloriesKcal)} / {Math.round(dayTarget.caloriesKcal)} kcal</strong> · Proteína <strong>{round1(projectedDay.proteinG)} / {round1(dayTarget.proteinG)} g</strong></div>
        </section>
      </div>

      <footer style={footerStyle}>
        <button type="button" className="primary-action" onClick={() => onSave('consumed')}>Finalizar refeição</button>
        <button type="button" className="secondary-action" onClick={() => onSave('partial')}>Registrar como parcial</button>
        <button type="button" className="text-action nutrition-skip" onClick={() => onSave('skipped')}>Não realizada</button>
      </footer>
    </section>
  </div>;
}

function Macro({ label, value, delta }: { label: string; value: number; delta?: number }) {
  return <span style={{ display: 'grid', gap: 2 }}><small style={{ color: 'var(--text-muted,#737b86)', fontSize: 10 }}>{label}</small><strong style={{ fontSize: 13 }}>{round1(value)} g</strong>{typeof delta === 'number' && <small style={{ color: 'var(--text-muted,#737b86)', fontSize: 9 }}>Δ {signed(round1(delta))} g</small>}</span>;
}

const pageOverlayStyle = { position: 'fixed', inset: 0, zIndex: 3000, background: 'var(--app-bg,#f4f6f8)', overflow: 'auto' } as const;
const pageStyle = { minHeight: '100dvh', background: 'var(--app-bg,#f4f6f8)', paddingBottom: 'calc(138px + env(safe-area-inset-bottom))' } as const;
const pageHeaderStyle = { position: 'sticky', top: 0, zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 'calc(12px + env(safe-area-inset-top)) 16px 12px', background: 'color-mix(in srgb,var(--app-bg,#f4f6f8) 92%,transparent)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border,#e5e7eb)' } as const;
const macroCardStyle = { padding: 15, borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--border,#e5e7eb)', boxShadow: '0 8px 24px rgba(15,23,42,.04)' } as const;
const macroMainStyle = { display: 'block', marginTop: 5, fontSize: 21 } as const;
const macroGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 12 } as const;
const dayProjectionStyle = { marginTop: 12, padding: 13, borderRadius: 16, background: 'color-mix(in srgb,#1677ff 7%,var(--surface,#fff))', border: '1px solid color-mix(in srgb,#1677ff 18%,var(--border,#e5e7eb))' } as const;
const footerStyle = { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 3010, display: 'grid', gap: 7, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: 'color-mix(in srgb,var(--surface,#fff) 96%,transparent)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border,#e5e7eb)' } as const;

function toMinutes(value: string) { const [hours, minutes] = value.split(':').map(Number); return (hours || 0) * 60 + (minutes || 0); }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function zeroMacros(): NutritionMacroTotals { return { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 }; }
function addMacros(a: NutritionMacroTotals, b: NutritionMacroTotals): NutritionMacroTotals { return { caloriesKcal: a.caloriesKcal + b.caloriesKcal, proteinG: a.proteinG + b.proteinG, carbohydrateG: a.carbohydrateG + b.carbohydrateG, fatG: a.fatG + b.fatG }; }
function subtractMacros(a: NutritionMacroTotals, b: NutritionMacroTotals): NutritionMacroTotals { return { caloriesKcal: a.caloriesKcal - b.caloriesKcal, proteinG: a.proteinG - b.proteinG, carbohydrateG: a.carbohydrateG - b.carbohydrateG, fatG: a.fatG - b.fatG }; }
function scaleMacros(macros: NutritionMacroTotals, ratio: number): NutritionMacroTotals { return { caloriesKcal: macros.caloriesKcal * ratio, proteinG: macros.proteinG * ratio, carbohydrateG: macros.carbohydrateG * ratio, fatG: macros.fatG * ratio }; }
function mergeMacros(base: NutritionMacroTotals, override: Partial<NutritionMacroTotals>): NutritionMacroTotals { return { caloriesKcal: override.caloriesKcal ?? base.caloriesKcal, proteinG: override.proteinG ?? base.proteinG, carbohydrateG: override.carbohydrateG ?? base.carbohydrateG, fatG: override.fatG ?? base.fatG }; }
function round1(value: number) { return Math.round(value * 10) / 10; }
function roundMacros(macros: NutritionMacroTotals): NutritionMacroTotals { return { caloriesKcal: Math.round(macros.caloriesKcal), proteinG: round1(macros.proteinG), carbohydrateG: round1(macros.carbohydrateG), fatG: round1(macros.fatG) }; }
function signed(value: number) { return value > 0 ? `+${value}` : `${value}`; }
