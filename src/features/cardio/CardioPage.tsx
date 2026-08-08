import { useEffect, useMemo, useState } from 'react';
import { addWorkoutHistoryRecord, loadWorkoutHistory } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanExercise, TitanPlan } from '../plan/types';

type Props = { plan: TitanPlan | null; refreshKey?: number; onHistoryChange?: () => void };
type CardioMode = 'zone2' | 'run' | 'walk' | 'hiit';
type CardioItem = { id: string; day: string; title: string; durationMinutes: number | null; zone?: string; detail?: string; };
type RecentCardio = { id: string; title: string; completedAt: string; durationSeconds: number; distanceMeters: number; speedKmh: number | null; heartRate: number | null; pace: string | null; };
type TrendStatus = 'improved' | 'stable' | 'declined' | 'baseline';
type CardioTrend = { status: TrendStatus; label: string; message: string; durationDelta: number | null; distanceDelta: number | null; paceDelta: number | null; heartRateDelta: number | null; };

export function CardioPage({ plan, refreshKey = 0, onHistoryChange }: Props) {
  const [localRefresh, setLocalRefresh] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [mode, setMode] = useState<CardioMode>('zone2');
  const [distanceKm, setDistanceKm] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [effort, setEffort] = useState('5');
  const [notes, setNotes] = useState('');
  const history = useMemo(() => loadWorkoutHistory(), [refreshKey, localRefresh]);
  const planned = useMemo(() => buildPlannedCardio(plan), [plan]);

  useEffect(() => {
    if (!running || !startedAt) return;
    const update = () => setElapsedSeconds(pausedSeconds + Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [running, startedAt, pausedSeconds]);

  const recent = useMemo<RecentCardio[]>(() => history.flatMap((record) => record.exercises
    .filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance')
    .map((exercise) => ({ id: `${record.id}:${exercise.exerciseId}`, title: exercise.name, completedAt: record.completedAt, durationSeconds: exercise.totalDurationSeconds, distanceMeters: exercise.totalDistanceMeters, speedKmh: exercise.bestSpeedKmh, heartRate: exercise.averageHeartRate, pace: exercise.sets.find((set) => set.averagePace)?.averagePace ?? null })))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 12), [history]);
  const latest = recent[0] ?? null;
  const previousSameMode = latest ? recent.slice(1).find((item) => item.title === latest.title) ?? null : null;
  const trend = latest ? buildCardioTrend(latest, previousSameMode) : null;

  function startCardio() { setSessionActive(true); setRunning(true); setPausedSeconds(0); setElapsedSeconds(0); setStartedAt(new Date().toISOString()); }
  function pauseCardio() { setPausedSeconds(elapsedSeconds); setRunning(false); setStartedAt(null); }
  function resumeCardio() { setStartedAt(new Date().toISOString()); setRunning(true); }
  function cancelCardio() { if (elapsedSeconds > 10 && !window.confirm('Cancelar esta sessão de cardio? O registro atual será descartado.')) return; resetSession(); }
  function resetSession() { setSessionActive(false); setRunning(false); setStartedAt(null); setElapsedSeconds(0); setPausedSeconds(0); setDistanceKm(''); setHeartRate(''); setEffort('5'); setNotes(''); }

  function finishCardio() {
    if (!sessionActive || elapsedSeconds < 1) return;
    const distanceMeters = Math.max(0, Number(distanceKm.replace(',', '.')) || 0) * 1000;
    const avgHeartRate = Math.max(0, Number(heartRate) || 0) || null;
    const speedKmh = distanceMeters > 0 ? (distanceMeters / 1000) / (elapsedSeconds / 3600) : null;
    const pace = distanceMeters > 0 ? paceFrom(elapsedSeconds, distanceMeters) : null;
    const title = modeLabel(mode);
    const now = new Date().toISOString();
    const record: WorkoutHistoryRecord = {
      id: `cardio-${Date.now()}`,
      planId: plan?.id ?? 'cardio-manual',
      planName: plan?.project?.name ?? plan?.name ?? 'TITAN FIT',
      workoutId: `cardio-${mode}`,
      workoutTitle: title,
      workoutDay: new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date()),
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      completedAt: now,
      durationSeconds: elapsedSeconds,
      totalSets: 1,
      totalVolumeKg: 0,
      exercises: [{ exerciseId: `cardio-${mode}`, name: title, muscleGroup: 'Cardio', exerciseType: distanceMeters > 0 ? 'distance' : 'cardio', sets: [{ setNumber: 1, weightKg: null, repetitions: null, rir: null, durationSeconds: elapsedSeconds, distanceMeters: distanceMeters || null, speedKmh, inclinePercent: null, averagePace: pace, averageHeartRate: avgHeartRate, calories: null, notes: [`RPE ${effort}/10`, notes.trim()].filter(Boolean).join(' · ') }], volumeKg: 0, bestWeightKg: null, totalDistanceMeters: distanceMeters, totalDurationSeconds: elapsedSeconds, bestSpeedKmh: speedKmh, bestInclinePercent: null, averageHeartRate: avgHeartRate }],
    };
    addWorkoutHistoryRecord(record);
    resetSession();
    setLocalRefresh((value) => value + 1);
    onHistoryChange?.();
    window.alert('Cardio salvo com sucesso.');
  }

  return <section className="cardio-page">
    <header className="cardio-hero"><span className="eyebrow">CARDIO TITAN</span><h2>Condicionamento + 5 km</h2><p>Registre Zona 2, caminhada, corrida ou HIIT e acompanhe sua evolução sem misturar com a musculação.</p></header>

    <section className="cardio-session-card" aria-label="Sessão de cardio">
      <div className="cardio-section-title"><div><span className="eyebrow">SESSÃO ATUAL</span><h3>{sessionActive ? modeLabel(mode) : 'Pronto para começar'}</h3></div><strong>{formatClock(elapsedSeconds)}</strong></div>
      {!sessionActive ? <><div className="cardio-mode-grid">{(['zone2','walk','run','hiit'] as CardioMode[]).map((item) => <button type="button" key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{modeLabel(item)}</button>)}</div><button type="button" className="primary-action" onClick={startCardio}>Iniciar cardio</button></> : <><div className="cardio-live-timer">{formatClock(elapsedSeconds)}</div><div className="cardio-input-grid"><label><span>Distância (km)</span><input inputMode="decimal" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} placeholder="Ex.: 3,2" /></label><label><span>FC média</span><input inputMode="numeric" value={heartRate} onChange={(event) => setHeartRate(event.target.value)} placeholder="bpm" /></label><label><span>Esforço percebido</span><select value={effort} onChange={(event) => setEffort(event.target.value)}>{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}/10</option>)}</select></label><label><span>Observações</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Como foi a sessão?" /></label></div><div className="cardio-session-actions">{running ? <button type="button" className="secondary-action" onClick={pauseCardio}>Pausar</button> : <button type="button" className="secondary-action" onClick={resumeCardio}>Continuar</button>}<button type="button" className="primary-action" onClick={finishCardio}>Finalizar e salvar</button><button type="button" className="text-action" onClick={cancelCardio}>Cancelar</button></div></>}
    </section>

    <section className="cardio-highlight-card"><div><span className="info-label">PRÓXIMA SESSÃO</span>{planned[0] ? <><h3>{planned[0].title}</h3><p>{planned[0].day}{planned[0].durationMinutes ? ` · ${planned[0].durationMinutes} min` : ''}{planned[0].zone ? ` · ${planned[0].zone}` : ''}</p></> : <><h3>Cardio livre</h3><p>Você pode registrar uma sessão manual mesmo sem cardio programado no projeto.</p></>}</div><span className="cardio-pulse" aria-hidden="true">♡</span></section>

    {latest && trend && <section className="cardio-section cardio-evolution-section"><div className="cardio-section-title"><div><span className="eyebrow">EVOLUÇÃO</span><h3>Comparativo da modalidade</h3></div><span className={`cardio-trend-badge trend-${trend.status}`}>{trend.label}</span></div><article className="cardio-evolution-card"><div className="cardio-evolution-head"><div><small>{latest.title}</small><strong>{trend.message}</strong></div><span>{previousSameMode ? `${formatDate(previousSameMode.completedAt)} → ${formatDate(latest.completedAt)}` : 'Primeira referência'}</span></div><div className="cardio-delta-grid"><Delta label="Tempo" value={formatSecondsDelta(trend.durationDelta)} /><Delta label="Distância" value={formatDistanceDelta(trend.distanceDelta)} /><Delta label="Ritmo" value={formatPaceDelta(trend.paceDelta)} goodWhenNegative /><Delta label="FC média" value={formatHeartRateDelta(trend.heartRateDelta)} neutral /></div></article></section>}

    {latest && <section className="cardio-section"><div className="cardio-section-title"><div><span className="eyebrow">DESEMPENHO</span><h3>Último cardio</h3></div></div><article className="cardio-last-card"><div className="cardio-last-header"><div><span>{formatDate(latest.completedAt)}</span><h3>{latest.title}</h3></div></div><div className="cardio-stats-grid"><div><span>Tempo</span><strong>{formatDuration(latest.durationSeconds)}</strong></div><div><span>Distância</span><strong>{formatDistance(latest.distanceMeters)}</strong></div><div><span>Ritmo</span><strong>{latest.pace ?? '—'}</strong></div><div><span>FC média</span><strong>{latest.heartRate ? `${latest.heartRate} bpm` : '—'}</strong></div></div></article></section>}

    {recent.length > 1 && <section className="cardio-section"><div className="cardio-section-title"><div><span className="eyebrow">ÚLTIMAS 5</span><h3>Sessões recentes</h3></div></div><div className="cardio-history-list">{recent.slice(0, 5).map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{formatDate(item.completedAt)} · {item.heartRate ? `${item.heartRate} bpm` : 'FC —'}</span></div><span>{formatDuration(item.durationSeconds)} · {formatDistance(item.distanceMeters)}{item.pace ? ` · ${item.pace}` : ''}</span></article>)}</div></section>}
  </section>;
}

function Delta({ label, value, goodWhenNegative = false, neutral = false }: { label: string; value: { text: string; numeric: number | null }; goodWhenNegative?: boolean; neutral?: boolean }) { const direction = value.numeric === null || value.numeric === 0 || neutral ? 'neutral' : (goodWhenNegative ? value.numeric < 0 : value.numeric > 0) ? 'positive' : 'negative'; return <div className={`cardio-delta delta-${direction}`}><span>{label}</span><strong>{value.text}</strong></div>; }
function buildCardioTrend(latest: RecentCardio, previous: RecentCardio | null): CardioTrend { if (!previous) return { status: 'baseline', label: 'CRIANDO BASE', message: 'Primeira referência dessa modalidade.', durationDelta: null, distanceDelta: null, paceDelta: null, heartRateDelta: null }; const durationDelta = latest.durationSeconds - previous.durationSeconds; const distanceDelta = latest.distanceMeters && previous.distanceMeters ? latest.distanceMeters - previous.distanceMeters : null; const latestPace = paceToSeconds(latest.pace); const previousPace = paceToSeconds(previous.pace); const paceDelta = latestPace !== null && previousPace !== null ? latestPace - previousPace : null; const heartRateDelta = latest.heartRate !== null && previous.heartRate !== null ? latest.heartRate - previous.heartRate : null; let score = 0; if (paceDelta !== null) score += paceDelta <= -3 ? 2 : paceDelta >= 3 ? -2 : 0; if (distanceDelta !== null) score += distanceDelta >= 100 ? 1 : distanceDelta <= -100 ? -1 : 0; const status: TrendStatus = score >= 2 ? 'improved' : score <= -2 ? 'declined' : 'stable'; const label = status === 'improved' ? 'EVOLUINDO' : status === 'declined' ? 'REVISAR' : 'ESTÁVEL'; const message = status === 'improved' ? 'Você melhorou em relação à sessão anterior do mesmo tipo.' : status === 'declined' ? 'O desempenho ficou abaixo da referência anterior.' : 'A sessão ficou próxima da referência anterior.'; return { status, label, message, durationDelta, distanceDelta, paceDelta, heartRateDelta }; }
function paceToSeconds(value: string | null) { if (!value) return null; const match = value.match(/(\d+):(\d+)/); if (!match) return null; return Number(match[1]) * 60 + Number(match[2]); }
function buildPlannedCardio(plan: TitanPlan | null): CardioItem[] { if (!plan) return []; const schedule = plan.project?.cardioSchedule?.map((session) => ({ id: session.id, day: session.day, title: session.title, durationMinutes: session.durationMinutes, zone: session.type === 'zone2' ? 'Zona 2' : session.type === 'hiit' ? 'HIIT' : undefined, detail: session.goal ?? session.phase })) ?? []; const embedded = plan.workouts.flatMap((workout) => workout.exercises.filter((exercise) => isCardio(exercise)).map((exercise) => ({ id: `${workout.id}:${exercise.id}`, day: workout.day, title: exercise.name, durationMinutes: exercise.durationSeconds ? Math.round(exercise.durationSeconds / 60) : null, zone: exercise.cardioZone, detail: buildExerciseDetail(exercise) }))); const seen = new Set<string>(); return [...schedule, ...embedded].filter((item) => { const key = `${item.day}:${item.title}`.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }); }
function isCardio(exercise: TitanExercise) { return exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance'; }
function buildExerciseDetail(exercise: TitanExercise) { const parts: string[] = []; if (exercise.speedKmh) parts.push(`${exercise.speedKmh} km/h`); if (exercise.inclinePercent !== undefined) parts.push(`${exercise.inclinePercent}% inclinação`); return parts.join(' · ') || exercise.notes; }
function modeLabel(mode: CardioMode) { return mode === 'zone2' ? 'Zona 2' : mode === 'walk' ? 'Caminhada' : mode === 'run' ? 'Corrida' : 'HIIT'; }
function paceFrom(seconds: number, meters: number) { const km = meters / 1000; if (!km) return null; const secondsPerKm = Math.round(seconds / km); return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, '0')}/km`; }
function formatClock(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const secs = seconds % 60; return hours > 0 ? `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)); }
function formatDuration(seconds: number) { if (!seconds) return '—'; return `${Math.round(seconds / 60)} min`; }
function formatDistance(meters: number) { if (!meters) return '—'; return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`; }
function signed(value: number) { return value > 0 ? `+${value}` : `${value}`; }
function formatSecondsDelta(value: number | null) { return { numeric: value, text: value === null ? '—' : `${signed(Math.round(value / 60))} min` }; }
function formatDistanceDelta(value: number | null) { return { numeric: value, text: value === null ? '—' : `${value >= 0 ? '+' : ''}${(value / 1000).toFixed(2)} km` }; }
function formatPaceDelta(value: number | null) { return { numeric: value, text: value === null ? '—' : `${value > 0 ? '+' : ''}${value} s/km` }; }
function formatHeartRateDelta(value: number | null) { return { numeric: value, text: value === null ? '—' : `${value > 0 ? '+' : ''}${value} bpm` }; }
