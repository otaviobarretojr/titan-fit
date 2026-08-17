import { describe, expect, it } from 'vitest';
import { calculateStrengthPr, sameExerciseIdentity } from '../src/features/history/intelligence';
import type { WorkoutHistoryRecord } from '../src/features/history/types';

const record: WorkoutHistoryRecord = { id:'r1', planId:'p', planName:'P', workoutId:'w', workoutTitle:'W', workoutDay:'Segunda', startedAt:'2026-08-10T20:00:00.000Z', completedAt:'2026-08-10T21:00:00.000Z', durationSeconds:3600, totalSets:2, totalVolumeKg:0, exercises:[{ exerciseId:'machine-row', name:'Remada máquina', muscleGroup:'Costas', exerciseType:'strength', volumeKg:0, bestWeightKg:80, totalDistanceMeters:0, totalDurationSeconds:0, bestSpeedKmh:null, bestInclinePercent:null, averageHeartRate:null, sets:[{ setNumber:1, weightKg:80, repetitions:8, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null },{ setNumber:2, weightKg:70, repetitions:12, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null }] }] };

describe('PR engine v0.59.3', () => {
  it('reconhece identidade canônica entre revisões de projeto', () => { expect(sameExerciseIdentity('machine-row', 'machine-row--workout-upper-b--e2a2')).toBe(true); });
  it('prioriza maior carga e usa repetições como desempate', () => { const pr = calculateStrengthPr([record], 'machine-row--workout-upper-b--e2a2'); expect(pr.bestSet?.weightKg).toBe(80); expect(pr.bestSet?.repetitions).toBe(8); });
});
