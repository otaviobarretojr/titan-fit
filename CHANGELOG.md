# Changelog — TITAN FIT

Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.

## v0.58.6 — Progressão inteligente
- TITAN deixa de sugerir aumento de carga quando o RIR da sessão não foi registrado.
- Aumento de carga passa a exigir que a própria maior carga da sessão alcance o topo da faixa prescrita, evitando progressão falsa baseada em séries mais leves.
- Quando o topo é atingido sem RIR, o Coach orienta repetir a referência e registrar esforço antes de subir.
- Novos testes cobrem ausência de RIR, séries com cargas mistas e progressão válida.

## v0.58.5 — Exercícios, vídeos e alternativas
- Modo treino passa a respeitar corretamente o provedor do vídeo: YouTube, Vimeo ou mídia hospedada.
- Reprodução no treino recebe configuração mobile com playsinline, carregamento lazy e preferências PT-BR quando suportadas pelo provedor.
- Troca para exercício alternativo continua atualizando vídeo, técnica, prescrição e histórico do exercício realmente executado.
- Teste de regressão reforçado para garantir que a técnica do exercício principal não permaneça após selecionar uma alternativa.
- Preservação integral de sessões, cargas, PRs, descanso automático, cardio integrado e histórico.

## v0.58.4 — Auditoria do modo treino
- Revisão do fluxo principal de execução de treino após a integração definitiva do cardio ao projeto de musculação.
- Correção da ação de pulo para exibir somente “Pular exercício”.
- Cardio integrado passa a usar a ação explícita “Registrar cardio” dentro da própria sequência do treino.
- Teste dedicado garante que o cardio seja tratado como etapa do treino, sem reintroduzir fluxo isolado.
- Preservação de retomada de sessão, vídeos, alternativas, descanso automático, histórico e progressão.

## v0.58.3 — Cardio integrado ao treino
- Remoção definitiva da tela, agendador e gerador de cardio isolado.
- Cardio passa a existir somente como exercício/etapa dentro dos treinos do Projeto TITAN.
- Gerador interno passa a inserir prescrições cardiovasculares diretamente nas sessões de musculação, respeitando objetivo e nível cardiovascular informados.
- Importador deixa de aceitar projetos `.titan-cardio` separados e exige um único projeto integrado.
- Notificações de cardio isoladas são removidas; existe apenas o lembrete do treino completo, indicando quando a sessão contém cardio.
- Registro cardiovascular dentro do treino continua suportando duração, distância, velocidade, ritmo, frequência cardíaca, calorias e observações, além da zona prescrita pelo projeto.
- Painéis de evolução cardiovascular e histórico anterior são preservados e continuam lendo os registros já existentes.
- Nenhum histórico antigo é apagado pela mudança de arquitetura.

## v0.58.2 — Persistência e retomada segura
- Recuperação de sessões de treino em andamento a partir do IndexedDB antes da entrada no aplicativo.
- O registro mais recente entre IndexedDB e armazenamento local passa a ser preservado durante a hidratação.
- Recuperação do projeto ativo pelo banco principal passa a ocorrer antes da montagem do aplicativo, reduzindo inconsistências após atualização ou restauração.
- Fallback seguro para abrir o app com o projeto local existente caso o IndexedDB esteja temporariamente indisponível.
- Auditoria do fluxo de importação confirmou preservação de histórico e pausa automática do projeto anteriormente ativo ao criar um novo ciclo.
- A ação de abandono parcial do treino passa a ser apresentada de forma simples como “Pular exercício”.

## v0.58.1 — Navegação Android e barra inferior
- Botão Voltar do Android passa a respeitar o histórico interno e enviar o TITAN FIT para segundo plano ao chegar à raiz, em vez de destruir a Activity.
- Barra inferior refinada para comportamento e aparência mais próximos de um aplicativo Android nativo.
- Preservação integral dos dados e da identidade de assinatura Android entre atualizações.

## v0.58.0 — Auditoria e estabilização pós-Nutrição
- Auditoria geral iniciada sobre a base v0.57.12 após a remoção integral do módulo de Nutrição.
- Correção da suíte de testes principal para validar explicitamente que abas, painéis e links de Nutrição não existem mais.
- Correção da metadata da migração do banco local para registrar a versão real do schema IndexedDB.
- Preservação dos projetos, histórico, evolução, cardio, saúde, preferências e sessões existentes.
- Pipeline de qualidade mantido com lint, TypeScript, testes, build e validadores antes da publicação Android.

## v0.57.2 — Home nutricional e navegação definitiva
- Home passa a exibir somente a próxima refeição futura em formato compacto.
- Refeições atrasadas deixam de substituir a próxima refeição na Home.
- Remoção do painel nutricional legado duplicado da tela Hoje.
- Macros diários deixam de ocupar o dashboard e permanecem concentrados em Saúde.
- Execução da refeição continua em tela própria, com quantidades, substituições e finalização.
- Barra inferior reconstruída com uma única fonte de estilo.
- Remoção dos imports de CSS legados que ainda definiam 5 colunas e safe-area conflitante.
- Quatro áreas iguais para Hoje, Programação, Saúde e Ajustes, com ícones, texto, espaçamento e área de toque padronizados.
- Ajuste definitivo do espaço reservado no rodapé para não cobrir conteúdo.
- Preservação integral dos registros, projetos e histórico existentes.

## v0.57.1 — Polimento de navegação e nutrição
- Home mais limpa, com próxima refeição em card compacto e execução da refeição em tela própria.
- Programação nutricional reorganizada em visão semanal compacta, com detalhe diário ao toque.
- Score TITAN reduzido a indicador compacto na Home.
- Unificação do espaçamento e alinhamento da navegação inferior.
- Sincronização visual entre abas internas de Programação, Saúde, Relatórios e Nutrição.
- Correção do cálculo de safe-area e do espaço reservado no rodapé em Android.
- Preservação integral de histórico, projetos e compatibilidade com o schema nutricional atual.

## v0.57.0 — Notificações inteligentes
- Motor de lembretes baseado nos horários reais do plano ativo.
- Notificações locais no Android com `@capacitor/local-notifications`.
- Permissão explícita de notificações em versões recentes do Android.
- Alertas para refeições, refeições atrasadas, musculação e cardio.
- Reagendamento automático quando refeições são registradas ou o projeto é alterado.
- Preferências de antecedência de 15, 30, 45 ou 60 minutos.
- Painel de notificações em Ajustes e visualização dos próximos lembretes.
- Sinalização de lembretes prioritários na tela Hoje.
- Correção estrutural do CI para manter `package-lock.json` sincronizado após mudanças de dependências.

## v0.56.0 — Cardio 2.0
- Painel de evolução cardiovascular em 7 ou 30 dias.
- Sessões, tempo, distância, melhor distância, ritmo e frequência cardíaca média.
- Comparação com período anterior.
- Progresso específico rumo aos 5 km.
- Separação entre volume cardiovascular geral e progresso terrestre para evitar considerar bicicleta como conclusão da meta de corrida.
- APK Android assinado e publicado oficialmente.

## v0.55.1 — Correção de classificação dos relatórios
- Cardio puro deixa de ser contabilizado como sessão de musculação nos Relatórios.
- Preservação integral dos registros existentes.
- APK Android assinado e publicado oficialmente.

## v0.55.0 — Relatórios comparativos
- Relatórios de 7 e 30 dias.
- Comparação com o período anterior.
- Tendências por pilar.
- Leitura prioritária do Coach sem interpretar automaticamente qualquer alta ou queda como positiva.
- APK Android assinado e publicado oficialmente.

## Histórico anterior
As versões anteriores formaram a fundação do TITAN FIT: PWA mobile-first, navegação, armazenamento local, projetos importáveis, execução de treino, histórico, progressão, nutrição, saúde, evolução, Coach TITAN, backup, modo demonstração e pipeline Android. Os detalhes permanecem preservados no histórico Git do repositório.