import type { PlannedMeal } from './types';

export const DEFAULT_MEALS: PlannedMeal[] = [
  {
    id: 'breakfast', name: 'Café da manhã', time: '07:00', status: 'upcoming', items: [
      { id: 'breakfast-egg', foodId: 'egg-whole-large', plannedAmount: 2, actualAmount: 2 },
      { id: 'breakfast-white', foodId: 'egg-white-large', plannedAmount: 5, actualAmount: 5 },
      { id: 'breakfast-water', foodId: 'water', plannedAmount: 300, actualAmount: 300 },
      { id: 'breakfast-milk', foodId: 'milk-powder', plannedAmount: 30, actualAmount: 30 },
      { id: 'breakfast-oats', foodId: 'oats', plannedAmount: 40, actualAmount: 40 },
      { id: 'breakfast-banana', foodId: 'banana-medium', plannedAmount: 1, actualAmount: 1 },
    ],
  },
  {
    id: 'morning-snack', name: 'Lanche da manhã', time: '10:00', status: 'upcoming', items: [
      { id: 'snack-rap10', foodId: 'rap10', plannedAmount: 1, actualAmount: 1 },
      { id: 'snack-chicken', foodId: 'chicken-breast-grilled', plannedAmount: 100, actualAmount: 100 },
    ],
  },
  {
    id: 'lunch', name: 'Almoço', time: '12:30', status: 'upcoming', items: [
      { id: 'lunch-chicken', foodId: 'chicken-breast-grilled', plannedAmount: 200, actualAmount: 200 },
      { id: 'lunch-rice', foodId: 'rice-white-cooked', plannedAmount: 150, actualAmount: 150 },
    ],
  },
  { id: 'afternoon-snack', name: 'Lanche da tarde', time: '16:30', status: 'upcoming', items: [] },
  { id: 'dinner', name: 'Jantar', time: '20:30', status: 'upcoming', items: [
    { id: 'dinner-patinho', foodId: 'patinho-ground-cooked', plannedAmount: 180, actualAmount: 180 },
    { id: 'dinner-rice', foodId: 'rice-white-cooked', plannedAmount: 150, actualAmount: 150 },
  ] },
];
