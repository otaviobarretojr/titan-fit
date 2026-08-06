import { useMemo, useState } from 'react';

type TabId = 'today' | 'plan' | 'cardio' | 'progress' | 'more';

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'today', label: 'Hoje', icon: '⌂' },
  { id: 'plan', label: 'Ficha', icon: '▤' },
  { id: 'cardio', label: 'Cardio', icon: '◌' },
  { id: 'progress', label: 'Evolução', icon: '↗' },
  { id: 'more', label: 'Mais', icon: '•••' }
];

const emptyCopy: Record<TabId, { title: string; body: string }> = {
  today: {
    title: 'Nenhuma ficha ativa',
    body: 'Na próxima versão, você poderá importar sua ficha de treino e executá-la diretamente no aplicativo.'
  },
  plan: {
    title: 'Nenhuma ficha importada',
    body: 'As fichas serão adicionadas por meio de arquivos TITAN FIT.'
  },
  cardio: {
    title: 'Cardio em breve',
    body: 'Suas sessões de cardio aparecerão aqui em uma próxima versão.'
  },
  progress: {
    title: 'Evolução em breve',
    body: 'Seu histórico de treino e evolução aparecerá aqui.'
  },
  more: {
    title: 'TITAN FIT v0.1.0',
    body: 'Shell inicial do aplicativo, pronto para receber a importação de fichas.'
  }
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useMemo(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const content = emptyCopy[activeTab];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">TITAN ECOSYSTEM</span>
          <h1>TITAN FIT</h1>
        </div>
        <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </header>

      <main className="app-main">
        <section className="hero-card" aria-labelledby="page-title">
          <span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span>
          <h2 id="page-title">{content.title}</h2>
          <p>{content.body}</p>
          {activeTab === 'today' && (
            <button type="button" className="primary-action" disabled>
              Importar ficha em breve
            </button>
          )}
        </section>

        <section className="info-card">
          <div>
            <span className="info-label">Versão atual</span>
            <strong>v0.1.0</strong>
          </div>
          <div>
            <span className="info-label">Funcionamento</span>
            <strong>Local-first</strong>
          </div>
        </section>
      </main>

      <nav className="bottom-navigation" aria-label="Navegação principal">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
