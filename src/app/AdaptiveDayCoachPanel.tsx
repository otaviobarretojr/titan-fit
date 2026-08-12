import { useEffect, useMemo, useState } from 'react';
import { buildAdaptiveDayPlan } from '../features/nutrition/advanced';
import { loadDailyMeals } from '../features/nutrition/storage';
import type { PlannedMeal } from '../features/nutrition/types';

function statusLabel(status: ReturnType<typeof buildAdaptiveDayPlan>['status']) {
  if (status === 'over') return 'Atenção';
  if (status === 'under') return 'Abaixo do ritmo';
  if (status === 'skipped') return 'Dia recalculado';
  if (status === 'finished') return 'Dia concluído';
  if (status === 'no-data') return 'Sem planejamento';
  return 'No ritmo';
}

export function AdaptiveDayCoachPanel() {
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const loaded = await loadDailyMeals();
      if (!mounted) return;
      setMeals(loaded);
      setNow(new Date());
    };
    void refresh();
    const onMealsChanged = () => void refresh();
    const minute = window.setInterval(() => setNow(new Date()), 60_000);
    window.addEventListener('titan-nutrition-meals-changed', onMealsChanged);
    return () => {
      mounted = false;
      window.clearInterval(minute);
      window.removeEventListener('titan-nutrition-meals-changed', onMealsChanged);
    };
  }, []);

  const adaptive = useMemo(() => buildAdaptiveDayPlan(meals, now), [meals, now]);
  const urgent = adaptive.status === 'over' || adaptive.status === 'skipped' || adaptive.status === 'under';

  return <>
    <button className={`adaptive-day-fab is-${adaptive.status}`} onClick={() => setOpen(true)} aria-label="Abrir Coach Adaptive Day">
      <span>◆</span>
      <div><strong>Coach v5</strong><small>{statusLabel(adaptive.status)}</small></div>
      {urgent && <b>!</b>}
    </button>

    {open && <div className="adaptive-day-overlay" role="presentation" onClick={() => setOpen(false)}>
      <section className={`adaptive-day-sheet is-${adaptive.status}`} role="dialog" aria-modal="true" aria-label="Coach Nutricional Adaptive Day" onClick={(event) => event.stopPropagation()}>
        <header>
          <div><span className="nutrition-eyebrow">COACH NUTRICIONAL V5</span><h2>Adaptive Day</h2></div>
          <button onClick={() => setOpen(false)} aria-label="Fechar">×</button>
        </header>

        <article className="adaptive-day-priority">
          <small>{statusLabel(adaptive.status)}</small>
          <strong>{adaptive.title}</strong>
          <p>{adaptive.message}</p>
        </article>

        <div className="adaptive-day-totals">
          <article><small>Consumido</small><strong>{adaptive.consumed.caloriesKcal} kcal</strong><span>P {adaptive.consumed.proteinG} · C {adaptive.consumed.carbohydrateG} · G {adaptive.consumed.fatG}</span></article>
          <article><small>Restante</small><strong>{adaptive.remaining.caloriesKcal} kcal</strong><span>P {adaptive.remaining.proteinG} · C {adaptive.remaining.carbohydrateG} · G {adaptive.remaining.fatG}</span></article>
        </div>

        {adaptive.mealTargets.length > 0 ? <>
          <div className="adaptive-day-section-title"><span>PRÓXIMAS REFEIÇÕES</span><small>Metas reajustadas conforme o consumo de hoje</small></div>
          <div className="adaptive-day-meals">
            {adaptive.mealTargets.map((target, index) => <article key={target.mealId} className="adaptive-day-meal-card">
              <div className="adaptive-day-meal-head"><div><small>{target.time}</small><strong>{target.mealName}</strong></div>{index === 0 && <span>PRÓXIMA</span>}</div>
              <div className="adaptive-day-meal-energy"><strong>{target.caloriesKcal} <small>kcal</small></strong><span>P {target.proteinG} g · C {target.carbohydrateG} g · G {target.fatG} g</span></div>
              {adaptive.status === 'over' && target.proteinG > 0 && <p>Priorize proteína magra e vegetais. A meta calórica do dia já foi alcançada, então evite concentrar carboidratos e gorduras extras.</p>}
              {adaptive.status !== 'over' && <p>Use esta faixa como referência; o Coach recalcula novamente após o próximo registro.</p>}
            </article>)}
          </div>
        </> : <div className="adaptive-day-empty"><strong>Nenhuma refeição restante</strong><p>O Coach volta a recalcular automaticamente quando um novo dia começar.</p></div>}

        <footer><small>O Adaptive Day redistribui o plano alimentar; ele não recomenda exercício como punição nem compensação de comida.</small><button className="nutrition-primary" onClick={() => setOpen(false)}>Entendi</button></footer>
      </section>
    </div>}
  </>;
}
