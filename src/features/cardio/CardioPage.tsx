import { useMemo } from 'react';
import { loadWorkoutHistory } from '../history/storage';
import type { TitanExercise, TitanPlan } from '../plan/types';

type Props = { plan: TitanPlan | null; refreshKey?: number };

type CardioItem = {
  id: string;
  day: string;
  title: string;
  durationMinutes: number | null;
  zone?: string;
  detail?: string;
};

export function CardioPage({ plan, refreshKey = 0 }: Props) {
  const history = useMemo(() => loadWorkoutHistory(), [refreshKey]);
  const planned = useMemo(() => buildPlannedCardio(plan), [plan]);
  const recent = useMemo(() => {
    return history.flatMap((record) => record.exercises
      .filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance')
      .map((exercise) => ({
        id: `${record.id}:${exercise.exerciseId}`,
        title: exercise.name,
        completedAt: record.completedAt,
        durationSeconds: exercise.totalDurationSeconds,
        distanceMeters: exercise.totalDistanceMeters,
        speedKmh: exercise.bestSpeedKmh,
        heartRate: exercise.averageHeartRate,
      })))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 5);
  }, [history]);

  const latest = recent[0] ?? null;

  return <section className="cardio-page">
    <header className="cardio-hero">
      <span className="eyebrow">CARDIO TITAN</span>
      <h2>Condicionamento + 5 km</h2>
      <p>Seu cardio fica separado da musculação, com foco em consistência, Zona 2 e evolução para os 5 km.</p>
    </header>

    <section className="cardio-highlight-card">
      <div>
        <span className="info-label">PRÓXIMA SESSÃO</span>
        {planned[0] ? <>
          <h3>{planned[0].title}</h3>
          <p>{planned[0].day}{planned[0].detail ? ` · ${planned[0].detail}` : ''}</p>
        </> : <>
          <h3>Nenhum cardio programado</h3>
          <p>Quando o projeto incluir cardio, a próxima sessão aparecerá aqui.</p>
        </>}
      </div>
      <span className="cardio-pulse" aria-hidden="true">♡</span>
    </section>

    {planned.length > 0 && <section className="cardio-section">
      <div className="cardio-section-title"><div><span className="eyebrow">PLANO ATUAL</span><h3>Sessões programadas</h3></div><strong>{planned.length}</strong></div>
      <div className="cardio-plan-list">
        {planned.map((item) => <article key={item.id} className="cardio-plan-card">
          <div><span className="cardio-day">{item.day}</span><h3>{item.title}</h3></div>
          <div className="cardio-meta-row">
            {item.durationMinutes !== null && <span><strong>{item.durationMinutes}</strong> min</span>}
            {item.zone && <span><strong>{item.zone}</strong></span>}
          </div>
          {item.detail && <p>{item.detail}</p>}
        </article>)}
      </div>
    </section>}

    <section className="cardio-section">
      <div className="cardio-section-title"><div><span className="eyebrow">DESEMPENHO</span><h3>Último cardio</h3></div></div>
      {latest ? <article className="cardio-last-card">
        <div className="cardio-last-header"><div><span>{formatDate(latest.completedAt)}</span><h3>{latest.title}</h3></div></div>
        <div className="cardio-stats-grid">
          <div><span>Tempo</span><strong>{formatDuration(latest.durationSeconds)}</strong></div>
          <div><span>Distância</span><strong>{formatDistance(latest.distanceMeters)}</strong></div>
          <div><span>Velocidade</span><strong>{latest.speedKmh ? `${latest.speedKmh.toFixed(1)} km/h` : '—'}</strong></div>
          <div><span>FC média</span><strong>{latest.heartRate ? `${latest.heartRate} bpm` : '—'}</strong></div>
        </div>
      </article> : <div className="cardio-empty"><strong>Sem cardio registrado ainda</strong><p>Depois da primeira sessão concluída, o seu desempenho mais recente aparecerá aqui.</p></div>}
    </section>

    {recent.length > 1 && <section className="cardio-section">
      <div className="cardio-section-title"><div><span className="eyebrow">HISTÓRICO</span><h3>Últimas sessões</h3></div></div>
      <div className="cardio-history-list">{recent.slice(1).map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{formatDate(item.completedAt)}</span></div><span>{formatDuration(item.durationSeconds)} · {formatDistance(item.distanceMeters)}</span></article>)}</div>
    </section>}
  </section>;
}

function buildPlannedCardio(plan: TitanPlan | null): CardioItem[] {
  if (!plan) return [];
  const schedule = plan.project?.cardioSchedule?.map((session) => ({
    id: session.id,
    day: session.day,
    title: session.title,
    durationMinutes: session.durationMinutes,
    zone: session.type === 'zone2' ? 'Zona 2' : session.type === 'hiit' ? 'HIIT' : undefined,
    detail: session.goal ?? session.phase,
  })) ?? [];

  const embedded = plan.workouts.flatMap((workout) => workout.exercises
    .filter((exercise) => isCardio(exercise))
    .map((exercise) => ({
      id: `${workout.id}:${exercise.id}`,
      day: workout.day,
      title: exercise.name,
      durationMinutes: exercise.durationSeconds ? Math.round(exercise.durationSeconds / 60) : null,
      zone: exercise.cardioZone,
      detail: buildExerciseDetail(exercise),
    })));

  const seen = new Set<string>();
  return [...schedule, ...embedded].filter((item) => {
    const key = `${item.day}:${item.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isCardio(exercise: TitanExercise) { return exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance'; }
function buildExerciseDetail(exercise: TitanExercise) {
  const parts: string[] = [];
  if (exercise.speedKmh) parts.push(`${exercise.speedKmh} km/h`);
  if (exercise.inclinePercent !== undefined) parts.push(`${exercise.inclinePercent}% inclinação`);
  return parts.join(' · ') || exercise.notes;
}
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)); }
function formatDuration(seconds: number) { if (!seconds) return '—'; const minutes = Math.round(seconds / 60); return `${minutes} min`; }
function formatDistance(meters: number) { if (!meters) return '—'; return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`; }
