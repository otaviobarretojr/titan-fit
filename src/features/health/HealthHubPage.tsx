import { useState } from 'react';
import { CoachPage } from '../coach/CoachPage';
import { ProgressPage } from '../history/ProgressPage';
import { ReportsPanel } from '../reports/ReportsPanel';
import { HealthNutritionSyncPanel } from './HealthNutritionSyncPanel';
import { SamsungHealthPage } from './SamsungHealthPage';

type HealthView = 'today' | 'evolution' | 'coach' | 'reports';

export function HealthHubPage({ refreshKey }: { refreshKey: number }) {
  const [view, setView] = useState<HealthView>('today');

  return <section className="health-hub" aria-label="Saúde, evolução, Coach TITAN e relatórios">
    <div className="health-hub-switch health-hub-switch-four" role="tablist" aria-label="Seções de saúde">
      <button type="button" role="tab" aria-selected={view === 'today'} className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>Visão geral</button>
      <button type="button" role="tab" aria-selected={view === 'evolution'} className={view === 'evolution' ? 'active' : ''} onClick={() => setView('evolution')}>Evolução</button>
      <button type="button" role="tab" aria-selected={view === 'coach'} className={view === 'coach' ? 'active' : ''} onClick={() => setView('coach')}>Coach</button>
      <button type="button" role="tab" aria-selected={view === 'reports'} className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>Relatórios</button>
    </div>
    <div className="health-hub-content">
      {view === 'today' ? <><HealthNutritionSyncPanel /><SamsungHealthPage /></> : view === 'evolution' ? <ProgressPage refreshKey={refreshKey} /> : view === 'coach' ? <CoachPage /> : <ReportsPanel />}
    </div>
  </section>;
}
