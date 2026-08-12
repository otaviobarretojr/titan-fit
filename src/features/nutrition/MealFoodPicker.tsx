import { useMemo, useState } from 'react';
import '../../styles/nutrition-library.css';
import { getAllFoods } from './foodRepository';
import type { Food } from './types';

export function MealFoodPicker({ onAdd, onClose }: { onAdd: (food: Food, amount: number) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [amount, setAmount] = useState('');
  const foods = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return getAllFoods().filter((food) => !term || `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)).slice(0, 40);
  }, [search]);

  function parseAmount() {
    const parsed = Number(amount.replace(',', '.'));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  return <section className="nutrition-picker-overlay"><div className="nutrition-picker"><div className="nutrition-food-form-head"><div><span className="nutrition-eyebrow">BIBLIOTECA</span><h2>Adicionar alimento</h2></div><button className="nutrition-secondary" onClick={onClose}>Fechar</button></div><input className="nutrition-search" autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alimento…" /><div className="nutrition-picker-results">{foods.map((food) => <button key={food.id} className={`nutrition-picker-row${selected?.id === food.id ? ' is-selected' : ''}`} onClick={() => { setSelected(food); setAmount(String(food.referenceAmount).replace('.', ',')); }}><span><strong>{food.name}</strong><small>{food.brand ? `${food.brand} • ` : ''}{food.referenceAmount} {food.unit}</small></span><b>{food.macrosPerReference.caloriesKcal} kcal</b></button>)}</div>{selected && <div className="nutrition-picker-confirm"><div><strong>{selected.name}</strong><small>Informe quanto foi consumido</small></div><label className="nutrition-amount"><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /><span>{selected.unit}</span></label><button className="nutrition-primary" onClick={() => { const value = parseAmount(); if (value > 0) onAdd(selected, value); }}>Adicionar</button></div>}</div></section>;
}
