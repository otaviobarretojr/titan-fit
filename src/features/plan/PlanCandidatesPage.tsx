import { useEffect, useMemo } from 'react';
import type { GeneratedPlanCandidate, TitanProfile, TitanTrainingAssessment } from '../profile/types';
import { saveGeneratedPlanCandidates } from './candidateRepository';
import { generateTitanPlanCandidates } from './generator';
import { saveActivePlan } from './storage';
import type { TitanPlan } from './types';

export function PlanCandidatesPage({ profile, assessment, onActivate }: { profile: TitanProfile; assessment: TitanTrainingAssessment; onActivate: () => void }) {
  const candidates = useMemo(() => generateTitanPlanCandidates(profile, assessment), [profile, assessment]);

  useEffect(() => {
    void saveGeneratedPlanCandidates(candidates).catch((error) => console.warn('Não foi possível salvar as propostas TITAN.', error));
  }, [candidates]);

  function activate(candidate: GeneratedPlanCandidate<TitanPlan>) {
    saveActivePlan(candidate.plan);
    onActivate();
  }

  return <main className="profile-onboarding">
    <section className="profile-hero">
      <span className="eyebrow">COACH TITAN</span>
      <h1>Escolha sua estratégia</h1>
      <p>Montamos três opções válidas para o seu perfil. A opção Equilíbrio é a recomendação principal do TITAN.</p>
    </section>
    <section className="profile-choice-grid">
      {candidates.map((candidate) => {
        const cardioCount = candidate.plan.project?.cardioSchedule?.length ?? 0;
        return <article key={candidate.id} className={`profile-choice-card ${candidate.strategy === 'balanced' ? 'primary' : ''}`}>
          <div>
            <strong>{candidate.title}</strong>
            {candidate.strategy === 'balanced' && <span className="eyebrow">RECOMENDADO</span>}
          </div>
          <span>{candidate.plan.workouts.length} dias de musculação{cardioCount ? ` · ${cardioCount} sessões de cardio` : ''}</span>
          <ul>{candidate.rationale.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <button type="button" className="profile-save" onClick={() => activate(candidate)}>Usar este plano</button>
        </article>;
      })}
    </section>
    <small className="profile-privacy-note">As propostas são geradas no aparelho a partir da Base TITAN e dos dados do seu perfil.</small>
  </main>;
}
