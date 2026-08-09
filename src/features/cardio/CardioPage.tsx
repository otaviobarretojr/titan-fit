import { useEffect, useMemo, useState } from 'react';
import { addWorkoutHistoryRecord, loadWorkoutHistory } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanCardioSession, TitanPlan } from '../plan/types';
import { cardioZoneLabel, getTodayCardioSession } from './currentCardio';

type Props = { plan: TitanPlan | null; refreshKey?: number; onHistoryChange?: () => void; initialSessionId?: string | null; onCloseExecution?: () => void };
type RecentCardio = { id:string; title:string; completedAt:string; durationSeconds:number; distanceMeters:number; heartRate:number|null; pace:string|null };
type Summary = { title:string; durationSeconds:number; distanceMeters:number; zone:string; heartRate:number|null; pace:string|null; effort:string };

export function CardioPage({ plan, refreshKey = 0, onHistoryChange, initialSessionId, onCloseExecution }: Props) {
  const today = useMemo(() => plan ? getTodayCardioSession(plan) : null, [plan]);
  const selected = useMemo(() => {
    if (!plan) return null;
    const schedule = plan.project?.cardioSchedule ?? [];
    return (initialSessionId ? schedule.find((item) => item.id === initialSessionId) : null) ?? today;
  }, [plan, initialSessionId, today]);
  const [sessionActive, setSessionActive] = useState(Boolean(initialSessionId && selected));
  const [running, setRunning] = useState(Boolean(initialSessionId && selected));
  const [startedAt, setStartedAt] = useState<string | null>(() => initialSessionId && selected ? new Date().toISOString() : null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [effort, setEffort] = useState('5');
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const history = useMemo(() => loadWorkoutHistory(), [refreshKey, summary]);
  const recent = useMemo<RecentCardio[]>(() => history.flatMap((record) => record.exercises
    .filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance')
    .map((exercise) => ({ id:`${record.id}:${exercise.exerciseId}`, title:exercise.name, completedAt:record.completedAt, durationSeconds:exercise.totalDurationSeconds, distanceMeters:exercise.totalDistanceMeters, heartRate:exercise.averageHeartRate, pace:exercise.sets.find((set)=>set.averagePace)?.averagePace ?? null })))
    .sort((a,b)=>b.completedAt.localeCompare(a.completedAt)).slice(0,5), [history]);

  useEffect(() => {
    if (!initialSessionId || !selected) return;
    setSessionActive(true); setRunning(true); setStartedAt(new Date().toISOString()); setElapsedSeconds(0); setPausedSeconds(0); setSummary(null);
  }, [initialSessionId, selected?.id]);

  useEffect(() => {
    if (!running || !startedAt) return;
    const update = () => setElapsedSeconds(pausedSeconds + Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    update(); const timer = window.setInterval(update, 1000); return () => window.clearInterval(timer);
  }, [running, startedAt, pausedSeconds]);

  function pause() { setPausedSeconds(elapsedSeconds); setRunning(false); setStartedAt(null); }
  function resume() { setStartedAt(new Date().toISOString()); setRunning(true); }
  function cancel() { if (elapsedSeconds > 10 && !window.confirm('Cancelar esta sessão de cardio? O registro atual será descartado.')) return; reset(); onCloseExecution?.(); }
  function reset() { setSessionActive(false); setRunning(false); setStartedAt(null); setElapsedSeconds(0); setPausedSeconds(0); setDistanceKm(''); setHeartRate(''); setEffort('5'); setNotes(''); }

  function finish() {
    if (!selected || elapsedSeconds < 1) return;
    const distanceMeters = Math.max(0, Number(distanceKm.replace(',', '.')) || 0) * 1000;
    const avgHeartRate = Math.max(0, Number(heartRate) || 0) || null;
    const speedKmh = distanceMeters > 0 ? (distanceMeters / 1000) / (elapsedSeconds / 3600) : null;
    const pace = distanceMeters > 0 ? paceFrom(elapsedSeconds, distanceMeters) : null;
    const zone = cardioZoneLabel(selected);
    const now = new Date().toISOString();
    const record: WorkoutHistoryRecord = {
      id:`cardio-${Date.now()}`, planId:plan?.id ?? 'cardio', planName:plan?.project?.name ?? plan?.name ?? 'TITAN FIT', workoutId:selected.id, workoutTitle:selected.title, workoutDay:selected.day,
      startedAt:new Date(Date.now()-elapsedSeconds*1000).toISOString(), completedAt:now, durationSeconds:elapsedSeconds, totalSets:1, totalVolumeKg:0,
      exercises:[{ exerciseId:selected.id, name:selected.title, muscleGroup:'Cardio', exerciseType:distanceMeters>0?'distance':'cardio', sets:[{ setNumber:1, weightKg:null, repetitions:null, rir:null, durationSeconds:elapsedSeconds, distanceMeters:distanceMeters||null, speedKmh, inclinePercent:null, averagePace:pace, averageHeartRate:avgHeartRate, calories:null, notes:[`Zona ${zone}`,`RPE ${effort}/10`,notes.trim()].filter(Boolean).join(' · ') }], volumeKg:0, bestWeightKg:null, totalDistanceMeters:distanceMeters, totalDurationSeconds:elapsedSeconds, bestSpeedKmh:speedKmh, bestInclinePercent:null, averageHeartRate:avgHeartRate }],
    };
    addWorkoutHistoryRecord(record);
    setSummary({ title:selected.title, durationSeconds:elapsedSeconds, distanceMeters, zone, heartRate:avgHeartRate, pace, effort });
    setSessionActive(false); setRunning(false); setStartedAt(null); setPausedSeconds(0);
    onHistoryChange?.();
  }

  if (summary) return <section className="cardio-page"><header className="cardio-hero"><span className="eyebrow">CARDIO CONCLUÍDO</span><h2>Boa sessão.</h2><p>{summary.title}</p></header><section className="cardio-last-card"><div className="cardio-stats-grid"><div><span>Tempo</span><strong>{formatDuration(summary.durationSeconds)}</strong></div><div><span>Zona</span><strong>{summary.zone}</strong></div><div><span>Distância</span><strong>{formatDistance(summary.distanceMeters)}</strong></div><div><span>FC média</span><strong>{summary.heartRate ? `${summary.heartRate} bpm` : '—'}</strong></div><div><span>Ritmo</span><strong>{summary.pace ?? '—'}</strong></div><div><span>Esforço</span><strong>{summary.effort}/10</strong></div></div><button type="button" className="primary-action" onClick={()=>{setSummary(null);reset();onCloseExecution?.();}}>Concluir</button></section></section>;

  if (sessionActive && selected) return <section className="cardio-page"><header className="cardio-hero"><span className="eyebrow">TREINO DE CARDIO</span><h2>{selected.title}</h2><p>{selected.day} · {selected.startTime} · {selected.durationMinutes} min · {cardioZoneLabel(selected)}</p></header><section className="cardio-session-card"><div className="cardio-section-title"><div><span className="eyebrow">SESSÃO EM ANDAMENTO</span><h3>{cardioZoneLabel(selected)}</h3></div><strong>{formatClock(elapsedSeconds)}</strong></div>{selected.goal && <p>{selected.goal}</p>}{selected.instructions?.length ? <ul>{selected.instructions.map((item)=><li key={item}>{item}</li>)}</ul> : null}<div className="cardio-live-timer">{formatClock(elapsedSeconds)}</div><div className="cardio-input-grid"><label><span>Distância (km)</span><input inputMode="decimal" value={distanceKm} onChange={(event)=>setDistanceKm(event.target.value)} placeholder="Ex.: 3,2" /></label><label><span>FC média</span><input inputMode="numeric" value={heartRate} onChange={(event)=>setHeartRate(event.target.value)} placeholder="bpm" /></label><label><span>Esforço percebido</span><select value={effort} onChange={(event)=>setEffort(event.target.value)}>{Array.from({length:10},(_,index)=>index+1).map((value)=><option key={value} value={value}>{value}/10</option>)}</select></label><label><span>Observações</span><input value={notes} onChange={(event)=>setNotes(event.target.value)} placeholder="Como foi a sessão?" /></label></div><div className="cardio-session-actions">{running?<button type="button" className="secondary-action" onClick={pause}>Pausar</button>:<button type="button" className="secondary-action" onClick={resume}>Continuar</button>}<button type="button" className="primary-action" onClick={finish}>Finalizar cardio</button><button type="button" className="text-action" onClick={cancel}>Cancelar</button></div></section></section>;

  return <section className="cardio-page"><header className="cardio-hero"><span className="eyebrow">CARDIO TITAN</span><h2>Condicionamento + 5 km</h2><p>Seu cardio programado começa pelo Dashboard. Aqui ficam o plano do dia e seu histórico de evolução.</p></header>{today?<section className="cardio-highlight-card"><div><span className="info-label">CARDIO DE HOJE</span><h3>{today.title}</h3><p>{today.startTime} · {today.durationMinutes} min · {cardioZoneLabel(today)}</p>{today.goal&&<p>{today.goal}</p>}</div><span className="cardio-pulse" aria-hidden="true">♡</span></section>:<section className="cardio-highlight-card"><div><span className="info-label">CARDIO DE HOJE</span><h3>Sem cardio programado</h3><p>Não há sessão de cardio prevista para hoje no projeto ativo.</p></div></section>}{recent.length>0&&<section className="cardio-section"><div className="cardio-section-title"><div><span className="eyebrow">HISTÓRICO</span><h3>Últimas sessões</h3></div></div><div className="cardio-history-list">{recent.map((item)=><article key={item.id}><div><strong>{item.title}</strong><span>{formatDate(item.completedAt)} · {item.heartRate?`${item.heartRate} bpm`:'FC —'}</span></div><span>{formatDuration(item.durationSeconds)} · {formatDistance(item.distanceMeters)}{item.pace?` · ${item.pace}`:''}</span></article>)}</div></section>}</section>;
}

function paceFrom(seconds:number, meters:number){const km=meters/1000;if(!km)return null;const s=Math.round(seconds/km);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}/km`;}
function formatClock(seconds:number){const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function formatDate(value:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(value));}
function formatDuration(seconds:number){return seconds?`${Math.round(seconds/60)} min`:'—';}
function formatDistance(meters:number){return !meters?'—':meters>=1000?`${(meters/1000).toFixed(2)} km`:`${Math.round(meters)} m`;}
