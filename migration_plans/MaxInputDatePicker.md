# Plano de Migração — MaxInputDatePicker

> Plano autossuficiente. Uma IA futura deve conseguir executá-lo lendo apenas este
> arquivo e o código-fonte referenciado. **Não** alterar código durante a leitura do plano.
> Objetivo: remover a dependência do PrimeVue no `MaxInputDatePicker`, preservando API
> pública, estilos e comportamento (calendário completo pt-BR, range, hora).

---

## 1. Componente

- **Nome:** `MaxInputDatePicker`
- **Caminho:** `src/components/MaxInputDatePicker.vue`
- **Nível de dificuldade:** `muito_alta`
- **Export/alias** (`src/index.ts`, linha 57):
  ```ts
  export { default as MaxInputDatePicker } from './components/MaxInputDatePicker.vue';
  ```
  Só existe **um** export para este componente. Verificar e preservar (não remover).
  Se novos aliases forem desejados, tratar isso fora deste plano.
- **Resumo da migração:** substituir o `DatePicker` do PrimeVue (`primevue/datepicker`) —
  um widget de calendário completo (navegação mês/ano, seleção de intervalo/range,
  seleção de hora, locale pt-BR) — por uma solução **independente do PrimeVue**.
  Dado o nível `muito_alta`, **PRIORIZAR uma biblioteca de calendário headless/pronta**
  (ver seção 5) em vez de reimplementar o calendário do zero. Manter `useDateFormat`
  (de `@maxvue/max-use`) e `InputBase` como wrapper. Preservar `v-model`, os estados
  `done`/`caution`/`error` e o formato de saída `YYYY-MM-DD HH:mm:ss`.

---

## 2. Dependências do PrimeVue (trechos reais)

Única dependência direta do PrimeVue neste componente:

```ts
import DatePicker from 'primevue/datepicker';
```

Uso no template (`src/components/MaxInputDatePicker.vue`, linhas 2-4):

```html
<InputBase v-bind="props" class="input-base-date-picker" :error="errorMessage" :caution="isCaution" :done="isDone" :icon="props.icon ?? 'solar:calendar-line-duotone'" >
    <DatePicker v-bind="props" :dateFormat="props.dateFormat ?? 'dd/mm/yy'" v-model="internalDate" @blur="validate" ref="element" :placeholder="props.placeholder ?? ''" />
</InputBase>
```

Bloco `<style>` que ataca classes internas do PrimeVue (linhas 166-170):

```scss
.p-datepicker-panel {
    transform: translateX(-10px);
}
```

O que o `DatePicker` do PrimeVue faz e **precisa ser reproduzido**:

- Renderiza um `<input>` de texto (`.p-inputtext`) com máscara/parse conforme `dateFormat`
  (`dd/mm/yy`), e um **painel de calendário flutuante** (`.p-datepicker-panel`) com:
  - navegação de mês/ano (setas, dropdowns de mês/ano);
  - grade de dias do mês, com destaque do dia atual e do dia selecionado;
  - **locale pt-BR** — nomes de dias/meses, `firstDayOfWeek`, `today`, `clear`. Esses
    valores vêm da config global do PrimeVue (`src/locales/pt-br.ts`, chaves
    `dayNames`, `dayNamesShort`, `dayNamesMin`, `monthNames`, `monthNamesShort`,
    `firstDayOfWeek: 0`, `dateFormat: 'dd/mm/yy'`, `today: 'Hoje'`, `clear: 'Limpar'`).
- `v-model="internalDate"` liga o valor a um objeto `Date` (não à string do modelValue —
  a conversão string↔Date é feita pelos `watch` do componente, ver seção 4.5).
- `@blur="validate"` — dispara `validate()` quando o campo perde foco.
- `ref="element"` — referência ao componente (atualmente **não** é usada em lógica; apenas
  declarada no template. Confirmar: não há `const element = ref()` no `<script>`. É um ref
  de template "solto" e pode ser descartado na migração ou mantido apontando para o novo
  componente, desde que não quebre nada — ver seção 10).
- `:placeholder`, `:dateFormat` repassados.
- `v-bind="props"` repassa TODAS as props (incluindo as de layout que o `DatePicker`
  ignora). Comportamento de fallthrough — o novo componente deve tolerar props extras
  sem quebrar.

> **Observação sobre range e hora:** o componente atual **não** ativa explicitamente
> `selectionMode="range"` nem `showTime` no template. Porém, via `v-bind="props"`, se o
> consumidor passar `selectionMode`/`showTime`/`timeOnly`/`hourFormat` como atributos,
> o PrimeVue os aceita por fallthrough. A `description_migration` exige suporte a **range**
> e **hora** e **locale pt-BR** — portanto a solução escolhida DEVE suportar esses modos
> (ver seção 4 e 5), mesmo que hoje o uso padrão seja data simples. Tratar range/time como
> capacidade a preservar/expor, não como default.

**Nenhuma outra dependência PrimeVue** existe no `<script>` deste componente. As dependências
PrimeVue de layout (`FloatLabel`, `IconField`, `InputIcon`, `Message`) vivem em
`InputBase.vue` e são migradas no plano próprio do `InputBase` (ver seção 10 — ordem).

---

## 3. Dependências internas

Devem ser preservadas exatamente:

- **`InputBase`** — `src/components/InputBase.vue`. Wrapper externo obrigatório.
  Recebe `v-bind="props"`, `class="input-base-date-picker"`, `:error`, `:caution`,
  `:done`, `:icon`. **Deve ser migrado ANTES do `MaxInputDatePicker`** (ver seção 10).
  O SCSS de `InputBase` já contempla `.p-datepicker` na regra de largura
  (`InputBase.vue` linha 379: `.p-inputtext, .p-datepicker, .p-autocomplete { width: 100% !important; }`).
- **`@maxvue/max-use`** (código-fonte em `../MaxUse`):
  - `useDateFormat(date, format)` — `../MaxUse/src/Composables/useDateFormat.ts`. Wrapper de
    `useDateFormat` do VueUse (Day.js por baixo) com fallback seguro (data inválida → data
    atual). Retorna `UseDateFormatReturn` reativo (`.value` é a string). Usado para gerar a
    string de saída `YYYY-MM-DD HH:mm:ss`. **Não** reimplementar; manter o import e o uso.
    Assinatura:
    ```ts
    useDateFormat(initialDate: Date | number | string | undefined | null, format: string): UseDateFormatReturn
    ```
- **`../types`** — `import { SelectGroupOptions } from '../types';`. Usado apenas na tipagem
  de `groupOptions?` na interface `Props`. Manter o import e o tipo.
- **Vue** — `ref`, `computed`, `watch`. Mantidos.

Stores Pinia: **nenhuma** usada diretamente. (O teste inicializa Pinia por causa do
`InputBase`/`MaxIcon`; manter compatível com Pinia global do `tests/setup.ts`.)

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Nada abaixo pode mudar de
forma observável.

### 4.1 v-model

- `defineModel<any>({ default: '' })` — `modelValue` + `update:modelValue`.
- **Entrada aceita:** string `YYYY-MM-DD`, string `YYYY-MM-DD HH:mm:ss`, string ISO com `T`,
  ou objeto `Date`. (Ver conversão em 4.5.)
- **Saída emitida:** SEMPRE string no formato **`YYYY-MM-DD HH:mm:ss`** (via `useDateFormat`),
  ou string vazia `''` quando não há data. Este contrato é validado por teste — não alterar.

### 4.2 Props (assinatura exata — `defineProps<Props>()` + `withDefaults`)

A interface `Props` (linhas 19-98) e os defaults (linhas 100-110) devem permanecer
**idênticos**. Props e defaults relevantes:

| Prop | Tipo | Default | Observação |
|------|------|---------|-----------|
| `value` | `any` | `''` | legado |
| `modelValue` | `any` | — | via `defineModel` |
| `class` | `string` | — | repassado ao `InputBase` |
| `icon` / `i` | `string \| undefined` | — | ícone; default do calendário `'solar:calendar-line-duotone'` aplicado no template |
| `disabled` | `boolean \| undefined` | — | desabilita o campo/calendário |
| `float` | `boolean \| undefined` | — | FloatLabel (InputBase) |
| `msg` / `message` | `string \| undefined` | — | mensagem (InputBase) |
| `iconMessage` | `string \| undefined` | — | |
| `label` | `string \| undefined` | — | |
| `done` | `string \| boolean \| null \| undefined` | `undefined` | controle manual de done |
| `error` | `string \| boolean \| null \| undefined` | `undefined` | |
| `caution` | `string \| boolean \| null \| undefined` | `undefined` | |
| `required` | `boolean \| undefined` | — | |
| `textCenter` | `boolean` | `false` | |
| `textRight` | `boolean \| undefined` | — | |
| `dark` | `boolean \| string \| number \| undefined` | `0.5` | |
| `light` | `boolean \| string \| number \| undefined` | `false` | |
| `default` | `... \| null \| undefined` | — | |
| `options` / `groupOptions` | `any[]` / `SelectGroupOptions` | — | herdados (não usados aqui) |
| `iconLeft` / `iconRight` | `string \| undefined` | — | |
| `loadOptions` / `optionValue` / `optionLabel` / `optionName` | — | — | herdados |
| `iconDark` / `iconLight` | — | — | |
| `iconPos` | `'left' \| 'right'` | `'left'` | |
| `inLine` | `boolean` | `false` | |
| `noDone` / `noCaution` / `noError` / `noStatus` / `noIcon` | `boolean` | — | flags de status |
| `dateFormat` | `string` | — | default `'dd/mm/yy'` aplicado no template |
| `placeholder` | `string` | — | default `''` aplicado no template |

Manter todos os JSDoc (comentários em português) já presentes.

### 4.3 Locale pt-BR (crítico)

O calendário deve exibir **português do Brasil** por padrão: nomes de dias/meses,
`firstDayOfWeek: 0` (domingo), textos `today: 'Hoje'` e `clear: 'Limpar'`, formato
`dd/mm/yy`. Hoje isso vem da config global do PrimeVue (`src/locales/pt-br.ts`, injetada em
`src/index.ts` linha 122: `locale: options.locale || ptBR`). A nova biblioteca **NÃO** lê
esse objeto do PrimeVue — o locale deverá ser configurado na própria biblioteca (ver seção 5
e 6). O plano deve **reaproveitar os mesmos textos** de `src/locales/pt-br.ts` para manter
paridade visual/idiomática.

### 4.4 Range e hora (capacidade a preservar)

- **Range:** suportar seleção de intervalo (data inicial → data final) quando ativado.
- **Hora (time):** suportar seleção de hora (`showTime`/`timeOnly`) — o formato de saída
  já inclui `HH:mm:ss`, então a hora precisa ser preservada no `Date` interno.
- **Formato:** entrada `dateFormat` (`dd/mm/yy` default) para exibição; saída sempre
  `YYYY-MM-DD HH:mm:ss`.

### 4.5 Comportamento observável (crítico — coberto por testes)

Reproduzir a lógica EXATA de `src/components/MaxInputDatePicker.vue` (linhas 112-163):

- **Estado interno:**
  - `const internalDate = ref<Date | null>(null);` — **deve permanecer com este nome**
    (o teste acessa `wrapper.vm.internalDate` e faz `.getTime()` e checa `null`).
  - `const hasBeenTouched = ref(false);`
- **`watch(modelValue, ..., { immediate: true })`** (modelValue → internalDate):
  - se valor falsy → `internalDate = null`;
  - senão, se for `Date` usa direto; se for string sem `T` e sem espaço (date-only
    `YYYY-MM-DD`), concatena `'T00:00:00'` para evitar interpretação UTC; caso contrário
    `new Date(val)`;
  - se `Date` válido e diferente do atual → atualiza; se inválido → `null`.
- **`watch(internalDate)`** (internalDate → modelValue):
  - se `null` → seta `modelValue = ''` (só se ainda não for `''`);
  - senão → `formatted = useDateFormat(newDate, 'YYYY-MM-DD HH:mm:ss').value`; emite se
    diferente do `modelValue` atual.
- **`validate()`** → `hasBeenTouched.value = true;` (chamado no `blur`).
- **`isDone` (computed):**
  - `noDone || noStatus` → `null`;
  - `props.done !== undefined` → retorna `props.done`;
  - senão → `internalDate.value !== null`.
- **`isCaution` (computed):**
  - `noCaution || noStatus` → `false`;
  - `props.caution !== undefined` → retorna `props.caution`;
  - se `!hasBeenTouched && !modelValue` → `false`;
  - senão → `props.required && !internalDate.value`.
- **`errorMessage` (computed):**
  - `noStatus` ou `noError` → `null`;
  - `typeof props.error === 'string'` → retorna `props.error`;
  - se `isCaution` e `caution` é string → retorna a string;
  - se `isCaution` → `'Data é obrigatória'`;
  - senão → `null`.
- **Passagem ao `InputBase`:** `:done="isDone"`, `:error="errorMessage"`,
  `:caution="isCaution"`, `:icon="props.icon ?? 'solar:calendar-line-duotone'"`,
  `class="input-base-date-picker"`, `v-bind="props"`.

> **Importante:** manter os mesmos nomes públicos internos (`internalDate`,
> `hasBeenTouched`, `isDone`, `isCaution`, `errorMessage`, `validate`) — os testes acessam
> `wrapper.vm.internalDate` diretamente e inspecionam `InputBase.props('done'/'error'/'caution')`.
> O contrato com `InputBase` (nomes e valores de `:done`/`:error`/`:caution`) deve ficar idêntico.

### 4.6 Ponto de acoplamento dos testes (ATENÇÃO)

O arquivo `tests/components/MaxInputDatePicker.test.ts` usa:
```ts
const dp = wrapper.findComponent({ name: 'DatePicker' });
await dp.vm.$emit('update:modelValue', new Date('2024-03-03T10:00:00'));
await dp.vm.$emit('blur');
```
Ou seja, os testes localizam o filho pelo **nome de componente `'DatePicker'`** e disparam
`update:modelValue`/`blur` manualmente. Ao trocar a biblioteca, o componente-filho terá
outro nome, quebrando `findComponent({ name: 'DatePicker' })`. Duas opções (ver seção 8):
  1. **Preferida:** ajustar os testes para localizar o novo filho (por `name` do novo
     componente ou por um seletor/data-testid) — os testes fazem parte da suíte da lib e
     podem ser atualizados na mesma migração, desde que a semântica dos casos seja mantida.
  2. **Alternativa de risco:** envolver a biblioteca num sub-componente/wrapper interno
     nomeado `DatePicker` (via `defineOptions({ name: 'DatePicker' })`) que reemita
     `update:modelValue`/`blur` — mantém os testes intactos, mas adiciona indireção.
  Decidir na execução; documentar a escolha. A **semântica** dos casos (conversão de string,
  emit em `YYYY-MM-DD HH:mm:ss`, `done`/`caution`/`error`) **não pode** mudar.

---

## 5. Estratégia de substituição — PRIORIZAR biblioteca de calendário headless/pronta

Nível `muito_alta`: reimplementar um calendário completo (navegação mês/ano, range, hora,
locale, acessibilidade, teclado) do zero é caro e propenso a regressões. **NÃO reimplementar
do zero.** Adotar uma biblioteca sem dependência do PrimeVue.

### 5.1 Candidatas avaliadas

| Candidata | Prós | Contras |
|-----------|------|---------|
| **`@vuepic/vue-datepicker`** | Componente Vue 3 completo e maduro: range, time picker, month/year, i18n/locale, teclado e a11y prontos; API declarativa próxima do `DatePicker` do PrimeVue; estilização via CSS vars e slots; TS types inclusos. Cobre range + hora + pt-BR sem reimplementar. | Traz CSS próprio (precisa override para o tema Max); é "batteries-included" (menos headless, mas menos trabalho). |
| **`v-calendar` (@)** | Rico, range, muitos recursos. | Pesado; forte opinião visual; harmonizar com o tema Max dá trabalho; foco maior em datas do que em input+time. |
| **Headless + Day.js from-scratch** (ex.: `@internationalized/date` / composable próprio) | Máximo controle visual; usa o Day.js que já vem via `useDateFormat`. | **É reimplementar do zero** o grid/navegação/teclado/a11y — contradiz a orientação para `muito_alta`. Só considerar se as demais forem inviáveis. |

### 5.2 Escolha recomendada e justificativa

**Escolher `@vuepic/vue-datepicker`.** Justificativa:

- Atende diretamente os requisitos da `description_migration`: **range**, **hora (time)** e
  **locale pt-BR** já são recursos nativos da biblioteca — não há reimplementação.
- Substituição de menor risco: sua API (`v-model` com `Date`/array de `Date` para range,
  props `range`, `time-picker`/`enable-time-picker`, `format`, `locale`, `disabled`,
  `placeholder`) mapeia quase 1:1 no `v-model="internalDate"` + fallthrough atual.
- Boa base de TypeScript, teclado e acessibilidade — cobre o que o PrimeVue entregava.
- Estilizável para o tema Max via CSS variables/`:root` overrides e slots, permitindo
  reproduzir o ajuste `translateX(-10px)` do painel e as cores do tema.

> Manter a decisão flexível: se, na execução, houver restrição de licença/bundle, cair para
> `v-calendar`. **Nunca** cair para reimplementação do zero sem registrar justificativa,
> dado o nível `muito_alta`.

### 5.3 Princípios da substituição

- Manter `InputBase` como wrapper externo (não tocar sua lógica de estados/ícones/label).
- Manter TODA a camada de conversão string↔`Date` e os computeds (`isDone`/`isCaution`/
  `errorMessage`) **inalterados** — a biblioteca só substitui o widget visual ligado a
  `internalDate`.
- Configurar o **locale pt-BR** na própria biblioteca, reaproveitando os textos de
  `src/locales/pt-br.ts`.
- Preservar o formato de exibição (`dateFormat` → formato da lib) e o formato de saída
  `YYYY-MM-DD HH:mm:ss` (via `useDateFormat`, intocado).
- Expor range/time por fallthrough de props (ou props explícitas equivalentes) para manter
  as capacidades exigidas.

---

## 6. Passos de implementação (ordenados)

Pré-requisito: **`InputBase` já migrado** (ou ainda funcional com PrimeVue). Ver seção 10.

1. **Instalar a dependência** (fora do código-fonte do componente):
   ```bash
   npm install @vuepic/vue-datepicker
   ```
   Registrar a biblioteca como dependência da lib (`package.json`), não como peer do
   PrimeVue. Confirmar que **nenhum** import de `primevue/datepicker` permanece.

2. **Template** — em `src/components/MaxInputDatePicker.vue`, substituir o `<DatePicker>` do
   PrimeVue pelo componente da nova lib, mantendo o `InputBase` inalterado:
   ```html
   <template>
       <InputBase v-bind="props" class="input-base-date-picker" :error="errorMessage" :caution="isCaution" :done="isDone" :icon="props.icon ?? 'solar:calendar-line-duotone'">
           <VueDatePicker
               v-model="internalDate"
               :format="displayFormat"
               :locale="'pt-BR'"
               :day-names="ptCalendar.dayNamesMin"
               :placeholder="props.placeholder ?? ''"
               :disabled="props.disabled"
               :enable-time-picker="false"
               auto-apply
               @blur="validate"
           />
       </InputBase>
   </template>
   ```
   - `v-model="internalDate"` continua ligado ao **mesmo** `Date | null` (a lib aceita `Date`).
   - Para **range**/**time**, expor via props/fallthrough conforme o consumidor (ex.:
     `:range` e `:enable-time-picker`); quando range estiver ativo, `internalDate` passa a
     ser `Date[]` — nesse caso a conversão de saída deve tratar array (ver passo 4/seção 10).
   - `@blur="validate"` mantém `hasBeenTouched`. Se a lib não emitir `blur` nativo, usar o
     evento de fechamento do painel (`@closed`) ou `@blur` do input interno para chamar
     `validate()` (documentar).
   - Reproduzir o ajuste de posição do painel via CSS (seção 7), não via prop.

3. **Script** — ajustes mínimos:
   - Remover `import DatePicker from 'primevue/datepicker';`.
   - Adicionar `import VueDatePicker from '@vuepic/vue-datepicker';` e
     `import '@vuepic/vue-datepicker/dist/main.css';` (ou importar o CSS globalmente via
     `install()` — decidir para não duplicar; ver seção 7).
   - Importar os textos pt-BR: `import ptCalendar from '../locales/pt-br';` (reaproveitar
     `dayNamesMin`, `monthNames`, etc.). Confirmar o caminho/named export real de
     `src/locales/pt-br.ts` na execução.
   - Criar `const displayFormat = computed(() => convert(props.dateFormat ?? 'dd/mm/yy'));`
     — converter o token do PrimeVue (`dd/mm/yy`) para o token esperado pela lib
     (`@vuepic` aceita string de formato do date-fns, ex. `dd/MM/yy`, ou função). Mapear:
     `dd`→dia, `mm`→mês, `yy`/`yyyy`→ano. Manter default equivalente a `dd/mm/yy`.
   - **Manter intactos:** `internalDate`, `hasBeenTouched`, os dois `watch`, `validate`,
     `isDone`, `isCaution`, `errorMessage`, `useDateFormat`, a interface `Props` e
     `withDefaults`. Toda a lógica de conversão/estados permanece byte-a-byte (salvo o
     ajuste de range em 4/seção 10, se ativado).
   - Se optar por manter os testes intactos (seção 4.6 opção 2): adicionar
     `defineOptions({ name: 'DatePicker' })` no wrapper interno equivalente, ou preferir
     atualizar os testes (opção 1).

4. **Tratamento de range na conversão de saída (só se range for exposto):** o
   `watch(internalDate)` atual assume `Date` único. Para range (`Date[]`), estender a
   formatação para gerar a string apropriada (ex.: dois valores `YYYY-MM-DD HH:mm:ss`
   separados, ou o formato que o consumo espera). **Definir o contrato de saída de range na
   execução e cobrir com teste.** Para uso simples (data única, comportamento atual), nada
   muda.

5. **Estilos** — ver seção 7. Portar o override `.p-datepicker-panel { transform: translateX(-10px); }`
   para o seletor da nova lib e harmonizar o tema.

6. **Convenções** — garantir `<script setup lang="ts">`, indentação de 4 espaços, aspas
   simples, ponto e vírgula, sem vírgula final, ordem Template → Script → Style.

7. **Manifesto/resolver** — nenhum novo `.vue` foi criado (apenas edição do existente).
   **Não** é necessário rodar `generateResolver.ts` (só rodar se um novo `.vue` surgir).

8. **Type-check e lint:**
   ```bash
   npm run type-check
   npm run lint
   ```

9. **Testes** (ver seção 8):
   ```bash
   npx vitest run tests/components/MaxInputDatePicker.test.ts
   ```

---

## 7. Estilos

- **Bloco `<style lang="scss">` a portar** (hoje, linhas 166-170):
  ```scss
  .p-datepicker-panel {
      transform: translateX(-10px);
  }
  ```
  Reescrever para o seletor do painel da nova biblioteca (ex.: `.dp__menu` / `.dp__outer_menu_wrap`
  no `@vuepic/vue-datepicker`), preservando o deslocamento `translateX(-10px)`.
- **Largura do input:** `InputBase.vue` (linha 379) tem
  `.p-inputtext, .p-datepicker, .p-autocomplete { width: 100% !important; }`. O input da nova
  lib **não** terá a classe `.p-inputtext`/`.p-datepicker`. Opções:
  - adicionar `.dp__input` (classe do input do `@vuepic`) à regra de largura do `InputBase`
    — **porém isso é edição do `InputBase` e deve ser coordenado com a migração dele**; ou
  - aplicar `width: 100%` ao input via `<style>` local do componente. Preferir o `<style>`
    local para não acoplar ao plano do `InputBase` enquanto ele não for migrado.
- **Estados de cor (caution/error):** `InputBase.vue` (linhas 212-258) colore borda de
  `input`/`.p-select` conforme `.caution`/`.error`. O seletor genérico `input` cobrirá o
  input da nova lib (que é um `<input>` real). Validar visualmente; se necessário, adicionar
  no `<style>` local do componente regra equivalente para o input da nova lib.
- **Tema Max:** harmonizar cores do calendário com o tema via CSS variables da própria lib
  (ex.: `--dp-*` no `@vuepic`), mapeando para as variáveis do tema Max
  (`var(--background-*)`, `var(--max-primary-*)`, etc.). Reproduzir aparência
  (cor de dia selecionado, hover, hoje) o mais fiel possível ao PrimeVue anterior.
- **CSS da lib:** importar `@vuepic/vue-datepicker/dist/main.css` **uma única vez**. Como o
  build injeta CSS só no `index.es.js` (ver CLAUDE.md), considerar importar o CSS no
  `install()`/entrada global em vez de no SFC, para evitar duplicação entre componentes.
  Decidir na execução; garantir que o estilo chega ao consumidor.
- **UnoCSS:** nenhuma classe utilitária UnoCSS é usada neste componente. Nada a fazer.

---

## 8. Testes / verificação

### 8.1 Suíte existente — `tests/components/MaxInputDatePicker.test.ts`

Casos a manter (semântica), alguns exigem **ajuste de seletor** por causa de 4.6:

1. `renderiza corretamente` — mount básico.
2. `converte string YYYY-MM-DD para Date internamente` — `modelValue: '2024-06-15'` →
   `InputBase.props('done') === true`.
3. `converte string YYYY-MM-DD HH:mm:ss para Date` — idem com hora.
4. `done=false quando data é nula` — `modelValue: ''` → `done === false`.
5. `emite update:modelValue no formato YYYY-MM-DD HH:mm:ss` — regex `^\d{4}-\d{2}-\d{2}`.
6. `aceita prop done` — mount.
7. `define internalDate como null ao passar data inválida` — `'invalid-date'` → `done false`.
8. `sincroniza internalDate ↔ modelValue` — **usa `findComponent({ name: 'DatePicker' })`**
   e `dp.vm.$emit('update:modelValue', new Date(...))` esperando emit
   `['2024-03-03 10:00:00']`, e `$emit('update:modelValue', null)` → `['']`. **Precisa de
   ajuste de seletor** (ver 4.6) ou wrapper nomeado `DatePicker`. Manter as asserções de
   valor emitido.
9. `chama validate on blur` — **usa `findComponent({ name: 'DatePicker' })`** +
   `$emit('blur')`, esperando `InputBase.props('caution') === true` com `required` e vazio.
   Ajustar seletor / disparo do blur.
10. `aceita attrs.error/caution` — `error: 'Erro custom'`, `caution: true`.
11. `mensagem padrão 'Data é obrigatória'` quando `isCaution` — via blur + required vazio.
12. `aceita modelValue como Date` — `wrapper.vm.internalDate.getTime()` bate.
13. `limpa modelValue quando empty string` — `wrapper.vm.internalDate` vira `null`.
14. `cover isDone com done === false`.
15. `cover formatted === modelValue` — set direto de `wrapper.vm.internalDate`.

> Ao ajustar (casos 8 e 9), substituir `findComponent({ name: 'DatePicker' })` pelo seletor
> do novo filho (novo `name`, ou `data-testid`), **mantendo as asserções de valor/estado**.
> Se optar pelo wrapper interno nomeado `DatePicker` (4.6/opção 2), os testes podem ficar
> intactos. Documentar a decisão no PR.

Comando:
```bash
npx vitest run tests/components/MaxInputDatePicker.test.ts
```

### 8.2 Novos testes recomendados

- **Range** (se exposto): selecionar intervalo → saída com os dois limites no formato
  contratado (seção 6, passo 4).
- **Hora/time** (se exposto): selecionar hora → `HH:mm:ss` preservado na saída.
- **Locale pt-BR:** abrir o painel e verificar textos em português (mês/dia/hoje/limpar) e
  `firstDayOfWeek` = domingo.

### 8.3 Verificação manual (playground)

```bash
npm run dev:playground
```
- Selecionar data pelo calendário → campo formata em `dd/mm/yy` e `v-model` recebe
  `YYYY-MM-DD HH:mm:ss`.
- Sincronização externa: alterar `v-model` do pai reflete no calendário.
- `disabled` desabilita o campo e o painel.
- Painel abre deslocado (`translateX(-10px)`) e com aparência do tema Max.
- Estados: `required` vazio + blur → borda/mensagem 'Data é obrigatória'.

### 8.4 Checklist final

- [ ] Import de `primevue/datepicker` removido.
- [ ] Novo componente de calendário integrado a `internalDate` (`v-model`).
- [ ] Locale pt-BR configurado (textos de `src/locales/pt-br.ts`).
- [ ] Formato de saída `YYYY-MM-DD HH:mm:ss` preservado (`useDateFormat` intocado).
- [ ] `internalDate`, `hasBeenTouched`, watches, `validate`, `isDone`, `isCaution`,
      `errorMessage` intactos (salvo extensão de range, se ativada).
- [ ] Override do painel (`translateX(-10px)`) portado; largura 100% do input garantida.
- [ ] Testes ajustados (seletor do filho) e verdes; asserções de valor mantidas.
- [ ] `npm run type-check` sem erros.
- [ ] `npm run lint` sem erros.
- [ ] Export `MaxInputDatePicker` em `src/index.ts` intacto.
- [ ] CSS da lib importado uma única vez (sem duplicação no build).

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills/` relevantes **especificamente** a este componente
(caminho + justificativa):

- `.claude/skills/vue-dayjs-date-manipulation-best-practices/SKILL.md` — parsing/formatação/
  comparação de datas com Day.js. Núcleo da conversão string↔`Date` e do
  `useDateFormat('YYYY-MM-DD HH:mm:ss')`, incluindo o cuidado com date-only + `'T00:00:00'`
  (evitar UTC) e timezone. **Essencial.**
- `.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md` — convenções da
  lib (`InputBase` como wrapper, exports/aliases em `src/index.ts`, resolver/manifesto,
  testes com Vitest + `@vue/test-utils`). **Essencial.**
- `.claude/skills/vue-max-use-development-best-practices/SKILL.md` — uso correto de
  `useDateFormat` de `@maxvue/max-use` (que deve ser preservado, não reimplementado).
- `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices/SKILL.md` — posicionamento
  e ciclo de vida de elementos flutuantes; útil para reproduzir o painel do calendário
  (deslocamento/posicionamento) caso seja necessário controle fino do floating.
- `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices/SKILL.md` — navegação por
  teclado/foco no calendário (setas, Enter, Esc); garantir a11y equivalente à do PrimeVue.
- `.claude/skills/vue-i18n-localization-best-practices/SKILL.md` — configurar o locale pt-BR
  do calendário (nomes de dias/meses, `firstDayOfWeek`, formatos), reaproveitando
  `src/locales/pt-br.ts`.
- `.claude/skills/vue-typescript-best-practices/SKILL.md` — tipagem em
  `<script setup lang="ts">`, `defineProps`/`withDefaults`/`defineModel` preservando a
  assinatura pública e tipando `Date | Date[] | null`.
- `.claude/skills/vue-unocss-styling-best-practices/SKILL.md` — variáveis CSS do tema Max e
  harmonização visual do calendário (cores, hover, dia selecionado).
- `.claude/skills/vue-eslint-stylelint-quality-standards/SKILL.md` — 4 espaços, aspas simples,
  ponto e vírgula, ordem dos blocos — exigidos ao editar o `.vue`.
- `.claude/skills/vue-vitest-testing-best-practices/SKILL.md` — ajustar/rodar
  `tests/components/MaxInputDatePicker.test.ts`, `findComponent`, disparo de eventos e
  asserções sobre `InputBase.props(...)`.

Skills deliberadamente **descartadas** (não pertinentes): uppy, pdf-viewer, virtual-scroller,
chartjs, tiptap, pinia-state-management (nenhuma store usada aqui),
inputs-masks-validation (Maska/telefone/CPF — não se aplica a data), fullcalendar
(é agenda/eventos, não date-picker de input).

---

## 10. Riscos e pontos de atenção

- **Ordem: `InputBase` PRIMEIRO (CRÍTICO).** `MaxInputDatePicker` usa `InputBase` como
  wrapper e depende do SCSS dele (largura via `.p-datepicker`/`.p-inputtext`, estados de
  cor, label). Conforme a estratégia geral de migração, **`InputBase` deve ser migrado antes**
  (muitos inputs dependem dele). Enquanto o `InputBase` ainda usar PrimeVue
  (`FloatLabel`/`IconField`/`InputIcon`/`Message`), a aparência do `MaxInputDatePicker`
  depende dele. Ordem recomendada: **`InputBase` → `MaxInputDatePicker`**.
- **Nível `muito_alta` — não reimplementar do zero.** O calendário (navegação, range, hora,
  teclado, a11y, locale) é complexo. **Priorizar a biblioteca** (`@vuepic/vue-datepicker`).
  Só considerar solução from-scratch com justificativa explícita registrada.
- **Acoplamento dos testes ao nome `DatePicker` (seção 4.6).** `findComponent({ name: 'DatePicker' })`
  quebra ao trocar a lib. Escolher: (1) atualizar os testes para o novo seletor mantendo as
  asserções, ou (2) wrapper interno nomeado `DatePicker` reemitindo `update:modelValue`/`blur`.
  A semântica dos casos não pode mudar (formato de saída, estados).
- **Locale pt-BR não é herdado do PrimeVue.** A config global (`locale: ptBR` em
  `src/index.ts`) **não** alcança a nova lib. Configurar o locale explicitamente na
  biblioteca, reaproveitando os textos de `src/locales/pt-br.ts` (`dayNames*`, `monthNames*`,
  `firstDayOfWeek: 0`, `today`, `clear`).
- **Range muda o tipo de `internalDate`** (`Date` → `Date[]`). O `watch(internalDate)` atual
  formata um `Date` único. Se range for exposto, estender a formatação e definir/testar o
  contrato de saída. Para uso simples (data única), nada muda.
- **Formato de saída `YYYY-MM-DD HH:mm:ss` é contrato testado.** Manter `useDateFormat`
  intocado; não trocar por formatação da nova lib para a **saída** do `v-model`.
- **Date-only e UTC.** Preservar a lógica `val + 'T00:00:00'` para strings `YYYY-MM-DD`
  (evita a data "voltar" um dia por interpretação UTC). Validar com timezone diferente de
  UTC.
- **`ref="element"` órfão.** O template atual declara `ref="element"` no `DatePicker`, mas o
  `<script>` **não** possui `const element = ref(...)`. Ao migrar, remover o ref órfão ou
  religá-lo ao novo componente; garantir que nenhum código externo dependa dele (não parece
  depender).
- **CSS da lib e build multi-entry.** O build injeta CSS só no `index.es.js` (ver CLAUDE.md).
  Importar o CSS da lib de forma que chegue ao consumidor sem duplicar entre componentes
  (preferir importação única no `install()`/entrada global).
- **Largura/altura do input.** O input da nova lib não tem `.p-inputtext`. Garantir
  `width: 100%` e altura ~36px equivalentes (via `<style>` local ou, coordenado com o
  `InputBase`, estendendo as regras existentes). Não acoplar edição do `InputBase` a este
  plano isoladamente.
- **Escopo restrito.** Este plano cobre SOMENTE `MaxInputDatePicker` (e ajustes de seus
  testes/estilos locais). Não editar `InputBase.vue`, `src/locales/pt-br.ts`, `src/index.ts`
  (além de conferir o export) nem outros componentes.
- **Sem novo `.vue`.** Não regenerar o manifesto/resolver, a menos que um novo `.vue` seja
  criado.
