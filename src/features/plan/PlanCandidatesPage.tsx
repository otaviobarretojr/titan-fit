import { useEffect, useMemo } from 'react';
import type { GeneratedPlanCandidate, TitanProfile, TitanTrainingAssessment } from '../profile/types';
import { linkPlanToProject } from '../project/repository';
import { saveGeneratedPlanCandidates } from './candidateRepository';
import { generateTitanPlanCandidates } from './generator';
import { saveActivePlan } from './storage';
import type { TitanPlan } from './types';

function metricLabel(score?: number) {
  if (score == null) return '—';
  if (score >= 90) return 'Excelente';
  if (score >= 80) return 'Muito bom';
  if (score >= 70) return 'Bom';
  return 'Atenção';
}

function weeklySplit(candidate: GeneratedPlanCandidate<TitanPlan>) {
  return candidate.plan.workouts.map((workout) => workout.title).join(' · ');
}

export function PlanCandidatesPage({ profile, assessment, onActivate }: { profile: TitanProfile; assessment: TitanTrainingAssessment; onActivate: () => void }) {
  const candidates = useMemo(() => generateTitanPlanCandidates(profile, assessment), [profile, assessment]);
  const recommended = candidates.find((candidate) => candidate.recommended) ?? candidates[0];

  useEffect(() => {
    void saveGeneratedPlanCandidates(candidates).catch((error) => console.warn('Não foi possível salvar as propostas TITAN.', error));
  }, [candidates]);

  async function activate(candidate: GeneratedPlanCandidate<TitanPlan>) {
    const linkedPlan = await linkPlanToProject(candidate.plan, profile.id);
    saveActivePlan(linkedPlan);
    onActivate();
  }

  return <main className="profile-onboarding plan-candidates-page">
    <section className="profile-hero candidate-hero">
      <span className="eyebrow">COACH TITAN</span>
      <h1>Escolha sua estratégia</h1>
      <p>Geramos três opções válidas para o seu perfil. O TITAN comparou volume, equilíbrio entre sessões, fadiga e aderência ao seu contexto antes de destacar a recomendação.</p>
      {recommended && <div className="candidate-recommendation-summary" role="status">
        <span>RECOMENDAÇÃO TITAN</span>
        <strong>{recommended.title}</strong>
        <small>Score {recommended.titanScore ?? '—'}/100 · você ainda pode escolher qualquer uma das três opções.</small>
      </div>}
    </section>

    <section className="profile-choice-grid candidate-grid" aria-label="Comparação das opções de treino">
      {candidates.map((candidate) => {
        const cardioCount = candidate.plan.project?.cardioSchedule?.length ?? 0;
        const metrics = candidate.engineMetrics;
        return <article key={candidate.id} className={`profile-choice-card candidate-card ${candidate.recommended ? 'primary recommended' : ''}`}>
          <div className="candidate-card-heading">
            <div>
              <span className="candidate-strategy">{candidate.strategy === 'adherence' ? 'ADERÊNCIA' : candidate.strategy === 'availability' ? 'DISPONIBILIDADE' : 'EQUILÍBRIO'}</span>
              <strong>{candidate.title}</strong>
            </div>
            <div className="candidate-score" aria-label={`Score TITAN ${candidate.titanScore ?? 0} de 100`}>
              <b>{candidate.titanScore ?? '—'}</b><span>/100</span>
            </div>
          </div>

          {candidate.recommended && <div className="candidate-recommended-badge">★ RECOMENDADO PELO TITAN</div>}

          <div className="candidate-overview">
            <span><b>{candidate.plan.workouts.length}</b> dias musculação</span>
            <span><b>{cardioCount}</b> cardio</span>
            <span><b>{assessment.preferredSessionMinutes}</b> min alvo</span>
          </div>

          <div className="candidate-split">
            <span>DIVISÃO SEMANAL</span>
            <strong>{weeklySplit(candidate)}</strong>
          </div>

          {metrics && <div className="candidate-metrics">
            <div><span>Volume alvo</span><strong>{metrics.volumeTargetCoverage}%</strong><small>{metricLabel(metrics.volumeTargetCoverage)}</small></div>
            <div><span>Equilíbrio</span><strong>{metrics.sessionBalance}%</strong><small>{metricLabel(metrics.sessionBalance)}</small></div>
            <div><span>Fadiga</span><strong>{metrics.fatigueScore}%</strong><small>{metricLabel(metrics.fatigueScore)}</small></div>
            <div><span>Adequação</span><strong>{metrics.strategyFit}%</strong><small>{metricLabel(metrics.strategyFit)}</small></div>
          </div>}

          <div className="candidate-rationale">
            <span>POR QUE ESTA OPÇÃO?</span>
            <ul>{candidate.rationale.slice(0, 5).map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </div>

          <button type="button" className="profile-save candidate-activate" onClick={() => void activate(candidate)}>{candidate.recommended ? 'Usar plano recomendado' : 'Usar este plano'}</button>
        </article>;
      })}
    </section>
    <small className="profile-privacy-note">As propostas são geradas no aparelho a partir da Base TITAN e dos dados do seu perfil. A recomendação é explicável e não substitui avaliação profissional quando houver dor, lesão ou condição de saúde.</small>
  </main>;
}