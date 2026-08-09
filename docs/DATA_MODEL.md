# Modelo de Dados — TITAN FIT

Este documento define o modelo de dados alvo para a evolução do TITAN FIT a partir da v0.40. O objetivo é permitir múltiplos perfis/projetos no futuro sem quebrar os registros já criados no dispositivo.

## Princípios

- Local-first e offline-first.
- Identificadores estáveis e independentes do nome exibido.
- Relações explícitas por `profileId` e `projectId`.
- Histórico nunca depende apenas do plano ativo atual.
- Importação e geração automática convergem para contratos compatíveis.
- Migrações devem preservar dados existentes.

## Entidades principais

### Profile

Representa a pessoa acompanhada pelo TITAN.

Campos mínimos:

```ts
{
  id: string
  displayName: string
  birthDate?: string
  biologicalSex?: string
  heightCm?: number
  currentWeightKg?: number
  primaryGoal?: string
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}
```

### TrainingAssessment

Avaliação usada para montar e revisar a prescrição.

```ts
{
  id: string
  profileId: string
  experience: string
  trainingDaysPerWeek: number
  preferredSessionMinutes: number
  equipmentAccess: string
  availableEquipment?: string[]
  limitations?: Array<{ area: string; note?: string }>
  musclePriorities?: string[]
  preferredExerciseIds?: string[]
  avoidedExerciseIds?: string[]
  availableTrainingDays?: string[]
  cardioGoal: string
  cardioDaysPerWeek?: number
  currentCardioLevel?: string
  createdAt: string
  updatedAt: string
}
```

### Project

Representa um objetivo estruturado e seu ciclo de acompanhamento.

```ts
{
  id: string
  profileId: string
  name: string
  objective: string
  source: 'titan-generated' | 'imported' | 'manual'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}
```

Um perfil pode possuir vários projetos, mas apenas um deve ser considerado ativo por contexto de produto inicialmente.

### TrainingPlan

Plano de musculação associado a um projeto.

Campos estruturais esperados:

```ts
{
  id: string
  profileId: string
  projectId: string
  source: 'titan-generated' | 'imported' | 'manual'
  schemaVersion: number
  name: string
  workouts: WorkoutDefinition[]
  createdAt: string
  updatedAt: string
}
```

### CardioPlan

Plano de cardio associado ao mesmo projeto, preservando independência de atualização em relação à musculação.

```ts
{
  id: string
  profileId: string
  projectId: string
  schemaVersion: number
  sessions: CardioSessionDefinition[]
  createdAt: string
  updatedAt: string
}
```

### GeneratedPlanCandidate

Uma opção de plano criada pela TITAN Engine antes de o usuário ativá-la.

```ts
{
  id: string
  profileId: string
  projectId?: string
  strategy: 'adherence' | 'balanced' | 'availability'
  title: string
  rationale: string[]
  source: 'titan-generated'
  plan: unknown
  createdAt: string
}
```

### WorkoutSession / WorkoutHistory

Snapshot permanente da sessão realizada. Não deve depender de o treino ainda existir na programação atual.

Campos relacionais alvo:

```ts
{
  id: string
  profileId: string
  projectId: string
  planId: string
  workoutId: string
  startedAt: string
  completedAt?: string
  exercises: unknown[]
}
```

### CardioRecord

Registro independente da sessão planejada original.

```ts
{
  id: string
  profileId: string
  projectId: string
  cardioPlanId?: string
  sessionId?: string
  completedAt: string
  durationSeconds: number
  distanceMeters?: number
  averageHeartRate?: number
  perceivedEffort?: number
}
```

### BodyAssessment

Avaliação corporal longitudinal.

```ts
{
  id: string
  profileId: string
  recordedAt: string
  weightKg?: number
  bodyFatPercent?: number
  muscleMassKg?: number
  measurements?: Record<string, number>
  bioimpedance?: unknown
  photos?: unknown[]
}
```

### CoachDecision

Registro auditável das decisões do Coach TITAN.

```ts
{
  id: string
  profileId: string
  projectId?: string
  category: string
  inputSnapshot: unknown
  recommendation: unknown
  rationale: string[]
  confidence?: number
  createdAt: string
}
```

A intenção é permitir explicar por que uma recomendação foi feita e reproduzir decisões importantes posteriormente.

## Relações

```text
Profile 1 ── N TrainingAssessment
Profile 1 ── N Project
Project 1 ── N TrainingPlan
Project 1 ── N CardioPlan
Project 1 ── N GeneratedPlanCandidate
Project 1 ── N WorkoutHistory
Project 1 ── N CardioRecord
Project 1 ── N CoachDecision
Profile 1 ── N BodyAssessment
```

## Estado ativo

O conceito atual de chave global `active` deve evoluir para uma preferência explícita:

```ts
{
  activeProfileId: string
  activeProjectId?: string
  activeTrainingPlanId?: string
  activeCardioPlanId?: string
}
```

Esse estado pode ficar em `preferences`, mas os objetos apontados por ele devem continuar armazenados em stores próprias.

## Stores alvo

A v0.40 pode manter as stores atuais para evitar migração destrutiva. A evolução deve favorecer:

- `profiles`
- `assessments`
- `projects`
- `plans`
- `generated-plan-candidates`
- `coach-decisions`
- `workout-history`
- `cardio-plans`
- `cardio-records`
- `body-assessments`
- `active-sessions`
- `preferences`
- `metadata`

Novas stores devem ser introduzidas por aumento de `TITAN_DB_VERSION` e migração em `onupgradeneeded`.

## Estratégia de migração

1. Ler o plano ativo legado do localStorage.
2. Identificar ou criar o perfil local padrão.
3. Criar um projeto compatível quando o plano legado não possuir `projectId`.
4. Persistir plano e vínculos no IndexedDB.
5. Definir os IDs ativos em `preferences`.
6. Manter leitura de fallback por uma janela de compatibilidade.
7. Somente depois remover o localStorage como fonte de dados de domínio.

A migração deve ser idempotente: executar novamente não pode duplicar projeto, plano ou registros.

## Versionamento

Cada contrato importável deve possuir `schemaVersion`. Mudanças incompatíveis exigem migrador explícito ou rejeição com mensagem clara ao usuário.

O backup deve registrar a versão do banco e da estrutura exportada para impedir restaurações silenciosamente incompatíveis.
