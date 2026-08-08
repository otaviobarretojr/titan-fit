import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { loadActivePlan } from './features/plan/storage';
import { ProfileOnboarding } from './features/profile/ProfileOnboarding';
import { loadActiveProfile } from './features/profile/repository';
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
import './styles/home-uniform-v0292.css';
import './styles/home-day-aware-v0293.css';
import './styles/home-clean-v0305.css';
import './styles/titan-light-v031.css';
import './styles/visual-harmony-v032.css';
import './styles/full-visual-audit-v0321.css';
import './styles/score-alignment-v0322.css';
import './styles/programming-v033.css';
import './styles/exercise-alternatives-v036.css';
import './styles/workout-mode-v038.css';
import './styles/profile-onboarding.css';

enableTitanHaptics();
enableEvolutionFeedback();
enablePostWorkoutCoach();

type EntryState = 'loading' | 'onboarding' | 'app';

function TitanEntry() {
  const [entryState, setEntryState] = useState<EntryState>(() => loadActivePlan() ? 'app' : 'loading');

  useEffect(() => {
    if (entryState !== 'loading') return;
    void loadActiveProfile()
      .then((profile) => setEntryState(profile?.onboardingCompleted ? 'app' : 'onboarding'))
      .catch(() => setEntryState('onboarding'));
  }, [entryState]);

  if (entryState === 'loading') {
    return <main className="profile-onboarding"><section className="profile-hero"><span className="eyebrow">TITAN FIT</span><h1>Preparando seu espaço…</h1></section></main>;
  }

  if (entryState === 'onboarding') {
    return <ProfileOnboarding
      onComplete={() => setEntryState('app')}
      onImportProject={() => {
        window.history.replaceState({ ...window.history.state, titanTab: 'settings' }, '');
        setEntryState('app');
      }}
    />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TitanEntry />
  </React.StrictMode>
);
