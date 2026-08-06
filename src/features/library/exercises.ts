import type { ExerciseDefinition } from './types';

export const TITAN_EXERCISES: readonly ExerciseDefinition[] = [
  {
    id: 'CHEST_001',
    slug: 'supino-inclinado-barra',
    name: 'Supino Inclinado com Barra',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    category: 'compound',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    priority: 'priority',
    tags: ['peitoral superior', 'empurrar', 'composto', 'progressão de carga'],
    instructions: [
      'Ajuste o banco entre 20 e 35 graus.',
      'Mantenha escápulas retraídas e pés firmes no chão.',
      'Desça a barra de forma controlada até a região superior do peito.',
      'Empurre sem perder a posição dos ombros.'
    ],
    commonMistakes: [
      'Inclinação excessiva do banco.',
      'Abrir demais os cotovelos.',
      'Quicar a barra no peito.',
      'Elevar o quadril para concluir a repetição.'
    ],
    alternatives: ['CHEST_002'],
    profile: { stability: 4, progressionEase: 5, systemicFatigue: 3, learningCurve: 3 }
  },
  {
    id: 'CHEST_002',
    slug: 'supino-inclinado-halteres',
    name: 'Supino Inclinado com Halteres',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    category: 'compound',
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
    priority: 'priority',
    tags: ['peitoral superior', 'empurrar', 'halteres', 'amplitude'],
    instructions: [
      'Ajuste o banco entre 20 e 35 graus.',
      'Posicione os halteres sobre a linha do peitoral superior.',
      'Desça até uma amplitude confortável mantendo o antebraço estável.',
      'Suba aproximando os halteres sem bater um no outro.'
    ],
    commonMistakes: [
      'Usar banco muito inclinado.',
      'Perder a retração escapular.',
      'Descer além da mobilidade disponível.',
      'Transformar o movimento em desenvolvimento de ombros.'
    ],
    alternatives: ['CHEST_001'],
    profile: { stability: 3, progressionEase: 4, systemicFatigue: 3, learningCurve: 3 }
  },
  {
    id: 'BACK_001',
    slug: 'puxada-alta-pegada-neutra',
    name: 'Puxada Alta com Pegada Neutra',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'forearms'],
    category: 'compound',
    equipment: ['cable'],
    difficulty: 'beginner',
    priority: 'priority',
    tags: ['dorsais', 'puxada vertical', 'estável', 'amplitude'],
    instructions: [
      'Mantenha o peito elevado e o tronco estável.',
      'Inicie o movimento deprimindo as escápulas.',
      'Conduza os cotovelos para baixo em direção ao tronco.',
      'Retorne controlando o alongamento das dorsais.'
    ],
    commonMistakes: [
      'Inclinar o tronco excessivamente.',
      'Puxar apenas com os braços.',
      'Encurtar a fase de alongamento.',
      'Usar impulso para mover a carga.'
    ],
    alternatives: ['BACK_002'],
    profile: { stability: 5, progressionEase: 4, systemicFatigue: 2, learningCurve: 2 }
  },
  {
    id: 'BACK_002',
    slug: 'remada-articulada-apoiada',
    name: 'Remada Articulada com Apoio no Peito',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'forearms', 'shoulders'],
    category: 'compound',
    equipment: ['machine'],
    difficulty: 'beginner',
    priority: 'priority',
    tags: ['dorsais', 'espessura', 'remada horizontal', 'apoio no peito'],
    instructions: [
      'Ajuste o banco para manter o peito apoiado durante toda a série.',
      'Inicie com os braços estendidos sem arredondar a lombar.',
      'Puxe os cotovelos para trás mantendo os ombros longe das orelhas.',
      'Controle a volta até sentir alongamento nas costas.'
    ],
    commonMistakes: [
      'Retirar o peito do apoio.',
      'Encolher os ombros durante a puxada.',
      'Reduzir a amplitude para aumentar a carga.',
      'Flexionar excessivamente os punhos.'
    ],
    alternatives: ['BACK_001'],
    profile: { stability: 5, progressionEase: 5, systemicFatigue: 2, learningCurve: 2 }
  },
  {
    id: 'SHOULDER_001',
    slug: 'elevacao-lateral-polia',
    name: 'Elevação Lateral na Polia',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    category: 'isolation',
    equipment: ['cable'],
    difficulty: 'intermediate',
    priority: 'priority',
    tags: ['deltoide lateral', 'isolador', 'tensão contínua', 'unilateral'],
    instructions: [
      'Posicione a polia baixa e mantenha o tronco estável.',
      'Conduza o braço lateralmente com o cotovelo levemente flexionado.',
      'Suba até aproximadamente a linha do ombro.',
      'Controle a descida sem deixar a pilha de pesos descansar.'
    ],
    commonMistakes: [
      'Usar balanço do tronco.',
      'Elevar o ombro em direção à orelha.',
      'Girar excessivamente o braço para dentro.',
      'Transformar o movimento em puxada.'
    ],
    alternatives: ['SHOULDER_002'],
    profile: { stability: 4, progressionEase: 3, systemicFatigue: 1, learningCurve: 3 }
  },
  {
    id: 'SHOULDER_002',
    slug: 'elevacao-lateral-maquina',
    name: 'Elevação Lateral na Máquina',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    category: 'isolation',
    equipment: ['machine'],
    difficulty: 'beginner',
    priority: 'priority',
    tags: ['deltoide lateral', 'isolador', 'estável', 'progressão'],
    instructions: [
      'Ajuste o assento para alinhar o eixo da máquina aos ombros.',
      'Mantenha o tronco apoiado e o pescoço relaxado.',
      'Eleve os braços até a linha dos ombros.',
      'Desça lentamente mantendo tensão no deltoide lateral.'
    ],
    commonMistakes: [
      'Retirar o tronco do apoio.',
      'Elevar os ombros durante a repetição.',
      'Usar amplitude curta.',
      'Soltar a carga na fase excêntrica.'
    ],
    alternatives: ['SHOULDER_001'],
    profile: { stability: 5, progressionEase: 4, systemicFatigue: 1, learningCurve: 1 }
  }
] as const;
