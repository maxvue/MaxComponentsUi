# Plano de Migração — MaxInputSelect (independência do PrimeVue)

> Documento auto-suficiente. O executor deve conseguir realizar a migração lendo **apenas** este arquivo + os fontes referenciados. **Não modifique fontes ao gerar este plano.** Preserve API pública, estilos e comportamento.

---

## 1. Componente

- **Nome:** `MaxInputSelect`
- **Arquivo:** `src/components/MaxInputSelect.vue`
- **Nível de dificuldade:** alta
- **Objetivo:** Substituir o `Select` do PrimeVue (`primevue/select`) por uma implementação própria (headless), reimplementando: dropdown com posicionamento, busca/filtro, navegação por teclado, opções agrupadas (`SelectGroupOptions` via `optionGroupLabel`/`optionGroupChildren`), `optionLabel`/`optionValue`, carregamento assíncrono (`loadOptions` + `@before-show`), slots `option`/`optiongroup`/`value`, e estado de `loading`/`emptyMessage`.
- **Aliases de exportação:** conferir e preservar todos os aliases existentes em `src/index.ts` que apontam para este arquivo (ex.: `MaxInputSelect`, `Select`, `InputSelect` — verificar). Após alteração de arquivos `.vue`, rodar `npx tsx src/scripts/generateResolver.ts`.

### Pré-requisito de ordem
Este componente **depende de `InputBase` já migrado** (ver `migration_plans/InputBase.md`). Não iniciar antes que `InputBase.vue` esteja livre de PrimeVue.

### Recomendação estratégica (compartilhamento)
`MaxTagSelect`, `MaxPhoneField` e `MaxInputTypeAddress` **reutilizam este mesmo dropdown**. Portanto, **NÃO** implementar o dropdown inline dentro de `MaxInputSelect.vue`. Em vez disso, criar uma **primitiva headless compartilhada** (ex.: `src/components/internal/MaxDropdownPrimitive.vue` + composable `src/composables/useDropdown.ts`) que encapsule: posicionamento (Floating UI), filtro, navegação por teclado, agrupamento, virtual scroll e acessibilidade ARIA. `MaxInputSelect` consome essa primitiva. Os outros três componentes reaproveitam a mesma primitiva na sua própria migração.

---

## 2. Dependências do PrimeVue (trechos reais)

Import direto no `<script setup>`:

```ts
import Select from 'primevue/select';
```

Uso no template — **dois** blocos `<Select>` (agrupado e normal):

```html
<!-- AGRUPADO (quando props.groupOptions !== undefined) -->
<Select v-bind="{...props, ...attrs}" v-if="props.groupOptions !== undefined" :filter="props.filter"
    v-model="temp_value" :loading="loading" @before-show="(before_show as any)" :options="options"
    optionGroupLabel="label" optionGroupChildren="items" :optionValue="'value'" :optionLabel="'label'"
    ref="elem" :emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'"
    :editable="attrs.editable ?? false" :disabled="props.disabled">
    <template #option="slotProps"> ... </template>
    <template #optiongroup="slotProps"> ... </template>
    <template #value="value"> ... </template>
</Select>

<!-- NORMAL (v-else) -->
<Select v-bind="{...props, ...attrs}" v-else v-model="temp_value" :filter="props.filter"
    :loading="loading" @before-show="(before_show as any)" :options="options"
    :optionLabel="props.optionLabel" :optionValue="props.optionValue"
    :emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'"
    :editable="attrs.editable ?? false" :disabled="props.disabled">
    <template #option="slotProps"> ... </template>
    <template #value="value"> ... </template>
</Select>
```

Recursos do PrimeVue `Select` que precisam ser reproduzidos manualmente:
- **`v-model`** interno (`temp_value`).
- **`:filter`** — campo de busca no header do overlay.
- **`:loading`** — spinner enquanto `loadOptions` resolve.
- **`@before-show`** — hook disparado **antes** de abrir o overlay (usado para carregar opções assíncronas). CRÍTICO.
- **`:options`** — lista plana ou agrupada.
- **Agrupamento:** `optionGroupLabel="label"` + `optionGroupChildren="items"`.
- **`:optionValue` / `:optionLabel`** — chaves de valor e rótulo.
- **`:emptyMessage`** — texto quando não há resultados (default `'Nenhum registro encontrado'`).
- **`:editable`** — permite digitar valor livre (via `attrs.editable`, default `false`).
- **`:disabled`**.
- **Slots:** `#option`, `#optiongroup`, `#value`.
- **Virtual scroll** do overlay (CSS usa `.p-virtualscroller`, `max-height: 250px`).
- **Navegação por teclado** (setas, Enter, Esc, Home/End, type-ahead).
- **Classes CSS internas** que o SCSS depende: `.p-select`, `.p-select-label`, `.p-select-dropdown`, `.p-select-option`, `.p-select-option-selected`, `.p-select-overlay`, `.p-select-header`, `.p-select-list-container`, `.p-virtualscroller`, `.p-floatlabel`.

Dependência transitiva via `InputBase` (já tratada no plano do InputBase): `FloatLabel`, `IconField`, `InputIcon`, `Message`.

---

## 3. Dependências internas

| Dependência | Origem | Uso |
|---|---|---|
| `InputBase` | `./InputBase.vue` | Wrapper obrigatório externo. **Deve estar migrado antes.** |
| `Icon` | Componente `Icon` usado no template (`<Icon :icon=... :size=...>`) — verificar import real. No projeto o wrapper é `MaxIcon` (`./MaxIcon.vue`). Alinhar: usar `MaxIcon`. | Ícone da opção e do valor selecionado |
| `SelectGroupOptions`, `SelectItem` | `../types` (`src/types/index.ts`) | Tipagem das opções agrupadas |
| `isBlank` | `@maxvue/max-use` (fonte: `../MaxUse/src/Helpers/Types/isBlank.ts`) | `isBlank(props.modelValue)` para aplicar `default` |
| `watchDebounced` | `@maxvue/max-use` (re-export de VueUse, fonte `../MaxUse/src/Helpers/VueUse/index.ts`) | Aplicar valor default com debounce 500ms |
| `useAttrs` | `vue` | Passa `placeholder`, `emptyMessage`, `editable`, `category`, `color` etc. |

### Tipos relevantes (de `src/types/index.ts`)

```ts
export interface SelectItem {
    value: string | number | null | boolean;
    name?: string | null;
    label?: string | null;
    subLabel?: string | null;
    icon?: string | null;
    disabled?: boolean;
    selected?: boolean;
    color?: string | null;
    size?: string | null;
    text_align?: 'left' | 'center' | 'right';
    ddi?: string | number | null;
    sigla?: string | null;
    min?: string | number | null;
    max?: string | number | null;
    fases?: string | number | null;
}

export interface SelectGroupOptionsElement {
    label: string;
    items: SelectItem[];
}

export interface SelectGroupOptions extends Array<SelectGroupOptionsElement> {}
```

### `isBlank` (comportamento, de `../MaxUse`)
```ts
export function isBlank<V>(value: V, if_zero = false): boolean {
    return !hasContentFn(value as any, if_zero);
}
```
Retorna `true` quando o valor é vazio/nulo. (`0` conta como preenchido apenas se `if_zero=true`.)

---

## 4. API pública a preservar

> Assinaturas devem permanecer **idênticas** para não quebrar consumidores.

### Props (de `defineProps` + `withDefaults`)
```ts
withDefaults(defineProps<{
    modelValue: any;                       // valor selecionado (v-model)
    loadOptions?: () => Promise<any[]>;    // carregar opções ao abrir
    icon?: string | undefined;
    optionValue?: string;                  // default 'value'
    optionLabel?: string;                  // default 'label'
    optionName?: string;                   // default 'name'
    iconLeft?: string | undefined;
    iconRight?: string | undefined;
    i?: string | undefined;
    iconDark?: boolean | undefined | number | string;
    iconLight?: boolean | undefined | number | string;
    done?: boolean | undefined;
    error?: string | null | boolean | undefined;
    caution?: string | null | boolean | undefined;
    required?: boolean | undefined;        // default false
    iconMessage?: string | undefined;
    default?: string | number | boolean | null | undefined;
    options?: any[];                       // opções simples
    groupOptions?: SelectGroupOptions;     // opções agrupadas
    disabled?: boolean | undefined;        // default false
    filter?: boolean | undefined;          // default false
}>(), {
    modelValue: null, done: undefined, optionValue: 'value', optionName: 'name',
    filter: false, optionLabel: 'label', error: undefined, caution: undefined,
    required: false, default: undefined, disabled: false
});
```

### Atributos passados via `useAttrs` (não são props — repassados de fora)
Devem continuar funcionando: `placeholder`, `emptyMessage`, `editable`, `category`, `color`, além de todos os atributos-flag CSS (`small`, `slim`, `full`, `flex`, `transparent`, `no-dropdown`, `input-click`, `no-message` etc.) que caem no `InputBase` / `.max-input-main-div`.

### Emits
```ts
defineEmits(['update:modelValue', 'before-show']);
```
- `update:modelValue` — emitido quando `temp_value` muda (`watch(temp_value, val => emit('update:modelValue', val))`).
- `before-show` — emitido dentro de `before_show(event)` **antes** de carregar `loadOptions`.

### v-model
- `modelValue` in, `update:modelValue` out.
- Sincronização bidirecional: `watch(() => props.modelValue, val => temp_value.value = val)`.

### Slots
| Slot | Props expostas | Comportamento default |
|---|---|---|
| `option` | `{ option, selected, index }` | Renderiza `label_div` com ícone (`option.icon`), label (`option[optionLabel] ?? option.label ?? option.name`, via `v-html`), subLabel (`sub_label ?? sub ?? subLabel`, `v-html`), imagem (`option.img` → `/media/images/...`), e badge `category` (quando `attrs.category === true`, mapeia `UTILITY→A`, `MARKETING→B`). |
| `optiongroup` | `{ option }` | Renderiza `option.label` do grupo. |
| `value` | (implícito — usa `option_selected`) | Renderiza ícone + texto do valor selecionado (`option_selected[optionName] ?? option_selected.name ?? option_selected.label`), com `color` da opção. |

> **Importante:** o slot default `#option` deve receber `{ option, selected, index }` exatamente com esses nomes, pois consumidores externos podem já usar `<template #option="{ option }">`.

### Lógica computada a preservar
- **`options` computed:** prioridade `optionsField` (assíncrono) → `props.options` → `props.groupOptions` → `[]`.
- **`option_selected` computed:** para `props.options`, `find(opt => opt[optionValue] === temp_value)`. Para agrupado, itera `Object.values(options).items`.
- **`before_show(event)`:** emite `before-show`; se `loadOptions`, seta `loading=true`, `optionsField = await loadOptions()`, `finally loading=false`.
- **`watchDebounced` (500ms, deep):** se `isBlank(modelValue)` e `default !== undefined`, `temp_value = default`.

---

## 5. Estratégia de substituição

### 5.1. Abordagem headless recomendada
Construir a **primitiva compartilhada** (ver §1) usando bibliotecas headless leves — **não** trazer outro framework de UI:

- **Posicionamento:** `@floating-ui/vue` (`useFloating`, middlewares `offset`, `flip`, `shift`, `size`, `autoUpdate`). Substitui o overlay/portal do PrimeVue. Renderizar o overlay via `<Teleport to="body">` para evitar `overflow` clipping, replicando o comportamento de `.p-select-overlay`.
- **Filtro:** input de busca no header do overlay. Filtragem case-insensitive sobre o campo `optionLabel` (e opcionalmente `name`/`subLabel`). Para grupos, filtrar `items` e ocultar grupos vazios. Debounce opcional (o PrimeVue filtra sincronamente — manter síncrono por padrão para não alterar comportamento).
- **Teclado:** reimplementar manualmente (não depender de libs pesadas). Ver §5.3.
- **Virtual scroll:** manter `max-height: 250px` com scroll. Só introduzir `vue-virtual-scroller` (`RecycleScroller`/`DynamicScroller`) se listas muito grandes forem esperadas; caso contrário, `overflow-y: auto` simples é suficiente e mais fiel visualmente. Decidir conforme a skill de virtual scroller (§9). **Default: scroll nativo**, pois o SCSS já estiliza scrollbar fina.
- **Acessibilidade:** roles ARIA `combobox`/`listbox`/`option`, `aria-expanded`, `aria-activedescendant`, `aria-selected`, `aria-disabled`.

### 5.2. Estrutura de arquivos proposta
```
src/composables/useDropdown.ts            # estado: open, activeIndex, filteredOptions, teclado
src/components/internal/MaxDropdownPrimitive.vue  # trigger + overlay teleportado + Floating UI
src/components/MaxInputSelect.vue         # consome a primitiva, mantém API pública
```

### 5.3. Navegação por teclado (paridade com PrimeVue Select)
No trigger fechado:
- `Enter` / `Space` / `ArrowDown` / `ArrowUp` → abre overlay (dispara `before_show` **antes** de abrir).
No overlay aberto:
- `ArrowDown` / `ArrowUp` → move `activeIndex` pelas opções **não desabilitadas e visíveis** (pulando headers de grupo).
- `Home` / `End` → primeira / última opção.
- `Enter` → seleciona opção ativa, fecha, foca trigger.
- `Esc` → fecha sem alterar, foca trigger.
- `Tab` → fecha.
- Type-ahead: digitação de letras (quando `filter=false`) foca a próxima opção cujo label começa com a sequência.
- Com `filter=true`: o input de busca recebe foco; setas navegam a lista; scroll automático para manter `activeIndex` visível (`scrollIntoView({ block: 'nearest' })`).

### 5.4. Preservação do fluxo assíncrono
`before_show` deve ser chamado **no instante em que o usuário aciona a abertura**, e o overlay só exibe a lista final após `loading` terminar (mostrar spinner/`loading` durante). Manter emit `before-show` com o `event` (pode ser o evento nativo ou um objeto sintético `{ originalEvent }` — documentar que consumidores geralmente ignoram o payload).

### 5.5. Compatibilidade de classes CSS
Para reaproveitar 100% do SCSS existente **sem reescrevê-lo**, a primitiva deve **emitir as mesmas classes** que o PrimeVue gerava:
`p-select`, `p-select-label`, `p-select-dropdown`, `p-select-overlay`, `p-select-header`, `p-select-list-container`, `p-select-option`, `p-select-option-selected`.
Isso minimiza risco visual. (Alternativa: renomear classes e portar o SCSS — maior risco. **Preferir manter os nomes `p-*`.**)

---

## 6. Passos de implementação

1. **Confirmar pré-requisito:** `InputBase.vue` migrado (sem imports `primevue/*`). Caso contrário, parar.
2. **Adicionar dependência** `@floating-ui/vue` ao `package.json` (dependência de runtime). Rodar `npm install`.
3. **Criar `src/composables/useDropdown.ts`:** estado reativo (`isOpen`, `activeIndex`, `search`), computed `visibleOptions`/`filteredGroups`, funções `open()/close()/toggle()/selectActive()/moveActive(delta)/typeAhead(char)`. Aceita config: `options`, `grouped`, `optionLabel`, `optionValue`, `filter`, callbacks `onBeforeShow`, `onSelect`.
4. **Criar `src/components/internal/MaxDropdownPrimitive.vue`:** trigger (com slot `value`), overlay teleportado com `useFloating`, header de filtro, lista com slots `option`/`optiongroup`, empty state, spinner de `loading`. Aplicar classes `p-*` (§5.5) e roles ARIA. Fechar ao clicar fora (`onClickOutside` de VueUse via `@maxvue/max-use`, se disponível — verificar) e ao rolar/resize (autoUpdate cobre posicionamento).
5. **Reescrever `MaxInputSelect.vue`:**
   - Manter **exatamente** as props/emits/defaults do §4.
   - Manter `attrs`, `temp_value`, `watch`, `options`, `option_selected`, `before_show`, `watchDebounced` **sem alterar a lógica**.
   - Substituir os dois `<Select>` por um único `<MaxDropdownPrimitive>` que recebe `:grouped="groupOptions !== undefined"` e as chaves corretas (`optionLabel/optionValue` fixos em `'label'/'value'` no modo agrupado, conforme original; dinâmicos no modo normal).
   - Reproduzir os slots `#option`, `#optiongroup`, `#value` com o **mesmo markup** (`label_div`, `labelz`, `subLabel`, `value-div`, `value-text`, badge `category`, `img`).
   - Manter o `<div class="placeholder-select">` condicional (`attrs.placeholder` e valor vazio).
   - Trocar `Icon` por `MaxIcon` (`./MaxIcon.vue`) — confirmar o import original e manter o mesmo componente já usado no projeto.
6. **Manter o bloco SCSS** de `MaxInputSelect.vue` **inalterado** (depende das classes `p-select-*` que a primitiva agora emite).
7. **Regenerar resolver:** `npx tsx src/scripts/generateResolver.ts`.
8. **Verificar aliases** em `src/index.ts` para `MaxInputSelect` — não remover nenhum.
9. **Type-check e lint:** `npm run type-check` e `npm run lint`.
10. **Testes** (§8).

---

## 7. Estilos

- **NÃO reescrever** o `<style lang="scss">` de `MaxInputSelect.vue`. Ele depende das classes `p-select`, `p-select-label`, `p-select-option`, `p-select-option-selected`, `p-select-overlay`, `p-select-header`, `p-select-list-container`, `p-virtualscroller`, `.placeholder-select`, `.label_div`, `.value-div`, `.subLabel`, `.category` (`UTILITY`/`MARKETING`), `[transparent]`, `[small]`, `[slim]`, `[no-dropdown]`.
- A primitiva **deve gerar essas classes** (§5.5). Auditar cada seletor SCSS do fonte e garantir que o DOM da primitiva contenha o elemento correspondente.
- Variáveis de tema a preservar: `--background-0/75/100/200/300/400/575/600/625/650/700/750`, `--blue-200/600/700`, `--orange-200`, `--red-b-500`, `--max-*`. Não hard-codar cores.
- Overlay teleportado: garantir que estilos globais (não-scoped, como já é o caso — o `<style lang="scss">` do fonte **não** é `scoped`) alcancem o overlay no `body`. Manter o bloco **não-scoped**.
- `z-index`: replicar `.p-select-header { z-index: 1 }` e cuidar da sobreposição com `MaxPopover` (ver comentário em `InputBase`: `.p-inputicon { z-index: unset }`).
- UnoCSS: manter uso das utilities customizadas conforme `vue-unocss-styling-best-practices` (§9).

---

## 8. Testes / verificação

Framework: **Vitest + @vue/test-utils + happy-dom**. Setup global em `tests/setup.ts` (mocka `fetch`, `localStorage`, `getComputedStyle`, `virtual:uno.css`, provê PrimeVue+Pinia, stubs `v-tooltip`/`v-maska`). Rodar arquivo único:
```bash
npx vitest run tests/components/MaxInputSelect.test.ts
```

Casos obrigatórios (paridade comportamental):
1. **v-model:** montar com `modelValue`, selecionar opção → emite `update:modelValue` com o `optionValue` correto; alterar `modelValue` externo atualiza a exibição.
2. **Opções simples** (`options`) com `optionLabel`/`optionValue` customizados.
3. **Opções agrupadas** (`groupOptions`): renderiza header de grupo e itens; `option_selected` encontra valor dentro do grupo.
4. **Filtro** (`filter=true`): digitar no header filtra a lista; grupos vazios somem; `emptyMessage` aparece quando nada casa.
5. **Teclado:** ArrowDown/ArrowUp movem ativo; Enter seleciona; Esc fecha; Home/End.
6. **loadOptions / before-show:** ao abrir, emite `before-show` **antes** de resolver; `loading` verdadeiro durante; opções vêm de `optionsField` após resolver.
7. **default + isBlank:** com `modelValue` em branco e `default` definido, após debounce `temp_value` vira `default` (usar `vi.useFakeTimers` para os 500ms).
8. **Slots:** `#option`, `#optiongroup`, `#value` customizados sobrescrevem o markup default.
9. **placeholder:** `.placeholder-select` visível quando `attrs.placeholder` e sem valor.
10. **disabled:** trigger não abre.
11. **Snapshot de classes:** assegurar presença de `.p-select`, `.p-select-label`, `.p-select-option` para não quebrar o SCSS.

Verificação manual: `npm run dev:playground`. Checar visual em estados `error`/`caution`/`done`, `[slim]`, `[transparent]`, `[no-dropdown]`, agrupado, com `img` e `category`.

Regressão dos consumidores: após esta migração, confirmar que `MaxTagSelect`, `MaxPhoneField`, `MaxInputTypeAddress` (que reusam o dropdown) ainda funcionam — idealmente já apontando para a primitiva compartilhada.

---

## 9. Skills necessárias (caminho + justificativa)

Base: `/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/<skill>/SKILL.md`

| Skill (caminho) | Justificativa |
|---|---|
| `.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md` | Convenções obrigatórias da biblioteca: `<script setup lang="ts">`, `InputBase` como wrapper, aliases em `index.ts`, `generateResolver.ts`, estrutura Template→Script→Style, testes Vitest. Regência geral da migração. |
| `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices/SKILL.md` | Posicionamento/lifecycle de elementos flutuantes e cleanup — orienta o overlay teleportado e o padrão de fechamento/posicionamento (referência para o comportamento tipo popover ao usar Floating UI). |
| `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices/SKILL.md` | Reimplementação da navegação por teclado (setas, Enter/Esc/Home/End, type-ahead), foco/`useActiveElement`, acessibilidade WAI-ARIA e prevenção de colisões durante digitação no filtro. |
| `.claude/skills/vue-inputs-masks-validation-best-practices/SKILL.md` | Padrões de inputs/validação da família de campos; relevante para consistência do input de filtro e integração com `InputBase` (estados error/caution/done). |
| `.claude/skills/vue-virtual-scroller-best-practices/SKILL.md` | Decisão sobre virtualizar a lista de opções (`RecycleScroller`/`DynamicScroller`) para grandes datasets, mantendo `max-height: 250px`. Consultar antes de introduzir a dependência. |
| `.claude/skills/vue-unocss-styling-best-practices/SKILL.md` | Uso correto das utilities customizadas do preset e do SCSS com variáveis de tema — para não quebrar o visual ao portar o overlay. |
| `.claude/skills/vue-vitest-testing-best-practices/SKILL.md` | Escrever/atualizar os testes Vitest + Vue Test Utils, mocks (fetch/timers) e padrões do `tests/setup.ts`. |

---

## 10. Riscos e pontos de atenção

1. **Ordem de dependência:** exige `InputBase` migrado. Bloqueante.
2. **Reuso por 3 componentes:** `MaxTagSelect`, `MaxPhoneField`, `MaxInputTypeAddress` dependem deste dropdown. Se não extrair a primitiva compartilhada, haverá duplicação e divergência. **Extrair a primitiva é decisão de arquitetura, não opcional.**
3. **Classes `p-select-*`:** o SCSS acopla-se fortemente às classes internas do PrimeVue. Manter os mesmos nomes na primitiva é a forma de menor risco; qualquer renomeação exige portar todo o SCSS e revalidar visualmente.
4. **`before-show` assíncrono:** timing crítico — deve disparar **antes** de abrir e o overlay deve refletir `loading`. Consumidores usam `loadOptions` para lazy-load; quebrar isso quebra formulários reais.
5. **`v-html` nos labels:** o markup usa `v-html` para `label`/`subLabel`. Manter (é comportamento existente), mas registrar como ponto de atenção de segurança (XSS) — não sanitizar silenciosamente para não mudar comportamento.
6. **`useAttrs` fall-through:** muitos comportamentos vêm de `attrs` (`placeholder`, `emptyMessage`, `editable`, `category`, `color`) e de atributos-flag CSS. `v-bind="{...props, ...attrs}"` era espalhado no `<Select>`; garantir que a primitiva/`InputBase` continue recebendo esses atributos e que flags CSS cheguem a `.max-input-main-div`.
7. **`editable`:** o PrimeVue permitia digitar valor livre. Reproduzir se algum consumidor usar; caso contrário, no mínimo não quebrar (default `false`).
8. **Teleport + estilos não-scoped:** o overlay vai para `body`; o `<style>` do fonte é **não-scoped** e precisa continuar assim para alcançar o overlay. Cuidado ao não adicionar `scoped`.
9. **z-index / MaxPopover:** conflitos de empilhamento já foram tratados no ecossistema (ver `InputBase`). Validar que o overlay aparece acima de popovers/modais.
10. **Virtual scroll x fidelidade visual:** introduzir `vue-virtual-scroller` muda a estrutura DOM (`.p-virtualscroller` era do PrimeVue). Se virtualizar, garantir que os seletores SCSS ainda casem; se não virtualizar, ainda assim manter um wrapper com classe `p-virtualscroller` para o CSS de `max-height`.
11. **Acessibilidade:** o PrimeVue já entregava ARIA. A reimplementação deve manter `combobox/listbox/option`, `aria-activedescendant`, foco gerenciado — risco de regressão de a11y.
12. **`option_selected` em grupos:** a lógica original itera `Object.values(options.value)` assumindo `.items`. Preservar exatamente para não quebrar a exibição do valor selecionado em modo agrupado.
13. **Payload de `before-show`:** o original repassa o `event` nativo do PrimeVue. Se emitirmos objeto diferente, consumidores que inspecionam o payload podem quebrar — documentar e manter formato compatível o quanto possível.
