import { describe, expect, it } from 'vitest';
import { normalizeImportedPlan, summarizeImportedPlan } from '../src/features/plan/importNormalization';
import type { TitanPlan } from '../src/features/plan/types';

const plan:TitanPlan={schemaVersion:1,id:'external-1',name:'Ficha do Personal',author:'Personal Teste',createdAt:'2026-08-01',project:{name:'Projeto externo',objective:'Hipertrofia',cardioSchedule:[]},workouts:[{id:'a',day:'Segunda',title:'Upper',exercises:[{id:'supino',name:'Supino',muscleGroup:'Peitoral',exerciseType:'strength',sets:3,minReps:8,maxReps:12}]}]};

describe('importação de projeto 2.0',()=>{
  it('preserva autor e identifica origem externa',()=>{const normalized=normalizeImportedPlan(plan,'projeto.titan');expect(normalized.author).toBe('Personal Teste');expect(normalized.project?.source).toBe('imported');expect(normalized.project?.originalAuthor).toBe('Personal Teste');expect(normalized.project?.sourceFile).toBe('projeto.titan');expect(normalized.project?.importedAt).toBeTruthy();});
  it('resume musculação e avisa ausência de cardio',()=>{const summary=summarizeImportedPlan(plan);expect(summary.workouts).toBe(1);expect(summary.strengthExercises).toBe(1);expect(summary.cardioSessions).toBe(0);expect(summary.warnings.some((warning)=>warning.includes('cardio'))).toBe(true);});
});
