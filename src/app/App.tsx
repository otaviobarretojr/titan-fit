import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import packageInfo from '../../package.json';
import { BackupPanel } from '../core/backup/BackupPanel';
import { migrateLegacyStorage } from '../core/database/migrateLegacyStorage';
import { resetAllAppData } from '../core/database/resetAppData';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { demoPlan, isDemoMode, loadFullDemo } from '../features/demo/fullDemo';
import { HealthHubPage } from '../features/health/HealthHubPage';
import { NutritionProgramPanel } from '../features/nutrition/NutritionProgramPanel';
import { PlanCandidatesPage } from '../features/plan/PlanCandidatesPage';
import { PlanImporter } from '../features/plan/PlanImporter';
import { PlanViewer } from '../features/plan/PlanViewer';
import { loadActivePlan, removeActivePlan, saveActivePlan } from '../features/plan/storage';
import type { TitanPlan } from '../features/plan/types';
import { ProfileSettingsPanel } from '../features/profile/ProfileSettingsPanel';
import { loadActiveAssessment, loadActiveProfile } from '../features/profile/repository';
import type { TitanProfile, TitanTrainingAssessment } from '../features/profile/types';
import { ProgrammingPage } from '../features/programming/ProgrammingPage';
import { ProjectManagementPanel } from '../features/project/ProjectManagementPanel';

type TabId = 'today' | 'programming' | 'health' | 'settings' | 'workout';
type NavigationTab = Exclude<TabId, 'workout'>;
type GenerationContext = { profile: TitanProfile; assessment: TitanTrainingAssessment };
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
const APP_VERSION = packageInfo.version;
const tabs: Array<{ id: NavigationTab; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'programming', label: 'Programação' },
  { id: 'health', label: 'Saúde' },
  { id: 'settings', label: 'Ajustes' },
];
function isCurrentTabId(value: unknown): value is TabId { return value === 'workout' || tabs.some((tab) => tab.id === value); }
function normalizeTabId(value: unknown): TabId { if (value === 'progress') return 'health'; return isCurrentTabId(value) ? value : 'today'; }

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => normalizeTabId(window.history.state?.titanTab));
  const [activePlan, setActivePlan] = useState<TitanPlan | null>(() => loadActivePlan());
  const [showImporter, setShowImporter] = useState(false);
  const [generationContext, setGenerationContext] = useState<GenerationContext | null>(null);
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
    const clearTransientNavigation = () => { setShowImporter(false); setGenerationContext(null); setDirectWorkoutId(null); };
    const handlePopState = (event: PopStateEvent) => {
      const nextTab = normalizeTabId(event.state?.titanTab);
      setActiveTab(nextTab);
      clearTransientNavigation();
    };

    const currentState = window.history.state ?? {};
    if (!currentState.titanRoot) {
      window.history.replaceState({ ...currentState, titanRoot: true, titanTab: 'today' }, '');
      window.history.pushState({ titanRoot: true, titanGuard: true, titanTab: 'today' }, '');
      setActiveTab('today');
    } else {
      const normalizedTab = normalizeTabId(currentState.titanTab);
      if (normalizedTab !== currentState.titanTab) window.history.replaceState({ ...currentState, titanRoot: true, titanTab: normalizedTab }, '');
      setActiveTab(normalizedTab);
    }

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
  async function checkForUpdate() { try { if ('serviceWorker' in navigator) { const registration = await navigator.serviceWorker.getRegistration(); await registration?.update(); } } catch (error) { console.warn('Não foi possível verificar a atualização do PWA.', error); } finally { window.location.reload(); } }
  function navigate(tab: TabId, replace = false) { if (tab !== activeTab || directWorkoutId || showImporter || generationContext) { const state = { ...window.history.state, titanRoot: true, titanTab: tab }; if (replace) window.history.replaceState(state, ''); else window.history.pushState(state, ''); } setActiveTab(tab); if (tab !== 'settings') { setShowImporter(false); setGenerationContext(null); } if (tab !== 'workout') setDirectWorkoutId(null); }
  function importPlan(plan: TitanPlan) { saveActivePlan(plan); setActivePlan(plan); setShowImporter(false); setGenerationContext(null); setDirectWorkoutId(null); setDemoMode(false); localStorage.removeItem('titan-fit:demo-mode'); navigate('today', true); }
  function deletePlan() { const message = demoMode ? 'Remover apenas o projeto demonstrativo ativo? O histórico e as avaliações da demonstração continuarão salvos. Para apagar toda a demonstração, use “Remover dados da demonstração” em Configurações.' : 'Remover apenas o projeto ativo? Seu histórico de treinos, PRs, evolução corporal e fotos serão preservados.'; if (!window.confirm(message)) return; removeActivePlan(); setActivePlan(null); setShowImporter(false); setGenerationContext(null); }
  function historyChanged() { setHistoryRefresh((value) => value + 1); navigate('today'); }
  function openTab(tab: NavigationTab) { navigate(tab); }
  function openProjectSettings() { setShowImporter(!activePlan); setGenerationContext(null); navigate('settings'); }
  function startWorkout(workoutId: string) { setShowImporter(false); setGenerationContext(null); setDirectWorkoutId(workoutId); navigate('workout'); }

  async function generateNewOptions() {
    try {
      const [profile, assessment] = await Promise.all([loadActiveProfile(), loadActiveAssessment()]);
      if (!profile || !assessment) { window.alert('Complete o Perfil TITAN antes de gerar novas opções.'); return; }
      setShowImporter(false);
      setGenerationContext({ profile, assessment });
    } catch (error) {
      console.warn('Não foi possível carregar o contexto de planejamento.', error);
      window.alert('Não foi possível carregar seu perfil neste aparelho.');
    }
  }

  function finishNewPlanActivation() {
    const nextPlan = loadActivePlan();
    setActivePlan(nextPlan);
    setGenerationContext(null);
    setShowImporter(false);
    setDemoMode(false);
    setHistoryRefresh((value) => value + 1);
    localStorage.removeItem('titan-fit:demo-mode');
    navigate('today', true);
  }

  async function loadDemoData() { if (!window.confirm('Ativar a demonstração completa? Os dados locais atuais serão substituídos por um projeto de exemplo e registros de treino e evolução corporal.')) return; await resetAllAppData(); await loadFullDemo(); setActivePlan(demoPlan); setDemoMode(true); setGenerationContext(null); setHistoryRefresh((value) => value + 1); window.alert('Modo Demonstração completo ativado. Todas as abas agora possuem dados de exemplo.'); navigate('today', true); }
  async function removeDemoData() { if (!demoMode) return; if (!window.confirm('Remover todos os dados da demonstração? Projeto demo, histórico e avaliações corporais fictícias serão apagados.')) return; await resetAllAppData(); setActivePlan(null); setDemoMode(false); setShowImporter(false); setGenerationContext(null); setDirectWorkoutId(null); setHistoryRefresh((value) => value + 1); window.alert('Dados da demonstração removidos. O TITAN FIT voltou ao estado inicial.'); navigate('today', true); }
  async function resetApp() { const confirmation = window.prompt('Esta ação apaga permanentemente TODOS os dados deste aparelho: projeto, treinos, histórico, evolução corporal, fotos e preferências. Digite RESETAR para confirmar.'); if (confirmation !== 'RESETAR') return; await resetAllAppData(); window.location.reload(); }

  return <div className="app-shell">
    <header className="app-header"><div><span className="eyebrow">TREINO E PROGRESSÃO</span><h1>TITAN FIT</h1></div><div className="header-status-group">{demoMode && <span className="demo-pill">DEMO</span>}<span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</span></div></header>
    <main className="app-main">
      {activeTab === 'today' && <DashboardPage plan={activePlan} onOpenPlan={openProjectSettings} onStartWorkout={startWorkout} />}
      {activeTab === 'programming' && <ProgrammingPage plan={activePlan} />}
      {activeTab === 'health' && <HealthHubPage refreshKey={historyRefresh} />}
      {activeTab === 'workout' && activePlan && <PlanViewer key={`${activePlan.id}:${directWorkoutId ?? 'browse'}`} plan={activePlan} initialWorkoutId={directWorkoutId} onDirectStartHandled={() => setDirectWorkoutId(null)} onImportAnother={() => { setShowImporter(true); setGenerationContext(null); navigate('settings'); }} onRemove={deletePlan} onHistoryChange={historyChanged} />}
      {activeTab === 'settings' && generationContext && <PlanCandidatesPage profile={generationContext.profile} assessment={generationContext.assessment} onActivate={finishNewPlanActivation} onCancel={() => setGenerationContext(null)} />}
      {activeTab === 'settings' && !generationContext && <><EmptyPage title="Configurações" body="Projeto, perfil, dados, backup, instalação e manutenção do TITAN FIT." />
        <ProfileSettingsPanel />
        <section className="settings-card project-settings-card" aria-label="Projeto ativo"><div><span className="info-label">Projeto ativo</span><strong>{activePlan?.project?.name ?? activePlan?.name ?? 'Nenhum projeto importado'}</strong>{activePlan && <small>{activePlan.workouts.length} treinos programados · {activePlan.project?.objective ?? 'Plano de treino ativo'}</small>}</div>{activePlan && !showImporter && <><button type="button" className="secondary-action" onClick={() => void generateNewOptions()}>Gerar novas opções</button><small>Salve primeiro qualquer alteração em Perfil e objetivos. O TITAN usará os dados atuais para recalcular três propostas.</small><button type="button" className="secondary-action" onClick={() => setShowImporter(true)}>Inserir projeto</button><div><button type="button" className="text-action settings-remove-plan" onClick={deletePlan}>Remover projeto ativo</button><small>Remove somente a programação atual. O histórico e a evolução corporal são preservados.</small></div></>}{(!activePlan || showImporter) && <div className="settings-importer"><PlanImporter onImport={importPlan} />{activePlan && <button type="button" className="text-action" onClick={() => setShowImporter(false)}>Cancelar</button>}</div>}</section>
        <ProjectManagementPanel onPlanActivated={(plan) => { setActivePlan(plan); setShowImporter(false); setGenerationContext(null); setDemoMode(false); setHistoryRefresh((value) => value + 1); localStorage.removeItem('titan-fit:demo-mode'); }} />
        <section className="settings-card" aria-label="Programação nutricional"><div><span className="info-label">Programação nutricional</span><strong>Plano alimentar</strong><small>Importe, troque ou remova sua dieta sem alterar o projeto de treino.</small></div><NutritionProgramPanel managementOnly /></section>
        <section className="settings-card" aria-label="Aplicativo"><div><span className="info-label">Versão</span><strong>v{APP_VERSION}</strong></div><div><span className="info-label">Engine de dados</span><strong>{dataEngineStatus === 'ready' ? 'Pronta' : dataEngineStatus === 'starting' ? 'Iniciando' : 'Indisponível'}</strong></div><div><span className="info-label">Conexão</span><strong>{isOnline ? 'Online' : 'Offline'}</strong></div><button type="button" className="secondary-action" onClick={installApp} disabled={!installPrompt}>{installPrompt ? 'Instalar aplicativo' : 'Instalação indisponível'}</button><button type="button" className="secondary-action" onClick={() => void checkForUpdate()}>Verificar atualização</button></section>
        <section className="settings-card settings-data-card" aria-label="Dados e testes"><div><span className="info-label">Modo Demonstração</span><strong>{demoMode ? 'Demonstração ativa' : 'Explorar aplicativo completo'}</strong><small>Carrega projeto, histórico de treino, cargas e evolução corporal fictícios para testar as funções principais.</small></div><button type="button" className="secondary-action" onClick={() => void loadDemoData()}>{demoMode ? 'Recarregar demonstração' : 'Ativar demonstração completa'}</button>{demoMode && <button type="button" className="secondary-action" onClick={() => void removeDemoData()}>Remover dados da demonstração</button>}</section>
        <BackupPanel />
        <section className="settings-card settings-reset-card" aria-label="Dados do aplicativo"><div><span className="info-label">Dados do aplicativo</span><strong>Resetar TITAN FIT</strong><small>Apaga permanentemente projeto, sessões, histórico, evolução corporal, fotos e preferências salvas neste aparelho. Faça um backup antes se quiser preservar seus dados.</small></div><button type="button" className="secondary-action danger-action" onClick={() => void resetApp()}>Resetar todos os dados</button></section>
      </>}
    </main>
    {installPrompt && !installDismissed && <aside className="pwa-prompt" role="dialog" aria-label="Instalar TITAN FIT"><div><strong>Instale o TITAN FIT</strong><p>Acesso rápido aos seus treinos, mesmo offline.</p></div><div className="prompt-actions"><button type="button" onClick={installApp}>Instalar</button><button type="button" className="text-action" onClick={() => setInstallDismissed(true)}>Depois</button></div></aside>}
    {needRefresh && <aside className="pwa-prompt" role="alert" aria-live="polite"><div><strong>Nova versão disponível</strong><p>Atualize para v{APP_VERSION} quando for conveniente.</p></div><div className="prompt-actions"><button type="button" onClick={() => updateServiceWorker(true)}>Atualizar agora</button><button type="button" className="text-action" onClick={() => setNeedRefresh(false)}>Depois</button></div></aside>}
    {activeTab !== 'workout' && <nav className="bottom-navigation" aria-label="Navegação principal">{tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => openTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}><span className="nav-icon-wrap" aria-hidden="true"><NavIcon id={tab.id} /></span><span>{tab.label}</span></button>)}</nav>}
  </div>;
}

function NavIcon({ id }: { id: NavigationTab }) {
  if (id === 'today') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (id === 'programming') return <svg className="nav-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 18h2"/></svg>;
  if (id === 'health') return <svg className="nav-icon" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/><path d="M3.5 13h4l1.5-3 2.5 6 2-4h7"/></svg>;
  return <svg className="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.5v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H1.8V9.5h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.06 3.2l.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V1.8h4.1v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.14.42.36.77.6 1 .3.27.68.4 1.1.4h.1v4.1h-.1A1.7 1.7 0 0 0 19.4 15Z"/></svg>;
}
function EmptyPage({ title, body }: { title: string; body: string }) { return <section className="hero-card compact" aria-labelledby="page-title"><span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span><h2 id="page-title">{title}</h2><p>{body}</p></section>; }
