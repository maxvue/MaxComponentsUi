# Plano de Migração — MaxInputCoordinateDecimalLat

> Plano autossuficiente para remover a dependência do PrimeVue deste componente.
> A IA executora deve conseguir realizar a migração lendo APENAS este arquivo mais o
> código-fonte referenciado. NÃO altere outros componentes. Preserve API, estilos e comportamento.

---

## 1. Componente

- **Nome:** `MaxInputCoordinateDecimalLat`
- **Arquivo:** `src/components/MaxInputCoordinateDecimalLat.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** substituir o `InputText` do PrimeVue por um `<input>` HTML nativo,
  mantendo intactos: a conversão `toNumber` / `isBlank` (de `@maxvue/max-use`), a máscara `maska`,
  a validação de latitude (faixa do Brasil) e o wrapper `InputBase`.

Este componente é a versão de **latitude**. Existe um par gêmeo, `MaxInputCoordinateDecimalLng`
(longitude), que segue exatamente o mesmo padrão — migre-os de forma idêntica, apenas trocando a
faixa de validação e a mensagem de erro. Ambos são orquestrados por `MaxInputCoordinates`.

### Código-fonte atual (referência integral)

```vue
<template>
    <InputBase v-bind="props" :error="error" :caution="caution" :done="isDone">
        <InputText number type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " fluid @blur="checkDone()" :placeholder="`00,000000`" />
    </InputBase>
</template>

<script setup lang="ts">
    import { toNumber, isBlank } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    import { vMaska } from 'maska/vue';

    const props = withDefaults(
        defineProps<{
            modelValue: string | number;
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits(['update:modelValue', 'complete']);

    const temp_value: Ref = ref(toNumber(props.modelValue) !== 0 ? toNumber(props.modelValue) : '');

    const only_numbers = computed(() => toNumber(temp_value.value));

    const isDone: Ref = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = done.value;
    };

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        return !(only_numbers.value < -33.8 || only_numbers.value > 5.3 || only_numbers.value === 0 || isNaN(only_numbers.value));
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        if (temp_value.value === '') return false;
        return !done.value;
    });

    const error = computed(() => {
        if (isBlank(temp_value.value) && props.required) return 'Campo obrigatório';
        if (!done.value) return 'Latitude inválida.';
        return false;
    });

    const negative: Ref = ref(false);

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            '9': { pattern: /[0-9]/, optional: true },
            '3': { pattern: /[0-3-]/, optional: true }
        };

        return {
            tokens: tokens,
            mask: negative.value ? '-39.######' : '33.######',
            eager: true
        };
    });

    watch(
        temp_value,
        () => {
            if (temp_value?.value < 0) negative.value = true;
            emit('update:modelValue', temp_value.value);
            if (done.value) emit('complete', temp_value.value);

        },
        { immediate: true }
    );

    watch(
        () => props.modelValue,
        () => {
            temp_value.value = props.modelValue;
        }
    );
</script>
```

---

## 2. Dependências do PrimeVue (trechos reais)

Há **um único** ponto de dependência direta do PrimeVue neste arquivo:

1. **Import:**
   ```ts
   import InputText from 'primevue/inputtext';
   ```

2. **Uso no template** (slot default de `InputBase`):
   ```vue
   <InputText number type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " fluid @blur="checkDone()" :placeholder="`00,000000`" />
   ```

### Análise dos atributos do `InputText`

| Atributo         | Função no PrimeVue | Ação na migração |
|------------------|--------------------|------------------|
| `number`         | Prop booleana sem efeito real em `InputText` (não é `InputNumber`); é um atributo "solto". | **Remover** (não gera comportamento). |
| `type="text"`    | Tipo do input.     | Manter como `type="text"` no `<input>` nativo. |
| `v-model="temp_value"` | Two-way binding sobre o valor. PrimeVue `InputText` usa `modelValue`/`update:modelValue`, que no `<input>` nativo corresponde a `value` + `input`. | Substituir por `v-model="temp_value"` nativo (funciona igual em `<input>`). |
| `v-maska="maskValue"` | Diretiva da lib `maska` (NÃO é do PrimeVue). | **Manter** — é dependência externa preservada. |
| `autoClear="false"` | Prop de PrimeVue sem correspondente relevante. | **Remover**. |
| `slotChar=" "`   | Prop de PrimeVue (usada por InputMask), inócua aqui. | **Remover**. |
| `fluid`          | Prop PrimeVue que faz o input ocupar 100% da largura. | Reproduzir via CSS (o `InputBase` já força `width: 100%` no seletor `input`; adicionar classe utilitária se necessário). |
| `@blur="checkDone()"` | Evento nativo `blur`. | **Manter** — `blur` é evento DOM padrão. |
| `:placeholder`   | Atributo nativo.   | **Manter**. |

> Observação de CSS: `InputBase.vue` estiliza o input pelo seletor de tag `input { ... }` e também
> por classes PrimeVue como `.p-inputtext`. Ver seção 7 para reproduzir a aparência sem `.p-inputtext`.

---

## 3. Dependências internas (preservar)

- **`InputBase.vue`** (`src/components/InputBase.vue`) — wrapper obrigatório. Continua sendo o
  elemento mais externo do template. O `<input>` nativo vira o conteúdo do slot default.
  > **Dependência de ordem:** `InputBase` também usa PrimeVue (`FloatLabel`, `IconField`,
  > `InputIcon`, `Message`). Ver seção 10 (Riscos): **`InputBase` deve ser migrado antes** deste
  > componente, ou pelo menos ter seu contrato de slot/props preservado.
- **`@maxvue/max-use`** (pacote local irmão em `../MaxUse`):
  - `toNumber(value, decimals = null)` — retorna `0` para valores brancos/`NaN`; caso contrário
    `Number(data)` (opcionalmente arredondado). Fonte:
    `../MaxUse/src/Helpers/Strings/converters.ts`.
  - `isBlank(value, if_zero = false)` — `!hasContentFn(value)`. Fonte:
    `../MaxUse/src/Helpers/Types/isBlank.ts`.
  - **Não reimplementar** — apenas manter os imports exatamente como estão.
- **`maska/vue`** — diretiva `vMaska` (dependência externa, não PrimeVue). Manter o import e o
  registro no template.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Nada abaixo pode mudar.

### Props (via `defineProps` + `withDefaults`)

| Prop | Tipo | Default |
|------|------|---------|
| `modelValue` | `string \| number` | `''` |
| `icon` | `string \| undefined` | — |
| `i` | `string \| undefined` | — |
| `disabled` | `boolean \| undefined` | — |
| `float` | `boolean \| undefined` | — |
| `msg` | `string \| undefined` | — |
| `message` | `string \| undefined` | — |
| `iconMessage` | `string \| undefined` | — |
| `label` | `string \| undefined` | — |
| `done` | `boolean \| undefined` | `undefined` |
| `error` | `string \| boolean \| undefined` | — |
| `targetValue` | `string` | — |
| `caution` | `string \| boolean \| undefined` | `undefined` |
| `required` | `boolean` | `false` |

Manter a assinatura de tipo **idêntica** e o `withDefaults` idêntico:
`{ modelValue: '', done: undefined, required: false, caution: undefined }`.

### Emits

- `update:modelValue` — emitido no watcher de `temp_value` (inclusive `{ immediate: true }`).
- `complete` — emitido quando `done.value` é verdadeiro.

### Slots

- Nenhum slot próprio exposto. O `<slot>` relevante pertence ao `InputBase`.

### v-model

- `v-model` padrão (`modelValue` / `update:modelValue`).

### Comportamento observável (regras de negócio a preservar EXATAMENTE)

1. **Inicialização de `temp_value`:** `toNumber(props.modelValue) !== 0 ? toNumber(props.modelValue) : ''`.
2. **`only_numbers`** = `toNumber(temp_value.value)`.
3. **`isDone`** ref inicializado com `props.done ?? null`.
4. **`checkDone()`** atribui `isDone.value = done.value` (chamado no `blur`).
5. **`done`** computed:
   - se `props.done !== undefined` → retorna `props.done`;
   - senão → `!(only_numbers < -33.8 || only_numbers > 5.3 || only_numbers === 0 || isNaN(only_numbers))`.
     (Faixa de latitude válida aproximada do Brasil.)
6. **`caution`** computed:
   - se `props.caution !== undefined` → retorna `props.caution`;
   - se `temp_value === ''` → `false`;
   - senão → `!done.value`.
7. **`error`** computed:
   - se `isBlank(temp_value) && props.required` → `'Campo obrigatório'`;
   - se `!done.value` → `'Latitude inválida.'`;
   - senão → `false`.
8. **`negative`** ref: uma vez que `temp_value < 0`, vira `true` e permanece.
9. **`maskValue`** computed: tokens `#`, `9`, `3` e máscara `negative ? '-39.######' : '33.######'`,
   `eager: true`.
10. **watch(`temp_value`, immediate)**: seta `negative` quando `< 0`, emite `update:modelValue`,
    e emite `complete` quando `done`.
11. **watch(`props.modelValue`)**: `temp_value.value = props.modelValue`.
12. **Placeholder** exibido: `00,000000`.

> Os testes acessam diretamente `wrapper.vm.temp_value`, `wrapper.vm.negative`, `wrapper.vm.done`,
> `wrapper.vm.caution`, `wrapper.vm.error`, `wrapper.vm.isDone`, `wrapper.vm.checkDone`. **Todos
> esses nomes internos devem continuar existindo e expostos** (não renomear, não encapsular).

---

## 5. Estratégia de substituição

**Complexidade baixa — substituição direta, sem biblioteca headless.**

- Trocar `<InputText ... />` por `<input ... />` nativo.
- O `v-model` do PrimeVue `InputText` é compatível 1:1 com o `v-model` do `<input>` nativo
  (ambos `modelValue`/`update:modelValue`; em `<input>` o Vue usa a propriedade `value` + evento
  `input` automaticamente). A diretiva `v-maska` continua funcionando porque atua diretamente sobre
  o elemento `<input>` do DOM.
- Remover props exclusivas do PrimeVue sem efeito real: `number`, `autoClear`, `slotChar`.
- Substituir `fluid` por estilo CSS (largura 100%) — ver seção 7.
- **NÃO** usar biblioteca headless. **NÃO** reimplementar a máscara: manter `maska`.
- **NÃO** reimplementar `toNumber`/`isBlank`: manter imports de `@maxvue/max-use`.

### Template resultante esperado

```vue
<template>
    <InputBase v-bind="props" :error="error" :caution="caution" :done="isDone">
        <input
            type="text"
            v-model="temp_value"
            v-maska="maskValue"
            class="p-inputtext max-native-input"
            @blur="checkDone()"
            :placeholder="'00,000000'"
        />
    </InputBase>
</template>
```

> Manter a classe `p-inputtext` no `<input>` (ou reproduzir seu efeito) é a forma mais barata de
> herdar toda a estilização já escrita em `InputBase.vue` e no tema Max sem tocar em CSS. Ver a
> seção 7 para a decisão sobre manter/adicionar classes. `max-native-input` é opcional e serve
> como gancho caso seja preciso ajustar altura/largura sem depender de `.p-inputtext`.

O bloco `<script setup lang="ts">` permanece **idêntico**, exceto:
- Remover `import InputText from 'primevue/inputtext';`.

---

## 6. Passos de implementação

1. **Abrir** `src/components/MaxInputCoordinateDecimalLat.vue`.
2. **Remover** a linha de import `import InputText from 'primevue/inputtext';`.
3. **Manter** todos os demais imports: `toNumber`, `isBlank` (`@maxvue/max-use`); `Ref`, `ref`,
   `computed`, `watch` (vue); `InputBase`; `vMaska` (`maska/vue`).
4. **Substituir** no template o elemento `<InputText ... />` pelo `<input ... />` nativo conforme
   a seção 5:
   - manter `type="text"`, `v-model="temp_value"`, `v-maska="maskValue"`, `@blur="checkDone()"`,
     `:placeholder="'00,000000'"`;
   - remover `number`, `autoClear`, `slotChar`, `fluid`;
   - adicionar `class="p-inputtext"` (mais opcionalmente `max-native-input`) para herdar estilos.
5. **Não alterar** nenhuma linha do `<script setup>` além do import removido. Confirmar que
   `temp_value`, `only_numbers`, `isDone`, `checkDone`, `done`, `caution`, `error`, `negative`,
   `maskValue` e os dois `watch` permanecem byte a byte iguais.
6. **Preservar as convenções** do projeto: `<script setup lang="ts">`, indentação de 4 espaços,
   aspas simples, ponto e vírgula, sem trailing commas, ordem Template → Script → Style.
7. **Verificar** que o arquivo não possui bloco `<style>` próprio (o atual não tem). Se for
   necessário adicionar CSS (por ex. para substituir `fluid`), incluir um `<style lang="scss">`
   escopado ao final; caso contrário, não adicionar bloco de estilo.
8. **Rodar** type-check, lint e testes (seção 8).
9. **Aplicar a mesma migração** ao gêmeo `MaxInputCoordinateDecimalLng.vue` (faixa/mensagem de
   longitude), se estiver no escopo da tarefa; caso contrário, apenas registrar a pendência.

> **Não** é necessário rodar `generateResolver.ts`: nenhum componente novo é adicionado, o nome do
> arquivo não muda.

---

## 7. Estilos

O componente **não possui** `<style>` próprio hoje; ele herda toda a aparência de:

- **`InputBase.vue`** (`src/components/InputBase.vue`), que estiliza:
  - o container `.max-input-main-div` (grid `36px 19px`, estados `.done`/`.caution`/`.error`);
  - `input { &::placeholder { color: var(--background-625); } }`;
  - `.p-inputtext { height: 36px; ... }` e regras de `[disabled]`;
  - alinhamentos `text-center` / `text-right` via seletor `input`.
- **Tema Max** (`src/styles/style.ts`, `MaxStyle`) — variáveis CSS como `--background-*`,
  `--orange-600`, `--max-red-600`, etc.

### Como preservar a aparência sem `.p-inputtext` do PrimeVue

O seletor CSS `.p-inputtext` em `InputBase.vue` é **definido no próprio SCSS do projeto** (não vem
do runtime do PrimeVue), então **aplicar `class="p-inputtext"` no `<input>` nativo continua
funcionando** e é a estratégia recomendada de menor risco. O `<input>` nativo já casa com os
seletores de tag `input { ... }` existentes.

Regras de `InputBase.vue` relevantes que passam a valer para o `<input>` nativo:
- Largura total: coberta por `.p-inputtext, .p-datepicker, .p-autocomplete { width: 100% !important; }`
  e pelas variantes `[full]/[flex]/[slim]`. Isso **substitui o antigo `fluid`** — por isso `fluid`
  pode ser removido sem regressão visual.
- Altura 36px: `.p-inputtext { height: 36px; }`.
- Placeholder: `input::placeholder { color: var(--background-625); }`.
- Estados de borda vermelha/laranja: seletores `&.error input` e `&.caution input`.

**Decisão:** manter `class="p-inputtext"` no `<input>` para herdar tudo acima. Só adicione um
`<style lang="scss">` escopado ao componente se aparecer uma diferença visual real após a troca
(por exemplo, se futuramente `InputBase` remover o seletor `.p-inputtext`). Nesse caso, reproduza
apenas `width: 100%` e `height: 36px` usando variáveis do tema Max, mantendo indentação de 4
espaços e SCSS.

> Não usar classes UnoCSS inline para largura/altura aqui — o padrão do projeto para inputs é
> herdar de `InputBase`/`.p-inputtext`.

---

## 8. Testes / verificação

### Arquivo de teste existente

`tests/components/MaxInputCoordinateDecimalLat.test.ts` — **já cobre** os pontos críticos e o
próprio teste **stubba** o `InputText` como `<input />`:

```ts
const globalOptions = {
    directives: { maska: vMaska },
    stubs: { InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done'] }, InputText: { template: '<input />' } }
};
```

Casos cobertos: renderização; formatação + `update:modelValue` (`'-23.550520'`) e ativação de
`negative`; `done/caution/error` com latitude inválida (`'100'`) e `checkDone()` → `isDone === false`;
`caution` falso quando vazio; `error === 'Campo obrigatório'` quando `required` e vazio; emissão de
`complete` para latitude válida (`'-23.5'`); watch de `props.modelValue`; `done`/`caution` manuais
via prop; `error === false` quando válido.

### Ajuste necessário no teste após a migração

- O stub `InputText: { template: '<input />' }` deixa de ser referenciado no template migrado (que
  usa `<input>` nativo). **Não causa erro** manter o stub, mas o correto é **removê-lo** por já não
  existir componente `InputText` neste arquivo. Manter o stub de `InputBase` e o registro da
  diretiva `maska`. Confirmar que todos os `wrapper.vm.*` (`temp_value`, `negative`, `done`,
  `caution`, `error`, `isDone`, `checkDone`) continuam acessíveis — eles continuarão, pois o
  `<script setup>` não muda.

### Comandos de verificação

```bash
# Teste focado neste componente
npx vitest run tests/components/MaxInputCoordinateDecimalLat.test.ts

# Também rodar o gêmeo e o orquestrador, que compartilham o padrão
npx vitest run tests/components/MaxInputCoordinateDecimalLng.test.ts
npx vitest run tests/components/MaxInputCoordinates.test.ts

# Qualidade e tipos
npm run type-check
npm run lint
```

### Checklist manual (playground)

`npm run dev:playground` e validar:
- Digitar `-23.550520` → máscara aplica, ícone de "done" aparece, sem erro.
- Digitar `100` (fora da faixa) → estado de caution/erro "Latitude inválida.".
- Campo vazio com `required` → "Campo obrigatório".
- Valor negativo → máscara passa a `-39.######`.
- Placeholder exibe `00,000000`.
- Aparência (altura 36px, largura total, bordas de estado) idêntica à versão PrimeVue.

---

## 9. Skills necessárias

Skills selecionadas em `.claude/skills` (apenas as pertinentes a este componente de input simples):

- `.claude/skills/vue-inputs-masks-validation-best-practices` — o componente é um input com máscara
  `maska` e validação de faixa de latitude; skill central para esta migração.
- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (uso obrigatório do `InputBase`, aliases, estrutura de componentes).
- `.claude/skills/vue-max-use-development-best-practices` — uso correto de `toNumber`/`isBlank` de
  `@maxvue/max-use`, que devem ser preservados.
- `.claude/skills/vue-typescript-best-practices` — manter tipagem de `defineProps`/`defineEmits`
  em `<script setup lang="ts">` sem regressões.
- `.claude/skills/vue-unocss-styling-best-practices` — regras utilitárias/variáveis do tema Max,
  caso seja preciso reproduzir `fluid`/largura sem `.p-inputtext`.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — garantir 4 espaços, aspas simples,
  ponto e vírgula, sem trailing commas.
- `.claude/skills/vue-vitest-testing-best-practices` — ajustar/rodar o teste existente e validar
  o comportamento preservado.

Skills conscientemente **não** selecionadas: virtual scroller, datas, upload, PDF, dropdowns,
navegação por teclado, Pinia, componentes dinâmicos — nenhuma se aplica a este input.

---

## 10. Riscos e pontos de atenção

1. **Ordem — `InputBase` primeiro.** Este componente usa `<InputBase>` como wrapper externo, e o
   `InputBase.vue` ainda depende do PrimeVue (`FloatLabel`, `IconField`, `InputIcon`, `Message`).
   **Migre/estabilize o `InputBase` antes** ou garanta que o contrato de slot default e as props
   (`error`, `caution`, `done`, `label`, `icon`, etc.) permaneçam idênticos. Se `InputBase` mudar
   o seletor `.p-inputtext` ao ser migrado, revisar a seção 7.
2. **`v-maska` continua imprescindível.** Não confundir `maska` (lib externa) com PrimeVue. A
   diretiva atua no `<input>` do DOM; a substituição de `InputText` por `<input>` nativo **não**
   quebra a máscara.
3. **`v-model` em `<input>` nativo.** Funciona 1:1 com o que o `InputText` fazia; mas atenção: o
   `<input>` nativo dispara em evento `input` — mantém a paridade com `update:modelValue` do
   PrimeVue. Não introduzir `.lazy` nem `.number` no `v-model` (mudaria o valor de `temp_value`,
   que os testes esperam como string, ex.: `'-23.550520'`, `'-10'`).
4. **Não alterar nomes internos.** Os testes acessam `wrapper.vm.temp_value`, `negative`, `done`,
   `caution`, `error`, `isDone`, `checkDone`. Renomear/encapsular quebra a suíte.
5. **Props inócuas do PrimeVue.** `number`, `autoClear`, `slotChar` não têm efeito real; removê-las
   é seguro. `fluid` é substituído por CSS já existente no `InputBase` — não deixar de aplicar a
   classe que garante largura 100%.
6. **Faixa de validação é específica de latitude** (`< -33.8` ou `> 5.3`). Não copiar/colar por
   engano a faixa da longitude ao migrar o gêmeo `MaxInputCoordinateDecimalLng`.
7. **Gêmeo e orquestrador.** `MaxInputCoordinateDecimalLng` e `MaxInputCoordinates` compartilham o
   padrão; rodar os três testes após a migração para evitar regressão no conjunto de coordenadas.
8. **Sem regenerar resolver.** Nenhum componente novo é criado; não rodar `generateResolver.ts`.
