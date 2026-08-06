# TITAN FIT

**Treine. Registre. Evolua.**

Aplicativo PWA local-first para execução de musculação, cardio e acompanhamento de evolução. Sem cadastro, perfil, dieta ou editor de treino: o Coach cria a ficha, o usuário importa e o TITAN FIT preserva as execuções.

## Executar

```bash
npm install
npm run dev
```

## Verificações

```bash
npm test
npm run lint
npm run build
```

O build usa a base `/titan-fit/` para publicação no GitHub Pages. O banco `TitanFitDatabase` vive apenas no dispositivo. Use **Mais → Criar e baixar backup** antes de limpar dados do navegador ou trocar de aparelho.

## Estrutura

- `src/database`: schema Dexie versionado;
- `src/modules/import`: validação Zod, prévia e importação transacional;
- `src/modules/backup`: exportação e restauração;
- `schemas`: contrato público TITAN FIT 1.0;
- `docs`: decisões arquiteturais e formato de importação;
- `public/examples`: ficha demonstrativa importável.

Veja [a arquitetura](docs/architecture.md) e [o formato de importação](docs/import-format.md).
