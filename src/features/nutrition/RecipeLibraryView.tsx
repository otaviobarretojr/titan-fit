import { useMemo, useState } from 'react';
import { TITAN_RECIPES, recipeMacros, type RecipeDefinition } from './advanced';
import { createRecipeId, loadCustomRecipes, saveCustomRecipes } from './recipeStorage';
import { getAllFoods, getFoodById } from './foodRepository';
import { loadCustomFoods, saveCustomFoods } from './customFoodStorage';

function recipeFoodId(recipeId: string) { return `recipe-food-${recipeId}`; }

export function RecipeLibraryView() {
  const [recipes, setRecipes] = useState<RecipeDefinition[]>(() => loadCustomRecipes());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Array<{ foodId: string; amount: number }>>([]);
  const [foodId, setFoodId] = useState('');
  const [amount, setAmount] = useState('100');
  const allRecipes = useMemo(() => [...recipes, ...TITAN_RECIPES], [recipes]);
  const foods = getAllFoods().filter((food) => !food.id.startsWith('recipe-food-'));

  function reset() { setName(''); setDescription(''); setIngredients([]); setFoodId(''); setAmount('100'); setShowForm(false); }
  function addIngredient() {
    const parsed = Number(amount.replace(',', '.'));
    if (!foodId || !Number.isFinite(parsed) || parsed <= 0) return;
    setIngredients((current) => [...current, { foodId, amount: parsed }]);
    setFoodId(''); setAmount('100');
  }
  function saveRecipe() {
    if (!name.trim() || !ingredients.length) return;
    const recipe: RecipeDefinition = { id: createRecipeId(name), name: name.trim(), description: description.trim() || 'Preparação personalizada', ingredients };
    const nextRecipes = [recipe, ...recipes];
    saveCustomRecipes(nextRecipes); setRecipes(nextRecipes);
    const macros = recipeMacros(recipe);
    const customFoods = loadCustomFoods().filter((food) => food.id !== recipeFoodId(recipe.id));
    saveCustomFoods([{ id: recipeFoodId(recipe.id), name: recipe.name, unit: 'unit', referenceAmount: 1, macrosPerReference: macros, category: 'Outros', source: 'Rótulo', notes: 'Receita calculada a partir dos ingredientes cadastrados na Biblioteca.' }, ...customFoods]);
    reset();
  }
  function removeRecipe(recipe: RecipeDefinition) {
    if (!recipe.id.startsWith('custom-recipe-')) return;
    const next = recipes.filter((item) => item.id !== recipe.id);
    saveCustomRecipes(next); setRecipes(next);
    saveCustomFoods(loadCustomFoods().filter((food) => food.id !== recipeFoodId(recipe.id)));
  }

  if (showForm) return <main className="nutrition-app nutrition-food-create-screen"><header className="nutrition-header"><button className="nutrition-back" onClick={reset}>←</button><div><span className="nutrition-eyebrow">BIBLIOTECA</span><h1>Nova receita</h1></div></header><section className="nutrition-food-form nutrition-food-form-fullscreen"><label>Nome da receita<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vitaminada de banana" /></label><label>Descrição<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" /></label><div className="nutrition-create-macro-title"><span className="nutrition-eyebrow">INGREDIENTES</span></div><div className="nutrition-recipe-builder"><select value={foodId} onChange={(e) => setFoodId(e.target.value)}><option value="">Escolha um alimento</option>{foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}</select><div className="nutrition-recipe-amount-row"><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /><button className="nutrition-secondary" onClick={addIngredient}>Adicionar</button></div></div>{ingredients.map((ingredient, index) => { const food = getFoodById(ingredient.foodId); return <article className="nutrition-recipe-ingredient" key={`${ingredient.foodId}-${index}`}><span><strong>{food?.name ?? ingredient.foodId}</strong><small>{ingredient.amount} {food?.unit ?? ''}</small></span><button onClick={() => setIngredients((current) => current.filter((_, i) => i !== index))}>×</button></article>; })}</section><footer className="nutrition-create-actions"><button className="nutrition-secondary" onClick={reset}>Cancelar</button><button className="nutrition-primary" onClick={saveRecipe}>Salvar receita</button></footer></main>;

  return <main className="nutrition-app nutrition-shell-page"><header className="nutrition-library-recipes-head"><div><span className="nutrition-eyebrow">PREPARAÇÕES</span><h1>Receitas</h1></div><button className="nutrition-add-food-top" onClick={() => setShowForm(true)}>+ Nova receita</button></header><p className="nutrition-library-helper">Receitas aparecem na Biblioteca como um item pronto. Na refeição, basta pesquisar pelo nome e adicionar 1 porção.</p><section className="nutrition-recipe-list">{allRecipes.map((recipe) => { const macros = recipeMacros(recipe); return <article key={recipe.id}><div><strong>{recipe.name}</strong><small>{recipe.description}</small></div><p>{recipe.ingredients.map((ingredient) => `${getFoodById(ingredient.foodId)?.name ?? ingredient.foodId} · ${ingredient.amount}${getFoodById(ingredient.foodId)?.unit ?? ''}`).join(' • ')}</p><span>{macros.caloriesKcal} kcal • P {macros.proteinG} • C {macros.carbohydrateG} • G {macros.fatG}</span>{recipe.id.startsWith('custom-recipe-') && <button className="nutrition-recipe-delete" onClick={() => removeRecipe(recipe)}>Excluir</button>}</article>; })}</section></main>;
}
