import { useEffect, useState } from 'react';
import { ProfileOnboarding } from '../features/profile/ProfileOnboarding';
import { loadActiveProfile } from '../features/profile/repository';
import { loadActivePlan } from '../features/plan/storage';
import { App } from './App';

type EntryState = 'loading' | 'onboarding' | 'app';

export function TitanEntry() {
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
