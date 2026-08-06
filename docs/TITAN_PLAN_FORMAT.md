# Formato de ficha TITAN FIT

A versão v0.2 importa arquivos JSON com extensão `.json` ou `.titan`.

## Regras

- `schemaVersion` deve ser `1`.
- O arquivo deve ter no máximo 1 MB.
- IDs de treinos e exercícios devem ser únicos.
- Nenhum HTML ou código é executado.
- A ficha só substitui a atual depois da confirmação do usuário.
- O plano validado é salvo localmente no aparelho.
- Vídeos são opcionais e devem apontar para o YouTube.

## Estrutura

```json
{
  "schemaVersion": 1,
  "id": "bloco-hipertrofia-01",
  "name": "Hipertrofia — Bloco 1",
  "description": "Ficha de seis semanas.",
  "createdAt": "2026-08-06T12:00:00.000Z",
  "author": "Coach TITAN",
  "workouts": [
    {
      "id": "segunda-a",
      "day": "Segunda",
      "title": "Peitoral e dorsais",
      "focus": "Peitoral superior",
      "exercises": [
        {
          "id": "supino-inclinado-01",
          "name": "Supino inclinado",
          "muscleGroup": "Peitoral",
          "sets": 4,
          "minReps": 8,
          "maxReps": 10,
          "targetRir": 2,
          "restSeconds": 120,
          "technique": "Controle a descida e mantenha as escápulas estáveis.",
          "commonMistakes": ["Perder a estabilidade das escápulas"],
          "alternatives": ["Supino inclinado com halteres"],
          "video": {
            "url": "https://www.youtube.com/watch?v=VIDEO_ID",
            "title": "Execução do exercício"
          }
        }
      ]
    }
  ]
}
```

## Links do YouTube aceitos

- `youtube.com/watch?v=...`
- `youtu.be/...`
- `youtube.com/shorts/...`
- `youtube.com/embed/...`
- `youtube.com/live/...`

O aplicativo extrai o identificador do vídeo e não armazena HTML incorporado.
