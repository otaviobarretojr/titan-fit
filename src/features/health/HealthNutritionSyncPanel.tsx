import { useEffect, useState } from 'react';
import { healthConnectAvailable, readDailyNutritionSummary, requestHealthPermissions } from './bridge';
import type { DailyNutritionSummary } from './types';

export function HealthNutritionSyncPanel() {
  const [available, setAvailable] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Verificando acesso à nutrição do Health Connect…');

  async function refresh(requestPermission = false) {
    setBusy(true);
    try {
      const isAvailable = await healthConnectAvailable();
      setAvailable(isAvailable);
      if (!isAvailable) {
        setMessage('Health Connect não está disponível neste aparelho.');
        setAuthorized(false);
        return;
      }

      if (requestPermission) {
        const granted = await requestHealthPermissions(['nutrition']);
        setAuthorized(granted);
        if (!granted) {
          setMessage('Autorize o TITAN a ler Nutrição no Health Connect.');
          return;
        }
      }

      const nutrition = await readDailyNutritionSummary();
      if (!nutrition) {
        setAuthorized(false);
        setMessage('A leitura de Nutrição ainda não foi autorizada.');
        return;
      }

      setAuthorized(true);
      setSummary(nutrition);
      setMessage(
        nutrition.records > 0
          ? `${nutrition.records} registro${nutrition.records === 1 ? '' : 's'} de alimentação recebido${nutrition.records === 1 ? '' : 's'} hoje.`
          : 'Nenhum alimento sincronizado hoje. Registre no Samsung Health e sincronize novamente.',
      );
    } catch {
      setAuthorized(false);
      setMessage('Não foi possível ler a Nutrição. Verifique a permissão no Health Connect.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(false); }, []);

  return <section className="health-sync-card health-nutrition-sync-card" aria-label="Nutrição do Samsung Health">
    <div className="health-sync-copy">
      <span className="info-label">SAMSUNG HEALTH → TITAN</span>
      <strong>Nutrição de hoje</strong>
      <small>{message}</small>
      {summary && <small>Origem: {friendlySources(summary.sources)}.</small>}
    </div>

    <div className="health-signal-grid" aria-label="Macros consumidos hoje">
      <NutritionMetric label="Calorias" value={`${round(summary?.calories)} kcal`} />
      <NutritionMetric label="Proteína" value={`${round(summary?.proteinGrams)} g`} />
      <NutritionMetric label="Carboidratos" value={`${round(summary?.carbohydrateGrams)} g`} />
      <NutritionMetric label="Gorduras" value={`${round(summary?.fatGrams)} g`} />
    </div>

    <button type="button" className="primary-action" disabled={busy || !available} onClick={() => void refresh(!authorized)}>
      {busy ? 'Sincronizando…' : authorized ? 'Atualizar consumo' : 'Autorizar nutrição'}
    </button>
  </section>;
}

function NutritionMetric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function round(value?: number) {
  return Math.round(value ?? 0).toLocaleString('pt-BR');
}

function friendlySources(sources: string[]) {
  if (!sources.length) return 'Health Connect';
  return sources.map((source) => source.includes('shealth') || source.includes('samsung') ? 'Samsung Health' : source).join(', ');
}
