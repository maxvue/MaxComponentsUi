# Plano de Implementação — Issue #79

## Descrição e Causa Raiz

### Problema
Durante a auditoria automatizada do ecossistema de componentes de formulário (`@maxvue/max-components-ui`), identificou-se uma inconsistência grave no cálculo da propriedade reativa `caution` em 6 componentes de entrada:
1. `src/components/MaxInputText.vue:93`
2. `src/components/MaxChips.vue:174`
3. `src/components/MaxColorPicker.vue:134`
4. `src/components/MaxInputAutoComplete.vue:173`
5. `src/components/MaxInputIconPicker.vue:176`
6. `src/components/MaxInputNumber.vue:119`

Em todos esses componentes, o cálculo reativo da propriedade `caution` utiliza a fórmula legada defeituosa:
```typescript
const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));
```

Essa expressão condiciona a validade de uma `caution` explicitamente passada pelo componente consumidor a uma conjunção lógica (`&&`) com `isDone.value === false`. Isso gera graves anomalias funcionais:

1. **Supressão do Alerta em Campos Válidos/Preenchidos:**
   Quando o componente pai renderiza o campo com preenchimento válido ou satisfazendo `required: true` (por exemplo: `<MaxInputText v-model="val" required :caution="true" />` com `val = 'Teste'`), a verificação interna de obrigatoriedade `isRequiredDone` torna-se `true`. No evento `blur` ou na reavaliação de `isDone`, `isDone.value` torna-se `true`. A expressão computada avalia `props.caution && (isDone.value === false)`, o que resulta em `true && false => false`. O alerta visual de atenção requisitado pelo pai é completamente suprimido e ignorado.

2. **Supressão do Alerta no Estado Inicial (Pré-Interação):**
   Antes de o usuário interagir com o campo e disparar o primeiro `blur`, `isDone.value` é inicializado como `props.done ?? null` (ou seja, `null`). A comparação estrita `isDone.value === false` resulta em `false`. Consequentemente, `props.caution && (null === false)` resulta em `false`, anulando o estado visual de alerta inicial em qualquer campo montado com `:caution="true"` ou `:caution="'Texto de alerta'"`.

3. **Supressão de Mensagens Descritivas de Atenção (`caution` como String):**
   `InputBase.vue:174` possui a regra `if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;`. Quando um consumidor passa `:caution="'Atenção à quantidade informada'"`, o componente filho passa `:caution="caution"` para `InputBase`. Como `caution` é avaliado para a conjunção booleana `false`, `InputBase` recebe `caution = false`, perdendo a string da mensagem de aviso.

4. **Acoplamento Colateral Crítico com `error_msg`:**
   Nos 5 componentes que calculam `error_msg` (`MaxInputText`, `MaxChips`, `MaxColorPicker`, `MaxInputIconPicker` e `MaxInputNumber`), a mensagem de erro é implementada como:
   ```typescript
   const error_msg = computed(() => {
       if (!caution.value) return null;
       const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
       if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
       if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
       return attrs_error_message ?? 'Valor inválido';
   });
   ```
   Historicamente, o código utilizou `if (!caution.value) return null;` como um atalho porque `caution` só era `true` quando `isDone.value === false`. Porém, ao corrigir `caution` para retornar `props.caution` diretamente, se `error_msg` não for desacoplado e continuar checando `caution.value`, um campo válido com `:caution="true"` fará `caution.value` ser `true`. Isso faz `error_msg` não retornar `null` e cair no fallback final `return attrs_error_message ?? 'Valor inválido'`. Esse erro é repassado para `InputBase`, transformando um alerta de atenção (laranja) em um estado de erro (vermelho) com a mensagem incorreta `"Valor inválido"`.

5. **Precedente Sanado no Ecossistema:**
   No composable `src/helpers/useInputValidation.ts:38-44`, esse exato bug foi catalogado e resolvido (Achado 22), onde se formalizou que o override de `caution` vindo do pai deve ser repassado direto, sem qualquer operador `&&` com estado de validação interno (`done.value === false`). No entanto, os 6 componentes SFC continuaram com a implementação legada defeituosa.

---

### Causa Raiz Comprovada

#### 1. Identificação dos Arquivos e Linhas Exatos

1. `src/components/MaxInputText.vue:93-101`
   - Linha 93:
     ```typescript
     const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));
     ```
   - Linhas 95-101:
     ```typescript
     const error_msg = computed(() => {
         if (!caution.value) return null;
         const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
         if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
         if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
         return attrs_error_message ?? 'Valor inválido';
     });
     ```

2. `src/components/MaxChips.vue:173-182`
   - Linhas 173-175:
     ```typescript
     const caution = computed(() => {
         return props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false;
     });
     ```
   - Linhas 177-182:
     ```typescript
     const error_msg = computed(() => {
         if (!caution.value) return null;
         const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
         if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
         return attrs_error_message ?? 'Valor inválido';
     });
     ```

3. `src/components/MaxColorPicker.vue:134-143`
   - Linha 134:
     ```typescript
     const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));
     ```
   - Linhas 136-143:
     ```typescript
     const error_msg = computed(() => {
         if (!caution.value) return null;
         const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
         if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
         return attrs_error_message ?? 'Valor inválido';
     });
     ```

4. `src/components/MaxInputAutoComplete.vue:173`
   - Linha 173:
     ```typescript
     const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));
     ```

5. `src/components/MaxInputIconPicker.vue:174-186`
   - Linhas 174-178:
     ```typescript
     const caution = computed(() => (
         props.caution !== undefined
             ? props.caution && isDone.value === false
             : isDone.value === false
     ));
     ```
   - Linhas 180-186:
     ```typescript
     const error_msg = computed(() => {
         if (!caution.value) return null;
         const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
         if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
         return attrs_error_message ?? 'Valor inválido';
     });
     ```

6. `src/components/MaxInputNumber.vue:119-127`
   - Linha 119:
     ```typescript
     const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));
     ```
   - Linhas 121-127:
     ```typescript
     const error_msg = computed(() => {
         if (!caution.value) return null;
         const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
         if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
         if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
         return attrs_error_message ?? 'Valor inválido';
     });
     ```

#### 2. Fluxo Causal e Rastreamento Reverso de Dados
- **UI Consumidora:**
  O desenvolvedor consumidor renderiza `<MaxInputText v-model="form.nome" required :caution="true" />` ou com mensagem `:caution="'Verifique a formatação do campo'"`.
- **Camada de Props e Reatividade do Componente (UI ⇄ Componente Filho):**
  1. A propriedade `props.caution` é recebida com valor `true` ou `'Verifique...'`.
  2. O usuário preenche o campo ou o modelValue já inicia preenchido.
  3. A computada de obrigatoriedade `isRequiredDone` avalia `hasContent(temp_value.value)`, resultando em `true`.
  4. O gatilho de validação executa `testIsDone()`, que encontra `isRequiredDone.value === true` e atribui `isDone.value = true`.
  5. A computada defeituosa `caution` é recalculada:
     - `props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false`
     - Como `isDone.value === true`, a subexpressão `isDone.value === false` resulta em `false`.
     - A conjunção `props.caution && false` resulta em `false`.
  6. O componente repassa esse valor falso via prop para o wrapper base: `<InputBase ... :caution="caution" :error="props.error ?? error_msg" />`.
- **Camada de Renderização Base (`InputBase.vue:2, 37-39, 174`):**
  1. `InputBase` recebe `:caution="false"`.
  2. Na linha 2, a classe CSS `caution` (`!noStatus && caution ? 'caution' : ''`) é omitida.
  3. Nas linhas 37-39, o ícone de aviso `<div class="is-caution">` (`humbleicons:exclamation` laranja) não é renderizado.
  4. Na linha 174, `displayMessage` procura por `typeof props.caution === 'string'`, mas recebe o booleano `false`, descartando a mensagem textual configurada pelo pai.
- **Acoplamento Inverso em `error_msg`:**
  Se a fórmula de `caution` for corrigida isoladamente sem desacoplar `error_msg`, ao receber `caution = true`, o teste `if (!caution.value) return null;` deixa de retornar `null` precocemente. Como `isEqual` e `isRequiredDone` não são falsos (o valor é válido), a função atinge o fallback `return attrs_error_message ?? 'Valor inválido'`. Esse erro é repassado a `InputBase`, convertendo o campo para classe `.error` (vermelho) indevidamente.
- **Camada de Backend / Store:**
  Trata-se de comportamento estritamente no ecossistema de componentes visuais frontend Vue 3 (`UI ⇄ InputBase`), sem dependência de APIs ou Stores Pinia para a exibição dos estados reativos de formulário.

---

### Arquivos Afetados

#### Código-Fonte (SFC Vue 3):
1. `src/components/MaxInputText.vue`
2. `src/components/MaxChips.vue`
3. `src/components/MaxColorPicker.vue`
4. `src/components/MaxInputAutoComplete.vue`
5. `src/components/MaxInputIconPicker.vue`
6. `src/components/MaxInputNumber.vue`

#### Testes Unitários (Vitest / Vue Test Utils):
1. `tests/components/MaxInputText.test.ts`
2. `tests/components/MaxChips.test.ts`
3. `tests/components/MaxColorPicker.test.ts`
4. `tests/components/MaxInputAutoComplete.test.ts`
5. `tests/components/MaxInputIconPicker.test.ts`
6. `tests/components/MaxInputNumber.test.ts`

---

### Execuções Propostas

A correção cirúrgica consiste em alinhar os 6 componentes ao padrão já estabelecido em `useInputValidation.ts`:
- O cálculo de `caution` deve retornar `props.caution` diretamente quando ele for fornecido (`props.caution !== undefined ? props.caution : isDone.value === false`).
- O cálculo de `error_msg` deve ser desacoplado de `caution.value`, guardando a condição de erro real: se o campo não estiver em falha explícita de validação (`if (isDone.value !== false) return null;`), nenhuma mensagem de erro deve ser gerada.
- Nos testes unitários, toda inspeção de contrato deve ser feita de forma estrita via componentes filhos (`wrapper.findComponent(InputBase).props('caution')`), sem uso de `(wrapper.vm as any)`.

#### 1. Refatoração de `src/components/MaxInputText.vue`
- Atualizar a computed `caution` (linha 93):
  ```typescript
  // ANTES:
  const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

  // DEPOIS:
  const caution = computed(() => (props.caution !== undefined ? props.caution : isDone.value === false));
  ```
- Desacoplar a computed `error_msg` (linhas 95-101):
  ```typescript
  // ANTES:
  const error_msg = computed(() => {
      if (!caution.value) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });

  // DEPOIS:
  const error_msg = computed(() => {
      if (isDone.value !== false) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });
  ```

#### 2. Refatoração de `src/components/MaxChips.vue`
- Atualizar a computed `caution` (linhas 173-175):
  ```typescript
  // ANTES:
  const caution = computed(() => {
      return props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false;
  });

  // DEPOIS:
  const caution = computed(() => {
      return props.caution !== undefined ? props.caution : isDone.value === false;
  });
  ```
- Desacoplar a computed `error_msg` (linhas 177-182):
  ```typescript
  // ANTES:
  const error_msg = computed(() => {
      if (!caution.value) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });

  // DEPOIS:
  const error_msg = computed(() => {
      if (isDone.value !== false) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });
  ```

#### 3. Refatoração de `src/components/MaxColorPicker.vue`
- Atualizar a computed `caution` (linha 134):
  ```typescript
  // ANTES:
  const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

  // DEPOIS:
  const caution = computed(() => (props.caution !== undefined ? props.caution : isDone.value === false));
  ```
- Desacoplar a computed `error_msg` (linhas 136-143):
  ```typescript
  // ANTES:
  const error_msg = computed(() => {
      if (!caution.value) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });

  // DEPOIS:
  const error_msg = computed(() => {
      if (isDone.value !== false) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });
  ```

#### 4. Refatoração de `src/components/MaxInputAutoComplete.vue`
- Atualizar a computed `caution` (linha 173):
  ```typescript
  // ANTES:
  const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

  // DEPOIS:
  const caution = computed(() => (props.caution !== undefined ? props.caution : isDone.value === false));
  ```
  *(Nota: `MaxInputAutoComplete.vue` repassa `:error="props.error"` diretamente para `InputBase`, não contendo computada interna de `error_msg`).*

#### 5. Refatoração de `src/components/MaxInputIconPicker.vue`
- Atualizar a computed `caution` (linhas 174-178):
  ```typescript
  // ANTES:
  const caution = computed(() => (
      props.caution !== undefined
          ? props.caution && isDone.value === false
          : isDone.value === false
  ));

  // DEPOIS:
  const caution = computed(() => (
      props.caution !== undefined
          ? props.caution
          : isDone.value === false
  ));
  ```
- Desacoplar a computed `error_msg` (linhas 180-186):
  ```typescript
  // ANTES:
  const error_msg = computed(() => {
      if (!caution.value) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });

  // DEPOIS:
  const error_msg = computed(() => {
      if (isDone.value !== false) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });
  ```

#### 6. Refatoração de `src/components/MaxInputNumber.vue`
- Atualizar a computed `caution` (linha 119):
  ```typescript
  // ANTES:
  const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

  // DEPOIS:
  const caution = computed(() => (props.caution !== undefined ? props.caution : isDone.value === false));
  ```
- Desacoplar a computed `error_msg` (linhas 121-127):
  ```typescript
  // ANTES:
  const error_msg = computed(() => {
      if (!caution.value) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });

  // DEPOIS:
  const error_msg = computed(() => {
      if (isDone.value !== false) return null;
      const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
      if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
      if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
      return attrs_error_message ?? 'Valor inválido';
  });
  ```

---

### Especificação de Teste TDD (Red-Green)

#### 1. Etapa Red (Reprodução Comprovada da Falha)

Adicionar testes em cada um dos 6 arquivos de teste, cobrindo os 4 cenários críticos do contrato com `InputBase`:
1. `caution=true` mantido mesmo com campo preenchido e `required: true` (`isDone=true`).
2. `caution="string"` repassado intacto para `InputBase` sem poluir `error` com `"Valor inválido"`.
3. `caution=true` mantido na montagem inicial antes de interação do usuário (`isDone=null`).
4. `caution=false` explicitamente passado respeitado.

**Padrão estrito de tipagem:** Os testes devem inspecionar as props passadas ao `InputBase` através de `wrapper.findComponent(InputBase).props('caution')`, eliminando completamente qualquer casting `(wrapper.vm as any)`.

Exemplo de testes em `tests/components/MaxInputAutoComplete.test.ts`:
```typescript
it('mantém caution=true quando caution é passado via prop sem necessidade de done=false', () => {
    const wrapper = mountAutoComplete({ caution: true });
    const inputBase = wrapper.findComponent(InputBase);
    expect(inputBase.props('caution')).toBe(true);
});

it('mantém caution string quando informada', () => {
    const wrapper = mountAutoComplete({ caution: 'Atenção ao selecionar' });
    const inputBase = wrapper.findComponent(InputBase);
    expect(inputBase.props('caution')).toBe('Atenção ao selecionar');
});

it('respeita caution=false explicitamente passado', () => {
    const wrapper = mountAutoComplete({ caution: false });
    const inputBase = wrapper.findComponent(InputBase);
    expect(inputBase.props('caution')).toBe(false);
});
```

Exemplo de testes em `tests/components/MaxInputText.test.ts`:
```typescript
it('mantém caution=true quando prop caution=true é passada mesmo com required e valor preenchido (isDone=true)', async () => {
    const wrapper = mountInputText({ required: true, modelValue: 'Teste', caution: true });
    const input = wrapper.find('input');
    await input.trigger('blur');

    const inputBase = wrapper.findComponent(InputBase);
    // Na versão com bug (Red):
    // inputBase.props('caution') é false porque props.caution && (isDone.value === false) => true && false => false
    expect(inputBase.props('caution')).toBe(true);
    expect(inputBase.props('error')).toBeNull();
});

it('mantém caution string quando informada e não polui error com Valor inválido', async () => {
    const wrapper = mountInputText({ modelValue: 'Preenchido', caution: 'Atenção ao limite' });
    const inputBase = wrapper.findComponent(InputBase);

    // Na versão com bug (Red):
    // inputBase.props('caution') é false
    expect(inputBase.props('caution')).toBe('Atenção ao limite');
    expect(inputBase.props('error')).toBeNull();
});

it('mantém caution=true na montagem inicial antes de qualquer interação do usuário (isDone=null)', () => {
    const wrapper = mountInputText({ caution: true });
    const inputBase = wrapper.findComponent(InputBase);

    // Na versão com bug (Red):
    // isDone inicial é null => null === false é false => caution é false
    expect(inputBase.props('caution')).toBe(true);
});

it('respeita caution=false explicitamente passado', () => {
    const wrapper = mountInputText({ caution: false });
    const inputBase = wrapper.findComponent(InputBase);

    expect(inputBase.props('caution')).toBe(false);
});
```

- **Resultado Red:** Nos 6 componentes com o código original, `inputBase.props('caution')` retorna `false` ao invés de `true` ou da string da mensagem de atenção, falhando com `AssertionError: expected false to be true`.

---

#### 2. Etapa Green (Validação Pós-Correção)

Após a aplicação das alterações cirúrgicas nos 6 componentes:
- `inputBase.props('caution')` recebe `true` quando `:caution="true"`, mesmo com `isDone = true` ou `isDone = null`.
- `inputBase.props('caution')` recebe a string descritiva quando `:caution="'Atenção...'"` é fornecido.
- `inputBase.props('error')` permanece `null` (nenhum falso erro `"Valor inválido"` é gerado em campos válidos em atenção).
- Os testes existentes de erro (campo obrigatório vazio, divergência de `targetValue`, `done: false`) continuam passando 100% íntegros.
- Todos os testes utilizam tipagem estrita via Vue Test Utils sem `as any`.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração exclusiva em componentes frontend Vue 3 SFC da biblioteca de UI).

---

## Riscos de Quebra e Não-Regressão

1. **Prevenção de Falso Erro ("Valor inválido") ao Ativar Caution:**
   - *Mitigação:* A verificação de `error_msg` foi desacoplada com `if (isDone.value !== false) return null;`. Dessa forma, `error_msg` só atua quando há uma falha de validação efetiva do campo, nunca quando o campo está válido e apenas em estado de atenção.
2. **Compatibilidade com `testIsDone()` e Inversão de Caution:**
   - *Mitigação:* A função `testIsDone()` em todos os componentes preserva a linha `if (props.caution !== undefined) return !props.caution;`, mantendo total conformidade com a convenção da biblioteca onde campos em atenção não são considerados `done`.
3. **Compatibilidade com `InputBase.vue`:**
   - *Mitigação:* `InputBase.vue` já possui tratamento nativo tanto para boolean (`caution ? 'caution' : ''`) quanto para string (`displayMessage`). A correção assegura que o componente filho entrega exatamente o valor esperado por `InputBase`.
4. **Isolamento de Tipagem em Testes:**
   - *Mitigação:* Uso restrito de `wrapper.findComponent(InputBase).props('caution')` sem recorrer a `(wrapper.vm as any)`.
5. **Estabilidade no Ambiente de CI/Validação:**
   - *Mitigação:* A verificação de linter é configurada para executar `npx eslint src/ tests/`, evitando a execução irrestrita do `stylelint` que causa estouro de heap de memória (`JavaScript heap out of memory`, exit code 134) no ambiente.

---

## Validação

Os comandos a seguir devem ser executados em sequência para comprovar a eficácia da implementação:

1. **Execução dos Testes Unitários dos 6 Componentes Afetados:**
   ```bash
   npx vitest run tests/components/MaxInputText.test.ts tests/components/MaxChips.test.ts tests/components/MaxColorPicker.test.ts tests/components/MaxInputAutoComplete.test.ts tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputNumber.test.ts
   ```

2. **Execução da Suíte Completa de Testes da Biblioteca:**
   ```bash
   npm test
   ```

3. **Verificação de Tipagem Estrita TypeScript:**
   ```bash
   npm run type-check
   ```

4. **Verificação de Linter e Estilo:**
   ```bash
   npx eslint src/ tests/
   ```

---

## Skills Aplicáveis

- `vue-debugging-best-practices` — Diagnóstico de reatividade em computed properties e sincronização de estado com subcomponentes.
- `vue-components` — Padrões arquiteturais para componentes Vue 3 com Composition API e tipagem estrita TypeScript.
- `test-driven-development` — Metodologia Red-Green para isolamento e reprodução da regressão antes da implementação.
- `vue-vitest-testing-best-practices` — Estruturação de testes com Vitest e Vue Test Utils (`mount`, `findComponent`, `setProps`, `trigger`).
- `vue-typescript-best-practices` — Tipagem rigorosa nos testes e nos SFCs, sem casts inseguros (`as any`).
- `vue-eslint-stylelint-quality-standards` — Padrões de formatação, indentação de 4 espaços e conformidade com `eslint.config.js`.
- `code-review-and-quality` — Checklist de integridade semântica e prevenção de regressões antes do encerramento.
- `superpowers` — Disciplina de engenharia agentic orientada a especificações formais e planos executáveis.
