import React from 'react';
import ReactDOM from 'react-dom/client';
import { NutritionShell } from './app/NutritionShell';
import { NutritionNotificationBridge } from './app/NutritionNotificationBridge';
import { HealthSyncEngine } from './features/health/HealthSyncEngine';
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
import './styles/nutrition-v9.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NutritionNotificationBridge />
    <HealthSyncEngine />
    <NutritionShell />
  </React.StrictMode>
);