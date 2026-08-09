# Auditoria de Interface — v0.55

## Escopo auditado

- Home / Hoje.
- Programação (musculação, cardio e Biblioteca TITAN).
- Cardio e registro de sessão.
- Evolução (corpo e treino/PRs).
- Execução de treino.
- Importação e seleção de projeto.
- Onboarding e geração de planos.
- Configurações, Perfil, Kit do Testador, Feedback Beta e Backup.
- Navegação inferior, cabeçalho, PWA e estados vazios.
- Tipografia, espaçamento, áreas de toque, hierarquia, rótulos e consistência entre módulos.

## Achados críticos

### 1. Cascata de estilos excessiva

O aplicativo carrega dezenas de folhas CSS acumuladas por versão e hotfix. Muitas usam `!important`, o que torna a aparência dependente da ordem de importação e aumenta o risco de uma aba ficar com fonte, raio, cor ou espaçamento diferente das demais.

**Ação v0.55:** criada uma camada final `ui-audit-v055.css` para estabilizar tipografia, ritmo vertical, paddings, controles e navegação sem reescrever os módulos funcionais.

**Próxima dívida técnica:** consolidar gradualmente estilos legados em menos arquivos.

### 2. Fonte declarada mas não carregada

`tokens.css` declarava `Inter`, porém o aplicativo não importa essa fonte nem mantém arquivos locais dela. O resultado depende do dispositivo e pode variar entre Android, Samsung, Windows e outros ambientes.

**Ação v0.55:** padronização para uma pilha nativa e offline (`system-ui`, Segoe UI, Roboto etc.), garantindo comportamento previsível sem depender de CDN.

### 3. Escala tipográfica irregular

Foram encontrados títulos de página variando de aproximadamente 1.6rem até 2.6rem, eyebrows/legendas em escalas diferentes e diversos pesos próximos (700, 760, 780, 800), além de overrides específicos por aba.

**Ação v0.55:** escala única para título de aplicativo, título de página, título de card, eyebrow, corpo e texto auxiliar.

### 4. Espaçamento e densidade inconsistentes

Há cards de 14, 15, 16, 18, 20 e 24 px de padding sem regra semântica clara, além de raios entre 14 e 32 px. Em telas estreitas isso dá sensação de módulos feitos em momentos diferentes.

**Ação v0.55:** tokens de espaço e raio comuns; cards principais convergem para 16 px de padding e 22 px de raio, com exceções deliberadas para Home/treino.

### 5. Controles com densidade diferente

Botões e inputs variam em altura e raio entre abas. Alguns campos podem parecer menores ou mais apertados que outros.

**Ação v0.55:** altura mínima de 48 px para ações e campos principais, raio de controle consistente e fontes de input em 16 px.

## Achados de nomenclatura e conteúdo

### Home

- Saudação ainda usa `Otávio` fixo em vez do nome do perfil ativo.
- Métrica `Cardios` deve evoluir para `Sessões de cardio` ou rótulo equivalente.
- Métrica `Progredir` é ambígua; `Sinais de progressão` comunica melhor o significado.

### Programação

- Estrutura `Musculação | Cardio | Biblioteca` está coerente.
- Uso de símbolos de fonte (`⌁`, `♡`, setas e caracteres especiais) pode variar visualmente entre sistemas. Migrar para SVG próprios quando possível.

### Cardio

- Título `Condicionamento + 5 km` é específico para um objetivo e não representa usuários com saúde cardiovascular, 10 km, condicionamento geral ou perda de gordura.
- Recomendação: `Cardio e condicionamento`, deixando o objetivo individual aparecer dentro do plano do usuário.

### Evolução

- Aba inferior é chamada `Progresso`, enquanto o título da página é `Evolução` e o conceito de produto é `Centro de Evolução`.
- Recomendação: padronizar a navegação como `Evolução`.
- `Hall dos PRs` é compreensível para usuários experientes, mas pode ser acompanhado por `Recordes pessoais` para usuários novos.

### Configurações

- A versão aparece corretamente na área de Aplicativo, mas o prompt de atualização também exibe a versão; isso conflita com a decisão de manter número de versão apenas em Configurações.
- Perfil, Kit do Testador e Feedback Beta estão montados indiretamente dentro do componente de Backup. Funciona, mas a composição deveria ser renomeada/refatorada depois para refletir a responsabilidade real.

## Achados técnicos de versão

Há deriva de metadados:

- `App.tsx`: 0.37.0.
- `BackupPanel.tsx`: 0.37.0.
- `vite.config.ts` cache: v0.37.0.
- `package.json`: 0.37.0.
- `package-lock.json`: 0.1.0.

Isso não impede o funcionamento, mas dificulta diagnóstico, cache e identificação de release. Deve ser corrigido em uma atualização dedicada de versionamento, evitando alterar lockfile de forma parcial.

## PWA / navegador

O manifesto já usa tema claro, enquanto `index.html` ainda usava cor escura no `theme-color`.

**Ação v0.55:** alinhado `theme-color` do HTML ao tema claro atual para evitar barra superior escura fora do padrão visual.

## Prioridades pós-auditoria

### P0 — aplicado na v0.55

- Fonte offline consistente.
- Escala tipográfica comum.
- Espaçamento e padding comuns.
- Controles com tamanho mínimo confortável.
- Navegação inferior mais legível.
- Theme color coerente.

### P1 — próxima correção funcional/textual

- Saudação dinâmica pelo perfil.
- `Progresso` → `Evolução` na navegação.
- `Condicionamento + 5 km` → nomenclatura genérica.
- Remover número da versão do prompt de atualização.
- Revisar rótulos `Cardios`, `Progredir` e `Hall dos PRs`.

### P2 — consolidação arquitetural

- Reduzir o número de arquivos CSS legados.
- Remover overrides redundantes e `!important` onde não forem mais necessários.
- Criar componentes compartilhados de PageHeader, SectionHeader, Card, Button e Field.
- Migrar símbolos tipográficos usados como ícones para SVG próprios.
- Unificar metadados de versão e cache PWA.

## Critério visual adotado

A interface deve parecer construída como um único produto, não como uma sequência de versões: mesma família tipográfica, títulos da mesma importância com a mesma escala, espaçamento previsível, botões confortáveis para uma mão e nomenclatura que faça sentido para qualquer usuário do TITAN FIT.
