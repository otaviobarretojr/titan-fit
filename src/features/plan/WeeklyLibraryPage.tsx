import { useEffect, useMemo, useState } from 'react';
import { getExerciseVideo } from '../exercise-library/videos';
import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import { loadWorkoutHistory } from '../history/storage';
import type { HistoryExercise } from '../history/types';
import type { ExerciseType, TitanExercise, TitanPlan } from './types';

type Props = { plan: TitanPlan | null };
type LibraryView = 'week' | 'exercises';

export function WeeklyLibraryPage({ plan }: Props) {
  const [view, setView] = useState<LibraryView>('week');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');

  const workout = useMemo(() => {
    if (!plan || !selectedWorkoutId) return null;
    return plan.workouts.find((item) => item.id === selectedWorkoutId) ?? null;
  }, [plan, selectedWorkoutId]);

  const allExercises = useMemo(() => {
    if (!plan) return [];
    const byId = new Map<string, TitanExercise>();
    plan.workouts.forEach((item) => item.exercises.forEach((exercise) => {
      if (!byId.has(exercise.id)) byId.set(exercise.id, exercise);
    }));
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [plan]);

  const muscleGroups = useMemo(() => ['Todos', ...new Set(allExercises.map((item) => canonicalMuscleGroup(item.muscleGroup)))], [allExercises]);
  const filteredExercises = useMemo(() => {
    const normalizedQuery = normalize(query);
    return allExercises.filter((item) => {
      const group = canonicalMuscleGroup(item.muscleGroup);
      const matchesGroup = muscleFilter === 'Todos' || group === muscleFilter;
      const matchesQuery = !normalizedQuery || normalize(`${item.name} ${item.muscleGroup}`).includes(normalizedQuery);
      return matchesGroup && matchesQuery;
    });
  }, [allExercises, muscleFilter, query]);

  const selectedExercise = useMemo(() => {
    if (!selectedExerciseId) return null;
    if (view === 'week' && workout) return workout.exercises.find((item) => item.id === selectedExerciseId) ?? null;
    return allExercises.find((item) => item.id === selectedExerciseId) ?? null;
  }, [allExercises, selectedExerciseId, view, workout]);

  useEffect(() => {
    if (!selectedExercise) return;
    const previousOverflow = document.body.style.overflow;
    const marker = `exercise-sheet:${selectedExercise.id}:${Date.now()}`;
    document.body.style.overflow = 'hidden';
    window.history.pushState({ ...window.history.state, titanExerciseSheet: marker }, '');

    const closeFromHistory = () => setSelectedExerciseId(null);
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') window.history.back();
    };
    window.addEventListener('popstate', closeFromHistory);
    window.addEventListener('keydown', closeFromEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('popstate', closeFromHistory);
      window.removeEventListener('keydown', closeFromEscape);
    };
  }, [selectedExercise]);

  function switchView(nextView: LibraryView) {
    setSelectedExerciseId(null);
    setView(nextView);
  }

  function closeExercise() {
    if (window.history.state?.titanExerciseSheet) window.history.back();
    else setSelectedExerciseId(null);
  }

  if (!plan) return <section className="hero-card compact"><span className="eyebrow">SEMANA TITAN</span><h2>Importe seu projeto</h2><p>Depois da importação, os grupos da semana e a biblioteca de exercícios aparecem aqui.</p></section>;

  return <section className="weekly-library-page">
    <div className="library-view-switch" role="tablist" aria-label="Semana e biblioteca de exercícios">
      <button type="button" role="tab" aria-selected={view === 'week'} className={view === 'week' ? 'active' : ''} onClick={() => switchView('week')}>Semana</button>
      <button type="button" role="tab" aria-selected={view === 'exercises'} className={view === 'exercises' ? 'active' : ''} onClick={() => switchView('exercises')}>Exercícios</button>
    </div>

    {view === 'week' ? <>
      <header className="hero-card compact"><span className="eyebrow">SEMANA TITAN</span><h2>Grupos e exercícios</h2><p>Escolha um dia para consultar os exercícios, vídeos e dicas de execução.</p></header>
      <div className="week-tabs" role="tablist" aria-label="Treinos da semana">
        {plan.workouts.map((item) => <button key={item.id} type="button" role="tab" aria-selected={item.id === selectedWorkoutId} className={item.id === selectedWorkoutId ? 'active' : ''} onClick={() => { setSelectedWorkoutId(item.id); setSelectedExerciseId(null); }}><strong>{capitalize(item.day)}</strong><span>{shortTitle(item.title)}</span></button>)}
      </div>

      {!workout && <section className="week-empty-state"><strong>Selecione um dia</strong><p>Nenhum treino fica pré-selecionado. Toque em um bloco acima para visualizar os exercícios daquele dia.</p></section>}

      {workout && <>
        <section className="weekly-workout-card"><span className="info-label">{capitalize(workout.day)}</span><h3>{workout.title}</h3>{workout.focus && <p>{workout.focus}</p>}<strong>{workout.exercises.length} exercícios</strong></section>
        <div className="weekly-exercise-list">
          {workout.exercises.map((item, index) => <button type="button" key={`${workout.id}:${item.id}`} className="weekly-exercise-row" onClick={() => setSelectedExerciseId(item.id)}><span className="exercise-order">{index + 1}</span><span><strong>{item.name}</strong><small>{item.muscleGroup} · {typeLabel(item.exerciseType ?? 'strength')}</small></span><span aria-hidden="true">›</span></button>)}
        </div>
      </>}
    </> : <>
      <header className="hero-card compact exercise-library-hero"><span className="eyebrow">BIBLIOTECA TITAN · v0.28.2</span><h2>Exercícios</h2><p>Consulte execução, vídeo, alternativas e seu desempenho sem precisar iniciar um treino.</p></header>
      <div className="exercise-library-tools">
        <label className="exercise-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar exercício" aria-label="Buscar exercício" /></label>
        <div className="muscle-filter-strip" aria-label="Filtrar por grupo muscular">{muscleGroups.map((group) => <button key={group} type="button" className={muscleFilter === group ? 'active' : ''} aria-pressed={muscleFilter === group} onClick={() => setMuscleFilter(group)}>{group}</button>)}</div>
      </div>
      <div className="exercise-library-count"><strong>{filteredExercises.length}</strong><span>exercício{filteredExercises.length === 1 ? '' : 's'}</span></div>
      <div className="exercise-library-grid">
        {filteredExercises.map((item) => <button type="button" className="exercise-library-row" key={item.id} onClick={() => setSelectedExerciseId(item.id)}>
          <span className="exercise-library-muscle">{muscleIcon(canonicalMuscleGroup(item.muscleGroup))}</span>
          <span><strong>{item.name}</strong><small>{canonicalMuscleGroup(item.muscleGroup)} · {typeLabel(item.exerciseType ?? 'strength')}</small></span>
          <span className="exercise-library-chevron" aria-hidden="true">›</span>
        </button>)}
        {!filteredExercises.length && <section className="hero-card compact"><span className="eyebrow">SEM RESULTADOS</span><h2>Nenhum exercício encontrado</h2><p>Tente outro nome ou selecione outro grupo muscular.</p></section>}
      </div>
    </>}

    {selectedExercise && <ExerciseSheet exercise={selectedExercise} onClose={closeExercise} />}
  </section>;
}

function ExerciseSheet({ exercise, onClose }: { exercise: TitanExercise; onClose: () => void }) {
  const type = exercise.exerciseType ?? 'strength';
  const video = type === 'cardio' ? null : getExerciseVideo(exercise);
  const history = loadWorkoutHistory();
  const allSessions = getExerciseSessions(history, exercise.id);
  const recentSessions = allSessions.slice(0, 3);
  const latest = recentSessions[0] ?? null;
  const pr = type === 'strength' ? buildValidPr(allSessions) : null;
  const advice = type === 'strength' ? getProgressionAdvice(history, exercise.id) : null;

  return <div className="exercise-sheet-backdrop" role="presentation">
    <article className="exercise-sheet" role="dialog" aria-modal="true" aria-label={`Detalhes de ${exercise.name}`}>
      <header className="sheet-header">
        <div><span className="info-label">{canonicalMuscleGroup(exercise.muscleGroup)} · {typeLabel(type)}</span><h3>{exercise.name}</h3></div>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar detalhes">✕</button>
      </header>

      <section className="exercise-performance-card">
        <div><span>Última sessão</span><strong>{latest ? formatHistoryPerformance(latest.exercise) : 'Sem registro'}</strong>{latest && <small>{formatShortDate(latest.completedAt)}</small>}</div>
        <div><span>{type === 'strength' ? 'PR válido' : 'Referência'}</span><strong>{type === 'strength' ? (pr ?? 'Ainda não') : typeLabel(type)}</strong><small>{type === 'strength' ? (pr ? 'melhor marca após a linha de base' : 'primeira sessão é linha de base') : 'histórico da atividade'}</small></div>
      </section>

      {advice && <section className={`library-coach-card ${advice.status}`}><span className="info-label">COACH TITAN</span><strong>{advice.title}</strong><p>{advice.message}</p></section>}

      {video && <section className="exercise-video-card" aria-label="Vídeo de execução"><div className="exercise-video"><iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`} referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section>}
      {!video && type !== 'cardio' && <div className="video-not-required"><strong>Vídeo ainda não disponível</strong><p>O exercício continua acessível normalmente. Quando um vídeo estiver cadastrado, o player aparecerá aqui automaticamente.</p></div>}
      {type === 'cardio' && <div className="video-not-required"><strong>Cardio</strong><p>Consulte abaixo as orientações programadas para esta atividade.</p></div>}

      {exercise.technique && <section className="library-info"><span className="info-label">EXECUÇÃO</span><p>{exercise.technique}</p></section>}
      {!exercise.technique && exercise.notes && <section className="library-info"><span className="info-label">ORIENTAÇÃO</span><p>{exercise.notes}</p></section>}
      {exercise.commonMistakes?.length ? <section className="library-info"><span className="info-label">ERROS COMUNS</span><ul>{exercise.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      {exercise.alternatives?.length ? <section className="library-info"><span className="info-label">ALTERNATIVAS</span><ul>{exercise.alternatives.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      {recentSessions.length > 0 && <section className="library-info exercise-recent-history"><span className="info-label">ÚLTIMAS SESSÕES</span>{recentSessions.map((session, index) => <div key={`${session.completedAt}:${index}`}><span>{formatShortDate(session.completedAt)}</span><strong>{formatHistoryPerformance(session.exercise)}</strong></div>)}</section>}
      <button type="button" className="secondary-action sheet-bottom-close" onClick={onClose}>Voltar</button>
    </article>
  </div>;
}

function buildValidPr(sessions: ReturnType<typeof getExerciseSessions>) {
  if (sessions.length < 2) return null;
  const chronological = [...sessions].reverse();
  const baseline = bestSet(chronological[0].exercise);
  if (!baseline) return null;
  let bestWeight = baseline.weight;
  let bestScore = baseline.weight * baseline.reps;
  let validPr: { weight: number; reps: number; score: number } | null = null;

  for (const { exercise } of chronological.slice(1)) {
    const set = bestSet(exercise);
    if (!set) continue;
    const score = set.weight * set.reps;
    if (set.weight > bestWeight || score > bestScore) {
      if (!validPr || set.weight > validPr.weight || (set.weight === validPr.weight && score > validPr.score)) validPr = { ...set, score };
      bestWeight = Math.max(bestWeight, set.weight);
      bestScore = Math.max(bestScore, score);
    }
  }
  return validPr ? `${validPr.weight} kg × ${validPr.reps}` : null;
}

function bestSet(exercise: HistoryExercise) {
  const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!valid.length) return null;
  const selected = [...valid].sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0) || (b.repetitions ?? 0) - (a.repetitions ?? 0))[0];
  return { weight: selected.weightKg ?? 0, reps: selected.repetitions ?? 0 };
}

function formatHistoryPerformance(exercise: HistoryExercise) {
  const type = exercise.exerciseType ?? 'strength';
  if (type === 'strength') {
    const set = bestSet(exercise);
    return set ? `${set.weight} kg × ${set.reps}` : 'Sem série válida';
  }
  const duration = exercise.totalDurationSeconds || Math.max(0, ...(exercise.sets ?? []).map((set) => set.durationSeconds ?? 0));
  const distance = exercise.totalDistanceMeters || (exercise.sets ?? []).reduce((total, set) => total + (set.distanceMeters ?? 0), 0);
  if (type === 'isometric') return duration > 0 ? formatDuration(duration) : 'Concluído';
  if (distance > 0 && duration > 0) return `${formatDistance(distance)} · ${formatDuration(duration)}`;
  if (duration > 0) return formatDuration(duration);
  if (distance > 0) return formatDistance(distance);
  return 'Concluído';
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return remaining ? `${minutes}min ${remaining}s` : `${minutes}min`;
}
function formatDistance(meters: number) { return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`; }
function formatShortDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)); }
function typeLabel(type: ExerciseType) { return ({ strength: 'Musculação', distance: 'Distância', cardio: 'Cardio', isometric: 'Isometria', mobility: 'Mobilidade' })[type]; }
function capitalize(value: string) { return value ? value[0].toUpperCase() + value.slice(1) : value; }
function shortTitle(value: string) { return value.split('—')[0]?.trim() ?? value; }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function canonicalMuscleGroup(value: string) { const key = normalize(value); if (key.includes('peit')) return 'Peito'; if (key.includes('cost') || key.includes('dors')) return 'Costas'; if (key.includes('delto') || key.includes('ombro')) return 'Ombros'; if (key.includes('biceps') || key.includes('triceps') || key.includes('braco') || key.includes('antebraco')) return 'Braços'; if (key.includes('quadr')) return 'Quadríceps'; if (key.includes('posterior') || key.includes('glute')) return 'Posterior'; if (key.includes('panturr')) return 'Panturrilhas'; if (key.includes('core') || key.includes('abd')) return 'Core'; if (key.includes('cardio')) return 'Cardio'; return value || 'Outros'; }
function muscleIcon(group: string) { if (group === 'Peito') return '◒'; if (group === 'Costas') return '◇'; if (group === 'Ombros') return '◉'; if (group === 'Braços') return '◆'; if (group === 'Quadríceps') return '▰'; if (group === 'Posterior') return '◐'; if (group === 'Panturrilhas') return '▲'; if (group === 'Core') return '⬡'; if (group === 'Cardio') return '♡'; return '●'; }
