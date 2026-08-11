# Changelog — TITAN FIT

Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.

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
