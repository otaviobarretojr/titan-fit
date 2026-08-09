import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from '../src/features/exercise-library/library';
import { EXERCISE_VIDEO_REGISTRY, getCatalogExerciseVideo, getVideoCoverage } from '../src/features/exercise-library/videoRegistry';

describe('exercise video registry',()=>{
  it('mantém todos os vídeos vinculados a exercícios existentes',()=>{
    const ids=new Set(TITAN_FULL_EXERCISE_CATALOG.map((exercise)=>exercise.id));
    expect(Object.keys(EXERCISE_VIDEO_REGISTRY).every((id)=>ids.has(id))).toBe(true);
  });

  it('registra fonte e status de direitos para toda mídia',()=>{
    for(const video of Object.values(EXERCISE_VIDEO_REGISTRY)){
      expect(video.sourceName.length).toBeGreaterThan(0);
      expect(['embedded-reference','licensed-external','titan-owned']).toContain(video.licenseStatus);
      if(video.provider==='youtube') expect(video.videoId).toBeTruthy();
    }
  });

  it('calcula cobertura e retorna vídeo por exercício',()=>{
    const coverage=getVideoCoverage(TITAN_FULL_EXERCISE_CATALOG);
    expect(coverage.covered).toBe(Object.keys(EXERCISE_VIDEO_REGISTRY).length);
    expect(coverage.total).toBe(TITAN_FULL_EXERCISE_CATALOG.length);
    const exercise=TITAN_FULL_EXERCISE_CATALOG.find((item)=>item.id==='face-pull');
    expect(exercise && getCatalogExerciseVideo(exercise)?.provider).toBe('youtube');
  });

  it('mantém o primeiro lote ampliado de peitoral e costas',()=>{
    expect(Object.keys(EXERCISE_VIDEO_REGISTRY).length).toBeGreaterThanOrEqual(30);
    for(const id of ['chest-press-machine','incline-machine-press','lat-pulldown','seated-row','chest-supported-row','machine-row']){
      expect(EXERCISE_VIDEO_REGISTRY[id]?.provider).toBe('youtube');
      expect(EXERCISE_VIDEO_REGISTRY[id]?.licenseStatus).toBe('embedded-reference');
    }
  });
});
