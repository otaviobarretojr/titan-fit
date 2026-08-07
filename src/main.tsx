import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { enableTitanHaptics } from './ui/haptics';
import './styles/tokens.css';
import './styles/global.css';
import './styles/dashboard.css';
import './styles/history.css';
import './styles/coach.css';
import './styles/pwa.css';
import './styles/weekly-library.css';
import './styles/evolution.css';
import './styles/one-ui.css';
import './styles/workout-mobile.css';
import './styles/native-polish.css';
import './styles/design-system-v025.css';
import './styles/chart-readability-v0251.css';

enableTitanHaptics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
