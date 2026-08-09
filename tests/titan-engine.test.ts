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
  { id: 'row', name: 'Remada', primaryMuscle: 'Costas', movementPattern: 'horizontal-pull', repRange: [8, 12], defaultRir: 2, restSeconds: 120, technique: '', commonMistakes: [], substitutions: [] },
  { id: 'press', name: 'Supino máquina', primaryMuscle: 'Peitoral', movementPattern: 'horizontal-push', repRange: [8, 12], defaultRir: 2, restSeconds: 120, technique: '', commonMistakes: [], substitutions: [] },
  { id: 'fly', name: 'Crucifixo', primaryMuscle: 'Peitoral', movementPattern: 'horizontal-push', repRange: [10, 15], defaultRir: 2, restSeconds: 90, technique: '', commonMistakes: [], substitutions: [] },
  { id: 'squat', name: 'Agachamento', primaryMuscle: 'Quadríceps', movementPattern: 'squat', repRange: [6, 10], defaultRir: 2, restSeconds: 150, technique: '', commonMistakes: [], substitutions: [] },
  { id: 'curl', name: 'Rosca direta', primaryMuscle: 'Bíceps', movementPattern: 'elbow-flexion', repRange: [8, 12], defaultRir: 2, restSeconds: 90, technique: '', commonMistakes: [], substitutions: [] },
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

  it('calcula volume, frequência, fadiga, equilíbrio e score para cada candidato', () => {
    const result = generateTitanEngineBlueprints(assessment, exercises, rule);
    for (const candidate of result.candidates) {
      expect(Object.keys(candidate.metrics.weeklySetsByMuscle).length).toBeGreaterThan(0);
      expect(Object.keys(candidate.metrics.weeklyFrequencyByMuscle).length).toBeGreaterThan(0);
      expect(candidate.metrics.volumeTargetCoverage).toBeGreaterThanOrEqual(0);
      expect(candidate.metrics.volumeTargetCoverage).toBeLessThanOrEqual(100);
      expect(candidate.metrics.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(candidate.metrics.frequencyScore).toBeLessThanOrEqual(100);
      expect(candidate.metrics.sessionBalance).toBeGreaterThanOrEqual(0);
      expect(candidate.metrics.fatigueScore).toBeGreaterThanOrEqual(0);
      expect(candidate.metrics.score).toBeGreaterThanOrEqual(0);
      expect(candidate.metrics.score).toBeLessThanOrEqual(100);
    }
  });

  it('limita volume semanal ao teto e permite margem controlada para prioridade', () => {
    const result = generateTitanEngineBlueprints({ ...assessment, trainingDaysPerWeek: 7 }, exercises, rule);
    for (const candidate of result.candidates) {
      expect(candidate.metrics.weeklySetsByMuscle.Costas ?? 0).toBeLessThanOrEqual(14);
      expect(candidate.metrics.weeklySetsByMuscle.Quadríceps ?? 0).toBeLessThanOrEqual(14);
      expect(candidate.metrics.weeklySetsByMuscle.Peitoral ?? 0).toBeLessThanOrEqual(Math.round(14 * 1.15));
    }
  });

  it('distribui músculos em mais de uma sessão quando a rotina tem quatro dias ou mais', () => {
    const balanced = generateTitanEngineBlueprints(assessment, exercises, rule).candidates[1];
    expect(balanced.metrics.weeklyFrequencyByMuscle.Peitoral).toBeGreaterThanOrEqual(2);
    expect(balanced.metrics.weeklyFrequencyByMuscle.Costas).toBeGreaterThanOrEqual(2);
    expect(balanced.metrics.frequencyScore).toBeGreaterThanOrEqual(75);
  });

  it('não ultrapassa o limite de exercícios por sessão', () => {
    const result = generateTitanEngineBlueprints({ ...assessment, trainingDaysPerWeek: 6 }, exercises, rule);
    for (const candidate of result.candidates) {
      for (const workout of candidate.workouts) expect(workout.exercises.length).toBeLessThanOrEqual(rule.maxExercisesPerSession);
    }
  });

  it('penaliza mais uma sessão com descansos longos na métrica de fadiga', () => {
    const longRestExercises = exercises.map((exercise) => ({ ...exercise, restSeconds: 180 }));
    const shortRestExercises = exercises.map((exercise) => ({ ...exercise, restSeconds: 60 }));
    const longRest = generateTitanEngineBlueprints(assessment, longRestExercises, rule).candidates[1].metrics.fatigueScore;
    const shortRest = generateTitanEngineBlueprints(assessment, shortRestExercises, rule).candidates[1].metrics.fatigueScore;
    expect(longRest).toBeLessThanOrEqual(shortRest);
  });

  it('evita clonar sessões repetidas quando há alternativas equivalentes no pool', () => {
    const richPool: TitanEngineExercise[] = [
      { ...exercises[1], id: 'press-a' }, { ...exercises[1], id: 'press-b' }, { ...exercises[2], id: 'fly-a' },
      { ...exercises[0], id: 'row-a' }, { ...exercises[0], id: 'row-b' }, { ...exercises[0], id: 'row-c' },
      { ...exercises[3], id: 'squat-a' }, { ...exercises[3], id: 'squat-b' },
      { ...exercises[4], id: 'curl-a' }, { ...exercises[4], id: 'curl-b' }, { ...exercises[4], id: 'curl-c' },
      { id: 'triceps-a', name: 'Tríceps', primaryMuscle: 'Tríceps', movementPattern: 'elbow-extension', repRange: [8, 15], defaultRir: 1, restSeconds: 90, technique: '', commonMistakes: [], substitutions: [] },
      { id: 'shoulder-a', name: 'Desenvolvimento', primaryMuscle: 'Deltoides', movementPattern: 'vertical-push', repRange: [6, 12], defaultRir: 2, restSeconds: 120, technique: '', commonMistakes: [], substitutions: [] },
      { id: 'ham-a', name: 'RDL', primaryMuscle: 'Posteriores de coxa', movementPattern: 'hinge', repRange: [6, 10], defaultRir: 2, restSeconds: 150, technique: '', commonMistakes: [], substitutions: [] },
    ];
    const balanced = generateTitanEngineBlueprints({ ...assessment, trainingDaysPerWeek: 6 }, richPool, rule).candidates[1];
    const pushDays = balanced.workouts.filter((workout) => workout.focus === 'push');
    expect(pushDays).toHaveLength(2);
    expect(pushDays[0].exercises.map((exercise) => exercise.id)).not.toEqual(pushDays[1].exercises.map((exercise) => exercise.id));
    const pullDays = balanced.workouts.filter((workout) => workout.focus === 'pull');
    expect(pullDays[0].exercises.map((exercise) => exercise.id)).not.toEqual(pullDays[1].exercises.map((exercise) => exercise.id));
  });

  it('marca exatamente uma estratégia como recomendada e explica a escolha', () => {
    const result = generateTitanEngineBlueprints(assessment, exercises, rule);
    expect(result.candidates.filter((candidate) => candidate.recommended)).toHaveLength(1);
    expect(result.candidates.find((candidate) => candidate.recommended)?.strategy).toBe(result.recommendedStrategy);
    expect(result.recommendationReasons.length).toBeGreaterThan(0);
    expect(result.recommendationReasons[0]).toContain('Score TITAN');
  });
});
