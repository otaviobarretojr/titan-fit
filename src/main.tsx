import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { enableTitanHaptics } from './ui/haptics';
import { enableEvolutionFeedback } from './ui/evolution-feedback';
import { enablePostWorkoutCoach } from './ui/post-workout-coach';
import './styles/tokens.css';
import './styles/global.css';
import './styles/dashboard.css';
import './styles/history.css';
import './styles/coach.css';
import './styles/pwa.css';
import './styles/weekly-library.css';
import './styles/week-library-v0282.css';
import './styles/cardio-v029.css';
import './styles/evolution.css';
import './styles/one-ui.css';
import './styles/workout-mobile.css';
import './styles/native-polish.css';
import './styles/design-system-v025.css';
import './styles/chart-readability-v0251.css';
import './styles/evolution-feedback.css';
import './styles/polish-v0253.css';
import './styles/navigation-hotfix-v0254.css';
import './styles/smart-progression-v026.css';
import './styles/pr-hall-v0261.css';
import './styles/live-pr-v0265.css';
import './styles/workout-close-v0266.css';
import './styles/coach-v027.css';
import './styles/home-premium-v0272.css';
import './styles/home-muscle-art-v0273.css';
import './styles/post-workout-coach-v0274.css';
import './styles/weekly-coach-v0275.css';

enableTitanHaptics();
enableEvolutionFeedback();
enablePostWorkoutCoach();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
