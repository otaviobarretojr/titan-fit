import { useState } from 'react';
import { ProgressPage } from '../history/ProgressPage';
import { SamsungHealthPage } from './SamsungHealthPage';

type HealthView = 'today' | 'evolution';

export function HealthHubPage({ refreshKey }: { refreshKey: number }) {
  const [view, setView] = useState<HealthView>('today');

  return <section className="health-hub" aria-label="Saúde e evolução">
    <div className="health-hub-switch" role="tablist" aria-label="Seções de saúde">
      <button type="button" role="tab" aria-selected={view === 'today'} className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>
        Visão geral
      </button>
      <button type="button" role="tab" aria-selected={view === 'evolution'} className={view === 'evolution' ? 'active' : ''} onClick={() => setView('evolution')}>
        Evolução
      </button>
    </div>
    <div className="health-hub-content">
      {view === 'today' ? <SamsungHealthPage /> : <ProgressPage refreshKey={refreshKey} />}
    </div>
  </section>;
}
