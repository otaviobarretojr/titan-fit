import { useEffect, useState } from 'react';
import { resetAllAppData } from '../core/database/resetAppData';
import { loadFullDemo } from '../features/demo/fullDemo';
import { ProfileOnboarding } from '../features/profile/ProfileOnboarding';
import { loadActiveAssessment, loadActiveProfile } from '../features/profile/repository';
import type { TitanProfile, TitanTrainingAssessment } from '../features/profile/types';
import { PlanCandidatesPage } from '../features/plan/PlanCandidatesPage';
import { loadActivePlan } from '../features/plan/storage';
import { App } from './App';

type EntryState = 'loading' | 'onboarding' | 'candidates' | 'app';

export function TitanEntry() {
  const [entryState, setEntryState] = useState<EntryState>(() => loadActivePlan() ? 'app' : 'loading');
  const [profile, setProfile] = useState<TitanProfile | null>(null);
  const [assessment, setAssessment] = useState<TitanTrainingAssessment | null>(null);

  async function loadPlanningContext() {
    const [nextProfile, nextAssessment] = await Promise.all([loadActiveProfile(), loadActiveAssessment()]);
    setProfile(nextProfile);
    setAssessment(nextAssessment);
    return { profile: nextProfile, assessment: nextAssessment };
  }

  useEffect(() => {
    if (entryState !== 'loading') return;
    void loadPlanningContext()
      .then(({ profile: loadedProfile, assessment: loadedAssessment }) => {
        if (!loadedProfile?.onboardingCompleted) return setEntryState('onboarding');
        if (!loadActivePlan() && loadedAssessment) return setEntryState('candidates');
        setEntryState('app');
      })
      .catch(() => setEntryState('onboarding'));
  }, [entryState]);

  async function activateDemo() {
    await resetAllAppData();
    await loadFullDemo();
    window.history.replaceState({ ...window.history.state, titanTab: 'today' }, '');
    setProfile(null);
    setAssessment(null);
    setEntryState('app');
  }

  if (entryState === 'loading') {
    return <main className="profile-onboarding"><section className="profile-hero"><span className="eyebrow">TITAN FIT</span><h1>Preparando seu espaço…</h1></section></main>;
  }

  if (entryState === 'onboarding') {
    return <ProfileOnboarding
      onComplete={() => {
        void loadPlanningContext().then(() => setEntryState('candidates'));
      }}
      onImportProject={() => {
        window.history.replaceState({ ...window.history.state, titanTab: 'settings' }, '');
        setEntryState('app');
      }}
      onActivateDemo={() => void activateDemo()}
    />;
  }

  if (entryState === 'candidates' && profile && assessment) {
    return <PlanCandidatesPage profile={profile} assessment={assessment} onActivate={() => setEntryState('app')} />;
  }

  return <App />;
}
