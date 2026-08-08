import { useMemo, useState } from 'react';
import type { TitanCardioSession, TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';

type Props = { plan: TitanPlan | null };
type SelectedItem = { type: 'strength'; workout: TitanWorkoutDay } | { type: 'cardio'; cardio: TitanCardioSession } | null;

const DAY_ORDER = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

export function ProgrammingPage({ plan }: Props) {
  const [selected, setSelected] = useState<SelectedItem>(null);
  const strength = useMemo(() => !plan ? [] : [...plan.workouts].filter((workout) => workout.exercises.some((exercise) => (exercise.exerciseType ?? 'strength') === 'strength')).sort((a, b) => dayIndex(a.day) - dayIndex(b.day)), [plan]);
  const cardio = useMemo(() => !plan ? [] : [...(plan.project?.cardioSchedule ?? [])].sort((a, b) => dayIndex(a.day) - dayIndex(b.day)), [plan]);

  if (!plan) return <section className="programming-empty"><span className="eyebrow">PROGRAMAÇÃO</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para visualizar a programação semanal de musculação e cardio.</p></section>;
  if (selected?.type === 'strength') return <StrengthDetail workout={selected.workout} onBack={() => setSelected(null)} />;
  if (selected?.type === 'cardio') return <CardioDetail cardio={selected.cardio} onBack={() => setSelected(null)} />;

  return <div className="programming-page">
    <section className="section-header programming-header"><span className="eyebrow">PLANEJAMENTO SEMANAL</span><h2>Programação</h2><p>Veja rapidamente o que está previsto para musculação e cardio em cada dia da semana.</p></section>

    <section className="programming-section" aria-labelledby="strength-program-title">
      <div className="programming-section-head"><div><span className="programming-section-icon strength">⌁</span><div><span className="eyebrow">MUSCULAÇÃO</span><h3 id="strength-program-title">Treinos da semana</h3></div></div><small>{strength.length} dias</small></div>
      <div className="programming-list">
        {DAY_ORDER.map((day) => {
          const workout = strength.find((item) => normalize(item.day).includes(day));
          if (!workout) return <article className="programming-day-card rest" key={`strength-${day}`}><DayLabel day={day} /><div className="programming-day-copy"><strong>Descanso da musculação</strong><small>Sem treino de força programado</small></div><span className="programming-tag rest">DESCANSO</span></article>;
          const exercises = workout.exercises.filter((exercise) => (exercise.exerciseType ?? 'strength') === 'strength');
          return <button type="button" className="programming-day-card" key={workout.id} onClick={() => setSelected({ type: 'strength', workout })}><DayLabel day={day} /><div className="programming-day-copy"><strong>{workout.title}</strong><small>{workout.focus ?? 'Treino programado'} · {exercises.length} exercícios</small></div><span className="programming-chevron">›</span></button>;
        })}
      </div>
    </section>

    <section className="programming-section" aria-labelledby="cardio-program-title">
      <div className="programming-section-head"><div><span className="programming-section-icon cardio">♡</span><div><span className="eyebrow">CARDIO</span><h3 id="cardio-program-title">Cardio da semana</h3></div></div><small>{cardio.length} sessões</small></div>
      <div className="programming-list">
        {DAY_ORDER.map((day) => {
          const sessions = cardio.filter((item) => normalize(item.day).includes(day));
          if (!sessions.length) return <article className="programming-day-card unconfigured" key={`cardio-${day}`}><DayLabel day={day} /><div className="programming-day-copy"><strong>Cardio a definir</strong><small>Sem sessão configurada no projeto</small></div><span className="programming-tag">A DEFINIR</span></article>;
          return sessions.map((session) => <button type="button" className="programming-day-card" key={session.id} onClick={() => setSelected({ type: 'cardio', cardio: session })}><DayLabel day={day} /><div className="programming-day-copy"><strong>{session.title}</strong><small>{session.durationMinutes} min · {cardioZone(session)}{session.startTime ? ` · ${session.startTime}` : ''}</small></div><span className="programming-chevron">›</span></button>);
        })}
      </div>
    </section>
  </div>;
}

function StrengthDetail({ workout, onBack }: { workout: TitanWorkoutDay; onBack: () => void }) {
  const strength = workout.exercises.filter((exercise) => (exercise.exerciseType ?? 'strength') === 'strength');
  return <div className="programming-detail"><button type="button" className="secondary-action programming-back" onClick={onBack}>‹ Voltar à programação</button><section className="programming-detail-hero"><span className="eyebrow">{workout.day.toUpperCase()} · MUSCULAÇÃO</span><h2>{workout.title}</h2><p>{workout.focus ?? 'Treino programado no Projeto TITAN.'}</p><div className="programming-detail-summary"><span><small>Exercícios</small><strong>{strength.length}</strong></span><span><small>Séries</small><strong>{strength.reduce((sum, exercise) => sum + (exercise.sets ?? 1), 0)}</strong></span></div></section><div className="programming-exercise-list">{strength.map((exercise, index) => <ExerciseGuide key={exercise.id} exercise={exercise} index={index + 1} />)}</div></div>;
}

function ExerciseGuide({ exercise, index }: { exercise: TitanExercise; index: number }) {
  return <details className="programming-exercise-card"><summary><span className="programming-exercise-order">{index}</span><span><strong>{exercise.name}</strong><small>{exercise.sets ?? 1} séries · {repRange(exercise)} · RIR {exercise.targetRir ?? '—'}</small></span><span className="programming-chevron">⌄</span></summary><div className="programming-exercise-guide"><InfoRow label="Grupo muscular" value={exercise.muscleGroup} /><InfoRow label="Descanso" value={exercise.restSeconds ? `${exercise.restSeconds}s` : 'A definir'} />{exercise.technique && <GuideBlock title="Execução" text={exercise.technique} />}{exercise.commonMistakes?.length ? <GuideList title="Erros comuns" items={exercise.commonMistakes} /> : null}{exercise.alternatives?.length ? <GuideList title="Alternativas" items={exercise.alternatives} /> : null}</div></details>;
}

function CardioDetail({ cardio, onBack }: { cardio: TitanCardioSession; onBack: () => void }) {
  return <div className="programming-detail"><button type="button" className="secondary-action programming-back" onClick={onBack}>‹ Voltar à programação</button><section className="programming-detail-hero cardio"><span className="eyebrow">{cardio.day.toUpperCase()} · CARDIO</span><h2>{cardio.title}</h2><p>{cardio.goal ?? cardio.phase ?? 'Sessão cardiovascular programada.'}</p><div className="programming-detail-summary"><span><small>Tempo</small><strong>{cardio.durationMinutes} min</strong></span><span><small>Zona</small><strong>{cardioZone(cardio)}</strong></span></div></section>{cardio.instructions?.length ? <section className="programming-instructions"><span className="eyebrow">COMO EXECUTAR</span><h3>Orientações da sessão</h3><ol>{cardio.instructions.map((item) => <li key={item}>{item}</li>)}</ol></section> : null}</div>;
}

function DayLabel({ day }: { day: string }) { return <span className="programming-day-label"><strong>{day.slice(0, 3).toUpperCase()}</strong></span>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="programming-info-row"><span>{label}</span><strong>{value}</strong></div>; }
function GuideBlock({ title, text }: { title: string; text: string }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><p>{text}</p></div>; }
function GuideList({ title, items }: { title: string; items: string[] }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function repRange(exercise: TitanExercise) { if (exercise.minReps && exercise.maxReps) return `${exercise.minReps}–${exercise.maxReps} reps`; if (exercise.maxReps) return `até ${exercise.maxReps} reps`; if (exercise.minReps) return `${exercise.minReps}+ reps`; return 'reps a definir'; }
function cardioZone(session: TitanCardioSession) { if (session.type === 'zone2') return 'Zona 2'; if (session.type === 'hiit') return 'HIIT'; if (session.type === 'run') return 'Corrida'; if (session.type === 'run-walk') return 'Corrida/caminhada'; if (session.type === 'walk') return 'Caminhada'; if (session.type === 'bike') return 'Bike'; if (session.type === 'stairs') return 'Escada'; return 'Cardio'; }
function dayIndex(value: string) { const normalized = normalize(value); const index = DAY_ORDER.findIndex((day) => normalized.includes(day)); return index === -1 ? 99 : index; }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
