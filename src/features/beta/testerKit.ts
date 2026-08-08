export type TesterChecklistItemId = 'install' | 'profile' | 'plan' | 'workout' | 'cardio' | 'progress' | 'backup' | 'feedback';

export type TesterKitState = {
  testerName: string;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  completedItems: TesterChecklistItemId[];
};

export const TESTER_CHECKLIST: Array<{ id: TesterChecklistItemId; title: string; description: string }> = [
  { id: 'install', title: 'Abrir ou instalar o TITAN FIT', description: 'Confirme que o app abre normalmente no navegador ou como PWA.' },
  { id: 'profile', title: 'Criar ou revisar o perfil', description: 'Confira se objetivo, experiência, dias e cardio fazem sentido.' },
  { id: 'plan', title: 'Gerar ou importar um projeto', description: 'Teste uma das duas portas de entrada do planejamento.' },
  { id: 'workout', title: 'Executar um treino', description: 'Registre séries, carga, repetições, RIR e descanso.' },
  { id: 'cardio', title: 'Explorar o cardio', description: 'Confira programação, registro e histórico cardiovascular.' },
  { id: 'progress', title: 'Abrir Progresso', description: 'Veja evolução corporal, histórico e PRs disponíveis.' },
  { id: 'backup', title: 'Exportar um backup', description: 'Confirme que os dados podem ser protegidos em arquivo local.' },
  { id: 'feedback', title: 'Enviar um feedback', description: 'Registre pelo menos uma impressão, sugestão ou problema encontrado.' },
];

const STORAGE_KEY = 'titan-fit:beta-tester-kit-v1';

export function loadTesterKit(): TesterKitState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as TesterKitState : null;
  } catch {
    return null;
  }
}

export function saveTesterKit(state: TesterKitState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearTesterKit(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildTesterReport(state: TesterKitState, appVersion: string) {
  return {
    format: 'titan-fit-beta-report',
    schemaVersion: 1,
    appVersion,
    exportedAt: new Date().toISOString(),
    tester: state,
    checklist: TESTER_CHECKLIST.map((item) => ({ ...item, completed: state.completedItems.includes(item.id) })),
    userAgent: navigator.userAgent,
    online: navigator.onLine,
  };
}

export function downloadTesterReport(state: TesterKitState, appVersion: string): void {
  const report = buildTesterReport(state, appVersion);
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `titan-fit-beta-${state.testerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'tester'}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
