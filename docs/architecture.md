# Arquitetura

O TITAN FIT é um PWA local-first. A interface React acessa serviços de domínio, e estes persistem dados no IndexedDB por meio do Dexie. Não existe conta ou perfil: há um único usuário local implícito.

## Decisões fundamentais

- **Plano e execução são entidades diferentes.** Importar uma ficha grava apenas plano, sessões e exercícios planejados.
- **Histórico é imutável entre fichas.** A importação arquiva o plano ativo e nunca remove `trainingSessions`, `setExecutions` ou cardio.
- **Importação atômica.** Plano, sessões, exercícios e auditoria de sucesso pertencem a uma única transação. Falhas recebem registro sanitizado fora da transação revertida.
- **Migrações aditivas.** Novas versões do Dexie deverão transformar dados sem limpar tabelas.
- **Backup explícito.** O envelope de backup tem schema e versão próprios, permitindo validação antes da restauração transacional.

## Limites desta entrega

Cardio e Evolução têm estados funcionais de apresentação. O executor série por série, cronômetro de descanso e gráficos serão desenvolvidos nas próximas etapas.
