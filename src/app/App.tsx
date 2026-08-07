import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { BackupPanel } from '../core/backup/BackupPanel';
import { migrateLegacyStorage } from '../core/database/migrateLegacyStorage';
import { resetAllAppData } from '../core/database/resetAppData';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { demoPlan, isDemoMode, loadFullDemo } from '../features/demo/fullDemo';
import { HistoryPage } from '../features/history/HistoryPage';
import { ProgressPage } from '../features/history/ProgressPage';
import { PlanImporter } from '../features/plan/PlanImporter';
import { PlanViewer } from '../features/plan/PlanViewer';
import { WeeklyLibraryPage } from '../features/plan/WeeklyLibraryPage';
import { loadActivePlan, removeActivePlan, saveActivePlan } from '../features/plan/storage';
import type { TitanPlan } from '../features/plan/types';

type TabId = 'today' | 'history' | 'week' | 'progress' | 'settings' | 'workout';
type NavigationTab = Exclude<TabId, 'workout'>;
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
const tabs: Array<{ id: NavigationTab; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'history', label: 'Histórico' },
  { id: 'week', label: 'Semana' },
  { id: 'progress', label: 'Progresso' },
  { id: 'settings', label: 'Configurações' }
];

function isTabId(value: unknown): value is TabId { return value === 'workout' || tabs.some((tab) => tab.id === value); }

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => isTabId(window.history.state?.titanTab) ? window.history.state.titanTab : 'today');
  const [activePlan, setActivePlan] = useState<TitanPlan | null>(() => loadActivePlan());
  const [showImporter, setShowImporter] = useState(false);
  const [directWorkoutId, setDirectWorkoutId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [demoMode, setDemoMode] = useState(() => isDemoMode());
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
    if (tab !== 'settings') setShowImporter(false);
    if (tab !== 'workout') setDirectWorkoutId(null);
  }
  function importPlan(plan: TitanPlan) { saveActivePlan(plan); setActivePlan(plan); setShowImporter(false); setDirectWorkoutId(null); setDemoMode(false); localStorage.removeItem('titan-fit:demo-mode'); navigate('today', true); }
  function deletePlan() { if (!window.confirm('Remover o projeto ativo deste aparelho? O histórico e a evolução corporal serão preservados.')) return; removeActivePlan(); setActivePlan(null); setShowImporter(false); }
  function historyChanged() { setHistoryRefresh((value) => value + 1); navigate('history'); }
  function openTab(tab: NavigationTab) { navigate(tab); }
  function openProjectSettings() { setShowImporter(!activePlan); navigate('settings'); }
  function startWorkout(workoutId: string) { setShowImporter(false); setDirectWorkoutId(workoutId); navigate('workout'); }

  async function loadDemoData() {
    if (!window.confirm('Ativar a demonstração completa? Os dados locais atuais serão substituídos por um projeto de exemplo, uma semana de treinos e três avaliações corporais.')) return;
    await resetAllAppData();
    await loadFullDemo();
    setActivePlan(demoPlan);
    setDemoMode(true);
    setHistoryRefresh((value) => value + 1);
    window.alert('Modo Demonstração completo ativado. Todas as abas agora possuem dados de exemplo.');
    navigate('today', true);
  }

  async function resetApp() {
    const confirmation = window.prompt('Esta ação apaga projeto, treinos, evolução e preferências deste aparelho. Digite RESETAR para confirmar.');
    if (confirmation !== 'RESETAR') return;
    await resetAllAppData();
    window.location.reload();
  }

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">TREINO E PROGRESSÃO</span><h1>TITAN FIT</h1></div><div className="header-status-group">{demoMode && <span className="demo-pill">DEMO</span>}<span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</span></div></header>
    <main className="app-main">
      {activeTab === 'today' && <DashboardPage plan={activePlan} onOpenPlan={openProjectSettings} onStartWorkout={startWorkout} onOpenProgress={() => openTab('progress')} />}
      {activeTab === 'history' && <HistoryPage refreshKey={historyRefresh} />}
      {activeTab === 'week' && <WeeklyLibraryPage plan={activePlan} />}
      {activeTab === 'progress' && <ProgressPage refreshKey={historyRefresh} />}
      {activeTab === 'workout' && activePlan && <PlanViewer key={`${activePlan.id}:${directWorkoutId ?? 'browse'}`} plan={activePlan} initialWorkoutId={directWorkoutId} onDirectStartHandled={() => setDirectWorkoutId(null)} onImportAnother={() => { setShowImporter(true); navigate('settings'); }} onRemove={deletePlan} onHistoryChange={historyChanged} />}
      {activeTab === 'settings' && <><EmptyPage title="Configurações" body="Projeto, dados, backup, instalação e manutenção do TITAN FIT." />
        <section className="settings-card project-settings-card" aria-label="Projeto ativo"><div><span className="info-label">Projeto ativo</span><strong>{activePlan?.project?.name ?? activePlan?.name ?? 'Nenhum projeto importado'}</strong>{activePlan && <small>{activePlan.workouts.length} treinos programados · {activePlan.project?.objective ?? 'Plano de treino ativo'}</small>}</div>{activePlan && !showImporter && <><button type="button" className="secondary-action" onClick={() => setShowImporter(true)}>Substituir projeto</button><button type="button" className="text-action settings-remove-plan" onClick={deletePlan}>Remover projeto ativo</button></>}{(!activePlan || showImporter) && <div className="settings-importer"><PlanImporter onImport={importPlan} />{activePlan && <button type="button" className="text-action" onClick={() => setShowImporter(false)}>Cancelar substituição</button>}</div>}</section>
        <section className="settings-card" aria-label="Aplicativo"><div><span className="info-label">Versão</span><strong>v0.23</strong></div><div><span className="info-label">Engine de dados</span><strong>{dataEngineStatus === 'ready' ? 'Pronta' : dataEngineStatus === 'starting' ? 'Iniciando' : 'Indisponível'}</strong></div><div><span className="info-label">Conexão</span><strong>{isOnline ? 'Online' : 'Offline'}</strong></div><button type="button" className="secondary-action" onClick={installApp} disabled={!installPrompt}>{installPrompt ? 'Instalar aplicativo' : 'Instalação indisponível'}</button><button type="button" className="secondary-action" onClick={() => window.location.reload()}>Verificar atualização</button></section>
        <section className="settings-card settings-data-card" aria-label="Dados e testes"><div><span className="info-label">Modo Demonstração</span><strong>{demoMode ? 'Demonstração ativa' : 'Explorar aplicativo completo'}</strong><small>Carrega projeto, semana programada, histórico de treino, cargas, cardio e três avaliações corporais fictícias.</small></div><button type="button" className="secondary-action" onClick={() => void loadDemoData()}>{demoMode ? 'Recarregar demonstração' : 'Ativar demonstração completa'}</button><div className="settings-danger-zone"><span className="info-label">Zona de segurança</span><strong>Apagar todos os dados</strong><small>Remove projeto, sessões, histórico, evolução corporal, cardio e preferências salvas neste aparelho.</small><button type="button" className="secondary-action danger-action" onClick={() => void resetApp()}>Resetar TITAN FIT</button></div></section><BackupPanel /></>}
    </main>
    {installPrompt && !installDismissed && <aside className="pwa-prompt" role="dialog" aria-label="Instalar TITAN FIT"><div><strong>Instale o TITAN FIT</strong><p>Acesso rápido aos seus treinos, mesmo offline.</p></div><div className="prompt-actions"><button type="button" onClick={installApp}>Instalar</button><button type="button" className="text-action" onClick={() => setInstallDismissed(true)}>Depois</button></div></aside>}
    {needRefresh && <aside className="pwa-prompt" role="alert" aria-live="polite"><div><strong>Nova versão disponível</strong><p>Atualize quando for conveniente.</p></div><div className="prompt-actions"><button type="button" onClick={() => updateServiceWorker(true)}>Atualizar agora</button><button type="button" className="text-action" onClick={() => setNeedRefresh(false)}>Depois</button></div></aside>}
    {activeTab !== 'workout' && <nav className="bottom-navigation" aria-label="Navegação principal">{tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => openTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}><span className="nav-icon-wrap" aria-hidden="true"><NavIcon id={tab.id} /></span><span>{tab.label}</span></button>)}</nav>}
  </div>;
}

function NavIcon({ id }: { id: NavigationTab }) {
  if (id === 'today') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (id === 'history') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M4 5.5h16M4 10h16M4 14.5h10M4 19h7"/><path d="M18 14v6M15 17h6"/></svg>;
  if (id === 'week') return <svg className="nav-icon" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M3.5 9h17M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01"/></svg>;
  if (id === 'progress') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M4 18 9 13l3.5 3.5L20 8"/><path d="M15 8h5v5"/></svg>;
  return <svg className="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.5v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H1.8V9.5h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.06 3.2l.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V1.8h4.1v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.14.42.36.77.6 1 .3.27.68.4 1.1.4h.1v4.1h-.1A1.7 1.7 0 0 0 19.4 15Z"/></svg>;
}

function EmptyPage({ title, body }: { title: string; body: string }) { return <section className="hero-card compact" aria-labelledby="page-title"><span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span><h2 id="page-title">{title}</h2><p>{body}</p></section>; }
