import { useEffect, useMemo, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import packageInfo from '../../package.json';
import { BackupPanel } from '../core/backup/BackupPanel';
import { migrateLegacyStorage } from '../core/database/migrateLegacyStorage';
import { resetAllAppData } from '../core/database/resetAppData';
import { HistoryPage } from '../features/history/HistoryPage';
import { PlanImporter } from '../features/plan/PlanImporter';
import { PlanViewer } from '../features/plan/PlanViewer';
import { loadActivePlan, removeActivePlan, saveActivePlan } from '../features/plan/storage';
import type { TitanPlan, TitanWorkoutDay } from '../features/plan/types';

type TabId = 'today' | 'plans' | 'history' | 'settings' | 'workout';
type NavigationTab = 'today' | 'plans' | 'history';
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const APP_VERSION = packageInfo.version;
const tabs: Array<{ id: NavigationTab; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'plans', label: 'Treinos' },
  { id: 'history', label: 'Histórico' },
];

function normalizeTabId(value: unknown): TabId {
  if (value === 'workout' || value === 'settings' || tabs.some((tab) => tab.id === value)) return value as TabId;
  return 'today';
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => normalizeTabId(window.history.state?.titanTab));
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [activePlan, setActivePlan] = useState<TitanPlan | null>(() => loadActivePlan());
  const [directWorkoutId, setDirectWorkoutId] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataEngineStatus, setDataEngineStatus] = useState<'starting' | 'ready' | 'unavailable'>('starting');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError(error) { console.warn('Não foi possível registrar o PWA.', error); },
  });

  const todayWorkout = useMemo(() => findTodayWorkout(activePlan), [activePlan]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    const captureInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    const handlePopState = (event: PopStateEvent) => {
      if (activeTabRef.current === 'workout') {
        window.history.replaceState({ ...(event.state ?? {}), titanRoot: true, titanTab: 'today' }, '');
        setDirectWorkoutId(null);
        setActiveTab('today');
        return;
      }
      setDirectWorkoutId(null);
      setShowImporter(false);
      setActiveTab(normalizeTabId(event.state?.titanTab));
    };
    const state = window.history.state ?? {};
    if (!state.titanRoot) window.history.replaceState({ ...state, titanRoot: true, titanTab: 'today' }, '');
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

  function navigate(tab: TabId, replace = false) {
    const state = { ...window.history.state, titanRoot: true, titanTab: tab };
    if (replace) window.history.replaceState(state, ''); else window.history.pushState(state, '');
    setActiveTab(tab);
    if (tab !== 'workout') setDirectWorkoutId(null);
    if (tab !== 'settings') setShowImporter(false);
  }

  function startWorkout(workoutId: string) {
    setDirectWorkoutId(workoutId);
    navigate('workout');
  }

  function importPlan(plan: TitanPlan) {
    saveActivePlan(plan);
    setActivePlan(plan);
    setShowImporter(false);
    navigate('today', true);
  }

  function deletePlan() {
    if (!window.confirm('Remover o projeto ativo? O histórico de treinos será preservado.')) return;
    removeActivePlan();
    setActivePlan(null);
    setShowImporter(false);
    navigate('today', true);
  }

  function historyChanged() {
    setHistoryRefresh((value) => value + 1);
    navigate('today', true);
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  }

  async function checkForUpdate() {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      }
    } finally {
      window.location.reload();
    }
  }

  async function resetApp() {
    const confirmation = window.prompt('Esta ação apaga os dados locais do TITAN FIT. Digite RESETAR para confirmar.');
    if (confirmation !== 'RESETAR') return;
    await resetAllAppData();
    window.location.reload();
  }

  return <div className="app-shell titan-focus-shell">
    {activeTab !== 'workout' && <header className="app-header titan-focus-header">
      <div>
        <span className="eyebrow">TREINO</span>
        <h1>TITAN</h1>
      </div>
      <button type="button" className="header-settings-button" onClick={() => navigate('settings')} aria-label="Abrir ajustes">⚙</button>
    </header>}

    <main className="app-main titan-focus-main">
      {activeTab === 'today' && <TodayPage plan={activePlan} workout={todayWorkout} onStartWorkout={startWorkout} onOpenPlans={() => navigate('plans')} onOpenSettings={() => navigate('settings')} />}
      {activeTab === 'plans' && activePlan && <PlanViewer plan={activePlan} onImportAnother={() => { setShowImporter(true); navigate('settings'); }} onRemove={deletePlan} onHistoryChange={historyChanged} onExitWorkout={() => navigate('today', true)} />}
      {activeTab === 'plans' && !activePlan && <EmptyState onAction={() => { setShowImporter(true); navigate('settings'); }} />}
      {activeTab === 'history' && <HistoryPage refreshKey={historyRefresh} />}
      {activeTab === 'workout' && activePlan && <PlanViewer key={`${activePlan.id}:${directWorkoutId ?? 'browse'}`} plan={activePlan} initialWorkoutId={directWorkoutId} onDirectStartHandled={() => setDirectWorkoutId(null)} onImportAnother={() => { setShowImporter(true); navigate('settings'); }} onRemove={deletePlan} onHistoryChange={historyChanged} onExitWorkout={() => navigate('today', true)} />}
      {activeTab === 'settings' && <SettingsPage activePlan={activePlan} showImporter={showImporter} setShowImporter={setShowImporter} onImport={importPlan} onDelete={deletePlan} dataEngineStatus={dataEngineStatus} isOnline={isOnline} installPrompt={installPrompt} onInstall={installApp} onCheckUpdate={checkForUpdate} onReset={resetApp} />}
    </main>

    {installPrompt && !installDismissed && <aside className="pwa-prompt" role="dialog" aria-label="Instalar TITAN FIT"><div><strong>Instale o TITAN FIT</strong><p>Acesso rápido ao treino, mesmo offline.</p></div><div className="prompt-actions"><button type="button" onClick={installApp}>Instalar</button><button type="button" className="text-action" onClick={() => setInstallDismissed(true)}>Depois</button></div></aside>}
    {needRefresh && <aside className="pwa-prompt" role="alert"><div><strong>Nova versão disponível</strong><p>Atualize para v{APP_VERSION}.</p></div><div className="prompt-actions"><button type="button" onClick={() => updateServiceWorker(true)}>Atualizar</button><button type="button" className="text-action" onClick={() => setNeedRefresh(false)}>Depois</button></div></aside>}

    {activeTab !== 'workout' && activeTab !== 'settings' && <nav className="bottom-navigation titan-focus-nav" aria-label="Navegação principal">
      {tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => navigate(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}><NavIcon id={tab.id} /><span>{tab.label}</span></button>)}
    </nav>}
  </div>;
}

function TodayPage({ plan, workout, onStartWorkout, onOpenPlans, onOpenSettings }: { plan: TitanPlan | null; workout: TitanWorkoutDay | null; onStartWorkout: (id: string) => void; onOpenPlans: () => void; onOpenSettings: () => void }) {
  const now = new Date();
  const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(now);
  if (!plan) return <section className="focus-home"><span className="focus-date">{date}</span><div className="focus-empty"><span className="eyebrow">SEU TREINO</span><h2>Nenhum projeto ativo</h2><p>Importe seu treino para começar.</p><button type="button" className="primary-action" onClick={onOpenSettings}>Importar treino</button></div></section>;
  if (!workout) return <section className="focus-home"><span className="focus-date">{date}</span><div className="focus-empty"><span className="eyebrow">RECUPERAÇÃO</span><h2>Sem musculação hoje</h2><p>Use o dia para recuperar e volte forte na próxima sessão.</p><button type="button" className="secondary-action" onClick={onOpenPlans}>Ver semana</button></div></section>;
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + Math.max(1, exercise.sets ?? 1), 0);
  return <section className="focus-home">
    <span className="focus-date">{date}</span>
    <div className="today-workout-card">
      <span className="eyebrow">TREINO DE HOJE</span>
      <h2>{workout.title}</h2>
      {workout.focus && <p className="today-focus">{workout.focus}</p>}
      <div className="today-metrics"><span><strong>{workout.exercises.length}</strong> exercícios</span><span><strong>{totalSets}</strong> séries</span></div>
      <button type="button" className="primary-action today-start" onClick={() => onStartWorkout(workout.id)}>Iniciar treino</button>
    </div>
    <button type="button" className="quiet-link" onClick={onOpenPlans}>Ver todos os treinos</button>
  </section>;
}

function SettingsPage({ activePlan, showImporter, setShowImporter, onImport, onDelete, dataEngineStatus, isOnline, installPrompt, onInstall, onCheckUpdate, onReset }: { activePlan: TitanPlan | null; showImporter: boolean; setShowImporter: (value: boolean) => void; onImport: (plan: TitanPlan) => void; onDelete: () => void; dataEngineStatus: 'starting' | 'ready' | 'unavailable'; isOnline: boolean; installPrompt: BeforeInstallPromptEvent | null; onInstall: () => Promise<void>; onCheckUpdate: () => Promise<void>; onReset: () => Promise<void> }) {
  return <section className="focus-settings">
    <button type="button" className="quiet-link back-settings" onClick={() => window.history.back()}>← Voltar</button>
    <header className="section-header"><span className="eyebrow">AJUSTES</span><h2>Configurações</h2><p>Somente o necessário para manter seu treino e seus dados.</p></header>
    <section className="settings-card"><span className="info-label">PROJETO ATIVO</span><strong>{activePlan?.project?.name ?? activePlan?.name ?? 'Nenhum treino importado'}</strong>{activePlan && <small>{activePlan.workouts.length} treinos disponíveis</small>}<button type="button" className="secondary-action" onClick={() => setShowImporter(!showImporter)}>{activePlan ? 'Trocar projeto' : 'Importar projeto'}</button>{activePlan && <button type="button" className="text-action danger-text" onClick={onDelete}>Remover projeto</button>}{showImporter && <div className="settings-importer"><PlanImporter onImport={onImport} /></div>}</section>
    <BackupPanel />
    <section className="settings-card"><span className="info-label">APLICATIVO</span><div className="settings-status-grid"><span>Versão <strong>v{APP_VERSION}</strong></span><span>Dados <strong>{dataEngineStatus === 'ready' ? 'OK' : dataEngineStatus === 'starting' ? 'Iniciando' : 'Erro'}</strong></span><span>Conexão <strong>{isOnline ? 'Online' : 'Offline'}</strong></span></div><button type="button" className="secondary-action" disabled={!installPrompt} onClick={() => void onInstall()}>{installPrompt ? 'Instalar aplicativo' : 'App já instalado'}</button><button type="button" className="secondary-action" onClick={() => void onCheckUpdate()}>Verificar atualização</button></section>
    <section className="settings-card settings-reset-card"><span className="info-label">MANUTENÇÃO</span><strong>Resetar dados locais</strong><small>Use apenas se precisar começar do zero neste aparelho.</small><button type="button" className="danger-action" onClick={() => void onReset()}>Resetar aplicativo</button></section>
  </section>;
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return <section className="focus-empty"><h2>Nenhum treino ativo</h2><p>Importe um projeto para visualizar sua programação.</p><button type="button" className="primary-action" onClick={onAction}>Importar treino</button></section>;
}

function findTodayWorkout(plan: TitanPlan | null): TitanWorkoutDay | null {
  if (!plan) return null;
  const day = normalizeDay(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date()));
  return plan.workouts.find((workout) => normalizeDay(workout.day) === day) ?? null;
}

function normalizeDay(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace('-feira', '').trim();
}

function NavIcon({ id }: { id: NavigationTab }) {
  if (id === 'today') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/></svg>;
  if (id === 'plans') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v6h6"/><path d="M12 8v5l3 2"/></svg>;
}
