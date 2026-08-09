# Arquitetura do TITAN FIT

Este documento descreve a arquitetura real do TITAN FIT na preparação da v0.40. Ele substitui a descrição histórica da v0.1, que já não representava o código atual.

## Visão geral

O TITAN FIT é uma PWA mobile-first construída com React, TypeScript e Vite. O aplicativo funciona prioritariamente no navegador/instalação Android, mantém os recursos essenciais disponíveis offline e persiste dados no próprio dispositivo.

A arquitetura atual é local-first. O IndexedDB é a base de persistência de longo prazo em evolução, enquanto parte do código legado ainda mantém compatibilidade temporária com localStorage. A v0.40 deve concluir a transição para uma fonte de dados oficial baseada em IndexedDB sem perder registros existentes.

## Camadas

### `src/app`

Responsável por composição principal, bootstrap, navegação e integração das áreas do produto. O `App.tsx` ainda concentra responsabilidades de navegação, PWA, instalação, atualização, projeto ativo, demo e configurações; a v0.40 deve iniciar a extração gradual dessas responsabilidades.

### `src/core`

Infraestrutura compartilhada e independente de uma feature específica.

- `core/database`: IndexedDB, schema, migração de dados legados e reset.
- `core/backup`: exportação, validação e restauração dos dados locais.
- Futuro `core/titan-engine`: regras de avaliação, prescrição, scoring e geração de programas.

### `src/features`

Módulos organizados por domínio funcional. Atualmente existem áreas para dashboard, treino, programação, cardio, progresso/evolução, histórico, perfil, Coach, planos, biblioteca de exercícios, demo e beta.

Cada feature deve preferencialmente conter seus próprios tipos, regras, componentes, repositórios e testes, evitando dependência direta entre interfaces de features distintas quando uma abstração de domínio resolver o problema.

### `src/ui`

Componentes visuais reutilizáveis e elementos sem regra de negócio específica.

### `src/styles`

Tokens, layout mobile, estados visuais e estilos globais da aplicação.

### `tests`

Testes de comportamento e regressão executados pelo Vitest. O CI valida lint, typecheck, testes, build e validação estrutural do projeto.

## Persistência atual

O banco IndexedDB utiliza o nome `titan-fit` e schema versionado. As stores atuais são:

- `metadata`
- `profiles`
- `assessments`
- `plans`
- `generated-plan-candidates`
- `coach-decisions`
- `workout-history`
- `cardio-plans`
- `cardio-records`
- `active-sessions`
- `preferences`

Parte da aplicação ainda usa localStorage como origem ou espelho para compatibilidade com versões anteriores. Essa duplicidade é transitória e deve ser removida de forma segura por migração.

## Modelo de produto alvo

A arquitetura deve evoluir para quatro blocos claramente separados:

```text
TITAN FIT UI
    ↓
TITAN ENGINE
    ↓
KNOWLEDGE BASE
    ↓
TITAN DATA
```

### TITAN FIT UI

Interface mobile, navegação, execução de treino, cardio, registro e visualização dos dados.

### TITAN ENGINE

Camada determinística responsável por avaliar perfil e contexto, aplicar regras de segurança e prescrição, gerar candidatos de programa, explicar decisões e sugerir progressões.

### KNOWLEDGE BASE

Base versionada de exercícios, padrões de movimento, músculos, equipamentos, restrições, alternativas, parâmetros de hipertrofia/força/cardio e referências que fundamentam as regras do motor.

### TITAN DATA

Perfil, avaliações, projetos, planos, sessões, histórico, evolução, preferências, decisões do Coach e backups.

## Multiusuário

O aplicativo continuará local-first e inicialmente centrado em um usuário, mas os novos modelos devem ser relacionáveis por `profileId` e, quando necessário, `projectId`. Nenhum novo registro de domínio deve depender de uma chave global implícita de usuário.

Modelo alvo simplificado:

```text
Profile
  └── Projects
       ├── Training Plan
       ├── Cardio Plan
       ├── Coach Decisions
       └── Records / Progress
```

## Projetos

Um projeto representa um objetivo ativo ou histórico de uma pessoa. O usuário poderá:

1. criar um projeto por geração do Coach TITAN;
2. importar um projeto TITAN existente;
3. criar/editar programação manualmente quando suportado.

Planos importados e planos gerados devem compartilhar um contrato de domínio compatível para que execução, histórico e progressão não dependam da origem do plano.

## PWA e offline

A aplicação utiliza `vite-plugin-pwa`, service worker, manifest instalável, fallback de navegação e cache dos assets essenciais. O deploy principal atual é GitHub Pages sob `/titan-fit/`.

Mudanças de schema ou cache devem preservar atualização segura do PWA e compatibilidade com dados criados por versões anteriores.

## Regras arquiteturais

1. Não apagar registros do usuário durante uma atualização de schema sem migração explícita.
2. IndexedDB será a fonte oficial para dados de domínio persistentes após a conclusão da transição.
3. localStorage ficará restrito a preferências simples e compatibilidade temporária.
4. Toda entidade persistente importante deve possuir identificador estável e versão quando houver risco de mudança de contrato.
5. Regras de prescrição não devem ficar embutidas em componentes React.
6. Componentes de UI não devem decidir progressão de treino ou seleção de exercícios.
7. A Knowledge Base deve ser versionada e validada por testes.
8. O Coach deve explicar decisões e declarar ausência de dados suficientes.
9. A aplicação deve continuar funcional sem conexão para treino, registro, histórico e consulta dos dados já disponíveis localmente.
10. Mudanças relevantes exigem atualização de documentação, changelog e testes.

## Dívida técnica prioritária para v0.40

- Unificar a versão exibida no app, package e cache do PWA.
- Concluir a migração de plano ativo e demais dados importantes do localStorage para IndexedDB.
- Introduzir relação explícita `profileId → projectId → planos/registros`.
- Extrair responsabilidades do `App.tsx` gradualmente.
- Formalizar `DATA_MODEL.md`.
- Criar a primeira estrutura de `titan-engine` sem acoplar a geração de treino à interface.
