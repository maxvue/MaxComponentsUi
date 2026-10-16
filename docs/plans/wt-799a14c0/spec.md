# Especificação técnica — larguras de MaxModal e MaxDrawer

## 1. Contexto & Objetivo

- Data: 16/10/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.8`.
- Worktree e branch: `wt-799a14c0`.
- Raiz confirmada por `pwd` e `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-799a14c0`.
- Modalidade desta entrega: investigação e planejamento; nenhuma implementação ou validação de runtime foi executada.

O consumidor precisa configurar a largura do `MaxDrawer` com a mesma convenção de tipos do `MaxModal` e definir uma largura mínima em ambos. A alteração é aditiva: não deve mudar a apresentação de instâncias que não utilizem as novas props.

### Evidências atuais

| Arquivo existente | Evidência |
| --- | --- |
| `src/components/MaxModal.vue:108–115,406–431` | `width` e `maxWidth` são opcionais, `string \| number`; números viram pixels. `maxWidth` gera `min(valor, calc(100vw - 40px))`. |
| `src/components/MaxModal.vue:666–708` | Painel centralizado, `box-sizing: border-box`, máximo CSS de `100vw - 40px`; até 768px, o máximo CSS sem prop passa a `100vw - 50px`. |
| `src/components/MaxDrawer.vue:5–49,64–115,316–352` | Sem props de largura; `inheritAttrs: false`; apenas classes extras são encaminhadas ao painel. Laterais usam `20rem`; superior/inferior/full usam `100%`. O slot `container` substitui integralmente o painel padrão. |
| `tests/components/MaxModal.test.ts:420–491` | Cobertura atual de padding e máximos, incluindo a expressão responsiva de `maxWidth`. |
| `tests/components/MaxDrawer.test.ts` | Cobertura de visibilidade controlada, slots, posições, foco, rolagem, eventos e gestos; sem testes de props de largura. |
| `tests/browser/MaxOverlayBackdropGesture.browser.ts` | Referência de montagem com Vue, Pinia e Teleport em Chromium real. |

## 2. Escopo

### Incluído

1. Adicionar `width`, `maxWidth` e `minWidth` ao `MaxDrawer`.
2. Adicionar `minWidth` ao `MaxModal`.
3. Documentar as props junto às declarações tipadas e cobrir conversão, reatividade, omissão e composição de limites.
4. Testar layout real em navegador, além dos testes unitários.

### Fora de escopo

- Alterar o funcionamento existente de `width`/`maxWidth` no modal, inclusive suas margens responsivas.
- Adicionar altura, altura mínima/máxima ou breakpoints ao drawer.
- Alterar eventos, visibilidade, stores, foco, máscara, animações, empilhamento ou rolagem.
- Encaminhar `$attrs.style`, criar nova API de slots ou dimensionar o conteúdo do slot `container`.
- Criar helpers públicos, dependências ou uma camada de persistência/cache para dimensões.
- Migrar a store existente para MaxPinia, trocar versões, regenerar resolver, editar artefatos de distribuição manualmente ou publicar pacote.
- Criar outra worktree, trocar branch, commitar, integrar, fazer push ou deploy.

## 3. Arquitetura & Mudanças Técnicas

### Contrato público proposto

| Componente | Prop | Tipo | Ausente | Aplicação |
| --- | --- | --- | --- | --- |
| `MaxDrawer` | `width` | `string \| number` | `undefined` | `width` de `.max-drawer` |
| `MaxDrawer` | `maxWidth` | `string \| number` | `undefined` | `max-width: min(valor, 100vw)` de `.max-drawer` |
| `MaxDrawer` | `minWidth` | `string \| number` | `undefined` | `min-width` de `.max-drawer` |
| `MaxModal` | `minWidth` | `string \| number` | `undefined` | `min-width` de `.max-modal` |

As decisões abaixo são propostas técnicas para revisão, não funcionalidades já existentes:

- Converter somente números para `${valor}px`, inclusive zero. Strings CSS são preservadas na normalização; não transformar `'400'` em `'400px'`.
- Aceitar unidades e expressões CSS válidas, por exemplo `32rem`, `70vw`, `80%`, `calc(100vw - 24px)` e `var(--largura-painel)`. A validade final é responsabilidade do CSS; não criar parser, coerção, validação ou alertas novos.
- O `maxWidth` do drawer segue a estratégia de limite por viewport do modal, mas sem desconto de 40px: a gaveta é ancorada na borda e a posição `full` já ocupa a viewport inteira. Não impor margem de modal ao drawer.
- Não aplicar `max-width` inline ao drawer quando `maxWidth` estiver ausente. Não introduzir restrição global nova para consumidores existentes.
- Aplicar `minWidth` diretamente, sem clamp implícito. Vale a precedência nativa do CSS: `min-width` supera `width`/`max-width` incompatíveis. Um mínimo maior que a viewport pode transbordar; o consumidor deve usar valores coerentes ou um mínimo responsivo, como `min(28rem, calc(100vw - 50px))` no modal. Não prometer contenção quando o mínimo explícito a contradiz.
- Props explícitas prevalecem sobre larguras das classes de posição, salvo CSS externo com `!important`; sem props, preservar todas as regras atuais. Vale também para `top`, `bottom` e `full`; altura e ancoragem não mudam.
- Mudanças reativas atualizam o painel aberto; voltar para `undefined` remove a declaração inline correspondente e devolve o controle ao CSS existente.
- Estilos são exclusivos do painel padrão, nunca da máscara, do conteúdo, nem de elementos fornecidos em `container`.

### Implementação mínima esperada

- `src/components/MaxModal.vue`: acrescentar prop com JSDoc, computed `modal_min_width` ao lado das dimensões atuais e chave `minWidth` no `:style` de `.max-modal`.
- `src/components/MaxDrawer.vue`: acrescentar três props com JSDoc e computeds locais de dimensões, seguindo a normalização existente no modal; ligar `width`, `maxWidth` e `minWidth` ao `:style` do painel.
- Manter `withDefaults`, Composition API, recuo base de quatro espaços, comentários em pt-BR, aspas simples e ponto e vírgula. As tags de abertura alteradas devem ficar em uma linha, conforme `AGENTS.md`; não reformatar o restante do componente.
- Não é necessária mudança SCSS para aplicar as props: estilos inline já sobrescrevem as larguras das posições. Se o navegador demonstrar necessidade de ajuste adicional por flexbox, interromper e revisar a causa e o impacto antes de alterar o layout padrão.
- Usar a biblioteca MaxComponentsUi existente; manter o uso de `@maxvue/max-use` já presente. Normalização local de uma expressão CSS não exige helper reutilizável novo. Não há GET, salvamento ou cache novo para implementar com MaxPinia; preservar a store atual sem migrá-la incidentalmente.

Fluxo: prop opcional → computed de normalização → estilo do painel → cálculo nativo de largura pelo navegador.

### Arquivos de execução

Existentes a alterar:

1. `src/components/MaxModal.vue`.
2. `src/components/MaxDrawer.vue`.
3. `tests/components/MaxModal.test.ts`.
4. `tests/components/MaxDrawer.test.ts`.

Novo proposto:

5. `tests/browser/MaxOverlayWidth.browser.ts`, incluído pelo padrão já configurado em `vitest.browser.config.ts`.

`src/index.ts` já exporta `MaxModal`, `MaxDrawer` e o alias `Drawer`. `package.json` já oferece entradas individuais, e `vite.config.ts` gera declarações/entradas dos SFCs. Não criar interfaces duplicadas nem editar exports para acrescentar props.

## 4. Plano de Execução Faseado

1. Conferir por leitura a worktree, alterações locais, dependências efetivas, scripts e isolamento do harness. Resolver bloqueios de integridade antes de validações dependentes.
2. Implementar as quatro props novas e toda a cobertura unitária e de navegador, preservando contratos não relacionados. Completar o lote antes de executar testes, tipos ou build.
3. Executar validações agrupadas descritas em `plan.md`, diagnosticar falhas em conjunto e revalidar somente o que ficou desatualizado.
4. Conferir tipos gerados e comportamento visual. Registrar resultados reais e pendências; não realizar operações Git de integração ou publicação.

## 5. Critérios de Aceite & Validação

- Números, strings CSS e zero funcionam para todas as novas props; omissão não acrescenta estilos dimensionais.
- Valores mudam sem fechar/reabrir; remoção restaura as regras anteriores.
- `maxWidth` limita o drawer pela viewport sem margem adicional, respeitada a precedência de `minWidth` explícito.
- `minWidth` funciona nos dois painéis, inclusive na composição com `width` e `maxWidth`; conflitos mantêm a regra CSS documentada.
- Sem props, drawer preserva `20rem` nas laterais e `100%` nas demais posições; modal preserva máximos e margens atuais.
- Painel do drawer, máscara e slot `container` continuam com suas responsabilidades atuais.
- Testes existentes de foco, teclado, backdrop, rolagem e controle de visibilidade continuam aprovados.
- Testes reais verificam dimensões usadas com `getBoundingClientRect`, não apenas strings de estilo. O `getComputedStyle` dos testes unitários é um mock e não comprova layout.
- As declarações geradas mantêm as quatro novas props opcionais `string | number`, sem alteração de exports/dependências.

Comandos futuros confirmados no projeto: `npm run check:lockfile`, `npm run test`, `npm run type-check:test`, `npm run lint`, `npm run build` e `npm run test:browser`. O build já inclui `vue-tsc`; não repetir `npm run type-check` sobre a mesma revisão. `npm run verify` permanece gate de pré-release, não executado nem necessário para publicar esta documentação de planejamento.

Documentação oficial consultada: https://vuejs.org/api/sfc-script-setup e https://vuejs.org/guide/essentials/class-and-style, para props tipadas e estilos reativos. O lockfile fixa Vue `3.6.0-rc.10`; a documentação consultada é da linha Vue 3, não uma garantia específica dessa RC. A validação futura usará as dependências efetivamente instaladas.
