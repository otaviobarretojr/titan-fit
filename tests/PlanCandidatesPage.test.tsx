import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlanCandidatesPage } from '../src/features/plan/PlanCandidatesPage';
import type { TitanProfile, TitanTrainingAssessment } from '../src/features/profile/types';

const profile: TitanProfile = { id:'p1', displayName:'Otávio', heightCm:176, currentWeightKg:92, primaryGoal:'hypertrophy', createdAt:'2026-08-09', updatedAt:'2026-08-09', onboardingCompleted:true };
const assessment: TitanTrainingAssessment = { id:'a1', profileId:'p1', experience:'intermediate', trainingDaysPerWeek:4, preferredSessionMinutes:60, equipmentAccess:'full-gym', cardioGoal:'health', createdAt:'2026-08-09', updatedAt:'2026-08-09' };

vi.mock('../src/features/plan/candidateRepository', () => ({ saveGeneratedPlanCandidates: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../src/features/project/repository', () => ({ linkPlanToProject: vi.fn() }));
vi.mock('../src/features/plan/storage', () => ({ saveActivePlan: vi.fn() }));
vi.mock('../src/features/plan/generator', () => ({
  generateTitanPlanCandidates: () => [
    { id:'1', profileId:'p1', strategy:'adherence', title:'Maior aderência', rationale:['Sessões menores.'], source:'titan-generated', createdAt:'2026-08-09', recommended:true, titanScore:94, engineMetrics:{ volumeTargetCoverage:92, sessionBalance:95, fatigueScore:96, strategyFit:93 }, plan:{ schemaVersion:1, id:'plan-a', name:'A', createdAt:'2026-08-09', workouts:[{id:'w1',day:'Segunda',title:'Upper',exercises:[]},{id:'w2',day:'Terça',title:'Lower',exercises:[]}], project:{name:'Projeto A',objective:'hypertrophy',cardioSchedule:[]} } },
    { id:'2', profileId:'p1', strategy:'balanced', title:'Equilíbrio', rationale:['Plano equilibrado.'], source:'titan-generated', createdAt:'2026-08-09', recommended:false, titanScore:88, engineMetrics:{ volumeTargetCoverage:90, sessionBalance:90, fatigueScore:84, strategyFit:95 }, plan:{ schemaVersion:1, id:'plan-b', name:'B', createdAt:'2026-08-09', workouts:[{id:'w1',day:'Segunda',title:'Upper',exercises:[]},{id:'w2',day:'Terça',title:'Lower',exercises:[]}], project:{name:'Projeto B',objective:'hypertrophy',cardioSchedule:[]} } },
    { id:'3', profileId:'p1', strategy:'availability', title:'Maior disponibilidade', rationale:['Mais volume.'], source:'titan-generated', createdAt:'2026-08-09', recommended:false, titanScore:81, engineMetrics:{ volumeTargetCoverage:85, sessionBalance:80, fatigueScore:78, strategyFit:90 }, plan:{ schemaVersion:1, id:'plan-c', name:'C', createdAt:'2026-08-09', workouts:[{id:'w1',day:'Segunda',title:'Upper',exercises:[]},{id:'w2',day:'Terça',title:'Lower',exercises:[]}], project:{name:'Projeto C',objective:'hypertrophy',cardioSchedule:[]} } },
  ],
}));

describe('PlanCandidatesPage', () => {
  it('destaca a recomendação calculada pela Engine e não uma estratégia fixa', async () => {
    render(<PlanCandidatesPage profile={profile} assessment={assessment} onActivate={() => undefined} />);
    expect(screen.getByText('RECOMENDAÇÃO TITAN')).toBeInTheDocument();
    expect(screen.getAllByText('Maior aderência').length).toBeGreaterThan(0);
    expect(screen.getByText('★ RECOMENDADO PELO TITAN')).toBeInTheDocument();
    expect(screen.getByLabelText('Score TITAN 94 de 100')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('Upper · Lower')).toBeInTheDocument();
  });
});