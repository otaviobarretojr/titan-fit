import { describe, expect, it } from 'vitest';
import { generateCardioSchedule } from '../src/features/cardio/generator';
import type { TitanTrainingAssessment } from '../src/features/profile/types';

function assessment(patch: Partial<TitanTrainingAssessment> = {}): TitanTrainingAssessment {
  const now = new Date().toISOString();
  return {
    id:'a1', profileId:'p1', experience:'beginner', trainingDaysPerWeek:4, preferredSessionMinutes:60,
    equipmentAccess:'full-gym', cardioGoal:'health', createdAt:now, updatedAt:now, ...patch,
  };
}

describe('TITAN cardio generator', () => {
  it('não agenda cardio quando o objetivo é none', () => {
    expect(generateCardioSchedule(assessment({ cardioGoal:'none' }))).toEqual([]);
  });

  it('gera base progressiva para 5 km', () => {
    const schedule = generateCardioSchedule(assessment({ cardioGoal:'5k', currentCardioLevel:'low', cardioDaysPerWeek:3 }));
    expect(schedule.length).toBe(3);
    expect(schedule.some((session) => session.type === 'run-walk')).toBe(true);
    expect(schedule.some((session) => session.type === 'zone2')).toBe(true);
  });

  it('gera combinação aeróbica e intervalada para condicionamento', () => {
    const schedule = generateCardioSchedule(assessment({ cardioGoal:'conditioning' }));
    expect(schedule.map((session) => session.type)).toEqual(['zone2','hiit']);
  });
});
