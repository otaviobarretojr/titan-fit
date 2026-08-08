import { useEffect, useMemo, useState } from 'react';
import { getExerciseVideo } from '../exercise-library/videos';
import { getExerciseSessions } from '../history/intelligence';
import { loadWorkoutHistory } from '../history/storage';
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

  const selectedExercise = allExercises.find((item) => item.id === selectedExerciseId)
    ?? workout?.exercises.find((item) => item.id === selectedExerciseId)
    ?? null;

  useEffect(() => {
    if (!selectedExercise) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selectedExercise]);

  if (!plan) return <section className="hero-card compact"><span className="eyebrow">SEMANA TITAN</span><h2>Importe seu projeto</h2><p>Depois da importação, os grupos da semana e a biblioteca de exercícios aparecem aqui.</p></section>;

  return <section className="weekly-library-page">
    <div className="library-view-switch" role="tablist" aria-label="Semana e biblioteca de exercícios">
      <button type="button" role="tab" aria-selected={view === 'week'} className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Semana</button>
      <button type="button" role="tab" aria-selected={view === 'exercises'} className={view === 'exercises' ? 'active' : ''} onClick={() => setView('exercises')}>Exercícios</button>
    </div>

    {view === 'week' ? <>
      <header className="hero-card compact"><span className="eyebrow">SEMANA TITAN</span><h2>Grupos e exercícios</h2><p>Escolha um dia para consultar os exercícios, vídeos e dicas de execução.</p></header>
      <div className="week-tabs" role="tablist" aria-label="Treinos da semana">
        {plan.workouts.map((item) => <button key={item.id} type="button" role="tab" aria-selected={item.id === selectedWorkoutId} className={item.id === selectedWorkoutId ? 'active' : ''} onClick={() => { setSelectedWorkoutId(item.id); setSelectedExerciseId(null); }}><strong>{capitalize(item.day)}</strong><span>{shortTitle(item.title)}</span></button>)}
      </div>

      {workout && <>
        <section className="weekly-workout-card"><span className="info-label">{capitalize(workout.day)}</span><h3>{workout.title}</h3>{workout.focus && <p>{workout.focus}</p>}<strong>{workout.exercises.length} exercícios</strong></section>
        <div className="weekly-exercise-list">
          {workout.exercises.map((item, index) => <button type="button" key={item.id} className="weekly-exercise-row" onClick={() => setSelectedExerciseId(item.id)}><span className="exercise-order">{index + 1}</span><span><strong>{item.name}</strong><small>{item.muscleGroup} · {typeLabel(item.exerciseType ?? 'strength')}</small></span><span aria-hidden="true">›</span></button>)}
        </div>
      </>}
    </> : <>
      <header className="hero-card compact exercise-library-hero"><span className="eyebrow">BIBLIOTECA TITAN · v0.28</span><h2>Exercícios</h2><p>Consulte execução, vídeo, alternativas e seu desempenho sem precisar iniciar um treino.</p></header>
      <div className="exercise-library-tools">
        <label className="exercise-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar exercício" aria-label="Buscar exercício" /></label>
        <div className="muscle-filter-strip" aria-label="Filtrar por grupo muscular">{muscleGroups.map((group) => <button key={group} type="button" className={muscleFilter === group ? 'active' : ''} onClick={() => setMuscleFilter(group)}>{group}</button>)}</div>
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

    {selectedExercise && <ExerciseSheet exercise={selectedExercise} onClose={() => setSelectedExerciseId(null)} />}
  </section>;
}

function ExerciseSheet({ exercise, onClose }: { exercise: TitanExercise; onClose: () => void }) {
  const type = exercise.exerciseType ?? 'strength';
  const video = type === 'cardio' ? null : getExerciseVideo(exercise);
  const history = loadWorkoutHistory();
  const sessions = type === 'strength' ? getExerciseSessions(history, exercise.id).slice(0, 3) : [];
  const latest = sessions[0] ?? null;
  const pr = buildPr(sessions);

  return <div className="exercise-sheet-backdrop" role="presentation">
    <article className="exercise-sheet" role="dialog" aria-modal="true" aria-label={`Detalhes de ${exercise.name}`}>
      <header className="sheet-header">
        <div><span className="info-label">{canonicalMuscleGroup(exercise.muscleGroup)} · {typeLabel(type)}</span><h3>{exercise.name}</h3></div>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar detalhes">✕</button>
      </header>

      {type === 'strength' && <section className="exercise-performance-card">
        <div><span>Última sessão</span><strong>{latest ? formatBest(latest.exercise) : 'Sem registro'}</strong>{latest && <small>{formatShortDate(latest.completedAt)}</small>}</div>
        <div><span>PR válido</span><strong>{pr ?? 'Ainda não'}</strong><small>{pr ? 'melhor marca registrada' : 'primeira sessão é linha de base'}</small></div>
      </section>}

      {video && <section className="exercise-video-card" aria-label="Vídeo de execução"><div className="exercise-video"><iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`} referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section>}
      {!video && type !== 'cardio' && <div className="video-not-required"><strong>Vídeo ainda não disponível</strong><p>O exercício continua acessível normalmente. Quando um vídeo estiver cadastrado, o player aparecerá aqui automaticamente.</p></div>}
      {type === 'cardio' && <div className="video-not-required"><strong>Cardio</strong><p>Consulte abaixo as orientações programadas para esta atividade.</p></div>}

      {exercise.technique && <section className="library-info"><span className="info-label">EXECUÇÃO</span><p>{exercise.technique}</p></section>}
      {exercise.commonMistakes?.length ? <section className="library-info"><span className="info-label">ERROS COMUNS</span><ul>{exercise.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      {exercise.alternatives?.length ? <section className="library-info"><span className="info-label">ALTERNATIVAS</span><ul>{exercise.alternatives.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      {sessions.length > 0 && <section className="library-info exercise-recent-history"><span className="info-label">ÚLTIMAS SESSÕES</span>{sessions.map((session) => <div key={session.completedAt}><span>{formatShortDate(session.completedAt)}</span><strong>{formatBest(session.exercise)}</strong></div>)}</section>}
      <button type="button" className="secondary-action sheet-bottom-close" onClick={onClose}>Voltar</button>
    </article>
  </div>;
}

function buildPr(sessions: ReturnType<typeof getExerciseSessions>) {
  if (sessions.length < 2) return null;
  const chronological = [...sessions].reverse();
  const baseline = bestSet(chronological[0].exercise);
  if (!baseline) return null;
  let bestWeight = baseline.weight;
  let bestScore = baseline.weight * baseline.reps;
  let currentPr: { weight: number; reps: number } | null = null;
  chronological.slice(1).forEach(({ exercise }) => {
    const set = bestSet(exercise);
    if (!set) return;
    const score = set.weight * set.reps;
    if (set.weight > bestWeight || score > bestScore) {
      currentPr = set;
      bestWeight = Math.max(bestWeight, set.weight);
      bestScore = Math.max(bestScore, score);
    }
  });
  return currentPr ? `${currentPr.weight} kg × ${currentPr.reps}` : null;
}

function bestSet(exercise: ReturnType<typeof getExerciseSessions>[number]['exercise']) {
  const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!valid.length) return null;
  const selected = [...valid].sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0) || (b.repetitions ?? 0) - (a.repetitions ?? 0))[0];
  return { weight: selected.weightKg ?? 0, reps: selected.repetitions ?? 0 };
}

function formatBest(exercise: ReturnType<typeof getExerciseSessions>[number]['exercise']) { const set = bestSet(exercise); return set ? `${set.weight} kg × ${set.reps}` : '—'; }
function formatShortDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)); }
function typeLabel(type: ExerciseType) { return ({ strength: 'Musculação', distance: 'Distância', cardio: 'Cardio', isometric: 'Isometria', mobility: 'Mobilidade' })[type]; }
function capitalize(value: string) { return value ? value[0].toUpperCase() + value.slice(1) : value; }
function shortTitle(value: string) { return value.split('—')[0]?.trim() ?? value; }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function canonicalMuscleGroup(value: string) { const key = normalize(value); if (key.includes('peit')) return 'Peito'; if (key.includes('cost') || key.includes('dors')) return 'Costas'; if (key.includes('delto') || key.includes('ombro')) return 'Ombros'; if (key.includes('biceps') || key.includes('triceps') || key.includes('braco') || key.includes('antebraco')) return 'Braços'; if (key.includes('quadr')) return 'Quadríceps'; if (key.includes('posterior') || key.includes('glute')) return 'Posterior'; if (key.includes('panturr')) return 'Panturrilhas'; if (key.includes('core') || key.includes('abd')) return 'Core'; if (key.includes('cardio')) return 'Cardio'; return value || 'Outros'; }
function muscleIcon(group: string) { if (group === 'Peito') return '◒'; if (group === 'Costas') return '◇'; if (group === 'Ombros') return '◉'; if (group === 'Braços') return '◆'; if (group === 'Quadríceps') return '▰'; if (group === 'Posterior') return '◐'; if (group === 'Panturrilhas') return '▲'; if (group === 'Core') return '⬡'; if (group === 'Cardio') return '♡'; return '●'; }
