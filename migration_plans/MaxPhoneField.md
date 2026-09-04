# Plano de Migração — MaxPhoneField (independência do PrimeVue)

> Documento auto-suficiente. Uma IA executora deve conseguir migrar `MaxPhoneField`
> lendo APENAS este arquivo + os fontes referenciados. NÃO altere código ao ler este plano;
> este é o plano, a execução é uma etapa posterior.
>
> Convenções obrigatórias (de `CLAUDE.md`): `<script setup lang="ts">`, indentação de 4 espaços,
> aspas simples, ponto-e-vírgula obrigatório, sem vírgula final (no trailing commas),
> ordem dos blocos no `.vue`: Template → Script → Style.

---

## 1. Componente

- **Nome:** `MaxPhoneField`
- **Arquivo:** `/home/johnattas/GitHub/MaxComponentsUi/src/components/MaxPhoneField.vue`
- **Nível de dificuldade:** alta
- **Função:** campo composto de telefone internacional. Combina um **seletor de país (DDI + bandeira)**
  com um **input de telefone mascarado**. O `v-model` externo é a string de dígitos
  `DDI + número` (ex.: `5511999998888`). Internamente, mantém `country` (objeto `DDIFlag`)
  e `phone` (string com máscara) separados, e sincroniza os dois sentidos.
- **Dependências PrimeVue atuais:** `primevue/select` (seletor de país) e `primevue/inputtext`
  (input do número). O objetivo da migração é **remover ambos**, reaproveitando o dropdown
  headless reimplementado em `MaxInputSelect` (ver §5) e um `<input>` nativo, **preservando
  100% da API pública, estilos e comportamento**.

---

## 2. Dependências do PrimeVue (trechos reais)

Imports atuais (`MaxPhoneField.vue`, linhas 35-36):

```ts
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
```

Uso no template (`MaxPhoneField.vue`, linhas 4-25):

```vue
<Select v-model="country" :options="country_ddi_flags" filter :filterFields="['name', 'value']">
    <template #option="slotProps">
        <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
            <div class="input-phone-label-div">
                <img :src="'https://flagcdn.com/w40/' + slotProps.option.sigla.toLowerCase() + '.png'" alt="flag" />
                <div class="labelz">
                    <div pt2 elipsis >{{ slotProps.option.label }}</div>
                </div>
                <div class="subLabel">( +{{ slotProps.option?.value }} )</div>
            </div>
        </slot>
    </template>
    <template #value="value: any">
        <div class="item-selected">
            <div class="item-flag">
                <img :src="'https://flagcdn.com/w40/' + value.value.sigla.toLowerCase() + '.png'" alt="bandeira" flex />
            </div>
            <div style="color: var(--background-600);">+ {{ value.value.value }}</div>
        </div>
    </template>
</Select>
<InputText type="text" slot-b v-model="phone" v-maska:unmaskedValue.unmasked="maskValue" flex :autoClear="false" slotChar=" " :placeholder="country.value === 55 ? '(99) 9 9999 - 9999' : ''" p0 fluid/>
```

**Detalhes do acoplamento PrimeVue que precisam ser recriados:**

- `<Select>` recebe o **objeto inteiro** como `v-model` (`country`, tipo `DDIFlag`), NÃO um valor primitivo.
  A slot `#value` recebe `{ value: DDIFlag }` (por isso `value.value.sigla` / `value.value.value`).
  A slot `#option` recebe `{ option: DDIFlag, selected, index }`.
- `filter` + `:filterFields="['name', 'value']"` → busca por nome do país e código DDI.
- O dropdown de seta é **escondido via CSS** (`.p-select-dropdown { display: none }`, linha 210-212) —
  o clique na bandeira/DDI abre o overlay.
- `<InputText>` é apenas um `<input>` estilizado; as props `slotChar`, `autoClear`, `fluid`, `slot-b`, `p0`, `flex`
  são atributos/utilitários; a máscara vem de `v-maska` (biblioteca `maska`, **não** PrimeVue).
- Seletores CSS PrimeVue usados no `<style>` que precisarão de novas classes equivalentes:
  `.p-select`, `.p-select-label`, `.p-select-dropdown`, `.p-select-overlay`, `.p-select-option`,
  `.p-inputicon`, `.p-inputtext`, `[slot-a]`, `[slot-b]`.

---

## 3. Dependências internas

| Dependência | Caminho | Papel | Ação na migração |
|---|---|---|---|
| `InputBase` | `src/components/InputBase.vue` | Wrapper externo (FloatLabel, ícones, mensagem, status). Já é o container. | **Manter**. Só deve estar migrado quando este for executado (ver §10). Não recriar aqui. |
| `MaxInputSelect` | `src/components/MaxInputSelect.vue` | Fornece o dropdown headless de países após a própria migração. | **Reutilizar o dropdown headless** dele (ver §5). Deve estar migrado ANTES (ver §10). |
| `country_ddi_flags` / `DDIFlag` | `src/constants/ddiFlags.ts` | Dados dos países: `{ ddi, name, label?, sigla, value, img? }`. `value === ddi`. | **Manter como está** — sem dependência PrimeVue. |
| `watchDebounced` | `@maxvue/max-use` → re-export de `@vueuse/core` (`../MaxUse/src/Helpers/VueUse/index.ts:486`) | Debounce da emissão do `v-model` (500ms). | **Manter** — VueUse puro, sem PrimeVue. |
| `refAutoReset` | `@maxvue/max-use` → `../MaxUse/src/Composables/useDefaultReset.ts` (alias, linha 67) e re-export VueUse (`Helpers/VueUse/index.ts:134`) | `noMask` reseta para `false` após 50ms (permite colar valor sem máscara). | **Manter** — sem PrimeVue. |
| `useMagicKeys` | `@maxvue/max-use` → re-export de `@vueuse/core` (`../MaxUse/src/Helpers/VueUse/index.ts:320`) | Detecta `Ctrl+V` para desligar a máscara ao colar. | **Manter** — sem PrimeVue. |
| `vMaska` (`v-maska`) | `maska/vue` | Máscara de telefone. | **Manter** — biblioteca independente. |

> IMPORTANTE: as três composables do MaxUse (`watchDebounced`, `refAutoReset`, `useMagicKeys`)
> são **re-exports diretos do VueUse** e não têm nenhum acoplamento com PrimeVue. Não precisam
> de reimplementação. O plano apenas exige preservá-las.

---

## 4. API pública a preservar

Fonte: `MaxPhoneField.vue` linhas 40-62. **Nada aqui pode mudar.**

### Props (`withDefaults(defineProps<{…}>(), { done: undefined, required: false, caution: undefined, noLabel: false, noIcon: false })`)

| Prop | Tipo | Default | Observação |
|---|---|---|---|
| `icon` | `string \| undefined` | — | repassado ao `InputBase` |
| `i` | `string \| undefined` | — | alias de ícone |
| `disabled` | `boolean \| undefined` | — | |
| `float` | `boolean \| undefined` | — | |
| `msg` | `string \| undefined` | — | |
| `message` | `string \| undefined` | — | |
| `iconMessage` | `string \| undefined` | — | |
| `label` | `string \| undefined` | — | default de exibição: `'Telefone' + String(props.noLabel)` (comportamento atual, preservar) |
| `done` | `boolean \| undefined` | `undefined` | |
| `error` | `string \| boolean \| undefined` | — | |
| `targetValue` | `string` | — | (declarada; não usada internamente — manter na assinatura) |
| `caution` | `string \| boolean \| undefined` | `undefined` | |
| `required` | `boolean` | `false` | |
| `noLabel` | `boolean` | `false` | |
| `noIcon` | `boolean` | `false` | |

### Model
- `const modelValue = defineModel<any>({ default: '' })` — `v-model` = string de dígitos `DDI+número`.

### Slot público
- `#option` com props `{ option, selected, index }` — **deve continuar existindo** e ser
  repassado ao dropdown de países (fallback: markup atual da bandeira/label/subLabel).

### Comportamentos observáveis a preservar (lógica do `<script setup>`, linhas 61-131)
1. `temp_value = country.value.value + phone (só dígitos)` — string concatenada.
2. Emissão de `modelValue` com **debounce de 500ms** (`watchDebounced`), só quando muda.
3. `watch(modelValue, …, { immediate: true })`: dado o valor externo, faz **parse do DDI**
   testando 3 → 2 → 1 dígitos contra `country_ddi_flags` e separa `country`/`phone`.
   Default: Brasil (`ddi === 55`).
4. `watch(phone, …)`: remove `0` inicial do número.
5. `Ctrl+V` com foco no input (`onFocus`) → `noMask = true` por 50ms (`refAutoReset`) para colar sem máscara.
6. Máscara dinâmica (`maskValue`, linhas 107-131):
   - `noMask` → aceita qualquer coisa (máscara larga de `$`).
   - país ≠ 55 → máscara livre `'%'`.
   - país 55 → celular vs. fixo: se o 5º dígito ∈ {6,7,8,9} usa `(##) 9 #### - ####$$`, senão `(##) #### - ####$$`.
   - Tokens: `#`=obrigatório dígito, `$`=opcional dígito, `@` e `%` = conjuntos especiais.
7. Placeholder do input = `'(99) 9 9999 - 9999'` quando `country.value === 55`, senão `''`.
   (Nota: no código atual está `country.value === 55` — comparação com objeto; preservar o texto exatamente.)

---

## 5. Estratégia de substituição

Objetivo: **zero PrimeVue** neste componente, mantendo pixel-behavior.

### 5.1 Seletor de país → dropdown headless de `MaxInputSelect`
Após a migração de `MaxInputSelect` (pré-requisito, §10), ele expõe um **dropdown headless próprio**
(reimplementação do `<Select>` do PrimeVue) com: overlay posicionado, filtro por campos, slot `#option`,
slot `#value` e model por objeto. Reaproveitar esse mesmo dropdown headless aqui, das seguintes formas
(escolher **A** se `MaxInputSelect` expuser um subcomponente headless reutilizável; senão **B**):

- **Opção A (preferida) — usar `<MaxInputSelect>` diretamente como seletor de país:**
  - `v-model="country"` (objeto `DDIFlag`), `:options="country_ddi_flags"`, `filter`,
    e `:optionValue` configurado para casar objeto inteiro (ver risco §10 sobre model-por-objeto).
  - Repassar a slot `#option` (bandeira + label + subLabel) e `#value` (bandeira + `+DDI`).
  - Aplicar `no-dropdown` (o `InputBase`/`MaxInputSelect` já tem a classe `no-dropdown` que
    esconde a seta — ver `InputBase.vue` linhas 383-393) em vez do CSS `.p-select-dropdown { display:none }`.
  - **Atenção:** `MaxInputSelect` já envolve tudo num `InputBase`. Como `MaxPhoneField` também usa
    `InputBase`, isso geraria `InputBase` aninhado. Portanto, se A for usada, o seletor de país
    deve ser o **componente headless interno** de `MaxInputSelect` (o dropdown sem o `InputBase`),
    não o `MaxInputSelect` completo. Confirmar na execução do plano de `MaxInputSelect` qual
    subcomponente headless foi extraído (ex.: `MaxSelectCore.vue` / `HeadlessSelect.vue`).
- **Opção B (fallback) — dropdown headless local:** se `MaxInputSelect` não expuser um núcleo
  headless reutilizável, reimplementar aqui um dropdown mínimo com as MESMAS primitivas que a
  migração do `MaxInputSelect` usou (Popover/overlay flutuante + lista + filtro). Reusar as
  primitivas de posicionamento já adotadas no projeto (ver §9, floating-vue / MaxPopover) para
  não introduzir uma segunda solução de overlay.

Em ambos os casos, manter:
- Seleção por **objeto** (`country: DDIFlag`), não por primitivo.
- `filter` buscando por `name` e por `value` (DDI).
- Escondimento da seta (via classe `no-dropdown`, não via seletor `.p-*`).

### 5.2 Input de telefone → `<input>` nativo
Substituir `<InputText …>` por `<input type="text" …>`:
- Manter `v-maska:unmaskedValue.unmasked="maskValue"` (diretiva `maska`, já importada).
- Manter `v-model="phone"`, `:placeholder`, atributos utilitários (`flex`, `p0`, `slot-b`).
- Props exclusivas do PrimeVue (`autoClear`, `slotChar`, `fluid`) → remover / traduzir:
  - `fluid` → largura 100% via CSS (o `<style>` já força `width` no input).
  - `slotChar`/`autoClear` eram inertes para o `<input>` nativo (eram consumidas pelo PrimeVue);
    o comportamento efetivo vem de `maska`. Remover sem impacto observável.
- Adicionar handlers `@focus` / `@blur` para alimentar `onFocus` (hoje o código já usa `onFocus`
  em `useMagicKeys`, mas **não há binding de focus no template atual** — ao migrar para `<input>`
  nativo, ligar `@focus="onFocus = true"` / `@blur="onFocus = false"` para que o `Ctrl+V` sem
  máscara funcione como pretendido; isso corrige/mantém a intenção original).

### 5.3 InputBase
Manter `<InputBase>` como raiz, exatamente com as mesmas `v-bind="props"` e props derivadas
(`:label`, `:icon-right`, `:done`, `:error`, `:caution`, `:value="temp_value"`).

---

## 6. Passos de implementação

1. **Pré-condição:** confirmar que `InputBase` e `MaxInputSelect` já foram migrados (sem PrimeVue).
   Se `MaxInputSelect` ainda depender de `primevue/select`, **parar** e migrar aquele primeiro (§10).
2. Remover imports `import Select from 'primevue/select'` e `import InputText from 'primevue/inputtext'`.
3. **Seletor de país:**
   - Importar o núcleo headless de select fornecido pela migração de `MaxInputSelect`
     (nome exato a confirmar na execução — ver §5.1 Opção A) OU montar o dropdown local (Opção B).
   - Ligar `v-model="country"` (objeto), `:options="country_ddi_flags"`, `filter`,
     filtro por `['name', 'value']`.
   - Repassar slot `#option` (fallback = markup atual: `<img>` flagcdn + `.labelz` + `.subLabel`).
   - Definir slot `#value` = bandeira (`item-flag`/`img`) + `+ {{ country.value }}`.
   - Aplicar classe `no-dropdown` para esconder a seta.
4. **Input de telefone:** trocar `<InputText …>` por `<input type="text" slot-b flex p0 …>`:
   - `v-model="phone"`, `v-maska:unmaskedValue.unmasked="maskValue"`,
     `:placeholder="country.value === 55 ? '(99) 9 9999 - 9999' : ''"`.
   - Adicionar `@focus="onFocus = true"` e `@blur="onFocus = false"`.
5. **Script:** manter INTACTO todo o `<script setup>` (linhas 30-132), exceto os dois imports removidos
   no passo 2. Preservar: `temp_value`, `only_numbers`, `country`, `phone`, `noMask` (`refAutoReset`),
   `onFocus`, `useMagicKeys`, os três `watch`, `watchDebounced` (500ms) e `maskValue`.
6. **Estilos:** ver §7 — renomear os seletores `.p-*` para as classes das novas primitivas headless,
   mantendo as regras visuais idênticas.
7. **Manifesto de auto-import:** rodar `npx tsx src/scripts/generateResolver.ts` se o conjunto de
   componentes mudar (só se um novo `.vue` headless for adicionado). Se apenas editar
   `MaxPhoneField.vue`, o manifesto não muda.
8. **Verificação:** `npm run type-check`, `npm run lint`, `npm run test` e teste manual no playground (§8).

---

## 7. Estilos

O bloco `<style lang="scss">` (linhas 134-273) referencia classes PrimeVue. Mapear para as classes
das novas primitivas headless (nomes definitivos vêm da migração de `MaxInputSelect`), preservando as regras:

| Seletor PrimeVue atual | Substituto (classe headless) | Regra a preservar |
|---|---|---|
| `.input-phone .inputs-div .p-select` | classe raiz do select headless | `height:36px; background:transparent; border:none; width:80px` |
| `.p-select-label` | label/valor do select headless | `height:36px; background:transparent; padding:0`; contém `.item-selected` |
| `.p-select-dropdown { display:none }` | usar classe `no-dropdown` do `InputBase` | esconder a seta |
| `.p-inputicon` | classe de ícone do `InputBase` migrado | `transform: translateY(-2px)` |
| `.p-inputtext` | `input` nativo | `padding: 0 2px` |
| `.p-select-overlay` | overlay do dropdown headless | `display:grid; grid-template-rows:auto 1fr; overflow:hidden` |
| `.p-select-option` | item da lista headless | `gap:0; display:grid` |

Classes/estilos que **NÃO mudam** (não dependem de PrimeVue): `.input-phone`, `.inputs-div`
(grid `auto 1fr`, borda, `focus-within`, `height:36px`), `.item-selected`, `.item-flag`,
`.input-phone-label-div`, `.labelz`, `.subLabel`, `[slot-a]`/`[slot-b]` (posicionamento em grid),
regras de `img` (bandeiras). Manter todos os `var(--…)` (ex.: `--max-inputtext-border-radius`,
`--max-inputtext-border-color`, `--max-inputtext-focus-border-color`, `--background-600/650/750`).

Utilitários UnoCSS presentes (`pt2`, `elipsis`, `flex`, `p0`, `pr10`) vêm do preset local
(`src/presetMaxUno.ts`) — manter.

---

## 8. Testes / verificação

1. **Type-check:** `npm run type-check` (vue-tsc) — sem erros; assinatura de props inalterada.
2. **Lint:** `npm run lint` (ESLint + Stylelint) — 4 espaços, aspas simples, `;`, sem trailing comma.
3. **Testes unitários:** `npx vitest run tests/components/MaxPhoneField.test.ts` (se existir; caso
   contrário, criar cobrindo os itens abaixo). Setup global (`tests/setup.ts`) já mocka `fetch`,
   `localStorage`, `getComputedStyle`, Pinia e diretivas `v-tooltip`/`v-maska`.
4. **Casos funcionais (equivalência com o original):**
   - `v-model = '5511999998888'` → `country.ddi === 55`, `phone` = número mascarado de celular.
   - `v-model` com DDI de 1/2/3 dígitos → parse correto (loop 3→2→1), default Brasil se não achar.
   - Digitar número no input → após 500ms, `update:modelValue` emite `DDI + dígitos` (debounce).
   - Número iniciado com `0` → o `0` inicial é removido.
   - Trocar país no dropdown → `temp_value`/emissão atualizam; máscara muda (55 vs. outro).
   - `Ctrl+V` com input focado → máscara desligada por 50ms (colar valor bruto), depois reativa.
   - Regra celular vs. fixo (5º dígito ∈ {6,7,8,9}).
   - Slot `#option` sobrescreve o markup padrão do item.
   - Props `noLabel`, `noIcon`, `error`, `caution`, `done`, `required` refletem no `InputBase`.
5. **Playground manual:** `npm run dev:playground` — abrir dropdown (bandeiras carregam de
   `flagcdn.com`), filtrar por nome e por DDI, verificar overlay posicionado e seta escondida.
6. **Grep de regressão:** garantir que `MaxPhoneField.vue` não contém mais `primevue/`
   (`grep -n "primevue" src/components/MaxPhoneField.vue` deve retornar vazio).

---

## 9. Skills necessárias

Base: `/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/`

| Skill (caminho) | Justificativa |
|---|---|
| `.claude/skills/vue-inputs-masks-validation-best-practices` | Componente é um input com máscara dinâmica (`maska`), validação via `InputBase` (done/error/caution/required) e parsing DDI. Núcleo da migração do `<input>` e da máscara. |
| `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices` | O dropdown de países é um overlay flutuante posicionado (substitui `.p-select-overlay`). Guia o posicionamento headless reutilizando a solução de overlay/popover do projeto, evitando reintroduzir dependência PrimeVue. |
| `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices` | Lógica `Ctrl+V` via `useMagicKeys` + navegação por teclado do dropdown (setas/enter/esc) que o `<Select>` do PrimeVue fornecia e precisa ser recriada no headless. |
| `.claude/skills/vue-max-components-ui-development-best-practices` | Convenções específicas da lib (`InputBase`, aliases de export em `src/index.ts`, manifesto do resolver, tema `MaxStyle`, variáveis CSS). Essencial para manter a API pública e o padrão de componentes. |
| `.claude/skills/vue-unocss-styling-best-practices` | Estilos usam preset UnoCSS local (`pt2`, `flex`, `p0`, `elipsis`) + SCSS com `var(--…)`. Necessária ao remapear os seletores `.p-*` sem quebrar layout. |
| `.claude/skills/vue-max-use-development-best-practices` | Confirma que `watchDebounced`/`refAutoReset`/`useMagicKeys` são re-exports VueUse do `@maxvue/max-use` (sem PrimeVue) e como consumi-los corretamente. |

---

## 10. Riscos e pontos de atenção

1. **Ordem de migração (bloqueante):** `MaxPhoneField` depende de DOIS componentes já migrados:
   `InputBase` **e** `MaxInputSelect` (reuso do dropdown headless). **Migrar nesta ordem:**
   `InputBase` → `MaxInputSelect` (extraindo o núcleo headless de select) → `MaxPhoneField`.
   Se `MaxInputSelect` ainda importar `primevue/select`, este plano não pode ser concluído.
2. **`InputBase` aninhado:** `MaxInputSelect` já envolve seu select num `InputBase`. Reusar o
   `MaxInputSelect` inteiro dentro de `MaxPhoneField` (que também usa `InputBase`) criaria
   `InputBase` dentro de `InputBase` → layout/estados quebrados. Solução: reusar o **núcleo
   headless de select** (sem `InputBase`), não o componente completo. Confirmar o nome desse
   núcleo na execução da migração de `MaxInputSelect`.
3. **Model por objeto:** o seletor de país usa `v-model` = **objeto `DDIFlag` inteiro**, enquanto
   `MaxInputSelect` normalmente opera por `optionValue` (primitivo). Garantir que o núcleo headless
   suporte seleção por objeto OU adaptar (usar `sigla` como `optionValue` e mapear de/para o objeto).
   Vários países compartilham o mesmo `ddi`/`value` (ex.: `ddi: 1` para vários) — não usar `ddi`
   como chave única; usar `sigla`.
4. **Navegação por teclado e acessibilidade:** o `<Select>` do PrimeVue fornecia setas/enter/esc,
   `aria-*`, foco e fechamento ao clicar fora. Tudo isso precisa ser recriado no headless
   (ver skill de keyboard-navigation). Testar teclado explicitamente.
5. **Filtro por DDI numérico:** `:filterFields="['name', 'value']"` — `value` é `number`.
   O filtro headless deve converter para string ao comparar, senão a busca por código quebra.
6. **`onFocus` sem binding no original:** o template atual NÃO liga `@focus`/`@blur` ao input,
   então `onFocus` fica sempre `false` e o `Ctrl+V`-sem-máscara nunca dispara. Ao migrar para
   `<input>` nativo, **adicionar os handlers** para tornar o comportamento efetivo — documentar
   como correção intencional (não é regressão, pois o efeito colateral hoje é nulo).
7. **Comparação `country.value === 55` (placeholder):** `country.value` é um objeto `DDIFlag`,
   logo `=== 55` é sempre `false` (placeholder do input nunca aparece). Preservar o texto exato
   por segurança de equivalência; se desejar corrigir, seria `country.value.value === 55`, mas
   isso muda o comportamento observável — tratar como decisão separada, fora do escopo desta migração.
8. **Máscara dinâmica:** a lógica celular/fixo depende do 5º dígito e do país. Não simplificar;
   copiar `maskValue` verbatim (tokens `#`, `$`, `@`, `%` e as três máscaras).
9. **Debounce de 500ms:** testes precisam avançar timers (fake timers do Vitest) para observar a emissão.
10. **Bandeiras externas (`flagcdn.com`):** as imagens vêm de URL externa; em teste, `fetch`/imagens
    são mockadas — não asserir carregamento real, apenas o `src` gerado a partir de `sigla`.
11. **Aliases de export:** conferir em `src/index.ts` se `MaxPhoneField` tem aliases; a API exportada
    (nome/aliases) NÃO deve mudar. Rodar `generateResolver.ts` só se um novo `.vue` for criado.
P