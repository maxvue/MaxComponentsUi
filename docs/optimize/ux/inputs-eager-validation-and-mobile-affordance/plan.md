# Plano de Implementação: Validação Prematura Agressiva e Falta de Affordance Mobile em Inputs Específicos

## 1. Diagnóstico e Objetivo

A auditoria identificou comportamentos problemáticos de usabilidade em três campos de formulário especializados:
1. **Validação Prematura em `MaxInputCpfCnpj.vue`:** A propriedade `caution` é ativada assim que `only_numbers.length > 0`. Ao digitar o primeiro dígito (ex.: `'1'`), o campo imediatamente fica vermelho/laranja exibindo a mensagem `"CPF inválido"`, penalizando o usuário no meio de uma digitação legítima.
2. **Ausência de Affordance de Teclado Móvel:** Em `MaxInputCpfCnpj.vue`, `MaxInputCep.vue` e `MaxInputPhone.vue`, os elementos `<input>` usam `type="text"` sem o atributo `inputmode="numeric"` ou `inputmode="tel"`. Em dispositivos móveis (iOS e Android), o teclado aberto é o alfanumérico comum, forçando o usuário a alternar para o modo de números manualmente a cada campo numérico.
3. **Bug de Concatenação em `MaxInputPhone.vue`:** A expressão `:label="props.noLabel ? undefined : props.label ?? ('Telefone' + String(props.noLabel)) "` concatena a string booleana padrão `false`, resultando no rótulo **`"Telefonefalse"`** quando a prop `label` é omitida.
4. **Ícone Inválido em `MaxInputCep.vue`:** A diretiva `:icon-right="loading ? 'loading' : undefined"` faz referência a um ícone inexistente (`'loading'`), falhando silenciosamente e omitindo o spinner durante consultas de CEP.

**Objetivo:**
1. Deslocar a validação de CPF/CNPJ para o evento de `blur` ou para o momento em que a máscara estiver completa (11 dígitos para CPF, 14 para CNPJ), eliminando advertências precoces durante a digitação.
2. Configurar `inputmode="numeric"` em `MaxInputCpfCnpj` e `MaxInputCep`, e `type="tel"` / `inputmode="tel"` em `MaxInputPhone`.
3. Corrigir o label padrão de `MaxInputPhone` para `'Telefone'`.
4. Substituir a referência do ícone de loading do `MaxInputCep` por um ícone animado válido (`'line-md:loading-loop'`).

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue): lógica de validação lazy/blur e inclusão de `inputmode="numeric"`.
- [`src/components/MaxInputPhone.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputPhone.vue): correção do label padrão e configuração de `type="tel"` / `inputmode="tel"`.
- [`src/components/MaxInputCep.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue): inclusão de `inputmode="numeric"` e correção do ícone animado de loading.
- [`tests/components/MaxInputCpfCnpj.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputCpfCnpj.test.ts): testes de validação em digitação vs. blur.
- [`tests/components/MaxInputPhone.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputPhone.test.ts): teste garantindo que o label padrão seja `'Telefone'` e não contenha `"false"`.
- [`tests/components/MaxInputCep.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputCep.test.ts): teste para ícone de loading válido e `inputmode="numeric"`.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Ajustes em `MaxInputCpfCnpj.vue`

No script:

```ts
const hasBeenTouched = ref(false);

const onBlur = () => {
    hasBeenTouched.value = true;
};

const done = computed<boolean | null>(() => {
    if (props.done !== undefined) return props.done ?? null;
    const only_numbers = onlyNumbers(temp_value.value ?? '');
    if (only_numbers.length === 0) return null;
    if (props.cpf) return only_numbers.length === 11 ? cpfIsValid(only_numbers) : null;
    if (props.cnpj) return only_numbers.length === 14 ? cnpjIsValid(only_numbers) : null;
    if (only_numbers.length === 11) return cpfIsValid(only_numbers);
    if (only_numbers.length === 14) return cnpjIsValid(only_numbers);
    return null;
});

const caution = computed(() => {
    if (props.caution !== undefined) return props.caution;
    const only_numbers = onlyNumbers(temp_value.value ?? '');
    if (only_numbers.length === 0) return false;

    const isComplete = (type_mask.value === 'cpf' && only_numbers.length === 11)
        || (type_mask.value === 'cnpj' && only_numbers.length === 14);

    // Se o documento estiver completo, valida imediatamente
    if (isComplete) {
        return done.value === false;
    }

    // Se ainda está incompleto, só acusa erro se o usuário já tiver saído do campo (blur)
    if (hasBeenTouched.value) {
        return true;
    }

    // Enquanto está digitando e incompleto, não acusa erro prematuro
    return false;
});
```

No template:

```html
<template>
    <InputBase
        class="max-input-cpf-cnpj"
        v-bind="props"
        :error="error_msg ?? undefined"
        :caution="caution"
        :done="done ?? undefined"
    >
        <input
            type="text"
            inputmode="numeric"
            class="p-inputtext p-component"
            :value="masked_value"
            v-maska="maskValue"
            :disabled="props.disabled"
            @input="onUserInput"
            @blur="onBlur"
            :style="`letter-spacing: 2.5px;`"
        />
    </InputBase>
</template>
```

### 3.2. Ajustes em `MaxInputPhone.vue`

No template (linhas 2 e 25):

```html
<template>
    <InputBase
        class="max-input-phone input-phone"
        v-bind="props"
        :value="temp_value"
        :done="done"
        :error="error"
        :caution="caution"
        :label="props.noLabel ? undefined : (props.label ?? 'Telefone')"
        :icon-right="props.noIcon ? undefined : 'ic:baseline-whatsapp'"
    >
        <div class="inputs-div">
            <!-- Seleção de DDI -->
            <!-- ... -->
            <input
                type="tel"
                inputmode="tel"
                slot-b
                v-model="phone"
                v-maska:unmaskedValue.unmasked="maskValue"
                :placeholder="country.value === 55 ? '(99) 9 9999 - 9999' : ''"
                class="p-inputtext phone-number-input"
                @focus="onFocus = true"
                @blur="onFocus = false"
            />
        </div>
        <!-- ... -->
    </InputBase>
</template>
```

### 3.3. Ajustes em `MaxInputCep.vue`

No template (linhas 2 e 3):

```html
<template>
    <InputBase
        v-bind="props"
        class="max-input-cep input-base-cep-main-div"
        :value="temp_value"
        :done="done ?? undefined"
        :caution="caution"
        :error="error_msg ?? undefined"
        :icon-right="loading ? 'line-md:loading-loop' : undefined"
    >
        <input
            type="text"
            inputmode="numeric"
            class="p-inputtext p-component"
            v-model="temp_value"
            v-maska="maskValue"
            placeholder="00000-000"
        />
    </InputBase>
</template>
```

---

## 4. Garantia de Retrocompatibilidade

- Emissões de `update:modelValue` e eventos auxiliares (`complete`) mantêm rigorosamente os mesmos tipos de dados e payloads.
- O label customizado passado via prop `:label="'Celular Comercial'"` continua tendo precedência sobre o valor padrão `'Telefone'`.
- Os comportamentos em navegadores desktop não são alterados, pois `inputmode` atua exclusivamente no teclado virtual de navegadores móveis e tablets.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Digitar o primeiro dígito de um CPF em `MaxInputCpfCnpj` não deve ativar o estado `caution` nem exibir `"CPF inválido"` enquanto o campo não perder o foco (`blur`).
2. Digitar 11 dígitos inválidos em `MaxInputCpfCnpj` (ex: `111.111.111-11`) ativa o erro imediatamente assim que o 11º dígito for preenchido.
3. Renderizar `MaxInputPhone` sem passar a prop `label` exibe exatamente o texto `"Telefone"`, sem nenhuma ocorrência de `"false"` ou `"Telefonefalse"`.
4. Os campos `MaxInputCpfCnpj` e `MaxInputCep` possuem o atributo `inputmode="numeric"`.
5. O campo `MaxInputPhone` possui `type="tel"` e `inputmode="tel"`.
6. Quando `MaxInputCep` estiver com `loading: true`, o ícone exibido à direita é `'line-md:loading-loop'`.

### 5.2. Comandos de Validação
```bash
# Validação de tipagem
npm run type-check

# Testes unitários dos três componentes envolvidos
npx vitest run tests/components/MaxInputCpfCnpj.test.ts tests/components/MaxInputPhone.test.ts tests/components/MaxInputCep.test.ts
```
