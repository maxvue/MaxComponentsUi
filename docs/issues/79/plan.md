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

Essa expressão condiciona a validade de uma `caution` explicitamente passada pelo componente pai a uma conjunção lógica (`&&`) com `isDone.value === false`. Isso gera agravantes funcionais severos:

1. **Supressão do Alerta em Campos Válidos/Preenchidos:**
   Quando o componente pai renderiza o campo com preenchimento válido ou satisfazendo `required: true` (ex.: `<MaxInputText v-model="val" required :caution="true" />` com `val = 'Teste'`), a verificação de obrigatoriedade `isRequiredDone` torna-se `true`. No evento `blur` ou na reavaliação de `isDone`, `isDone.value` torna-se `true`. A expressão computada avalia `props.caution && (isDone.value === false)`, o que resulta em `true && false => false`. O alerta visual de atenção requisitado pelo pai é completamente suprimido e ignorado.

2. **Supressão do Alerta no Estado Inicial (Pré-Interação):**
   Antes de o usuário interagir com o campo e disparar o primeiro `blur`, `isDone.value` é inicializado como `props.done ?? null` (ou seja, `null`). A comparação estrita `isDone.value === false` resulta em `false`. Consequentemente, `props.caution && (null === false)` resulta em `false`, anulando o estado visual de alerta inicial em qualquer campo montado com `:caution="true"` ou `:caution="'Texto de alerta'"`.

3. **Supressão de Mensagens Descritivas de Atenção (`caution` como String):**
   `InputBase.vue:174` possui a regra `if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;`. Quando um consumidor passa `:caution="'Atenção à quantidade informada'"`, o componente filho passa `:caution="caution"` para `InputBase`. Como `caution` é avaliado para o booleano `false`, `InputBase` recebe `caution = false`, perdendo a string da mensagem de aviso.

4. **Acoplamento Colateral Crítico com `error_msg`:**
   Nos 5 componentes que calculam `error_msg` (`MaxInputText`, `MaxChips`, `MaxColorPicker`, `MaxInputIconPicker` e `MaxInputNumber`), a mensagem de erro é implementada como:
   ```typescript
   const error_msg = computed(() => {
       if (!caution.value) return null;
       const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
       if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + ...;
       if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
       return attrs_error_message ?? 'Valor inválido';
   });
   ```
   Historicamente, o desenvolvedor utilizou `if (!caution.value) return null;` como um atalho porque `caution` só era `true` quando `isDone.value === false`. Porém, ao corrigir `caution` para retornar `props.caution` diretamente, se `error_msg` não for desacoplado e passar a checar `isDone.value !== false`, um campo válido com `:caution="true"` fará `caution.value` ser `true`, fazendo `error_msg` cair no fallback final `return attrs_error_message ?? 'Valor inválido'`. Esse erro seria repassado para `InputBase`, transformando um alerta de atenção (laranja) em um estado de erro (vermelho) com a mensagem incorreta `"Valor inválido"`.

5. **Precedente Sanado no Ecossistema:**
   No composable `src/helpers/useInputValidation.ts:38-44`, esse exato bug foi catalogado e resolvido (Achado 22), onde se formalizou que o override de `caution` vindo do pai deve ser repassado direto, sem qualquer operador `&&` com estado de validação interno (`done.value === false`). No entanto, os 6 componentes acima permaneceram com o código legado divergente.

---

### Causa Raiz Comprovada

#### 1. Identificação dos Arquivos e Linhas Exatos

1. `src/components/MaxInputText.vue:93-101`
   ```typescript
   // Linha 93: Expressão defeituosa de caution
   const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

   // Linhas 95-101: Acoplamento indevido de error_msg com caution.value
   const error_msg = computed(() => {
       if (!caution.value) return null;
       const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
       if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
       if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
       return attrs_error_message ?? 'Valor inválido';
   });
   ```

2. `src/components/MaxChips.vue:173-182`
   ```typescript
   // Linhas 173-175: Expressão defeituosa de caution
   const caution = computed(() => {
       return props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false;
   });

   // Linhas 177-182: Acoplamento indevido de error_msg com caution.value
   const error_msg = computed(() => {
       if (!caution.value) return null;
       const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
       if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
       return attrs_error_message ?? 'Valor inválido';
   });
   ```

3. `src/components/MaxColorPicker.vue:134-142`
   ```typescript
   // Linha 134: Expressão defeituosa de caution
   const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

   // Linhas 136-142: Acoplamento indevido de error_msg com caution.value
   const error_msg = computed(() => {
       if (!caution.value) return null;
       const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
       if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
       if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
       return attrs_error_message ?? 'Valor inválido';
   });
   ```

4. `src/components/MaxInputAutoComplete.vue:173`
   ```typescript
   // Linha 173: Expressão defeituosa de caution (não possui error_msg; delega props.error)
   const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));
   ```

5. `src/components/MaxInputIconPicker.vue:174-185`
   ```typescript
   // Linhas 174-178: Expressão defeituosa de caution
   const caution = computed(() => (
       props.caution !== undefined
           ? props.caution && isDone.value === false
           : isDone.value === false
   ));

   // Linhas 180-185: Acoplamento indevido de error_msg com caution.value
   const error_msg = computed(() => {
       if (!caution.value) return null;
       const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
       if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
       return attrs_error_message ?? 'Valor inválido';
   });
   ```

6. `src/components/MaxInputNumber.vue:119-127`
   ```typescript
   // Linha 119: Expressão defeituosa de caution
   const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

   // Linhas 121-127: Acoplamento indevido de error_msg com caution.value
   const error_msg = computed(() => {
       if (!caution.value) return null;
       const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
       if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
       if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
       return attrs_error_message ?? 'Valor inválido';
   });
   ```

---

#### 2. Fluxo Causal e Rastreamento Reverso de Dados

```
Consumidor / View (Pai)
  │
  ├─> Declara: <MaxInputText v-model="form.valor" required :caution="true" />
  │   (ou :caution="'Atenção especial ao prazo'")
  │
  ▼
Componente Filho (ex.: MaxInputText.vue)
  │
  ├─> Props: { caution: true, required: true, modelValue: 'Texto' }
  ├─> Estado interno inicial: isDone.value = null
  │
  ├─> Usuário digita ou campo monta:
  │     isRequiredDone.value = true
  │     testIsDone() avalia isRequiredDone => retorna true
  │     isDone.value = true
  │
  ├─> [PONTO DE FALHA 1] Cálculo da computed `caution`:
  │     props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false
  │     ==> true && (true === false)
  │     ==> true && false
  │     ==> false  <-- Caution SUPRIMIDA!
  │
  ├─> [PONTO DE FALHA 2] Efeito colateral em InputBase:
  │     Template do filho: <InputBase v-bind="props" :caution="caution" ...>
  │     O atributo `:caution="caution"` sobrescreve o `props.caution` do v-bind="props".
  │     InputBase recebe :caution="false".
  │
  ▼
Subcomponente InputBase.vue
  │
  ├─> InputBase.vue:2
  │     class="... ${!noStatus && caution ? 'caution' : ''} ..."
  │     Como caution = false, a classe CSS .caution NÃO é aplicada.
  │
  ├─> InputBase.vue:37
  │     <div class="is-caution" v-else-if="caution && !noCaution && !noStatus">
  │     Como caution = false, o ícone de exclamação laranja NÃO é renderizado.
  │
  └─> InputBase.vue:174
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        Como props.caution recebido é false, a mensagem de texto descritiva NUNCA é exibida.
```

---

## Arquivos Afetados

| Arquivo | Tipo de Alteração | Descrição da Modificação |
|---|---|---|
| `src/components/MaxInputText.vue` | Código-Fonte | Corrigir `caution` para retornar `props.caution` diretamente quando definido; desacoplar `error_msg` para verificar `isDone.value !== false`. |
| `src/components/MaxChips.vue` | Código-Fonte | Corrigir `caution` para retornar `props.caution` diretamente quando definido; desacoplar `error_msg` para verificar `isDone.value !== false`. |
| `src/components/MaxColorPicker.vue` | Código-Fonte | Corrigir `caution` para retornar `props.caution` diretamente quando definido; desacoplar `error_msg` para verificar `isDone.value !== false`. |
| `src/components/MaxInputAutoComplete.vue` | Código-Fonte | Corrigir `caution` para retornar `props.caution` diretamente quando definido (`props.caution !== undefined ? props.caution : isDone.value === false`). |
| `src/components/MaxInputIconPicker.vue` | Código-Fonte | Corrigir `caution` para retornar `props.caution` diretamente quando definido; desacoplar `error_msg` para verificar `isDone.value !== false`. |
| `src/components/MaxInputNumber.vue` | Código-Fonte | Corrigir `caution` para retornar `props.caution` diretamente quando definido; desacoplar `error_msg` para verificar `isDone.value !== false`. |
| `tests/components/MaxInputText.test.ts` | Teste Vitest | Adicionar testes unitários validando `:caution="true"`, `:caution="'Mensagem'"` e `:caution="false"` com campo preenchido e vazio. |
| `tests/components/MaxChips.test.ts` | Teste Vitest | Adicionar testes unitários validando `caution` explícito com e sem itens preenchidos. |
| `tests/components/MaxColorPicker.test.ts` | Teste Vitest | Adicionar testes unitários validando `caution` explícito booleano e string. |
| `tests/components/MaxInputAutoComplete.test.ts` | Teste Vitest | Adicionar teste unitário comprovando que `caution` é mantido sem necessidade de forçar `done: false`. |
| `tests/components/MaxInputIconPicker.test.ts` | Teste Vitest | Adicionar testes unitários para a propriedade `caution` no picker de ícones. |
| `tests/components/MaxInputNumber.test.ts` | Teste Vitest | Adicionar testes unitários validando `caution` explícito independente do valor numérico. |

---

## Execuções Propostas

A correção é cirúrgica e preserva integralmente a compatibilidade retroativa de todos os contratos existentes de props e eventos.

### 1. Refatoração de `src/components/MaxInputText.vue`
- Substituir a computed `caution` (linha 93):
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

---

### 2. Refatoração de `src/components/MaxChips.vue`
- Substituir a computed `caution` (linhas 173-175):
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

---

### 3. Refatoração de `src/components/MaxColorPicker.vue`
- Substituir a computed `caution` (linha 134):
  ```typescript
  // ANTES:
  const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

  // DEPOIS:
  const caution = computed(() => (props.caution !== undefined ? props.caution : isDone.value === false));
  ```
- Desacoplar a computed `error_msg` (linhas 136-142):
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

### 4. Refatoração de `src/components/MaxInputAutoComplete.vue`
- Substituir a computed `caution` (linha 173):
  ```typescript
  // ANTES:
  const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

  // DEPOIS:
  const caution = computed(() => (props.caution !== undefined ? props.caution : isDone.value === false));
  ```
  *(Nota: `MaxInputAutoComplete.vue` não possui `error_msg` interno; ele passa `:error="props.error"` diretamente).*

---

### 5. Refatoração de `src/components/MaxInputIconPicker.vue`
- Substituir a computed `caution` (linhas 174-178):
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
- Desacoplar a computed `error_msg` (linhas 180-185):
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

---

### 6. Refatoração de `src/components/MaxInputNumber.vue`
- Substituir a computed `caution` (linha 119):
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

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Reprodução Comprovada da Falha)

Adicionar testes em `tests/components/MaxInputText.test.ts` e nas respectivas suítes dos outros 5 componentes:

```typescript
// Exemplo em tests/components/MaxInputText.test.ts
it('mantém caution=true quando prop caution=true é passada mesmo com required e valor preenchido (isDone=true)', async () => {
    const wrapper = mountInputText({ required: true, modelValue: 'Teste', caution: true });
    const input = wrapper.find('input');
    await input.trigger('blur');

    const inputBase = wrapper.findComponent(InputBase);
    // NA VERSÃO ATUAL (RED):
    // inputBase.props('caution') retorna FALSE porque props.caution && (isDone.value === false) => true && false => false
    expect(inputBase.props('caution')).toBe(true);
    expect(inputBase.props('error')).toBeNull();
});

it('mantém caution string quando informada e não polui error com Valor inválido', async () => {
    const wrapper = mountInputText({ modelValue: 'Preenchido', caution: 'Atenção ao limite' });
    const inputBase = wrapper.findComponent(InputBase);

    // NA VERSÃO ATUAL (RED):
    // inputBase.props('caution') retorna FALSE
    expect(inputBase.props('caution')).toBe('Atenção ao limite');
    expect(inputBase.props('error')).toBeNull();
});

it('mantém caution=true na montagem inicial antes de qualquer interação do usuário (isDone=null)', () => {
    const wrapper = mountInputText({ caution: true });
    const inputBase = wrapper.findComponent(InputBase);

    // NA VERSÃO ATUAL (RED):
    // isDone inicial é null => null === false é false => caution é false
    expect(inputBase.props('caution')).toBe(true);
});
```

- **Comportamento Red Comprovado:**
  - `AssertionError: expected false to be true` (no `expect(inputBase.props('caution')).toBe(true)`).
  - Em campos com texto e `caution: 'Atenção'`, `inputBase.props('caution')` recebe `false` em vez da string.

---

### 2. Etapa Green (Validação Pós-Correção)

Após a aplicação cirúrgica das modificações propostas:
- `inputBase.props('caution')` recebe `true` quando `:caution="true"`, mesmo com `isDone = true` ou `isDone = null`.
- `inputBase.props('caution')` recebe a string de aviso quando `:caution="'Mensagem'"`.
- `inputBase.props('error')` permanece `null` (nenhum falso erro `"Valor inválido"` é gerado).
- Os testes existentes de erro (campo obrigatório vazio, divergência de `targetValue`, `done: false`) continuam passando 100% íntegros.
- O teste existente em `tests/components/MaxInputAutoComplete.test.ts:147` (`caution computed quando isDone é falso mas caution é passado via prop`) continua passando.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração restrita a componentes de UI front-end Vue 3 SFC).

---

## Riscos de Quebra e Não-Regressão

1. **Risco de Falso Erro ("Valor inválido") ao ativar Caution:**
   - *Mitigação:* A verificação de `error_msg` foi explicitamente isolada com `if (isDone.value !== false) return null;`. Dessa forma, `error_msg` só atua quando há uma falha de validação efetiva do campo, nunca quando o campo está válido e em estado de atenção.
2. **Compatibilidade com `testIsDone()` e Inversão de Caution:**
   - *Mitigação:* A função `testIsDone()` em todos os componentes preserva a linha `if (props.caution !== undefined) return !props.caution;`, mantendo compatibilidade com os testes de `testIsDone` existentes em `MaxInputAutoComplete` e `MaxInputAutoCompleteApi`.
3. **Compatibilidade com `InputBase.vue`:**
   - *Mitigação:* `InputBase.vue` foi analisado e já possui o tratamento adequado tanto para boolean (`caution ? 'caution' : ''`) quanto para string (`displayMessage`). A correção no componente filho entrega o valor correto que o `InputBase` espera receber.
4. **Verificação da Suíte de Testes Existente:**
   - Nenhuma suíte de testes existente será quebrada; novos cenários cobrirão a lacuna anteriormente não testada para a prop `caution`.

---

## Validação

1. **Execução dos Testes Unitários dos Componentes Afetados:**
   ```bash
   npx vitest run tests/components/MaxInputText.test.ts \
                  tests/components/MaxChips.test.ts \
                  tests/components/MaxColorPicker.test.ts \
                  tests/components/MaxInputAutoComplete.test.ts \
                  tests/components/MaxInputIconPicker.test.ts \
                  tests/components/MaxInputNumber.test.ts
   ```

2. **Execução da Suíte Completa de Testes Unitários:**
   ```bash
   npm test
   ```

3. **Verificação de Tipagem TypeScript:**
   ```bash
   npm run type-check
   ```

4. **Verificação de Estilo e Linting:**
   ```bash
   npm run lint
   ```

---

## Skills Aplicáveis

- `vue-debugging-best-practices` — Diagnóstico de reatividade em computed properties e sincronização de estado com subcomponentes.
- `vue-components` — Padrões arquiteturais para componentes Vue 3 com Composition API e tipagem estrita TypeScript.
- `test-driven-development` — Metodologia Red-Green para isolamento e reprodução da regressão antes da implementação.
- `vue-vitest-testing-best-practices` — Estruturação de testes com Vitest e Vue Test Utils (`mount`, `findComponent`, `setProps`, `trigger`).
- `vue-eslint-stylelint-quality-standards` — Padrões de formatação, indentação de 4 espaços e conformidade com `eslint.config.js`.
- `code-review-and-quality` — Checklist de integridade semântica e prevenção de regressões antes do encerramento.
- `superpowers` — Disciplina de engenharia agentic orientada a especificações formais e planos executáveis.
