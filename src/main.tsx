import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdaptiveDayCoachPanel } from './app/AdaptiveDayCoachPanel';
import { NutritionShell } from './app/NutritionShell';
import { NutritionNotificationBridge } from './app/NutritionNotificationBridge';
import './styles/tokens.css';
import './styles/global.css';
import './styles/nutrition.css';
import './styles/nutrition-sections.css';
import './styles/nutrition-v2.css';
import './styles/nutrition-v3.css';
import './styles/nutrition-shell.css';
import './styles/nutrition-v4.css';
import './styles/nutrition-v5.css';
import './styles/nutrition-v6.css';
import './styles/nutrition-v7.css';
import './styles/nutrition-v8.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NutritionNotificationBridge />
    <NutritionShell />
    <AdaptiveDayCoachPanel />
  </React.StrictMode>
);
