# Arquitetura

A v0.1.0 usa React, Vite e TypeScript com navegação local simples. Não existe banco de dados nesta etapa.

## Camadas

- `src/app`: composição principal e navegação.
- `src/components`: componentes reutilizáveis.
- `src/pages`: estados de cada área do produto.
- `src/styles`: tokens e estilos globais.
- `scripts`: validações de qualidade.
- `tests`: testes de comportamento.

## Decisões

- Nenhum treino fixo no código.
- Nenhum perfil, login ou autenticação.
- Importação de ficha somente na v0.2.
- Persistência de treino somente quando o modelo de dados estiver definido.
