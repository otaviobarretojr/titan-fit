import type { Food } from './types';

export const FOOD_LIBRARY_ADDITIONS: Food[] = [
  {
    id: 'mashed-potato-english-water-salt',
    name: 'Purê de batata inglesa',
    unit: 'g',
    referenceAmount: 100,
    category: 'Carboidratos',
    source: 'TBCA/TACO',
    macrosPerReference: {
      caloriesKcal: 80,
      proteinG: 2.27,
      carbohydrateG: 18.3,
      fatG: 0.04,
    },
    notes: 'Referência TBCA BRD0144B: purê de batata inglesa com água e sal, sem óleo. Se houver leite, manteiga, creme ou queijo, cadastrar como preparação específica para recalcular os macros.',
  },
];
