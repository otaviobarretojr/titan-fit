# Formato da planilha de cardio — primeiros 5 km

O TITAN FIT aceita arquivos `.json` ou `.titan-cardio` com até 1 MB.

## Contrato

```json
{
  "schemaVersion": 1,
  "id": "primeiros-5k-bloco-1",
  "name": "Primeiros 5 km",
  "goal": "first-5k",
  "description": "Plano progressivo para melhorar o condicionamento.",
  "weeks": [
    {
      "week": 1,
      "title": "Adaptação",
      "sessions": [
        {
          "id": "sem1-sessao1",
          "title": "Caminhada e trote",
          "type": "run",
          "durationMinutes": 30,
          "description": "Alternar caminhada confortável e trote leve.",
          "target": "Concluir em esforço percebido 5/10."
        }
      ]
    }
  ]
}
```

## Tipos aceitos

- `walk`: caminhada;
- `zone2`: Zona 2;
- `run`: trote ou corrida;
- `hiit`: intervalado de alta intensidade;
- `bike`: bicicleta;
- `stairs`: escada;
- `other`: outra atividade.

## Regras

- `schemaVersion` deve ser `1`;
- `goal` deve ser `first-5k`;
- cada semana precisa ter ao menos uma sessão;
- cada sessão precisa de identificador único, título, descrição, tipo e duração maior que zero;
- o plano pode ser substituído sem apagar o histórico já concluído;
- a progressão clínica ou esportiva não é ajustada automaticamente nesta versão.
