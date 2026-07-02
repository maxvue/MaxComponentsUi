# Plano de Migração — MaxTagSelect (Independência do PrimeVue)

> Documento autossuficiente. Uma IA futura deve conseguir executar esta migração lendo
> APENAS este arquivo + o código-fonte de:
> - `src/components/MaxTagSelect.vue`
> - `src/components/MaxInputSelect.vue` (dropdown headless de referência)
> - `src/components/InputBase.vue`
> - `../MaxUse/src/Helpers/Browser/getColorFromVar.ts`
>
> **NÃO** altere a API pública, os estilos visíveis ou o comportamento observável.

---

## 1. Componente

- **Nome:** `MaxTagSelect`
- **Caminho:** `src/components/MaxTagSelect.vue`
- **Nível de dificuldade:** `alta`
- **Aliases de exportação** (em `src/index.ts`, linhas 70–72 — devem continuar apontando para o mesmo arquivo):
    - `MaxTagSelect`
    - `MaxInputSelectTag`
    - `MaxSelectTag`
- **Papel:** Select/dropdown que renderiza as opções e o valor selecionado como **tags coloridas**.
  É a mesma reimplementação de dropdown do `MaxInputSelect`, porém com colorização das tags via
  `getColorFromVar` / `contrastColor` (cor de fundo derivada da opção + cor de texto contrastante),
  estado de `hover` por opção e suporte a modo "botão" (`isButton`).

---

## 2. Dependências do PrimeVue (trechos reais)

Import atual em `src/components/MaxTagSelect.vue`:

```ts
import Select from 'primevue/select';   // linha 41
```

Uso no template (o único ponto PrimeVue a ser substituído):

```vue
<Select v-bind="{...props, ...attrs}" v-model="temp_value" :filter="props.filter" :loading="loading"
        @before-show="(before_show as any)" :options="options" :optionLabel="props.optionLabel"
        :optionValue="props.optionValue" :emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'"
        :editable="attrs.editable ?? false" :disabled="props.disabled">
    <template #option="slotProps"> ... </template>   <!-- render de cada opção como tag -->
    <template #value>                                <!-- render do valor selecionado como tag -->
        <div class="value-tag-div" ...> ... </div>
        <div v-else><MaxIconButton .../></div>       <!-- modo isButton -->
    </template>
</Select>
```

`InputBase` já foi (ou será) migrado separadamente — **não** é dependência PrimeVue direta aqui.
O `MaxIcon` e o `MaxIconButton` são componentes Max internos (não PrimeVue).

**Comportamentos do PrimeVue `Select` efetivamente utilizados por este componente:**

| Recurso PrimeVue | Onde | Precisa reimplementar? |
|------------------|------|------------------------|
| Abrir/fechar overlay (dropdown) | clique no campo | **Sim** |
| Evento `before-show` (dispara `loadOptions`) | `@before-show` | **Sim** — chamar `before_show` ANTES de abrir o overlay |
| `options` + `optionLabel` / `optionValue` | listagem | **Sim** |
| Slot `#option` (render por opção) | tag colorida + hover | **Sim** — expor `slotProps.option/selected/index` |
| Slot `#value` (render do valor) | tag do selecionado | **Sim** |
| `filter` (campo de busca no header) | quando `props.filter` | **Sim** — input de filtro no topo do overlay |
| `emptyMessage` | lista vazia | **Sim** — usar `attrs.emptyMessage ?? 'Nenhum registro encontrado'` |
| `disabled` | bloquear interação | **Sim** |
| `editable` | (repassado, uso marginal) | Manter a prop, sem regressão |
| `loading` | spinner ao carregar opções | **Sim** — reservado a `loadOptions` |
| Classes `.p-select`, `.p-select-label`, `.p-select-overlay`, `.p-select-option`, `.p-select-list`, `.p-select-header`, `.p-select-dropdown`, `.p-select-list-container`, `.p-virtualscroller` | estilos em `<style>` | **Sim** — o novo markup DEVE continuar emitindo estes seletores (ver §7) |

> **Regra de ouro:** o `InputBase` esconde o dropdown via `no-dropdown` (`.p-select-dropdown { display:none }`),
> e o `<style>` deste componente é inteiramente baseado nas classes `.p-select*`. A reimplementação headless
> **deve reemitir essas mesmas classes** para preservar 100% do CSS sem reescrevê-lo.

---

## 3. Dependências internas

| Símbolo | Origem | Uso |
|---------|--------|-----|
| `InputBase` | `./InputBase.vue` | Wrapper externo. Recebe `input-click` e `no-dropdown`. **Manter.** |
| `MaxIcon` | `./MaxIcon.vue` | Ícone dentro das tags de opção/valor. |
| `MaxIconButton` | `./MaxIconButton.vue` | Render alternativo quando `isButton` (usado no slot `#value`). |
| `getColorFromVar` | `@maxvue/max-use` | Resolve string de cor / var CSS → instância `Color`. |
| `contrastColor` | `@maxvue/max-use` | Cor de texto contrastante ao fundo da tag. |
| `isBlank` | `@maxvue/max-use` | Detecta valor vazio (aplica `default`). |
| `watchDebounced` | `@maxvue/max-use` | Watch com debounce (aplica `default`). |
| `SelectGroupOptions` | `../types` | Tipo das opções agrupadas. |

**Assinaturas relevantes de `@maxvue/max-use` (de `getColorFromVar.ts`):**

```ts
// getColorFromVar('var(--x)' | '--x' | '#fff' | 'rgb(...)' | ref) -> ColorInstance (lib "color")
//   '' -> Color('transparent');  usa getComputedStyle(document.documentElement) p/ resolver var()
export function getColorFromVar(color_var_value: MaybeRefOrGetter<string>): ColorInstance;

// contrastColor: se a cor é clara -> darken(0.5).hexa(); senão -> lighten(0.9).hexa()
export const contrastColor: (color_var_value: MaybeRefOrGetter<string>) => string;
```

`ColorInstance` expõe `.darken(n)`, `.hexa()`, `.isLight()` etc. (biblioteca `color`).

---

## 4. API pública a preservar

### Props (`defineProps` — manter EXATAMENTE, incluindo defaults)

```ts
withDefaults(defineProps<{
    modelValue: any;
    loadOptions?: () => Promise<any[]>;
    icon?: string;
    optionValue?: string;      // default 'value'
    optionLabel?: string;      // default 'label'
    optionName?: string;       // default 'name'
    iconLeft?: string;
    iconRight?: string;
    i?: string;
    iconDark?: boolean | number | string;
    iconLight?: boolean | number | string;
    done?: boolean;
    error?: string | null | boolean;
    caution?: string | null | boolean;
    required?: boolean;
    iconMessage?: string;
    default?: string | number | boolean | null;
    options?: any[];
    groupOptions?: SelectGroupOptions;
    disabled?: boolean;        // default false
    filter?: boolean;          // default false
    hasRemove?: boolean;
    isButton?: boolean;        // default false
    backgroundColor?: string;  // default 'var(--background-500)'
}>(), {
    modelValue: null, done: undefined, optionValue: 'value', optionName: 'name',
    filter: false, optionLabel: 'label', error: undefined, caution: undefined,
    required: false, default: undefined, disabled: false, isButton: false,
    backgroundColor: 'var(--background-500)'
});
```

### Emits (manter)

```ts
defineEmits(['update:modelValue', 'before-show']);
```

- `update:modelValue` — emitido quando `temp_value` muda (v-model).
- `before-show` — emitido ao abrir o overlay, ANTES de resolver `loadOptions`.

### Slots (manter nomes e slot props)

| Slot | Slot props expostos | Observação |
|------|---------------------|------------|
| `#option` | `option`, `selected`, `index` | Fallback interno renderiza a tag colorida (com `hover`). |
| `#value` | — (sem props) | Fallback interno renderiza a tag do valor; slot aninhado `#btn-right`. |
| `#btn-right` | — | Renderizado à direita dentro da tag de valor. |

### Atributos via `attrs` (fall-through) que DEVEM continuar funcionando

`placeholder`, `emptyMessage`, `editable`, `color`, `small`, `flex`/`full`, `transparent`, `slim`,
e demais atributos repassados a `InputBase` (`v-bind="{...props, ...attrs}"`).

### Comportamento a preservar

1. **v-model bidirecional:** `temp_value` inicia com `modelValue`; `watch(temp_value)` emite `update:modelValue`; `watch(modelValue)` sincroniza de volta.
2. **`loadOptions`:** ao abrir → `loading=true` → `optionsField = await loadOptions()` → `loading=false`. `before-show` emitido antes.
3. **Fonte das opções (`options` computed):** `optionsField` (se carregado) senão `props.options` senão `props.groupOptions` senão `[]`; cada opção recebe `hover ??= false`.
4. **`option_selected` computed:** localiza a opção cujo `optionValue` == `temp_value`; suporta agrupadas (itera `group.items`); default `{}`.
5. **`default` via `watchDebounced`** (deep, 500ms): se `isBlank(modelValue)` e `default !== undefined` → `temp_value = default`.
6. **Placeholder overlay:** quando `attrs.placeholder` definido e `temp_value` vazio, mostra `.tab-placeholder-select`.
7. **Modo `isButton`:** slot `#value` renderiza `MaxIconButton` em vez da tag.

> **Nota sobre "multi-seleção":** o código-fonte ATUAL opera em modo de **seleção única**
> (`temp_value` é escalar; `option_selected` retorna 1 opção). A colorização de tag e a infraestrutura
> já suportam a evolução para múltiplo. **A migração NÃO deve introduzir multi-seleção nova** — deve
> preservar o comportamento observável atual (single). Se/quando `modelValue` for array (múltiplo),
> o novo dropdown headless deve tratar `temp_value` como lista e renderizar N tags no slot `#value`
> (uma por item selecionado), reusando `getStyleColor(item, false, true)` por tag. Manter compatível com ambos.

---

## 5. Estratégia de substituição

**Reutilizar o MESMO dropdown headless criado para `MaxInputSelect`.** Este componente e o
`MaxInputSelect` são gêmeos: mesma lógica de `options`/`option_selected`/`before_show`/`loadOptions`/
`v-model`/`default`. A diferença é puramente de **apresentação** (tags coloridas vs. label simples).

Plano recomendado:

1. Extrair (ou reusar) o dropdown headless de `MaxInputSelect` em um componente compartilhado, p.ex.
   **`src/components/internal/MaxSelectCore.vue`** (headless, sem PrimeVue), que:
    - Renderiza um "trigger" (elemento raiz clicável) que emite as mesmas classes CSS (`.p-select`, `.p-select-label`).
    - Renderiza um overlay flutuante (`.p-select-overlay`) com lista (`.p-select-list` / `.p-select-option`),
      header de filtro opcional (`.p-select-header`) e container rolável (`.p-select-list-container` / `.p-virtualscroller`).
    - Expõe slots `#option` e `#value` com os mesmos slot props.
    - Emite `before-show`, gerencia `open/close`, `loading`, `emptyMessage`, `disabled`, `filter`, teclado.
2. `MaxTagSelect` consome `MaxSelectCore` e injeta APENAS os fallbacks de tag colorida nos slots
   `#option` / `#value` (reaproveitando `getStyleColor` / `getColorString`), mais o modo `isButton`.
3. **Overlay flutuante:** implementar posicionamento com `floating-vue` (já usado no ecossistema Max para
   popovers) OU um posicionamento manual leve. O CSS existente aplica `.p-select-overlay { transform: translateY(-10px) }`
   e usa `:has(.label-tag-div)` — o overlay real deve ser um elemento com `class="p-select-overlay"` contendo
   a lista, renderizado em um teleport para `body` (como o PrimeVue faz) para evitar clipping.

**Regra crítica:** manter a árvore de classes `.p-select*` intacta para não reescrever o `<style>`.

---

## 6. Passos de implementação

Ordem sugerida (após `InputBase` e `MaxInputSelect` já migrados — ver §10):

1. **Confirmar pré-requisitos:** `InputBase.vue` e `MaxInputSelect.vue` já independentes do PrimeVue,
   expondo o dropdown headless compartilhado (`MaxSelectCore.vue`). Se ainda não existir, este plano
   fica **bloqueado**; concluir `MaxInputSelect` primeiro.
2. **Remover import PrimeVue:** apagar `import Select from 'primevue/select';` (linha 41).
3. **Substituir `<Select>`** no template por `<MaxSelectCore>` (ou markup headless equivalente), repassando:
   `v-model="temp_value"`, `:filter`, `:loading`, `@before-show="before_show"`, `:options="options"`,
   `:optionLabel`, `:optionValue`, `:emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'"`,
   `:editable="attrs.editable ?? false"`, `:disabled="props.disabled"`.
4. **Manter os dois slots** `#option` e `#value` com o markup ATUAL (tags coloridas), incluindo:
    - `#option`: `.label-tag-div` com `:style="getStyleColor(option, option['hover'] ?? false, false)"`,
      handlers `@mouseenter`/`@mouseleave` que setam `hover` na opção correspondente em `options`,
      `MaxIcon` colorido, `.label-tag` (v-html do label), `.sub-label-tag`, `img` opcional.
    - `#value`: `.value-tag-div` com `:style="getStyleColor(option_selected, false, true)"`,
      `MaxIcon` + `.tag-value-text` + slot `#btn-right`; branch `v-else` com `MaxIconButton` quando `isButton`.
5. **Manter a lógica de script INTOCADA:** `getColorString`, `getStyleColor`, `temp_value`, watchers,
   `loading`, `optionsField`, `options`, `option_selected`, `before_show`, `watchDebounced`.
6. **Preservar props no `InputBase`:** manter `input-click` e `no-dropdown` no `<InputBase>` raiz e a
   `.tab-placeholder-select` condicional.
7. **Garantir emissão das classes `.p-select*`** pelo `MaxSelectCore` (trigger e overlay), para o `<style>`
   funcionar sem alterações.
8. **Teleport do overlay:** overlay renderizado em `body` (ou via floating-vue) com `class="p-select-overlay"`.
9. **Rodar:** `npm run type-check`, `npm run lint`, `npm run test` e a suíte específica (§8).
10. **Sem mudança no resolver/manifest** — nenhum arquivo `.vue` novo público é adicionado (o `MaxSelectCore`
    é interno; se for criado como `.vue` em `src/components/`, rodar `npx tsx src/scripts/generateResolver.ts`
    e, se necessário, marcá-lo como não-exportado). Preferir `src/components/internal/` para evitar exportação.

---

## 7. Estilos (cores das tags via getColorFromVar/contrastColor)

**Não reescrever o `<style lang="scss">`** — ele já cobre tudo e depende das classes `.p-select*`.
Preservar o bloco integralmente (`.max-select-tag`, `.label-tag-div`, `.value-tag-div`, `.p-select-option`,
`.p-select-header`, `.p-select-overlay`, `.p-select-list-container`, `[transparent]`).

### Lógica de cor (preservar exatamente — script)

```ts
const getColorString = (item) => item?.background_color ?? item?.backgroundColor ?? item?.tag_color
    ?? item?.tagColor ?? item?.['tag-color'] ?? item?.['background-color'] ?? 'unset';   // null-safe p/ item vazio

const getStyleColor = (item, hover = false, is_value = false) => {
    const color_string = getColorString(item);
    const default_color = is_value ? props.backgroundColor : 'var(--background-500)';
    const color = getColorFromVar(color_string === 'unset' ? default_color : color_string);
    let background = hover ? color.darken(0.2).hexa() : color.hexa();
    let text = contrastColor(background);
    if (color_string === 'unset' && !is_value) {
        background = hover ? 'rgba(0,0,0, 0.1)' : 'transparent';
        text = hover ? 'var(--background-600)' : 'var(--background-650)';
    }
    return { backgroundColor: background, color: text, borderRadius: '6px',
             padding: '0 6px !important', gap: 0 };
};
```

Pontos-chave de estilo:
- **Fundo da tag** = cor resolvida da opção (`background_color`/`tag_color`/etc.); em `hover` → `darken(0.2)`.
- **Texto da tag** = `contrastColor(background)` (contraste automático).
- **Opção sem cor (`unset`) e não-valor:** fundo transparente / `rgba(0,0,0,0.1)` no hover; texto cinza.
- **Valor sem cor:** usa `props.backgroundColor` (default `var(--background-500)`).
- **`hover` por opção** é estado reativo em `options` (setado via `@mouseenter/@mouseleave`) — o headless
  precisa permitir esses eventos por linha de opção.
- A cor do `MaxIcon` dentro das tags vem de `getStyleColor(...).color`.

> Atenção: no headless o overlay usa `:has(.label-tag-div)` para ajustar padding/gap das opções — manter
> a classe `.label-tag-div` no markup de opção para os seletores `.p-select-overlay:has(.label-tag-div)` valerem.

---

## 8. Testes / verificação

Não há teste dedicado em `tests/components/MaxTagSelect.test.ts` no repo hoje — **criar um** cobrindo a API
pública (Vitest + `@vue/test-utils` + happy-dom; setup global já provê PrimeVue/Pinia e mocka `getComputedStyle`
com valores de var CSS — ver `tests/setup.ts`).

Casos mínimos:

1. **Render + v-model:** monta com `options` e `modelValue`; seleciona uma opção → emite `update:modelValue` com o `optionValue`.
2. **Sincronização reversa:** alterar prop `modelValue` atualiza a tag exibida.
3. **`before-show` + `loadOptions`:** ao abrir, emite `before-show` e aguarda `loadOptions`; `loading` alterna; opções carregadas aparecem.
4. **Tag colorida:** opção com `background_color` (ou `tagColor`) renderiza `.label-tag-div` com `backgroundColor` resolvido e `color` contrastante (assert no `style` inline). Verificar também o slot `#value` (`.value-tag-div`).
5. **`hover`:** `@mouseenter` numa opção seta `hover=true` → fundo `darken(0.2)`.
6. **Opção sem cor:** fundo `transparent` e texto `var(--background-650)`.
7. **`default` + `isBlank`:** `modelValue` vazio + `default` definido → após debounce `temp_value === default`.
8. **`isButton`:** slot `#value` renderiza `MaxIconButton`.
9. **Placeholder:** `placeholder` definido e valor vazio → `.tab-placeholder-select` visível.
10. **Sem PrimeVue:** garantir ausência de `import ... 'primevue/select'` (teste de fonte ou snapshot de que `.p-select` provém do markup próprio).

Comandos:

```bash
npx vitest run tests/components/MaxTagSelect.test.ts
npm run type-check
npm run lint
```

Verificação manual: `npm run dev:playground` — abrir/fechar dropdown, filtro, hover, cores, modo botão,
`loadOptions`, teclado (setas/Enter/Esc).

---

## 9. Skills necessárias

Todas em `/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/`:

| Skill (caminho) | Justificativa |
|-----------------|---------------|
| `vue-max-components-ui-development-best-practices/SKILL.md` | Convenções da lib (InputBase, aliases, `<script setup>`, indentação 4, estilo SCSS com vars). Base para não quebrar padrões do repositório. |
| `vue-floating-vue-tooltips-popovers-best-practices/SKILL.md` | O overlay do dropdown deve flutuar/teleportar sem clipping; `floating-vue` é o mecanismo do ecossistema Max para posicionar overlays. Guia o posicionamento e teleport do `.p-select-overlay`. |
| `vue-keyboard-shortcuts-navigation-best-practices/SKILL.md` | Reproduzir a navegação por teclado que o PrimeVue `Select` oferecia (setas para navegar opções, Enter para selecionar, Esc para fechar, digitação para filtro). |
| `vue-unocss-styling-best-practices/SKILL.md` | Regras/utilitários UnoCSS custom e uso de CSS vars (`var(--background-500)`, etc.) presentes nos estilos das tags. |
| `vue-vitest-testing-best-practices/SKILL.md` | Padrões de teste (setup global, mocks de `getComputedStyle`/`fetch`) para escrever a suíte nova de `MaxTagSelect`. |

(Opcional, se o overlay usar virtual scroll: `vue-virtual-scroller-best-practices/SKILL.md` — o CSS referencia `.p-virtualscroller`.)

---

## 10. Riscos e pontos de atenção

1. **Ordem de dependência (crítico):**
   `InputBase` **→** `MaxInputSelect` (dropdown headless / `MaxSelectCore`) **→** `MaxTagSelect`.
   Este componente **NÃO** pode ser migrado antes de o dropdown headless do `MaxInputSelect` existir.
   Migrar fora de ordem duplicará a reimplementação do overlay.
2. **Reuso obrigatório:** `MaxTagSelect` e `MaxInputSelect` compartilham a lógica; evitar copiar/colar —
   extrair o núcleo (`MaxSelectCore`) para uma única fonte de verdade. Divergência causará regressão em um dos dois.
3. **Classes `.p-select*` são contrato de estilo:** o `<style>` inteiro (e o `no-dropdown` do `InputBase`,
   que faz `.p-select-dropdown { display:none }`) depende dessas classes. O headless DEVE reemiti-las.
   Seletor `:has(.label-tag-div)` exige manter a classe no markup de opção.
4. **`hover` por opção é mutação de estado dentro do computed `options`:** `options?.map(o => o.hover ??= false)`
   e os handlers `@mouseenter/@mouseleave` gravam em objetos de `props.options`. Preservar essa mutação
   (comportamento observável: fundo escurece no hover). Cuidado com listas readonly/reativas.
5. **Multi-seleção:** o framing da tarefa cita "seleção múltipla", mas o código atual é single. Não introduzir
   multi por conta própria; preservar o comportamento atual e deixar o núcleo preparado para array (§4, nota).
6. **`getStyleColor` depende de `getComputedStyle`** (via `getColorFromVar`) — em SSR/testes precisa do mock
   (já presente em `tests/setup.ts`). Fora do browser, `var()` não resolvidas caem em `transparent`.
7. **Teleport/overlay e z-index:** o overlay flutuante precisa ficar acima de `MaxPopover` e demais camadas;
   observar o override `.p-inputicon { z-index: unset }` do `InputBase` e o `.p-select-header` com `z-index:1`.
8. **`v-html` do label/sub_label:** o slot de opção usa `v-html` (`slotProps.option[optionLabel]`, `sub_label`) —
   manter, mas ciente de que conteúdo é confiado (mesma superfície de risco do original).
9. **`loadOptions` + `before-show`:** garantir que `before_show` seja chamado ANTES de abrir/renderizar o
   overlay (ordem de eventos), senão `loading`/opções assíncronas quebram.
10. **`filter` / `emptyMessage` / `editable`:** repassados via `attrs`/props; a reimplementação precisa honrar
    `attrs.emptyMessage ?? 'Nenhum registro encontrado'` e `attrs.editable ?? false` para não regredir.
11. **Não alterar `src/index.ts`** (aliases `MaxTagSelect`/`MaxInputSelectTag`/`MaxSelectTag`) nem o manifest,
    salvo se um novo `.vue` público for criado — nesse caso regenerar o resolver.
