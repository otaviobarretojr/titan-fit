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

- [x] Atualizar documentação de arquitetura para refletir o código real.
- [x] Formalizar modelo de dados por perfil, projeto, plano e histórico.
- [x] Preparar carregamento preferencial do plano ativo pelo IndexedDB com fallback legado.
- [ ] Unificar versão técnica exibida pelo app, package, lockfile e cache PWA com validação automática.
- [ ] Introduzir `activeProfileId` e `activeProjectId` sem quebrar dados existentes.
- [ ] Criar testes específicos de migração e compatibilidade de persistência.
- [ ] Reduzir responsabilidades concentradas em `App.tsx`.

### Base de prescrição

- Consolidar catálogo estruturado de exercícios.
- Formalizar padrões de movimento, músculos, equipamentos, experiência mínima e limitações.
- Padronizar técnica, erros comuns, substituições, faixas de repetição, RIR e descanso.
- Versionar regras de volume semanal e duração de sessão.
- Manter testes automatizados das regras de elegibilidade e prescrição.

## v0.45 — Profile & Project Core

Objetivo: transformar o perfil atual em um núcleo capaz de suportar projetos independentes e múltiplos usuários no futuro.

- Introduzir entidade `Project` separada do plano.
- Associar projetos ao `profileId`.
- Definir projeto ativo por perfil.
- Preservar projetos anteriores como arquivados.
- Fazer importação e geração convergirem para o mesmo contrato de projeto.
- Preparar troca de perfil sem mistura de dados.

## v0.50 — TITAN Knowledge Base

Objetivo: transformar a biblioteca de exercícios em uma base de prescrição versionada.

- Identidade estável por exercício.
- Músculos primários e secundários.
- Padrões de movimento.
- Equipamentos necessários.
- Nível e complexidade técnica.
- Técnica e erros comuns.
- Substituições, progressões e regressões.
- Faixas de repetição, RIR e descanso.
- Metadados de fadiga, estabilidade e adequação ao objetivo.
- Testes de integridade da Knowledge Base.

## v0.60 — TITAN Engine

Objetivo: separar as regras de avaliação e prescrição da interface.

Entradas principais:

- perfil;
- avaliação;
- objetivo;
- experiência;
- dias e duração disponíveis;
- equipamentos;
- limitações;
- prioridades musculares;
- preferências;
- objetivo cardiovascular.

Saídas principais:

- candidatos de programa;
- justificativas;
- volume e frequência por músculo;
- seleção de exercícios;
- séries, repetições, RIR e descanso;
- cardio compatível com objetivo e rotina;
- alertas quando os dados forem insuficientes.

## v0.70 — Projetos e geração guiada

Objetivo: entregar a criação completa do Projeto TITAN.

Fluxo alvo:

1. criar ou selecionar perfil;
2. preencher avaliação;
3. escolher objetivo;
4. TITAN Engine gera três propostas;
5. usuário compara propostas e justificativas;
6. usuário escolhe uma proposta;
7. sistema cria e ativa o projeto.

Também continuará disponível:

- inserir projeto existente;
- atualizar musculação separadamente;
- atualizar cardio separadamente;
- arquivar ou substituir projeto sem apagar histórico.

## v0.80 — Nutrição e rotina

- Plano alimentar.
- Refeições planejadas e pendentes.
- Registro parcial.
- Substituições equivalentes.
- Redistribuição de macros.
- Calorias e macronutrientes.
- Água.
- Sono e recuperação registrados pelo usuário.
- Integração desses dados ao Score e Coach quando houver informação suficiente.

## v0.90 — Coach, relatórios e automações

- Recomendações prioritárias.
- Tendências.
- Relatório semanal.
- Relatório mensal.
- Alertas de estagnação.
- Recomendações de progressão.
- Auditoria das decisões do Coach.
- Notificações compatíveis com PWA.
- Melhorias de backup e restauração.

## v1.0 — Primeira versão estável

Critérios principais:

- uso diário estável em Android;
- PWA instalável;
- funcionalidade essencial offline;
- migrações testadas;
- backups restauráveis;
- projeto gerado ou importado;
- musculação e cardio completos;
- histórico persistente;
- evolução corporal;
- nutrição funcional;
- Coach com regras explicáveis;
- testes críticos automatizados;
- documentação alinhada ao código.
