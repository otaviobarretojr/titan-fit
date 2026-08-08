import { useEffect, useState } from 'react';
import { loadActiveAssessment, loadActiveProfile, saveActiveAssessment, saveActiveProfile, updateProfile } from './repository';
import type { CardioGoal, EquipmentAccess, PrimaryGoal, TitanProfile, TitanTrainingAssessment, TrainingExperience } from './types';

export function ProfileSettingsPanel() {
  const [profile, setProfile] = useState<TitanProfile | null>(null);
  const [assessment, setAssessment] = useState<TitanTrainingAssessment | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void Promise.all([loadActiveProfile(), loadActiveAssessment()]).then(([nextProfile, nextAssessment]) => {
      setProfile(nextProfile);
      setAssessment(nextAssessment);
    }).catch(() => setStatus('Não foi possível carregar o perfil neste aparelho.'));
  }, []);

  if (!profile || !assessment) {
    return <section className="settings-card beta-profile-card" aria-label="Perfil e objetivos"><div><span className="info-label">Perfil e objetivos</span><strong>Perfil não configurado</strong><small>{status || 'Crie um perfil pelo fluxo inicial para personalizar treino e cardio.'}</small></div></section>;
  }

  async function saveChanges() {
    if (!profile || !assessment) return;
    if (!profile.displayName.trim()) return setStatus('Informe um nome para o perfil.');
    if (!profile.heightCm || profile.heightCm < 100 || profile.heightCm > 250) return setStatus('Informe uma altura válida.');
    if (!profile.currentWeightKg || profile.currentWeightKg < 30 || profile.currentWeightKg > 350) return setStatus('Informe um peso válido.');
    if (assessment.trainingDaysPerWeek < 1 || assessment.trainingDaysPerWeek > 7) return setStatus('Musculação deve ficar entre 1 e 7 dias por semana.');
    if (assessment.preferredSessionMinutes < 20 || assessment.preferredSessionMinutes > 180) return setStatus('A duração do treino deve ficar entre 20 e 180 minutos.');
    if (assessment.cardioGoal !== 'none' && ((assessment.cardioDaysPerWeek ?? 0) < 1 || (assessment.cardioDaysPerWeek ?? 0) > 5)) return setStatus('Cardio deve ficar entre 1 e 5 dias por semana.');

    const now = new Date().toISOString();
    try {
      const nextProfile = updateProfile(profile, { displayName: profile.displayName.trim(), updatedAt: now });
      const nextAssessment = { ...assessment, updatedAt: now };
      await Promise.all([saveActiveProfile(nextProfile), saveActiveAssessment(nextAssessment)]);
      setProfile(nextProfile);
      setAssessment(nextAssessment);
      setEditing(false);
      setStatus('Perfil atualizado. O projeto ativo não foi alterado automaticamente.');
    } catch {
      setStatus('Não foi possível salvar as alterações.');
    }
  }

  return <section className="settings-card beta-profile-card" aria-label="Perfil e objetivos">
    <div className="beta-section-heading"><div><span className="info-label">Perfil e objetivos</span><strong>{profile.displayName}</strong><small>Edite seus dados sem apagar histórico, fotos ou registros.</small></div><button type="button" className="secondary-action" onClick={() => { setEditing((value) => !value); setStatus(''); }}>{editing ? 'Cancelar' : 'Editar perfil'}</button></div>
    {!editing && <div className="beta-profile-summary"><span>{profile.heightCm} cm</span><span>{profile.currentWeightKg?.toFixed(1)} kg</span><span>{goalLabel(profile.primaryGoal)}</span><span>{assessment.trainingDaysPerWeek}x musculação</span><span>{assessment.cardioGoal === 'none' ? 'Sem cardio' : `${assessment.cardioDaysPerWeek ?? 0}x cardio`}</span></div>}
    {editing && <div className="beta-form-grid">
      <label>Nome<input value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></label>
      <div className="profile-field-row"><label>Altura (cm)<input type="number" value={profile.heightCm ?? ''} onChange={(event) => setProfile({ ...profile, heightCm: Number(event.target.value) })} /></label><label>Peso (kg)<input type="number" step="0.1" value={profile.currentWeightKg ?? ''} onChange={(event) => setProfile({ ...profile, currentWeightKg: Number(event.target.value) })} /></label></div>
      <label>Objetivo principal<select value={profile.primaryGoal ?? 'hypertrophy'} onChange={(event) => setProfile({ ...profile, primaryGoal: event.target.value as PrimaryGoal })}><option value="hypertrophy">Hipertrofia</option><option value="fat-loss">Perda de gordura</option><option value="recomposition">Recomposição corporal</option><option value="strength">Força</option><option value="conditioning">Condicionamento</option><option value="general-fitness">Saúde e forma física</option></select></label>
      <label>Experiência<select value={assessment.experience} onChange={(event) => setAssessment({ ...assessment, experience: event.target.value as TrainingExperience })}><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></label>
      <div className="profile-field-row"><label>Dias de musculação<input type="number" min="1" max="7" value={assessment.trainingDaysPerWeek} onChange={(event) => setAssessment({ ...assessment, trainingDaysPerWeek: Number(event.target.value) })} /></label><label>Minutos por treino<input type="number" min="20" max="180" step="5" value={assessment.preferredSessionMinutes} onChange={(event) => setAssessment({ ...assessment, preferredSessionMinutes: Number(event.target.value) })} /></label></div>
      <label>Estrutura disponível<select value={assessment.equipmentAccess} onChange={(event) => setAssessment({ ...assessment, equipmentAccess: event.target.value as EquipmentAccess })}><option value="full-gym">Academia completa</option><option value="home-gym">Academia residencial</option><option value="minimal">Poucos equipamentos</option><option value="bodyweight">Peso corporal</option></select></label>
      <label>Objetivo de cardio<select value={assessment.cardioGoal} onChange={(event) => setAssessment({ ...assessment, cardioGoal: event.target.value as CardioGoal, cardioDaysPerWeek: event.target.value === 'none' ? 0 : Math.max(assessment.cardioDaysPerWeek ?? 2, 1) })}><option value="health">Saúde cardiovascular</option><option value="conditioning">Melhorar condicionamento</option><option value="5k">Correr 5 km</option><option value="10k">Correr 10 km</option><option value="fat-loss-support">Apoio à perda de gordura</option><option value="none">Sem objetivo de cardio</option></select></label>
      {assessment.cardioGoal !== 'none' && <label>Dias de cardio<input type="number" min="1" max="5" value={assessment.cardioDaysPerWeek ?? 2} onChange={(event) => setAssessment({ ...assessment, cardioDaysPerWeek: Number(event.target.value) })} /></label>}
      <div className="beta-warning"><strong>Importante</strong><span>Alterar o perfil muda o contexto do Coach, mas não reescreve silenciosamente o projeto ativo. Uma nova prescrição deverá ser confirmada por você.</span></div>
      <button type="button" className="profile-save" onClick={() => void saveChanges()}>Salvar alterações</button>
    </div>}
    {status && <p className="beta-status" role="status">{status}</p>}
  </section>;
}

function goalLabel(goal?: PrimaryGoal) {
  if (goal === 'fat-loss') return 'Perda de gordura';
  if (goal === 'recomposition') return 'Recomposição';
  if (goal === 'strength') return 'Força';
  if (goal === 'conditioning') return 'Condicionamento';
  if (goal === 'general-fitness') return 'Saúde';
  return 'Hipertrofia';
}
