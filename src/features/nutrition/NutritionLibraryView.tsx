import { useMemo, useRef, useState } from 'react';
import '../../styles/nutrition-library-create.css';
import { createCustomFoodId, loadCustomFoods, saveCustomFoods } from './customFoodStorage';
import { getAllFoods } from './foodRepository';
import { loadFoodFavorites, toggleFoodFavorite } from './foodPreferences';
import { createNutritionBackup, restoreNutritionBackupText } from './backup';
import { createRecipeId, loadCustomRecipes, saveCustomRecipes } from './recipeStorage';
import { reloadTitanRecipes } from './advanced';
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
  const [favorites, setFavorites] = useState<string[]>(() => loadFoodFavorites());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<Array<{ foodId: string; amount: string }>>([{ foodId: '', amount: '100' }]);
  const [showBackup, setShowBackup] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState<FoodUnit>('g');
  const [referenceAmount, setReferenceAmount] = useState('100');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [foodCategory, setFoodCategory] = useState<FoodCategory>('Outros');

  const allFoods = useMemo(() => { void customFoods; return getAllFoods(); }, [customFoods]);
  const foods = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return allFoods.filter((food) => {
      const matchesSearch = !term || `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase('pt-BR').includes(term);
      const matchesCategory = category === 'Todos' || inferCategory(food) === category;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)) || a.name.localeCompare(b.name, 'pt-BR'));
  }, [search, category, allFoods, favorites]);

  function resetForm() {
    setEditingId(null); setName(''); setBrand(''); setUnit('g'); setReferenceAmount('100'); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setFoodCategory('Outros');
  }

  function closeForm() { resetForm(); setShowForm(false); }

  function openEdit(food: Food) {
    if (!food.id.startsWith('custom-')) return;
    setEditingId(food.id); setName(food.name); setBrand(food.brand ?? ''); setUnit(food.unit); setReferenceAmount(String(food.referenceAmount).replace('.', ',')); setCalories(String(food.macrosPerReference.caloriesKcal).replace('.', ',')); setProtein(String(food.macrosPerReference.proteinG).replace('.', ',')); setCarbs(String(food.macrosPerReference.carbohydrateG).replace('.', ',')); setFat(String(food.macrosPerReference.fatG).replace('.', ',')); setFoodCategory(food.category ?? 'Outros'); setShowForm(true);
  }

  function saveFood() {
    if (!name.trim() || numberFromInput(referenceAmount) <= 0) return;
    const nextFood: Food = { id: editingId ?? createCustomFoodId(name), name: name.trim(), brand: brand.trim() || undefined, unit, referenceAmount: numberFromInput(referenceAmount), category: foodCategory, source: 'Rótulo', macrosPerReference: { caloriesKcal: numberFromInput(calories), proteinG: numberFromInput(protein), carbohydrateG: numberFromInput(carbs), fatG: numberFromInput(fat) }, notes: 'Cadastrado manualmente a partir do rótulo informado pelo usuário.' };
    const current = loadCustomFoods();
    const next = editingId ? current.map((food) => food.id === editingId ? nextFood : food) : [nextFood, ...current];
    saveCustomFoods(next); setCustomFoods(next); closeForm(); setMessage(editingId ? 'Alimento atualizado.' : 'Alimento adicionado.');
  }

  function deleteFood(foodId: string) {
    const next = loadCustomFoods().filter((food) => food.id !== foodId);
    saveCustomFoods(next); setCustomFoods(next); setMessage('Alimento personalizado removido.');
  }

  function toggleFavorite(foodId: string) { setFavorites(toggleFoodFavorite(foodId)); }

  function saveRecipe() {
    const ingredients = recipeIngredients.map((row) => ({ foodId: row.foodId, amount: numberFromInput(row.amount) })).filter((row) => row.foodId && row.amount > 0);
    if (!recipeName.trim() || ingredients.length === 0) return;
    const current = loadCustomRecipes();
    saveCustomRecipes([{ id: createRecipeId(recipeName), name: recipeName.trim(), description: recipeDescription.trim() || 'Preparação personalizada', ingredients }, ...current]);
    reloadTitanRecipes(); setRecipeName(''); setRecipeDescription(''); setRecipeIngredients([{ foodId: '', amount: '100' }]); setShowRecipeForm(false); setMessage('Preparação criada e disponível no modo refeição.');
  }

  function exportBackup() {
    const backup = createNutritionBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `titan-nutrition-backup-${backup.exportedAt.slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); setMessage('Backup exportado.');
  }

  async function restoreFile(file: File | null) {
    if (!file) return;
    try { restoreNutritionBackupText(await file.text()); setMessage('Backup restaurado. Reabra o app para recarregar todos os dados.'); } catch { setMessage('Não foi possível restaurar este arquivo.'); }
  }

  if (showRecipeForm) return <main className="nutrition-app nutrition-food-create-screen"><header className="nutrition-header"><button className="nutrition-back" onClick={() => setShowRecipeForm(false)}>←</button><div><span className="nutrition-eyebrow">PREPARAÇÕES</span><h1>Nova receita</h1></div></header><section className="nutrition-food-form nutrition-food-form-fullscreen"><label>Nome<input autoFocus value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="Ex.: Vitaminada de banana" /></label><label>Descrição<input value={recipeDescription} onChange={(e) => setRecipeDescription(e.target.value)} placeholder="Opcional" /></label><span className="nutrition-eyebrow">INGREDIENTES</span>{recipeIngredients.map((row, index) => <div className="nutrition-form-grid" key={index}><label>Alimento<select value={row.foodId} onChange={(e) => setRecipeIngredients(recipeIngredients.map((item, i) => i === index ? { ...item, foodId: e.target.value } : item))}><option value="">Selecione</option>{allFoods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}</select></label><label>Quantidade<input inputMode="decimal" value={row.amount} onChange={(e) => setRecipeIngredients(recipeIngredients.map((item, i) => i === index ? { ...item, amount: e.target.value } : item))} /></label></div>)}<button className="nutrition-secondary" onClick={() => setRecipeIngredients([...recipeIngredients, { foodId: '', amount: '100' }])}>+ Ingrediente</button></section><footer className="nutrition-create-actions"><button className="nutrition-secondary" onClick={() => setShowRecipeForm(false)}>Cancelar</button><button className="nutrition-primary" onClick={saveRecipe}>Salvar preparação</button></footer></main>;

  if (showBackup) return <main className="nutrition-app"><header className="nutrition-header"><button className="nutrition-back" onClick={() => setShowBackup(false)}>←</button><div><span className="nutrition-eyebrow">SEGURANÇA</span><h1>Backup de dados</h1></div></header><section className="nutrition-create-intro"><strong>Proteja seu histórico</strong><p>O backup inclui refeições, biblioteca personalizada, planejamento semanal, favoritos, receitas e listas salvas neste aparelho.</p></section><section className="nutrition-food-form"><button className="nutrition-primary" onClick={exportBackup}>Exportar backup</button><button className="nutrition-secondary" onClick={() => fileInput.current?.click()}>Restaurar backup</button><input ref={fileInput} hidden type="file" accept="application/json,.json" onChange={(e) => void restoreFile(e.target.files?.[0] ?? null)} /></section>{message && <p className="nutrition-library-message">{message}</p>}</main>;

  if (showForm) return <main className="nutrition-app nutrition-food-create-screen"><header className="nutrition-header nutrition-create-header"><button className="nutrition-back" onClick={closeForm}>←</button><div><span className="nutrition-eyebrow">BIBLIOTECA</span><h1>{editingId ? 'Editar alimento' : 'Adicionar alimento'}</h1></div></header><section className="nutrition-create-intro"><strong>Dados do rótulo</strong><p>Cadastre os valores exatamente como aparecem na porção informada pelo fabricante.</p></section><section className="nutrition-food-form nutrition-food-form-fullscreen"><label>Nome do alimento<input autoFocus value={name} onChange={(e) => setName(e.target.value)} /></label><label>Marca<input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Opcional" /></label><div className="nutrition-form-grid"><label>Unidade<select value={unit} onChange={(e) => setUnit(e.target.value as FoodUnit)}><option value="g">g</option><option value="ml">ml</option><option value="unit">unidade</option></select></label><label>Porção de referência<input inputMode="decimal" value={referenceAmount} onChange={(e) => setReferenceAmount(e.target.value)} /></label></div><label>Categoria<select value={foodCategory} onChange={(e) => setFoodCategory(e.target.value as FoodCategory)}>{CATEGORIES.filter((x) => x !== 'Todos').map((x) => <option key={x}>{x}</option>)}</select></label><div className="nutrition-create-macro-title"><span className="nutrition-eyebrow">MACROS DA PORÇÃO</span></div><div className="nutrition-form-grid nutrition-form-grid-4"><label>kcal<input inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} /></label><label>Proteína (g)<input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} /></label><label>Carbo (g)<input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></label><label>Gordura (g)<input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} /></label></div></section><footer className="nutrition-create-actions"><button className="nutrition-secondary" onClick={closeForm}>Cancelar</button><button className="nutrition-primary" onClick={saveFood}>Salvar alimento</button></footer></main>;

  return <main className="nutrition-app"><header className="nutrition-header nutrition-library-header"><button className="nutrition-back" onClick={onBack}>←</button><div className="nutrition-library-title"><span className="nutrition-eyebrow">BASE NUTRICIONAL</span><h1>Biblioteca</h1></div><button className="nutrition-add-food-top" onClick={() => setShowForm(true)}>+ Adicionar</button></header><div className="nutrition-library-actions"><button className="nutrition-secondary" onClick={() => setShowRecipeForm(true)}>+ Preparação</button><button className="nutrition-secondary" onClick={() => setShowBackup(true)}>Backup</button></div>{message && <p className="nutrition-library-message">{message}</p>}<input className="nutrition-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar alimento ou marca…" /><div className="nutrition-library-toolbar">{CATEGORIES.map((item) => <button key={item} className={`nutrition-filter-chip${category === item ? ' is-active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div><section className="nutrition-library-list">{foods.map((food) => <article className="nutrition-library-card" key={food.id}><div><strong>{food.name}</strong>{food.brand && <small>{food.brand}</small>}<small>Referência: {food.referenceAmount} {food.unit}</small><small className="nutrition-source-badge">{food.source ?? (food.notes?.includes('genérica') ? 'Genérico' : 'Base nutricional')}</small></div><div className="nutrition-library-macros"><b>{food.macrosPerReference.caloriesKcal} kcal</b><span>P {food.macrosPerReference.proteinG} • C {food.macrosPerReference.carbohydrateG} • G {food.macrosPerReference.fatG}</span><div className="nutrition-library-card-actions"><button onClick={() => toggleFavorite(food.id)}>{favorites.includes(food.id) ? '★' : '☆'}</button>{food.id.startsWith('custom-') && <><button onClick={() => openEdit(food)}>Editar</button><button onClick={() => deleteFood(food.id)}>Excluir</button></>}</div></div></article>)}</section></main>;
}
