import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_HEALTH_METRICS, healthConnectAvailable, readHealthSamples, requestHealthPermissions } from './bridge';
import { loadHealthSamples, loadHealthSyncStatus, mergeHealthSamples, saveHealthSyncStatus } from './repository';
import type { HealthMetricType, HealthSample, HealthSyncStatus } from './types';

const INITIAL_STATUS: HealthSyncStatus = {
  provider: 'health-connect',
  bridgeAvailable: false,
  permissionGranted: false,
};

const METRICS: Array<{ type: HealthMetricType; label: string }> = [
  { type: 'sleep', label: 'Sono' },
  { type: 'heart-rate', label: 'Frequência cardíaca' },
  { type: 'steps', label: 'Passos' },
  { type: 'active-calories', label: 'Calorias ativas' },
  { type: 'exercise', label: 'Exercícios' },
  { type: 'distance', label: 'Distância' },
  { type: 'body-composition', label: 'Composição corporal' },
];

export function SamsungHealthPage() {
  const [status, setStatus] = useState<HealthSyncStatus>(INITIAL_STATUS);
  const [samples, setSamples] = useState<HealthSample[]>([]);
  const [busy, setBusy] = useState(false);

  async function refreshLocalState() {
    const [available, savedStatus, savedSamples] = await Promise.all([
      healthConnectAvailable(),
      loadHealthSyncStatus().catch(() => null),
      loadHealthSamples().catch(() => []),
    ]);
    setStatus({ ...(savedStatus ?? INITIAL_STATUS), bridgeAvailable: available });
    setSamples(savedSamples);
  }

  useEffect(() => {
    void refreshLocalState();
  }, []);

  const latestByType = useMemo(() => {
    const latest = new Map<HealthMetricType, HealthSample>();
    for (const sample of samples) {
      const previous = latest.get(sample.type);
      if (!previous || previous.startedAt < sample.startedAt) latest.set(sample.type, sample);
    }
    return latest;
  }, [samples]);

  async function connect() {
    setBusy(true);
    try {
      const available = await healthConnectAvailable();
      if (!available) {
        const next: HealthSyncStatus = {
          ...status,
          bridgeAvailable: false,
          message: 'O TITAN está preparado. A leitura real será liberada pela camada Android com Health Connect.',
        };
        setStatus(next);
        await saveHealthSyncStatus(next).catch(() => undefined);
        return;
      }
      const granted = await requestHealthPermissions();
      const next: HealthSyncStatus = {
        ...status,
        bridgeAvailable: true,
        permissionGranted: granted,
        message: granted ? 'Health Connect conectado ao TITAN.' : 'Permissões de saúde não foram concedidas.',
      };
      setStatus(next);
      await saveHealthSyncStatus(next);
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    setBusy(true);
    try {
      if (!status.bridgeAvailable || !status.permissionGranted) {
        await connect();
        return;
      }
      const incoming = await readHealthSamples(DEFAULT_HEALTH_METRICS, status.lastSyncAt);
      const merged = await mergeHealthSamples(incoming);
      const next: HealthSyncStatus = {
        ...status,
        lastSyncAt: new Date().toISOString(),
        lastSyncCount: incoming.length,
        message: incoming.length > 0 ? `${incoming.length} registros recebidos do Health Connect.` : 'Nenhum dado novo encontrado.',
      };
      setSamples(merged);
      setStatus(next);
      await saveHealthSyncStatus(next);
    } finally {
      setBusy(false);
    }
  }

  return <div className="page-stack samsung-health-page">
    <section className="hero-card compact" aria-labelledby="samsung-health-title">
      <span className="eyebrow">GALAXY WATCH + HEALTH CONNECT</span>
      <h2 id="samsung-health-title">Samsung Health</h2>
      <p>Central dos dados de saúde e atividade recebidos do relógio.</p>
    </section>

    <section className="settings-card" aria-label="Sincronização Samsung Health">
      <div>
        <span className="info-label">CONEXÃO</span>
        <strong>{status.bridgeAvailable ? (status.permissionGranted ? 'Health Connect conectado' : 'Health Connect disponível') : 'Aguardando ponte Android'}</strong>
        <small>Galaxy Watch → Samsung Health → Health Connect → TITAN FIT.</small>
      </div>
      {status.lastSyncAt && <div>
        <span className="info-label">Última sincronização</span>
        <strong>{new Date(status.lastSyncAt).toLocaleString('pt-BR')}</strong>
        <small>{status.lastSyncCount ?? 0} novos registros na última leitura.</small>
      </div>}
      {status.message && <small role="status">{status.message}</small>}
      <button type="button" className="primary-action" disabled={busy} onClick={() => void syncNow()}>
        {busy ? 'Sincronizando…' : 'Sincronizar agora'}
      </button>
      {!status.permissionGranted && <button type="button" className="secondary-action" disabled={busy} onClick={() => void connect()}>
        Conectar Health Connect
      </button>}
    </section>

    <section className="settings-card" aria-label="Dados do relógio">
      <div><span className="info-label">DADOS DO RELÓGIO</span><strong>Resumo mais recente</strong></div>
      {METRICS.map(({ type, label }) => {
        const sample = latestByType.get(type);
        return <div key={type} className="health-metric-row">
          <span>{label}</span>
          <strong>{sample ? formatSample(sample) : 'Sem dados'}</strong>
          {sample && <small>{new Date(sample.startedAt).toLocaleString('pt-BR')}</small>}
        </div>;
      })}
    </section>

    <section className="settings-card" aria-label="Status da integração">
      <div><span className="info-label">INTEGRAÇÃO</span><strong>{status.bridgeAvailable ? 'Leitura nativa disponível' : 'Fundação pronta no PWA'}</strong></div>
      <small>No navegador o TITAN não lê o Health Connect diretamente. Quando a camada Android estiver instalada, esta mesma tela passa a receber os dados reais sem mudar seu fluxo de uso.</small>
    </section>
  </div>;
}

function formatSample(sample: HealthSample) {
  const value = Number.isInteger(sample.value) ? String(sample.value) : sample.value.toFixed(1).replace('.', ',');
  return `${value} ${sample.unit}`.trim();
}
