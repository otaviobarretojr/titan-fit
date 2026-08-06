import type { ExerciseDefinition } from './domain';

export const TITAN_EXERCISES: ExerciseDefinition[] = [
  {
    id: '8fd1454d-3149-43a1-9e4a-01d01be947ef',
    code: 'CHEST_001',
    slug: 'supino-inclinado-barra',
    name: 'Supino inclinado com barra',
    muscleGroup: 'chest',
    primaryMuscles: ['Peitoral superior'],
    secondaryMuscles: ['Deltoide anterior', 'Tríceps'],
    category: 'compound',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    priority: 'primary',
    tags: ['peitoral-superior', 'empurrar', 'composto', 'barra'],
    technique: [
      'Ajuste o banco entre 20 e 35 graus.',
      'Mantenha as escápulas retraídas e o peito elevado.',
      'Desça a barra de forma controlada até a região superior do peito.',
      'Empurre mantendo punhos e cotovelos alinhados.'
    ],
    commonMistakes: ['Inclinação excessiva do banco', 'Perder a retração escapular', 'Quicar a barra no peito'],
    alternativeExerciseCodes: ['CHEST_002'],
    metrics: { stability: 4, progressionEase: 5, systemicFatigue: 3, safety: 4, learningCurve: 3 }
  },
  {
    id: '42a5577d-0f4c-40ff-bfd6-e2f83ac93645',
    code: 'CHEST_002',
    slug: 'supino-inclinado-halteres',
    name: 'Supino inclinado com halteres',
    muscleGroup: 'chest',
    primaryMuscles: ['Peitoral superior'],
    secondaryMuscles: ['Deltoide anterior', 'Tríceps'],
    category: 'compound',
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
    priority: 'primary',
    tags: ['peitoral-superior', 'empurrar', 'composto', 'halteres'],
    technique: [
      'Ajuste o banco entre 20 e 35 graus.',
      'Mantenha os pés firmes e as escápulas retraídas.',
      'Desça os halteres até sentir alongamento confortável no peitoral.',
      'Suba sem bater os halteres no topo.'
    ],
    commonMistakes: ['Banco muito inclinado', 'Amplitude encurtada', 'Perder controle na descida'],
    alternativeExerciseCodes: ['CHEST_001'],
    metrics: { stability: 3, progressionEase: 4, systemicFatigue: 3, safety: 4, learningCurve: 3 }
  },
  {
    id: '97ae78e0-240e-4a62-907c-a8c07ae6828f',
    code: 'BACK_001',
    slug: 'puxada-alta-aberta',
    name: 'Puxada alta aberta',
    muscleGroup: 'back',
    primaryMuscles: ['Dorsal largo'],
    secondaryMuscles: ['Bíceps', 'Redondo maior'],
    category: 'compound',
    equipment: ['cable', 'machine'],
    difficulty: 'beginner',
    priority: 'primary',
    tags: ['dorsais', 'puxar', 'vertical', 'polia'],
    technique: [
      'Mantenha o tronco levemente inclinado para trás.',
      'Inicie o movimento deprimindo as escápulas.',
      'Puxe os cotovelos para baixo até a barra se aproximar do peito.',
      'Controle o retorno sem perder a posição do tronco.'
    ],
    commonMistakes: ['Puxar atrás da cabeça', 'Usar balanço excessivo', 'Encolher os ombros'],
    alternativeExerciseCodes: ['BACK_002'],
    metrics: { stability: 5, progressionEase: 5, systemicFatigue: 2, safety: 5, learningCurve: 2 }
  },
  {
    id: 'b10a2f0a-2484-472c-9508-d2eab5ae4cce',
    code: 'BACK_002',
    slug: 'remada-articulada',
    name: 'Remada articulada',
    muscleGroup: 'back',
    primaryMuscles: ['Dorsais', 'Romboides'],
    secondaryMuscles: ['Bíceps', 'Deltoide posterior'],
    category: 'compound',
    equipment: ['machine'],
    difficulty: 'beginner',
    priority: 'primary',
    tags: ['dorsais', 'puxar', 'horizontal', 'maquina'],
    technique: [
      'Apoie o peito firmemente no suporte.',
      'Inicie puxando os cotovelos para trás e para baixo.',
      'Evite elevar os ombros durante a contração.',
      'Retorne até alongar as costas sem perder o controle.'
    ],
    commonMistakes: ['Retirar o peito do apoio', 'Encolher os ombros', 'Usar amplitude curta'],
    alternativeExerciseCodes: ['BACK_001'],
    metrics: { stability: 5, progressionEase: 5, systemicFatigue: 2, safety: 5, learningCurve: 1 }
  },
  {
    id: '5f9ab8f6-6ed7-4f3a-90ff-953ee59f5229',
    code: 'SHOULDER_001',
    slug: 'elevacao-lateral-polia',
    name: 'Elevação lateral na polia',
    muscleGroup: 'shoulders',
    primaryMuscles: ['Deltoide lateral'],
    secondaryMuscles: ['Supraespinal'],
    category: 'isolation',
    equipment: ['cable'],
    difficulty: 'intermediate',
    priority: 'primary',
    tags: ['deltoide-lateral', 'isolador', 'polia'],
    technique: [
      'Posicione a polia na regulagem mais baixa.',
      'Mantenha o cotovelo levemente flexionado.',
      'Eleve o braço no plano da escápula até aproximadamente a linha do ombro.',
      'Controle a descida mantendo tensão contínua.'
    ],
    commonMistakes: ['Usar impulso do tronco', 'Elevar muito acima dos ombros', 'Encolher os ombros'],
    alternativeExerciseCodes: ['SHOULDER_002'],
    metrics: { stability: 4, progressionEase: 4, systemicFatigue: 1, safety: 5, learningCurve: 2 }
  },
  {
    id: 'd2018593-8eb8-440d-9ff4-f54f9c683880',
    code: 'SHOULDER_002',
    slug: 'elevacao-lateral-maquina',
    name: 'Elevação lateral na máquina',
    muscleGroup: 'shoulders',
    primaryMuscles: ['Deltoide lateral'],
    secondaryMuscles: ['Supraespinal'],
    category: 'isolation',
    equipment: ['machine'],
    difficulty: 'beginner',
    priority: 'primary',
    tags: ['deltoide-lateral', 'isolador', 'maquina'],
    technique: [
      'Ajuste o assento para alinhar os ombros ao eixo da máquina.',
      'Mantenha o tronco apoiado e os ombros baixos.',
      'Eleve os braços até a linha dos ombros.',
      'Retorne lentamente sem deixar as placas baterem.'
    ],
    commonMistakes: ['Assento mal ajustado', 'Encolher os ombros', 'Perder tensão no final da descida'],
    alternativeExerciseCodes: ['SHOULDER_001'],
    metrics: { stability: 5, progressionEase: 5, systemicFatigue: 1, safety: 5, learningCurve: 1 }
  }
];
