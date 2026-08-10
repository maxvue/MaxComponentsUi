# MaxInputIconPicker: busca, paginação por scroll, validação e limpeza de estado sem teste

- **Categoria:** falta-de-teste
- **Severidade:** alta
- **Arquivo(s):** `tests/components/MaxInputIconPicker.test.ts:1-46`, `src/components/MaxInputIconPicker.vue:154-301`
- **Domínio:** inputs-selecao-arquivo

## Problema

Cobertura atual: **64,1% de statements, 46,9% de branches, 56% de functions** — a pior combinação do domínio. O arquivo de teste tem **um único caso** (linhas 15-45), que verifica a sanitização de SVG malicioso. É um bom teste — e é o único.

Todo o restante da lógica do componente está sem cobertura:

1. **`enqueueSvgFetch` (linhas 190-218)** — a fila com debounce de 150ms, o `splice(0, 200)` que respeita o limite de lote, o filtro de nomes já em cache/já enfileirados (linha 191), o `catch` silencioso de rede (linha 211) e a re-agenda quando sobram itens na fila (linha 216). Nenhuma dessas branches é exercitada; o teste único passa por ali por acidente, com um lote de 1 item.

2. **`onScrollerScroll` (linhas 225-240)** — todo o cálculo de linhas visíveis (`firstRow`, `visibleRows`, `lastRow`) a partir de `scrollTop`/`clientHeight`. É o mecanismo que faz o carregamento sob demanda funcionar, e nenhum teste dispara um evento de scroll.

3. **`preloadInitialSvgs` (linhas 245-251)** — o pré-carregamento das primeiras linhas ao abrir o drawer.

4. **`fetchCuratedIcons` (linhas 256-272)** — em particular a branch de query (`?q=` com `encodeURIComponent`, linha 260) versus sem query, o guard `Array.isArray(data)` (linha 264) que protege contra resposta malformada do servidor, e o `catch` que zera a lista (linha 265).

5. **A busca com debounce (linhas 291-297)** — a regra `val.length < 2` que decide entre listar tudo e buscar no servidor. É o comportamento mais visível ao usuário e está descoberto; o template inclusive tem um estado de UI dedicado a ele (linha 36: "Nenhum ícone encontrado para...").

6. **`openDrawer` (linhas 274-283)** — a limpeza completa de estado (`search`, `curatedIcons`, `svgCache`, `svgFetchQueue`) e o `clearTimeout` do timer pendente (linha 280). Esse `clearTimeout` é a única proteção contra um timer órfão disparar após o drawer fechar; sem teste, uma regressão aqui vira vazamento silencioso.

7. **`selectIcon` (linhas 285-289)** e a cadeia de validação `isRequiredDone` → `testIsDone` → `caution` → `error_msg` (linhas 154-174), incluindo a resolução dos aliases de mensagem de erro (`errMsg`/`error_message`/`error_msg`, linha 171).

8. **`toRows` (linhas 178-182)** — o agrupamento em linhas de `COLS = 8`, incluindo a última linha parcial.

Nenhum teste cobre também o guard de `disabled` em `openDrawer` (linha 275).

## Impacto

Um componente que faz duas chamadas de rede distintas, mantém uma fila com debounce, um cache e um timer, e alimenta um `v-html` — tudo isso sustentado por um único teste. A infraestrutura de limpeza (`clearTimeout`, reset de cache) é justamente o tipo de código que quebra silenciosamente e cujo sintoma (requisições órfãs, memória crescente ao abrir/fechar o drawer repetidamente) só aparece em uso real.

## Plano de correção

Expandir `tests/components/MaxInputIconPicker.test.ts`, reaproveitando o padrão de `vi.stubGlobal('fetch', ...)` já estabelecido no teste existente (linhas 18-27):

1. **`toRows`:** com 20 ícones, produzir 3 linhas (8/8/4). Teste puro, sem rede.
2. **`fetchCuratedIcons` com query:** setar `search` para `'user'`, avançar o debounce de 400ms e asserir que a URL chamada contém `?q=user` corretamente encodada.
3. **Busca curta:** `search` com 1 caractere deve chamar `fetchCuratedIcons()` **sem** query — a branch `val.length < 2`.
4. **Resposta malformada:** `fetch` devolvendo `{ foo: 'bar' }` (não-array) deve resultar em `curatedIcons` vazio, não em crash — cobre o `Array.isArray` da linha 264.
5. **Erro de rede:** `fetch` rejeitando deve zerar `curatedIcons` e desligar `isLoading`.
6. **`openDrawer` limpa estado:** popular `svgCache` e `svgFetchQueue`, chamar `openDrawer` e asserir que ambos ficaram vazios e que o timer pendente foi cancelado (usar `vi.useFakeTimers` e verificar que nenhum fetch de SVG dispara depois).
7. **`openDrawer` respeita `disabled`:** com `disabled: true`, `visible` permanece `false` e nenhum fetch ocorre.
8. **`onScrollerScroll`:** disparar o evento com `scrollTop`/`clientHeight` controlados e asserir que os nomes das linhas visíveis corretas foram enfileirados.
9. **Lote de 200:** enfileirar 250 nomes e asserir que o primeiro POST leva exatamente 200 e que uma segunda rodada é agendada.
10. **`selectIcon`:** emite `update:modelValue` com o nome, fecha o drawer e recalcula `isDone`.
11. **Validação:** com `required: true` e valor vazio, `caution` é verdadeiro e `error_msg` é `'Campo obrigatório'`; com `errMsg` em attrs, a mensagem customizada prevalece.

## Verificação

- `npx vitest run tests/components/MaxInputIconPicker.test.ts` verde.
- `npm run test:coverage` deve levar o componente de 64,1%/46,9%/56% para acima de 85% em statements, 75% em branches e 85% em functions.
- O teste de sanitização existente (linha 15) permanece verde e intocado.
