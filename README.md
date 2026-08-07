# TITAN FIT

**Treine. Registre. Evolua.**

PWA mobile-first do ecossistema TITAN dedicado à execução de musculação, cardio integrado e acompanhamento de evolução.

## Estado atual

Versão `v0.16.0 — Publicação e Instalação`.

Esta entrega inclui:

- Dashboard diário com treino completo do dia.
- Modo treino com séries, carga, repetições, RIR, descanso e Coach TITAN.
- Vídeo inicial incorporado do YouTube antes das séries, quando disponível.
- Histórico local, backup e continuidade de sessão.
- Manifest PWA com instalação em tela cheia no celular.
- Cache dos arquivos essenciais para abertura offline após o primeiro acesso.
- Detecção de novas versões pelo próprio aplicativo.
- Deploy automático para o GitHub Pages após validação completa.

## Executar localmente

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

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` executa lint, typecheck, testes, build e validação antes de publicar a pasta `dist`.

O aplicativo usa a base `/titan-fit/` e ficará disponível em:

```text
https://otaviobarretojr.github.io/titan-fit/
```

No repositório, configure **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Instalação no Android

Abra o endereço publicado no Chrome, acesse o menu do navegador e selecione **Instalar aplicativo** ou **Adicionar à tela inicial**. Depois do primeiro carregamento, os recursos essenciais ficam disponíveis offline. Vídeos do YouTube continuam dependendo de internet.

## Roadmap

Consulte [`docs/ROADMAP.md`](docs/ROADMAP.md).
