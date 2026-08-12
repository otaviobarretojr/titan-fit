import { useMemo, useState } from 'react';
import { createCustomFoodId, loadCustomFoods, saveCustomFoods } from './customFoodStorage';
import { getAllFoods } from './foodRepository';
import type { Food, FoodCategory, FoodUnit } from './types';

const CATEGORIES: Array<'Todos' | FoodCategory> = ['Todos', 'Proteínas', 'Carboidratos', 'Frutas', 'Laticínios', 'Bebidas', 'Verduras e legumes', 'Gorduras', 'Lanches e doces', 'Temperos', 'Outros'];

function inferCategory(food: Food): FoodCategory {
  if (food.category) return food.category;
  const name = food.name.toLowerCase();
  if (/frango|carne|patinho|ovo|tilápia|sardinha|lombo/.test(name)) return 'Proteínas';
  if (/arroz|feijão|pão|tapioca|cuscuz|macarrão|batata|mandioca|aveia|rap10|wrap/.test(name)) return 'Carboidratos';
  if (/banana|maçã|laranja|mamão|manga|melancia|abacate/.test(name)) return 'Frutas';
  if (/leite|queijo|muçarela/.test(name)) return 'Laticínios';
  if (/café|suco|refrigerante|bebida/.test(name)) return 'Bebidas';
  if (/tomate|alface|cenoura|brócolis/.test(name)) return 'Verduras e legumes';
  if (/azeite|manteiga|margarina|amendoim/.test(name)) return 'Gorduras';
  if (/biscoito|chocolate|paçoca|sorvete|coxinha|pizza|hambúrguer|pipoca/.test(name)) return 'Lanches e doces';
  if (/canela|cacau|açúcar/.test(name)) return 'Temperos';
  return 'Outros';
}

function numberFromInput(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function NutritionLibraryView({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'Todos' | FoodCategory>('Todos');
  const [customFoods, setCustomFoods] = useState<Food[]>(() => loadCustomFoods());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState<FoodUnit>('g');
  const [referenceAmount, setReferenceAmount] = useState('100');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [foodCategory, setFoodCategory] = useState<FoodCategory>('Outros');

  const foods = useMemo(() => {
    void customFoods;
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return getAllFoods().filter((food) => {
      const matchesSearch = !term || `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase('pt-BR').includes(term);
      const matchesCategory = category === 'Todos' || inferCategory(food) === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, customFoods]);

  function resetForm() {
    setName(''); setBrand(''); setUnit('g'); setReferenceAmount('100'); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setFoodCategory('Outros');
  }

  function saveFood() {
    if (!name.trim() || numberFromInput(referenceAmount) <= 0) return;
    const nextFood: Food = {
      id: createCustomFoodId(name),
      name: name.trim(),
      brand: brand.trim() || undefined,
      unit,
      referenceAmount: numberFromInput(referenceAmount),
      category: foodCategory,
      source: 'Rótulo',
      macrosPerReference: {
        caloriesKcal: numberFromInput(calories),
        proteinG: numberFromInput(protein),
        carbohydrateG: numberFromInput(carbs),
        fatG: numberFromInput(fat),
      },
      notes: 'Cadastrado manualmente a partir do rótulo informado pelo usuário.',
    };
    const next = [nextFood, ...loadCustomFoods()];
    saveCustomFoods(next);
    setCustomFoods(next);
    resetForm();
    setShowForm(false);
  }

  return <main className="nutrition-app">
    <header className="nutrition-header"><button className="nutrition-back" onClick={onBack}>←</button><div><span className="nutrition-eyebrow">BASE NUTRICIONAL</span><h1>Biblioteca</h1></div></header>
    <input className="nutrition-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar alimento ou marca…" />
    <div className="nutrition-library-toolbar">{CATEGORIES.map((item) => <button key={item} className={`nutrition-filter-chip${category === item ? ' is-active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <section className="nutrition-library-list">{foods.map((food) => <article className="nutrition-library-card" key={food.id}><div><strong>{food.name}</strong>{food.brand && <small>{food.brand}</small>}<small>Referência: {food.referenceAmount} {food.unit}</small><small className="nutrition-source-badge">{food.source ?? (food.notes?.includes('genérica') ? 'Genérico' : 'Base nutricional')}</small></div><div className="nutrition-library-macros"><b>{food.macrosPerReference.caloriesKcal} kcal</b><span>P {food.macrosPerReference.proteinG} • C {food.macrosPerReference.carbohydrateG} • G {food.macrosPerReference.fatG}</span></div></article>)}</section>
    {!showForm && <button className="nutrition-primary nutrition-add-food" onClick={() => setShowForm(true)}>+ Adicionar alimento</button>}
    {showForm && <section className="nutrition-food-form"><div className="nutrition-food-form-head"><div><span className="nutrition-eyebrow">RÓTULO DO PRODUTO</span><h2>Novo alimento</h2></div><button className="nutrition-secondary" onClick={() => setShowForm(false)}>Cancelar</button></div><label>Nome<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Leite Ninho Integral" /></label><label>Marca<input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Opcional" /></label><div className="nutrition-form-grid"><label>Unidade<select value={unit} onChange={(e) => setUnit(e.target.value as FoodUnit)}><option value="g">g</option><option value="ml">ml</option><option value="unit">unidade</option></select></label><label>Porção<input inputMode="decimal" value={referenceAmount} onChange={(e) => setReferenceAmount(e.target.value)} /></label></div><label>Categoria<select value={foodCategory} onChange={(e) => setFoodCategory(e.target.value as FoodCategory)}>{CATEGORIES.filter((x) => x !== 'Todos').map((x) => <option key={x}>{x}</option>)}</select></label><div className="nutrition-form-grid nutrition-form-grid-4"><label>kcal<input inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} /></label><label>Proteína<input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} /></label><label>Carbo<input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></label><label>Gordura<input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} /></label></div><button className="nutrition-primary" onClick={saveFood}>Salvar na Biblioteca</button></section>}
  </main>;
}
