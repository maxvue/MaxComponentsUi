# Testes do MaxInputMarkdown mockam o editor por completo e não cobrem sincronização nem destruição

- **Categoria:** falta-de-teste
- **Severidade:** alta
- **Arquivo(s):** `tests/components/MaxInputMarkdown.test.ts:6-28`, `src/components/MaxInputMarkdown.vue:96-121`
- **Domínio:** inputs-selecao-arquivo

## Problema

Cobertura atual do `MaxInputMarkdown`: **62,5% de statements e 25% de branches** — a pior taxa de branches do domínio. A causa está na estratégia do teste: `@tiptap/vue-3` é mockado inteiro (linhas 6-28), com `useEditor` devolvendo um objeto fixo. Os seis testes existentes (linhas 74-104) verificam apenas renderização estática: existe, tem toolbar, tem conteúdo, aplica `minHeight`/`maxHeight`, aplica classe disabled, passa label.

**Nenhum** dos comportamentos de lógica real do componente é exercitado:

1. **`onUpdate` → `update:modelValue` (linhas 96-98).** O callback que converte o conteúdo do editor em markdown e emite ao pai — o contrato central do componente — nunca é invocado. O mock nem sequer registra o `onUpdate` passado a `useEditor`.

2. **Sincronização pai → editor (linhas 107-114).** O watch de `props.modelValue` que compara com o markdown atual e chama `setContent` só quando diverge. Toda a lógica anti-loop está nesse `if (val !== current)`, e ela nunca é testada. Um bug aqui produz loop infinito de atualização — o modo de falha mais caro possível.

3. **`onMounted` com valor inicial (linhas 101-103).** `if (props.modelValue) editor.value?.commands.setContent(props.modelValue)` — o carregamento de conteúdo existente, que é como o componente é usado em toda tela de edição.

4. **Destruição do editor (linha 121).** `onBeforeUnmount(() => editor.value?.destroy())`. O `destroy` é vital: um editor TipTap não destruído mantém plugins do ProseMirror, listeners de DOM e observers vivos — vazamento de memória clássico em SPA que navega entre telas. O mock **tem** `destroy: vi.fn()` (linha 16), mas nenhum teste jamais o asserta.

5. **Reação a `disabled` (linhas 116-119).** O watch que chama `setEditable(!val)`. O teste da linha 96 verifica só a classe CSS, não que o editor foi efetivamente travado.

6. **`closePopovers` (linha 105)** é uma função vazia (`const closePopovers = () => {};`) ligada ao `@click.stop` da linha 3 — código morto que ninguém testou nem removeu.

## Impacto

O componente que manipula conteúdo rich-text — com a maior superfície de risco do domínio (XSS, loop de reatividade, vazamento de memória) — está protegido apenas contra regressões de layout. Qualquer alteração na cadeia de sincronização ou no ciclo de vida do editor passa pelos testes sem resistência. Especificamente, uma regressão que remova o `destroy()` não seria detectada, e vazamentos de memória só aparecem em produção, sob uso prolongado.

## Plano de correção

Ampliar `tests/components/MaxInputMarkdown.test.ts` mantendo o mock (montar TipTap real em happy-dom é frágil), mas tornando-o capaz de exercitar a lógica:

1. **Capturar a config passada a `useEditor`.** Guardar o objeto de opções numa variável do escopo do mock, para poder invocar `config.onUpdate({ editor: mockEditor })` manualmente.
2. **Teste de emissão:** invocar o `onUpdate` capturado e asserir que `update:modelValue` foi emitido com o retorno de `storage.markdown.getMarkdown()`.
3. **Teste de sincronização pai → filho:** `setProps({ modelValue: '# novo' })` com `getMarkdown()` devolvendo algo diferente deve chamar `commands.setContent` com `'# novo'`.
4. **Teste anti-loop:** `setProps({ modelValue: '**hello**' })` quando `getMarkdown()` já devolve `'**hello**'` **não** deve chamar `setContent` — é exatamente a branch de guarda hoje descoberta.
5. **Teste de conteúdo inicial:** montar com `modelValue: '# titulo'` deve chamar `setContent('# titulo')` no `onMounted`.
6. **Teste de destruição:** `wrapper.unmount()` deve chamar `editor.destroy()` exatamente uma vez.
7. **Teste de `disabled` reativo:** `setProps({ disabled: true })` deve chamar `setEditable(false)`; voltar a `false` deve chamar `setEditable(true)`.
8. **Remover `closePopovers`** (linha 105) e o `@click.stop` associado, ou implementá-lo — código morto não deve permanecer.

## Verificação

- `npx vitest run tests/components/MaxInputMarkdown.test.ts` verde com os novos casos.
- `npm run test:coverage` deve elevar `MaxInputMarkdown` de 62,5%/25% para acima de 85% de statements e 75% de branches.
- Confirmar que a asserção de `destroy` falha se a linha 121 for removida (teste que efetivamente protege contra o vazamento).
