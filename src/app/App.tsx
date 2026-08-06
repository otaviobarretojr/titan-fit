import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { PlanImporter } from '../features/plan/PlanImporter';
import { PlanViewer } from '../features/plan/PlanViewer';
import { loadActivePlan, removeActivePlan, saveActivePlan } from '../features/plan/storage';
import type { TitanPlan } from '../features/plan/types';

type TabId = 'today' | 'plan' | 'cardio' | 'progress' | 'more';
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'today', label: 'Hoje', icon: '⌂' }, { id: 'plan', label: 'Ficha', icon: '▤' }, { id: 'cardio', label: 'Cardio', icon: '◌' }, { id: 'progress', label: 'Evolução', icon: '↗' }, { id: 'more', label: 'Mais', icon: '•••' }
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [activePlan, setActivePlan] = useState<TitanPlan | null>(() => loadActivePlan());
  const [showImporter, setShowImporter] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({ onRegisterError(error) { console.warn('Não foi possível registrar o PWA.', error); } });

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    const captureInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection); window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    return () => { window.removeEventListener('online', updateConnection); window.removeEventListener('offline', updateConnection); window.removeEventListener('beforeinstallprompt', captureInstallPrompt); };
  }, []);

  async function installApp() { if (!installPrompt) return; await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setInstallPrompt(null); }
  function importPlan(plan: TitanPlan) { saveActivePlan(plan); setActivePlan(plan); setShowImporter(false); setActiveTab('today'); }
  function deletePlan() { if (!window.confirm('Remover a ficha ativa deste aparelho?')) return; removeActivePlan(); setActivePlan(null); setShowImporter(false); }
  const exerciseCount = activePlan?.workouts.reduce((total, workout) => total + workout.exercises.length, 0) ?? 0;

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">TITAN ECOSYSTEM</span><h1>TITAN FIT</h1></div><span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</span></header>
    <main className="app-main">
      {activeTab === 'today' && <><section className="hero-card" aria-labelledby="page-title"><span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span><h2 id="page-title">{activePlan ? activePlan.name : 'Nenhuma ficha ativa'}</h2><p>{activePlan ? activePlan.description ?? 'Sua ficha está pronta para execução.' : 'Importe uma ficha TITAN FIT para começar.'}</p><button type="button" className="primary-action" onClick={() => { setShowImporter(false); setActiveTab('plan'); }}>{activePlan ? 'Abrir ficha' : 'Importar ficha'}</button></section><section className="info-card"><div><span className="info-label">Treinos</span><strong>{activePlan?.workouts.length ?? 0}</strong></div><div><span className="info-label">Exercícios</span><strong>{exerciseCount}</strong></div></section></>}
      {activeTab === 'plan' && (showImporter || !activePlan ? <>{activePlan && <button type="button" className="secondary-action back-action" onClick={() => setShowImporter(false)}>Voltar para a ficha atual</button>}<PlanImporter onImport={importPlan} /></> : <PlanViewer plan={activePlan} onImportAnother={() => setShowImporter(true)} onRemove={deletePlan} />)}
      {activeTab === 'cardio' && <EmptyPage title="Cardio em breve" body="Suas sessões de cardio aparecerão aqui em uma próxima versão." />}
      {activeTab === 'progress' && <EmptyPage title="Evolução em breve" body="Seu histórico de treino e evolução aparecerá aqui." />}
      {activeTab === 'more' && <><EmptyPage title="Sobre o TITAN FIT" body="Versão com execução série por série, RIR e cronômetro de descanso." /><section className="settings-card" aria-label="Aplicativo"><div><span className="info-label">Versão</span><strong>v0.4.0</strong></div><div><span className="info-label">Conexão</span><strong>{isOnline ? 'Online' : 'Offline'}</strong></div><button type="button" className="secondary-action" onClick={installApp} disabled={!installPrompt}>{installPrompt ? 'Instalar aplicativo' : 'Instalação indisponível'}</button><button type="button" className="secondary-action" onClick={() => window.location.reload()}>Verificar atualização</button></section></>}
    </main>
    {installPrompt && !installDismissed && <aside className="pwa-prompt" role="dialog" aria-label="Instalar TITAN FIT"><div><strong>Instale o TITAN FIT</strong><p>Acesso rápido e funcionamento offline.</p></div><div className="prompt-actions"><button type="button" onClick={installApp}>Instalar</button><button type="button" className="text-action" onClick={() => setInstallDismissed(true)}>Depois</button></div></aside>}
    {needRefresh && <aside className="pwa-prompt" role="alert" aria-live="polite"><div><strong>Nova versão disponível</strong><p>Atualize quando for conveniente.</p></div><div className="prompt-actions"><button type="button" onClick={() => updateServiceWorker(true)}>Atualizar agora</button><button type="button" className="text-action" onClick={() => setNeedRefresh(false)}>Depois</button></div></aside>}
    <nav className="bottom-navigation" aria-label="Navegação principal">{tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'plan') setShowImporter(false); }} aria-current={activeTab === tab.id ? 'page' : undefined}><span className="nav-icon" aria-hidden="true">{tab.icon}</span><span>{tab.label}</span></button>)}</nav>
  </div>;
}
function EmptyPage({ title, body }: { title: string; body: string }) { return <section className="hero-card compact" aria-labelledby="page-title"><span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span><h2 id="page-title">{title}</h2><p>{body}</p></section>; }
