import { useEffect, useMemo, useState } from 'react';
import { buildAdaptiveDayPlan } from '../features/nutrition/advanced';
import { hydrationTotal, loadTodayHydration } from '../features/nutrition/hydration';
import { loadNutritionSettings } from '../features/nutrition/settings';
import { loadDailyMeals } from '../features/nutrition/storage';
import type { PlannedMeal } from '../features/nutrition/types';

type ChatMessage = { id: string; role: 'coach' | 'user'; text: string };

function statusLabel(status: ReturnType<typeof buildAdaptiveDayPlan>['status']) {
  if (status === 'over') return 'Acima do planejado';
  if (status === 'under') return 'Abaixo do ritmo';
  if (status === 'skipped') return 'Dia recalculado';
  if (status === 'finished') return 'Dia concluído';
  if (status === 'no-data') return 'Sem planejamento';
  return 'No ritmo';
}

function signed(value: number) { return `${value > 0 ? '+' : ''}${value}`; }

export function AdaptiveDayCoachPanel() {
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'coach', text: 'Sou o Coach TITAN Nutrition. Posso analisar seu consumo de hoje, refeições puladas, proteína, hidratação e quanto ainda cabe no seu planejamento.' },
  ]);

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
  const settings = loadNutritionSettings();
  const water = loadTodayHydration();
  const waterMl = hydrationTotal(water);
  const completed = meals.filter((meal) => meal.status === 'completed').length;
  const skipped = meals.filter((meal) => meal.status === 'skipped').length;

  function answer(question: string) {
    const text = question.toLocaleLowerCase('pt-BR');
    if (/água|agua|hidrata/.test(text)) {
      const missing = Math.max(0, settings.hydrationGoalMl - waterMl);
      return missing > 0
        ? `Você registrou ${(waterMl / 1000).toFixed(2).replace('.', ',')} L hoje. Faltam aproximadamente ${(missing / 1000).toFixed(2).replace('.', ',')} L para a meta de ${(settings.hydrationGoalMl / 1000).toFixed(2).replace('.', ',')} L.`
        : 'Sua meta de hidratação do dia já foi atingida. Continue distribuindo a ingestão conforme sede e rotina, sem necessidade de forçar volume extra.';
    }
    if (/proteína|proteina/.test(text)) {
      return `Até agora foram registrados ${adaptive.consumed.proteinG} g de proteína. O restante calculado para o dia é cerca de ${adaptive.remaining.proteinG} g, considerando sua meta atual.`;
    }
    if (/pulei|pulada|pular|refeição/.test(text) && skipped > 0) {
      return `${skipped} refeição${skipped > 1 ? 'ões foram puladas' : ' foi pulada'} hoje. O Adaptive Day já redistribuiu o que ainda cabe no plano: aproximadamente ${adaptive.remaining.caloriesKcal} kcal nas refeições restantes, priorizando proteína e evitando compensações extremas.`;
    }
    if (/quanto.*(comer|consumir)|resta|faltam|próxima|proxima/.test(text)) {
      return `Para o restante do dia, a referência atual é ${adaptive.remaining.caloriesKcal} kcal, com cerca de ${adaptive.remaining.proteinG} g de proteína, ${adaptive.remaining.carbohydrateG} g de carboidratos e ${adaptive.remaining.fatG} g de gorduras. ${adaptive.mealTargets[0] ? `Na próxima refeição (${adaptive.mealTargets[0].mealName}), o alvo sugerido é aproximadamente ${adaptive.mealTargets[0].caloriesKcal} kcal.` : ''}`;
    }
    if (/excesso|passei|acima|saldo|caloria/.test(text)) {
      return `${adaptive.title}. ${adaptive.message} O TITAN não recomenda zerar carboidratos nem usar exercício como punição; o ajuste é feito redistribuindo as refeições restantes e preservando proteína.`;
    }
    if (/como.*(estou|tá|ta)|resumo|hoje/.test(text)) {
      return `${statusLabel(adaptive.status)}: você concluiu ${completed} refeição${completed === 1 ? '' : 'ões'}${skipped ? ` e pulou ${skipped}` : ''}. Consumido: ${adaptive.consumed.caloriesKcal} kcal. Restante planejado: ${adaptive.remaining.caloriesKcal} kcal. ${adaptive.message}`;
    }
    return `${adaptive.message} Neste momento, seu restante de referência é ${adaptive.remaining.caloriesKcal} kcal e ${adaptive.remaining.proteinG} g de proteína. Você pode me perguntar “como estou hoje?”, “quanto falta comer?”, “como está minha proteína?” ou “como está minha água?”.`;
  }

  function send(text = input) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const stamp = Date.now();
    setMessages((current) => [...current, { id: `u-${stamp}`, role: 'user', text: trimmed }, { id: `c-${stamp}`, role: 'coach', text: answer(trimmed) }]);
    setInput('');
  }

  const quick = ['Como estou hoje?', 'Quanto falta comer?', 'Como está minha proteína?', 'Como está minha água?'];

  return <main className="nutrition-app nutrition-shell-page adaptive-coach-page">
    <header className="nutrition-shell-header"><span className="nutrition-eyebrow">COACH IA • ADAPTIVE DAY</span><h1>Coach TITAN</h1><p>Converse com o Coach usando os registros nutricionais do dia.</p></header>

    <section className={`adaptive-coach-status is-${adaptive.status}`}><div><small>STATUS DE HOJE</small><strong>{statusLabel(adaptive.status)}</strong><p>{adaptive.title}</p></div><div><small>Consumido</small><strong>{adaptive.consumed.caloriesKcal} kcal</strong><span>Restam {adaptive.remaining.caloriesKcal} kcal</span></div></section>

    <section className="adaptive-coach-targets"><article><small>Proteína restante</small><strong>{adaptive.remaining.proteinG} g</strong></article><article><small>Carbo restante</small><strong>{adaptive.remaining.carbohydrateG} g</strong></article><article><small>Gordura restante</small><strong>{adaptive.remaining.fatG} g</strong></article><article><small>Faixa energética</small><strong>{signed(settings.balanceMin)} a {signed(settings.balanceMax)}</strong></article></section>

    <div className="adaptive-coach-quick">{quick.map((item) => <button key={item} onClick={() => send(item)}>{item}</button>)}</div>

    <section className="adaptive-coach-chat" aria-live="polite">{messages.map((message) => <article key={message.id} className={`is-${message.role}`}><small>{message.role === 'coach' ? 'COACH TITAN' : 'VOCÊ'}</small><p>{message.text}</p></article>)}</section>

    <form className="adaptive-coach-composer" onSubmit={(event) => { event.preventDefault(); send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Pergunte sobre sua alimentação de hoje…"/><button type="submit" disabled={!input.trim()}>Enviar</button></form>
    <small className="adaptive-coach-disclaimer">As respostas usam seus dados registrados no TITAN Nutrition e regras nutricionais locais; não substituem acompanhamento profissional.</small>
  </main>;
}
