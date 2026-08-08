import { useState } from 'react';
import { saveActiveAssessment, saveActiveProfile } from './repository';
import type { CardioGoal, CardioLevel, EquipmentAccess, MusclePriority, PrimaryGoal, TrainingExperience } from './types';

const MUSCLES: Array<[MusclePriority,string]> = [['chest','Peitoral'],['back','Costas'],['shoulders','Ombros'],['arms','Braços'],['quadriceps','Quadríceps'],['hamstrings-glutes','Posterior/Glúteos'],['calves','Panturrilhas'],['core','Core']];

export function ProfileOnboarding({ onComplete, onImportProject }: { onComplete: () => void; onImportProject: () => void }) {
  const [step, setStep] = useState<'choice' | 'profile'>('choice');
  const [displayName, setDisplayName] = useState(''); const [birthDate, setBirthDate] = useState(''); const [heightCm, setHeightCm] = useState(''); const [weightKg, setWeightKg] = useState('');
  const [goal, setGoal] = useState<PrimaryGoal>('hypertrophy'); const [experience, setExperience] = useState<TrainingExperience>('beginner'); const [days, setDays] = useState('3'); const [minutes, setMinutes] = useState('60'); const [equipment, setEquipment] = useState<EquipmentAccess>('full-gym');
  const [cardioGoal, setCardioGoal] = useState<CardioGoal>('health'); const [cardioLevel, setCardioLevel] = useState<CardioLevel>('low'); const [cardioDays, setCardioDays] = useState('2');
  const [priorities, setPriorities] = useState<MusclePriority[]>([]); const [limitations, setLimitations] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const togglePriority = (value: MusclePriority) => setPriorities((current) => current.includes(value) ? current.filter((item) => item !== value) : current.length < 2 ? [...current, value] : current);

  async function saveProfile() {
    const height=Number(heightCm), weight=Number(weightKg), trainingDays=Number(days), sessionMinutes=Number(minutes), cardioDaysNumber=Number(cardioDays);
    if (!displayName.trim()) return setError('Informe como o TITAN pode chamar você.');
    if (!Number.isFinite(height)||height<100||height>250) return setError('Informe uma altura válida.');
    if (!Number.isFinite(weight)||weight<30||weight>350) return setError('Informe um peso válido.');
    if (!Number.isInteger(trainingDays)||trainingDays<1||trainingDays>7) return setError('Informe de 1 a 7 dias de treino.');
    if (!Number.isFinite(sessionMinutes)||sessionMinutes<20||sessionMinutes>180) return setError('Escolha uma duração entre 20 e 180 minutos.');
    if (cardioGoal !== 'none' && (!Number.isInteger(cardioDaysNumber)||cardioDaysNumber<1||cardioDaysNumber>5)) return setError('Informe de 1 a 5 dias de cardio.');
    setSaving(true); setError(''); const now=new Date().toISOString(); const profileId=crypto.randomUUID();
    try {
      await saveActiveProfile({ id:profileId, displayName:displayName.trim(), birthDate:birthDate||undefined, heightCm:height, currentWeightKg:weight, primaryGoal:goal, createdAt:now, updatedAt:now, onboardingCompleted:true });
      await saveActiveAssessment({ id:crypto.randomUUID(), profileId, experience, trainingDaysPerWeek:trainingDays, preferredSessionMinutes:sessionMinutes, equipmentAccess:equipment, musclePriorities:priorities, limitations: limitations.trim() ? [{ area:'Informada pelo usuário', note:limitations.trim() }] : undefined, cardioGoal, cardioDaysPerWeek: cardioGoal==='none' ? 0 : cardioDaysNumber, currentCardioLevel:cardioLevel, createdAt:now, updatedAt:now });
      onComplete();
    } catch { setError('Não foi possível salvar o perfil neste aparelho.'); } finally { setSaving(false); }
  }

  if(step==='choice') return <main className="profile-onboarding"><section className="profile-hero"><span className="eyebrow">BEM-VINDO AO TITAN FIT</span><h1>Como você quer começar?</h1><p>Você pode criar um perfil para receber um planejamento personalizado ou inserir um projeto que já possui.</p></section><section className="profile-choice-grid"><button type="button" className="profile-choice-card primary" onClick={()=>setStep('profile')}><strong>Criar meu plano com o TITAN</strong><span>Informe seus dados e objetivos para preparar treino e cardio personalizados.</span></button><button type="button" className="profile-choice-card" onClick={onImportProject}><strong>Inserir meu projeto</strong><span>Use uma programação já criada e acompanhe execução, histórico e progresso no TITAN.</span></button></section><small className="profile-privacy-note">Seus dados permanecem salvos localmente neste aparelho.</small></main>;

  return <main className="profile-onboarding"><section className="profile-hero"><button type="button" className="profile-back" onClick={()=>setStep('choice')}>← Voltar</button><span className="eyebrow">PERFIL TITAN</span><h1>Conte o essencial</h1><p>Essas respostas ajudam o TITAN a escolher volume, exercícios e cardio mais adequados.</p></section><section className="profile-form-card">
    <label>Como podemos te chamar?<input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} autoComplete="name" /></label><label>Data de nascimento <small>Opcional</small><input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} /></label>
    <div className="profile-field-row"><label>Altura (cm)<input type="number" value={heightCm} onChange={(e)=>setHeightCm(e.target.value)} /></label><label>Peso (kg)<input type="number" step="0.1" value={weightKg} onChange={(e)=>setWeightKg(e.target.value)} /></label></div>
    <label>Objetivo principal<select value={goal} onChange={(e)=>setGoal(e.target.value as PrimaryGoal)}><option value="hypertrophy">Hipertrofia</option><option value="fat-loss">Perda de gordura</option><option value="recomposition">Recomposição corporal</option><option value="strength">Força</option><option value="conditioning">Condicionamento</option><option value="general-fitness">Saúde e forma física</option></select></label>
    <label>Experiência<select value={experience} onChange={(e)=>setExperience(e.target.value as TrainingExperience)}><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></label>
    <div className="profile-field-row"><label>Dias de musculação/semana<input type="number" min="1" max="7" value={days} onChange={(e)=>setDays(e.target.value)} /></label><label>Minutos por treino<input type="number" min="20" max="180" step="5" value={minutes} onChange={(e)=>setMinutes(e.target.value)} /></label></div>
    <label>Estrutura disponível<select value={equipment} onChange={(e)=>setEquipment(e.target.value as EquipmentAccess)}><option value="full-gym">Academia completa</option><option value="home-gym">Academia residencial</option><option value="minimal">Poucos equipamentos</option><option value="bodyweight">Peso corporal</option></select></label>
    <fieldset><legend>Quer priorizar algum grupo? <small>Até 2</small></legend><div className="profile-priority-grid">{MUSCLES.map(([value,label])=><button type="button" key={value} className={priorities.includes(value)?'active':''} onClick={()=>togglePriority(value)}>{label}</button>)}</div></fieldset>
    <label>Alguma dor, limitação ou exercício que deve ser evitado? <small>Opcional</small><textarea value={limitations} onChange={(e)=>setLimitations(e.target.value)} placeholder="Ex.: desconforto no joelho ao agachar. O TITAN não usa esta informação para diagnosticar." /></label>
    <label>Objetivo de cardio<select value={cardioGoal} onChange={(e)=>setCardioGoal(e.target.value as CardioGoal)}><option value="health">Saúde cardiovascular</option><option value="conditioning">Melhorar condicionamento</option><option value="5k">Correr 5 km</option><option value="10k">Correr 10 km</option><option value="fat-loss-support">Apoio à perda de gordura</option><option value="none">Sem objetivo de cardio</option></select></label>
    {cardioGoal!=='none'&&<><label>Nível cardiovascular atual<select value={cardioLevel} onChange={(e)=>setCardioLevel(e.target.value as CardioLevel)}><option value="low">Baixo / começando</option><option value="moderate">Moderado</option><option value="high">Alto</option></select></label><label>Dias de cardio/semana<input type="number" min="1" max="5" value={cardioDays} onChange={(e)=>setCardioDays(e.target.value)} /></label></>}
    {error&&<p className="profile-error" role="alert">{error}</p>}<button type="button" className="profile-save" onClick={()=>void saveProfile()} disabled={saving}>{saving?'Salvando…':'Gerar minhas opções'}</button>
  </section></main>;
}
