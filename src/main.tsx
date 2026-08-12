import React from 'react';
import ReactDOM from 'react-dom/client';
import { NutritionEntry } from './app/NutritionEntry';
import './styles/tokens.css';
import './styles/global.css';
import './styles/nutrition.css';
import './styles/nutrition-sections.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NutritionEntry />
  </React.StrictMode>
);
