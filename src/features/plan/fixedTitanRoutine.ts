import type { TitanExercise, TitanPlan } from './types';

const strength = (id:string,name:string,muscleGroup:string,sets:number,minReps:number,maxReps:number,restSeconds:number,technique:string,notes?:string): TitanExercise => ({ id,name,muscleGroup,exerciseType:'strength',sets,minReps,maxReps,restSeconds,targetRir:2,technique,...(notes?{notes}:{}) });
const cardio = (id:string,name:string,durationSeconds:number,technique:string): TitanExercise => ({ id,name,muscleGroup:'Cardiorrespiratório',exerciseType:'cardio',durationSeconds,cardioZone:'Leve',technique,notes:'Aquecimento integrado ao treino; não é uma sessão de cardio isolada.' });

export const FIXED_ROUTINE_VERSION = '2026-09-03-shoulder-priority-v1';

export const fixedTitanRoutine: TitanPlan = {
  schemaVersion:1,
  id:'titan-fixed-ppl-shoulder-priority-2026-09',
  projectId:'titan-fixed-ppl-shoulder-priority-2026-09',
  name:'TITAN — PPL + Especialização de Ombros',
  description:'Rotina semanal fixa com sábado de descanso e prioridade em ombros, panturrilhas, antebraços/punhos e core.',
  createdAt:'2026-09-03T12:00:00.000Z',
  author:'TITAN',
  project:{
    name:'PPL + Ombros — Rotina Fixa',
    objective:'Hipertrofia com prioridade em ombros, panturrilhas, antebraços/punhos e core, mantendo desenvolvimento equilibrado de peito, costas e pernas.',
    strengthStartTime:'19:00',
    source:'manual',
    originalAuthor:'TITAN'
  },
  workouts:[
    { id:'fixed-mon-push',day:'Segunda',title:'PUSH',focus:'Peito • Tríceps • estímulo mínimo de ombro',exercises:[
      strength('fixed-incline-press','Supino inclinado','Peitoral superior',3,6,10,150,'Inclinação moderada, escápulas estáveis e descida controlada.'),
      strength('fixed-chest-press','Chest press convergente','Peitoral',3,8,12,120,'Peito alto e trajetória estável, sem projetar os ombros.'),
      strength('fixed-low-high-fly','Crucifixo no cabo de baixo para cima','Peitoral superior',2,10,15,75,'Conduza as mãos em arco ascendente mantendo tensão no peitoral.'),
      strength('fixed-overhead-triceps','Tríceps acima da cabeça','Tríceps',3,8,12,90,'Cotovelos estáveis e alongamento controlado.'),
      strength('fixed-pushdown','Tríceps na polia','Tríceps',3,10,15,75,'Estenda completamente sem movimentar o tronco.')
    ]},
    { id:'fixed-tue-pull',day:'Terça',title:'PULL',focus:'Costas • Bíceps • Antebraço • Punho',exercises:[
      strength('fixed-chest-supported-row','Remada apoiada no peito','Costas',3,6,10,150,'Peito apoiado e cotovelos conduzindo o movimento.'),
      strength('fixed-neutral-pulldown','Puxada alta neutra','Dorsais',3,8,12,120,'Deprima as escápulas e conduza os cotovelos para baixo.'),
      strength('fixed-one-arm-row','Remada unilateral','Costas',2,8,12,120,'Tronco estável e cotovelo em direção ao quadril.'),
      strength('fixed-incline-curl','Rosca inclinada','Bíceps',3,8,12,90,'Braço estável e alongamento controlado.'),
      strength('fixed-hammer-curl','Rosca martelo','Braquial • Antebraço',3,10,15,75,'Punhos neutros e cotovelos estáveis.'),
      strength('fixed-reverse-curl','Rosca inversa','Antebraço • Punho',2,12,15,60,'Pegada pronada, punhos firmes e sem balanço.'),
      strength('fixed-wrist-curl','Flexão de punho','Antebraço • Punho',2,12,20,60,'Amplitude controlada somente pelo punho.')
    ]},
    { id:'fixed-wed-legs',day:'Quarta',title:'LEGS A',focus:'Quadríceps • Posteriores • Joelho • Panturrilha',exercises:[
      cardio('fixed-wed-bike','Bicicleta — aquecimento do joelho',360,'Carga leve e cadência confortável; aumente a amplitude apenas se o joelho permanecer confortável.'),
      strength('fixed-leg-extension','Cadeira extensora','Quadríceps',3,12,15,75,'Movimento controlado em amplitude confortável.','Não force amplitude dolorosa; reduza carga/amplitude se a dor aumentar.'),
      strength('fixed-leg-press','Leg press','Quadríceps • Glúteos',3,8,12,150,'Joelhos acompanhando a direção dos pés e profundidade tolerável.','Não perseguir carga ou profundidade com piora da dor.'),
      strength('fixed-hack-squat','Hack squat / agachamento em máquina','Quadríceps',2,8,12,150,'Desça controladamente até a amplitude confortável.','Substitua se reproduzir claramente a dor do joelho.'),
      strength('fixed-seated-leg-curl-a','Flexora sentada','Posteriores',3,10,15,90,'Quadril apoiado e retorno controlado.'),
      strength('fixed-standing-calf-a','Panturrilha em pé','Panturrilha',4,8,12,75,'Pausa no alongamento e contração completa no topo.')
    ]},
    { id:'fixed-thu-shoulders',day:'Quinta',title:'OMBROS + CORE',focus:'Especialização • Deltoide lateral/posterior • Core',exercises:[
      strength('fixed-shoulder-press','Desenvolvimento máquina','Deltoides',3,6,10,150,'Tronco apoiado e trajetória confortável para os ombros.'),
      strength('fixed-cable-lateral','Elevação lateral no cabo','Deltoide lateral',4,10,15,60,'Tensão contínua e mínimo uso do trapézio.'),
      strength('fixed-machine-lateral','Elevação lateral máquina','Deltoide lateral',3,12,20,60,'Controle a descida e não use impulso.'),
      strength('fixed-reverse-pec-deck','Reverse pec deck','Deltoide posterior',4,12,20,60,'Abra os braços sem elevar os ombros.'),
      strength('fixed-rear-delt-cable','Crucifixo inverso no cabo','Deltoide posterior',2,12,20,60,'Movimento amplo, leve e controlado.'),
      strength('fixed-cable-crunch','Abdominal no cabo','Core • Abdômen',3,10,15,60,'Aproxime costelas e pelve sem puxar com os braços.'),
      strength('fixed-pallof-press','Pallof press','Core',3,10,15,60,'Resista à rotação mantendo pelve e caixa torácica estáveis.')
    ]},
    { id:'fixed-fri-upper',day:'Sexta',title:'UPPER ESPECIALIZAÇÃO',focus:'Costas + Peito • Antebraço/Punho • Panturrilha • Core',exercises:[
      strength('fixed-one-arm-pulldown-b','Puxada unilateral','Dorsais',3,8,12,120,'Cotovelo para baixo e em direção ao quadril.'),
      strength('fixed-seated-row-b','Remada baixa neutra','Costas',3,8,12,120,'Peito alto e finalização com as escápulas.'),
      strength('fixed-incline-machine-b','Supino inclinado máquina','Peitoral superior',3,8,12,120,'Escápulas estáveis e trajetória confortável.'),
      strength('fixed-fly-b','Crucifixo máquina/cabo','Peitoral',2,10,15,75,'Controle o alongamento e mantenha tensão contínua.'),
      strength('fixed-cross-hammer-b','Rosca martelo cruzada','Braquial • Antebraço',2,10,15,75,'Sem girar o tronco.'),
      strength('fixed-wrist-extension-b','Extensão de punho','Antebraço • Punho',2,12,20,60,'Antebraço apoiado e movimento somente do punho.'),
      strength('fixed-seated-calf-b','Panturrilha sentada','Panturrilha',4,10,15,75,'Alongamento completo e pausa no topo.'),
      strength('fixed-dead-bug-b','Dead bug','Core',3,8,12,60,'Mantenha a lombar controlada e mova braços/pernas sem perder a posição.')
    ]},
    { id:'fixed-sun-legs',day:'Domingo',title:'LEGS B',focus:'Posteriores • Glúteos • Panturrilha • Core',exercises:[
      cardio('fixed-sun-bike','Bicicleta — aquecimento do joelho',360,'Carga leve e cadência confortável antes das séries de pernas.'),
      strength('fixed-seated-leg-curl-b','Flexora sentada','Posteriores',3,8,12,90,'Quadril apoiado e retorno controlado.'),
      strength('fixed-rdl','Levantamento romeno','Posteriores • Glúteos',3,6,10,150,'Quadril para trás, coluna neutra e carga próxima ao corpo.'),
      strength('fixed-hip-thrust','Hip thrust','Glúteos',3,8,12,120,'Extensão completa do quadril sem hiperestender a lombar.'),
      strength('fixed-leg-press-b','Leg press — amplitude confortável','Quadríceps • Glúteos',2,10,15,120,'Amplitude tolerável e joelhos alinhados aos pés.','Objetivo é estímulo sem agravar o joelho.'),
      strength('fixed-lying-leg-curl-b','Flexora deitada','Posteriores',2,10,15,75,'Quadril apoiado e excêntrica controlada.'),
      strength('fixed-standing-calf-b','Panturrilha em pé','Panturrilha',4,10,15,75,'Alongamento completo e contração forte no topo.'),
      strength('fixed-leg-raise-b','Elevação de joelhos/pernas','Core • Abdômen',3,10,15,60,'Faça retroversão pélvica no topo e evite balanço.')
    ]}
  ]
};
