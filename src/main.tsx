import React from 'react';
import ReactDOM from 'react-dom/client';
import { NutritionShell } from './app/NutritionShell';
import './styles/tokens.css';
import './styles/global.css';
import './styles/nutrition.css';
import './styles/nutrition-sections.css';
import './styles/nutrition-v2.css';
import './styles/nutrition-v3.css';
import './styles/nutrition-shell.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NutritionShell />
  </React.StrictMode>
);
