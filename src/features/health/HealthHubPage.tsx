import { useState } from 'react';
import { CoachPage } from '../coach/CoachPage';
import { ProgressPage } from '../history/ProgressPage';
import { SamsungHealthPage } from './SamsungHealthPage';

type HealthView = 'today' | 'evolution' | 'coach';

export function HealthHubPage({ refreshKey }: { refreshKey: number }) {
  const [view, setView] = useState<HealthView>('today');

  return <section className="health-hub" aria-label="Saúde, evolução e Coach TITAN">
    <div className="health-hub-switch health-hub-switch-three" role="tablist" aria-label="Seções de saúde">
      <button type="button" role="tab" aria-selected={view === 'today'} className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>Visão geral</button>
      <button type="button" role="tab" aria-selected={view === 'evolution'} className={view === 'evolution' ? 'active' : ''} onClick={() => setView('evolution')}>Evolução</button>
      <button type="button" role="tab" aria-selected={view === 'coach'} className={view === 'coach' ? 'active' : ''} onClick={() => setView('coach')}>Coach</button>
    </div>
    <div className="health-hub-content">
      {view === 'today' ? <SamsungHealthPage /> : view === 'evolution' ? <ProgressPage refreshKey={refreshKey} /> : <CoachPage />}
    </div>
  </section>;
}
