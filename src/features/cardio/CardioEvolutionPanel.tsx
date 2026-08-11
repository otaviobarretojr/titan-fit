import { useMemo, useState } from 'react';
import type { WorkoutHistoryRecord } from '../history/types';
import { buildCardioEvolution, type CardioEvolutionPeriod } from './evolution';

export function CardioEvolutionPanel({ records }: { records: WorkoutHistoryRecord[] }) {
  const [period, setPeriod] = useState<CardioEvolutionPeriod>(7);
  const evolution = useMemo(() => buildCardioEvolution(records, period), [records, period]);

  return <section className="cardio-evolution-v056" aria-label="Evolução cardiovascular">
    <div className="cardio-section-title"><div><span className="eyebrow">CARDIO 2.0</span><h3>Evolução cardiovascular</h3></div></div>
    <div className="cardio-evolution-period" role="tablist" aria-label="Período da evolução do cardio">
      <button type="button" role="tab" aria-selected={period === 7} className={period === 7 ? 'active' : ''} onClick={() => setPeriod(7)}>7 dias</button>
      <button type="button" role="tab" aria-selected={period === 30} className={period === 30 ? 'active' : ''} onClick={() => setPeriod(30)}>30 dias</button>
    </div>

    <div className="cardio-evolution-grid">
      <Metric label="Sessões" value={String(evolution.sessions)} comparison={deltaLabel(evolution.sessionsDelta, '')} />
      <Metric label="Tempo" value={formatDuration(evolution.totalDurationSeconds)} comparison={null} />
      <Metric label="Distância" value={formatDistance(evolution.totalDistanceMeters)} comparison={deltaLabel(evolution.distanceDeltaMeters, ' m')} />
      <Metric label="Melhor distância" value={formatDistance(evolution.bestDistanceMeters)} comparison={null} />
      <Metric label="Ritmo médio" value={formatPace(evolution.averagePaceSecondsPerKm)} comparison={paceComparison(evolution.paceDeltaSecondsPerKm)} />
      <Metric label="FC média" value={evolution.averageHeartRate ? `${evolution.averageHeartRate} bpm` : '—'} comparison={null} />
    </div>

    <div className="cardio-5k-card">
      <div><span className="eyebrow">META 5 KM</span><strong>{evolution.fiveKmReached ? '5 km alcançados' : `${evolution.fiveKmProgressPercent}% do marco`}</strong><p>Melhor distância registrada: {formatDistance(evolution.bestDistanceMeters)}</p></div>
      <div className="cardio-5k-progress" aria-label={`${evolution.fiveKmProgressPercent}% da meta de 5 km`}><span style={{ width: `${evolution.fiveKmProgressPercent}%` }} /></div>
    </div>

    <div className="cardio-evolution-insight"><span className="eyebrow">LEITURA TITAN</span><strong>{evolution.insight.title}</strong><p>{evolution.insight.message}</p></div>
  </section>;
}

function Metric({ label, value, comparison }: { label: string; value: string; comparison: string | null }) {
  return <article><span>{label}</span><strong>{value}</strong>{comparison && <small>{comparison}</small>}</article>;
}

function deltaLabel(delta: number | null, suffix: string) {
  if (delta === null) return null;
  if (delta === 0) return '→ igual ao período anterior';
  return `${delta > 0 ? '↑ +' : '↓ '}${formatDelta(delta)}${suffix} vs. anterior`;
}

function paceComparison(delta: number | null) {
  if (delta === null) return null;
  if (Math.abs(delta) <= 3) return '→ ritmo estável';
  return delta < 0 ? `↑ ${Math.abs(delta)} s/km mais rápido` : `↓ ${delta} s/km mais lento`;
}

function formatDelta(value: number) {
  return Math.abs(value) >= 1000 ? (Math.abs(value) / 1000).toFixed(1) : String(Math.round(value));
}

function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}min` : `${minutes} min`;
}

function formatDistance(meters: number) {
  if (!meters) return '—';
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

function formatPace(secondsPerKm: number | null) {
  if (secondsPerKm === null) return '—';
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, '0')}/km`;
}
