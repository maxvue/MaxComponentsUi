# Plano de implementação — calha virtual no `MaxInputTextList`

## Objetivo e resultado

Manter a numeração proporcional à viewport/overscan e evitar remontagem integral ao editar textos extensos, com alinhamento e scroll precisos para pelo menos 10.000 linhas.

## Escopo e fora de escopo

- Virtualizar apenas a calha de números e reduzir contagens repetidas.
- Preservar textarea nativo, Tab/Enter, `v-model` e atributos do `InputBase`.
- Não criar editor de código, syntax highlighting ou virtualizar o texto nativo.
- Não usar canvas se ele prejudicar seleção, zoom ou acessibilidade; preferir DOM virtual já disponível.

## Arquivos

- Alterar `src/components/MaxInputTextList.vue` e `tests/components/MaxInputTextList.test.ts`.
- Reusar/ampliar `src/composables/useVirtualList.ts` somente se a capacidade necessária não existir.
- Criar benchmark isolado para 100/1.000/10.000 linhas.

## Dependências e ordem

1. Medir altura real de linha/padding e congelar scroll atual.
2. Implementar contagem coalescida e janela da calha.
3. Testar edição, resize, zoom e benchmark.

## Passos

1. Definir altura de linha em uma única constante/token usada por CSS e cálculo.
2. Contar quebras em passagem simples; coalescer atualização por ciclo de render sem manter array `1..N`.
3. Alimentar `useVirtualList` com índices leves ou calcular diretamente primeiro/último número pela viewport.
4. Renderizar spacer com altura total e janela posicionada; números exibidos mantêm valor global.
5. Em `syncScroll`, atualizar viewport pelo `scrollTop/clientHeight` sem copiar scroll para milhares de nós.
6. Recalcular viewport em resize e resetar limites quando conteúdo encolher.
7. Preservar posição/cursor após Tab, Enter e atualização externa.
8. Para textos pequenos, manter modo simples se benchmark demonstrar benefício e usar limiar configurável/interno coerente.

## Migração e compatibilidade

Sem alteração de props/emits. Classes públicas principais permanecem; testes/consumidores não devem depender da existência de um nó por linha fora da viewport. Documentar que a calha é virtual e não faz parte do conteúdo copiável.

## Testes

- Unitários: 1/10/10.000 linhas, viewport inicial/meio/fim, overscan, conteúdo encolhendo e resize.
- Integração: scroll bidirecional, alinhamento visual, atualização externa, Tab/Enter e cursor.
- A11y: calha `aria-hidden`, textarea conserva nome/estado e zoom 200%.
- Benchmark: mount/input/scroll, nós DOM e heap com dataset fixo; tempos apenas informativos.

## Critérios de aceite

- Com 10.000 linhas, nós `.line-number` ficam limitados a linhas visíveis mais overscan.
- Primeiro/último número visível correspondem ao scroll, sem desalinhamento maior que 1 px no teste visual.
- Digitação não cria/remonta 10.000 nós.
- `update:modelValue`, Tab, Enter e scroll continuam passando.
- Benchmark versionado cobre 100/1.000/10.000.

## Riscos e rollback

Altura divergente causa drift; centralizar constante e testar zoom. ResizeObserver pode vazar; limpar no unmount. Contagem ainda é O(texto), mas ocorre uma vez por mudança; otimização incremental só entra se perfil justificar. Rollback permite desativar janela por limiar sem alterar editor.

## Validação final

Executar testes do componente/composable, benchmark em navegador, inspeção de nós, `npm run type-check`, suíte, lint e `git diff --check`.
