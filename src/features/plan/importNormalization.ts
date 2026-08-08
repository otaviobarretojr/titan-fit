import type { TitanPlan } from './types';

export type ImportedPlanSummary = { workouts:number; strengthExercises:number; cardioSessions:number; warnings:string[] };

export function normalizeImportedPlan(plan:TitanPlan, sourceFile?:string):TitanPlan {
  const importedAt=new Date().toISOString(); const originalAuthor=plan.author?.trim()||'Autor externo';
  return { ...plan, id:plan.id||crypto.randomUUID(), author:originalAuthor, description:[plan.description,`Importado para o TITAN em ${importedAt}. Origem externa preservada.`].filter(Boolean).join(' '), project:{ ...(plan.project??{name:plan.name,objective:'Projeto importado'}), source:'imported', originalAuthor, importedAt, ...(sourceFile?{sourceFile}:{}) } };
}

export function summarizeImportedPlan(plan:TitanPlan):ImportedPlanSummary {
  const warnings:string[]=[];
  const strengthExercises=plan.workouts.reduce((total,workout)=>total+workout.exercises.filter((exercise)=>(exercise.exerciseType??'strength')==='strength').length,0);
  const cardioEmbedded=plan.workouts.reduce((total,workout)=>total+workout.exercises.filter((exercise)=>['cardio','distance'].includes(exercise.exerciseType??'')).length,0);
  const cardioScheduled=plan.project?.cardioSchedule?.length??0;
  if(!plan.author)warnings.push('O arquivo não informa o autor original.');
  if(!plan.workouts.length)warnings.push('O projeto não possui treinos de musculação.');
  if(!cardioScheduled&&!cardioEmbedded)warnings.push('O projeto não possui cardio estruturado.');
  return{workouts:plan.workouts.length,strengthExercises,cardioSessions:cardioScheduled+cardioEmbedded,warnings};
}
