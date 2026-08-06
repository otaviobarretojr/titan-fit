# Histórico e progressão

## Quando um treino vira histórico

O treino só pode ser concluído quando todas as séries programadas estiverem marcadas como feitas.

Ao confirmar a conclusão, o TITAN FIT:

1. cria um registro permanente com data e duração;
2. preserva os nomes da ficha, do treino e dos exercícios;
3. copia carga, repetições e RIR de cada série;
4. calcula volume por exercício e volume total;
5. registra a maior carga utilizada em cada exercício;
6. remove a sessão temporária daquele treino;
7. abre a área Evolução.

## Cálculo de volume

Para cada série:

`volume = carga em kg × repetições realizadas`

Séries sem carga ou sem repetições informadas contribuem com zero para o volume, mas continuam preservadas no histórico. Isso permite exercícios com peso corporal, isometrias e registros parciais sem inventar valores.

## Progressão por exercício

A versão v0.5 mostra:

- quantidade de sessões em que o exercício apareceu;
- melhor carga registrada;
- volume acumulado dos treinos;
- lista cronológica dos treinos concluídos.

Sugestões automáticas de aumento de carga ficam fora do escopo desta versão. Elas só devem ser adicionadas quando técnica, faixa de repetições e esforço puderem ser avaliados com segurança.

## Persistência

O histórico é salvo localmente com a chave versionada `titan-fit:history:v1`.

Os registros são snapshots independentes da ficha ativa. Trocar ou remover a ficha não apaga o histórico já concluído.
