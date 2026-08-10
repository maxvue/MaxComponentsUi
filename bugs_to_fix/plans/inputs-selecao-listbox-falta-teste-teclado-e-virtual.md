# MaxListBox: verificar cobertura de navegação por teclado, virtualização e reconcile de foco

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxListBox.vue:412-559`, `tests/components/MaxListBox.test.ts`
- **Domínio:** inputs-selecao-arquivo

## Problema

`MaxListBox` é o componente mais bem construído do domínio — acessibilidade correta (`role="listbox"`, `role="option"`, `aria-selected`, `aria-disabled`, `aria-activedescendant`, `tabindex`), comentários que explicam decisões não óbvias, e proteções explícitas contra loop de auto-preenchimento. Justamente por isso, várias dessas proteções são invisíveis e frágeis: só um teste garante que continuam valendo.

Comportamentos críticos que precisam de cobertura explícita (verificar quais já existem em `tests/components/MaxListBox.test.ts` e completar os que faltarem):

1. **`fillViewportIfNeeded` e o limite `MAX_AUTO_FILL_PAGES` (linhas 412-434).** A função tem quatro guards em sequência (`autoFillCount`, `!target`, `clientHeight <= 0`, `!shouldLoadMore`, `scrollHeight > clientHeight`) e o comentário do código (linhas 394-411) reconhece uma limitação conhecida. O cenário adversarial — um servidor que sempre responde `hasMore: true` com uma página que não preenche o painel — precisa de teste que prove que o componente para em 20 páginas e não entra em loop infinito.

2. **Descarte de resposta obsoleta (`requestId`, linhas 244 e 257).** A proteção de corrida: uma busca antiga que responde depois de uma nova deve ser ignorada. É a lógica mais sutil do arquivo e a que produz o bug mais confuso se quebrar (resultados de uma busca anterior aparecendo sob um termo novo). Testável resolvendo duas promises fora de ordem.

3. **Reconcile de `focusedIndex` (linhas 484-489).** O comentário explica que sem isso "Enter selecionaria `undefined`, apagando silenciosamente a seleção do usuário". Precisa de teste: focar o índice 5, filtrar até sobrarem 2 itens, e asserir que o foco foi preso (clamp) ao índice 1 — e que cai para -1 quando a lista esvazia.

4. **Navegação por teclado completa (`onKeydown`, linhas 529-559).** ArrowDown/ArrowUp com clamp nos extremos, Home, End, Enter e Espaço. Cada `case` é uma branch.

5. **`scrollFocusedIntoView` (linhas 509-527)** — em particular a chamada síncrona a `setViewport` (linha 526), cujo comentário explica que sem ela o item focado pode não estar renderizado quando `aria-activedescendant` já aponta para ele. É uma correção de acessibilidade real que um refactor removeria sem perceber.

6. **Precedência filtro × `selectedOption` (linhas 342-354).** A regra documentada: um `selectedOption` que não casa com o termo de busca **não** é fixado no topo. Também o caso de `selectedOption` já presente na lista (não deve duplicar).

7. **Virtualização automática (`isVirtual`, linhas 359-362)** — a troca automática acima de `virtualScrollThreshold`, e o override explícito via `virtualScroll`.

8. **`retry` (linhas 292-296)** — refaz a busca da `failedPage` correta, não sempre da página 1.

9. **`watch(isApiMode)` (linhas 314-324)** — a transição de modo local para API depois do mount e a limpeza de estado no caminho inverso.

## Impacto

Este componente é a base dos painéis mestre-detalhe e foi escrito com cuidado acima da média — inclusive com proteções contra loop infinito e contra condições de corrida. Se essas proteções regredirem sem teste, os sintomas são dos piores possíveis: travamento do navegador (loop de fetch), dados de busca cruzados, e perda silenciosa de seleção. Além disso, é um dos poucos componentes do domínio com acessibilidade correta; sem testes, essa qualidade não é preservada por construção.

## Plano de correção

1. Auditar `tests/components/MaxListBox.test.ts` e listar quais dos nove comportamentos acima já têm cobertura.
2. Para os descobertos, adicionar testes seguindo os padrões:
   - **Loop de auto-fill:** `loadOptions` que sempre devolve `{ items: [1 item], hasMore: true }` com `clientHeight` mockado > 0 e `scrollHeight <= clientHeight`; asserir que `loadOptions` é chamado no máximo 21 vezes (1 inicial + 20 auto-fill).
   - **Corrida:** duas chamadas de `loadOptions` com promises controladas; resolver a **primeira** por último e asserir que `apiItems` contém os itens da segunda.
   - **Reconcile de foco:** manipular `focusedIndex` via `wrapper.vm`, reduzir `options` por `setProps` e asserir o clamp.
   - **Teclado:** `trigger('keydown', { key: 'ArrowDown' })` etc. no `.max-listbox-list`, asserindo `focusedIndex` e, para Enter/Espaço, a emissão de `update:modelValue` + `change`.
   - **selectedOption × filtro:** com `filter: true` e um termo que não casa com o `selectedOption`, asserir que ele **não** aparece em `visibleOptions`.
3. Para os que já existirem, confirmar que asseguram o comportamento descrito nos comentários do código (e não apenas a ausência de exceção).

## Verificação

- `npx vitest run tests/components/MaxListBox.test.ts` verde.
- `npm run test:coverage` com `MaxListBox` acima de 90% em statements, branches e functions.
- Teste de loop deve falhar (por timeout ou contagem) se `MAX_AUTO_FILL_PAGES` for removido — prova de que o teste protege a guarda real.
- Teste de corrida deve falhar se a checagem `thisRequest !== requestId` (linha 257) for removida.
