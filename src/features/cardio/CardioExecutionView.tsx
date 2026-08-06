import { useEffect, useMemo, useState } from 'react';
import type { TitanCardioSession } from '../plan/types';

type Props = { session: TitanCardioSession; onBack: () => void; onCompleted: () => void; };

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CardioExecutionView({ session, onBack, onCompleted }: Props) {
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => session.instructions?.length ? session.instructions : ['Realize a sessão no esforço programado.'], [session.instructions]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function complete() {
    const records = JSON.parse(localStorage.getItem('titan-fit:cardio-completed:v1') ?? '[]') as string[];
    localStorage.setItem('titan-fit:cardio-completed:v1', JSON.stringify(Array.from(new Set([...records, session.id]))));
    setRunning(false);
    onCompleted();
  }

  return <div className="cardio-execution">
    <button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para hoje</button>
    <section className="cardio-execution-hero">
      <span className="eyebrow">PROJETO 5 KM · {session.startTime}</span>
      <h2>{session.title}</h2>
      <p>{session.goal}</p>
      <div className="cardio-timer">{formatTime(elapsedSeconds)}</div>
      <small>Meta da sessão: {session.durationMinutes} minutos</small>
      <button type="button" className="primary-action" onClick={() => setRunning((value) => !value)}>{running ? 'Pausar' : elapsedSeconds ? 'Continuar' : 'Iniciar cardio'}</button>
    </section>

    <section className="cardio-step-card" aria-live="polite">
      <span className="eyebrow">ETAPA {stepIndex + 1} DE {steps.length}</span>
      <h3>{steps[stepIndex]}</h3>
      <div className="cardio-step-actions">
        <button type="button" className="secondary-action" disabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>Anterior</button>
        {stepIndex < steps.length - 1
          ? <button type="button" className="primary-action" onClick={() => setStepIndex((value) => value + 1)}>Próxima etapa</button>
          : <button type="button" className="primary-action" onClick={complete}>Concluir cardio</button>}
      </div>
    </section>
  </div>;
}
