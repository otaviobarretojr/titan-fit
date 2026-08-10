# TITAN FIT · Android + Health Connect

Esta pasta contém a implementação nativa planejada para a integração do TITAN FIT com o Health Connect.

## Arquitetura

Galaxy Watch → Samsung Health → Health Connect → `TitanHealthConnectPlugin` → aba Samsung Health do TITAN FIT.

A interface React já consome o contrato `TitanHealthConnect`. No PWA, a ponte nativa não existe e a tela permanece em modo de espera. No Android híbrido, o plugin Capacitor expõe as mesmas operações: disponibilidade, permissões e leitura de amostras.

## Base recomendada

- Capacitor 8.4.x.
- Android nativo gerado com `npx cap add android`.
- Health Connect Jetpack estável `androidx.health.connect:connect-client:1.1.0`.
- Pacote Android: `com.otaviobarretojr.titanfit`.

## Mapeamento dos dados

- Sono → `SleepSessionRecord`.
- Frequência cardíaca → `HeartRateRecord`.
- Passos → `StepsRecord`.
- Calorias ativas → `ActiveCaloriesBurnedRecord`.
- Exercícios → `ExerciseSessionRecord`.
- Distância → `DistanceRecord`.
- Composição corporal inicial → `BodyFatRecord`.

## Passos para gerar o container Android

1. Instalar `@capacitor/core`, `@capacitor/android` e `@capacitor/cli` na mesma versão estável.
2. Executar `npm run build`.
3. Executar `npx cap add android` na primeira vez e `npx cap sync android` nas seguintes.
4. Copiar `TitanHealthConnectPlugin.kt` para o pacote Android do app.
5. Usar `MainActivity.kt` como referência de registro do plugin local.
6. Adicionar a dependência indicada em `health-connect.gradle.kts`.
7. Mesclar as permissões de `AndroidManifest.health-connect.xml` no manifesto real.
8. Abrir com `npx cap open android`, compilar e instalar no aparelho para validar permissões e sincronização real.

## Privacidade

O TITAN solicita apenas leitura dos tipos usados pela interface: sono, frequência cardíaca, passos, calorias ativas, sessões de exercício, distância e gordura corporal. A sincronização é iniciada pelo usuário e o app deve explicar claramente por que cada dado é usado.

## Histórico

Sem a permissão adicional de histórico, a leitura de dados originados por outros aplicativos pode ficar limitada ao período permitido pelo Health Connect. O TITAN começa com sincronização recente e só deve pedir histórico ampliado quando houver uma necessidade explícita de produto.
