# Plano de Migração — MaxInputPhoneMail

> Plano autossuficiente para tornar `MaxInputPhoneMail` independente do PrimeVue.
> Uma IA futura deve conseguir executar esta migração lendo apenas este arquivo mais o
> código-fonte referenciado. **Não** alterar o comportamento, a API pública ou a aparência.

---

## 1. Componente

- **Nome:** `MaxInputPhoneMail`
- **Caminho:** `src/components/MaxInputPhoneMail.vue`
- **Nível de dificuldade:** `baixa`
- **Resumo da migração:** Substituir o `<InputText>` do PrimeVue por um `<input>` nativo.
  Preservar toda a lógica de detecção telefone/email (via `onlyNumbers` / `onlyLetters`),
  a máscara dinâmica (`v-maska`), o ícone dinâmico e o wrapper `InputBase`.

---

## 2. Dependências do PrimeVue (trechos reais)

Há **uma única** dependência direta do PrimeVue no componente: `primevue/inputtext`.

Import (linha 12):

```ts
import InputText from 'primevue/inputtext';
```

Uso no template (linhas 2-4):

```html
<InputBase v-bind="props" class="input-base-phone-mail-main-div" :label="attrs.label ?? name_method" :icon="iconLeft" :done="done ?? undefined" :caution="caution" :error="error_msg">
    <InputText type="text" v-bind="attrs" v-model="temp_value" v-maska:unmaskedValue.unmasked="maskValue" autoClear="false" slotChar=" " @blur="checkDone()" :placeholder="attrs.email !== undefined || attrs.mail !== undefined ? 'usuario@email.com' : '(99) 9 9999 - 9999'" />
</InputBase>
```

Observações importantes sobre esse `<InputText>`:

- `type="text"` — atributo HTML padrão, migra sem mudança.
- `v-bind="attrs"` — repassa todos os atributos não declarados como props (fallthrough).
  Com um `<input>` nativo o comportamento de fallthrough é o mesmo, mas **atenção**: props
  específicas do PrimeVue passadas pelo consumidor (ex.: `size`, variantes) deixam de existir.
  Na prática, o consumidor passa aqui atributos-flag (`phone`, `whatsapp`, `email`, `mail`, etc.)
  e atributos HTML (`placeholder`, `disabled`, `name`, `id`...), todos compatíveis com `<input>`.
- `v-model="temp_value"` — o `InputText` do PrimeVue expõe `modelValue`/`update:modelValue`.
  Um `<input>` nativo usa `:value` + `@input`. Ver estratégia de substituição (seção 5).
- `v-maska:unmaskedValue.unmasked="maskValue"` — diretiva do pacote `maska` (NÃO é PrimeVue).
  **Preservar exatamente.** A `maska` funciona sobre `<input>` nativo (é o caso de uso primário
  da biblioteca), então essa diretiva continua igual.
- `autoClear="false"` e `slotChar=" "` — **estas duas props são específicas do `InputText`/InputMask
  do PrimeVue** e **não têm efeito em `<input>` nativo**. Elas devem ser **removidas** na migração
  (viram atributos DOM inválidos e inertes se mantidas). Confirmar que nenhum teste depende delas
  (ver seção 8). A máscara real é controlada por `v-maska`, não por `slotChar`.
- `@blur="checkDone()"` — evento nativo, migra sem mudança.
- `:placeholder="..."` — atributo nativo, migra sem mudança.

> **NÃO** há uso de `FloatLabel`, `IconField`, `InputIcon`, `Message` diretamente neste componente —
> esses vêm de `InputBase` e são tratados no plano do `InputBase` (ver seção 10, ordem).

---

## 3. Dependências internas

### Componentes Max
- `InputBase` (`src/components/InputBase.vue`) — wrapper obrigatório. Fornece FloatLabel, ícones
  (via slot), mensagens de feedback e estados visuais (`done` / `caution` / `error` / `required`).
  **Deve ser migrado ANTES** deste componente (ver seção 10). O `<input>` nativo entra no `<slot>`
  default de `InputBase`, exatamente como o `<InputText>` entra hoje.

### Utilitários de `@maxvue/max-use` (preservar imports e comportamento)
Import atual (linha 8):

```ts
import { onlyNumbers, onlyLetters } from '@maxvue/max-use';
```

- `onlyNumbers(value)` — retorna somente os dígitos da string. Fonte:
  `../MaxUse/src/Helpers/Strings/filters.ts`.
- `onlyLetters(value)` — retorna somente as letras da string. Fonte:
  `../MaxUse/src/Helpers/Strings/filters.ts`.

Esses dois helpers **não dependem do PrimeVue** e devem permanecer inalterados.

### Bibliotecas externas (não-PrimeVue — preservar)
- `maska/vue` → `vMaska` (diretiva de máscara). Import (linha 13):
  `import { vMaska } from 'maska/vue';`
- `libphonenumber-js` → `parsePhoneNumberFromString` (validação de telefone BR). Import (linha 14):
  `import { parsePhoneNumberFromString } from 'libphonenumber-js';`
- `vue` → `ref`, `computed`, `watch`, `onMounted`, `useAttrs`, `type Ref`.

Nenhuma destas será alterada pela migração.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Preservar exatamente:

### Props declaradas (`defineProps`, linhas 18-36)
```ts
modelValue: string;              // default ''
icon?: string | undefined;
i?: string | undefined;
disabled?: boolean | undefined;
float?: boolean | undefined;
msg?: string | undefined;
message?: string | undefined;
iconMessage?: string | undefined;
label?: string | undefined;
done?: boolean | undefined;      // default undefined
error?: string | boolean | undefined;
targetValue?: string;
caution?: string | boolean | undefined;  // default undefined
required?: boolean;              // default false
```
Manter `withDefaults(..., { modelValue: '', done: undefined, required: false, caution: undefined })`.

### Emits
```ts
const emit = defineEmits(['update:modelValue']);
```
Suporte a `v-model` no próprio `MaxInputPhoneMail` (emite `update:modelValue` sempre que
`temp_value` muda — watch das linhas 121-124).

### Atributos-flag reconhecidos via `useAttrs()` (comportamento observável)
Detectados em `onMounted` (linhas 133-142) e no template:
- `phone`, `whatsapp`, `zap` → força `method = 'whatsapp'`, `name_method = 'Whatsapp'`.
- `email`, `e-mail`, `mail` → força `method = 'email'`, `name_method = 'Email'`.
- `label` (attrs) → usado como label do `InputBase` quando presente (`attrs.label ?? name_method`).
- `icon`, `icon_left`, `icon-left` → ícone customizado no modo whatsapp (linha 44).
- `errMsg`, `error_message`, `error_msg` → mensagem de erro custom (linha 78).

### Slots
- Nenhum slot próprio é exposto (o componente ocupa o slot default do `InputBase`). Preservar.

### Comportamento observável (NÃO pode mudar)
1. **Placeholder dinâmico:** `usuario@email.com` se `email`/`mail` presentes; senão `(99) 9 9999 - 9999`.
2. **Ícone dinâmico** (`iconLeft`, linha 44): `ic:baseline-whatsapp` (ou attrs.icon custom) no modo
   whatsapp; `prime:at` no modo email/indefinido.
3. **Label dinâmico:** `name_method` alterna entre `'Email ou Whatsapp'`, `'Whatsapp'`, `'Email'`.
4. **Máscara dinâmica** (`maskValue`, linhas 83-107):
   - `> 1` letra → máscara de e-mail (`%` com tokens); `maskMail()` limpa caracteres de máscara
     de telefone do valor e define `method='email'`, `name_method='Email'`.
   - `> 1` dígito → máscara de telefone; `maskPhone()` escolhe `+55 (##) 9 #### - ####` (celular,
     3º dígito 6-9) ou `+55 (##) #### - ####$` (fixo) e define `name_method='Whatsapp'`.
   - Caso contrário → máscara `'%'`.
   - Tokens: `#` = `[a-zA-Z0-9@]`, `@` = `[a-zA-Z0-9@(.+_-]`, `%` = `[a-zA-Z0-9@().+_-\s]` (opcional, repetido).
5. **Validação `done`** (computed, linhas 52-68): usa `parsePhoneNumberFromString(v, 'BR').isValid()`
   para whatsapp e regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` para email; se `method` indefinido, testa ambos.
   Retorna `null` para vazio não-obrigatório, `false` para vazio obrigatório.
6. **`checkDone()`** no `@blur` (linhas 48-50) — inicializa `isDone` com o valor de `done`.
7. **`caution`** (linhas 70-74) e **`error_msg`** (linhas 76-81) — mensagens de validação.
8. **Sincronização `v-model`:** watch de `props.modelValue` (linhas 126-131) atualiza `temp_value`;
   watch de `temp_value` emite `update:modelValue` e atualiza `isDone` se já inicializado.

**Toda a lógica de `<script setup>` (linhas 7-143) permanece IDÊNTICA.** A migração toca apenas
o `<template>` (trocar `<InputText>` por `<input>`) e ajusta o import (remover linha 12).

---

## 5. Estratégia de substituição

Substituição **trivial e local** (nível `baixa`): o único elemento PrimeVue é `<InputText>`, que é
apenas um wrapper fino sobre `<input>`. Trocar por `<input>` nativo mantendo `v-maska` e demais
bindings.

### O que trocar por HTML nativo
- `<InputText ... />` → `<input ... />`.
- `v-model="temp_value"` → em `<input>` nativo, `v-model` **continua funcionando** (Vue transforma
  em `:value` + `@input` automaticamente). Não é necessário mudar para `:value`/`@input` manual.
  **Recomendado manter `v-model="temp_value"`** para preservar exatamente a semântica atual.
- Remover as props exclusivas do PrimeVue: `autoClear="false"` e `slotChar=" "` (inertes/ inválidas
  em `<input>` nativo — ver seção 2).
- Manter: `type="text"`, `v-bind="attrs"`, `v-maska:unmaskedValue.unmasked="maskValue"`,
  `@blur="checkDone()"`, `:placeholder="..."`.

### O que NÃO exige biblioteca headless
Nada. A máscara já é provida por `maska` (biblioteca externa, agnóstica de framework de UI). A
validação é provida por `libphonenumber-js` + regex. O layout/label/ícones vêm do `InputBase`.
Não há necessidade de TanStack, virtual scroller, calendário headless, etc.

### Import a remover
- Linha 12: `import InputText from 'primevue/inputtext';` → **remover**.

Nenhum novo import é necessário (o `<input>` é um elemento nativo).

---

## 6. Passos de implementação

Executar na ordem. **Pré-requisito:** `InputBase` já migrado (ou pelo menos com API de slot/props
preservada — ver seção 10).

1. **Abrir** `src/components/MaxInputPhoneMail.vue`.
2. **Remover** o import do PrimeVue (linha 12):
   ```ts
   import InputText from 'primevue/inputtext';
   ```
3. **No template**, substituir a tag `<InputText ...>` por `<input ...>`, preservando todos os
   bindings exceto `autoClear` e `slotChar`. Resultado esperado:
   ```html
   <InputBase v-bind="props" class="input-base-phone-mail-main-div" :label="attrs.label ?? name_method" :icon="iconLeft" :done="done ?? undefined" :caution="caution" :error="error_msg">
       <input type="text" v-bind="attrs" v-model="temp_value" v-maska:unmaskedValue.unmasked="maskValue" @blur="checkDone()" :placeholder="attrs.email !== undefined || attrs.mail !== undefined ? 'usuario@email.com' : '(99) 9 9999 - 9999'" />
   </InputBase>
   ```
   > Observação: se algum teste ou consumidor depender de `autoClear`/`slotChar` (improvável),
   > documentar; caso contrário, removê-los é seguro pois não têm efeito em `<input>` nativo.
4. **Não alterar** o bloco `<script setup>` (linhas 7-143) — toda a lógica é agnóstica de PrimeVue.
   Confirmar que `useAttrs()`, `onlyNumbers`, `onlyLetters`, `vMaska`, `parsePhoneNumberFromString`
   e os watchers permanecem intactos.
5. **Revisar o bloco `<style scoped>`** (linhas 145-150) — a regra `input { grid-column: 2; position: relative; }`
   já mira o elemento `input`, então continua válida (o `<input>` nativo é um `input`, assim como o
   PrimeVue renderiza um `input` interno). Verificar se algum seletor `.p-inputtext` herdado do
   `InputBase` era necessário para este componente (o `<input>` nativo não terá a classe `.p-inputtext`;
   ver seção 7 e seção 10).
6. **Verificar o manifesto de auto-import:** como o **nome do arquivo não muda**, não é necessário
   regenerar o resolver. (Só rodar `npx tsx src/scripts/generateResolver.ts` se um arquivo `.vue`
   for adicionado/renomeado — não é o caso.)
7. **Rodar lint/type-check/testes** (seção 8).

---

## 7. Estilos

### Estilo scoped do próprio componente (preservar)
```scss
input {
    grid-column: 2;
    position: relative;
}
```
Continua válido: mira o elemento `input`. Com `<input>` nativo, o seletor casa igualmente.

### Estilos herdados de `InputBase` — ponto de atenção crítico
O SCSS **global** (não-scoped) de `InputBase.vue` estiliza fortemente a classe do PrimeVue
`.p-inputtext` (linhas 379-437 de `InputBase.vue`), por exemplo:

```scss
.p-inputtext, .p-datepicker, .p-autocomplete {
    width: 100% !important;
}
.p-inputtext {
    height: 36px;
    /* estados disabled ... */
}
```

O `<InputText>` do PrimeVue aplica a classe `.p-inputtext` no `<input>` interno; um `<input>` nativo
**NÃO** terá essa classe. Portanto, para preservar a aparência (altura de 36px, largura 100%, estados
disabled), há duas opções:

- **Opção A (preferida, alinhada ao plano do InputBase):** o plano de migração do `InputBase` deve
  generalizar esses seletores para incluir `input` nativo (ex.: `.p-inputtext, input, .max-input`).
  Neste caso, **nenhuma** mudança de estilo é necessária aqui — apenas garantir que o `<input>` seja
  alcançado pelos seletores globais migrados do `InputBase`.
- **Opção B (fallback local, se o InputBase ainda não cobrir `input` nativo):** adicionar as regras
  necessárias no `<style>` deste componente para reproduzir `height: 36px`, `width: 100%` e placeholder
  color. Usar as mesmas variáveis do tema Max:
  ```scss
  input {
      grid-column: 2;
      position: relative;
      width: 100% !important;
      height: 36px;

      &::placeholder {
          color: var(--background-625);
      }

      &[disabled] {
          background: var(--background-75) !important;
          color: var(--background-400) !important;
      }
  }
  ```
  > Preferir a Opção A para evitar duplicação. A cor de placeholder `var(--background-625)` e os
  > estados disabled já existem no `InputBase` global (linhas 331-335, 416-437).

### Variáveis do tema Max relevantes
- `var(--background-625)` — cor do placeholder.
- `var(--background-75)`, `var(--background-400)`, `var(--background-575)` — estados disabled.
- `var(--orange-600)`, `var(--max-red-600)` — bordas de caution/error (aplicadas pelo `InputBase`
  via classes `.caution`/`.error`, com seletores `input { border-color: ... }`, já cobrindo `<input>`
  nativo — ver `InputBase.vue` linhas 216-219 e 241-243).

### UnoCSS
Não há classes UnoCSS neste componente além da classe custom `input-base-phone-mail-main-div`
(seletor de identificação, sem regra própria conhecida). Preservar como está.

---

## 8. Testes / verificação

### Arquivos de teste existentes (executar e manter verdes)
- `tests/components/MaxInputPhoneMail.test.ts` — teste principal deste componente.
- `tests/components/MaxPhoneField.test.ts` — relacionado (revisar se referencia o mesmo comportamento).

Rodar:
```bash
npx vitest run tests/components/MaxInputPhoneMail.test.ts
npx vitest run tests/components/MaxPhoneField.test.ts
```

Antes de editar, **ler** `tests/components/MaxInputPhoneMail.test.ts` para confirmar:
- Se o teste faz `wrapper.find('input')` (deve continuar funcionando — na verdade fica mais simples,
  pois o `<input>` nativo é encontrado diretamente).
- Se o teste seleciona por classe `.p-inputtext` — **se sim, ajustar o teste** para usar `input`
  nativo (a classe `.p-inputtext` some com a remoção do PrimeVue). Documentar essa mudança.
- Se algum teste verifica `autoClear`/`slotChar` como atributos — remover essas asserções.

### Checklist manual (playground)
Rodar `npm run dev:playground` e verificar:
1. Digitar dígitos → máscara de telefone aparece (`+55 (##) 9 #### - ####`), ícone `ic:baseline-whatsapp`,
   label vira `Whatsapp`.
2. Digitar letras/`@` → máscara de e-mail, ícone `prime:at`, label vira `Email`.
3. Placeholder muda conforme flags `email`/`mail` vs. telefone.
4. Telefone BR válido/ inválido → ícone de `done` (check) / `caution` (exclamação) via `InputBase`.
5. E-mail válido/ inválido → idem.
6. `required` + vazio + blur → mensagem `Campo obrigatório`.
7. `v-model` bidirecional: alterar valor externo reflete no input e vice-versa.
8. `disabled` → aparência de campo desabilitado preservada (validar Opção A/B da seção 7).

### Verificações de qualidade
```bash
npm run lint
npm run type-check
npm run test
```

---

## 9. Skills necessárias

Selecionadas da pasta `.claude/skills` (priorizando `vue-` e as pertinentes a este input):

- `.claude/skills/vue-inputs-masks-validation-best-practices` — **central para este componente**:
  cobre `maska`, `libphonenumber-js`, validação de telefone/e-mail e o padrão `InputBase`.
- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (estrutura `.vue`, `InputBase`, aliases, resolver).
- `.claude/skills/vue-max-use-development-best-practices` — uso correto de `onlyNumbers`/`onlyLetters`
  de `@maxvue/max-use`.
- `.claude/skills/vue-typescript-best-practices` — tipagem de `defineProps`/`defineEmits` em
  `<script setup lang="ts">`.
- `.claude/skills/vue-unocss-styling-best-practices` — classes utilitárias/variáveis do tema Max
  ao ajustar estilos (Opção A/B da seção 7).
- `.claude/skills/vue-eslint-stylelint-quality-standards` — padrões de lint (4 espaços, aspas simples,
  sem trailing commas, ordem Template→Script→Style).
- `.claude/skills/vue-vitest-testing-best-practices` — ajustar/validar os testes existentes.
- `.claude/skills/frontend-design-best-practices` — garantir fidelidade visual pós-remoção do
  `.p-inputtext` (altura, placeholder, estados disabled/caution/error).
- `.claude/skills/systematic-debugging-best-practices` — apoio caso a máscara ou a validação
  apresentem regressão após a troca do wrapper.

---

## 10. Riscos e pontos de atenção

1. **Ordem — `InputBase` primeiro (bloqueante):** `MaxInputPhoneMail` usa `<InputBase>` como wrapper
   externo. O plano do `InputBase` deve ser executado ANTES. Em especial, o `InputBase` migrado precisa:
   (a) continuar aceitando o `<input>` nativo no `<slot>` default; (b) generalizar os seletores globais
   `.p-inputtext` para também mirar `input` nativo (largura 100%, altura 36px, placeholder, disabled) —
   ver seção 7, Opção A. **Se isso não for feito no InputBase, usar a Opção B local.**
2. **Perda da classe `.p-inputtext`:** o `<input>` nativo não recebe `.p-inputtext`. Qualquer estilo
   global (do `InputBase` ou do tema) que dependa dessa classe deixará de ser aplicado ao campo.
   Auditar antes de dar por concluído (busca por `.p-inputtext` no repositório).
3. **Props `autoClear` e `slotChar`:** exclusivas do PrimeVue; devem ser removidas. São inertes/inválidas
   em `<input>` nativo. Confirmar que nenhum teste depende delas.
4. **`v-maska` sobre `<input>` nativo:** a diretiva `maska` foi projetada para `<input>` nativo, então
   a troca **melhora** a compatibilidade. Ainda assim, validar que `unmaskedValue.unmasked` continua
   emitindo o valor sem máscara e que os tokens custom (`#`, `@`, `%`) funcionam igual.
5. **`v-bind="attrs"` fallthrough:** com `<input>` nativo, atributos não reconhecidos (flags como
   `phone`, `whatsapp`, `email`) são renderizados como atributos DOM. Isso já acontecia com o PrimeVue
   (que também renderiza attrs no input). Não é regressão, mas confirmar que não gera warnings de
   atributo inválido no console (comportamento idêntico ao atual).
6. **Interação entre `v-model` e `v-maska`:** manter `v-model="temp_value"` (não converter para
   `:value`/`@input`) para preservar a ordem de atualização atual e evitar loops com o `watch(temp_value)`
   que emite `update:modelValue`.
7. **Regex e `libphonenumber-js` inalterados:** a validação não muda; qualquer alteração aqui é fora
   de escopo e proibida (a migração deve ser transparente).
8. **Sem regeneração de resolver:** o nome do arquivo não muda, então o `components-manifest.json`
   não precisa ser regenerado.
