import { useMemo, useState } from 'react';
import { addWorkoutHistoryRecord, loadWorkoutHistory } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanCardioSession, TitanPlan } from '../plan/types';
import { cardioZoneLabel, getTodayCardioSession } from './currentCardio';

type Props = { plan: TitanPlan | null; refreshKey?: number; onHistoryChange?: () => void; initialSessionId?: string | null; onCloseExecution?: () => void };
type RecentCardio = { id:string; title:string; completedAt:string; durationSeconds:number; distanceMeters:number; heartRate:number|null; pace:string|null };
type Summary = { title:string; durationSeconds:number; distanceMeters:number; zone:string; heartRate:number|null; pace:string|null; effort:string };
type GuideStep = { label:string; text:string };

export function CardioPage({ plan, refreshKey = 0, onHistoryChange, initialSessionId, onCloseExecution }: Props) {
  const today = useMemo(() => plan ? getTodayCardioSession(plan) : null, [plan]);
  const selected = useMemo(() => {
    if (!plan) return null;
    const schedule = plan.project?.cardioSchedule ?? [];
    return (initialSessionId ? schedule.find((item) => item.id === initialSessionId) : null) ?? today;
  }, [plan, initialSessionId, today]);
  const [sessionActive, setSessionActive] = useState(Boolean(initialSessionId && selected));
  const [duration, setDuration] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [effort, setEffort] = useState('5');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const history = useMemo(() => loadWorkoutHistory(), [refreshKey, summary]);
  const recent = useMemo<RecentCardio[]>(() => history.flatMap((record) => record.exercises
    .filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance')
    .map((exercise) => ({ id:`${record.id}:${exercise.exerciseId}`, title:exercise.name, completedAt:record.completedAt, durationSeconds:exercise.totalDurationSeconds, distanceMeters:exercise.totalDistanceMeters, heartRate:exercise.averageHeartRate, pace:exercise.sets.find((set)=>set.averagePace)?.averagePace ?? null })))
    .sort((a,b)=>b.completedAt.localeCompare(a.completedAt)).slice(0,5), [history]);

  const guidance = useMemo(() => selected ? buildGuidance(selected) : [], [selected]);
  const intensity = selected?.goal?.trim() || selected?.instructions?.find((item) => /RPE|esforço|intensidade/i.test(item)) || '';

  function reset() { setSessionActive(false); setDuration(''); setDistanceKm(''); setHeartRate(''); setEffort('5'); setNotes(''); setError(''); }
  function cancel() { reset(); onCloseExecution?.(); }

  function finish() {
    if (!selected) return;
    const durationSeconds = parseDuration(duration);
    if (durationSeconds < 1) { setError('Informe o tempo realizado pelo smartwatch. Ex.: 35:42.'); return; }
    const distanceMeters = Math.max(0, Number(distanceKm.replace(',', '.')) || 0) * 1000;
    const avgHeartRate = Math.max(0, Number(heartRate) || 0) || null;
    const speedKmh = distanceMeters > 0 ? (distanceMeters / 1000) / (durationSeconds / 3600) : null;
    const pace = distanceMeters > 0 ? paceFrom(durationSeconds, distanceMeters) : null;
    const zone = cardioZoneLabel(selected);
    const now = new Date().toISOString();
    const record: WorkoutHistoryRecord = {
      id:`cardio-${Date.now()}`, planId:plan?.id ?? 'cardio', planName:plan?.project?.name ?? plan?.name ?? 'TITAN FIT', workoutId:selected.id, workoutTitle:selected.title, workoutDay:selected.day,
      startedAt:new Date(Date.now()-durationSeconds*1000).toISOString(), completedAt:now, durationSeconds, totalSets:1, totalVolumeKg:0,
      exercises:[{ exerciseId:selected.id, name:selected.title, muscleGroup:'Cardio', exerciseType:distanceMeters>0?'distance':'cardio', sets:[{ setNumber:1, weightKg:null, repetitions:null, rir:null, durationSeconds, distanceMeters:distanceMeters||null, speedKmh, inclinePercent:null, averagePace:pace, averageHeartRate:avgHeartRate, calories:null, notes:[`Zona ${zone}`,`RPE ${effort}/10`,notes.trim()].filter(Boolean).join(' · ') }], volumeKg:0, bestWeightKg:null, totalDistanceMeters:distanceMeters, totalDurationSeconds:durationSeconds, bestSpeedKmh:speedKmh, bestInclinePercent:null, averageHeartRate:avgHeartRate }],
    };
    addWorkoutHistoryRecord(record);
    setSummary({ title:selected.title, durationSeconds, distanceMeters, zone, heartRate:avgHeartRate, pace, effort });
    setSessionActive(false); setError(''); onHistoryChange?.();
  }

  if (summary) return <section className="cardio-page"><header className="cardio-hero"><span className="eyebrow">CARDIO CONCLUÍDO</span><h2>Boa sessão.</h2><p>{summary.title}</p></header><section className="cardio-last-card"><div className="cardio-stats-grid"><div><span>Tempo</span><strong>{formatDuration(summary.durationSeconds)}</strong></div><div><span>Zona</span><strong>{summary.zone}</strong></div><div><span>Distância</span><strong>{formatDistance(summary.distanceMeters)}</strong></div><div><span aria-label="FC média">Frequência cardíaca média</span><strong>{summary.heartRate ? `${summary.heartRate} bpm` : '—'}</strong></div><div><span>Ritmo</span><strong>{summary.pace ?? '—'}</strong></div><div><span>Intensidade percebida</span><strong>{summary.effort}/10</strong></div></div><button type="button" className="primary-action" onClick={()=>{setSummary(null);reset();onCloseExecution?.();}}>Concluir</button></section></section>;

  if (sessionActive && selected) return <section className="cardio-page"><header className="cardio-hero"><span className="eyebrow">TREINO DE CARDIO</span><h2>{selected.title}</h2><p>{selected.day} · {selected.startTime} · previsto {selected.durationMinutes} min · {cardioZoneLabel(selected)}</p></header><section className="cardio-session-card"><div className="cardio-section-title"><div><span className="eyebrow">SESSÃO ORIENTADA</span><h3>{cardioZoneLabel(selected)}</h3></div></div>{intensity && <div className="cardio-intensity-card"><span>Intensidade percebida</span><strong>{intensity}</strong></div>}{guidance.length>0&&<div className="cardio-guide-list">{guidance.map((step)=><article key={`${step.label}-${step.text}`}><span>{step.label}</span><p>{step.text}</p></article>)}</div>}<div className="cardio-watch-note"><strong>Registre pelo smartwatch</strong><p>Faça o treino usando o relógio e, ao terminar, informe abaixo os dados registrados.</p></div><div className="cardio-input-grid"><label><span>Tempo realizado</span><input inputMode="numeric" value={duration} onChange={(event)=>setDuration(event.target.value)} placeholder="Ex.: 35:42" /></label><label><span>Distância (km)</span><input inputMode="decimal" value={distanceKm} onChange={(event)=>setDistanceKm(event.target.value)} placeholder="Ex.: 3,2" /></label><label><span aria-label="FC média">Frequência cardíaca média</span><input inputMode="numeric" value={heartRate} onChange={(event)=>setHeartRate(event.target.value)} placeholder="bpm" /></label><label><span>Intensidade percebida</span><select value={effort} onChange={(event)=>setEffort(event.target.value)}>{Array.from({length:10},(_,index)=>index+1).map((value)=><option key={value} value={value}>{value}/10</option>)}</select></label><label><span>Observações</span><input value={notes} onChange={(event)=>setNotes(event.target.value)} placeholder="Como foi a sessão?" /></label></div>{error&&<p className="cardio-form-error" role="alert">{error}</p>}<div className="cardio-session-actions"><button type="button" className="primary-action" onClick={finish}>Finalizar cardio</button><button type="button" className="text-action" onClick={cancel}>Cancelar</button></div></section></section>;

  return <section className="cardio-page"><header className="cardio-hero"><span className="eyebrow">CARDIO TITAN</span><h2>Condicionamento + 5 km</h2><p>Seu cardio programado começa pelo Dashboard. Aqui ficam o plano do dia e seu histórico de evolução.</p></header>{today?<section className="cardio-highlight-card"><div><span className="info-label">CARDIO DE HOJE</span><h3>{today.title}</h3><p>{today.startTime} · {today.durationMinutes} min · {cardioZoneLabel(today)}</p>{today.goal&&<p>{today.goal}</p>}</div><span className="cardio-pulse" aria-hidden="true">♡</span></section>:<section className="cardio-highlight-card"><div><span className="info-label">CARDIO DE HOJE</span><h3>Sem cardio programado</h3><p>Não há sessão de cardio prevista para hoje no projeto ativo.</p></div></section>}{recent.length>0&&<section className="cardio-section"><div className="cardio-section-title"><div><span className="eyebrow">HISTÓRICO</span><h3>Últimas sessões</h3></div></div><div className="cardio-history-list">{recent.map((item)=><article key={item.id}><div><strong>{item.title}</strong><span>{formatDate(item.completedAt)} · {item.heartRate?`${item.heartRate} bpm`:'FC —'}</span></div><span>{formatDuration(item.durationSeconds)} · {formatDistance(item.distanceMeters)}{item.pace?` · ${item.pace}`:''}</span></article>)}</div></section>}</section>;
}

function buildGuidance(session:TitanCardioSession):GuideStep[]{
  const raw=(session.instructions ?? []).filter((item)=>item.trim() && item.trim() !== session.goal?.trim()).join(' ');
  if(!raw)return[];
  const labels=['Aquecimento','Bloco principal','Recuperação','Desaquecimento'];
  const pattern=/(Aquecimento|Bloco principal|Recuperação|Desaquecimento):\s*/gi;
  const matches=[...raw.matchAll(pattern)];
  if(!matches.length)return[{label:'Orientação',text:raw}];
  return matches.map((match,index)=>{const start=(match.index ?? 0)+match[0].length;const end=matches[index+1]?.index ?? raw.length;const label=labels.find((item)=>item.toLowerCase()===match[1].toLowerCase()) ?? match[1];return{label,text:raw.slice(start,end).trim().replace(/[.\s]+$/,'.')};}).filter((step)=>step.text.length>1);
}
function parseDuration(value:string){const clean=value.trim();if(!clean)return 0;const parts=clean.split(':').map(Number);if(parts.some((item)=>!Number.isFinite(item)||item<0))return 0;if(parts.length===1)return Math.round(parts[0]*60);if(parts.length===2)return Math.round(parts[0]*60+parts[1]);if(parts.length===3)return Math.round(parts[0]*3600+parts[1]*60+parts[2]);return 0;}
function paceFrom(seconds:number, meters:number){const km=meters/1000;if(!km)return null;const s=Math.round(seconds/km);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}/km`;}
function formatDate(value:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(value));}
function formatDuration(seconds:number){if(!seconds)return'—';const m=Math.floor(seconds/60),s=seconds%60;return s?`${m}:${String(s).padStart(2,'0')} min`:`${m} min`;}
function formatDistance(meters:number){return !meters?'—':meters>=1000?`${(meters/1000).toFixed(2)} km`:`${Math.round(meters)} m`;}
