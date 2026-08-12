import { useState } from 'react';
import { readRecentNutritionHistory } from './advanced';
import { hydrationTotal, readHydrationHistory } from './hydration';
import { addBodyMetric, buildDynamicCalorieSuggestion, deleteBodyMetric, loadBodyMetrics, readEnergyHistory } from './progress';
import { loadNutritionSettings } from './settings';

function numberValue(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function signed(value: number) { return `${value > 0 ? '+' : ''}${value}`; }

function coachV4() {
  const settings = loadNutritionSettings();
  const nutrition = readRecentNutritionHistory(14);
  const energy = readEnergyHistory(14);
  const body = loadBodyMetrics().filter((item) => item.weightKg);
  const water = readHydrationHistory(7).filter((day) => hydrationTotal(day) > 0);
  if (nutrition.length < 3) return 'Registre pelo menos 3 dias de alimentação para o Coach cruzar aderência, energia e evolução corporal.';
  const avgCalories = Math.round(nutrition.reduce((sum, day) => sum + day.calories, 0) / nutrition.length);
  const avgProtein = Math.round(nutrition.reduce((sum, day) => sum + day.protein, 0) / nutrition.length);
  const avgBalance = energy.length ? Math.round(energy.reduce((sum, day) => sum + day.balanceKcal, 0) / energy.length) : undefined;
  const avgWater = water.length ? Math.round(water.reduce((sum, day) => sum + hydrationTotal(day), 0) / water.length) : 0;
  const latestWeight = body.at(-1)?.weightKg;
  const previousWeight = body.at(-2)?.weightKg;
  const weightText = latestWeight && previousWeight ? ` Peso ${latestWeight > previousWeight ? 'subiu' : latestWeight < previousWeight ? 'caiu' : 'ficou estável'} desde o último registro.` : '';
  if (avgProtein < settings.proteinTarget * .9) return `Proteína média em ${avgProtein} g/dia. Antes de mexer nas calorias, aproxime-se de ${settings.proteinTarget} g/dia.${weightText}`;
  if (typeof avgBalance === 'number' && avgBalance < settings.balanceMin - 150) return `Saldo médio em ${signed(avgBalance)} kcal, mais agressivo que a faixa ${settings.balanceMin} a ${settings.balanceMax}. Proteja desempenho e recuperação.${weightText}`;
  if (typeof avgBalance === 'number' && avgBalance > settings.balanceMax + 150) return `Saldo médio em ${signed(avgBalance)} kcal, acima da faixa planejada. Confira tendência de cintura e peso antes de reduzir calorias.${weightText}`;
  if (avgWater && avgWater < settings.hydrationGoalMl * .8) return `Energia está razoavelmente alinhada, mas a hidratação média ficou em ${(avgWater / 1000).toFixed(1).replace('.', ',')} L. Priorize regularidade de água.${weightText}`;
  return `Boa consistência: média de ${avgCalories} kcal, ${avgProtein} g de proteína${typeof avgBalance === 'number' ? ` e saldo de ${signed(avgBalance)} kcal` : ''}. Mantenha a estratégia enquanto força, peso e cintura evoluírem na direção desejada.${weightText}`;
}

export function ProgressDashboard() {
  const settings = loadNutritionSettings();
  const nutrition = readRecentNutritionHistory(30);
  const energy = readEnergyHistory(30);
  const hydration = readHydrationHistory(7);
  const [body, setBody] = useState(() => loadBodyMetrics());
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const suggestion = buildDynamicCalorieSuggestion();
  const avgCalories = nutrition.length ? Math.round(nutrition.reduce((sum, day) => sum + day.calories, 0) / nutrition.length) : 0;
  const avgProtein = nutrition.length ? Math.round(nutrition.reduce((sum, day) => sum + day.protein, 0) / nutrition.length) : 0;
  const avgBalance = energy.length ? Math.round(energy.slice(-14).reduce((sum, day) => sum + day.balanceKcal, 0) / energy.slice(-14).length) : 0;
  const waterDays = hydration.filter((day) => hydrationTotal(day) > 0);
  const avgWater = waterDays.length ? Math.round(waterDays.reduce((sum, day) => sum + hydrationTotal(day), 0) / waterDays.length) : 0;
  const maxEnergy = Math.max(1, ...energy.slice(-7).flatMap((day) => [day.consumedKcal, day.expenditureKcal]));

  function saveBody() {
    if (!numberValue(weight) && !numberValue(waist)) return;
    setBody(addBodyMetric({ date, weightKg: numberValue(weight), waistCm: numberValue(waist), note }));
    setWeight(''); setWaist(''); setNote('');
  }

  return <main className="nutrition-app nutrition-shell-page nutrition-progress-v4">
    <header className="nutrition-shell-header"><span className="nutrition-eyebrow">TENDÊNCIAS</span><h1>Evolução</h1><p>Energia, composição corporal, hidratação e decisões do Coach TITAN.</p></header>
    <section className="nutrition-insight-grid"><article><small>Média kcal</small><strong>{avgCalories || '—'}</strong></article><article><small>Proteína média</small><strong>{avgProtein ? `${avgProtein} g` : '—'}</strong></article><article><small>Saldo médio · 14d</small><strong>{energy.length ? `${signed(avgBalance)} kcal` : '—'}</strong></article><article><small>Água média · 7d</small><strong>{avgWater ? `${(avgWater / 1000).toFixed(1).replace('.', ',')} L` : '—'}</strong></article></section>

    <section className="nutrition-coach-card"><span className="nutrition-eyebrow">COACH TITAN V4</span><p>{coachV4()}</p></section>
    <section className={`nutrition-adjustment-card${suggestion.delta ? ' has-suggestion' : ''}`}><div><small>AJUSTE CALÓRICO SUGERIDO</small><strong>{suggestion.label}</strong><p>{suggestion.reason}</p></div><b>{suggestion.target} kcal</b><small>O TITAN nunca altera sua meta automaticamente.</small></section>

    <section className="nutrition-energy-history-card"><div><span className="nutrition-eyebrow">7 DIAS</span><h2>Consumo × gasto</h2></div>{energy.length ? <div className="nutrition-energy-bars">{energy.slice(-7).map((day) => <article key={day.date}><div className="nutrition-energy-bar-pair"><i className="is-intake" style={{ height: `${Math.max(3, day.consumedKcal / maxEnergy * 100)}%` }}/><i className="is-burn" style={{ height: `${Math.max(3, day.expenditureKcal / maxEnergy * 100)}%` }}/></div><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'narrow' })}</small><b className={day.balanceKcal >= settings.balanceMin && day.balanceKcal <= settings.balanceMax ? 'is-target' : ''}>{signed(day.balanceKcal)}</b></article>)}</div> : <p>Use o painel Hoje por alguns dias para formar o histórico energético.</p>}<footer><span>Azul = consumo</span><span>Laranja = gasto</span><span>Alvo {settings.balanceMin} a {settings.balanceMax}</span></footer></section>

    <section className="nutrition-body-card"><div><span className="nutrition-eyebrow">COMPOSIÇÃO CORPORAL</span><h2>Peso e cintura</h2></div><div className="nutrition-body-form"><input type="date" value={date} onChange={(e) => setDate(e.target.value)}/><label><span>Peso</span><div><input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex.: 91,0"/><small>kg</small></div></label><label><span>Cintura</span><div><input inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="Ex.: 89,5"/><small>cm</small></div></label><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observação opcional"/><button className="nutrition-primary" onClick={saveBody}>Registrar evolução</button></div><div className="nutrition-body-history">{body.slice(-8).reverse().map((entry) => <article key={entry.id}><div><strong>{new Date(`${entry.date}T12:00:00`).toLocaleDateString('pt-BR')}</strong><small>{entry.note || 'Registro corporal'}</small></div><span>{entry.weightKg ? `${entry.weightKg.toLocaleString('pt-BR')} kg` : ''}{entry.weightKg && entry.waistCm ? ' • ' : ''}{entry.waistCm ? `${entry.waistCm.toLocaleString('pt-BR')} cm` : ''}</span><button onClick={() => setBody(deleteBodyMetric(entry.id))}>×</button></article>)}</div></section>

    <section className="nutrition-hydration-history-card"><h3>Hidratação · últimos 7 dias</h3>{hydration.map((day) => { const total = hydrationTotal(day); return <div key={day.date}><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })}</small><span><i style={{ width: `${Math.min(100, total / Math.max(1, day.goalMl) * 100)}%` }}/></span><strong>{(total / 1000).toFixed(1).replace('.', ',')} L</strong></div>; })}</section>
  </main>;
}
