# Plano de Migração — MaxInputNumber

> Plano autossuficiente para migrar o componente `MaxInputNumber` de forma a torná-lo
> **independente do PrimeVue**, preservando API pública, estilos e comportamento.
> Uma IA futura deve conseguir executar esta migração lendo apenas este arquivo +
> `src/components/MaxInputNumber.vue` + `src/components/InputBase.vue`.

---

## 1. Componente

- **Nome:** `MaxInputNumber`
- **Arquivo:** `src/components/MaxInputNumber.vue`
- **Nível de dificuldade:** `media`
- **Export/alias:** exportado em `src/index.ts` (linha 64):
  `export { default as MaxInputNumber } from './components/MaxInputNumber.vue';`
- **Objetivo da migração:** substituir o `InputNumber` do PrimeVue por um input nativo
  (`<input type="text" inputmode="decimal">`) com formatação numérica **pt-BR** própria
  (separador de milhar `.`, separador decimal `,`), suporte a `prefix`/`suffix`,
  `minFractionDigits`, e — caso seja adicionado no futuro — botões de incremento/decremento
  (spinner). Mantém `toSearchableString`/`hasContent` e o wrapper `InputBase`.

---

## 2. Dependências do PrimeVue (trechos reais)

O único ponto de dependência direta do PrimeVue neste componente é:

```ts
// src/components/MaxInputNumber.vue (linha 16)
import InputNumber from 'primevue/inputnumber';
```

Usado no template (linhas 2–4):

```vue
<template>
    <InputBase v-bind="props" :value="temp_value" :done="isDone" :error="error_msg" :caution="caution">
        <InputNumber v-bind="props" v-model="temp_value" fluid @blur="isDone = testIsDone()" />
    </InputBase>
</template>
```

Comportamentos do `InputNumber` do PrimeVue que HOJE são aproveitados via `v-bind="props"`
e precisam ser reimplementados manualmente:

- Formatação numérica com locale (o PrimeVue usa `Intl.NumberFormat` internamente; o projeto
  aplica locale `pt-BR` globalmente via `install()`).
- `prefix` / `suffix` — prefixo/sufixo textual no campo (props já declaradas no componente Max).
- `minFractionDigits` — número mínimo de casas decimais (default `2` no componente Max).
- `fluid` — ocupa 100% da largura (será substituído por CSS `width: 100%`).
- `placeholder`, `disabled` — repassados ao input nativo.
- `v-model` numérico: o `InputNumber` do PrimeVue emite `number` (não `string`) via
  `update:modelValue`. **Este contrato deve ser preservado** (ver §4).

> **Observação transitiva:** `InputBase.vue` (o wrapper) também importa componentes PrimeVue
> (`FloatLabel`, `IconField`, `InputIcon`, `Message`). A migração do `InputBase` é
> **pré-requisito** e é tratada em plano próprio — ver §10 (Ordem/Riscos). Este plano assume que
> após a migração o `InputBase` continua expondo o **mesmo** contrato (props `value`, `done`,
> `error`, `caution`, slot default, etc.).

---

## 3. Dependências internas

Do próprio pacote / `@maxvue/max-use`:

- **`InputBase`** (`src/components/InputBase.vue`) — wrapper obrigatório; permanece como
  elemento externo (`<InputBase>...</InputBase>`). Props repassadas: `value`, `done`, `error`,
  `caution` e todo o resto via `v-bind="props"`.
- **`toSearchableString`** — de `@maxvue/max-use`
  (`../MaxUse/src/Helpers/Strings/converters.ts`). Normaliza string (remove acentos, minúsculas,
  remove não-alfanuméricos). Usado na comparação com `targetValue`.
- **`hasContent`** — de `@maxvue/max-use`
  (`../MaxUse/src/Helpers/Types/hasContent.ts`). Verifica se há conteúdo (não vazio/nulo).
  Usado em `isEqual` e `isRequiredDone`.
- Composables Vue: `ref`, `computed`, `watch`, `useAttrs` (de `vue`) e tipo `Ref`.

**Nenhuma store Pinia** é usada por este componente.

Estes utilitários **NÃO devem ser reescritos** — apenas continuar sendo importados
exatamente como estão:

```ts
import { toSearchableString, hasContent } from '@maxvue/max-use';
```

---

## 4. API pública a preservar (contrato transparente para o consumidor)

### Props (assinatura `defineProps` + defaults — devem permanecer idênticas)

| Prop | Tipo | Default | Papel |
|------|------|---------|-------|
| `modelValue` | `any` | `''` | Valor atual (v-model) |
| `icon` | `string \| undefined` | — | Ícone (repassado ao InputBase) |
| `i` | `string \| undefined` | — | Alias de `icon` |
| `disabled` | `boolean \| undefined` | — | Desabilita o campo |
| `float` | `boolean \| undefined` | — | Estilo FloatLabel |
| `msg` | `string \| undefined` | — | Mensagem (alias) |
| `message` | `string \| undefined` | — | Mensagem de feedback |
| `iconMessage` | `string \| undefined` | — | Ícone da mensagem |
| `label` | `string \| undefined` | — | Rótulo |
| `done` | `boolean \| undefined` | `undefined` | Estado de validação manual |
| `error` | `string \| boolean \| undefined` | — | Estado/mensagem de erro |
| `targetValue` | `string` | — | Valor esperado para comparação |
| `caution` | `string \| boolean \| undefined` | `undefined` | Estado de atenção |
| `required` | `boolean` | `false` | Campo obrigatório |
| `prefix` | `string \| undefined` | `undefined` | Prefixo do campo |
| `suffix` | `string \| undefined` | `undefined` | Sufixo do campo |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder |
| `minFractionDigits` | `number \| undefined` | `2` | Casas decimais mínimas |

> **Manter exatamente** `withDefaults(defineProps<{...}>(), { modelValue: '', done: undefined, required: false, caution: undefined, prefix: undefined, suffix: undefined, placeholder: undefined, minFractionDigits: 2 })`.

### Emits

- `update:modelValue` — emitido em `watch(temp_value, ...)`.
  **Contrato crítico:** o valor emitido deve ser o **número** (não a string formatada), como
  faz o PrimeVue. `temp_value` deve armazenar o valor numérico bruto; a formatação é apenas de
  exibição.

```ts
const emit = defineEmits(['update:modelValue']);
```

### v-model

- `modelValue` in / `update:modelValue` out. Watch bidirecional já existente:
  ```ts
  watch(temp_value, () => { isDone.value = testIsDone(); emit('update:modelValue', temp_value.value); });
  watch(() => props.modelValue, () => (temp_value.value = props.modelValue));
  ```

### Slots

- Nenhum slot próprio exposto pelo `MaxInputNumber` (o slot default é consumido internamente
  pelo `InputBase`).

### Atributos herdados (via `useAttrs`) — comportamento de mensagens de erro a preservar

O `error_msg` computed lê atributos não declarados. Manter a lógica **exata**:

```ts
const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
return attrs_error_message ?? 'Valor inválido';
```

### Lógica de validação a preservar (idêntica)

- `isEqual` — compara `targetValue` com `temp_value` via `toSearchableString`.
- `isRequiredDone` — `required ? hasContent(temp_value) : null`.
- `testIsDone()` — precedência: `props.done` → `isEqual` → `isRequiredDone` → `!caution` → `null`.
- `caution` computed e `error_msg` computed — manter sem alteração.
- `isDone` inicializado com `props.done ?? null`; recalculado em `@blur` e no watch.

> **A migração NÃO deve alterar nenhuma dessas expressões.** Elas independem do PrimeVue.
> Só muda o elemento de input dentro do slot.

---

## 5. Estratégia de substituição

Substituir `<InputNumber>` por um `<input type="text" inputmode="decimal">` nativo com uma
camada de formatação pt-BR baseada em `Intl.NumberFormat`. O `temp_value` continua sendo o
**número bruto**; a exibição usa uma string formatada derivada.

### 5.1 Formatação pt-BR (Intl.NumberFormat)

```ts
const formatter = computed(() => new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: props.minFractionDigits ?? 2,
    maximumFractionDigits: Math.max(props.minFractionDigits ?? 2, 20)
}));
```

- Separador de **milhar** em pt-BR = `.` ; separador **decimal** = `,` (o `Intl` já resolve
  isso automaticamente para o locale `pt-BR`).
- `prefix`/`suffix` são concatenados manualmente ao redor do número formatado
  (o `Intl.NumberFormat` de `pt-BR` NÃO deve usar `style: 'currency'` — o prefixo `R$` vem da
  prop `prefix`, mantendo flexibilidade). Exemplo de exibição:
  `` `${props.prefix ?? ''}${formatter.value.format(n)}${props.suffix ?? ''}` ``.

### 5.2 Parsing (string formatada → número)

Ao digitar, converter a string do input de volta para número:

```ts
function parseLocaleNumber(raw: string): number | null {
    if (!hasContent(raw)) return null;
    // remove prefixo/sufixo e tudo que não for dígito, vírgula, ponto ou sinal
    let s = raw;
    if (props.prefix) s = s.replaceAll(props.prefix, '');
    if (props.suffix) s = s.replaceAll(props.suffix, '');
    s = s.replace(/[^\d,.-]/g, '');       // mantém dígitos, . , -
    s = s.replace(/\./g, '');             // remove separador de milhar (.)
    s = s.replace(',', '.');              // converte decimal , -> .
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
}
```

### 5.3 Estado de exibição vs. valor

- `temp_value: Ref<number | null | string>` — valor bruto (número), preserva o tipo emitido.
- `displayValue: Ref<string>` — string mostrada no `<input>`. Atualizada:
  - no `@input`: parse → atualiza `temp_value` (sem reformatar durante a digitação, para não
    quebrar o cursor); OU reformatar apenas no `@blur` (recomendado — igual ao PrimeVue, que
    formata ao perder foco).
  - no `@blur`: reformatar `displayValue = formatDisplay(temp_value.value)` e disparar
    `isDone = testIsDone()` (comportamento atual do `@blur`).
  - no `@focus` (opcional): mostrar valor "cru" editável (`n.toString().replace('.', ',')`)
    para facilitar edição — comportamento aceitável e mais próximo do PrimeVue.
- Watch de `props.modelValue`: atualizar `temp_value` **e** `displayValue`.

### 5.4 Spinner buttons (incremento/decremento)

- **Estado atual:** o componente **NÃO** usa `showButtons`/`step` — não há spinner hoje.
  Portanto, spinner é **opcional** e NÃO deve ser adicionado a menos que se queira paridade
  total com o PrimeVue.
- **Se** decidir implementar (para robustez futura), aceitar props opcionais `showButtons?:
  boolean`, `step?: number` (default `1`), `min?: number`, `max?: number`, e renderizar dois
  `<button type="button">` (up/down) que ajustam `temp_value` respeitando `min`/`max` e
  reformatam. **Não** altera a API atual (props opcionais com default que preservam o
  comportamento sem spinner). Marcar como incremento não obrigatório neste plano.

### 5.5 Template resultante (esboço — respeitar convenções: Template→Script→Style, 4 espaços)

```vue
<template>
    <InputBase v-bind="props" :value="temp_value" :done="isDone" :error="error_msg" :caution="caution">
        <input
            type="text"
            inputmode="decimal"
            class="max-inputnumber p-inputtext"
            :value="displayValue"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
        />
    </InputBase>
</template>
```

> Manter a classe `p-inputtext` no `<input>` **é importante**: o SCSS do `InputBase`
> (`.p-inputtext { height: 36px; ... }`, alinhamento, estados disabled) e vários seletores do
> tema Max miram `.p-inputtext`/`input`. Ver §7.

---

## 6. Passos de implementação (ordenados)

1. **Pré-requisito:** confirmar que `InputBase` já foi migrado e ainda expõe o mesmo contrato
   (slot default, props `value`/`done`/`error`/`caution`). Se não, **parar** e migrar `InputBase`
   primeiro (ver §10).
2. Abrir `src/components/MaxInputNumber.vue`. **Remover** a linha
   `import InputNumber from 'primevue/inputnumber';`.
3. **Manter intactos:** imports de `@maxvue/max-use`, `vue`, `InputBase`; o bloco `defineProps`
   com defaults; `attrs`; `isEqual`, `isRequiredDone`, `testIsDone`, `caution`, `error_msg`;
   `emit`; os dois `watch`.
4. Adicionar o `formatter` computed e as funções `formatDisplay(n)` e `parseLocaleNumber(raw)`
   (ver §5).
5. Criar `const displayValue = ref(formatDisplay(props.modelValue));`
   (tratando `''`/`null` → string vazia).
6. Implementar handlers:
   - `onInput(e)`: `temp_value.value = parseLocaleNumber(e.target.value); displayValue.value = e.target.value;`
     (não reformatar durante digitação).
   - `onFocus(e)`: opcional — mostrar valor editável cru.
   - `onBlur()`: `displayValue.value = formatDisplay(temp_value.value); isDone.value = testIsDone();`
     (substitui `@blur="isDone = testIsDone()"` do template antigo, preservando esse efeito).
7. Ajustar o `watch(() => props.modelValue, ...)` para também sincronizar `displayValue`.
   O `watch(temp_value, ...)` que emite `update:modelValue` **permanece inalterado**
   (garante que o número bruto é emitido).
8. Substituir `<InputNumber v-bind="props" v-model="temp_value" fluid @blur="..." />` pelo
   `<input>` nativo do §5.5.
9. Reproduzir `prefix`/`suffix`/`minFractionDigits` via `formatDisplay` (não via atributos do
   input). `fluid` → CSS `width: 100%` (ver §7).
10. Rodar lint e type-check; ajustar tipos (`temp_value` tipar como `Ref<number | null>` ou
    manter `any` para não quebrar a assinatura `modelValue: any`).
11. Rodar os testes (§8) e o playground para verificação visual.
12. **Não** é necessário regenerar o resolver (nenhum arquivo `.vue` novo foi criado) nem
    alterar `src/index.ts` (o export permanece o mesmo).

---

## 7. Estilos

O componente **não possui `<style>` próprio** hoje — toda a estilização vem do `InputBase.vue`
e do tema global. Para preservar a aparência:

- **Manter a classe `p-inputtext`** no `<input>` nativo. O SCSS de `InputBase.vue` já estiliza:
  - `.p-inputtext { height: 36px; }` e estados `[disabled]` (background `--background-75`, cor
    `--background-400`/`--background-575`).
  - `.p-inputtext, .p-datepicker, .p-autocomplete { width: 100% !important; }` → cobre o `fluid`.
  - Alinhamento via `&.text-center input`, `&.text-right input`, placeholder
    `input::placeholder { color: var(--background-625); }`, e variações `[slim]`, `[full]`,
    `.in-line`, estados `.caution`/`.error` que miram `input` e `.p-inputtext`.
- Se algum estilo do PrimeVue `.p-inputnumber` (wrapper) era necessário, note que o SCSS já
  referencia `.p-inputnumber` em `[slim]` (linha ~315: `:not(.p-inputnumber) { padding: ... }`).
  Como o wrapper deixa de existir, **avaliar** adicionar um `<style lang="scss" scoped>` mínimo
  ao `MaxInputNumber` para reproduzir apenas o que faltar (ex.: `width: 100%`, alinhamento de
  prefixo/sufixo). Preferir **não** introduzir novos estilos além do necessário.
- Se implementar spinner (§5.4), adicionar SCSS scoped para os botões usando variáveis do tema
  (`var(--background-100)`, `var(--max-primary-500)`), seguindo `vue-unocss-styling-best-practices`.
- Usar sempre variáveis CSS do tema Max (`var(--background-*)`, `var(--max-*)`), nunca cores
  hardcoded. Bloco `<style lang="scss">` (se criado) vem por último (ordem Template→Script→Style).

---

## 8. Testes / verificação

Arquivo existente: `tests/components/MaxInputNumber.test.ts` (Vitest + `@vue/test-utils`).
**Todos os 8 casos devem continuar passando sem modificação.** Eles verificam:

1. Renderiza (`wrapper.exists()`).
2. Renderiza com `label`.
3. Emite `update:modelValue` ao alterar `modelValue`.
4. `done=true` após `blur` quando `required` e preenchido (`modelValue: 42`) →
   `InputBase.props('done') === true`.
5. Erro "Campo obrigatório" quando `required` e vazio (`modelValue: null`) após blur.
6. Aceita `prefix` e `suffix`.
7. Erro por `targetValue` diferente + attr `error_msg` custom (`'Erro customizado'`).
8. Erro genérico "Valor inválido" quando `done: false` explícito após blur.

**Pontos de atenção nos testes:**
- Os testes disparam `blur` no `wrapper.findAll('input')[0]`. O novo `<input>` nativo garante
  que exista um `input` no DOM (o `InputNumber` do PrimeVue também renderiza `input`), então
  `inputs.length > 0` continua verdadeiro e o `@blur` continua chamando `testIsDone()`.
- O teste 5/7/8 leem `InputBase.props('error')` — depende de `error_msg`/`caution`, que **não**
  mudam. O teste 4 depende de `isDone` recalculado no `@blur` — garantir que `onBlur` chame
  `isDone.value = testIsDone()`.

**Casos de borda a validar manualmente / adicionar testes:**
- Formatação pt-BR: `1234.5` → exibe `1.234,50` (com `minFractionDigits: 2`).
- Parsing: digitar `1.234,56` → `temp_value === 1234.56` e `update:modelValue` emite `1234.56`
  (número, **não** string).
- `minFractionDigits` custom (ex.: `0` e `3`).
- `prefix: 'R$ '` / `suffix: ' kWh'` aparecem na exibição e são removidos no parsing.
- Valor `null`/`''` → input vazio, sem `NaN`.
- Round-trip: setar `modelValue` externamente reflete no `displayValue` (watch).

**Comandos:**
```bash
npx vitest run tests/components/MaxInputNumber.test.ts
npm run type-check
npm run lint
npm run dev:playground   # verificação visual (formatação, foco/blur, prefix/suffix)
```

---

## 9. Skills necessárias

Skills selecionadas em `.claude/skills/` (priorizando prefixo `vue-` e relevância a inputs
numéricos/formatação):

- **`.claude/skills/vue-inputs-masks-validation-best-practices`** — núcleo desta migração:
  cita explicitamente `MaxInputNumber` (moeda/número), formatação, unmasking e extração do valor
  bruto; guia parsing/formatação e validação de inputs.
- **`.claude/skills/vue-max-components-ui-development-best-practices`** — convenções internas da
  lib (uso do `InputBase`, padrão dos componentes Max, aliases em `index.ts`).
- **`.claude/skills/vue-max-use-development-best-practices`** — uso correto de `toSearchableString`
  e `hasContent` de `@maxvue/max-use`, preservados na validação.
- **`.claude/skills/vue-typescript-best-practices`** — tipagem em `<script setup lang="ts">`,
  `defineProps`/`defineEmits`/`Ref` (tipar `temp_value`/`displayValue` corretamente).
- **`.claude/skills/vue-unocss-styling-best-practices`** — reproduzir aparência com classes
  utilitárias e variáveis CSS do tema Max, sem hardcode.
- **`.claude/skills/vue-eslint-stylelint-quality-standards`** — 4 espaços, aspas simples,
  ponto-e-vírgula, sem trailing comma, ordem Template→Script→Style.
- **`.claude/skills/vue-vitest-testing-best-practices`** — manter/estender os testes de
  `tests/components/MaxInputNumber.test.ts`.
- **`.claude/skills/vue-i18n-localization-best-practices`** — apoio à formatação de locale pt-BR
  (`Intl.NumberFormat`, separadores de milhar/decimal). *(relevância secundária)*
- **`.claude/skills/systematic-debugging-best-practices`** — depurar edge cases de parsing/cursor
  durante a migração, caso surjam. *(apoio)*

---

## 10. Riscos e pontos de atenção

- **Ordem — `InputBase` primeiro (bloqueante):** `MaxInputNumber` usa `<InputBase>` como wrapper
  externo. `InputBase` ainda importa PrimeVue (`FloatLabel`, `IconField`, `InputIcon`, `Message`).
  **Migrar `InputBase` antes** deste componente e garantir contrato de slot/props idêntico.
  Se o `InputBase` já estiver migrado, prosseguir; caso contrário, este plano fica **bloqueado**.
- **Tipo do valor emitido (contrato crítico):** o PrimeVue `InputNumber` emite `number`. Não
  emitir a string formatada — sempre o número bruto em `temp_value`. Quebrar isso afeta todos os
  consumidores (cálculos, persistência).
- **Formatação vs. cursor:** reformatar durante `@input` desloca o cursor. Recomendação: parse no
  `@input`, **reformatar apenas no `@blur`** (paridade com PrimeVue). Mostrar valor cru no `@focus`.
- **Locale global:** o projeto aplica locale pt-BR via `install()`. Usar `Intl.NumberFormat('pt-BR')`
  explicitamente para não depender do locale do ambiente de teste (happy-dom/CI pode ser en-US).
- **Separadores invertidos:** em pt-BR milhar=`.` e decimal=`,`. Erro comum é trocar os dois no
  parsing — seguir §5.2 (remover `.`, converter `,`→`.`).
- **`minFractionDigits` como `maximumFractionDigits`:** garantir
  `maximumFractionDigits >= minimumFractionDigits` no `Intl.NumberFormat`, senão lança `RangeError`.
- **Classe `p-inputtext`:** manter no `<input>` para herdar o SCSS do `InputBase` (altura 36px,
  disabled, alinhamento, `[slim]`, `.in-line`, estados de erro/caução). Remover a classe quebra o
  layout.
- **`v-bind="props"` no template antigo** espalhava props no `InputNumber`. No `<input>` nativo,
  props como `prefix`/`suffix`/`minFractionDigits` NÃO são atributos HTML válidos — tratá-las na
  camada de formatação, não no `v-bind` do input (evitar warnings/atributos indevidos no DOM).
- **Spinner buttons:** não existem hoje; adicioná-los é opcional e deve usar props opcionais com
  defaults que preservem 100% o comportamento atual (sem botões).
- **Testes tolerantes:** os testes usam `if (inputs.length > 0)`; garantir que o input nativo
  esteja sempre presente para que as asserções de `blur` de fato executem.
