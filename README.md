# TITAN FIT

**Treine. Registre. Evolua.**

PWA mobile-first do ecossistema TITAN dedicado à execução de musculação, cardio integrado e acompanhamento de evolução.

## Estado atual

Versão `v0.12.0 — Progressão Inteligente` em desenvolvimento e validação.

Esta entrega inclui:

- Dashboard diário com treino completo do dia.
- Início direto da execução.
- Progresso por séries e volume em tempo real.
- Navegação exercício por exercício.
- Registro rápido de carga, repetições e RIR.
- Descanso automático após concluir séries.
- Última carga e meta da sessão por exercício.
- Identificação automática de novos recordes de carga.
- Prévia do próximo exercício.
- Cardio tratado como exercício válido dentro do treino.
- Resumo final com duração, volume, séries, cardio e PRs.
- Histórico local, backup e funcionamento PWA.

## Executar

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Validar

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run validate
```

## Publicação

O aplicativo usa a base `/titan-fit/` para GitHub Pages.

## Roadmap

Consulte [`docs/ROADMAP.md`](docs/ROADMAP.md).
