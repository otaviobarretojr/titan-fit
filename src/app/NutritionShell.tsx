import { useMemo, useRef, useState } from 'react';
import { NutritionEntry } from './NutritionEntry';
import { NutritionLibraryView } from '../features/nutrition/NutritionLibraryView';
import { buildWeeklyShoppingList } from '../features/nutrition/shoppingList';
import { loadWeeklyPlan } from '../features/nutrition/weeklyPlanStorage';
import { formatMacros, sumMacros } from '../features/nutrition/engine';
import { getFoodById } from '../features/nutrition/foodRepository';
import { readRecentNutritionHistory, buildCoachMessage } from '../features/nutrition/advanced';
import { downloadNutritionBackup, restoreNutritionBackupText } from '../features/nutrition/backup';
import { RecipeLibraryView } from '../features/nutrition/RecipeLibraryView';

type Tab = 'today' | 'diet' | 'library' | 'progress' | 'more';

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'today', icon: '⌂', label: 'Hoje' },
    { id: 'diet', icon: '▦', label: 'Dieta' },
    { id: 'library', icon: '◫', label: 'Biblioteca' },
    { id: 'progress', icon: '⌁', label: 'Evolução' },
    { id: 'more', icon: '•••', label: 'Mais' },
  ];
  return <nav className="nutrition-bottom-nav" aria-label="Navegação principal">{items.map((item) => <button key={item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => onChange(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>;
}

function DietView() {
  const plans = loadWeeklyPlan();
  return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-shell-header"><span className="nutrition-eyebrow">PLANEJAMENTO</span><h1>Dieta</h1><p>Sua programação alimentar da semana.</p></header><section className="nutrition-week-list">{plans.map((day) => { const macros = formatMacros(sumMacros(day.meals.flatMap((meal) => meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))))); return <article className="nutrition-week-card" key={day.id}><div className="nutrition-week-card-head"><div><span className="nutrition-eyebrow">{day.meals.length} REFEIÇÕES</span><h3>{day.label}</h3></div><b>{macros.caloriesKcal} kcal</b></div><p>P {macros.proteinG} g • C {macros.carbohydrateG} g • G {macros.fatG} g</p><div className="nutrition-week-meals">{day.meals.map((meal) => <div key={meal.id}><strong>{meal.time} · {meal.name}</strong><small>{meal.items.map((item) => getFoodById(item.foodId)?.name ?? item.foodId).join(' • ')}</small></div>)}</div></article>; })}</section></main>;
}

function ProgressView() {
  const history = readRecentNutritionHistory(30);
  const recent = history.slice(-7);
  const avgCalories = history.length ? Math.round(history.reduce((sum, day) => sum + day.calories, 0) / history.length) : 0;
  const avgProtein = history.length ? Math.round(history.reduce((sum, day) => sum + day.protein, 0) / history.length) : 0;
  const maxCalories = Math.max(1, ...recent.map((day) => day.calories));
  const coach = buildCoachMessage(history.slice(-14), 2900, 195);
  return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-shell-header"><span className="nutrition-eyebrow">30 DIAS</span><h1>Evolução</h1><p>Médias, aderência e tendência nutricional.</p></header><section className="nutrition-insight-grid"><article><small>Média kcal</small><strong>{avgCalories || '—'}</strong></article><article><small>Média proteína</small><strong>{avgProtein ? `${avgProtein} g` : '—'}</strong></article><article><small>Dias registrados</small><strong>{history.length}</strong></article></section><section className="nutrition-coach-card"><span className="nutrition-eyebrow">COACH TITAN</span><p>{coach}</p></section><section className="nutrition-trend-card"><h3>Últimos 7 dias</h3><div className="nutrition-mini-chart">{recent.map((day) => <div key={day.date}><span style={{ height: `${Math.max(4, day.calories / maxCalories * 100)}%` }} /><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'narrow' })}</small></div>)}</div></section></main>;
}

function MoreView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('titan-nutrition:shopping-checked:v1') ?? '{}') as Record<string, boolean>; } catch { return {}; }
  });
  const shopping = useMemo(() => buildWeeklyShoppingList(loadWeeklyPlan()), []);

  function toggleShopping(foodId: string) {
    const next = { ...shoppingChecked, [foodId]: !shoppingChecked[foodId] };
    setShoppingChecked(next);
    localStorage.setItem('titan-nutrition:shopping-checked:v1', JSON.stringify(next));
  }

  async function exportBackup() {
    setMessage('Preparando backup…');
    try {
      const result = await downloadNutritionBackup();
      setMessage(result === 'shared' ? 'Backup pronto para compartilhar ou salvar.' : 'Backup exportado.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return setMessage('Exportação cancelada.');
      setMessage('Não foi possível exportar o backup.');
    }
  }

  async function restore(file?: File) {
    if (!file) return;
    try { restoreNutritionBackupText(await file.text()); setMessage('Backup restaurado. Feche e abra o app para recarregar todos os dados.'); } catch { setMessage('Não foi possível restaurar esse arquivo.'); }
  }

  if (shoppingOpen) return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-shell-header"><button className="nutrition-back" onClick={() => setShoppingOpen(false)}>←</button><span className="nutrition-eyebrow">SEMANA</span><h1>Lista de compras</h1><p>{shopping.length} itens calculados a partir da sua dieta.</p></header><section className="nutrition-shopping-list">{shopping.map((item) => <button key={item.foodId} className={`nutrition-shopping-row${shoppingChecked[item.foodId] ? ' is-checked' : ''}`} onClick={() => toggleShopping(item.foodId)}><span className="nutrition-shopping-check">{shoppingChecked[item.foodId] ? '✓' : ''}</span><div><strong>{item.name}</strong><small>{item.amount} {item.unit}</small></div></button>)}</section></main>;

  return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-shell-header"><span className="nutrition-eyebrow">FERRAMENTAS</span><h1>Mais</h1><p>Compras, dados e configurações.</p></header><section className="nutrition-more-list"><button className="nutrition-more-action" onClick={() => setShoppingOpen(true)}><div><strong>Lista de compras</strong><small>{shopping.length} itens calculados para a semana</small></div><span>›</span></button><article><div><strong>Dados e backup</strong><small>Proteja sua biblioteca, receitas, dieta e histórico.</small></div></article><div className="nutrition-backup-actions"><button className="nutrition-primary" onClick={() => void exportBackup()}>Exportar backup</button><button className="nutrition-secondary" onClick={() => fileRef.current?.click()}>Restaurar backup</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => void restore(event.target.files?.[0])}/>{message && <small>{message}</small>}</div><article><div><strong>Integração com relógio</strong><small>Samsung Health / Health Connect é gerenciado na tela Hoje.</small></div></article><article><div><strong>Sobre o TITAN Nutrition</strong><small>Dados locais, biblioteca e planejamento alimentar.</small></div></article></section></main>;
}

export function NutritionShell() {
  const [tab, setTab] = useState<Tab>('today');
  const [libraryMode, setLibraryMode] = useState<'foods' | 'recipes'>('foods');
  let content;
  if (tab === 'today') content = <NutritionEntry />;
  else if (tab === 'diet') content = <DietView />;
  else if (tab === 'library') content = <main className="nutrition-library-shell"><div className="nutrition-library-segment"><button className={libraryMode === 'foods' ? 'is-active' : ''} onClick={() => setLibraryMode('foods')}>Alimentos</button><button className={libraryMode === 'recipes' ? 'is-active' : ''} onClick={() => setLibraryMode('recipes')}>Receitas</button></div>{libraryMode === 'foods' ? <NutritionLibraryView onBack={() => setTab('today')} /> : <RecipeLibraryView />}</main>;
  else if (tab === 'progress') content = <ProgressView />;
  else content = <MoreView />;
  return <div className="nutrition-shell">{content}<BottomNav tab={tab} onChange={setTab}/></div>;
}
