import { useEffect, useState } from 'react';
import { resetAllAppData } from '../core/database/resetAppData';
import { loadFullDemo } from '../features/demo/fullDemo';
import { ProfileOnboarding } from '../features/profile/ProfileOnboarding';
import { loadActiveAssessment, loadActiveProfile } from '../features/profile/repository';
import type { TitanProfile, TitanTrainingAssessment } from '../features/profile/types';
import { PlanCandidatesPage } from '../features/plan/PlanCandidatesPage';
import { PlanImporter } from '../features/plan/PlanImporter';
import { loadActivePlan, loadActivePlanFromDatabase, saveActivePlan } from '../features/plan/storage';
import type { TitanPlan } from '../features/plan/types';
import { linkPlanToProject } from '../features/project/repository';
import { restoreWorkoutExecutionsFromDatabase } from '../features/workout/storage';
import { App } from './App';

type EntryState = 'loading' | 'onboarding' | 'import' | 'candidates' | 'app';

export function TitanEntry() {
  const [entryState, setEntryState] = useState<EntryState>('loading');
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
    void Promise.all([loadPlanningContext(), loadActivePlanFromDatabase(), restoreWorkoutExecutionsFromDatabase()])
      .then(([context, storedPlan]) => {
        if (storedPlan) return setEntryState('app');
        if (!context.profile?.onboardingCompleted) return setEntryState('onboarding');
        if (context.assessment) return setEntryState('candidates');
        setEntryState('app');
      })
      .catch(() => setEntryState(loadActivePlan() ? 'app' : 'onboarding'));
  }, [entryState]);

  async function activateDemo() {
    await resetAllAppData();
    await loadFullDemo();
    window.history.replaceState({ ...window.history.state, titanTab: 'today' }, '');
    setProfile(null);
    setAssessment(null);
    setEntryState('app');
  }

  async function activateImportedPlan(plan: TitanPlan) {
    const linkedPlan = await linkPlanToProject(plan, profile?.id ?? null);
    saveActivePlan(linkedPlan);
    window.history.replaceState({ ...window.history.state, titanTab: 'today' }, '');
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
      onImportProject={() => setEntryState('import')}
      onActivateDemo={() => void activateDemo()}
    />;
  }

  if (entryState === 'import') {
    return <main className="profile-onboarding onboarding-import-flow">
      <section className="profile-hero">
        <button type="button" className="profile-back" onClick={() => setEntryState('onboarding')}>← Voltar</button>
        <span className="eyebrow">INSERIR MEU PROJETO</span>
        <h1>Importe seu projeto</h1>
        <p>Selecione o arquivo do projeto. O TITAN valida a estrutura antes de ativá-lo.</p>
      </section>
      <PlanImporter onImport={(plan) => void activateImportedPlan(plan)} />
    </main>;
  }

  if (entryState === 'candidates' && profile && assessment) {
    return <PlanCandidatesPage profile={profile} assessment={assessment} onActivate={() => setEntryState('app')} />;
  }

  return <App />;
}
