# Plano de Implementação — Issue #71

## Descrição e Causa Raiz

### Problema
No arquivo de teste `tests/components/MaxInputPhoneMail.test.ts`, cinco testes unitários responsáveis por validar o comportamento de auto-detecção de modo (`email` vs. `whatsapp`) e a sobreposição forçada via atributos (`phone`, `whatsapp`, `email`) possuem apenas asserções superficiais/vácuas:
1. `it('detecta modo email quando valor contém letras')` (L24-27);
2. `it('detecta modo whatsapp quando valor contém números')` (L29-32);
3. `it('força modo whatsapp via attr phone')` (L68-71);
4. `it('força modo whatsapp via attr whatsapp')` (L73-76);
5. `it('força modo email via attr email')` (L78-81).

Todos esses cinco testes utilizam como única asserção `expect(wrapper.findComponent(InputBase).exists()).toBe(true)`.

Como o componente `InputBase` é sempre renderizado no template de `MaxInputPhoneMail.vue` (L2: `<InputBase v-bind="props"...>`), essa asserção sempre é avaliada como `true`, independentemente do modo atribuído. Caso a lógica de auto-detecção em `watch(temp_value)` ou a sobreposição via `onMounted` sejam corrompidas ou removidas, esses testes continuam passando com status `PASSED` (falsos positivos), mascarando falhas críticas de auto-detecção e comutação de modo.

### Causa Raiz Comprovada
- **Localização Exata:** `tests/components/MaxInputPhoneMail.test.ts:24-27`, `tests/components/MaxInputPhoneMail.test.ts:29-32` e `tests/components/MaxInputPhoneMail.test.ts:68-81`.

```typescript
// tests/components/MaxInputPhoneMail.test.ts:24-27
it('detecta modo email quando valor contém letras', async () => {
    const wrapper = mountPhoneMail({ modelValue: 'test@email.com' });
    expect(wrapper.findComponent(InputBase).exists()).toBe(true);
});

// tests/components/MaxInputPhoneMail.test.ts:29-32
it('detecta modo whatsapp quando valor contém números', async () => {
    const wrapper = mountPhoneMail({ modelValue: '11999887766' });
    expect(wrapper.findComponent(InputBase).exists()).toBe(true);
});

// tests/components/MaxInputPhoneMail.test.ts:68-71
it('força modo whatsapp via attr phone', () => {
    const wrapper = mountPhoneMail({}, { phone: true });
    expect(wrapper.findComponent(InputBase).exists()).toBe(true);
});

// tests/components/MaxInputPhoneMail.test.ts:73-76
it('força modo whatsapp via attr whatsapp', () => {
    const wrapper = mountPhoneMail({}, { whatsapp: true });
    expect(wrapper.findComponent(InputBase).exists()).toBe(true);
});

// tests/components/MaxInputPhoneMail.test.ts:78-81
it('força modo email via attr email', () => {
    const wrapper = mountPhoneMail({}, { email: true });
    expect(wrapper.findComponent(InputBase).exists()).toBe(true);
});
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  `Test Runner (Vitest)` ➔ `mountPhoneMail(props, attrs)` ➔ `MaxInputPhoneMail.vue` (`watch(temp_value)` / `onMounted(attrs)`) ➔ Atualização reativa de `method` (`'email' | 'whatsapp'`), `name_method` (`'Email' | 'Whatsapp'`), `iconLeft` (`'prime:at' | 'ic:baseline-whatsapp'`) e placeholder do `<input>` ➔ Template repassa props ao `<InputBase :label="attrs.label ?? name_method" :icon="iconLeft"...>` ➔ **Falha na suíte de testes:** Os testes L24-27, L29-32 e L68-81 ignoram o estado interno (`wrapper.vm.method`, `wrapper.vm.name_method`) e as propriedades repassadas ao `InputBase` (`label`, `icon`) ou atributos do input (`placeholder`), verificando unicamente `wrapper.findComponent(InputBase).exists()` ➔ O teste conclui com `PASSED` indevidamente mesmo quando as variáveis de controle e props não foram atualizadas (falso positivo).

---

## Arquivos Afetados

1. `tests/components/MaxInputPhoneMail.test.ts` — Substituição das asserções vácuas `expect(wrapper.findComponent(InputBase).exists()).toBe(true)` por asserções estritas que validam o estado interno (`method`, `name_method`), as props repassadas ao componente `InputBase` (`label`, `icon`) e os atributos do elemento `<input>` (`placeholder`).

---

## Execuções Propostas

### 1. Refatoração Cirúrgica em `tests/components/MaxInputPhoneMail.test.ts`

- **Teste 1 — `detecta modo email quando valor contém letras` (L24-27):**
  - Remover `expect(wrapper.findComponent(InputBase).exists()).toBe(true);`.
  - Validar que o estado `method` é `'email'` e `name_method` é `'Email'`.
  - Validar que o componente `InputBase` recebe `label` `'Email'` e `icon` `'prime:at'`.
  ```typescript
  it('detecta modo email quando valor contém letras', () => {
      const wrapper = mountPhoneMail({ modelValue: 'test@email.com' });

      expect((wrapper.vm as any).method).toBe('email');
      expect((wrapper.vm as any).name_method).toBe('Email');
      expect(wrapper.findComponent(InputBase).props('label')).toBe('Email');
      expect(wrapper.findComponent(InputBase).props('icon')).toBe('prime:at');
  });
  ```

- **Teste 2 — `detecta modo whatsapp quando valor contém números` (L29-32):**
  - Remover `expect(wrapper.findComponent(InputBase).exists()).toBe(true);`.
  - Validar que o estado `method` é `'whatsapp'` e `name_method` é `'Whatsapp'`.
  - Validar que o componente `InputBase` recebe `label` `'Whatsapp'` e `icon` `'ic:baseline-whatsapp'`.
  ```typescript
  it('detecta modo whatsapp quando valor contém números', () => {
      const wrapper = mountPhoneMail({ modelValue: '11999887766' });

      expect((wrapper.vm as any).method).toBe('whatsapp');
      expect((wrapper.vm as any).name_method).toBe('Whatsapp');
      expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
      expect(wrapper.findComponent(InputBase).props('icon')).toBe('ic:baseline-whatsapp');
  });
  ```

- **Teste 3 — `força modo whatsapp via attr phone` (L68-71):**
  - Remover `expect(wrapper.findComponent(InputBase).exists()).toBe(true);`.
  - Validar que `method` é forçado para `'whatsapp'` e `name_method` para `'Whatsapp'`.
  - Validar que o componente `InputBase` recebe `label` `'Whatsapp'` e `icon` `'ic:baseline-whatsapp'`.
  - Validar que o input mantém o placeholder de telefone `'(99) 9 9999 - 9999'`.
  ```typescript
  it('força modo whatsapp via attr phone', () => {
      const wrapper = mountPhoneMail({}, { phone: true });

      expect((wrapper.vm as any).method).toBe('whatsapp');
      expect((wrapper.vm as any).name_method).toBe('Whatsapp');
      expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
      expect(wrapper.findComponent(InputBase).props('icon')).toBe('ic:baseline-whatsapp');
      expect(wrapper.find('input').attributes('placeholder')).toBe('(99) 9 9999 - 9999');
  });
  ```

- **Teste 4 — `força modo whatsapp via attr whatsapp` (L73-76):**
  - Remover `expect(wrapper.findComponent(InputBase).exists()).toBe(true);`.
  - Validar que `method` é forçado para `'whatsapp'` e `name_method` para `'Whatsapp'`.
  - Validar que o componente `InputBase` recebe `label` `'Whatsapp'` e `icon` `'ic:baseline-whatsapp'`.
  - Validar que o input mantém o placeholder de telefone `'(99) 9 9999 - 9999'`.
  ```typescript
  it('força modo whatsapp via attr whatsapp', () => {
      const wrapper = mountPhoneMail({}, { whatsapp: true });

      expect((wrapper.vm as any).method).toBe('whatsapp');
      expect((wrapper.vm as any).name_method).toBe('Whatsapp');
      expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
      expect(wrapper.findComponent(InputBase).props('icon')).toBe('ic:baseline-whatsapp');
      expect(wrapper.find('input').attributes('placeholder')).toBe('(99) 9 9999 - 9999');
  });
  ```

- **Teste 5 — `força modo email via attr email` (L78-81):**
  - Remover `expect(wrapper.findComponent(InputBase).exists()).toBe(true);`.
  - Validar que `method` é forçado para `'email'` e `name_method` para `'Email'`.
  - Validar que o componente `InputBase` recebe `label` `'Email'` e `icon` `'prime:at'`.
  - Validar que o input aplica o placeholder de email `'usuario@email.com'`.
  ```typescript
  it('força modo email via attr email', () => {
      const wrapper = mountPhoneMail({}, { email: true });

      expect((wrapper.vm as any).method).toBe('email');
      expect((wrapper.vm as any).name_method).toBe('Email');
      expect(wrapper.findComponent(InputBase).props('label')).toBe('Email');
      expect(wrapper.findComponent(InputBase).props('icon')).toBe('prime:at');
      expect(wrapper.find('input').attributes('placeholder')).toBe('usuario@email.com');
  });
  ```

- **Padronização e Estilo:**
  - Garantir formatação com indentação de 4 espaços e conformidade com `eslint.config.js`.
  - Remover modificadores `async` desnecessários onde não há operações assíncronas.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha / Falso Positivo)
- **Cenário de Falso Positivo Atual:**
  Caso a lógica dentro de `onMounted` em `MaxInputPhoneMail.vue:218-226` (que trata os atributos `phone`, `whatsapp`, `email`) ou a lógica do `watch(temp_value)` em `MaxInputPhoneMail.vue:170-192` seja comentada ou desabilitada, os 5 testes atuais continuam passando com sucesso porque apenas executam `expect(wrapper.findComponent(InputBase).exists()).toBe(true)`.
- **Comportamento Red Desejado:**
  Com as novas asserções implementadas, ao simular a ausência de detecção de modo ou a quebra do override por atributos, os testes falham imediatamente com `AssertionError: expected undefined to be 'email'` / `expected 'Email ou Whatsapp' to be 'Email'` / `expected 'prime:at' to be 'ic:baseline-whatsapp'`.

### 2. Etapa Green (Validação Pós-Refatoração)
- Ao executar a suíte de testes com a implementação real de `MaxInputPhoneMail.vue`, todos os 37 testes de `tests/components/MaxInputPhoneMail.test.ts` passam com sucesso, comprovando que a auto-detecção e os overrides via atributos são validados de forma determinística.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração exclusiva na suíte de testes unitários de componentes frontend).

---

## Riscos de Quebra e Não-Regressão

- **Riscos de Contrato / Componente:** Nenhum. A alteração afeta exclusivamente o arquivo de testes unitários `tests/components/MaxInputPhoneMail.test.ts`, sem qualquer alteração no código de produção de `MaxInputPhoneMail.vue`.
- **Garantia de Não-Regressão:**
  - Todos os 37 testes de `tests/components/MaxInputPhoneMail.test.ts` devem passar com sucesso.
  - Toda a suíte de testes do projeto deve rodar e passar (`npm test`).
  - Verificação de tipos TypeScript com `npm run type-check`.
  - Verificação de linter e estilo de código com `npm run lint`.

---

## Validação

- **Execução dos Testes Unitários do Componente:**
  ```bash
  npx vitest run tests/components/MaxInputPhoneMail.test.ts
  ```
- **Execução de Toda a Suíte de Testes:**
  ```bash
  npm test
  ```
- **Checagem de Tipos TypeScript:**
  ```bash
  npm run type-check
  ```
- **Checagem de Linter e Estilo:**
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `tdd`
- `code-review`
- `production-code-audit`
