import { useEffect, useState } from 'react';
import { DEFAULT_HEALTH_METRICS, healthConnectAvailable, readHealthSamples, requestHealthPermissions } from './bridge';
import { loadHealthSyncStatus, mergeHealthSamples, saveHealthSyncStatus } from './repository';
import type { HealthSyncStatus } from './types';

const INITIAL: HealthSyncStatus = { provider: 'health-connect', bridgeAvailable: false, permissionGranted: false };

export function SmartwatchPanel() {
  const [status, setStatus] = useState<HealthSyncStatus>(INITIAL);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([healthConnectAvailable(), loadHealthSyncStatus().catch(() => null)]).then(([available, saved]) => {
      if (!active) return;
      setStatus({ ...(saved ?? INITIAL), bridgeAvailable: available });
    });
    return () => { active = false; };
  }, []);

  async function connect() {
    setBusy(true);
    try {
      const available = await healthConnectAvailable();
      if (!available) {
        const next = { ...status, bridgeAvailable: false, message: 'A integração será ativada quando o TITAN estiver instalado com a camada Android Health Connect.' };
        setStatus(next); await saveHealthSyncStatus(next).catch(() => undefined); return;
      }
      const granted = await requestHealthPermissions();
      const next = { ...status, bridgeAvailable: true, permissionGranted: granted, message: granted ? 'Health Connect conectado.' : 'Permissão não concedida.' };
      setStatus(next); await saveHealthSyncStatus(next);
    } finally { setBusy(false); }
  }

  async function sync() {
    setBusy(true);
    try {
      const samples = await readHealthSamples(DEFAULT_HEALTH_METRICS, status.lastSyncAt);
      await mergeHealthSamples(samples);
      const next: HealthSyncStatus = { ...status, bridgeAvailable: true, permissionGranted: true, lastSyncAt: new Date().toISOString(), lastSyncCount: samples.length, message: `${samples.length} registros sincronizados.` };
      setStatus(next); await saveHealthSyncStatus(next);
    } finally { setBusy(false); }
  }

  return <section className="settings-card" aria-label="Smartwatch e Health Connect">
    <div><span className="info-label">SMARTWATCH</span><strong>{status.bridgeAvailable ? (status.permissionGranted ? 'Health Connect conectado' : 'Health Connect disponível') : 'Preparado para Health Connect'}</strong><small>Base pronta para sono, frequência cardíaca, passos, calorias ativas, exercícios, distância e composição corporal.</small></div>
    {status.lastSyncAt && <div><span className="info-label">Última sincronização</span><strong>{new Date(status.lastSyncAt).toLocaleString('pt-BR')}</strong><small>{status.lastSyncCount ?? 0} registros recebidos.</small></div>}
    {status.message && <small>{status.message}</small>}
    {!status.permissionGranted ? <button type="button" className="secondary-action" onClick={() => void connect()} disabled={busy}>{busy ? 'Verificando…' : 'Conectar Health Connect'}</button> : <button type="button" className="secondary-action" onClick={() => void sync()} disabled={busy}>{busy ? 'Sincronizando…' : 'Sincronizar agora'}</button>}
  </section>;
}
