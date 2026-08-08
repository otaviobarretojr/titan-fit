import { describe, expect, it } from 'vitest';
import { generateTitanPlanCandidates } from '../src/features/plan/generator';
import type { TitanProfile, TitanTrainingAssessment } from '../src/features/profile/types';
const profile:TitanProfile={id:'p1',displayName:'Teste',heightCm:176,currentWeightKg:80,primaryGoal:'hypertrophy',createdAt:'2026-08-08',updatedAt:'2026-08-08',onboardingCompleted:true};
const assessment:TitanTrainingAssessment={id:'a1',profileId:'p1',experience:'beginner',trainingDaysPerWeek:4,preferredSessionMinutes:60,equipmentAccess:'full-gym',cardioGoal:'health',createdAt:'2026-08-08',updatedAt:'2026-08-08'};
describe('TITAN plan generator',()=>{
 it('gera três estratégias para o mesmo perfil',()=>{const candidates=generateTitanPlanCandidates(profile,assessment);expect(candidates).toHaveLength(3);expect(candidates.map(c=>c.strategy)).toEqual(['adherence','balanced','availability']);});
 it('respeita o número de dias informado',()=>{expect(generateTitanPlanCandidates(profile,assessment).every(c=>c.plan.workouts.length===4)).toBe(true);});
 it('marca o plano como criado pelo TITAN e inclui justificativa',()=>{const balanced=generateTitanPlanCandidates(profile,assessment)[1];expect(balanced.source).toBe('titan-generated');expect(balanced.plan.author).toBe('TITAN');expect(balanced.rationale.length).toBeGreaterThan(0);});
 it('eleva prioridade muscular na seleção e justificativa',()=>{const personalized={...assessment,musclePriorities:['chest' as const]};const balanced=generateTitanPlanCandidates(profile,personalized)[1];expect(balanced.rationale.some(r=>r.includes('Prioriza'))).toBe(true);const push=balanced.plan.workouts.find(w=>w.focus==='upper');expect(push?.exercises[0]?.muscleGroup).toBe('Peitoral');});
 it('não inclui exercício explicitamente evitado',()=>{const personalized={...assessment,avoidedExerciseIds:['chest-press-machine']};const plans=generateTitanPlanCandidates(profile,personalized);expect(plans.flatMap(c=>c.plan.workouts).flatMap(w=>w.exercises).some(e=>e.id==='chest-press-machine')).toBe(false);});
});
