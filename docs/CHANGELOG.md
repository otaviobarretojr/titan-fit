# Changelog

## v0.8.0 — Engine de Dados e backup

- Banco IndexedDB versionado com stores para planos, histórico, cardio, sessões e preferências.
- Migração automática dos registros existentes do localStorage sem apagá-los.
- Contrato de backup completo e versionado.
- Exportação de backup em arquivo local.
- Restauração com validação, confirmação e proteção contra versões incompatíveis.
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
