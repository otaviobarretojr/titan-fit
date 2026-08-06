import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

type TabId = 'today' | 'plan' | 'cardio' | 'progress' | 'more';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
    title: 'Sobre o TITAN FIT',
    body: 'Shell inicial do aplicativo, pronto para receber a importação de fichas.'
  }
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('Não foi possível registrar o PWA.', error);
    }
  });

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
    };
  }, []);

  const content = emptyCopy[activeTab];

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  }

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

        {activeTab === 'more' && (
          <section className="settings-card" aria-label="Aplicativo">
            <div>
              <span className="info-label">Conexão</span>
              <strong>{isOnline ? 'Online' : 'Offline'}</strong>
            </div>
            <button type="button" className="secondary-action" onClick={installApp} disabled={!installPrompt}>
              {installPrompt ? 'Instalar aplicativo' : 'Instalação indisponível'}
            </button>
            <button type="button" className="secondary-action" onClick={() => window.location.reload()}>
              Verificar atualização
            </button>
          </section>
        )}
      </main>

      {installPrompt && !installDismissed && (
        <aside className="pwa-prompt" role="dialog" aria-label="Instalar TITAN FIT">
          <div>
            <strong>Instale o TITAN FIT</strong>
            <p>Acesso rápido e funcionamento offline.</p>
          </div>
          <div className="prompt-actions">
            <button type="button" onClick={installApp}>Instalar</button>
            <button type="button" className="text-action" onClick={() => setInstallDismissed(true)}>Depois</button>
          </div>
        </aside>
      )}

      {needRefresh && (
        <aside className="pwa-prompt" role="alert" aria-live="polite">
          <div>
            <strong>Nova versão disponível</strong>
            <p>Atualize quando for conveniente.</p>
          </div>
          <div className="prompt-actions">
            <button type="button" onClick={() => updateServiceWorker(true)}>Atualizar agora</button>
            <button type="button" className="text-action" onClick={() => setNeedRefresh(false)}>Depois</button>
          </div>
        </aside>
      )}

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
