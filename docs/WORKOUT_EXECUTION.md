# Execução de treino — v0.4

A v0.4 introduz o registro série por série dentro da ficha importada.

## Dados registrados

Cada série possui:

- carga em quilogramas;
- repetições realizadas;
- RIR informado pelo usuário;
- estado de conclusão.

## Persistência

A sessão em andamento é salva no `localStorage` usando um prefixo exclusivo do TITAN FIT. Fechar ou recarregar o PWA não apaga os dados preenchidos.

A v0.4 ainda não transforma a sessão em histórico definitivo. Esse armazenamento serve para continuidade do treino em andamento e será migrado para o histórico na v0.5.

## Descanso

Ao concluir uma série, o cronômetro inicia com o descanso configurado no exercício. O usuário pode pausar, continuar, zerar ou iniciar manualmente o descanso recomendado.

Quando o contador chega a zero, o aplicativo tenta emitir vibração curta, caso o navegador e o aparelho permitam.

## Fora do escopo

- histórico permanente;
- progressão automática de carga;
- recordes pessoais;
- gráficos;
- sincronização em nuvem.
