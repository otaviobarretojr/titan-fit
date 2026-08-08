import type { TitanTrainingAssessment } from '../profile/types';
import type { TitanCardioSession } from '../plan/types';

const DAY_NAMES = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

function pickCardioDays(trainingDays: number, requested?: number) {
  const desired = Math.max(1, Math.min(requested ?? (trainingDays >= 5 ? 2 : 3), 4));
  const preferred = trainingDays >= 5 ? [1, 3, 6, 0] : [1, 4, 6, 2];
  return preferred.slice(0, desired);
}

export function generateCardioSchedule(assessment: TitanTrainingAssessment): TitanCardioSession[] {
  if (assessment.cardioGoal === 'none') return [];

  const days = pickCardioDays(assessment.trainingDaysPerWeek, assessment.cardioDaysPerWeek);
  const level = assessment.currentCardioLevel ?? 'low';
  const baseDuration = level === 'low' ? 20 : level === 'moderate' ? 30 : 40;

  if (assessment.cardioGoal === '5k' || assessment.cardioGoal === '10k') {
    const longGoal = assessment.cardioGoal === '10k' ? 'Construir base para 10 km' : 'Construir base para 5 km';
    const sessions: TitanCardioSession[] = [
      { id:'cardio-runwalk', day:DAY_NAMES[days[0]], startTime:'', title:'Corrida + caminhada', type:'run-walk', durationMinutes:baseDuration, phase:'Base', goal:longGoal, instructions:['Alterne corrida leve e caminhada mantendo esforço controlado.','Termine com sensação de que conseguiria continuar por alguns minutos.'] },
      { id:'cardio-zone2', day:DAY_NAMES[days[1] ?? days[0]], startTime:'', title:'Zona 2', type:'zone2', durationMinutes:baseDuration + 10, phase:'Base aeróbica', goal:'Melhorar eficiência cardiovascular', instructions:['Mantenha intensidade confortável e sustentável.','Evite transformar a sessão em treino máximo.'] },
    ];
    if (assessment.cardioGoal === '10k' || days.length >= 3) sessions.push({ id:'cardio-easy-run', day:DAY_NAMES[days[2] ?? 6], startTime:'', title:'Corrida leve', type:'run', durationMinutes:baseDuration, phase:'Base', goal:'Aumentar tolerância contínua à corrida', instructions:['Ritmo fácil, sem buscar recorde.','Reduza para caminhada se a técnica ou a respiração degradarem.'] });
    return sessions;
  }

  if (assessment.cardioGoal === 'conditioning') {
    return [
      { id:'cardio-zone2', day:DAY_NAMES[days[0]], startTime:'', title:'Zona 2', type:'zone2', durationMinutes:baseDuration + 10, phase:'Base', goal:'Aumentar capacidade aeróbica', instructions:['Intensidade confortável e contínua.'] },
      { id:'cardio-intervals', day:DAY_NAMES[days[1] ?? days[0]], startTime:'', title:'Intervalado moderado', type:'hiit', durationMinutes:Math.max(15, baseDuration - 5), phase:'Condicionamento', goal:'Melhorar tolerância a esforços intensos', instructions:['Use blocos curtos de esforço forte com recuperação suficiente.','Evite realizar colado a um treino pesado de pernas.'] },
    ];
  }

  if (assessment.cardioGoal === 'fat-loss-support') {
    return days.slice(0, 3).map((dayIndex, index) => ({ id:`cardio-fatloss-${index+1}`, day:DAY_NAMES[dayIndex], startTime:'', title:'Cardio leve a moderado', type:'zone2', durationMinutes:baseDuration + (index === 0 ? 10 : 0), phase:'Suporte energético', goal:'Aumentar gasto sem comprometer recuperação', instructions:['Priorize intensidade sustentável.','A musculação continua sendo a prioridade do plano.'] }));
  }

  return days.slice(0, 3).map((dayIndex, index) => ({ id:`cardio-health-${index+1}`, day:DAY_NAMES[dayIndex], startTime:'', title:index === 0 ? 'Zona 2' : 'Caminhada ativa', type:index === 0 ? 'zone2' : 'walk', durationMinutes:baseDuration + (index === 0 ? 10 : 0), phase:'Saúde cardiovascular', goal:'Construir consistência cardiovascular', instructions:['Mantenha esforço confortável e regular.'] }));
}
