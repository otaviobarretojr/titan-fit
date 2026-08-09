import { describe, expect, it } from 'vitest';
import { getExerciseVideo } from '../src/features/exercise-library/videos';
import type { TitanExercise } from '../src/features/plan/types';

const WORKOUT_VIDEO_NAMES = [
  'Supino inclinado com barra','Supino inclinado com halteres','Supino inclinado Smith','Chest press inclinado','Peck deck','Crucifixo inclinado com halteres','Crucifixo inclinado',
  'Desenvolvimento com halteres','Desenvolvimento com barra','Arnold press','Desenvolvimento Arnold','Elevação lateral com halteres','Elevação lateral no cabo','Elevação lateral máquina',
  'Tríceps na polia','Tríceps testa','Mergulho máquina','Tríceps francês com halter','Face pull','Reverse peck deck',
  'Levantamento romeno','Stiff com barra','Levantamento romeno com halteres','Cadeira flexora','Mesa flexora','Flexora em pé','Flexora unilateral','Hip thrust máquina','Ponte de glúteos',
  'Panturrilha em pé','Panturrilha Smith','Panturrilha unilateral','Panturrilha sentada','Panturrilha no leg press',
  'Puxada neutra','Puxada supinada','Puxada alta','Puxada articulada','Barra fixa','Barra fixa assistida','Remada unilateral no cabo','Remada unilateral com halter','Remada sentada','Pullover no cabo','Pullover máquina',
  'Rosca direta','Rosca W','Rosca no cabo','Rosca martelo','Rosca inversa','Flexão de punho','Extensão de punho',"Farmer's walk",'Rosca Scott','Rosca Bayesian',
  'Hack squat','Agachamento búlgaro','Afundo reverso','Leg press','Agachamento Smith','Remada T','Remada com peito apoiado','Crucifixo inverso no cabo'
];

function exercise(name: string): TitanExercise {
  return { id:`audit-${name}`, name, muscleGroup:'Auditoria', exerciseType:'strength', sets:3, minReps:8, maxReps:12 };
}

describe('Modo treino — cobertura de vídeo das alternativas', () => {
  it('resolve vídeo para os nomes usados pela ficha e suas alternativas', () => {
    const missing = WORKOUT_VIDEO_NAMES.filter((name) => !getExerciseVideo(exercise(name)));
    expect(missing, `Exercícios/alternativas sem vídeo: ${missing.join(' | ')}`).toEqual([]);
  });
});
