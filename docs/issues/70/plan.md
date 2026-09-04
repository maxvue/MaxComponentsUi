# Plano de Implementação — Issue #70

## Descrição e Causa Raiz

### Problema
No arquivo `tests/components/MaxInputNumber.test.ts` (linhas 29 a 34), o teste unitário intitulado `'emite update:modelValue ao alterar valor'` apresenta uma asserção oca (falso positivo). O teste atualmente monta o componente com `modelValue: 10`, executa `await wrapper.setProps({ modelValue: 20 })` e apenas valida a asserção `expect(wrapper.findComponent(InputBase).exists()).toBe(true)`.

### Agravantes e Impacto
1. **Ausência de verificação de evento:** O teste nunca verifica se o evento `update:modelValue` foi emitido (`wrapper.emitted('update:modelValue')`), nem valida os argumentos/payload emitidos.
2. **Não simula a ação do usuário:** O teste altera uma prop externa via `setProps` em vez de simular a interação do usuário com o elemento nativo `<input>` (através de `input.setValue(...)` ou disparo do evento de input).
3. **Falso positivo crítico:** Caso ocorra uma regressão no componente `MaxInputNumber.vue` — como a interrupção da emissão de `update:modelValue`, falha no watcher de `temp_value`, erro no handler `@input="onInput"` ou quebra no parser `parseLocaleNumber` —, o teste continuará passando com sucesso, mascarando falhas reais no binding bidirecional (`v-model`) do componente em produção.

### Causa Raiz Comprovada
- **Localização:** `tests/components/MaxInputNumber.test.ts:29-34`
- **Trecho do Código com Problema:**
```typescript
29:     it('emite update:modelValue ao alterar valor', async () => {
30:         const wrapper = mountInputNumber({ modelValue: 10 });
31:         await wrapper.setProps({ modelValue: 20 });
32: 
33:         expect(wrapper.findComponent(InputBase).exists()).toBe(true);
34:     });
```
- **Fluxo Causal e Rastreamento Reverso de Dados:**
  - **Fluxo real do componente (`src/components/MaxInputNumber.vue`):**
    `Entrada do Usuário no <input>` ➔ `@input="onInput"` ➔ `parseLocaleNumber(raw)` ➔ `temp_value.value = parsed` ➔ `watch(temp_value)` ➔ `emit('update:modelValue', temp_value.value)`
  - **Fluxo no teste defeituoso:**
    `wrapper.setProps({ modelValue: 20 })` ➔ Altera prop externa ➔ `expect(wrapper.findComponent(InputBase).exists()).toBe(true)` ➔ Apenas confirma que o componente base existe, ignorando completamente a validação da emissão do evento `update:modelValue`.

---

## Arquivos Afetados

1. `tests/components/MaxInputNumber.test.ts` — Refatoração do teste `'emite update:modelValue ao alterar valor'` para simular a interação do usuário no elemento `<input>` e validar `wrapper.emitted('update:modelValue')`, além de adicionar testes complementares para formatação numérica pt-BR e sincronização de prop externa via `setProps`.

---

## Execuções Propostas

### 1. Refatoração em `tests/components/MaxInputNumber.test.ts`
- Substituir o teste oco por um teste que simule a digitação do usuário no input e valide rigorosamente a emissão do evento `update:modelValue` com o payload correto:
  ```typescript
  it('emite update:modelValue ao alterar o valor do input', async () => {
      const wrapper = mountInputNumber({ modelValue: 10 });
      const input = wrapper.find('input');
      await input.setValue('25');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emitted = wrapper.emitted('update:modelValue')!;
      expect(emitted[emitted.length - 1]).toEqual([25]);
  });
  ```
- Adicionar teste para validação de entrada de número formatado no padrão pt-BR:
  ```typescript
  it('emite update:modelValue com número parseado ao digitar formato pt-BR', async () => {
      const wrapper = mountInputNumber({ modelValue: 0 });
      const input = wrapper.find('input');
      await input.setValue('1.250,50');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emitted = wrapper.emitted('update:modelValue')!;
      expect(emitted[emitted.length - 1]).toEqual([1250.5]);
  });
  ```
- Adicionar teste para validação de limpeza do input (retornando `null`):
  ```typescript
  it('emite update:modelValue com null ao limpar o input', async () => {
      const wrapper = mountInputNumber({ modelValue: 100 });
      const input = wrapper.find('input');
      await input.setValue('');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emitted = wrapper.emitted('update:modelValue')!;
      expect(emitted[emitted.length - 1]).toEqual([null]);
  });
  ```
- Adicionar teste dedicado para atualização da visualização quando a prop `modelValue` é alterada externamente:
  ```typescript
  it('atualiza o valor exibido quando modelValue muda externamente', async () => {
      const wrapper = mountInputNumber({ modelValue: 10 });
      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe('10');

      await wrapper.setProps({ modelValue: 42 });
      expect((input.element as HTMLInputElement).value).toBe('42');
  });
  ```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação do Falso Positivo e Falha)
- **Cenário de Demonstração do Falso Positivo Original:**
  Se a linha de emissão `emit('update:modelValue', temp_value.value)` for comentada em `src/components/MaxInputNumber.vue`, o teste original de linhas 29-34 passa normalmente porque apenas avalia `expect(wrapper.findComponent(InputBase).exists()).toBe(true)`.
- **Cenário Red com o Novo Teste:**
  Com o teste refatorado esperando `expect(wrapper.emitted('update:modelValue')).toBeTruthy()`, na ausência de emissão o teste falhará imediatamente, garantindo que o teste é sensível a quebras reais de comportamento.

### 2. Etapa Green (Validação da Correção)
- Com o componente `MaxInputNumber.vue` em seu funcionamento normal e os testes corrigidos e expandidos em `tests/components/MaxInputNumber.test.ts`:
  - Todos os testes da suíte de `MaxInputNumber.test.ts` passam com asserções reais sobre `wrapper.emitted('update:modelValue')` e integridade do valor no DOM.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração exclusiva de testes no front-end).

---

## Riscos de Quebra e Não-Regressão

- **Contrato de Componente:** Nenhuma alteração de interface pública, props ou emits no componente `MaxInputNumber.vue`.
- **Integridade da Suíte:** Assegura que falhas futuras na conversão de números pt-BR, formatação ou binding bidirecional de `MaxInputNumber` sejam detectadas imediatamente pelo pipeline de CI/CD.
- **Não-Regressão:** Os demais testes existentes no arquivo continuam válidos e serão preservados.

---

## Validação

- Execução da suíte de testes de `MaxInputNumber`:
  ```bash
  npm test tests/components/MaxInputNumber.test.ts
  ```
- Execução de testes de componentes correlatos:
  ```bash
  npm test tests/components/MaxInputText.test.ts
  ```
- Verificação estática de tipos TypeScript:
  ```bash
  npm run type-check
  ```
- Verificação de Lint / Code Style:
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `vue-vitest-testing-best-practices`
- `vue-debugging-best-practices`
- `vue-components`
- `javascript-testing-patterns`
- `systematic-debugging-best-practices`
- `planning-with-files`
- `tdd`
- `code-review`
- `production-code-audit`
