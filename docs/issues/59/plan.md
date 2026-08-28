# Plano de Execução — Issue #59

> **Issue #59:** [Audit] MaxColorPicker: dois testes falham buscando seletor input.p-inputtext inexistente apos migracao  
> **Status:** Planejado / Pronto para Execução  
> **Data:** 2026-08-28

---

### Descrição e Causa Raiz

#### Problema Relatado
Durante a execução da suíte de testes automatizados com Vitest (`npm test tests/components/MaxColorPicker.test.ts`), dois testes unitários falham no arquivo [tests/components/MaxColorPicker.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/tests/components/MaxColorPicker.test.ts):
1. `"emite update:modelValue ao alterar o valor do input de texto"` ([tests/components/MaxColorPicker.test.ts:L25-33](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/tests/components/MaxColorPicker.test.ts#L25-L33)) — lança `Error: Cannot call setValue on an empty DOMWrapper.`
2. `"reflete o valor do modelValue passado externamente no input de texto"` ([tests/components/MaxColorPicker.test.ts:L35-43](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/tests/components/MaxColorPicker.test.ts#L35-L43)) — lança `Error: Cannot call element on an empty DOMWrapper.`

#### Causa Raiz Comprovada
- **Arquivos e Linhas Exatos:**
  - Origem do seletor obsoleto: [tests/components/MaxColorPicker.test.ts:L27](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/tests/components/MaxColorPicker.test.ts#L27) e [tests/components/MaxColorPicker.test.ts:L37](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/tests/components/MaxColorPicker.test.ts#L37).
  - Estrutura atual do componente: [src/components/MaxColorPicker.vue:L1-16](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/src/components/MaxColorPicker.vue#L1-L16).

- **Fluxo Causal e Rastreamento:**
  1. No commit `6abfe49d`, o componente `MaxColorPicker.vue` removeu o componente `ColorPicker` e o `InputText` do PrimeVue, substituindo-os por um preview e um `<input type="text" class="p-inputtext">`.
  2. No commit `940077df`, a interface do componente `MaxColorPicker.vue` foi refatorada para um botão circular compacto de 30x30px (`.max-input-color`), contendo exclusivamente o seletor nativo `<input type="color" class="max-colorpicker-native" ... />` encapsulado em `InputBase.vue`. O campo de texto secundário `<input type="text" class="p-inputtext">` foi removido do template.
  3. O arquivo de teste `tests/components/MaxColorPicker.test.ts` não foi atualizado concomitantemente com a mudança de layout do template, continuando a buscar o seletor `input.p-inputtext` via `wrapper.find('input.p-inputtext')`.
  4. Como `input.p-inputtext` não existe no DOM renderizado pelo `MaxColorPicker.vue`, `wrapper.find()` retorna um `DOMWrapper` vazio, gerando falhas fatais ao invocar `.setValue()` e acessar `.element`.

---

### Arquivos afetados

1. [tests/components/MaxColorPicker.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/tests/components/MaxColorPicker.test.ts) — Ajuste dos seletores e descrições dos dois testes de manipulação/reflexão de valor do input de cor (`input[type="color"]` ou `input.max-colorpicker-native`).

---

### Execuções propostas

Modificação cirúrgica em [tests/components/MaxColorPicker.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-59/tests/components/MaxColorPicker.test.ts):

1. **Ajuste do teste de emissão (Linhas 25-33):**
   - Atualizar a descrição do teste de `'emite update:modelValue ao alterar o valor do input de texto'` para `'emite update:modelValue ao alterar o valor do input de cor'`.
   - Substituir o seletor `wrapper.find('input.p-inputtext')` por `wrapper.find('input[type="color"]')` (ou `wrapper.find('input.max-colorpicker-native')`).
   - Manter a chamada `await input.setValue('#00ff00');` e as asserções de verificação do evento `update:modelValue`.

2. **Ajuste do teste de sincronização bidirecional/props (Linhas 35-43):**
   - Atualizar a descrição do teste de `'reflete o valor do modelValue passado externamente no input de texto'` para `'reflete o valor do modelValue passado externamente no input de cor'`.
   - Substituir o seletor `wrapper.find('input.p-inputtext')` por `wrapper.find('input[type="color"]')` (ou `wrapper.find('input.max-colorpicker-native')`).
   - Manter a asserção `expect((input.element as HTMLInputElement).value).toBe('#123456');`, o update de props `await wrapper.setProps({ modelValue: '#abcdef' });` e a asserção `expect((input.element as HTMLInputElement).value).toBe('#abcdef');`.

---

### Especificação de Teste TDD (Red-Green)

#### Estado Red (Comprovado)
Comando: `npx vitest run tests/components/MaxColorPicker.test.ts`
```
FAIL tests/components/MaxColorPicker.test.ts > MaxColorPicker > emite update:modelValue ao alterar o valor do input de texto
Error: Cannot call setValue on an empty DOMWrapper.
 ❯ tests/components/MaxColorPicker.test.ts:28:21

FAIL tests/components/MaxColorPicker.test.ts > MaxColorPicker > reflete o valor do modelValue passado externamente no input de texto
Error: Cannot call element on an empty DOMWrapper.
 ❯ tests/components/MaxColorPicker.test.ts:39:23
```

#### Estado Green (Após aplicação da correção)
Trecho de teste atualizado:
```ts
    it('emite update:modelValue ao alterar o valor do input de cor', async () => {
        const wrapper = mountColorPicker();
        const input = wrapper.find('input[type="color"]');
        await input.setValue('#00ff00');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual(['#00ff00']);
    });

    it('reflete o valor do modelValue passado externamente no input de cor', async () => {
        const wrapper = mountColorPicker({ modelValue: '#123456' });
        const input = wrapper.find('input[type="color"]');

        expect((input.element as HTMLInputElement).value).toBe('#123456');

        await wrapper.setProps({ modelValue: '#abcdef' });
        expect((input.element as HTMLInputElement).value).toBe('#abcdef');
    });
```
Resultado esperado:
```
✓ tests/components/MaxColorPicker.test.ts (6 tests)
Test Files  1 passed (1)
Tests       6 passed (6)
```

---

### Banco de dados

Nenhuma migration ou alteração de banco de dados necessária.

---

### Riscos de quebra e Não-Regressão

- **Risco de Quebra de Contrato:** Nulo. A alteração restringe-se ao arquivo de testes unitários `tests/components/MaxColorPicker.test.ts`, adequando os seletores à interface real do componente já consolidada em produção.
- **Não-Regressão:** A suíte completa de testes (`npm test`) e a verificação estática de tipos (`npm run type-check`) garantem que nenhum outro componente ou consumidor é impactado.

---

### Validação

Executar a sequência de comandos para validação conclusiva:
1. `npm test tests/components/MaxColorPicker.test.ts` (deve passar 6/6 testes com 0 falhas)
2. `npm run type-check` (verificação de tipagem TypeScript sem erros)
3. `npm run lint` (garantia de conformidade com as regras ESLint do projeto)

---

### Skills Aplicáveis

- `systematic-debugging-best-practices`
- `vue-debugging-best-practices`
- `tdd`
- `planning-with-files`
- `code-review`
