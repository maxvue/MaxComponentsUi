# Plano de Migração — MaxInputText

> Plano autossuficiente. Uma IA futura deve conseguir executá-lo lendo apenas este
> arquivo e o código-fonte referenciado. **Não** alterar código durante a leitura do plano.
> Objetivo: remover a dependência do PrimeVue no `MaxInputText`, preservando API pública,
> estilos e comportamento.

---

## 1. Componente

- **Nome:** `MaxInputText`
- **Caminho:** `src/components/MaxInputText.vue`
- **Nível de dificuldade:** `baixa`
- **Aliases exportados** (`src/index.ts`): `MaxInputText`, `InputText`, `InputField` (verificar e
  preservar todos os aliases existentes ao final; não remover nenhum).
- **Resumo da migração:** trocar o `InputText` do PrimeVue por um `<input type="text">` nativo
  estilizado. Manter `InputBase` como wrapper. Preservar `v-model`, a formatação/validação com
  `toSearchableString` / `hasContent` e os estados `isDone` / `error_msg` / `caution`.

---

## 2. Dependências do PrimeVue

Única dependência direta do PrimeVue neste componente:

```ts
import InputText from 'primevue/inputtext';
```

Uso no template (`src/components/MaxInputText.vue`, linha 3):

```html
<InputText v-bind="props" :type="props.type" :placeholder="props.placeholder" v-model="temp_value" fluid @blur="isDone = testIsDone()" />
```

Observações sobre o que o `InputText` do PrimeVue faz e que precisa ser reproduzido:

- Renderiza um `<input>` HTML com a classe `p-inputtext` (e `p-component`). O SCSS do projeto
  depende dessa classe: `InputBase.vue` tem regras para `.p-inputtext` (altura 36px, estados
  `[disabled]`, largura 100%). Portanto o `<input>` nativo **deve** manter a classe `p-inputtext`
  para herdar o estilo existente sem reescrever tudo (ver seção 7).
- `fluid` faz o input ocupar 100% da largura. Equivale a `width: 100%` — já coberto pelas regras
  `.p-inputtext { width: 100% !important; }` em `InputBase.vue` (linha 379).
- `v-model` no `InputText` do PrimeVue usa `modelValue`/`update:modelValue` internamente ligados
  ao evento `input` do `<input>` nativo. No nativo, ligamos `temp_value` via `:value` + `@input`.
- `v-bind="props"` repassa props extras (ex.: `disabled`, `placeholder`) e atributos ao input.
  O `<input>` nativo aceita `disabled` e `placeholder` diretamente; atributos não-nativos caem
  como atributos HTML (comportamento aceitável, era assim antes via fallthrough).

**Nenhuma outra dependência PrimeVue** existe neste componente. As dependências PrimeVue de layout
(`FloatLabel`, `IconField`, `InputIcon`, `Message`) estão em `InputBase.vue` e são migradas no
plano do `InputBase` (ver seção 10 — ordem/riscos).

---

## 3. Dependências internas

Devem ser preservadas exatamente:

- **`InputBase`** — `src/components/InputBase.vue`. Wrapper externo obrigatório. Recebe
  `v-bind="props"` e as props derivadas `:done`, `:error`, `:caution`. **Este componente deve ser
  migrado ANTES do `MaxInputText`** (ver seção 10).
- **`@maxvue/max-use`** (código-fonte em `../MaxUse`):
  - `toSearchableString` — `MaxUse/src/Helpers/Strings/converters.ts`. Normaliza string (sem
    acentos, sem caracteres especiais, minúsculas) para comparação. Usado em `isEqual`.
  - `hasContent` — `MaxUse/src/Helpers/Types/hasContent.ts`. Type-guard "tem conteúdo?". Usado em
    `isEqual` e `isRequiredDone`.
  - Estas funções **não** dependem do PrimeVue; **não** reimplementar, manter os imports.
- **Vue** — `ref`, `computed`, `watch`, `useAttrs`, tipo `Ref`. Mantidos.

Nenhuma store Pinia é usada diretamente por `MaxInputText`.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Nada abaixo pode mudar.

### 4.1 Props (assinatura exata — `defineProps` + `withDefaults`)

| Prop | Tipo | Default |
|------|------|---------|
| `type` | `string` | `'text'` |
| `modelValue` | `any` | `''` |
| `icon` | `string \| undefined` | — |
| `i` | `string \| undefined` | — |
| `disabled` | `boolean \| undefined` | `false` |
| `float` | `boolean \| undefined` | — |
| `msg` | `string \| undefined` | — |
| `message` | `string \| undefined` | — |
| `iconMessage` | `string \| undefined` | — |
| `label` | `string \| undefined` | — |
| `done` | `boolean \| undefined` | `undefined` |
| `error` | `string \| boolean \| undefined` | `undefined` |
| `targetValue` | `string` | — |
| `caution` | `string \| boolean \| undefined` | `undefined` |
| `required` | `boolean` | `false` |
| `placeholder` | `string \| undefined` | — |

Manter os JSDoc de cada prop (comentários em português já presentes no arquivo).

### 4.2 Emits

- `update:modelValue` — emitido em todo `watch(temp_value)`. Habilita `v-model`.

### 4.3 v-model

- `v-model="valor"` no componente deve continuar funcionando (`modelValue` +
  `update:modelValue`).

### 4.4 Slots

- Slot default (`<slot></slot>`) repassado para dentro do `InputBase`, após o input. Preservar.

### 4.5 Comportamento observável (crítico — coberto por testes)

Reproduzir a lógica EXATA de `src/components/MaxInputText.vue` (linhas 58-92):

- `temp_value = ref(props.modelValue)` — espelho interno do valor.
- `isDone = ref(props.done ?? null)`.
- `isEqual` = compara `toSearchableString(props.targetValue) === toSearchableString(temp_value)`
  quando `targetValue` é string com conteúdo; senão `null`.
- `isRequiredDone` = `required ? hasContent(temp_value) : null`.
- `testIsDone()`:
  1. se `props.done !== undefined` → retorna `props.done`;
  2. senão se `isEqual !== null` → retorna `isEqual`;
  3. senão se `isRequiredDone !== null` → retorna `isRequiredDone`;
  4. senão se `props.caution !== undefined` → retorna `!props.caution`;
  5. senão `null`.
- `caution` (computed) = `props.caution !== undefined ? props.caution && isDone === false : isDone === false`.
- `error_msg` (computed):
  - se `!caution` → `null`;
  - lê `attrs.errMsg ?? attrs.error_message ?? attrs.error_msg` como mensagem custom;
  - se `isEqual === false` → `'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value'])` (ou a msg custom);
  - se `isRequiredDone === false` → `'Campo obrigatório'` (ou msg custom);
  - senão → `'Valor inválido'` (ou msg custom).
- `watch(temp_value)` → recomputa `isDone = testIsDone()` e emite `update:modelValue`.
- `watch(() => props.modelValue)` → `temp_value = props.modelValue` (sincronização externa).
- `@blur` no input → `isDone = testIsDone()`.
- Passagem ao `InputBase`: `:done="props.done ?? isDone"`, `:error="props.error ?? error_msg"`,
  `:caution="caution"` e `v-bind="props"`.

> **Importante:** manter os mesmos nomes de variáveis (`temp_value`, `isDone`, `error_msg`,
> `caution`, `testIsDone`, `isEqual`, `isRequiredDone`) — os testes usam `findComponent(InputBase)`
> e inspecionam `props('done')` / `props('error')`, então o contrato com `InputBase` deve ficar
> idêntico.

---

## 5. Estratégia de substituição

Substituição **100% por HTML nativo + CSS** (nível `baixa`). Nenhuma biblioteca headless é
necessária.

- Trocar `<InputText .../>` por `<input .../>` nativo do tipo definido por `props.type`.
- Remover o import `import InputText from 'primevue/inputtext';`.
- Manter `InputBase` como wrapper (não tocar na lógica de estados/ícones/label — isso vive em
  `InputBase`, migrado no plano próprio).
- Mapear o `v-model` do PrimeVue para `:value` + `@input` no `<input>` nativo.
- Preservar a classe `p-inputtext` no `<input>` para reaproveitar o SCSS existente do
  `InputBase.vue` (altura, disabled, largura). Alternativamente, migrar as regras `.p-inputtext`
  para uma classe própria (ex.: `max-inputtext`) — **porém isso só deve ser feito de forma
  coordenada com a migração do `InputBase`**; enquanto o `InputBase` ainda referenciar
  `.p-inputtext`, manter a classe garante fidelidade visual. **Recomendação:** manter
  `class="p-inputtext p-component"` neste passo para risco mínimo.

---

## 6. Passos de implementação (ordenados)

Pré-requisito: `InputBase` já migrado (ou ainda funcional com PrimeVue). Ver seção 10.

1. **Template** — no `<template>`, substituir a linha do `InputText` por um `<input>` nativo:

   ```html
   <input
       class="p-inputtext p-component"
       :type="props.type"
       :placeholder="props.placeholder"
       :disabled="props.disabled"
       :value="temp_value"
       @input="temp_value = ($event.target as HTMLInputElement).value"
       @blur="isDone = testIsDone()"
   />
   ```

   - Manter `<InputBase v-bind="props" :done="props.done ?? isDone" :error="props.error ?? error_msg" :caution="caution">` inalterado como wrapper.
   - Manter o `<slot></slot>` logo após o input.
   - Não usar `v-model` direto no `<input>` porque a lógica de watch/emit já cuida de
     `update:modelValue`; usar `:value` + `@input` sobre `temp_value` mantém o fluxo idêntico ao
     atual (o `watch(temp_value)` continua emitindo).

2. **Script** — remover a linha `import InputText from 'primevue/inputtext';` (linha 17). **Não**
   alterar mais nada em `<script setup>`: toda a lógica (`temp_value`, `isDone`, `isEqual`,
   `isRequiredDone`, `testIsDone`, `caution`, `error_msg`, os dois `watch`, `emit`, `useAttrs`)
   permanece byte-a-byte igual.

3. **Style** — o componente não tem bloco `<style>` próprio hoje. Não adicionar estilo local, pois
   toda a aparência vem do `InputBase.vue` via seletores `.p-inputtext` / `input`. Manter assim.

4. **Convenções** — garantir `<script setup lang="ts">`, indentação de 4 espaços, aspas simples,
   ponto e vírgula, sem vírgula final, ordem Template → Script → Style (o arquivo já segue isso).

5. **Manifesto/resolver** — nenhum novo componente foi adicionado; **não** é necessário rodar
   `generateResolver.ts`. (Só rodar se um novo `.vue` for criado.)

6. **Type-check e lint:**

   ```bash
   npm run type-check
   npm run lint
   ```

7. **Testes** (ver seção 8):

   ```bash
   npx vitest run tests/components/MaxInputText.test.ts
   ```

---

## 7. Estilos

Não há `<style>` em `MaxInputText.vue`. A fidelidade visual depende inteiramente de:

- **`InputBase.vue` (`<style lang="scss">`)** — regras que atuam sobre o input, a preservar:
  - `.p-inputtext { height: 36px; }` e estados `[disabled]` (linhas 416-437).
  - `.max-input-main-div ... input` — `::placeholder { color: var(--background-625); }` (linha 331-335).
  - `.p-inputtext, .p-datepicker, .p-autocomplete { width: 100% !important; }` (linha 379) —
    substitui o `fluid`.
  - Estados de cor de borda por classe do wrapper: `&.caution input { border-color: var(--orange-600); }`,
    `&.error input { border-color: var(--max-red-600); }` (linhas 212-258).
  - `&.text-center input`, `&.text-right input`, variações `[slim]`, `[full]`, `&.in-line` — todas
    baseadas no seletor `input` genérico ou `.p-inputtext`.
- **Manter a classe `p-inputtext p-component`** no `<input>` nativo garante que TODAS essas regras
  continuem aplicando sem edição de SCSS.

Variáveis CSS do tema Max envolvidas (não precisam ser tocadas, apenas herdadas):
`var(--background-625)`, `var(--background-75)`, `var(--background-400)`, `var(--background-575)`,
`var(--orange-600)`, `var(--max-red-600)`.

UnoCSS: nenhuma classe utilitária UnoCSS é usada neste componente. Nada a fazer.

> Nota futura (coordenar com plano do `InputBase`): quando o `InputBase` deixar de depender do
> PrimeVue, considerar renomear `.p-inputtext` → classe própria (ex.: `.max-inputtext`) tanto no
> `<input>` daqui quanto no SCSS do `InputBase`, para eliminar o namespace `p-`. Fazer isso apenas
> junto da migração do `InputBase`, nunca isoladamente aqui.

---

## 8. Testes / verificação

### 8.1 Suíte existente

Arquivo: `tests/components/MaxInputText.test.ts`. Todos os casos abaixo DEVEM continuar passando
sem alteração no arquivo de teste:

1. `renderiza corretamente` — mount com `label`.
2. `emite update:modelValue ao alterar o valor` — `input.setValue('Teste')` → último emit `['Teste']`.
   (`setValue` do test-utils dispara `input`; garantir que `@input` atualiza `temp_value`.)
3. `atualiza valor interno quando modelValue muda externamente` — `setProps({ modelValue })` reflete
   em `input.element.value` (depende do `:value="temp_value"` + `watch(props.modelValue)`).
4. `valida done=true ao blur quando required e preenchido` — inspeciona `InputBase.props('done')`.
5. `valida erro de campo obrigatório ao blur quando vazio` — `InputBase.props('error') === 'Campo obrigatório'`.
6. `valida erro por targetValue diferente` — attr `error_msg` custom → `'Erro customizado'`.
7. `valida erro genérico (Valor inválido) quando done=false` — `InputBase.props('error') === 'Valor inválido'`.

Comando:

```bash
npx vitest run tests/components/MaxInputText.test.ts
```

### 8.2 Casos de borda a validar manualmente

- Digitação normal emite `update:modelValue` a cada tecla (watch em `temp_value`).
- `disabled` desabilita o `<input>` nativo e aplica os estilos `[disabled]`.
- `placeholder` aparece com a cor `var(--background-625)`.
- `type` diferente (ex.: `type="email"`) é repassado ao `<input>`.
- Sincronização externa: alterar o `v-model` do pai atualiza o campo.
- Blur com `required` vazio → borda vermelha + mensagem 'Campo obrigatório'.
- `targetValue` com acentos/caixa diferente valida via `toSearchableString` (ex.: `'São Paulo'`
  vs `'sao paulo'` devem ser iguais).

### 8.3 Checklist final

- [ ] Import de `primevue/inputtext` removido.
- [ ] `<input>` nativo com classe `p-inputtext p-component`.
- [ ] `:value` + `@input` ligados a `temp_value`; `@blur` chama `testIsDone()`.
- [ ] Nenhuma prop/emit/slot removido; assinatura de `defineProps` intacta.
- [ ] `npm run type-check` sem erros.
- [ ] `npm run lint` sem erros.
- [ ] `npx vitest run tests/components/MaxInputText.test.ts` verde.
- [ ] Aliases `MaxInputText` / `InputText` / `InputField` em `src/index.ts` intactos.

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills/` relevantes especificamente a este componente:

- `.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md` — convenções da
  própria lib (estrutura de componente, `InputBase` como wrapper, aliases em `src/index.ts`).
- `.claude/skills/vue-max-use-development-best-practices/SKILL.md` — uso correto de
  `toSearchableString` e `hasContent` de `@maxvue/max-use` (que devem ser preservados).
- `.claude/skills/vue-inputs-masks-validation-best-practices/SKILL.md` — padrões de inputs,
  v-model, estados de validação (done/caution/error) e blur — núcleo deste componente.
- `.claude/skills/vue-typescript-best-practices/SKILL.md` — tipagem em `<script setup lang="ts">`,
  `defineProps`/`withDefaults`/`defineEmits` mantendo a assinatura pública.
- `.claude/skills/vue-unocss-styling-best-practices/SKILL.md` — variáveis CSS do tema Max e como o
  input herda estilos via `.p-inputtext` (fidelidade visual).
- `.claude/skills/vue-eslint-stylelint-quality-standards/SKILL.md` — 4 espaços, aspas simples,
  ponto e vírgula, ordem dos blocos — exigidos ao editar o `.vue`.
- `.claude/skills/vue-vitest-testing-best-practices/SKILL.md` — rodar/entender
  `tests/components/MaxInputText.test.ts` e `findComponent(InputBase)`.

Skills deliberadamente **descartadas** (não pertinentes a este componente): virtual-scroller,
dayjs, uppy, pdf-viewer, floating-vue/popovers, keyboard-navigation, dynamic-components, pinia
(nenhuma store usada aqui).

---

## 10. Riscos e pontos de atenção

- **Dependência transitiva do `InputBase` (CRÍTICO):** `MaxInputText` usa `InputBase` como wrapper.
  Conforme `migration_plan.md`, **`InputBase` deve ser migrado PRIMEIRO** (~19 inputs dependem
  dele). Enquanto `InputBase` ainda usa PrimeVue (`FloatLabel`/`IconField`/`InputIcon`/`Message`),
  a aparência do `MaxInputText` depende dele. Ordem recomendada: `InputBase` → `MaxInputText`.
- **Classe `.p-inputtext`:** o SCSS do `InputBase` referencia `.p-inputtext`. Se o `<input>` nativo
  não mantiver essa classe, o input perde altura/largura/estados disabled. Manter
  `class="p-inputtext p-component"` até que a renomeação seja feita em conjunto com o `InputBase`.
- **`fluid` → largura 100%:** garantida pela regra `.p-inputtext { width: 100% !important; }`. Se
  no futuro a classe for renomeada, mover essa regra junto.
- **`v-model` vs `:value`+`@input`:** não usar `v-model` nativo direto no `<input>` para não
  duplicar a lógica de emit (o `watch(temp_value)` já emite). Ligar `:value="temp_value"` e
  `@input` que grava em `temp_value` — assim `setValue` do test-utils continua funcionando.
- **`useAttrs` e mensagens custom:** `error_msg` lê `attrs.errMsg`/`attrs.error_message`/
  `attrs.error_msg` e `attrs.target_value`/`targetValue`/`target-value`. Como agora há `<input>`
  nativo, atributos não declarados como props podem cair no `<input>` via fallthrough. Isso já
  ocorria com o PrimeVue (`v-bind="props"` + fallthrough). Não introduzir `inheritAttrs: false`
  sem verificar o teste `targetValue` (attr `error_msg`), que depende de `useAttrs` capturar
  `error_msg`. Comportamento atual: manter como está.
- **Não rodar migração em cadeia:** este plano cobre SOMENTE `MaxInputText`. Não editar
  `InputBase.vue`, `src/index.ts` (além de conferir aliases) nem outros componentes.
- **Sem novo `.vue`:** não é necessário regenerar o manifesto/resolver.
