import { describe, expect, it } from 'vitest';
import { effectiveCardioWeek, getCardioWeekSchedule, getTodayCardioSession } from '../src/features/cardio/currentCardio';
import type { TitanCardioSession, TitanPlan } from '../src/features/plan/types';

function session(week: number, day: string, title: string): TitanCardioSession {
  return { id: `w${week}-${day}`, week, day, title, type: 'run', durationMinutes: 30, startTime: '17:00' } as TitanCardioSession;
}

function plan(cardioSchedule: TitanCardioSession[]): TitanPlan {
  return {
    id: 'weekly-cardio-test',
    name: 'Cardio semanal',
    workouts: [],
    project: { name: 'Cardio semanal', startDate: '2026-01-05', cardioSchedule },
  } as TitanPlan;
}

describe('programação semanal de cardio', () => {
  it('mostra somente as sessões da semana ativa', () => {
    const schedule = Array.from({ length: 8 }, (_, index) => index + 1).flatMap((week) => [
      session(week, 'Terça', `Semana ${week} · Terça`),
      session(week, 'Quarta', `Semana ${week} · Quarta`),
      session(week, 'Sexta', `Semana ${week} · Sexta`),
      session(week, 'Domingo', `Semana ${week} · Domingo`),
    ]);
    const cardioPlan = plan(schedule);
    const week3 = new Date('2026-01-20T12:00:00');

    expect(effectiveCardioWeek(cardioPlan, week3)).toBe(3);
    expect(getCardioWeekSchedule(cardioPlan, week3)).toHaveLength(4);
    expect(getCardioWeekSchedule(cardioPlan, week3).every((item) => item.week === 3)).toBe(true);
  });

  it('mantém a última semana quando o calendário passa do fim do plano', () => {
    const cardioPlan = plan([
      session(7, 'Domingo', 'Semana 7 · Domingo'),
      session(8, 'Domingo', 'Semana 8 · teste 5 km'),
    ]);
    const afterProgram = new Date('2026-04-05T12:00:00');

    expect(effectiveCardioWeek(cardioPlan, afterProgram)).toBe(8);
    expect(getCardioWeekSchedule(cardioPlan, afterProgram).map((item) => item.title)).toEqual(['Semana 8 · teste 5 km']);
    expect(getTodayCardioSession(cardioPlan, afterProgram)?.title).toBe('Semana 8 · teste 5 km');
  });

  it('avança quando existe uma nova semana no plano e mantém a anterior durante lacunas', () => {
    const cardioPlan = plan([
      session(8, 'Terça', 'Semana 8'),
      session(10, 'Terça', 'Semana 10'),
    ]);

    expect(effectiveCardioWeek(cardioPlan, new Date('2026-03-03T12:00:00'))).toBe(8);
    expect(effectiveCardioWeek(cardioPlan, new Date('2026-03-10T12:00:00'))).toBe(10);
  });
});
