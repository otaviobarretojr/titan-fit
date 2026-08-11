# Changelog

## v0.55 — Relatórios

- Criada a área `Saúde → Relatórios` sem adicionar nova aba principal.
- Relatórios consolidados para períodos de 7 e 30 dias.
- Treino passa a resumir sessões e volume total registrado.
- Nutrição passa a resumir dias registrados, médias de calorias e proteína, aderência calórica e aderência proteica.
- Recuperação passa a resumir dias com sono e média de horas registradas.
- Evolução passa a resumir registros corporais, peso mais recente e variação de peso quando existem dados suficientes.
- Cada período agora é comparado com a janela imediatamente anterior de mesma duração.
- Adicionados deltas e tendências para sessões, volume, aderência nutricional, sono e peso quando os dois períodos possuem dados válidos.
- Relatório declara explicitamente quando não existe base anterior suficiente para comparação.
- Incluída leitura automática do período com prioridade para queda relevante de sono, aderência nutricional ou consistência de treino.
- Mantido o princípio de não inventar métricas para áreas sem registros.
- Adicionados testes específicos para períodos, ausência de dados e comparação entre janelas consecutivas.
- Lint, TypeScript, testes, build e `npm run validate` concluídos com sucesso antes da publicação Android.

## v0.54 — Coach TITAN 1.0

- Coach passa a cruzar dados de treino, nutrição, recuperação e evolução corporal sem criar uma nova fonte de persistência.
- Mantida compatibilidade com o relatório legado baseado apenas em histórico de treinos.
- Score integrado calcula a média somente dos pilares com dados disponíveis, evitando penalizar o usuário por informações ainda não registradas.
- Confiança da análise passa a refletir a quantidade de pilares e histórico realmente disponíveis.
- Nutrição considera aderência combinada de calorias e proteína nos dias registrados.
- Recuperação passa a utilizar registros de sono do Health Connect quando disponíveis e declara explicitamente quando faltarem dados.
- Evolução considera a presença de registros corporais recentes sem inferir diagnóstico ou composição corporal inexistente.
- Saúde ganha uma terceira seção interna, `Coach`, sem alterar as quatro abas principais do aplicativo.
- Prioridade unificada passa a favorecer fadiga crítica e, depois, o pior pilar disponível, em vez da ordem fixa dos alertas.
- A tela Hoje passa a exibir a mesma prioridade unificada do Coach, preservando a orientação específica do treino do dia.
- Nutrição, Saúde e Evolução passam a atualizar a leitura do Coach sem exigir reinício da tela.
- Corrigida regra CSS legada que podia ocultar visualmente o quarto item da navegação inferior.
- Adicionados testes específicos para compatibilidade, score multipilar, prioridade e ausência de dados.
- APK Android assinado publicado na Release `v0.54.0`.

## v0.53.3 — Nutrição em Evolução

- Nutrição integrada definitivamente em `Saúde → Evolução`, com as abas `Corpo`, `Treino` e `Nutrição`.
- Painel nutricional oferece períodos de 7, 30 e 90 dias.
- Adicionados consumo calórico diário, aderência calórica, média de calorias, aderência de proteína, dias registrados e médias de proteína, carboidratos e gorduras.
- Navegação principal consolidada em `Hoje · Programação · Saúde · Ajustes`.
- Estados legados de navegação `progress` passam a migrar para `Saúde`, preservando compatibilidade.
- Hall de PRs estável preservado enquanto a terceira aba de evolução foi adicionada.
- Validador estrutural atualizado para impedir regressão à navegação antiga.
- Lint, TypeScript, testes, build e `npm run validate` concluídos com sucesso.
- APK Android assinado publicado na Release `v0.53.3`.

## v0.50 — TITAN Engine

- Criado `src/core/titan-engine` como núcleo independente de React, IndexedDB e componentes de interface.
- A Engine passa a receber avaliação, catálogo elegível e regras de prescrição e devolver blueprints determinísticos.
- O gerador de planos foi transformado em adaptador: converte o blueprint da Engine para `TitanPlan` e adiciona cardio/metadados do aplicativo.
- Três estratégias continuam disponíveis: maior aderência, equilíbrio e maior disponibilidade.
- Prioridades musculares influenciam ordenação e volume por exercício de forma explicável.
- Exercícios evitados e possíveis conflitos com limitações são filtrados antes da montagem das sessões.
- Frequência de treino passa a suportar de 1 a 7 dias sem reduzir silenciosamente sete dias para seis.
- Volume semanal por músculo passa a respeitar teto de prescrição; músculos prioritários recebem margem controlada de até 15%.
- Cada candidato recebe métricas de cobertura do volume-alvo, equilíbrio entre sessões, fadiga estimada e adequação da estratégia.
- A Engine calcula um `Score TITAN` de 0 a 100 e marca exatamente uma das três estratégias como recomendada.
- Motivos da recomendação são devolvidos de forma explícita e determinística.
- `GeneratedPlanCandidate` passa a expor `recommended`, `titanScore` e métricas da Engine.
- Tela comparativa mobile das três estratégias passa a exibir Score TITAN, divisão semanal, volume, equilíbrio, fadiga, adequação e justificativas.
- Destaque “Recomendado pelo TITAN” passa a obedecer a decisão real da Engine, sem estratégia fixa na interface.
- Usuário continua livre para ativar qualquer uma das três opções; a escolha é vinculada ao fluxo Perfil → Projeto → Plano.
- Configurações ganha “Gerar novas opções”, reutilizando Perfil e Avaliação já salvos sem refazer onboarding.
- A ativação de uma nova proposta cria um novo ciclo/projeto e pausa automaticamente o projeto anteriormente ativo, preservando histórico e ciclos anteriores.
- A Engine emite warnings quando recebe frequência fora do intervalo suportado ou catálogo vazio.
- Testes específicos adicionados para determinismo, prioridades, limitações, exclusões, frequência de sete dias, teto de volume, recomendação e comparação visual.

## v0.45 — Profile & Project Core

- Perfil e avaliação passam a ser editáveis diretamente em Configurações sem recriar o usuário.
- Edição cobre nome, nascimento, sexo biológico, altura, peso, objetivo, experiência, frequência e duração da musculação.
- Estrutura disponível, prioridades musculares, limitações, objetivo cardiovascular, nível cardiovascular e dias de cardio também podem ser atualizados.
- Mudanças no perfil atualizam o contexto do Coach sem reescrever silenciosamente o projeto ativo.
- Gestão de projetos adicionada em Configurações sem criar nova aba principal.
- Projetos exibem origem, objetivo, perfil associado e status operacional.
- Troca de projeto ativo carrega o plano correspondente sem apagar histórico anterior.
- Projeto ativo pode ser pausado; projetos pausados podem ser concluídos ou arquivados.
- Projetos importados sem perfil podem ser associados ao perfil ativo.
- Gestão de projetos passa a tratar indisponibilidade do IndexedDB sem gerar rejeições não tratadas.
- Testes adicionados para associação de perfil e ativação de projeto.

## v0.40 — Foundation Upgrade + base TITAN de prescrição

### Fundação

- Arquitetura atualizada para refletir React, PWA, IndexedDB, perfil, planos, cardio, histórico, backup e Coach já existentes no código.
- Modelo de dados alvo formalizado com relações por `profileId` e `projectId`.
- Estratégia de migração definida para retirar dados de domínio do localStorage sem apagar registros existentes.
- Modelo futuro de projetos estabelecido para suportar geração TITAN, importação e edição manual sobre contratos compatíveis.
- Separação conceitual oficial entre TITAN FIT UI, TITAN Engine, Knowledge Base e TITAN Data.
- IndexedDB atualizado para schema v3 com store própria de projetos.
- Perfis e avaliações passam a ser persistidos pelos IDs reais, com ponteiros ativos em `preferences` e compatibilidade temporária com a chave legada `active`.
- Planos passam a suportar `profileId` e `projectId` e são persistidos pelo `plan.id`, mantendo ponteiro de plano ativo e espelho legado durante a migração.
- Projeto ativo passa a possuir entidade própria e ponteiro `active-project-id`.
- Planos gerados pelo TITAN já nascem vinculados ao perfil e a um projeto; projetos importados sem perfil permanecem válidos como não atribuídos até associação futura.

### Base de prescrição

- Catálogo estruturado inicial de exercícios por músculo, padrão de movimento, equipamento e experiência mínima.
- Técnica, erros comuns, substituições, faixas de repetição, RIR e descanso incorporados ao catálogo.
- Regras iniciais de volume semanal e limite de exercícios por duração da sessão.
- Seleção de exercícios compatível com experiência e estrutura disponível.
- Templates de divisão inicialmente definidos para até 6 dias de musculação; a v0.50 amplia a Engine para 7 dias.
- Testes automatizados para volume, elegibilidade de exercícios e divisão semanal.

## v0.9.0 — Dashboard inteligente

- Home refeita para mostrar a próxima ação com clareza.
- Saudação contextual, data e identificação da ficha ativa.
- Treino do dia identificado pela programação semanal.
- Resumo de exercícios e séries antes de iniciar.
- Atalhos diretos para cardio, evolução e Coach TITAN.
- Score exibido como indisponível quando ainda não existem dados suficientes.
- Espaços de nutrição, água e sono preparados sem dados fictícios.
- Estado vazio mais útil para quem ainda não importou uma ficha.

## v0.8.0 — Engine de Dados e backup

- Banco IndexedDB versionado com stores para planos, histórico, cardio, sessões e preferências.
- Migração automática dos registros existentes do localStorage sem apagá-los.
- Gravação dupla temporária para manter localStorage e IndexedDB sincronizados durante a transição.
- Migração também das sessões de treino já em andamento.
- Contrato de backup completo e versionado.
- Exportação de backup em arquivo local.
- Restauração atômica, com validação, confirmação e proteção contra versões incompatíveis.
- Indicador de status da Engine na área Mais.

## v0.7.0 — Coach TITAN

- Score TITAN baseado em musculação e cardio registrados.
- Pilares separados para treino, cardio e confiança dos dados.
- Prioridade automática do momento.
- Insights de consistência semanal, volume e marco dos primeiros 5 km.
- Aviso explícito quando faltarem dados para uma análise mais ampla.
- Processamento local, sem inventar sono, nutrição, hidratação ou recuperação.

## v0.6.0 — Cardio e primeiros 5 km

- Importação de planilha progressiva de cardio em `.json` ou `.titan-cardio`.
- Plano organizado por semanas e sessões.
- Meta estruturada para correr os primeiros 5 km.
- Caminhada, Zona 2, corrida, HIIT, bicicleta, escada e atividade personalizada.
- Registro de duração, distância, frequência cardíaca, esforço e observações.
- Histórico permanente de cardio preservado após troca do plano.
- Progresso por sessões concluídas e distância acumulada.

## v0.5.0 — Histórico e progressão

- Conclusão definitiva do treino após todas as séries.
- Snapshot permanente da sessão no aparelho.
- Volume total por exercício e por treino.
- Melhor carga registrada por exercício.
- Tela Evolução com resumo, progressão e treinos concluídos.
- Remoção individual de registros com confirmação.

## v0.4.0 — Execução série por série

- Registro de carga, repetições e RIR.
- Conclusão individual de séries.
- Cronômetro de descanso.
- Persistência da sessão ativa.

## v0.3.0 — Visualização da ficha

- Navegação por treinos e exercícios.
- Detalhes de técnica, erros e alternativas.
- Player incorporado do YouTube.

## v0.2.0 — Importação da ficha

- Importação, validação e prévia de arquivos TITAN FIT.
- Persistência local da ficha ativa.

## v0.1.0 — Fundação

- Fundação React + Vite + TypeScript.
- Identidade TITAN FIT.
- Navegação mobile com cinco áreas.
- Estados vazios sem dados fictícios.
- Configuração inicial de PWA.
- Status online/offline.
- Testes, validação e CI.
