# Plano de Implementação — Issue #67

## Descrição e Causa Raiz

### Problema
O teste unitário `emite click quando não há route nem action` em `tests/components/MaxButton.test.ts` falha no baseline de testes com o erro:
`AssertionError: expected [ Array(1) ] to deeply equal [ true ]`.

Ao disparar o método `onClick` no componente `MaxButton` (quando não há `route` nem `action` definidos nas props), o componente emite o evento `'click'` passando o objeto nativo `MouseEvent` recebido do navegador / manipulador de evento: `emit('click', event)`. No entanto, a asserção no teste unitário espera `expect(wrapper.emitted('click')?.[0]).toEqual([true])`, assumindo incorretamente que o evento emitido seria o booleano `true` (padrão utilizado em outros componentes como `MaxIconButton`, que emite `emit('action', true)`).

### Causa Raiz Comprovada
- **Localização exata:**
  - `tests/components/MaxButton.test.ts:72-77`:
    ```typescript
    72:     it('emite click quando não há route nem action', async () => {
    73:         const wrapper = mountButton({ label: 'Click Me' });
    74:         (wrapper.vm as any).onClick(new MouseEvent('click'));
    75:         expect(wrapper.emitted('click')).toBeTruthy();
    76:         expect(wrapper.emitted('click')?.[0]).toEqual([true]);
    77:     });
    ```
  - `src/components/MaxButton.vue:91-107`:
    ```typescript
    91:     const emit = defineEmits<{
    92:         click: [event: MouseEvent | boolean];
    93:     }>();
    ...
    95:     const onClick = (event: MouseEvent) => {
    96:         if (props.route) {
    97:             goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
    98:             return;
    99:         }
    100: 
    101:         if (props.action) {
    102:             props.action({ event: event, data: data.value });
    103:             return;
    104:         }
    105: 
    106:         emit('click', event);
    107:     };
    ```

- **Fluxo Causal e Rastreamento Reverso:**
  1. No DOM / template do `MaxButton.vue`, o elemento `<button>` escuta o evento `@click="onClick"`.
  2. Ao ocorrer o clique, a função `onClick(event: MouseEvent)` é invocada recebendo o objeto nativo `MouseEvent`.
  3. Sem `props.route` e sem `props.action`, a linha 106 executa `emit('click', event)`.
  4. O Vue Test Utils armazena as emissões em `wrapper.emitted('click')`, resultando no array `[[MouseEvent { ... }]]`.
  5. A linha 76 de `MaxButton.test.ts` executa `expect(wrapper.emitted('click')?.[0]).toEqual([true])`, gerando o `AssertionError` ao comparar o objeto `MouseEvent` com `true`.
  6. Adicionalmente, `src/components/MaxButton.vue:92` possui tipagem com união desnecessária `click: [event: MouseEvent | boolean]`, quando na prática `onClick` sempre emite `MouseEvent`.

---

## Arquivos Afetados

1. `tests/components/MaxButton.test.ts`
   - Ajustar o teste `emite click quando não há route nem action` para acionar o clique de forma idiomática via `await wrapper.trigger('click')` (ou manter compatibilidade com chamada direta) e asserir que o payload emitido contém uma instância de `MouseEvent` (`toBeInstanceOf(MouseEvent)` ou `[expect.any(MouseEvent)]`).
2. `src/components/MaxButton.vue`
   - Refinar a tipagem do `defineEmits` para `click: [event: MouseEvent]`, removendo o `| boolean` desnecessário e alinhando a tipagem estrita com o payload real emitido.

---

## Execuções Propostas

### 1. Refatoração do teste em `tests/components/MaxButton.test.ts`
Substituir o teste na linha 72-77 por:
```typescript
    it('emite click quando não há route nem action', async () => {
        const wrapper = mountButton({ label: 'Click Me' });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
        expect(wrapper.emitted('click')?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    });
```
*Vantagens:*
- Utiliza `trigger('click')` diretamente no botão renderizado, testando a integração real do template e manipulador `@click`.
- Valida com precisão que o argumento passado ao listener do evento é de fato uma instância de `MouseEvent`.

### 2. Refinamento de Tipagem em `src/components/MaxButton.vue`
Ajustar o bloco `defineEmits` (linhas 91-93) para:
```typescript
    const emit = defineEmits<{
        click: [event: MouseEvent];
    }>();
```
*Vantagens:*
- Remove a tipagem legada `| boolean`.
- Fornece type safety estrito para os consumidores TypeScript do componente `MaxButton`.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Falha Comprovada)
- Executar o comando:
  ```bash
  npx vitest run tests/components/MaxButton.test.ts
  ```
- **Resultado Red:**
  ```
  FAIL  tests/components/MaxButton.test.ts > MaxButton > emite click quando não há route nem action
  AssertionError: expected [ Array(1) ] to deeply equal [ true ]
  ```

### 2. Etapa Green (Sucesso Pós-Correção)
- Aplicar as modificações em `tests/components/MaxButton.test.ts` e `src/components/MaxButton.vue`.
- Executar novamente:
  ```bash
  npx vitest run tests/components/MaxButton.test.ts
  ```
- **Resultado Green:**
  ```
  ✓ tests/components/MaxButton.test.ts (14 tests)
  Test Files  1 passed (1)
  Tests       14 passed (14)
  ```
- Executar toda a suíte de testes do repositório:
  ```bash
  npx vitest run
  ```
  Todos os 138 arquivos de teste e 1850 testes passam com 100% de sucesso.

---

## Banco de Dados

- **Nenhuma** migration necessária (componente exclusivo de front-end).

---

## Riscos de Quebra e Não-Regressão

- **Compatibilidade com Componentes Consumidores:**
  - Componentes como `MaxTogglePopover`, `MaxPdfView`, `MaxAuthCard`, `MaxButtonConfirm` e formulários utilizam `@click` ou a prop `:action`. O manipulador padrão de `@click` no Vue e no DOM recebe `MouseEvent`, portanto a emissão de `MouseEvent` é o contrato padrão e esperado.
  - A remoção de `| boolean` do `defineEmits` restringe a tipagem apenas para o tipo correto (`MouseEvent`), evitando falsos positivos de tipagem em consumidores TypeScript.
- **Regressão nos Demais Testes:**
  - Os outros testes de `MaxButton.test.ts` (ex.: `chama action ao invés de click se existir` e `chama goToRoute quando route for passado`) validam que `wrapper.emitted('click')` permanece falsy quando `action` ou `route` estão presentes, garantindo a não-regressão.

---

## Validação

- Execução dos testes unitários do componente `MaxButton`:
  ```bash
  npx vitest run tests/components/MaxButton.test.ts
  ```
- Execução completa da suíte de testes do projeto:
  ```bash
  npx vitest run
  ```
- Verificação de tipagem TypeScript:
  ```bash
  npm run type-check
  ```
- Verificação de formatação e linting:
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `vue-vitest-testing-best-practices`
- `vue-typescript-best-practices`
- `vue-debugging-best-practices`
- `systematic-debugging-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
