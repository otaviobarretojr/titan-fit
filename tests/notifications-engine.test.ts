import { describe, expect, it } from 'vitest';
import { buildSmartReminders, currentSmartAlerts } from '../src/features/notifications/engine';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/features/notifications/preferences';
import type { TitanPlan } from '../src/features/plan/types';

const now = new Date(2026, 7, 10, 10, 0, 0);
const preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, enabled: true };
const plan: TitanPlan = {
  schemaVersion: 1,
  id: 'plan',
  name: 'Plano',
  createdAt: '2026-08-01T00:00:00',
  project: { name: 'Projeto', objective: 'Teste', strengthStartTime: '19:00' },
  workouts: [{
    id: 'workout-mon',
    day: 'Segunda-feira',
    title: 'Upper + cardio',
    exercises: [
      { id: 'bench', name: 'Supino', muscleGroup: 'Peito' },
      { id: 'cardio-mon', name: 'Zona 2', muscleGroup: 'Cardio', exerciseType: 'cardio', durationSeconds: 1800, cardioZone: 'Zona 2' },
    ],
  }],
};

describe('Notificações inteligentes', () => {
  it('agenda um único lembrete para o treino completo com cardio integrado', () => {
    const reminders = buildSmartReminders({ plan, workoutHistory: [], preferences }, now, 1);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.kind).toBe('workout');
    expect(reminders[0]?.at.getHours()).toBe(18);
    expect(reminders[0]?.at.getMinutes()).toBe(30);
    expect(reminders[0]?.body).toContain('cardio integrado');
  });

  it('não gera alertas internos obsoletos', () => {
    expect(currentSmartAlerts({ plan, workoutHistory: [], preferences }, now)).toEqual([]);
  });

  it('não agenda nada quando os lembretes estão desativados', () => {
    const reminders = buildSmartReminders({ plan, workoutHistory: [], preferences: { ...preferences, enabled: false } }, now, 7);
    expect(reminders).toEqual([]);
  });
});
