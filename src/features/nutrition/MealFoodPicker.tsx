import { useState } from 'react';
import '../../styles/nutrition-library.css';
import { getAllFoods } from './foodRepository';
import { loadFoodFavorites, loadFoodUsage, loadRecentFoods, markFoodRecent } from './foodPreferences';
import { suggestEquivalentAmount } from './advanced';
import type { Food } from './types';

export function MealFoodPicker({ onAdd, onClose, replaceFoodId, replaceAmount }: { onAdd: (food: Food, amount: number) => void; onClose: () => void; replaceFoodId?: string; replaceAmount?: number }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [amount, setAmount] = useState('');
  const favorites = loadFoodFavorites();
  const recents = loadRecentFoods();
  const usage = loadFoodUsage();
  const term = search.trim().toLocaleLowerCase('pt-BR');
  const foods = getAllFoods().filter((food) => food.id !== replaceFoodId && (!term || `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase('pt-BR').includes(term))).sort((a, b) => {
    const fav = Number(favorites.includes(b.id)) - Number(favorites.includes(a.id));
    if (fav) return fav;
    const frequent = (usage[b.id] ?? 0) - (usage[a.id] ?? 0);
    if (frequent) return frequent;
    const ai = recents.indexOf(a.id); const bi = recents.indexOf(b.id);
    if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    return a.name.localeCompare(b.name, 'pt-BR');
  }).slice(0, 60);

  function choose(food: Food) {
    setSelected(food);
    const suggested = replaceFoodId && replaceAmount ? suggestEquivalentAmount(replaceFoodId, replaceAmount, food) : food.referenceAmount;
    setAmount(String(suggested).replace('.', ','));
  }

  function parseAmount() {
    const parsed = Number(amount.replace(',', '.'));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function confirmSelection() {
    if (!selected) return;
    const value = parseAmount();
    if (value <= 0) return;
    markFoodRecent(selected.id);
    onAdd(selected, value);
  }

  return <section className="nutrition-picker-overlay"><div className="nutrition-picker"><div className="nutrition-food-form-head"><div><span className="nutrition-eyebrow">BIBLIOTECA</span><h2>{replaceFoodId ? 'Substituir alimento' : 'Adicionar à refeição'}</h2></div><button className="nutrition-secondary" onClick={onClose}>Fechar</button></div>{replaceFoodId && <p className="nutrition-picker-hint">A quantidade sugerida tenta preservar principalmente proteína e calorias do alimento original. Você pode ajustar antes de confirmar.</p>}<input className="nutrition-search" autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alimento ou receita…" /><div className="nutrition-picker-results">{foods.map((food) => <button key={food.id} className={`nutrition-picker-row${selected?.id === food.id ? ' is-selected' : ''}`} onClick={() => choose(food)}><span><strong>{favorites.includes(food.id) ? '★ ' : ''}{food.name}</strong><small>{food.brand ? `${food.brand} • ` : ''}{food.referenceAmount} {food.unit}{(usage[food.id] ?? 0) >= 3 ? ' • frequente' : recents.includes(food.id) ? ' • recente' : ''}</small></span><b>{food.macrosPerReference.caloriesKcal} kcal</b></button>)}</div><footer className={`nutrition-picker-confirm${selected ? ' is-ready' : ''}`}>{selected ? <><div><strong>{selected.name}</strong><small>{replaceFoodId ? 'Quantidade equivalente sugerida' : 'Quantidade que será registrada nesta refeição'}</small></div><label className="nutrition-amount"><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /><span>{selected.unit}</span></label><button className="nutrition-primary" onClick={confirmSelection}>{replaceFoodId ? 'Salvar substituição' : 'Adicionar à refeição'}</button></> : <div className="nutrition-picker-empty-selection"><strong>Selecione um item</strong><small>Depois informe a quantidade e toque em “Adicionar à refeição”.</small></div>}</footer></div></section>;
}