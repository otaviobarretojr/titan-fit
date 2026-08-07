import { extractYouTubeVideoId, validateTitanPlan } from '../src/features/plan/validation';

const validPlan = {
  schemaVersion: 1,
  id: 'plan-1',
  name: 'Hipertrofia A',
  createdAt: '2026-08-06T12:00:00.000Z',
  workouts: [{
    id: 'monday', day: 'Segunda', title: 'Peito e costas', exercises: [{
      id: 'incline-press', name: 'Supino inclinado', muscleGroup: 'Peitoral', sets: 4,
      minReps: 8, maxReps: 10, targetRir: 2, restSeconds: 120,
      video: { url: 'https://youtu.be/abc123XYZ_0' }
    }]
  }]
};

describe('validação de ficha TITAN', () => {
  it('migra exercício antigo sem exerciseType para strength', () => {
    const result = validateTitanPlan(validPlan);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.workouts[0].exercises[0].exerciseType).toBe('strength');
      expect(result.plan.workouts[0].exercises[0].video?.videoId).toBe('abc123XYZ_0');
    }
  });

  it('aceita vídeo v2.4 usando videoId sem url', () => {
    const result = validateTitanPlan({ ...validPlan, videoLibrary: { version: '1.0-final', curatedVideos: 45 }, workouts: [{ id: 'monday', day: 'Segunda', title: 'Peito', exercises: [{ id: 'incline-press', name: 'Supino inclinado', muscleGroup: 'Peitoral', exerciseType: 'strength', sets: 4, minReps: 6, maxReps: 9, videoPolicy: 'required', video: { provider: 'youtube', videoId: 'GhfwvlZbLGM', title: 'Execução', channel: 'Canal', status: 'curated' } }] }] });
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.plan.workouts[0].exercises[0].video?.videoId).toBe('GhfwvlZbLGM'); expect(result.plan.videoLibrary?.curatedVideos).toBe(45); }
  });

  it('aceita Farmer Walk por distância sem repetições', () => {
    const result = validateTitanPlan({ ...validPlan, workouts: [{ id: 'carry', day: 'Sábado', title: 'Carries', exercises: [{ id: 'farmer', name: "Farmer's Walk", muscleGroup: 'Corpo inteiro', exerciseType: 'distance', sets: 3, minDistanceMeters: 30, maxDistanceMeters: 40, restSeconds: 90 }] }] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.workouts[0].exercises[0].minReps).toBeUndefined();
  });

  it('aceita cardio com inclinação, zona e progressão semanal', () => {
    const result = validateTitanPlan({ ...validPlan, workouts: [{ id: 'shoulders', day: 'Quinta', title: 'Ombros', exercises: [{ id: 'incline-zone2', name: 'Cardio — Caminhada inclinada em Zona 2', muscleGroup: 'Cardio', exerciseType: 'cardio', durationSeconds: 1200, speedMinKmh: 5.5, speedMaxKmh: 6, inclinePercent: 8, cardioZone: 'Zona 2', progression: [{ startWeek: 1, endWeek: 2, durationSeconds: 1200, inclinePercent: 8, speedMinKmh: 5.5, speedMaxKmh: 6 }] }] }] });
    expect(result.ok).toBe(true);
  });

  it('rejeita versão incompatível e treino sem exercícios', () => {
    const result = validateTitanPlan({ ...validPlan, schemaVersion: 2, workouts: [{ id: 'x', day: 'Segunda', title: 'X', exercises: [] }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/schemaVersion|exercises/);
  });

  it('aceita formatos watch, shorts, embed e youtu.be', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=watch123')).toBe('watch123');
    expect(extractYouTubeVideoId('https://youtube.com/shorts/short123')).toBe('short123');
    expect(extractYouTubeVideoId('https://youtube.com/embed/embed123')).toBe('embed123');
    expect(extractYouTubeVideoId('https://youtu.be/shortLink')).toBe('shortLink');
  });
});
