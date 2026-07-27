# Plano de Migração — MaxInputCpfCnpj

> Plano autossuficiente para tornar o componente `MaxInputCpfCnpj` **independente do PrimeVue**.
> Uma IA futura deve conseguir executar esta migração lendo apenas este arquivo + o código-fonte
> referenciado (`src/components/MaxInputCpfCnpj.vue`, `src/components/InputBase.vue`).
> **NÃO** alterar a API pública, os estilos ou o comportamento observável.

---

## 1. Componente

- **Nome:** `MaxInputCpfCnpj`
- **Caminho:** `src/components/MaxInputCpfCnpj.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** substituir o único componente PrimeVue usado (`InputText`) por um
  `<input>` HTML nativo, preservando máscara (`v-maska`), formatação `onlyNumbers`, validações
  `isCpf`/`isCnpj`, debounce (`watchDebounced`) e o wrapper `InputBase`.

---

## 2. Dependências do PrimeVue

Há **apenas uma** dependência direta do PrimeVue neste componente:

```ts
import InputText from 'primevue/inputtext';
```

Usada no template como elemento de entrada:

```html
<InputText ref="el" type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" :style="`letter-spacing: 2.5px;`" @blur="checkDone()" />
```

**Observações importantes:**

- `v-maska` **NÃO** é PrimeVue — é a diretiva da biblioteca `maska` (`import { vMaska } from 'maska/vue'`).
  Ela **permanece** intacta e continua funcionando sobre um `<input>` nativo (maska opera diretamente
  sobre elementos `<input>` DOM).
- `InputText` do PrimeVue renderiza, no fim, um `<input class="p-inputtext ...">`. Todos os estilos
  de `InputBase.vue` que miram `.p-inputtext` / `input` precisam continuar sendo atendidos (ver §7).
- `autoClear="false"` é um atributo específico do wrapper PrimeVue **sem efeito relevante** para o
  comportamento atual (não altera valor nem máscara). Não precisa ser reproduzido no `<input>` nativo.
- `ref="el"` é usado por `useElementSize` para medir a largura (cálculo de `_space_letters`, hoje
  não aplicado ao estilo). No `<input>` nativo o `ref` aponta diretamente para o elemento DOM
  (`HTMLInputElement`), o que é compatível com `useElementSize`.

---

## 3. Dependências internas (preservar)

### 3.1 Componentes Max
- `InputBase` (`src/components/InputBase.vue`) — wrapper externo obrigatório. Recebe `v-bind="props"`,
  `:error="error_msg"`, `:caution="caution"`, `:done="isDone"`. **Deve permanecer como elemento raiz.**
  > ⚠️ `InputBase` também depende do PrimeVue (FloatLabel, IconField, InputIcon, Message) e tem seu
  > próprio plano de migração. Ver §10 (ordem).

### 3.2 Utilitários de `@maxvue/max-use` (fonte em `../MaxUse`)
Todos importados de `@maxvue/max-use` e **preservados sem alteração**:
- `onlyNumbers(str | Ref)` — extrai apenas dígitos (aceita `null` → `''`, aceita `Ref`).
- `isCpf` (importado como `isCPF`) — valida dígito verificador de CPF.
- `isCnpj` (importado como `isCNPJ`) — valida dígito verificador de CNPJ.
- `watchDebounced(source, cb, { debounce })` — watch com debounce.
- `useElementSize(el)` — retorna `{ width }` reativo.

### 3.3 Vue / bibliotecas externas (não-PrimeVue, preservar)
- `vue`: `useTemplateRef`, `ref`, `computed`, `watch`, `useAttrs`, tipo `Ref`.
- `maska/vue`: `vMaska`.

---

## 4. API pública a preservar (migração transparente)

### 4.1 Props (`defineProps` + `withDefaults`)
Preservar **exatamente** a interface e os defaults atuais:

| Prop | Tipo | Default | Papel |
|------|------|---------|-------|
| `modelValue` | `string \| null` | `''` | v-model (apenas números) |
| `cpf` | `boolean?` | — | força máscara/validação CPF |
| `cnpj` | `boolean?` | — | força máscara/validação CNPJ |
| `icon` | `string?` | — | ícone |
| `i` | `string?` | — | alias de ícone |
| `disabled` | `boolean?` | — | desabilita |
| `float` | `boolean?` | — | FloatLabel |
| `msg` | `string?` | — | mensagem (alias) |
| `message` | `string?` | — | mensagem |
| `iconMessage` | `string?` | — | ícone da mensagem |
| `label` | `string?` | — | rótulo |
| `done` | `boolean?` | `undefined` | estado done manual |
| `error` | `string \| boolean?` | — | erro |
| `targetValue` | `string?` | — | valor de comparação (não usado internamente hoje) |
| `caution` | `string \| boolean?` | `undefined` | atenção |
| `required` | `boolean` | `false` | obrigatório |

Defaults: `{ modelValue: '', done: undefined, required: false, caution: undefined }`.

### 4.2 Emits
```ts
defineEmits(['update:modelValue', 'complete']);
```
- `update:modelValue` — emitido (via `watchDebounced`, debounce 500ms) quando o valor tem
  **11 ou 14 dígitos**, com o payload `onlyNumbers(temp_value)`.
- `complete` — emitido no mesmo bloco **somente quando `done.value` é verdadeiro**, com o mesmo payload.

### 4.3 Slots
Nenhum slot próprio. (O slot default é consumido internamente por `InputBase`.)

### 4.4 Comportamento observável a preservar (crítico)
- **Máscara dinâmica** (`maskValue` computed):
  - `props.cpf` → `'###.###.###-##@'`, `type_mask='cpf'`.
  - `props.cnpj` → `'##.###.###/####-##'`, `type_mask='cnpj'`.
  - auto: `onlyNumbers(temp_value).length > 11` → CNPJ, senão CPF.
  - tokens: `{ '#': { pattern: /[0-9]/ }, '@': { pattern: /[0-9]/, optional: true, recursive: true } }`.
- **`temp_value`** (`ref`) — valor mascarado exibido; inicia com `props.modelValue ?? ''`.
- **`isDone`** (`ref`) — inicia com `props.done ?? null`; atualizado por `checkDone()` no blur.
- **`checkDone()`** — `isDone.value = done.value`.
- **`done`** (computed):
  - se `props.done !== undefined` → `props.done`.
  - se `props.cpf` → `isCpf(temp_value)`.
  - se `props.cnpj` → `isCnpj(temp_value)`.
  - senão → `isCpf(temp_value) || isCnpj(temp_value)`.
- **`caution`** (computed): se `props.caution !== undefined` → `props.caution`; se vazio → `false`;
  senão `!done.value`.
- **`error_msg`** (computed): `null` se não houver caution; lê `attrs.errMsg ?? attrs.error_message ??
  attrs.error_msg`; se vazio + `required` → `'Campo obrigatório'`; `cpf` → `'CPF inválido'`;
  `cnpj` → `'CNPJ inválido'`; fallback → `'Documento inválido'`.
- **`watch(props.modelValue)`** — se diferente de `temp_value`, seta `temp_value = onlyNumbers(props.modelValue ?? '')`.
- **`letter-spacing: 2.5px`** no input (estilo inline atual).

> ⚠️ Todos os testes acessam a instância via `wrapper.vm`: `temp_value`, `maskValue`, `done`,
> `caution`, `checkDone`. Esses membros **precisam continuar expostos** (em `<script setup>` já são
> acessíveis via `wrapper.vm` no teste porque o componente não usa `defineExpose` restritivo —
> manter o mesmo padrão, **sem** adicionar `defineExpose` que oculte membros).

---

## 5. Estratégia de substituição

**Troca mínima e cirúrgica** — o componente é `baixa` complexidade porque a única peça PrimeVue é
o campo de texto:

1. Remover `import InputText from 'primevue/inputtext';`.
2. Substituir `<InputText ... />` por um `<input ... />` HTML nativo, **mantendo**:
   - `ref="el"` (agora aponta para o `HTMLInputElement`);
   - `type="text"`;
   - `v-model="temp_value"`;
   - `v-maska="maskValue"`;
   - `@blur="checkDone()"`;
   - o estilo inline `letter-spacing: 2.5px`;
   - `:disabled="props.disabled"` (o `InputText` recebia `disabled` implicitamente via `v-bind`/attrs;
     como agora é `<input>` nativo, encaminhar `disabled` explicitamente para preservar o estado
     desabilitado e os estilos `[disabled]` do `InputBase`).
3. Adicionar `class="p-inputtext"` **ou** garantir por CSS que o `<input>` receba os mesmos estilos
   hoje aplicados via `.p-inputtext` no `InputBase`. **Recomendado:** manter `class="p-inputtext"`
   no `<input>` nativo — é o caminho de **menor risco visual**, pois reaproveita todo o SCSS existente
   de `InputBase.vue` (`.p-inputtext { height: 36px }`, estados `[disabled]`, largura `100%`, etc.)
   sem reescrever nada. (Alternativa mais “limpa” em §7, opcional.)
4. **Não** é necessária biblioteca headless — `<input>` nativo + `maska` cobrem 100% do caso.

`v-maska`, `onlyNumbers`, `isCpf`, `isCnpj`, `watchDebounced`, `useElementSize` e todo o bloco
`<script setup>` **permanecem inalterados** (exceto a remoção do import de `InputText`).

---

## 6. Passos de implementação (ordenados)

1. **Pré-requisito:** confirmar que `InputBase` já foi migrado (ver §10). Se não, este componente
   ainda funciona, mas os estilos dependem do SCSS de `InputBase` — não migrar este antes daquele
   para evitar retrabalho visual.
2. Abrir `src/components/MaxInputCpfCnpj.vue`.
3. No `<script setup>`, **remover** a linha:
   ```ts
   import InputText from 'primevue/inputtext';
   ```
   Não mexer em nenhum outro import nem em nenhuma lógica.
4. No `<template>`, substituir:
   ```html
   <InputText ref="el" type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" :style="`letter-spacing: 2.5px;`" @blur="checkDone()" />
   ```
   por:
   ```html
   <input ref="el" type="text" class="p-inputtext" v-model="temp_value" v-maska="maskValue" :disabled="props.disabled" :style="`letter-spacing: 2.5px;`" @blur="checkDone()" />
   ```
   - Remover `autoClear="false"` (sem efeito no `<input>` nativo).
   - Adicionar `class="p-inputtext"` (reaproveita estilos existentes).
   - Adicionar `:disabled="props.disabled"` (encaminha estado desabilitado explicitamente).
5. Verificar que `useTemplateRef<any>('el')` continua válido — `el.value` agora é o `HTMLInputElement`.
   `useElementSize(el)` funciona sobre esse elemento. Nenhuma mudança necessária no cast `as any`.
6. Rodar `npm run type-check` — corrigir qualquer erro de tipo residual (não deve haver, pois o
   `<input>` nativo é fortemente tipado e o `ref` já usa `<any>`).
7. Rodar `npm run lint` — garantir 4 espaços, aspas simples, sem trailing commas, semicolons.
8. **Atualizar o teste** (`tests/components/MaxInputCpfCnpj.test.ts`): o stub atual mapeia
   `InputText: { template: '<input />' }`. Como o componente agora usa `<input>` nativo (sem
   componente `InputText`), esse stub torna-se inócuo, mas o `<input>` real será montado. Verificar
   que os testes que dependem de `wrapper.vm` (todos) continuam passando (eles não dependem do stub
   de `InputText`). Manter o stub de `InputBase` e `MaxIcon`. Remover o stub `InputText` é opcional
   (não atrapalha). Ver §8 para o checklist completo.
9. Rodar `npx vitest run tests/components/MaxInputCpfCnpj.test.ts` e garantir 100% verde.
10. **Não** é necessário regenerar o resolver (`generateResolver.ts`) — nenhum arquivo `.vue` novo
    foi criado nem renomeado.

---

## 7. Estilos

O `<input>` deve ficar **visualmente idêntico** ao `InputText` PrimeVue atual.

### 7.1 Estilos herdados de `InputBase.vue` (já existentes, reaproveitar)
`InputBase.vue` já define no seu bloco `<style lang="scss">` (não scoped) regras que miram
`.p-inputtext` e `input`:
- `.p-inputtext { height: 36px; }`
- `.p-inputtext[disabled] { background: var(--background-75); color: var(--background-400); ... }`
- `.max-input-main-div .p-inputtext { width: 100% !important; }`
- Estados `&.caution input { border-color: var(--orange-600) }` e `&.error input { border-color: var(--max-red-600) }`
- `input::placeholder { color: var(--background-625) }`
- Alinhamentos `text-center` / `text-right` via `input { text-align: ... }`
- Variantes `[slim]`, `[full]`, `[flex]`, `in-line` que miram `input`.

➡️ Por isso a recomendação de manter `class="p-inputtext"` no `<input>` nativo: **todos esses
estilos passam a valer sem qualquer reescrita**.

### 7.2 Estilo inline específico do componente
Preservar `:style="'letter-spacing: 2.5px;'"` no `<input>` — é a característica visual de
espaçamento dos dígitos do documento.

### 7.3 Alternativa (opcional, maior risco — só se `InputBase` abandonar o prefixo `.p-`)
Se a migração de `InputBase` remover as classes `.p-*`, então:
- Trocar `class="p-inputtext"` por uma classe própria (ex.: `class="max-inputtext"`) e replicar
  no SCSS de `InputBase` (ou num `<style scoped>` deste componente) as regras: `height: 36px`,
  `width: 100%`, borda/foco padrão do tema (`var(--background-*)`), estados disabled
  (`var(--background-75)` / `var(--background-400)` / `var(--background-575)`), placeholder
  (`var(--background-625)`).
- Usar variáveis CSS do tema Max (`var(--background-300)`, `var(--orange-600)`, `var(--max-red-600)`)
  — nunca valores hex crus.
> Preferir a abordagem §7.1 (menor risco). Esta alternativa só se justifica se `InputBase` já tiver
> eliminado `.p-inputtext`.

---

## 8. Testes / verificação

### 8.1 Arquivo de teste existente
`tests/components/MaxInputCpfCnpj.test.ts` — cobre: render, máscara CPF/CNPJ/auto, validação
done/caution, override de props, mensagens de erro (`errMsg`, `Campo obrigatório`, `CPF inválido`,
`CNPJ inválido`), sync `modelValue`→`temp_value`, emits `update:modelValue`/`complete`.

O mock de `@maxvue/max-use` troca `watchDebounced` por `watch(..., { immediate:false })` para tornar
o debounce síncrono nos testes. **Preservar esse mock.**

### 8.2 Ajustes no teste após migração
- O stub `InputText: { template: '<input />' }` refere-se ao componente PrimeVue que **deixou de
  existir** no template. Ele não quebra nada (Vue ignora stub de componente ausente), mas por clareza
  pode ser removido. **Não** adicionar stub para `<input>` nativo (não é componente).
- Todos os asserts usam `wrapper.vm.*` e `wrapper.findComponent(InputBase)` — **independentes** do
  elemento de input. Devem continuar passando sem alteração.

### 8.3 Comandos de verificação
```bash
npx vitest run tests/components/MaxInputCpfCnpj.test.ts   # todos os 18 casos verdes
npm run type-check                                        # sem erros de tipo
npm run lint                                              # sem violações de estilo
```

### 8.4 Checklist manual (playground: `npm run dev:playground`)
- [ ] Digitar CPF `529.982.247-25` → aparece máscara CPF, ícone done (check verde), `complete` emitido.
- [ ] Digitar CNPJ `11.222.333/0001-81` → máscara CNPJ, done, `complete`.
- [ ] Digitar documento inválido com 11/14 dígitos → `caution` (laranja), mensagem `CPF/CNPJ inválido`.
- [ ] Campo `required` vazio + interação → mensagem `Campo obrigatório`.
- [ ] `letter-spacing` visível (dígitos espaçados) — idêntico ao antes.
- [ ] Estado `disabled` → fundo/cor de desabilitado corretos (via estilos `.p-inputtext[disabled]`).
- [ ] `modelValue` externo alterado reflete no campo (só dígitos).
- [ ] Layout (altura 36px, largura 100%, borda de erro/atenção) idêntico à versão PrimeVue.

---

## 9. Skills necessárias

Skills selecionadas em `.claude/skills` (apenas as pertinentes a este componente):

- `.claude/skills/vue-inputs-masks-validation-best-practices` — **central**: padrões de máscara
  CPF/CNPJ (`###.###.###-##` / `##.###.###/####-##`), uso de `v-maska` sobre `<input>` nativo,
  unmasking com `onlyNumbers` e validação de dígito verificador. É exatamente o caso deste componente.
- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (`InputBase` como wrapper, ordem Template→Script→Style, aliases, estrutura dos componentes Max).
- `.claude/skills/vue-max-use-development-best-practices` — uso correto de `onlyNumbers`, `isCpf`,
  `isCnpj`, `watchDebounced`, `useElementSize` vindos de `@maxvue/max-use`.
- `.claude/skills/vue-unocss-styling-best-practices` — classes utilitárias/UnoCSS e variáveis CSS do
  tema Max para reproduzir a aparência do input.
- `.claude/skills/vue-typescript-best-practices` — tipagem em `<script setup lang="ts">`
  (`defineProps`/`defineEmits`, `Ref`, `useTemplateRef<any>`).
- `.claude/skills/vue-vitest-testing-best-practices` — manter/ajustar os testes Vitest + test-utils
  (stubs, mock de `watchDebounced`, asserts via `wrapper.vm`).
- `.claude/skills/vue-eslint-stylelint-quality-standards` — garantir 4 espaços, aspas simples,
  semicolons, sem trailing commas (padrões de lint do projeto).

---

## 10. Riscos e pontos de atenção

1. **Ordem — `InputBase` primeiro (dependência transitiva):** este componente usa `<InputBase>` como
   raiz, e `InputBase` **também** depende do PrimeVue (FloatLabel, IconField, InputIcon, Message).
   Os estilos do `<input>` (altura 36px, disabled, bordas de erro/atenção, placeholder) vivem no SCSS
   de `InputBase.vue` e miram `.p-inputtext`. **Migre `InputBase` primeiro**; ao fazê-lo, decida se
   mantém o seletor `.p-inputtext` (recomendado nesta migração) ou migra para uma classe própria —
   se migrar, ajuste §7 aqui.
2. **`v-maska` não é PrimeVue — não remover.** É a diretiva `maska`. Ela é o coração da formatação;
   removê-la quebra máscara e o cálculo `type_mask`/`maskValue`. Mantenha os tokens `#` e `@` exatos
   (o token `@` recursivo/opcional afeta o comprimento aceito do CPF).
3. **`class="p-inputtext"` é o caminho de menor risco visual.** Trocar por classe própria exige
   replicar manualmente todos os estados (disabled, foco, borda, placeholder) e aumenta a chance de
   divergência visual. Só faça isso se `InputBase` tiver removido `.p-inputtext`.
4. **`ref="el"` muda de semântica:** no `InputText` era a instância do componente PrimeVue; no
   `<input>` nativo é o `HTMLInputElement`. `useElementSize` funciona com ambos, mas confirme que
   nada mais no código acessa métodos internos do componente PrimeVue via `el` (não acessa hoje —
   apenas `useElementSize` o consome). O cast `useTemplateRef<any>('el')` já é permissivo.
5. **`disabled` deve ser encaminhado explicitamente.** No `InputText`, o `disabled` chegava via attrs
   herdados; no `<input>` nativo é preciso `:disabled="props.disabled"` para preservar o estado e os
   estilos `[disabled]`.
6. **`autoClear` some sem impacto.** Era um prop do wrapper PrimeVue; o `<input>` nativo não tem
   equivalente e o comportamento atual não depende dele.
7. **Não quebrar exposição para os testes.** Todos os testes leem `wrapper.vm.temp_value`,
   `wrapper.vm.maskValue`, `wrapper.vm.done`, `wrapper.vm.caution`, `wrapper.vm.checkDone`. Manter o
   padrão `<script setup>` sem `defineExpose` restritivo. Não renomear nenhuma dessas variáveis.
8. **Debounce de 500ms** é preservado pelo `watchDebounced` real em produção e mockado nos testes —
   não substituir por `watch` no código de produção.
9. **Regeneração do resolver não é necessária** — nenhum arquivo `.vue` foi adicionado/renomeado.
