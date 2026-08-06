import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { BackupPanel } from '../core/backup/BackupPanel';
import { migrateLegacyStorage } from '../core/database/migrateLegacyStorage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProgressPage } from '../features/history/ProgressPage';
import { PlanImporter } from '../features/plan/PlanImporter';
import { PlanViewer } from '../features/plan/PlanViewer';
import { loadActivePlan, removeActivePlan, saveActivePlan } from '../features/plan/storage';
import type { TitanPlan } from '../features/plan/types';

type TabId = 'today' | 'plan' | 'progress' | 'more';
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'today', label: 'Hoje', icon: '⌂' },
  { id: 'plan', label: 'Projeto', icon: '▤' },
  { id: 'progress', label: 'Progresso', icon: '↗' },
  { id: 'more', label: 'Mais', icon: '•••' }
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [activePlan, setActivePlan] = useState<TitanPlan | null>(() => loadActivePlan());
  const [showImporter, setShowImporter] = useState(false);
  const [directWorkoutId, setDirectWorkoutId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataEngineStatus, setDataEngineStatus] = useState<'starting' | 'ready' | 'unavailable'>('starting');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({ onRegisterError(error) { console.warn('Não foi possível registrar o PWA.', error); } });

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    const captureInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    void migrateLegacyStorage().then(() => setDataEngineStatus('ready')).catch(() => setDataEngineStatus('unavailable'));
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
    };
  }, []);

  async function installApp() { if (!installPrompt) return; await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setInstallPrompt(null); }
  function importPlan(plan: TitanPlan) { saveActivePlan(plan); setActivePlan(plan); setShowImporter(false); setDirectWorkoutId(null); setActiveTab('today'); }
  function deletePlan() { if (!window.confirm('Remover o projeto ativo deste aparelho?')) return; removeActivePlan(); setActivePlan(null); setShowImporter(false); setDirectWorkoutId(null); }
  function historyChanged() { setHistoryRefresh((value) => value + 1); setActiveTab('progress'); }
  function openTab(tab: TabId) { setActiveTab(tab); if (tab !== 'plan') setShowImporter(false); if (tab !== 'plan') setDirectWorkoutId(null); }
  function openPlan() { setShowImporter(!activePlan); setDirectWorkoutId(null); setActiveTab('plan'); }
  function startWorkout(workoutId: string) { setShowImporter(false); setDirectWorkoutId(workoutId); setActiveTab('plan'); }

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">TREINO E PROGRESSÃO</span><h1>TITAN FIT</h1></div><span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</span></header>
    <main className="app-main">
      {activeTab === 'today' && <DashboardPage plan={activePlan} onOpenPlan={openPlan} onStartWorkout={startWorkout} onOpenProgress={() => openTab('progress')} />}
      {activeTab === 'plan' && (showImporter || !activePlan ? <>{activePlan && <button type="button" className="secondary-action back-action" onClick={() => setShowImporter(false)}>Voltar para o projeto atual</button>}<PlanImporter onImport={importPlan} /></> : <PlanViewer key={`${activePlan.id}:${directWorkoutId ?? 'browse'}`} plan={activePlan} initialWorkoutId={directWorkoutId} onDirectStartHandled={() => setDirectWorkoutId(null)} onImportAnother={() => setShowImporter(true)} onRemove={deletePlan} onHistoryChange={historyChanged} />)}
      {activeTab === 'progress' && <ProgressPage refreshKey={historyRefresh} />}
      {activeTab === 'more' && <><EmptyPage title="Configurações" body="Backup, instalação e atualização do seu aplicativo de treino." /><section className="settings-card" aria-label="Aplicativo"><div><span className="info-label">Versão</span><strong>v0.9.0</strong></div><div><span className="info-label">Engine de dados</span><strong>{dataEngineStatus === 'ready' ? 'Pronta' : dataEngineStatus === 'starting' ? 'Iniciando' : 'Indisponível'}</strong></div><div><span className="info-label">Conexão</span><strong>{isOnline ? 'Online' : 'Offline'}</strong></div><button type="button" className="secondary-action" onClick={installApp} disabled={!installPrompt}>{installPrompt ? 'Instalar aplicativo' : 'Instalação indisponível'}</button><button type="button" className="secondary-action" onClick={() => window.location.reload()}>Verificar atualização</button></section><BackupPanel /></>}
    </main>
    {installPrompt && !installDismissed && <aside className="pwa-prompt" role="dialog" aria-label="Instalar TITAN FIT"><div><strong>Instale o TITAN FIT</strong><p>Acesso rápido aos seus treinos, mesmo offline.</p></div><div className="prompt-actions"><button type="button" onClick={installApp}>Instalar</button><button type="button" className="text-action" onClick={() => setInstallDismissed(true)}>Depois</button></div></aside>}
    {needRefresh && <aside className="pwa-prompt" role="alert" aria-live="polite"><div><strong>Nova versão disponível</strong><p>Atualize quando for conveniente.</p></div><div className="prompt-actions"><button type="button" onClick={() => updateServiceWorker(true)}>Atualizar agora</button><button type="button" className="text-action" onClick={() => setNeedRefresh(false)}>Depois</button></div></aside>}
    <nav className="bottom-navigation" aria-label="Navegação principal">{tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => openTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}><span className="nav-icon" aria-hidden="true">{tab.icon}</span><span>{tab.label}</span></button>)}</nav>
  </div>;
}
function EmptyPage({ title, body }: { title: string; body: string }) { return <section className="hero-card compact" aria-labelledby="page-title"><span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span><h2 id="page-title">{title}</h2><p>{body}</p></section>; }
