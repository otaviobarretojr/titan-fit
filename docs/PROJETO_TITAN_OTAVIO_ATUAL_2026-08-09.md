# PROJETO TITAN — Arquivo mestre de Otávio

Atualizado em: 2026-08-09

## 1. Finalidade

Este arquivo consolida o estado atual do TITAN FIT e define o bloco oficial de musculação e cardio para Otávio. Ele deve funcionar como referência de produto para o Coach TITAN, para futuras versões do gerador de treino e para a conferência dos arquivos importáveis associados.

Arquivos importáveis deste bloco:

- `docs/plans/otavio-hipertrofia-enfase-v1.titan`
- `docs/plans/otavio-primeiros-5k-v1.titan-cardio`

## 2. Estado atual do aplicativo

O TITAN FIT é uma PWA mobile-first em React, Vite e TypeScript, com persistência local, IndexedDB versionado, backup/restauração, importação de fichas, execução série por série, histórico, progressão, cardio, Coach TITAN e dashboard inteligente.

A Biblioteca TITAN possui 116 exercícios estruturados e 116 demonstrações em vídeo. O player foi auditado para celular, possui suporte a YouTube e Vimeo, preferência por PT-BR e guia próprio TITAN em português para exercícios já curados. A arquitetura de guia PT-BR é independente do idioma do vídeo e pode ser expandida progressivamente para toda a biblioteca.

Os dados principais continuam sendo processados e armazenados localmente no aparelho nesta fase, preservando histórico entre trocas de ficha e atualizações compatíveis.

## 3. Perfil deste bloco

- Peso de referência: 92 kg.
- Objetivo central: hipertrofia com ênfase estética e ganho de massa muscular.
- Frequência de musculação: 6 dias por semana.
- Descanso completo: sábado.
- Janela de musculação: 20:00.
- Duração máxima prevista por sessão: 90 minutos.
- Janela de cardio: 17:00–17:30.
- Objetivo cardiovascular: completar 5 km correndo de forma contínua.

### Músculos prioritários

Prioridade A:

- Peitoral superior.
- Deltoides, principalmente lateral e posterior.
- Dorsais.
- Posteriores de coxa.

Prioridade B:

- Panturrilhas.
- Antebraços.

Os demais grupos permanecem treinados para manter equilíbrio, força e proporção, mas recebem menor volume direto.

## 4. Organização semanal

| Dia | 17:00 | 20:00 | Ênfase |
|---|---|---|---|
| Domingo | Corrida fácil / Zona 2 | Push A | Peitoral superior + ombros |
| Segunda | — | Lower A | Posteriores + panturrilhas |
| Terça | Intervalado 5 km | Pull A | Dorsais + bíceps + antebraço |
| Quarta | Zona 2 regenerativa | Push B | Peitoral superior + ombros |
| Quinta | — | Lower B | Posteriores + quadríceps + panturrilhas |
| Sexta | Corrida progressiva | Pull B | Dorsais + costas + antebraço |
| Sábado | Descanso | Descanso | Recuperação |

O cardio mais exigente foi concentrado nos dias de membros superiores para reduzir competição de fadiga com os dois treinos de pernas. Quando cardio e musculação ocorrem no mesmo dia, existe uma janela aproximada de 2h30 entre as sessões.

## 5. Regras de execução da musculação

- Séries de aquecimento não contam no volume de trabalho.
- Compostos: iniciar normalmente em RIR 2 e permitir RIR 1 na última série quando a técnica estiver estável.
- Isoladores: trabalhar majoritariamente em RIR 1–2.
- Falha muscular não é obrigatória e não deve ser usada em todas as séries.
- Descanso: 2–3 min nos compostos pesados; 60–120 s em isoladores e máquinas.
- Progressão dupla: primeiro aumentar repetições dentro da faixa; quando todas as séries atingirem o topo da faixa no RIR-alvo, elevar a carga na sessão seguinte.
- Incrementos típicos: 2–5% nos compostos e o menor incremento disponível nos isoladores.
- Se ocorrer queda sustentada de performance, dor articular, piora importante do sono ou fadiga acumulada, reduzir volume antes de tentar aumentar carga.
- Deload: considerar 1 semana com cerca de metade das séries após 5–7 semanas duras ou antes, caso os sinais de recuperação indiquem necessidade.

## 6. Volume semanal planejado

O bloco utiliza volume maior nos músculos prioritários, distribuído em duas exposições principais por semana sempre que possível.

Faixas aproximadas de séries diretas por semana:

- Peitoral superior: 14–16.
- Deltoides lateral/posterior: 16–20.
- Dorsais/latíssimo: 16–18.
- Posteriores de coxa: 16–18.
- Panturrilhas: 12.
- Antebraços: 10–12.
- Quadríceps: 9–11.
- Bíceps: 8–10.
- Tríceps: 8–10.

O volume deve ser ajustado pela resposta real: progressão de carga/repetições, RIR, recuperação e dores têm prioridade sobre o número teórico de séries.

## 7. Bloco de cardio — primeiros 5 km

Estrutura de 8 semanas, normalmente com quatro sessões semanais de até 30 minutos:

- Domingo: corrida fácil/Zona 2.
- Terça: intervalado de corrida.
- Quarta: Zona 2 regenerativa.
- Sexta: corrida progressiva/contínua.

A intensidade é guiada por esforço percebido quando frequência cardíaca confiável não estiver disponível:

- Zona 2 / fácil: RPE 3–5 de 10, respiração controlada e capacidade de falar frases.
- Ritmo moderado: RPE 5–6.
- Intervalos: RPE 7–8, sem sprint máximo.

A sessão-meta de 5 km na semana 8 pode ultrapassar 30 minutos. O objetivo inicial é completar a distância continuamente; o tempo final será uma consequência da evolução.

## 8. Progressão do cardio

- Semana 1: adaptação e controle de esforço.
- Semana 2: mais tempo correndo, mantendo controle.
- Semana 3: blocos contínuos maiores.
- Semana 4: consolidar 30 min fáceis.
- Semana 5: introduzir mais ritmo sustentado.
- Semana 6: aumentar duração dos intervalos.
- Semana 7: aproximação do esforço específico de 5 km.
- Semana 8: reduzir fadiga e realizar teste de 5 km.

Se houver dor musculoesquelética crescente, a sessão de corrida deve ser trocada por caminhada/Zona 2 até reavaliação.

## 9. Critério para o Coach TITAN

O Coach deverá avaliar semanalmente:

- número de sessões concluídas;
- séries realizadas versus planejadas;
- evolução de carga e repetições;
- RIR médio e discrepâncias de esforço;
- desempenho dos músculos prioritários;
- sessões de cardio concluídas;
- maior bloco contínuo de corrida;
- distância e percepção de esforço;
- sinais registrados de dor ou recuperação insuficiente.

A progressão só deve ser sugerida quando os dados registrados suportarem a decisão.

## 10. Base de evidência usada na estrutura

A programação segue o conjunto de evidências em que volume semanal suficiente é um fator importante para hipertrofia, com retornos progressivamente menores à medida que o volume aumenta; frequência serve principalmente para distribuir esse volume e preservar qualidade das séries. O cardio foi distribuído para reduzir interferência sobre os treinos prioritários de membros inferiores.

Referências-base:

- Pelland JC et al. *The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains*. Sports Medicine, 2026. PMID 41343037.
- Schoenfeld BJ et al. *Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis*. Journal of Sports Sciences, 2017. PMID 27433992.
- Schoenfeld BJ et al. *How many times per week should a muscle be trained to maximize muscle hypertrophy?* Journal of Sports Sciences, 2019. PMID 30558493.
- Chen Y et al. *Comparative efficacy of concurrent training types on lower limb strength and muscular hypertrophy: a systematic review and network meta-analysis*. Journal of Exercise Science & Fitness, 2024. PMID 38187085.

## 11. Regra de atualização

Este documento é o baseline do bloco. Mudanças futuras no treino não devem apagar histórico. Um novo bloco deve receber novo ID/versão e o Coach TITAN deve registrar o motivo da alteração.