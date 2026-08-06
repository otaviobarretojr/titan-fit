# Formato de ficha TITAN FIT 1.0

Arquivos devem terminar em `.titan.json`, ter no máximo 2 MB e seguir o contrato em `schemas/titan-fit-1.0.schema.json`. A validação de runtime em Zod é mais profunda: rejeita IDs ou sequências duplicadas, sessões vazias e intervalos inválidos.

O fluxo é selecionar, validar, pré-visualizar e confirmar. Ao confirmar, a ficha ativa é arquivada e a nova se torna ativa. Execuções anteriores permanecem intactas. Consulte `public/examples/titan-fit-demo.titan.json` como exemplo completo.
