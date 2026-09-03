import type { TitanPlan, TitanWorkoutDay } from '../plan/types';

const WEEKDAY: Record<number,string> = { 0:'domingo',1:'segunda',2:'terca',3:'quarta',4:'quinta',5:'sexta',6:'sabado' };
function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}

export function getScheduledWorkout(plan:TitanPlan, date=new Date()): TitanWorkoutDay | null {
  const day = WEEKDAY[date.getDay()];
  if (day === 'sabado') return null;
  return plan.workouts.find((workout)=>normalize(workout.day).includes(day)) ?? null;
}

export function isScheduledRestDay(date=new Date()){ return date.getDay() === 6; }

export function scheduleLabel(date=new Date()){
  return isScheduledRestDay(date) ? 'DESCANSO' : 'ROTINA FIXA';
}
