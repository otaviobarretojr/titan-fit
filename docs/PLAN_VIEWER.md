# Visualização da ficha — v0.3

A ficha importada é apresentada em três níveis:

1. lista de treinos;
2. lista de exercícios do treino;
3. detalhe completo do exercício.

## Detalhe do exercício

O aplicativo mostra, quando disponíveis:

- grupo muscular;
- séries;
- faixa de repetições ou duração;
- RIR;
- descanso;
- técnica;
- erros comuns;
- alternativas;
- vídeo de execução.

## Player do YouTube

O vídeo fica fechado por padrão. Ele só é carregado após o usuário tocar em **Ver execução**.

O player usa:

- `youtube-nocookie.com`;
- proporção 16:9;
- carregamento tardio;
- tela cheia opcional;
- apenas o `videoId` validado durante a importação.

Nenhum HTML, iframe ou código vindo da ficha é inserido diretamente no aplicativo.

## Offline

A ficha e os textos continuam disponíveis offline. O vídeo depende de conexão com a internet e das permissões de incorporação definidas pelo proprietário do vídeo no YouTube.
