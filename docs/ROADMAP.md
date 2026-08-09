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

- Atualizar documentação de arquitetura para refletir o código real.
- Formalizar modelo de dados por perfil, projeto, plano e histórico.
- Unificar versão técnica exibida pelo app, package e cache PWA.
- Definir migração segura do plano ativo do localStorage para IndexedDB.
- Preparar o conceito de `activeProfileId` e `activeProjectId`.
- Reduzir responsabilidades concentradas em `App.tsx`.

### Base de prescrição

- Consolidar catálogo estruturado de exercícios.
- Formalizar padrões de movimento, músculos, equipamentos, experiência mínima e limitações.
- Padronizar técnica, erros comuns, substituições, faixas de repetição, RIR e descanso.
- Versionar regras de volume semanal e duração de sessão.
- Manter testes automatizados das regras de elegibilidade e prescrição.

## v0.45 — Profile & Project Core

- Onboarding definitivo de perfil.
- Avaliação de experiência, rotina, disponibilidade, equipamentos, limitações e prioridades.
- Entidade `Project` persistente.
- Fluxo “Criar com TITAN”, “Inserir projeto” e “Configurar manualmente”.
- Migração de usuários atuais para um perfil/projeto padrão sem perda de dados.

## v0.50 — TITAN Engine

- Separar regras de prescrição da interface React.
- Gerar candidatos de programa por estratégias de aderência, equilíbrio e disponibilidade.
- Explicar racional de cada proposta.
- Validar volume, frequência, duração, equipamentos e limitações antes de oferecer um plano.
- Registrar decisões relevantes do Coach.

## v0.55 — Knowledge Base v1

- Biblioteca ampliada e versionada de exercícios.
- Metadados para hipertrofia, força, fadiga, estabilidade e dificuldade técnica.
- Substituições por equipamento, desconforto e padrão de movimento.
- Cobertura visual própria/licenciada conforme política do produto.
- Testes de consistência da base.

## v0.60 — Nutrição

- Refeições planejadas e pendentes.
- Registro total/parcial/não realizado.
- Macros e alternativas equivalentes.
- Redistribuição de macros.
- Resumo diário de calorias e proteína.

## v0.70 — Coach adaptativo e relatórios

- Tendências semanais e mensais.
- Recomendações com confiança declarada.
- Progressão baseada em histórico, técnica, repetições e esforço.
- Alertas de aderência e inconsistência de dados.
- Relatórios de treino, cardio, evolução e nutrição.

## v0.80 — Notificações e offline avançado

- Estrutura para refeições, treino, cardio, água, suplementos e sono.
- Melhorias de atualização offline e cache.
- Proteções adicionais de migração e backup.

## v0.90 — Testes e polimento

- Auditoria mobile completa.
- Acessibilidade.
- Performance.
- Migrações de schema testadas.
- Recuperação de falhas e cenários offline.
- Testes de regressão de importação e backup.

## v1.0 — Primeira versão estável

Critérios principais:

- perfil e projeto estáveis;
- treino e cardio plenamente utilizáveis offline;
- histórico e evolução preservados entre versões;
- importação e geração de projeto funcionando sobre o mesmo domínio;
- backup/restauração confiáveis;
- TITAN Engine testada e explicável;
- documentação sincronizada com o código;
- experiência mobile validada em Android.
