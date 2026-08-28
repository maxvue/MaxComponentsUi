# Plano de Implementação — Issue #57

## Descrição e Causa Raiz

### Problema Relatado
O componente [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/src/components/MaxInputSelect.vue) apresenta uma falha na lógica de visibilidade do placeholder e do valor selecionado:
1. **Renderização simultânea (Sobreposição visual):** Ao utilizar valores considerados *falsy* em JavaScript (como `0`, `false` ou `null` quando associado a uma opção válida), a condição de exibição do placeholder avalia como verdadeira ao mesmo tempo em que a opção correspondente é encontrada, fazendo com que o elemento `.placeholder-select` e o elemento `.value-div` sejam renderizados simultaneamente no DOM, sobrepondo os textos.
2. **Ocultação indevida do placeholder em valores órfãos:** Quando `temp_value` possui um valor que não existe na lista `options` (ex.: `'zzz'`), a expressão `!temp_value` avalia como falsa, ocultando o placeholder. No entanto, como nenhuma opção correspondente existe em `options`, `option_selected` fica vazio e `.value-div` também não é renderizado. O campo fica completamente em branco sem exibir nem o placeholder nem o valor.

### Causa Raiz Comprovada
- **Arquivo e Linhas:** [`src/components/MaxInputSelect.vue:L3-L5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/src/components/MaxInputSelect.vue#L3-L5) e [`src/components/MaxInputSelect.vue:L23-L33`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/src/components/MaxInputSelect.vue#L23-L33).
- **Trecho com Defeito:**
  ```html
  <div v-if="attrs.placeholder !== undefined && (!temp_value || temp_value === '')" class="placeholder-select">
      {{ attrs.placeholder }}
  </div>
  ```
  e
  ```html
  <div
      class="value-div"
      v-if="option_selected && Object.keys(option_selected).length > 0"
      :style="{ color: option_selected.color }"
  >
  ```
- **Fluxo Causal e Rastreamento Reverso:**
  1. `props.modelValue` / `temp_value` recebe `0`, `false` ou `null`.
  2. `computed: option_selected` localiza a opção correspondente em `options` (ex.: `{ value: 0, name: 'Opção 0' }`).
  3. No template, a condição `(!temp_value || temp_value === '')` avalia `!0 === true`, `!false === true` ou `!null === true`, renderizando `.placeholder-select`.
  4. Concomitantemente, `option_selected && Object.keys(option_selected).length > 0` avalia como `true`, renderizando `.value-div`.
  5. Rastreamento reverso de dados: UI (`MaxInputSelect` template) ⇄ Component State (`temp_value`, `option_selected`, `hasSelectedOption`) ⇄ Props / v-model (`modelValue`, `options`). O componente UI depende de uma verificação inadequada no template (`!temp_value`) em vez de verificar se há de fato uma opção válida selecionada (`hasSelectedOption`).

---

## Arquivos afetados
- [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/src/components/MaxInputSelect.vue): Atualização da lógica de visibilidade e propriedades do placeholder.
- [`tests/components/MaxInputSelect.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/tests/components/MaxInputSelect.test.ts): Adição de casos de teste para valores `0`, `false`, `null` com opção e valores órfãos.
- [`tests/components/__repro_select.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/tests/components/__repro_select.test.ts): Limpeza/remoção do arquivo temporário de reprodução após migração dos testes para a suíte oficial.

---

## Execuções propostas

### Passo 1 — Definição de `hasSelectedOption`, `placeholderText` e `showPlaceholder` no Script
No script de [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/src/components/MaxInputSelect.vue):
1. Declarar a prop `placeholder?: string | undefined` em `defineProps` (com default `undefined`) para tipagem explícita no TypeScript.
2. Criar a computed property `hasSelectedOption`:
   ```typescript
   const hasSelectedOption = computed(() => Boolean(option_selected.value && Object.keys(option_selected.value).length > 0));
   ```
3. Criar a computed property `placeholderText`:
   ```typescript
   const placeholderText = computed(() => (props.placeholder !== undefined ? props.placeholder : attrs.placeholder));
   ```
4. Criar a computed property `showPlaceholder`:
   ```typescript
   const showPlaceholder = computed(() => placeholderText.value !== undefined && !hasSelectedOption.value);
   ```

### Passo 2 — Atualização do Template no SFC
No template de [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/src/components/MaxInputSelect.vue):
1. Substituir a diretiva `v-if` do `.placeholder-select` por `v-if="showPlaceholder"` e o texto por `{{ placeholderText }}`.
2. Atualizar a diretiva `v-if` do `.value-div` para utilizar `v-if="hasSelectedOption"`.
3. Dessa forma, a renderização de `.placeholder-select` e `.value-div` torna-se estritamente mutuamente exclusiva por construção (`showPlaceholder` requer `!hasSelectedOption`).

---

## Especificação de Teste TDD (Red-Green)

### Cenários a cobrir em [`tests/components/MaxInputSelect.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-57/tests/components/MaxInputSelect.test.ts):
1. **Red Stage (Falha antes da correção):**
   - Montar `MaxInputSelect` com `modelValue: 0`, `options: [{ value: 0, name: 'Opção Zero' }]` e `placeholder: 'Selecione'`.
     - *Esperado:* `.placeholder-select` NÃO existe, `.value-div` existe com texto `'Opção Zero'`.
   - Montar `MaxInputSelect` com `modelValue: false`, `options: [{ value: false, name: 'Opção Falsa' }]` e `placeholder: 'Selecione'`.
     - *Esperado:* `.placeholder-select` NÃO existe, `.value-div` existe com texto `'Opção Falsa'`.
   - Montar `MaxInputSelect` com `modelValue: null`, `options: [{ value: null, name: 'Opção Nula' }]` e `placeholder: 'Selecione'`.
     - *Esperado:* `.placeholder-select` NÃO existe, `.value-div` existe com texto `'Opção Nula'`.
   - Montar `MaxInputSelect` com `modelValue: 'orfao'`, `options: [{ value: 'a', name: 'Opção A' }]` e `placeholder: 'Selecione'`.
     - *Esperado:* `.placeholder-select` existe com texto `'Selecione'`, `.value-div` NÃO existe.
   - Montar `MaxInputSelect` com `modelValue: null` (sem opção `null`), `options: [{ value: 'a', name: 'Opção A' }]` e `placeholder: 'Selecione'`.
     - *Esperado:* `.placeholder-select` existe com texto `'Selecione'`, `.value-div` NÃO existe.
2. **Green Stage (Aprovação após correção):**
   - Todos os 5 cenários passam com 100% de sucesso e sem conflitos com os testes existentes do componente.

---

## Banco de dados
Nenhuma.

---

## Riscos de quebra e Não-Regressão
- **Contrato de Props/Attrs:** O suporte a `placeholder` via `props` e via `attrs` mantém compatibilidade total com qualquer formato de chamada existente no ecossistema (seja `<MaxInputSelect placeholder="X" />` ou `<MaxInputSelect :placeholder="x" />`).
- **Slots Customizados:** O slot `#value="{ value }"` continua recebendo `temp_value` normalmente.
- **Opções Agrupadas (`groupOptions`):** A lógica de `option_selected` já contempla `groupOptions`, portanto `hasSelectedOption` funciona de maneira idêntica para grupos.
- **Suíte de Testes:** Execução completa de `npx vitest run tests/components/MaxInputSelect.test.ts` e `npx vitest run tests/components/MaxInputSelectOverlay.test.ts` para assegurar que nenhuma funcionalidade regressou.

---

## Validação
Execução dos comandos automatizados de teste:
```bash
npx vitest run tests/components/MaxInputSelect.test.ts
npx vitest run tests/components/MaxInputSelectOverlay.test.ts
```
Critério de sucesso: 100% dos testes passando sem erros.

---

## Skills Aplicáveis
- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
