# MaxAccordion e MaxTabs registram headers por ordem de montagem, não por ordem no DOM — navegação por setas fica fora de ordem

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxAccordion.vue:86-91`, `src/components/MaxAccordion.vue:98-116`, `src/components/MaxTabs.vue:118-123`, `src/components/MaxTabs.vue:156-174`
- **Domínio:** overlays-navegacao

## Problema

Ambos os contêineres registram seus filhos com `push` em `onMounted`:

`src/components/MaxAccordion.vue:86-91`
```
const registerHeader = (value, el, disabled) => {
    headers.value.push({ value, el, disabled });
    ...
};
```

`src/components/MaxTabs.vue:118-123` — idêntico para `tab_headers`.

A ordem do array é, portanto, a **ordem de montagem**, e é essa ordem que governa a navegação por setas (`navigate`, `MaxAccordion.vue:98-116` e `MaxTabs.vue:156-174`), incluindo `first`/`last`/wrap-around.

Ordem de montagem coincide com ordem do DOM no caso simples, mas **diverge** quando:

1. **Um painel/aba é adicionado dinamicamente no meio da lista.** Um novo item inserido na posição 1 monta por último e é registrado no **fim** do array. ArrowDown/ArrowRight passa a saltar posições em ordem visualmente aleatória.
2. **Um item é removido e reinserido** (ex.: um `v-if` que alterna). O `unregister` filtra por `value` (`MaxAccordion.vue:88-90`, `MaxTabs.vue:120-122`) e a remontagem faz `push` no fim.
3. **Itens vindos de fontes diferentes no mesmo slot** (parte estática, parte `v-for`) montam em ordem de declaração, mas um `<Suspense>` ou componente assíncrono no meio inverte a ordem.

Além disso, o `registerHeader` do `MaxAccordion` (linha 87) **não protege contra `value` duplicado**: dois painéis com o mesmo `value` geram duas entradas, e o `unregister` de um deles (linha 89, `filter` por `value`) remove **ambas**. O `MaxTabs` tem exatamente o mesmo padrão (linhas 119-122). Note que o registro legado do `MaxTabs` **sim** protege (`if (! registered_tabs.value.includes(id))`, linha 85) — inconsistência entre os dois registros do mesmo arquivo.

O `MaxAccordion` tem 100% de cobertura nos testes existentes de navegação (`tests/components/MaxAccordion.test.ts:135`), mas o teste cobre apenas a ordem estática.

## Impacto

Em listas dinâmicas de abas ou painéis (adicionar/remover aba, filtro que esconde itens), a navegação por teclado percorre os itens em ordem diferente da visual — comportamento desorientador e uma falha de conformidade WAI-ARIA, que exige que a navegação siga a ordem de leitura.

## Plano de correção

1. Substituir a ordenação por ordem de montagem por ordenação por **posição no DOM**, no momento da navegação. Como os registros já guardam o `el` (`HTMLElement`), basta ordenar antes de navegar:
   ```
   const ordered = [...headers.value].sort((a, b) => (
       a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
   ));
   ```
   Aplicar em `navigate` de `MaxAccordion.vue:98` e `MaxTabs.vue:156`, antes do `filter` por `disabled`.
2. Aplicar a mesma ordenação ao `fallback_tab_value` (`MaxTabs.vue:126`), que hoje pega o primeiro **registrado** e não o primeiro **visual** — o mesmo bug afeta qual aba recebe `tabindex="0"`.
3. Proteger contra `value` duplicado no registro: emitir um `console.warn` em dev quando um `value` já registrado for registrado de novo, e usar uma identidade estável (o próprio `el`) no `unregister` em vez de filtrar por `value`:
   ```
   return () => { headers.value = headers.value.filter((header) => header.el !== el); };
   ```
   Aplicar nos dois arquivos.
4. Alinhar `MaxTabs.registerTabHeader` (linha 118) com a proteção que o `registerTab` legado (linha 84) já tem.

## Verificação

- Teste em `tests/components/MaxAccordion.test.ts`: montar 3 painéis, remover o do meio via `v-if` e reinseri-lo, depois disparar `ArrowDown` a partir do primeiro header e afirmar que o foco vai para o painel **visualmente** seguinte (o reinserido), não para o último.
- Teste equivalente em `tests/components/MaxTabs.test.ts` com `ArrowRight`.
- Teste de `value` duplicado: montar dois painéis com o mesmo `value`, desmontar um e afirmar que o outro continua registrado (a navegação ainda o alcança).
- Teste de `fallback_tab_value`: com abas registradas fora de ordem de DOM e sem `v-model`, afirmar que o `tabindex="0"` vai para a primeira aba **visual**.
- `npx vitest run tests/components/MaxAccordion.test.ts tests/components/MaxTabs.test.ts`
