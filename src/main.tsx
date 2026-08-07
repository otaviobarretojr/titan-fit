import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/dashboard.css';
import './styles/history.css';
import './styles/coach.css';
import './styles/pwa.css';
import './styles/weekly-library.css';
import './styles/evolution.css';
import './styles/one-ui.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
