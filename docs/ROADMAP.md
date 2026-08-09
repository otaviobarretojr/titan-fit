# Roadmap oficial — TITAN FIT

O roadmap abaixo substitui a sequência histórica simplificada. O código atual já ultrapassou as primeiras etapas de PWA, importação, execução, histórico, cardio, Coach, backup e evolução.

## Histórico consolidado

- v0.1 — Shell mobile e PWA.
- v0.2 — Importação de projeto/ficha.
- v0.3 — Visualização completa da ficha e vídeos.
- v0.4 — Execução série por série.
- v0.5 — Histórico e progressão.
- v0.6 — Cardio e estrutura para 5 km.
- v0.7 — Coach TITAN inicial.
- v0.8 — IndexedDB, backup e migração de dados.
- v0.9 — Dashboard e evolução integrados.
- v0.10–v0.38 — expansão incremental de treino, biblioteca, vídeos, cardio, progressão, UX e testes.

## v0.40 — Foundation Upgrade + base de prescrição

Objetivo: preparar a arquitetura definitiva antes de ampliar a geração inteligente de programas.

### Fundação

- Atualizar documentação de arquitetura para refletir o código real. ✅
- Formalizar modelo de dados por perfil, projeto, plano e histórico. ✅
- Migrar perfil, avaliação e plano ativo para persistência por IDs reais com ponteiros ativos. ✅
- Criar entidade `Project` e store própria no IndexedDB. ✅
- Vincular planos gerados a `profileId` e `projectId`. ✅
- Manter projetos importados sem perfil compatíveis como não atribuídos. ✅
- Unificar versão técnica exibida pelo app, package, lockfile e cache PWA.
- Reduzir responsabilidades concentradas em `App.tsx`.

### Base de prescrição

- Consolidar catálogo estruturado de exercícios.
- Formalizar padrões de movimento, músculos, equipamentos, experiência mínima e limitações.
- Padronizar técnica, erros comuns, substituições, faixas de repetição, RIR e descanso.
- Versionar regras de volume semanal e duração de sessão.
- Manter testes automatizados das regras de elegibilidade e prescrição.

## v0.45 — Profile & Project Core

Objetivo: transformar perfil e projeto em entidades operacionais do produto.

- Lista de projetos em Configurações. ✅
- Status de projeto: ativo, pausado, concluído, arquivado e rascunho. ✅
- Troca de projeto ativo sem apagar histórico. ✅
- Pausar, concluir e arquivar projetos. ✅
- Associar projeto importado sem perfil ao perfil ativo. ✅
- Carregar automaticamente o plano ligado ao projeto selecionado. ✅
- Preservar projetos antigos como ciclos históricos. ✅
- Próximo: tela dedicada de perfil e edição da avaliação.

## v0.50 — TITAN Engine

Objetivo: separar regras de prescrição da interface.

- Criar `core/titan-engine`.
- Avaliar perfil, experiência, dias, duração, equipamentos, prioridades e limitações.
- Gerar candidatos de programação com justificativas.
- Aplicar regras de volume, frequência, distribuição muscular e fadiga.
- Produzir recomendações determinísticas e testáveis.

## v0.60 — Knowledge Base

Objetivo: transformar a Biblioteca TITAN em base de conhecimento estruturada.

- Expandir catálogo de exercícios.
- Versionar evidências e parâmetros de prescrição.
- Melhorar substituições por equipamento, dor e limitação.
- Criar cobertura de testes da base.

## v0.70 — Coach & Progression

- Recomendações contextuais baseadas no histórico real.
- Progressão por técnica, repetições, carga e RIR.
- Tendências de treino, cardio e evolução.
- Decisões do Coach registradas e explicáveis.

## v0.80 — Nutrition & Recovery

- Refeições, macros, pendências e substituições.
- Água, sono, recuperação e suplementação.
- Integração com Score TITAN sem inventar dados ausentes.

## v0.90 — Multi-profile, sync readiness & polish

- Estrutura final para múltiplos perfis.
- Preparação para sincronização futura sem abandonar local-first.
- Testes de atualização, backup, restauração e migração.
- Polimento mobile e acessibilidade.

## v1.0 — Primeira versão estável

- Fluxo completo de perfil → projeto → treino/cardio → registro → evolução → Coach.
- PWA estável, offline e atualizável.
- Backups compatíveis entre versões suportadas.
- Critérios de aceite e documentação finalizados.
