import { useMemo, useRef, useState } from 'react';
import { NutritionEntry } from './NutritionEntry';
import { TitanTodayHero } from './TitanTodayHero';
import { AdaptiveDayCoachPanel } from './AdaptiveDayCoachPanel';
import { NutritionLibraryView } from '../features/nutrition/NutritionLibraryView';
import { buildWeeklyShoppingList } from '../features/nutrition/shoppingList';
import { loadWeeklyPlan } from '../features/nutrition/weeklyPlanStorage';
import { formatMacros, sumMacros } from '../features/nutrition/engine';
import { getFoodById } from '../features/nutrition/foodRepository';
import { downloadNutritionBackup, restoreNutritionBackupText } from '../features/nutrition/backup';
import { RecipeLibraryView } from '../features/nutrition/RecipeLibraryView';
import { NutritionSettingsView } from '../features/nutrition/NutritionSettingsView';
import { loadNutritionSettings } from '../features/nutrition/settings';
import { ProgressDashboard } from '../features/nutrition/ProgressDashboard';

type Tab = 'today' | 'diet' | 'coach' | 'library' | 'progress' | 'more';

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'today', icon: '⌂', label: 'Hoje' },
    { id: 'diet', icon: '▦', label: 'Dieta' },
    { id: 'coach', icon: '◆', label: 'Coach' },
    { id: 'library', icon: '◫', label: 'Biblioteca' },
    { id: 'progress', icon: '⌁', label: 'Evolução' },
    { id: 'more', icon: '•••', label: 'Mais' },
  ];
  return <nav className="nutrition-bottom-nav nutrition-bottom-nav-six" aria-label="Navegação principal">{items.map((item) => <button key={item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => onChange(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>;
}

function DietView() {
  const plans = loadWeeklyPlan();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDayId, setSelectedDayId] = useState(plans[todayIndex]?.id ?? plans[0]?.id ?? '');
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const selectedDay = plans.find((day) => day.id === selectedDayId) ?? plans[0];
  const macros = selectedDay ? formatMacros(sumMacros(selectedDay.meals.flatMap((meal) => meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))))) : null;

  return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-shell-header"><span className="nutrition-eyebrow">PLANEJAMENTO</span><h1>Dieta</h1><p>Escolha o dia e abra somente a refeição que deseja consultar.</p></header><section className="nutrition-day-picker" aria-label="Dias da semana">{plans.map((day) => <button key={day.id} className={day.id === selectedDay?.id ? 'is-active' : ''} onClick={() => { setSelectedDayId(day.id); setExpandedMealId(null); }}><small>{day.label.slice(0, 3)}</small><strong>{day.label}</strong></button>)}</section>{selectedDay && macros && <><section className="nutrition-day-summary"><div><span className="nutrition-eyebrow">{selectedDay.meals.length} REFEIÇÕES</span><h2>{selectedDay.label}</h2></div><div><strong>{macros.caloriesKcal} kcal</strong><small>P {macros.proteinG} • C {macros.carbohydrateG} • G {macros.fatG} g</small></div></section><section className="nutrition-diet-meals">{selectedDay.meals.map((meal) => { const open = expandedMealId === meal.id; const mealMacros = formatMacros(sumMacros(meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount })))); return <article className={`nutrition-diet-meal${open ? ' is-open' : ''}`} key={meal.id}><button className="nutrition-diet-meal-head" onClick={() => setExpandedMealId(open ? null : meal.id)}><div><small>{meal.time}</small><strong>{meal.name}</strong><span>{meal.items.length} itens • {mealMacros.caloriesKcal} kcal</span></div><b>{open ? '−' : '+'}</b></button>{open && <div className="nutrition-diet-meal-body">{meal.items.map((item) => { const food = getFoodById(item.foodId); if (!food) return null; return <div key={item.id}><span>{food.name}</span><strong>{item.plannedAmount} {food.unit}</strong></div>; })}<div className="nutrition-diet-meal-macros"><small>Macros da refeição</small><strong>{mealMacros.caloriesKcal} kcal • P {mealMacros.proteinG} • C {mealMacros.carbohydrateG} • G {mealMacros.fatG}</strong></div></div>}</article>; })}</section></>}</main>;
}

function MoreView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('titan-nutrition:shopping-checked:v1') ?? '{}') as Record<string, boolean>; } catch { return {}; }
  });
  const shopping = useMemo(() => buildWeeklyShoppingList(loadWeeklyPlan()), []);
  const settings = loadNutritionSettings();

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

  if (settingsOpen) return <NutritionSettingsView onBack={() => setSettingsOpen(false)} />;
  if (shoppingOpen) return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-shell-header"><button className="nutrition-back" onClick={() => setShoppingOpen(false)}>←</button><span className="nutrition-eyebrow">SEMANA</span><h1>Lista de compras</h1><p>{shopping.length} itens calculados a partir da sua dieta.</p></header><section className="nutrition-shopping-list">{shopping.map((item) => <button key={item.foodId} className={`nutrition-shopping-row${shoppingChecked[item.foodId] ? ' is-checked' : ''}`} onClick={() => toggleShopping(item.foodId)}><span className="nutrition-shopping-check">{shoppingChecked[item.foodId] ? '✓' : ''}</span><div><strong>{item.name}</strong><small>{item.amount} {item.unit}</small></div></button>)}</section></main>;

  return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-shell-header"><span className="nutrition-eyebrow">FERRAMENTAS</span><h1>Mais</h1><p>Metas, notificações, compras, dados e integrações.</p></header><section className="nutrition-more-list"><button className="nutrition-more-action" onClick={() => setSettingsOpen(true)}><div><strong>Metas e notificações</strong><small>{settings.calorieTarget} kcal • saldo {settings.balanceMin} a {settings.balanceMax} • água {(settings.hydrationGoalMl / 1000).toLocaleString('pt-BR')} L</small></div><span>›</span></button><button className="nutrition-more-action" onClick={() => setShoppingOpen(true)}><div><strong>Lista de compras</strong><small>{shopping.length} itens calculados para a semana</small></div><span>›</span></button><article><div><strong>Dados e backup</strong><small>Proteja sua biblioteca, receitas, dieta, metas e histórico.</small></div></article><div className="nutrition-backup-actions"><button className="nutrition-primary" onClick={() => void exportBackup()}>Exportar backup</button><button className="nutrition-secondary" onClick={() => fileRef.current?.click()}>Restaurar backup</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => void restore(event.target.files?.[0])}/>{message && <small>{message}</small>}</div><article><div><strong>Integração com relógio</strong><small>Samsung Health / Health Connect é gerenciado na tela Hoje.</small></div></article><article><div><strong>Sobre o TITAN Nutrition</strong><small>Dados locais, biblioteca e planejamento alimentar.</small></div></article></section></main>;
}

export function NutritionShell() {
  const [tab, setTab] = useState<Tab>('today');
  const [libraryMode, setLibraryMode] = useState<'foods' | 'recipes'>('foods');
  let content;
  if (tab === 'today') content = <div className="titan-today-v4"><TitanTodayHero/><NutritionEntry /></div>;
  else if (tab === 'diet') content = <DietView />;
  else if (tab === 'coach') content = <AdaptiveDayCoachPanel />;
  else if (tab === 'library') content = <main className="nutrition-library-shell"><div className="nutrition-library-segment"><button className={libraryMode === 'foods' ? 'is-active' : ''} onClick={() => setLibraryMode('foods')}>Alimentos</button><button className={libraryMode === 'recipes' ? 'is-active' : ''} onClick={() => setLibraryMode('recipes')}>Receitas</button></div>{libraryMode === 'foods' ? <NutritionLibraryView onBack={() => setTab('today')} /> : <RecipeLibraryView />}</main>;
  else if (tab === 'progress') content = <ProgressDashboard />;
  else content = <MoreView />;
  return <div className="nutrition-shell">{content}<BottomNav tab={tab} onChange={setTab}/></div>;
}
