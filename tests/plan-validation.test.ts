import { extractYouTubeVideoId, validateTitanPlan } from '../src/features/plan/validation';

const validPlan = {
  schemaVersion: 1,
  id: 'plan-1',
  name: 'Hipertrofia A',
  createdAt: '2026-08-06T12:00:00.000Z',
  workouts: [
    {
      id: 'monday',
      day: 'Segunda',
      title: 'Peito e costas',
      exercises: [
        {
          id: 'incline-press',
          name: 'Supino inclinado',
          muscleGroup: 'Peitoral',
          sets: 4,
          minReps: 8,
          maxReps: 10,
          targetRir: 2,
          restSeconds: 120,
          video: { url: 'https://youtu.be/abc123XYZ_0' }
        }
      ]
    }
  ]
};

describe('validação de ficha TITAN', () => {
  it('normaliza uma ficha válida e extrai o ID do YouTube', () => {
    const result = validateTitanPlan(validPlan);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.workouts[0].exercises[0].video?.videoId).toBe('abc123XYZ_0');
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
