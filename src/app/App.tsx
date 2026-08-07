import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { BackupPanel } from '../core/backup/BackupPanel';
import { migrateLegacyStorage } from '../core/database/migrateLegacyStorage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProgressPage } from '../features/history/ProgressPage';
import { PlanImporter } from '../features/plan/PlanImporter';
import { PlanViewer } from '../features/plan/PlanViewer';
import { WeeklyLibraryPage } from '../features/plan/WeeklyLibraryPage';
import { loadActivePlan, removeActivePlan, saveActivePlan } from '../features/plan/storage';
import type { TitanPlan } from '../features/plan/types';

type TabId = 'today' | 'plan' | 'week' | 'progress' | 'more';
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'plan', label: 'Projeto' },
  { id: 'week', label: 'Semana' },
  { id: 'progress', label: 'Progresso' },
  { id: 'more', label: 'Mais' }
];

function isTabId(value: unknown): value is TabId { return tabs.some((tab) => tab.id === value); }

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => isTabId(window.history.state?.titanTab) ? window.history.state.titanTab : 'today');
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
    const handlePopState = (event: PopStateEvent) => {
      const nextTab = isTabId(event.state?.titanTab) ? event.state.titanTab : 'today';
      setActiveTab(nextTab);
      setShowImporter(false);
      setDirectWorkoutId(null);
    };
    if (!isTabId(window.history.state?.titanTab)) window.history.replaceState({ ...window.history.state, titanTab: activeTab }, '');
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('popstate', handlePopState);
    void migrateLegacyStorage().then(() => setDataEngineStatus('ready')).catch(() => setDataEngineStatus('unavailable'));
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  async function installApp() { if (!installPrompt) return; await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setInstallPrompt(null); }
  function navigate(tab: TabId, replace = false) {
    if (tab !== activeTab || directWorkoutId || showImporter) {
      const state = { ...window.history.state, titanTab: tab };
      if (replace) window.history.replaceState(state, ''); else window.history.pushState(state, '');
    }
    setActiveTab(tab);
    if (tab !== 'plan') { setShowImporter(false); setDirectWorkoutId(null); }
  }
  function importPlan(plan: TitanPlan) { saveActivePlan(plan); setActivePlan(plan); setShowImporter(false); setDirectWorkoutId(null); navigate('today', true); }
  function deletePlan() { if (!window.confirm('Remover o projeto ativo deste aparelho?')) return; removeActivePlan(); setActivePlan(null); setShowImporter(false); setDirectWorkoutId(null); }
  function historyChanged() { setHistoryRefresh((value) => value + 1); navigate('progress'); }
  function openTab(tab: TabId) { navigate(tab); }
  function openPlan() { setShowImporter(!activePlan); setDirectWorkoutId(null); navigate('plan'); }
  function startWorkout(workoutId: string) { setShowImporter(false); setDirectWorkoutId(workoutId); navigate('plan'); }

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">TREINO E PROGRESSÃO</span><h1>TITAN FIT</h1></div><span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</span></header>
    <main className="app-main">
      {activeTab === 'today' && <DashboardPage plan={activePlan} onOpenPlan={openPlan} onStartWorkout={startWorkout} onOpenProgress={() => openTab('progress')} />}
      {activeTab === 'plan' && (showImporter || !activePlan ? <>{activePlan && <button type="button" className="secondary-action back-action" onClick={() => setShowImporter(false)}>Voltar para o projeto atual</button>}<PlanImporter onImport={importPlan} /></> : <PlanViewer key={`${activePlan.id}:${directWorkoutId ?? 'browse'}`} plan={activePlan} initialWorkoutId={directWorkoutId} onDirectStartHandled={() => setDirectWorkoutId(null)} onImportAnother={() => setShowImporter(true)} onRemove={deletePlan} onHistoryChange={historyChanged} />)}
      {activeTab === 'week' && <WeeklyLibraryPage plan={activePlan} />}
      {activeTab === 'progress' && <ProgressPage refreshKey={historyRefresh} />}
      {activeTab === 'more' && <><EmptyPage title="Configurações" body="Backup, instalação e atualização do seu aplicativo de treino." /><section className="settings-card" aria-label="Aplicativo"><div><span className="info-label">Versão</span><strong>v0.21.0</strong></div><div><span className="info-label">Engine de dados</span><strong>{dataEngineStatus === 'ready' ? 'Pronta' : dataEngineStatus === 'starting' ? 'Iniciando' : 'Indisponível'}</strong></div><div><span className="info-label">Conexão</span><strong>{isOnline ? 'Online' : 'Offline'}</strong></div><button type="button" className="secondary-action" onClick={installApp} disabled={!installPrompt}>{installPrompt ? 'Instalar aplicativo' : 'Instalação indisponível'}</button><button type="button" className="secondary-action" onClick={() => window.location.reload()}>Verificar atualização</button></section><BackupPanel /></>}
    </main>
    {installPrompt && !installDismissed && <aside className="pwa-prompt" role="dialog" aria-label="Instalar TITAN FIT"><div><strong>Instale o TITAN FIT</strong><p>Acesso rápido aos seus treinos, mesmo offline.</p></div><div className="prompt-actions"><button type="button" onClick={installApp}>Instalar</button><button type="button" className="text-action" onClick={() => setInstallDismissed(true)}>Depois</button></div></aside>}
    {needRefresh && <aside className="pwa-prompt" role="alert" aria-live="polite"><div><strong>Nova versão disponível</strong><p>Atualize quando for conveniente.</p></div><div className="prompt-actions"><button type="button" onClick={() => updateServiceWorker(true)}>Atualizar agora</button><button type="button" className="text-action" onClick={() => setNeedRefresh(false)}>Depois</button></div></aside>}
    <nav className="bottom-navigation" aria-label="Navegação principal">{tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => openTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}><span className="nav-icon-wrap" aria-hidden="true"><NavIcon id={tab.id} /></span><span>{tab.label}</span></button>)}</nav>
  </div>;
}

function NavIcon({ id }: { id: TabId }) {
  if (id === 'today') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (id === 'plan') return <svg className="nav-icon" viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (id === 'week') return <svg className="nav-icon" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M3.5 9h17M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01"/></svg>;
  if (id === 'progress') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M4 18 9 13l3.5 3.5L20 8"/><path d="M15 8h5v5"/></svg>;
  return <svg className="nav-icon" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>;
}

function EmptyPage({ title, body }: { title: string; body: string }) { return <section className="hero-card compact" aria-labelledby="page-title"><span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span><h2 id="page-title">{title}</h2><p>{body}</p></section>; }
