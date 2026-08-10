# TITAN FIT — Android Health Connect bridge

Esta pasta documenta a camada Android nativa que alimentará a aba Samsung Health sem alterar o funcionamento do PWA.

## Fluxo

Galaxy Watch → Samsung Health → Health Connect → plugin nativo `TitanHealthConnect` → React/TITAN FIT.

## Contrato esperado pelo frontend

O plugin Capacitor deve registrar o nome `TitanHealthConnect` e expor:

- `isAvailable()` → `{ available: boolean }`
- `requestPermissions({ types })` → `{ granted: boolean }`
- `readSamples({ types, since? })` → `{ samples: HealthSample[] }`

Os tipos aceitos pelo frontend são: `sleep`, `heart-rate`, `steps`, `active-calories`, `exercise`, `distance` e `body-composition`.

## Mapeamento Health Connect

- `sleep` → `SleepSessionRecord`
- `heart-rate` → `HeartRateRecord`
- `steps` → `StepsRecord`
- `active-calories` → `ActiveCaloriesBurnedRecord`
- `exercise` → `ExerciseSessionRecord`
- `distance` → `DistanceRecord`
- `body-composition` → `WeightRecord`, `BodyFatRecord` e, quando disponível, outros registros corporais suportados

## Regras de privacidade

Solicitar somente permissões de leitura necessárias para as métricas habilitadas no TITAN. A sincronização deve acontecer sob ação explícita do usuário na primeira versão nativa. O app deve respeitar revogação de permissões e nunca tratar ausência de dados como zero.

## Histórico

Sem permissão adicional de histórico, Health Connect aplica limites de leitura para dados anteriores à concessão. A primeira versão do TITAN deve trabalhar com a janela padrão e solicitar acesso histórico somente se houver necessidade clara para relatórios de longo prazo.

## Próxima implementação nativa

1. Adicionar Capacitor ao projeto React/Vite.
2. Gerar a plataforma Android.
3. Adicionar `androidx.health.connect:connect-client`.
4. Declarar permissões de leitura no `AndroidManifest.xml`.
5. Implementar o plugin Kotlin `TitanHealthConnect`.
6. Testar no aparelho Android real com Samsung Health e Health Connect habilitados.
7. Só então habilitar o estado “Conectado” na aba Samsung Health.
