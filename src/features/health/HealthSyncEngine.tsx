import { useEffect, useRef } from 'react';
import { DEFAULT_HEALTH_METRICS, healthConnectAvailable, readDailyActivitySummary, readHealthSamples, readSamsungHealthSignals } from './bridge';
import { loadHealthSyncStatus, mergeHealthSamples, saveHealthSyncStatus } from './repository';

const FOREGROUND_SYNC_INTERVAL_MS = 30_000;
const OVERLAP_WINDOW_MS = 90_000;
const DAILY_SUMMARY_KEY = 'titan-nutrition:health-daily-summary-v2';

function incrementalSince(lastSyncAt?: string) {
  if (!lastSyncAt) return undefined;
  const timestamp = new Date(lastSyncAt).getTime();
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(Math.max(0, timestamp - OVERLAP_WINDOW_MS)).toISOString();
}

/**
 * TITAN Sync Engine v2.
 *
 * Prioriza sinais recentes lidos diretamente do Samsung Health e usa o Health
 * Connect como camada complementar/fallback. Enquanto o app está ativo, faz
 * sincronização incremental frequente e também reage a retomada/foco/rede.
 */
export function HealthSyncEngine() {
  const runningRef = useRef(false);

  useEffect(() => {
    const sync = async (reason: 'startup' | 'resume' | 'interval' | 'online') => {
      if (runningRef.current || document.visibilityState === 'hidden') return;
      runningRef.current = true;
      try {
        const previous = await loadHealthSyncStatus().catch(() => null);
        const available = await healthConnectAvailable();
        const samsungSignals = await readSamsungHealthSignals();
        const since = incrementalSince(previous?.lastSyncAt);
        const connectSignals = available && previous?.permissionGranted
          ? await readHealthSamples(DEFAULT_HEALTH_METRICS, since)
          : [];
        const incoming = [...connectSignals, ...samsungSignals];
        if (incoming.length > 0) await mergeHealthSamples(incoming);

        const summary = await readDailyActivitySummary().catch(() => null);
        if (summary) {
          localStorage.setItem(DAILY_SUMMARY_KEY, JSON.stringify(summary));
          window.dispatchEvent(new CustomEvent('titan:health-summary-changed', { detail: summary }));
        }

        if (!previous) return;
        const now = new Date().toISOString();
        await saveHealthSyncStatus({
          ...previous,
          bridgeAvailable: available,
          lastSyncAt: now,
          lastSyncCount: incoming.length,
          message: incoming.length > 0
            ? `${incoming.length} registros atualizados automaticamente.`
            : `Sincronização automática em dia (${reason}).`,
        });
        window.dispatchEvent(new CustomEvent('titan:health-sync-complete', { detail: { at: now, count: incoming.length, reason } }));
      } catch (error) {
        console.warn('TITAN Sync Engine v2: sincronização automática falhou.', error);
      } finally {
        runningRef.current = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void sync('resume');
    };
    const onFocus = () => void sync('resume');
    const onOnline = () => void sync('online');

    void sync('startup');
    const timer = window.setInterval(() => void sync('interval'), FOREGROUND_SYNC_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return null;
}
