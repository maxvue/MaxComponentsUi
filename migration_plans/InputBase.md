# Plano de Migração — InputBase (Independência do PrimeVue)

> Documento autossuficiente. Uma IA futura deve conseguir executar esta migração lendo
> APENAS este arquivo + o código-fonte de `src/components/InputBase.vue`.
> **NÃO** altere a API pública, estilos visíveis ou comportamento observável.

---

## 1. Componente

- **Nome:** `InputBase`
- **Caminho:** `src/components/InputBase.vue`
- **Nível de dificuldade:** `alta`
- **Papel:** Núcleo/wrapper de TODOS os inputs da lib. Fornece o layout de label flutuante,
  slots de ícone esquerdo/direito, os estados visuais (`done`/`error`/`caution`/`required`/`noStatus`),
  o modo `inLine` e a linha de mensagem de feedback abaixo do campo.
- **Impacto:** ~19 componentes `MaxInput*` embrulham seu conteúdo em `<InputBase>`
  (ex.: `MaxInputText`, `MaxInputSelect`, `MaxInputNumber`, `MaxInputCep`, `MaxInputCpfCnpj`,
  `MaxInputDatePicker`, `MaxInputSearch`, `MaxInputAutoComplete`, `MaxInputCheckbox`,
  `MaxInputRadio`, `MaxInputSwitch`, `MaxInputToggle`, `MaxInputTextArea`, `MaxInputTextList`,
  `MaxInputPhoneMail`, `MaxInputIconPicker`, `MaxInputFile`, `MaxInputTypeAddress`,
  `MaxInputCoordinate*`, `MaxInputMarkdown*`, etc.).
  **Este componente DEVE ser migrado PRIMEIRO** — destrava todos os demais inputs.

---

## 2. Dependências do PrimeVue

Imports atuais em `src/components/InputBase.vue` (linhas 41–45):

| Import | Linha | Uso no template | Função real |
|--------|-------|-----------------|-------------|
| `FloatLabel` (`primevue/floatlabel`) | 41 | linha 2 (`<FloatLabel variant="on" ...>` — elemento raiz) | Somente LAYOUT: wrapper `<span>` que posiciona o `<label>` flutuante sobre o input. Aqui usado com `variant="on"`. |
| `IconField` (`primevue/iconfield`) | 42 | linha 6 (`<IconField v-if="...">`) | Somente LAYOUT: container que alinha ícones à esquerda/direita do input. |
| `InputIcon` (`primevue/inputicon`) | 43 | linhas 7 e 11 (`<InputIcon>`) | Somente LAYOUT: posiciona um único ícone dentro do `IconField`. |
| `Message` (`primevue/message`) | 45 | linhas 17–22 (`<Message size="small" variant="simple">`) | Linha de feedback/erro/aviso abaixo do campo. Usa slot `#icon`. |

**Observação-chave:** Nenhum desses 4 componentes controla estado/lógica — são todos apenas
apresentação. Toda a lógica reativa já está em `computed`s locais (`isError`, `displayMessage`).
Portanto a migração é 100% de layout + CSS, sem necessidade de biblioteca headless.

### Tokens de tema PrimeVue consumidos (via SCSS)

O bloco `<style>` referencia variáveis geradas pelo preset `floatlabel` do PrimeVue
(`@primeuix/themes`), aplicadas globalmente por `MaxStyle`:

- `--max-floatlabel-on-border-radius`
- `--max-floatlabel-on-active-background`
- `--max-floatlabel-active-font-size`
- `--max-floatlabel-active-font-weight`

E seletores de classe do PrimeVue usados no CSS que precisam continuar funcionando OU ser
substituídos por classes próprias:
- `.p-inputicon` (linha 158–160 — override de `z-index`)
- `.p-message-content`, `.p-message-text` (estilização da mensagem, linhas 225–232, 249–256, 366–377)
- `.p-inputtext`, `.p-select`, `.p-select-label`, `.p-datepicker`, `.p-autocomplete`,
  `.p-select-dropdown`, `.p-floatlabel`, `.p-component`, `.p-disabled`
  (aplicados a inputs FILHOS, que serão migrados em planos próprios).

> ATENÇÃO (dependência transitiva): muitos seletores `.p-*` no `<style>` do InputBase miram
> elementos renderizados pelos INPUTS FILHOS (`.p-inputtext`, `.p-select-label`, etc.), não pelo
> próprio InputBase. Ver seção 10 (Riscos).

---

## 3. Dependências internas (preservar)

- **`MaxIcon`** (`src/components/MaxIcon.vue`) — usado para: ícones esquerdo/direito (linhas 8, 12),
  ícone da mensagem (linha 19) e ícones de status done/caution/error (linhas 25, 28, 31).
  NÃO migrar aqui; já é independente do PrimeVue. Recebe `:icon`, `:size`, `:light`, `:dark` e
  atributos utilitários (`color-green-700`, `color-orange-600`, `color-red-700`).
- **`@maxvue/max-use` → `hasContent`** (import na linha 39). Type-guard que retorna `false` para
  vazio/null/undefined e trata strings via `trim().length > 0`. Usado em `isError` e
  `displayMessage`. Fonte real: `../MaxUse/src/Helpers/Types/hasContent.ts`. Comportamento a
  preservar EXATAMENTE (inclui tratamento de `'null'`/`'undefined'` como string).
- **`SelectGroupOptions`** (`src/types` → `src/types/index.ts`, linha 111) — usado apenas na
  tipagem da prop `groupOptions`. Manter o import de tipo.
- **Stores:** Nenhuma store Pinia é usada diretamente por InputBase (o `useIconStore` é usado por
  dentro de `MaxIcon`, transparentemente). Nada a fazer aqui.

---

## 4. API pública a preservar (contrato inviolável)

A migração deve ser **transparente** para os ~19 inputs consumidores. NADA abaixo pode mudar.

### Props (interface `Props`, com `withDefaults`)

Manter TODAS as props exatamente como declaradas (linhas 52–127), com os mesmos nomes, tipos e
defaults (linhas 129–139). Lista completa:

`value`, `modelValue`, `class`, `icon`, `i`, `disabled`, `float`, `msg`, `message`, `iconMessage`,
`label`, `done`, `error`, `caution`, `required`, `textCenter`, `textRight`, `dark`, `light`,
`default`, `options`, `groupOptions`, `iconLeft`, `iconRight`, `loadOptions`, `optionValue`,
`optionLabel`, `optionName`, `iconDark`, `iconLight`, `iconPos`, `inLine`, `noDone`, `noCaution`,
`noError`, `noStatus`, `noIcon`.

Defaults obrigatórios:
```ts
value: '', textCenter: false, dark: 0.5, done: undefined, caution: undefined,
error: undefined, light: false, iconPos: 'left', inLine: false
```

> Nota: `value`, `modelValue`, `options`, `groupOptions`, `loadOptions`, `optionValue`,
> `optionLabel`, `optionName`, `default` são propriedades da interface mas NÃO são usadas no
> template do InputBase — existem para tipar `v-bind="props"` vindo dos inputs filhos. **Mantê-las
> mesmo assim** (removê-las quebra o `v-bind="props"` dos consumidores por tipagem).

### Emits

Nenhum `defineEmits` no InputBase. Não introduzir novos emits.

### Slots

- **Slot default** (`<slot></slot>`): renderizado DENTRO do `IconField` quando há ícones
  (linha 10) OU direto (linha 15, `<slot v-else>`) quando não há ícones. É onde o input filho
  (ex.: `<InputText>`) é inserido. **Comportamento a preservar:** o slot default DEVE ficar entre
  o ícone esquerdo e o ícone direito quando ambos existirem.

### v-model

- InputBase não faz `v-model` próprio — apenas repassa (o input filho é quem gerencia o modelo).
  Preservar: nenhuma lógica de v-model aqui.

### Comportamento observável (computeds — replicar 1:1)

1. **`isError`** (linha 141):
   ```ts
   (!props.noStatus && typeof props.error === 'string' && hasContent(props.error))
     || props.error === true
     || props.done === false
   ```
2. **`displayMessage`** (linhas 143–149): precedência →
   `error` (string com conteúdo) → `caution` (string com conteúdo) → `message ?? msg` (se conteúdo)
   → `false`.
3. **Renderização condicional dos ícones de status** (mutuamente exclusiva, nesta ordem):
   `is-done` (done && !noDone && !noStatus) → `is-caution` (caution && !noCaution && !noStatus)
   → `is-error` (error && !noError && !noStatus) → `required` (`*`, se required && !noStatus).
4. **Ícones esquerdo/direito**: bloco `IconField` só aparece se `icon ?? i ?? iconLeft ?? iconRight`.
   Ícone esquerdo se `!noIcon && (iconLeft || iconPos==='left')`;
   ícone direito se `!noIcon && (iconRight || iconPos==='right')`.
   Fonte do ícone esquerdo: `iconLeft ?? icon ?? i`; direito: `iconRight ?? icon ?? i`.
5. **Label**: modo `inLine` → `<div class="in-line-label">` (linha 3); senão, se `label` →
   `<label class="max-input-label active">` (linha 16).
6. **Classe raiz dinâmica** (linha 2): concatena flags `float done caution text-center text-right`
   `{class} error caution in-line`. Preservar TODAS as classes de saída (testes e CSS dependem
   delas). Note a duplicação intencional de `caution` na string original — o efeito é idempotente;
   pode-se manter uma única, desde que a classe `caution` continue presente.
7. **Spacer**: quando não há `displayMessage`, renderiza `<div class="message-spacer">` (linha 23)
   para manter a altura da grade (grid-template-rows: 36px 19px).

---

## 5. Estratégia de substituição

Tudo é layout → **HTML nativo + CSS**. **NÃO** é necessária biblioteca headless.

| PrimeVue | Substituir por |
|----------|----------------|
| `<FloatLabel variant="on">` (raiz) | `<div class="max-input-main-div ...">` como elemento raiz. O FloatLabel só provia posicionamento CSS do `<label>`; a lib já reimplementa o label em `.max-input-label.active` (linhas 162–173). Basta transformar a raiz num `<div>` (ou `<span>`) com `position: relative`. |
| `<IconField>` | `<div class="max-iconfield">` com `display:flex; align-items:center; position:relative`. |
| `<InputIcon>` | `<span class="max-inputicon">` posicionado absolutamente (esquerda/direita) sobre o input. Substituir o seletor `.p-inputicon` (usado só p/ override de `z-index`) por `.max-inputicon { z-index: unset; }`. |
| `<Message size="small" variant="simple">` + slot `#icon` | `<div class="input-message">` contendo `<MaxIcon v-if="iconMessage">` + `<span class="message-text">{{ displayMessage }}</span>`. Trocar seletores `.p-message-content`/`.p-message-text` por `.message-content`/`.message-text` (ver seção 7). |

### Tokens de tema (`--max-floatlabel-*`)

Esses 4 tokens deixarão de ser emitidos quando o preset PrimeVue sair. **Congelar seus valores**
como CSS vars no tema Max (`src/styles/style.ts` / `src/themes/`) OU substituir diretamente no
SCSS por valores literais equivalentes ao visual atual:
- `--max-floatlabel-on-border-radius` → tipicamente o mesmo radius dos inputs (ex.: `var(--max-border-radius)` ou `4px`).
- `--max-floatlabel-on-active-background` → cor de fundo do campo (ex.: `var(--background-0)`).
- `--max-floatlabel-active-font-size` → ~`0.75rem`.
- `--max-floatlabel-active-font-weight` → ~`500`.

> AÇÃO: antes de migrar, inspecionar em runtime (playground) os valores computados dessas 4 vars
> com o tema atual e fixá-los. Não "adivinhar" — capturar do DOM real via
> `getComputedStyle(document.documentElement).getPropertyValue('--max-floatlabel-...')`.

---

## 6. Passos de implementação (ordenados)

1. **Capturar valores dos 4 tokens `--max-floatlabel-*`** no playground (com PrimeVue ainda ativo)
   e registrá-los como CSS vars próprias em `src/styles/style.ts`/`src/themes/` (ou literais no SCSS).
2. **Remover imports PrimeVue** (linhas 41, 42, 43, 45). Manter imports de `hasContent`, `computed`,
   `MaxIcon`, `SelectGroupOptions`.
3. **Template — raiz:** trocar `<FloatLabel variant="on" class="max-input-main-div" :class="...">`
   por `<div class="max-input-main-div" :class="...">`. Manter a MESMA expressão `:class` (linha 2)
   sem alterações, para preservar todas as classes de estado.
4. **Template — bloco de ícones:** substituir `<IconField>` por `<div class="max-iconfield">` e cada
   `<InputIcon>` por `<span class="max-inputicon left">` / `<span class="max-inputicon right">`.
   Preservar as MESMAS condições `v-if` (linhas 6, 7, 11) e o `<slot></slot>` entre eles (linha 10).
   Preservar também o `<slot v-else></slot>` (linha 15).
5. **Template — label:** manter `.in-line-label` (linhas 3–5) e `.max-input-label.active`
   (linha 16) exatamente como estão (já são HTML nativo).
6. **Template — mensagem:** substituir o `<Message>` (linhas 17–22) por:
   ```html
   <div class="input-message" v-if="displayMessage">
       <MaxIcon :icon="iconMessage" v-if="iconMessage" :size="0.9" :light="light" :dark="dark" />
       <span class="message-text">{{ displayMessage }}</span>
   </div>
   <div v-else class="message-spacer"></div>
   ```
   Preservar o `v-else` do spacer (linha 23).
7. **Template — status/required:** manter os blocos `.is-done`, `.is-caution`, `.is-error`,
   `.required` (linhas 24–33) exatamente como estão (já usam `MaxIcon`/HTML nativo).
8. **Script:** manter `isError` e `displayMessage` idênticos (linhas 141–149).
9. **Estilos:** ajustar SCSS (seção 7): trocar `.p-inputicon` → `.max-inputicon`;
   `.p-message-content`/`.p-message-text` → `.message-content`/`.message-text` (ou aplicar direto em
   `.input-message`/`.message-text`); adicionar regras de layout para `.max-iconfield` e
   `.max-inputicon`. Substituir os 4 tokens `--max-floatlabel-*` conforme passo 1.
   MANTER os seletores `.p-inputtext`, `.p-select`, `.p-select-label`, `.p-datepicker`,
   `.p-autocomplete`, `.p-select-dropdown`, `.p-disabled` POR ENQUANTO (miram inputs filhos que
   ainda usam PrimeVue; serão limpos quando cada filho for migrado).
10. **Atualizar o teste** `tests/components/InputBase.test.ts` (ver seção 8): remover imports/globals
    de PrimeVue e ajustar seletores de mensagem se necessário.
11. **Rodar** `npm run type-check`, `npm run lint`, `npx vitest run tests/components/InputBase.test.ts`.
12. **Validação visual** no `npm run dev:playground` comparando lado a lado com a versão atual.
13. **Regenerar resolver** só se algum export mudar (não deve): `npx tsx src/scripts/generateResolver.ts`.

---

## 7. Estilos (reproduzir aparência atual)

O bloco `<style lang="scss">` (linhas 152–438) permanece quase inteiro. Mudanças pontuais:

- **Raiz `.max-input-main-div`** (linhas 153–414): já é a classe real da raiz; continua valendo.
  Mantém `display: grid; grid-template-rows: 36px 19px`.
- **Override de z-index:** trocar
  ```scss
  .p-inputicon { z-index: unset; }   // linhas 158–160
  ```
  por
  ```scss
  .max-inputicon { z-index: unset; }
  ```
- **Novas regras de layout** para os substitutos de IconField/InputIcon:
  ```scss
  .max-iconfield {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
  }

  .max-inputicon {
      position: absolute;
      display: flex;
      align-items: center;
      pointer-events: none;
      z-index: unset;

      &.left { inset-inline-start: 10px; }
      &.right { inset-inline-end: 10px; }
  }
  ```
  (ajustar offsets p/ casar com o padding interno atual do input; capturar do DOM real se preciso.)
- **Label flutuante** (`.max-input-label.active`, linhas 162–173): manter; apenas garantir que os
  4 tokens `--max-floatlabel-*` tenham valores (passo 1 da seção 6). É este bloco que substitui o
  posicionamento que o `<FloatLabel>` fazia.
- **Mensagem:** as regras que hoje miram `.input-message .p-message-content` e `.p-message-text`
  (linhas 225–232, 249–256, 366–377) devem mirar as novas classes:
  ```scss
  .input-message {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 6px;
      padding-top: 4px;
      color: var(--max-surface-400);

      .message-text {
          font-size: 10px !important;
      }
  }
  ```
  E dentro de `&.caution` / `&.error`, trocar `.input-message .p-message-text` por
  `.input-message .message-text` mantendo as cores (`var(--orange-600)` / `var(--max-red-600)`).
- **Estados/modificadores** `&.text-center`, `&.text-right`, `&.caution`, `&.error`, `&.in-line`,
  `[input-click]`, `[no-message]`, `[full]`, `[slim]`, `.no-dropdown`: **manter inalterados**. Os
  seletores `.p-*` internos a eles (ex.: `.p-select-label`) referem-se a inputs filhos e devem
  permanecer até esses filhos serem migrados.
- **Variáveis CSS do tema Max a preservar:** `--orange-600`, `--max-orange-500`, `--max-red-600`,
  `--background-{0,75,100,400,575,625,650}`, `--max-surface-400`, `--green-700`, `--red-700`.
- **UnoCSS:** os atributos utilitários no `MaxIcon` (`color-green-700`, `color-orange-600`,
  `color-red-700`) são regras custom do preset Max — não alterar.

> Regra de ouro: a saída visual (posição do label, ícones, mensagem, cores de estado, altura da
> grade) deve ser pixel-equivalente à atual. Use o playground para comparar.

---

## 8. Testes / verificação

### Arquivo de teste existente

`tests/components/InputBase.test.ts` importa hoje `FloatLabel`, `IconField`, `InputIcon`, `Message`
do PrimeVue e os registra em `global.components`. Após a migração:

1. **Remover** os imports PrimeVue (linhas 4–7) e o objeto `globalOptions.components`
   correspondente (ou deixá-lo vazio). `MaxIcon` continua importado.
2. Os asserts atuais continuam válidos, pois miram classes próprias:
   - `.in-line-label` existe/tem texto correto quando `inLine`.
   - `.max-input-label` NÃO existe quando `inLine`.
   - `hasIcon(wrapper, 'mdi:right')` para `iconRight`.
   - `.input-message` contém a mensagem de `caution`/`message`.
   - `hasIcon(wrapper, 'mdi:info')` para `iconMessage`.
3. `tests/setup.ts` já provê PrimeVue + Pinia globalmente e stuba `virtual:uno.css`, `v-tooltip`,
   `v-maska` — não precisa mudar.

### Novos casos de borda a cobrir (adicionar)

- `error === true` (boolean) → classe `error` presente na raiz e ícone `humbleicons:exclamation`.
- `done === false` → `isError` verdadeiro (classe `error`).
- `noStatus: true` → nenhum ícone de status nem `required` renderizado, mesmo com `error`/`caution`/`required`.
- `required: true` sem status → `.required` com texto `*`.
- Sem `message`/`msg`/`error`/`caution` → `.message-spacer` presente (mantém altura da grade).
- `iconLeft` + `iconRight` juntos → ambos os `MaxIcon` renderizam e o slot fica entre eles.
- `noIcon: true` → nenhum `.max-inputicon` renderizado mesmo com `icon` definido.

### Checklist manual (playground)

- [ ] Label flutuante posicionado idêntico ao anterior (offset, fundo, radius, font).
- [ ] Ícone esquerdo/direito alinhados sobre o input.
- [ ] Mensagem alinhada à direita, fonte 10px, cor por estado (cinza/laranja/vermelho).
- [ ] Altura da grade estável entre estados com e sem mensagem.
- [ ] Modo `inLine` com label à esquerda e fundo `--background-100`.
- [ ] Ícones de status done (verde), caution (laranja), error (vermelho), `*` (darkred).
- [ ] Inputs filhos (ex.: `MaxInputText`) seguem funcionando sem alteração.

### Comandos

```bash
npm run type-check
npm run lint
npx vitest run tests/components/InputBase.test.ts
npm run dev:playground   # validação visual
```

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills` (apenas as pertinentes a este componente):

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (padrão `InputBase` como wrapper, ordem Template→Script→Style, aliases de export). Essencial por
  ser o componente-núcleo da UI.
- `.claude/skills/vue-inputs-masks-validation-best-practices` — padrões de inputs, estados de
  validação (done/error/caution/required) e feedback, diretamente ligados ao papel do InputBase.
- `.claude/skills/vue-unocss-styling-best-practices` — regras utilitárias/UnoCSS do tema Max
  (`color-green-700`, etc.) e uso correto das CSS vars ao reproduzir os estilos.
- `.claude/skills/frontend-design-best-practices` — fidelidade visual pixel-a-pixel ao substituir
  FloatLabel/IconField/Message por HTML+CSS nativos.
- `.claude/skills/vue-typescript-best-practices` — manter a interface `Props` tipada e os
  `withDefaults` corretos em `<script setup lang="ts">`.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — 4 espaços, aspas simples, sem trailing
  commas, semicolons; garantir `npm run lint` limpo.
- `.claude/skills/vue-vitest-testing-best-practices` — ajustar/expandir `InputBase.test.ts` com
  Vitest + @vue/test-utils + happy-dom (remoção dos globals PrimeVue).
- `.claude/skills/vue-max-use-development-best-practices` — uso correto de `hasContent` de
  `@maxvue/max-use` (semântica de vazio/null preservada em `isError`/`displayMessage`).
- `.claude/skills/systematic-debugging-best-practices` — apoio à depuração de regressões visuais/CSS
  durante a substituição dos seletores `.p-*`.

---

## 10. Riscos e pontos de atenção

1. **MIGRAR PRIMEIRO.** ~19 inputs dependem de `InputBase`. Qualquer regressão aqui propaga para
   toda a biblioteca. Não migrar nenhum input filho antes deste estar validado.
2. **Seletores `.p-*` que miram FILHOS.** O `<style>` do InputBase estiliza elementos renderizados
   pelos inputs filhos (`.p-inputtext`, `.p-select`, `.p-select-label`, `.p-datepicker`,
   `.p-autocomplete`, `.p-select-dropdown`, `.p-disabled`). **NÃO remover esses seletores agora** —
   removê-los quebra a aparência dos filhos ainda baseados em PrimeVue. Só substitua cada um quando
   o input filho correspondente for migrado (cada plano de filho deve atualizar estes seletores em
   InputBase, ou o InputBase deve ganhar classes genéricas equivalentes que os filhos migrados
   também apliquem — decidir uma convenção, ex.: `.max-inputtext`).
3. **Tokens `--max-floatlabel-*` desaparecem** quando o preset PrimeVue sair. Capturar valores reais
   ANTES e congelá-los no tema Max, senão o label flutuante perde estilo (fundo/radius/fonte).
4. **`variant="on"` do FloatLabel** implicava um comportamento "always-on" (label sempre elevado).
   A lib já força `.max-input-label.active` (label sempre elevado), então o comportamento visual é
   preservado ao migrar para `<div>`. Não introduzir lógica de "float on focus/fill".
5. **Duplicação de `caution` na `:class`** (linha 2) é intencional/inócua; ao refatorar não altere a
   presença da classe `caution` — testes e CSS dependem dela.
6. **Props "fantasma"** (`value`, `modelValue`, `options`, `groupOptions`, `loadOptions`,
   `optionValue`, `optionLabel`, `optionName`, `default`) não são usadas no template mas SÃO exigidas
   pela tipagem de `v-bind="props"` dos consumidores. Manter todas.
7. **`Message` com `variant="simple"`** não desenha borda/fundo — a `<div>` substituta também não
   deve. Só reproduzir alinhamento à direita, ícone opcional e cor por estado.
8. **z-index do `.p-inputicon`** era sobrescrito para não cobrir o `MaxPopover` (comentário linha 157).
   Garantir que `.max-inputicon` também tenha `z-index: unset` e/ou `pointer-events: none` para não
   bloquear cliques em popovers/dropdowns.
9. **Ordem recomendada geral da migração da lib:** `InputBase` → inputs simples de texto
   (`MaxInputText`, `MaxInputNumber`, máscaras) → selects/autocomplete → componentes complexos
   (datepicker, iconpicker, file upload). Cada plano de filho referencia esta dependência.
10. **Testes globais.** `tests/setup.ts` ainda injeta PrimeVue globalmente; enquanto os filhos usam
    PrimeVue isso é necessário. Não remover o setup global do PrimeVue nesta etapa — apenas os
    imports diretos no `InputBase.test.ts`.
