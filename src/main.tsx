import React from 'react';
import ReactDOM from 'react-dom/client';
import { TitanEntry } from './app/TitanEntry';
import { enableTitanHaptics } from './ui/haptics';
import './styles/tokens.css';
import './styles/global.css';
import './styles/pwa.css';
import './styles/titan-focus-v061.css';

enableTitanHaptics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TitanEntry />
  </React.StrictMode>
);
