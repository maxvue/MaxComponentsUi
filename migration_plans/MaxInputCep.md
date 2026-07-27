# Plano de Migração — MaxInputCep (Independência do PrimeVue)

> Documento autossuficiente. Uma IA executora deve conseguir realizar a migração lendo **apenas**
> este arquivo + os fontes referenciados. **Não** altere a API pública, os estilos nem o
> comportamento observável.

---

## 1. Componente

- **Nome:** `MaxInputCep`
- **Caminho:** `src/components/MaxInputCep.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** Substituir o `InputText` do PrimeVue por um `<input>` HTML nativo,
  preservando a máscara de CEP (`v-maska` + `formatCep`/`onlyNumbers`), a validação (`cepIsValid`),
  o ícone de loading à direita e o `InputBase` como wrapper.

---

## 2. Dependências do PrimeVue

O componente importa e usa **um único** componente PrimeVue:

```ts
import InputText from 'primevue/inputtext';
```

Uso no template (linha 3 do fonte atual):

```html
<InputText type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " placeholder="00 . 000 - 000" @blur="checkDone()" />
```

Observações importantes sobre esse uso:
- `primevue/inputtext` renderiza internamente um `<input class="p-inputtext p-component">`. Toda a
  estilização atual do projeto (em `InputBase.vue` e globalmente) tem seletores para `.p-inputtext`
  e `input`. Ao trocar por `<input>` nativo, **precisamos replicar as classes visuais** para não
  perder a aparência (ver seção 7).
- `autoClear` e `slotChar` são props do PrimeVue InputMask/InputText que **não têm efeito real**
  aqui (o InputText não é InputMask; a máscara vem do `v-maska`). Podem ser descartadas na migração.
- `v-maska` (de `maska/vue`) já funciona sobre qualquer elemento `<input>` nativo — **não é uma
  dependência do PrimeVue** e deve ser mantida.

`InputBase.vue` (wrapper) também depende do PrimeVue (`FloatLabel`, `IconField`, `InputIcon`,
`Message`), mas **a migração do InputBase é um pré-requisito separado** (ver seção 10). Este plano
cobre apenas o `MaxInputCep`.

---

## 3. Dependências internas (preservar)

Componentes / utilitários que **devem continuar funcionando exatamente igual**:

- **`InputBase`** — `import InputBase from './InputBase.vue';` — wrapper externo. Continua sendo o
  elemento raiz. Recebe `v-bind="props"` + `:value`, `:done`, `:caution`, `:error`, `:icon-right`.
- **`@maxvue/max-use`** (fonte em `../MaxUse`) — helpers importados:
  - `formatCep` (`../MaxUse/src/Helpers/Strings/masks.ts`) — aplica máscara `#####-###` a partir de
    dígitos; retorna `''` para valores em branco.
  - `onlyNumbers` (`../MaxUse/src/Helpers/Strings/filters.ts`) — remove tudo que não é dígito.
  - `cepIsValid` (`../MaxUse/src/Helpers/Validations/cepIsValid.ts`) — `true` quando há 8 dígitos.
  - Todos aceitam `Ref`/valor cru (usam `toValue`). **Não modificar.**
- **`maska/vue`** — diretiva `vMaska`. Continua igual.
- **Vue**: `ref`, `computed`, `watch`, `useAttrs`, tipo `Ref`.

Nenhuma store Pinia é usada por este componente.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Preservar exatamente:

### Props (de `defineProps`)
`modelValue` (any, default `''`), `loading?` (bool, default `false`), `icon?`, `i?`, `disabled?`,
`float?`, `msg?`, `message?`, `iconMessage?`, `label?`, `done?` (default `undefined`),
`error?` (string|bool), `targetValue?`, `caution?` (default `undefined`), `required?` (default
`false`).

> Todas repassadas ao `InputBase` via `v-bind="props"`. Manter a mesma interface `defineProps<{…}>`
> com os mesmos defaults em `withDefaults`.

### Emits
```ts
const emit = defineEmits(['update:modelValue', 'complete']);
```
- `update:modelValue` → emite **apenas dígitos** (`onlyNumbers(temp_value)`) a cada mudança.
- `complete` → emitido com os dígitos quando `cepIsValid` é verdadeiro.

### v-model
`v-model` sobre `modelValue` (dígitos crus, sem máscara). O valor interno exibido é mascarado
(`temp_value`), mas o que sai é sempre `onlyNumbers(...)`.

### Comportamento observável (coberto por testes — ver seção 8)
- `done` computado: se `props.done !== undefined` usa-o; senão, com dígitos presentes retorna
  `isValidCep`; senão `null`.
- `caution` computado: se `props.caution !== undefined` usa-o; senão `done === false && dígitos>0`.
- `error_msg`: só quando `caution`. `'Campo obrigatório'` quando vazio+`required`; senão
  `'CEP inválido'`; sobrescrito por `attrs.errMsg`/`attrs.error_message`/`attrs.error_msg`.
- `icon-right` do `InputBase` é `'loading'` quando `loading`, senão `undefined`.
- `@blur` chama `checkDone()`.
- `watch` em `props.modelValue` re-sincroniza `temp_value` quando os dígitos externos diferem.
- Placeholder visível: `00 . 000 - 000`.
- O elemento DOM final continua sendo um `<input>` acessível por `wrapper.find('input')`.

---

## 5. Estratégia de substituição

Substituição **direta e mínima**: trocar `<InputText …>` por `<input …>` nativo, mantendo
`v-model="temp_value"`, `v-maska="maskValue"`, `@blur`, `placeholder` e `type="text"`.

- **Não** é necessária nenhuma biblioteca headless — é um input de texto simples com máscara.
- Descartar props sem efeito do PrimeVue: `autoClear`, `slotChar`.
- Adicionar `class="p-inputtext p-component"` ao `<input>` nativo para herdar a estilização atual
  (ver seção 7). Isso mantém 100% da aparência sem tocar em `InputBase.vue`.
- Encaminhar `disabled`: o PrimeVue InputText recebia `disabled` implicitamente via `$attrs`
  (fall-through). Com `<input>` nativo o fall-through de atributos **continua funcionando** porque
  o `<input>` não é o elemento raiz (a raiz é `InputBase`), então atributos não declarados como
  props caem no primeiro elemento... **atenção:** aqui a raiz é `InputBase`, logo o fall-through vai
  para o `InputBase`, não para o `<input>`. Comportamento atual é idêntico (o InputText também não
  era a raiz). Portanto **não** adicionar bind manual de `disabled` no `<input>` — manter paridade
  com o comportamento atual (o `disabled` chega ao `InputBase` via `v-bind="props"`, que já inclui
  `disabled`).

`v-model="temp_value"` em `<input>` nativo é açúcar para `:value` + `@input`. O `v-maska` intercepta
o `input` e reescreve o valor; o `v-model` do Vue lê o valor já mascarado. Esse é exatamente o
comportamento que o InputText proporcionava.

---

## 6. Passos de implementação (ordenados)

1. **Pré-requisito:** confirmar que `InputBase.vue` já foi migrado (independente do PrimeVue) ou,
   se ainda não, que `MaxInputCep` pode ser migrado isoladamente sem quebrar (é possível, pois só
   trocamos o filho; ver seção 10). Não bloquear a troca do `InputText` por causa do InputBase.

2. Abrir `src/components/MaxInputCep.vue`.

3. **Remover o import do PrimeVue:**
   ```ts
   import InputText from 'primevue/inputtext';
   ```

4. **Trocar o elemento no template.** Substituir a linha:
   ```html
   <InputText type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " placeholder="00 . 000 - 000" @blur="checkDone()" />
   ```
   por:
   ```html
   <input type="text" class="p-inputtext p-component" v-model="temp_value" v-maska="maskValue" placeholder="00 . 000 - 000" @blur="checkDone()" />
   ```
   (Mantém `v-maska`, `v-model`, `placeholder`, `@blur`; remove `autoClear`/`slotChar`; adiciona
   classes visuais.)

5. **Manter tudo o mais igual:** `script setup`, imports de `@maxvue/max-use`, `maska/vue`,
   `useAttrs`, os `computed`/`watch`/`ref` e o bloco `<style>`.

6. Garantir aderência às convenções (seção "Constraints"): `<script setup lang="ts">`, indentação de
   4 espaços, aspas simples, ponto-e-vírgula, sem vírgula final, ordem Template → Script → Style.

7. **Não** é necessário regenerar o resolver (`generateResolver.ts`) — nenhum arquivo novo foi
   adicionado e o nome do componente não mudou.

8. Rodar verificação (seção 8).

---

## 7. Estilos

O objetivo é **zero mudança visual**. O `<input>` nativo deve receber as mesmas regras que o
`.p-inputtext` recebia.

- **Classes a adicionar no `<input>`:** `class="p-inputtext p-component"`.
  Regras já existentes que passam a aplicar-se ao novo `<input>`:
  - `InputBase.vue` (global, não-scoped): `.p-inputtext { height: 36px; }`, estados `[disabled]`,
    `.max-input-main-div .p-inputtext { width: 100% !important; }`, além de todas as regras `input {…}`
    (placeholder, alinhamento, bordas de `caution`/`error`, etc.).
  - Bloco `<style scoped>` do próprio `MaxInputCep.vue`:
    ```scss
    input {
        grid-column: 2;
        position: relative;
    }
    ```
    Mantido como está — continua válido para o `<input>` nativo.
- **Placeholder:** cor definida em `InputBase.vue` via `input::placeholder { color: var(--background-625); }`.
  Preservada automaticamente.
- **Variáveis CSS do tema Max** usadas indiretamente (via InputBase): `--orange-600`, `--max-red-600`,
  `--background-*`. Nenhuma alteração necessária aqui.
- **Importante:** caso o `InputBase` migrado deixe de emitir a classe `.p-inputtext` no wrapper,
  as regras que dependem dela ainda funcionarão porque a classe é aplicada **no próprio `<input>`**
  deste componente. Se, ao migrar o InputBase, as regras `.p-*` forem renomeadas para classes Max,
  atualizar a classe do `<input>` aqui para a nova nomenclatura equivalente (ex.: `max-inputtext`).

---

## 8. Testes / verificação

Arquivo de teste existente: `tests/components/MaxInputCep.test.ts` (11 casos). **Deve continuar
passando sem alterações.** Pontos que ele cobre e que a migração precisa manter:

- Renderização (`wrapper.exists()`).
- `wrapper.find('input')` continua encontrando o campo (por isso usamos `<input>` nativo — inclusive
  fica mais robusto que depender do render interno do PrimeVue).
- `input.setValue('01001000')` → emite `update:modelValue` só com dígitos e `complete`.
- `done`/`caution`/`error` repassados ao `InputBase` conforme props e valor.
- `attrs.errMsg` sobrescreve a mensagem de erro.
- `@blur` chama `checkDone()`.
- `watch` re-sincroniza ao mudar `modelValue`.

**Comandos de verificação:**
```bash
npx vitest run tests/components/MaxInputCep.test.ts
npm run type-check
npm run lint
```

**Checklist manual (playground `npm run dev:playground`):**
- Digitar `01001000` → exibe máscara `01.001 - 001`... (conferir formato `##.### - ###`), ícone de
  check (done) aparece quando válido.
- CEP incompleto → estado caution/laranja + mensagem `CEP inválido`.
- `loading=true` → ícone de loading à direita.
- `disabled` → campo desabilitado com estilo cinza.
- Aparência idêntica à versão pré-migração (comparar lado a lado).

---

## 9. Skills necessárias

Selecionadas de `.claude/skills` (apenas as pertinentes a este componente):

- `.claude/skills/vue-inputs-masks-validation-best-practices` — **principal**: padrões de máscara
  (Maska v3, CEP `#####-###`), unmasking com `onlyNumbers` e validação; este componente é
  exatamente o caso de uso "CEP" descrito na skill.
- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (uso de `InputBase`, aliases, estrutura de componente).
- `.claude/skills/vue-max-use-development-best-practices` — uso correto dos helpers `formatCep`,
  `onlyNumbers`, `cepIsValid` de `@maxvue/max-use`.
- `.claude/skills/vue-typescript-best-practices` — tipagem em `<script setup lang="ts">`
  (`defineProps`/`defineEmits`, `Ref`).
- `.claude/skills/vue-unocss-styling-best-practices` — classes utilitárias/variáveis do tema Max
  referenciadas via InputBase.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — 4 espaços, aspas simples, ponto-e-vírgula,
  ordem dos blocos.
- `.claude/skills/vue-vitest-testing-best-practices` — garantir que o teste existente continue
  passando e cobrir casos de borda.

---

## 10. Riscos e pontos de atenção

- **Ordem / dependência do InputBase:** `MaxInputCep` usa `InputBase` como wrapper. **Recomenda-se
  migrar `InputBase` primeiro** (ele ainda importa `FloatLabel`, `IconField`, `InputIcon`, `Message`
  do PrimeVue). Ainda assim, a troca do `InputText` por `<input>` neste componente é **independente**
  e pode ser feita antes — o risco é apenas visual se o InputBase mudar a nomenclatura das classes
  `.p-*` (ver seção 7, último item).
- **Classes visuais:** esquecer `class="p-inputtext p-component"` no `<input>` faz o campo perder
  altura (36px), largura 100% e estilos de estado. É o principal risco de regressão visual.
- **Props inertes do PrimeVue:** `autoClear` e `slotChar` devem ser removidas — não têm equivalente
  nem efeito no `<input>` nativo. Mantê-las como atributos nativos geraria warning de atributo
  desconhecido.
- **Máscara `v-maska`:** o `maskValue` computado usa `mask: '##.### - ###'` (com espaços) — manter
  exatamente, pois define o formato exibido. Não confundir com o `#####-###` do `formatCep` (usado
  só para o valor inicial `temp_value = ref(formatCep(props.modelValue))`).
- **`disabled` via fall-through:** não adicionar bind manual de `disabled` no `<input>`; hoje ele
  chega ao `InputBase` via `v-bind="props"`. Adicionar manualmente poderia duplicar/alterar o
  comportamento atual.
- **Emissão de valor cru:** garantir que `update:modelValue` continue emitindo `onlyNumbers(...)`
  (dígitos), não o valor mascarado — quebrar isso corromperia dados no backend.
- **Não regenerar resolver** e **não** renomear o componente/arquivo.
