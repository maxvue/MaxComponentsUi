# Plano de Implementação — Issue #60

## Descrição e Causa Raiz

### Problema Relatado
No componente `MaxInputToggle.vue`, a interação do usuário ao alternar o toggle switch (disparando o evento DOM `@change`) invoca a função `on_toggle`. A função altera o ref reativo interno `modelvalue.value` e, logo em seguida, invoca explicitamente o método `update_value()`.

Como o componente já possui um watcher reativo configurado (`watch(modelvalue, (val) => emit('update:modelValue', val))`), a alteração de `modelvalue.value` dispara a emissão de `update:modelValue` pelo watcher e, no mesmo fluxo síncrono de execução, a chamada explícita de `update_value()` executa uma segunda emissão de `update:modelValue` com o mesmo valor.

### Agravantes e Impactos
- Todo componente consumidor da biblioteca que utiliza `v-model` ou escuta `@update:modelValue` em `MaxInputToggle` recebe **duas emissões idênticas** para cada clique/toggle.
- Handlers acoplados ao evento (como chamadas de API, commits no histórico, mutações de Pinia store, tracking de analytics ou timers debounce) são executados em duplicidade.
- Inconsistência com os demais componentes de input do ecossistema `@maxvue/max-components-ui` (ex.: `MaxInputCheckbox`, `MaxInputSwitch`).

### Causa Raiz Comprovada
- **Arquivo e Linhas:** [`src/components/MaxInputToggle.vue:L66-92`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-60/src/components/MaxInputToggle.vue#L66-L92)
- **Trecho causador:**
  ```ts
  66: const emit = defineEmits(['update:modelValue']);
  67: const modelvalue = ref(props.modelValue);
  68: 
  69: watch(modelvalue, (val) => {
  70:     emit('update:modelValue', val);
  71: });
  ...
  85: const update_value = () => {
  86:     emit('update:modelValue', modelvalue.value);
  87: };
  88: 
  89: const on_toggle = (checked: boolean) => {
  90:     modelvalue.value = checked ? trueValue.value : falseValue.value;
  91:     update_value(); // <-- Causa da duplicidade: o watcher na linha 69 já emitiu o evento ao alterar modelvalue.value na linha 90
  92: };
  ```

### Rastreamento Reverso de Dados
1. **UI / Template (`MaxInputToggle.vue:L15-20`):**
   O usuário clica no checkbox `<input type="checkbox" @change="on_toggle(($event.target as HTMLInputElement).checked)" />`.
2. **Handler `on_toggle` (`MaxInputToggle.vue:L89-92`):**
   Executa a atribuição `modelvalue.value = checked ? trueValue.value : falseValue.value`.
3. **Watcher Reativo (`MaxInputToggle.vue:L69-71`):**
   Detecta a mutação de `modelvalue` e emite `update:modelValue` (1ª emissão).
4. **Chamada Concorrente `update_value()` (`MaxInputToggle.vue:L91`):**
   Invoca imediatamente `emit('update:modelValue', modelvalue.value)` (2ª emissão redundante).
5. **Consumidor Externo (`Parent.vue` / `v-model`):**
   Recebe `update:modelValue` duas vezes em sequência no mesmo ciclo de interação.

---

## Arquivos Afetados

1. [`src/components/MaxInputToggle.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-60/src/components/MaxInputToggle.vue)
   - Remoção da invocação redundante de `update_value()` dentro de `on_toggle`.
2. [`tests/components/MaxInputToggle.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-60/tests/components/MaxInputToggle.test.ts)
   - Adição de teste unitário verificando a unicidade da emissão (`emitted('update:modelValue').length === 1`) no toggle do checkbox nativo.
   - Preservação e enriquecimento dos testes existentes de sincronização de props e chamada manual de `update_value`.

---

## Execuções Propostas

### Passo a Passo da Correção Cirúrgica

1. **Ajuste em [`src/components/MaxInputToggle.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-60/src/components/MaxInputToggle.vue):**
   - No bloco `<script setup lang="ts">`, refatorar a função `on_toggle` para atribuir o valor a `modelvalue.value` sem invocar `update_value()`:
     ```ts
     const on_toggle = (checked: boolean) => {
         modelvalue.value = checked ? trueValue.value : falseValue.value;
     };
     ```
   - Manter a função `update_value` declarada para compatibilidade de testes/API interna que eventualmente acionem `wrapper.vm.update_value()`.

2. **Atualização da Suíte de Testes em [`tests/components/MaxInputToggle.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-60/tests/components/MaxInputToggle.test.ts):**
   - No teste de sincronização `sincroniza prop modelValue com modelvalue (ref interno) e emite update`, assertar explicitamente que `wrapper.emitted('update:modelValue')` possui exatamente comprimento `1` (`toHaveLength(1)`).
   - Adicionar caso de teste dedicado para alternância sucessiva garantindo que cada toggle emita estritamente um evento:
     ```ts
     it('emite update:modelValue exatamente uma vez por clique/toggle', async () => {
         const wrapper = mount(MaxInputToggle, {
             props: { modelValue: false }
         });
         const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
         
         await input.setValue(true);
         expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
         expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);

         await input.setValue(false);
         expect(wrapper.emitted('update:modelValue')).toHaveLength(2);
         expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false]);
     });
     ```

---

## Especificação de Teste TDD (Red-Green)

### 1. Teste de Reprodução (Red)
Executar o teste que asserte a cardinalidade única de emissões ao alternar o checkbox nativo:
```ts
it('não emite eventos duplicados ao alternar o valor via checkbox', async () => {
    const wrapper = mount(MaxInputToggle, {
        props: { modelValue: false }
    });

    const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
    await input.setValue(true);

    // No estado atual (BUG), wrapper.emitted('update:modelValue') tem tamanho 2 -> FALHA (Red)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
});
```

### 2. Validação Pós-Correção (Green)
Com a remoção da chamada `update_value()` de dentro de `on_toggle`, o teste passa com sucesso (`toHaveLength(1)`).

---

## Banco de Dados

- **Nenhuma** migration ou alteração em banco de dados necessária (componente frontend puro).

---

## Riscos de Quebra e Não-Regressão

### Mapeamento de Riscos
1. **Quebra de compatibilidade com chamadas manuais a `update_value()`:**
   - **Risco:** Algum teste ou consumidor legado chamando `(wrapper.vm as any).update_value()`.
   - **Mitigação:** Manter `const update_value = () => { emit('update:modelValue', modelvalue.value); };` acessível no escopo do componente.
2. **Prop `modelValue` externa não sincronizar:**
   - **Risco:** Mudança na prop `modelValue` enviada pelo pai não refletir no componente.
   - **Mitigação:** O watcher `watch(() => props.modelValue, (val) => { modelvalue.value = val; })` permanece inalterado.
3. **Suporte a `trueValue` e `falseValue` customizados:**
   - **Risco:** Toggles com valores strings/customizados (ex.: `'S'` e `'N'`) quebrarem.
   - **Mitigação:** `on_toggle` continuará computando `checked ? trueValue.value : falseValue.value`.

---

## Validação

Comandos automatizados para validação do plano e verificação de não-regressão:

```bash
# 1. Executar a suíte de testes unitários do MaxInputToggle
npx vitest run tests/components/MaxInputToggle.test.ts

# 2. Executar toda a suíte de testes da biblioteca
npm test

# 3. Executar verificação de tipos TypeScript
npm run type-check

# 4. Executar verificação de lint
npm run lint
```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
