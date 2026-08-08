import { describe, expect, it } from 'vitest';
import { buildSplitTemplate, getEligibleExercises, getPrescriptionRule, TITAN_COMPLETE_EXERCISE_CATALOG } from '../src/features/exercise-library/prescription';
describe('TITAN exercise prescription',()=>{
 it('mantém uma base ampla para geração e substituições',()=>{expect(TITAN_COMPLETE_EXERCISE_CATALOG.length).toBeGreaterThanOrEqual(110);expect(new Set(TITAN_COMPLETE_EXERCISE_CATALOG.map(e=>e.id)).size).toBe(TITAN_COMPLETE_EXERCISE_CATALOG.length);});
 it('cobre os principais grupos musculares',()=>{const groups=TITAN_COMPLETE_EXERCISE_CATALOG.map(e=>e.primaryMuscle);['Peitoral','Costas','Dorsais','Deltoides','Quadríceps','Posteriores de coxa','Glúteos','Bíceps','Tríceps','Panturrilhas','Core'].forEach(group=>expect(groups).toContain(group));});
 it('reduz complexidade e volume inicial para iniciantes',()=>{const rule=getPrescriptionRule({experience:'beginner',trainingDaysPerWeek:3,preferredSessionMinutes:45,equipmentAccess:'full-gym'});expect(rule.weeklySetsPerMuscle).toEqual([6,10]);expect(rule.maxExercisesPerSession).toBe(5);});
 it('não oferece exercício intermediário a iniciante',()=>{const exercises=getEligibleExercises({experience:'beginner',trainingDaysPerWeek:3,preferredSessionMinutes:60,equipmentAccess:'full-gym'});expect(exercises.some(e=>e.id==='barbell-squat')).toBe(false);expect(exercises.some(e=>e.id==='leg-press')).toBe(true);});
 it('filtra exercícios conforme equipamento',()=>{const exercises=getEligibleExercises({experience:'beginner',trainingDaysPerWeek:3,preferredSessionMinutes:60,equipmentAccess:'bodyweight'});expect(exercises.length).toBeGreaterThan(5);expect(exercises.every(e=>e.equipment.includes('bodyweight'))).toBe(true);});
 it('usa upper/lower em quatro dias e push pull legs em seis',()=>{expect(buildSplitTemplate(4)).toEqual([['upper'],['lower'],['upper'],['lower']]);expect(buildSplitTemplate(6)).toHaveLength(6);});
});
