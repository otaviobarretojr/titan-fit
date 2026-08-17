# Changelog — TITAN FIT

Este arquivo registra os cortes de versão oficiais do aplicativo. O histórico detalhado permanece nos commits e nas GitHub Releases.

## v0.60.0 — Visual Rework
- Nova camada visual definitiva para celular, preservando integralmente regras, dados e comportamento do TITAN FIT.
- Cabeçalho global compactado e hierarquia tipográfica revisada.
- Navegação inferior redesenhada com quatro zonas equilibradas, estado ativo discreto e safe-area Android preservada.
- Home reorganizada com treino do dia como ação dominante e Coach TITAN mais compacto.
- Programação recebe cards semanais mais enxutos, detalhe de treino mais limpo e melhor densidade de informação.
- Saúde/Evolução ganha seletor horizontal compacto e padrão visual unificado entre suas áreas.
- Ajustes passa a usar cards mais simples, menos profundidade visual e ações secundárias consistentes.
- Modo treino recebe cabeçalho de saída compacto, progresso enxuto, PR/Meta priorizados, campos de execução mais legíveis e navegação de exercício fixa ao alcance do polegar.
- Paleta, raios, bordas, sombras e espaçamentos passam a seguir um único sistema visual v0.60.

## v0.59.3 — Motor de PR corrigido
- A primeira sessão válida de um exercício passa a formar o PR inicial em vez de aparecer como “Ainda sem PR”.
- PR de musculação passa a priorizar maior carga; repetições desempata quando a carga é a mesma.
- Histórico e progressão reconhecem IDs canônicos entre revisões do mesmo projeto, preservando PRs ao trocar tabelas compatíveis.
- Detecção de PR ao vivo usa o mesmo critério do card “PR válido”.

## v0.59.2 — Exportação nativa do treino
- Exportação no APK deixa de depender de Web Share API e download blob do WebView.
- Android passa a criar fisicamente o JSON com Capacitor Filesystem no cache nativo.
- Compartilhamento usa Capacitor Share com URI file:// real e compatível com Android.
- Navegador/PWA mantém Web Share e download de JSON como fallback.
- Arquivo exportado continua sem histórico, fotos, saúde ou metadados legados de vídeo.

## v0.59.1 — Espaçamento da navegação Android
- Menu inferior passa a manter uma folga visual adicional da barra de gestos/botões do Android.
- Conteúdo recebe padding inferior correspondente para não ficar escondido atrás da navegação.
- Área de saída do modo treino foi compactada para liberar espaço útil na tela.
- Safe-area continua respeitada em aparelhos com gestos, recortes e barras de sistema diferentes.

## v0.59.0 — Rework Foundation · Video-free
- Remove a Biblioteca visual de exercícios da Programação.
- Remove player, bloqueio e qualquer etapa de vídeo do modo treino.
- Remove vídeo, videoPolicy e videoLibrary do schema ativo; projetos legados continuam importáveis e esses campos são descartados.
- Exportação do treino elimina qualquer metadado de vídeo legado ainda persistido.
- Botão Voltar do Android durante o modo treino retorna para Hoje/Home e preserva a sessão.
- Detalhes da Programação passam a respeitar o histórico do navegador para o gesto/botão Voltar.
- Nova camada final de layout centraliza safe areas do Android e evita sobreposição da navegação inferior com a barra do sistema.
- Fundação preparada para a nova identidade visual do TITAN FIT.

## v0.58.18 — Exportação do treino atual
- Programação ganha a ação Exportar treino atual.
- Exportação gera o próprio TitanPlan em JSON, compatível com o fluxo de revisão e futura reimportação do TITAN FIT.
- Arquivo contém somente a programação ativa; histórico, fotos e dados de saúde não são incluídos.
- Em dispositivos compatíveis, abre o compartilhamento nativo; nos demais, baixa o arquivo JSON.
- Nome do arquivo inclui o ID do projeto e a data da exportação.

## v0.58.17 — Repetições + Peso
- Cada série de musculação mantém sua identificação no cabeçalho (Série 1 de N, Série 2 de N...).
- Os dois campos de preenchimento passam a ser Repetições e Peso (kg).
- RIR continua removido do preenchimento manual.
- Registro da série exige repetições válidas e peso informado, restaurando volume e PR por repetição/carga.

## v0.58.16 — Série + Peso
- Registro de musculação mostra explicitamente a Série e o Peso em cada linha.
- REP/Repetições permanece removido do preenchimento manual.
- Fluxo continua individual por série, com registro de carga e descanso automático.

## v0.58.15 — Registro de séries simplificado
- Cada série de musculação pede somente o peso/carga executado.
- Campos manuais de repetições e RIR foram removidos do modo treino.
- O TITAN não inventa repetições ou esforço; sem esses dados, análises dependentes deles ficam conservadoras.

## v0.58.14 — Saída do treino retorna à Home
- Sair manualmente do modo treino agora retorna diretamente ao Dashboard/Home.
- A tela intermediária “Projeto completo” deixa de aparecer ao sair de uma sessão em andamento.
- Sessão não concluída continua preservada para retomada posterior.
- Conclusão normal do treino mantém atualização de histórico e retorno ao Dashboard.

## v0.58.13 — Menu inferior proporcional
- Barra inferior reconstruída com quatro zonas exatamente iguais de 25% da largura da tela.
- Removido o posicionamento por `left: 50%` e `transform`, eliminando deslocamento lateral percebido no Android.
- Ícones aumentados para 30 px, com cápsula ativa maior e centralização rígida.
- Altura, rótulos e espaçamento vertical reajustados para melhor proporção e padrão visual mobile.
- Nova camada final de navegação bloqueia interferência de estilos legados.

## v0.58.12 — Menu inferior realinhado
- Menu inferior recebe uma única camada final de estilos para evitar conflito entre regras antigas.
- Ícones aumentados e centralizados, com distribuição uniforme entre as quatro abas.
- Espaçamento entre ícone e legenda reduzido e alinhamento vertical padronizado.
- Área de toque e altura do menu ajustadas para ergonomia no Android e safe-area inferior.
- Estado ativo mantém destaque discreto no padrão visual One UI.

## v0.58.11 — Execução de treino blindada
- Séries de musculação só podem ser registradas com carga informada, repetições válidas e RIR real entre 0 e 10.
- RIR executado deixa de nascer preenchido com o RIR-alvo, evitando contaminar histórico e progressão.
- Reset da sessão passa a sobrescrever o estado persistido sem disputa entre delete e novo save no IndexedDB.
- Troca de alternativa considera qualquer dado já registrado, não apenas carga e repetições.
- Cardio, distância, isometria e mobilidade exigem sua métrica principal antes de concluir o registro.

## v0.58.10 — Dashboard e programação sincronizados
- Dashboard detecta sessão ativa salva e troca a ação principal de Iniciar treino para Retomar treino.
- Sessões em andamento passam a ficar visíveis também na Programação, evitando dúvida sobre o estado atual do treino.
- Leitura contextual do Coach no Dashboard deixa de contar blocos de cardio como sessões separadas e passa a contar treinos com cardio.
- Registros cardiovasculares antigos não inflam mais a contagem contextual de musculação.
- Projeto ativo, treino do dia, sessão persistida e leitura semanal permanecem alinhados na mesma fonte de dados.

## v0.58.9 — Coach e relatórios unificados
- Coach deixa de contar registros antigos exclusivamente cardiovasculares como frequência de musculação.
- Treinos mistos continuam valendo como uma única sessão de musculação, com o cardio analisado dentro da mesma sessão.
- Coach passa a exibir leitura cardiovascular integrada com sessões, duração, distância e frequência cardíaca quando disponível.
- Relatórios passam a mostrar o cardio dentro do card de Treino, sem recriar módulo cardiovascular isolado.
- Comparações de cardio usam treinos com cardio como unidade de sessão, preservando histórico antigo e evitando duplicidades.
- Novos testes cobrem treino misto, cardio legado e consistência entre Coach e Relatórios.

## v0.58.8 — Histórico e evolução integrados
- Histórico volta a ficar acessível dentro do hub Saúde, sem criar uma nova aba principal.
- Detalhe do cardio no histórico passa a exibir ritmo, zona realizada, RPE, calorias e demais métricas registradas.
- Evolução ganha visão Cardio dentro do mesmo centro, explicitamente alimentada pelo cardio integrado aos treinos.
- Contagem cardiovascular passa a considerar treinos com cardio, evitando duplicar uma sessão quando o mesmo treino possui mais de um bloco cardiovascular.
- Musculação, PRs, composição corporal e histórico antigo permanecem compatíveis.

## v0.58.7 — Cardio integrado 2.0
- Cardio permanece exclusivamente como etapa do treino do Projeto TITAN, sem módulo isolado.
- Entrada de duração passa de segundos para minutos na interface, mantendo segundos internamente para compatibilidade histórica.
- Registro integrado passa a incluir zona realizada e RPE 0–10, além de distância, velocidade, inclinação, ritmo, FC, calorias e observações.
- A tela calcula velocidade média e ritmo a partir de duração + distância para conferência rápida do registro.
- Histórico antigo continua compatível; novos campos são aditivos.

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