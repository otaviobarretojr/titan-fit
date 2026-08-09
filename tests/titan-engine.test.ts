import { describe, expect, it } from 'vitest';
import { generateTitanEngineBlueprints, type TitanEngineAssessment, type TitanEngineExercise } from '../src/core/titan-engine';

const assessment: TitanEngineAssessment = {
  experience: 'intermediate',
  trainingDaysPerWeek: 4,
  preferredSessionMinutes: 60,
  equipmentAccess: 'full-gym',
  musclePriorities: ['chest'],
};

const exercises: TitanEngineExercise[] = [
  { id: 'row', name: 'Remada', primaryMuscle: 'Costas', repRange: [8, 12], defaultRir: 2, restSeconds: 120, technique: [], commonMistakes: [], substitutions: [] },
  { id: 'press', name: 'Supino máquina', primaryMuscle: 'Peitoral', repRange: [8, 12], defaultRir: 2, restSeconds: 120, technique: [], commonMistakes: [], substitutions: [] },
  { id: 'fly', name: 'Crucifixo', primaryMuscle: 'Peitoral', repRange: [10, 15], defaultRir: 2, restSeconds: 90, technique: [], commonMistakes: [], substitutions: [] },
  { id: 'squat', name: 'Agachamento', primaryMuscle: 'Quadríceps', repRange: [6, 10], defaultRir: 2, restSeconds: 150, technique: [], commonMistakes: [], substitutions: [] },
  { id: 'curl', name: 'Rosca direta', primaryMuscle: 'Bíceps', repRange: [8, 12], defaultRir: 2, restSeconds: 90, technique: [], commonMistakes: [], substitutions: [] },
];

const rule = { weeklySetsPerMuscle: [8, 14] as [number, number], maxExercisesPerSession: 6 };

describe('TITAN Engine', () => {
  it('gera três candidatos determinísticos e explicáveis', () => {
    const first = generateTitanEngineBlueprints(assessment, exercises, rule);
    const second = generateTitanEngineBlueprints(assessment, exercises, rule);
    expect(first).toEqual(second);
    expect(first.engineVersion).toBe(1);
    expect(first.candidates.map((candidate) => candidate.strategy)).toEqual(['adherence', 'balanced', 'availability']);
    expect(first.candidates.every((candidate) => candidate.rationale.length > 0)).toBe(true);
  });

  it('mantém prioridade muscular no topo da sessão compatível', () => {
    const balanced = generateTitanEngineBlueprints(assessment, exercises, rule).candidates[1];
    const upper = balanced.workouts.find((workout) => workout.focus === 'upper');
    expect(upper?.exercises[0].primaryMuscle).toBe('Peitoral');
    expect(upper?.exercises[0].priority).toBe(true);
  });

  it('remove exercícios evitados e potencialmente conflitantes com limitações', () => {
    const result = generateTitanEngineBlueprints({ ...assessment, avoidedExerciseIds: ['fly'], limitations: [{ area: 'joelho', note: 'quadríceps' }] }, exercises, rule);
    const ids = result.candidates.flatMap((candidate) => candidate.workouts).flatMap((workout) => workout.exercises).map((exercise) => exercise.id);
    expect(ids).not.toContain('fly');
    expect(ids).not.toContain('squat');
  });

  it('suporta sete dias sem reduzir silenciosamente a frequência informada', () => {
    const result = generateTitanEngineBlueprints({ ...assessment, trainingDaysPerWeek: 7 }, exercises, rule);
    expect(result.candidates.every((candidate) => candidate.workouts.length === 7)).toBe(true);
    expect(result.candidates[1].workouts[6].focus).toBe('full-body');
  });

  it('avisa quando a frequência recebida está fora do intervalo suportado', () => {
    const result = generateTitanEngineBlueprints({ ...assessment, trainingDaysPerWeek: 9 }, exercises, rule);
    expect(result.candidates.every((candidate) => candidate.workouts.length === 7)).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('1 a 7'))).toBe(true);
  });
});
