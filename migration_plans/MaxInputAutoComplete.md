# Plano de Migração — MaxInputAutoComplete (independência do PrimeVue)

> Objetivo: reimplementar `MaxInputAutoComplete` sem depender do PrimeVue, preservando **API pública, estilos e comportamento**. Este documento é autossuficiente: a IA executora precisa apenas deste arquivo + o código-fonte referenciado.
>
> Nível: **alta** complexidade.
>
> Fonte real: `src/components/MaxInputAutoComplete.vue`.
> **Pré-requisito:** `InputBase` (`src/components/InputBase.vue`) já deve ter sido migrado para uma versão independente de PrimeVue antes deste componente.

---

## 1. Componente

`MaxInputAutoComplete` é um campo de entrada de texto com **sugestões filtráveis** (autocomplete/combobox). O usuário digita, um dropdown de opções filtradas aparece, e a seleção de uma opção define o valor do campo (via `v-model` / `update:modelValue`).

Características atuais (herdadas do wrapper sobre `primevue/autocomplete`):

- Filtro client-side sobre `props.options`, acionado a cada digitação (evento `complete`).
- `forceSelection: true` — o valor só é válido se corresponder a uma opção (texto livre não confirmado é descartado).
- Virtual scroller para listas grandes (`virtualScrollerOptions: { itemSize: 40 }`).
- Slot `#option` customizado renderizando **label** + **subLabel**.
- Placeholder padrão `'SELECIONE'`.
- Integração com `InputBase` para label flutuante, ícones e estados visuais (`done`/`error`/`caution`/`required`).
- Lógica de "preenchido corretamente" via `hasContent` + `toSearchableString` do pacote `@maxvue/max-use`.

### Localização e uso das partes reutilizáveis

Este componente **compartilha uma primitiva de dropdown + navegação por teclado** com `MaxInputSelect` e `MaxInputAutoCompleteApi`. A estratégia (Seção 5) recomenda extrair essa primitiva para um composable/componente headless comum, para que os três componentes possam reutilizá-la. **Se `MaxInputSelect` já foi migrado e criou essa primitiva, reutilize-a; não duplique.**

---

## 2. Dependências do PrimeVue (trechos reais)

No template (`src/components/MaxInputAutoComplete.vue`, linhas 2–12):

```vue
<InputBase v-bind="props" class="if" :value="temp_value" :done="isDone" :error="props.error" :caution="caution">
    <AutoComplete v-bind="props" :optionLabel="props.optionLabel" :suggestions="filtered_values" @complete="search" :forceSelection="true" :virtualScrollerOptions="{ itemSize: 40 }" v-model="temp_value" :placeholder="props.placeholder ?? 'SELECIONE'" @blur="isDone = testIsDone()" >
        <template #option="slotProps">
            <div class="autocomplete-item-select">
                <div class="autocomplete-item-select-label">{{ slotProps.option[props.optionLabel ?? 'label'] ?? slotProps.option.label }}</div>
                <div class="autocomplete-item-select-sub-label">{{ slotProps.option.subLabel ?? slotProps.option.sublabel ?? slotProps.option['sub-label'] }}</div>
            </div>
        </template>
        <template #content></template>
    </AutoComplete>
</InputBase>
```

No script (linha 20):

```ts
import AutoComplete from 'primevue/autocomplete';
```

### Símbolos PrimeVue a remover
| Símbolo | Origem | Papel atual |
|---|---|---|
| `AutoComplete` | `primevue/autocomplete` | Campo com sugestões, dropdown, filtro, teclado, virtual scroll |
| `forceSelection` (prop) | AutoComplete | Só aceita valor que casa com uma opção |
| `virtualScrollerOptions` | AutoComplete | Virtualização da lista |
| slot `#option` | AutoComplete | Template de cada item |
| slot `#content` | AutoComplete | (usado vazio — provavelmente para suprimir markup padrão; verificar necessidade) |
| evento `@complete` | AutoComplete | Dispara `search()` para popular `filtered_values` |
| `@blur` | AutoComplete | Recalcula `isDone` |

> **Dependência PrimeVue indireta via `InputBase`:** `FloatLabel`, `IconField`, `InputIcon`, `Message` (linhas 41–45 de `InputBase.vue`). Essas são resolvidas na migração do próprio `InputBase` (pré-requisito). Este plano assume `InputBase` já independente e com a **mesma API de props/slots**.

### Classes CSS PrimeVue referenciadas nos estilos (a preservar ou substituir)
`.p-autocomplete`, `.p-inputtext`, `.p-autocomplete-option-group`, `.p-autocomplete-overlay`, `.p-virtualscroller`, `.p-virtualscroller-content` (linhas 85–161). Ver Seção 7.

---

## 3. Dependências internas

| Dependência | Caminho | Uso |
|---|---|---|
| `InputBase` | `./InputBase.vue` | Wrapper obrigatório (layout, label, ícones, estados). **Já migrado.** |
| `hasContent` | `@maxvue/max-use` | Verifica se há conteúdo real (não vazio/null). Ver assinatura abaixo. |
| `toSearchableString` | `@maxvue/max-use` | Normaliza string (remove acentos, não-alfanuméricos, lowercase) para busca. |
| Convenções | `CLAUDE.md` | `<script setup lang="ts">`, InputBase como raiz, indentação 4 espaços etc. |

### Assinatura real de `hasContent` (`../MaxUse/src/Helpers/Types/hasContent.ts`)
```ts
export function hasContent<V>(value: V, if_zero = false): value is NonNullable<V>;
// string -> data.trim().length > 0; array -> length > 0; objeto -> Object.keys().length > 0; etc.
```

### Assinatura real de `toSearchableString` (`../MaxUse/src/Helpers/Strings/converters.ts`)
```ts
export function toSearchableString(value: RefString): string {
    // String(data).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}
```
`toSearchableString('Café com Leite')` → `'cafecomleite'`.

**Manter ambos os helpers exatamente como usados hoje** (requisito explícito da tarefa).

---

## 4. API pública a preservar

### Props (de `defineProps`, linhas 22–44 do fonte)
```ts
withDefaults(defineProps<{
    modelValue: any;
    options: any;
    icon?: string | undefined;
    i?: string | undefined;
    disabled?: boolean | undefined;
    optionLabel?: string | undefined;
    optionValue?: string | undefined;
    float?: boolean | undefined;
    msg?: string | undefined;
    message?: string | undefined;
    iconMessage?: string | undefined;
    placeholder?: string | undefined;
    label?: string | undefined;
    done?: boolean | undefined;
    error?: string | boolean | undefined;
    targetValue?: string;
    caution?: string | boolean | undefined;
    required?: boolean;
    forceSelection?: boolean;
    restoreOnInvalid?: boolean;
}>(), {
    modelValue: '',
    options: () => [],
    done: undefined,
    error: undefined,
    required: false,
    caution: undefined,
    optionLabel: 'name',
    forceSelection: true,
    restoreOnInvalid: true
});
```
**Preservar nomes, tipos e defaults idênticos.** (`optionLabel` default `'name'`.)

- `forceSelection` (default `true`) — repassado ao `AutoComplete`; quando ligado, só um objeto-opção é aceito como valor. Com `false`, texto livre digitado permanece no campo.
- `restoreOnInvalid` (default `true`) — quando o `forceSelection` zera o campo por texto sem correspondência, restaura o último valor válido em vez de deixar UI e pai dessincronizados. Com `false`, emite `update:modelValue` com `null`.

### Eventos
```ts
const emit = defineEmits(['update:modelValue']);
```
- `update:modelValue` — emitido em dois casos:
  - com o **objeto-opção**, quando `temp_value` passa a um valor não-string (opção selecionada);
  - com **`null`**, quando o valor é zerado: limpeza intencional (campo esvaziado pelo usuário) ou texto inválido com `restoreOnInvalid: false`. Nunca é emitido durante a digitação livre (valor string).

### `v-model`
- `modelValue` entra; `update:modelValue` sai. Sincronização bidirecional via os dois `watch` (linhas 70–75).

### Slots / comportamento de renderização de item (a preservar visualmente)
- Cada opção renderiza um bloco com **label** e **subLabel**:
  - label: `option[optionLabel ?? 'label'] ?? option.label`
  - subLabel: `option.subLabel ?? option.sublabel ?? option['sub-label']`
- Marcação e classes: `.autocomplete-item-select`, `.autocomplete-item-select-label`, `.autocomplete-item-select-sub-label` (estilos nas linhas 122–147). **Reproduzir HTML/classes idênticos.**

### Comportamento funcional a preservar
1. **Filtro:** a cada digitação, `search()` filtra `props.options` concatenando `item.value + item.label + item.name + item[optionValue ?? 'value']`, normalizando com `toSearchableString` e testando `.includes(toSearchableString(temp_value_string))`. (linhas 77–82). **Copiar essa lógica exatamente.**
2. **forceSelection:** valor livre não confirmado não deve ser aceito como seleção final. Reproduzir: ao `blur`, se o texto digitado não corresponde a uma opção, não emitir objeto (comportamento atual: `emit` só ocorre quando `temp_value` é objeto).
3. **temp_value_string** (linhas 50–54): deriva a string exibida/buscável do valor atual, seja string ou objeto (`value ?? label ?? id ?? [optionValue]`).
4. **Estados done/caution:** `testIsDone()` e `caution` computed (linhas 56–66) — **copiar sem alteração**.
5. **Placeholder** default `'SELECIONE'`.
6. **Virtual scroll** com item de 40px de altura (performance em listas grandes).

---

## 5. Estratégia de substituição

Substituir `<AutoComplete>` por uma implementação **headless** própria, idealmente reutilizando a primitiva compartilhada com `MaxInputSelect` / `MaxInputAutoCompleteApi`.

### 5.1 Estrutura de composição
```
InputBase (raiz — já migrado)
 └─ input de texto nativo (<input type="text">)  ← campo digitável
 └─ overlay/dropdown headless (teleport ao body)  ← lista de sugestões
      └─ item(s) renderizando label + subLabel
```

### 5.2 Campo de texto
- `<input type="text">` nativo com `v-model` local no texto digitado (`query`), `placeholder`, `disabled`, e eventos `@input`, `@focus`, `@blur`, `@keydown`.
- **Não** ligar o `v-model` do input diretamente ao `temp_value` objeto; separar: `query` (texto no input) vs `temp_value` (valor selecionado). Ao selecionar, `query` recebe o label da opção e `temp_value` recebe o objeto.

### 5.3 Dropdown headless + posicionamento (Floating UI)
- Usar **Floating UI** (`@floating-ui/dom` ou `@floating-ui/vue`) para posicionar o overlay ancorado no campo.
  - `computePosition(reference, floating, { placement: 'bottom-start', middleware: [offset(4), flip(), size()/autoUpdate] })`.
  - Usar `autoUpdate` para reposicionar em scroll/resize; **limpar no `onUnmounted`** (evitar leaks — ver skill de floating-vue para o padrão de cleanup).
  - `size` middleware para casar largura do overlay com o campo (equivalente ao antigo `.p-autocomplete-overlay { width: auto }`).
- **Alternativa aceitável:** se o projeto já possui `MaxPopover`/store de popover independente, reutilizar; verificar `src/stores/usePopoverStore` e `src/components/MaxPopover.vue` antes de introduzir dependência nova. Preferir reutilizar infra existente do repo.
- Overlay via `<Teleport to="body">` para evitar `overflow: hidden` de contêineres ancestrais.
- Abrir overlay quando: foco no input **e** há `filtered_values`. Fechar em: `blur` (com pequeno atraso para permitir clique no item), `Escape`, ou seleção.

### 5.4 Virtualização
- Manter o comportamento de virtual scroll para listas grandes (`itemSize: 40`).
- Usar `vue-virtual-scroller` (`RecycleScroller`) — o repo já tem skill dedicada. Config: altura fixa de item 40px, `:items="filtered_values"`, `:item-size="40"`.
- Se o volume esperado for pequeno, um `v-for` simples é aceitável, mas para paridade com o `virtualScrollerOptions` atual, **preferir RecycleScroller**.

### 5.5 Navegação por teclado (WAI-ARIA combobox)
Implementar handlers em `@keydown` no input:
| Tecla | Ação |
|---|---|
| `ArrowDown` | move `activeIndex` para o próximo item; abre overlay se fechado |
| `ArrowUp` | move `activeIndex` para o item anterior |
| `Enter` | seleciona o item em `activeIndex`; fecha overlay |
| `Escape` | fecha overlay; limpa `activeIndex` |
| `Tab` / `blur` | aplica `forceSelection` (descarta texto não confirmado); recalcula `isDone` |
| `Home` / `End` (opcional) | primeiro/último item |

- `activeIndex: Ref<number>` controla o item destacado (classe visual de hover/active).
- Ao mover com setas, garantir `scrollIntoView`/`scrollToItem` do RecycleScroller para o item ativo permanecer visível.
- Acessibilidade: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` no input; `role="listbox"` no overlay; `role="option"` + `aria-selected` nos itens. (Ver skill de keyboard-navigation para o padrão ARIA.)
- **Prevenir default** apenas para as teclas tratadas (setas, Enter quando overlay aberto, Escape) para não quebrar edição de texto.

### 5.6 Reutilização (primitiva compartilhada)
Extrair, se ainda não existir, um composable `useHeadlessDropdown` (ou componente `MaxDropdownList` headless) contendo: estado open/close, `activeIndex`, handlers de teclado, integração Floating UI e cleanup. `MaxInputAutoComplete`, `MaxInputSelect` e `MaxInputAutoCompleteApi` consomem essa primitiva. **Verificar primeiro se a migração de `MaxInputSelect` já criou isso.**

---

## 6. Passos de implementação

1. **Confirmar pré-requisitos:** `InputBase` migrado (independente) com mesma API de props/slots. Verificar se existe primitiva de dropdown headless compartilhada (de `MaxInputSelect`). Se não, criá-la conforme 5.6.
2. **Instalar/confirmar deps de runtime:** `@floating-ui/dom` (ou `@floating-ui/vue`) e `vue-virtual-scroller`. Confirmar se já são dependências do projeto (checar `package.json`); reaproveitar as existentes.
3. **Remover import PrimeVue:** apagar `import AutoComplete from 'primevue/autocomplete';`.
4. **Manter imports de helpers:** `hasContent`, `toSearchableString` de `@maxvue/max-use`; `ref`, `computed`, `watch`, `Ref` de `vue`.
5. **Manter `defineProps` / defaults / `defineEmits` idênticos** (Seção 4).
6. **Estado local:**
   - `query: Ref<string>` — texto no input (inicializar a partir de `temp_value_string`).
   - `temp_value: Ref` — valor selecionado (mantido da versão atual).
   - `filtered_values: Ref<any[]>`.
   - `open: Ref<boolean>`, `activeIndex: Ref<number>`.
   - Manter `temp_value_string`, `isDone`, `isRequiredDone`, `testIsDone`, `caution`, `list` **sem alteração** (linhas 46–66).
7. **`search()`:** copiar a função atual (linhas 77–82) — filtra `list` usando `toSearchableString`. Chamar em `@input` do campo (equivalente ao `@complete`). Após filtrar, `open = filtered_values.length > 0`, `activeIndex = 0`.
8. **Template:**
   - Raiz `InputBase v-bind="props" class="if" :value="temp_value" :done="isDone" :error="props.error" :caution="caution"`.
   - Dentro: `<input>` nativo controlado por `query`, com `placeholder ?? 'SELECIONE'`, `disabled`, handlers `@input=search`, `@focus`, `@blur`, `@keydown`.
   - Overlay teleportado com a lista (RecycleScroller ou v-for), cada item reproduzindo o HTML/classes de `.autocomplete-item-select` (label + subLabel) — **idêntico às linhas 4–9**.
9. **Seleção de item:** ao clicar/Enter num item → `temp_value = option`; `query = label da option`; `open = false`. O `watch(temp_value)` existente emite `update:modelValue` (mantê-lo).
10. **forceSelection no blur:** em `@blur` (com atraso curto p/ permitir clique): recalcular `isDone = testIsDone()`; se `query` não casa com nenhuma opção, reverter `query` ao label do `temp_value` selecionado (ou limpar) — replicando `forceSelection: true`.
11. **Watches:** manter os dois `watch` (linhas 70–75); ao mudar `props.modelValue`, atualizar `temp_value` e sincronizar `query`.
12. **Navegação por teclado:** implementar handlers da Seção 5.5.
13. **Estilos:** ajustar SCSS (Seção 7) — trocar seletores `.p-*` por classes próprias mantendo o mesmo resultado visual.
14. **Regenerar resolver** se o nome do arquivo/aliases mudar (não deve mudar): `npx tsx src/scripts/generateResolver.ts`. (Só necessário se novos arquivos `.vue` forem adicionados, p.ex. a primitiva headless — nesse caso rodar.)
15. **Rodar verificações** (Seção 8).

### Convenções obrigatórias (CLAUDE.md)
`<script setup lang="ts">`; `defineProps<Interface>()` tipado; indentação **4 espaços**; aspas simples; ponto e vírgula; sem trailing commas; ordem de blocos **Template → Script → Style**; `InputBase` como elemento mais externo.

---

## 7. Estilos

Os estilos atuais (linhas 85–177) são **globais** (não scoped) e miram classes PrimeVue. Estratégia:

1. **Manter** as classes próprias intactas: `.autocomplete-item-select`, `.autocomplete-item-select-label`, `.autocomplete-item-select-sub-label` (122–147), `.text-centereds`, `.ref-div`, `.main-div-input-auto-complete-api` (nome estranho — herdado; manter para não quebrar overrides externos). Continuar usando as CSS vars do tema Max (`var(--background-500)`, etc.).
2. **Substituir seletores PrimeVue** por classes próprias equivalentes:
   - `.p-autocomplete` / `.p-inputtext` (largura 100%, altura 36px) → aplicar ao novo `<input>` e wrapper.
   - `.p-autocomplete-overlay` / `.p-virtualscroller` / `.p-virtualscroller-content` (linhas 149–161: `width: auto`, `overflow-x: hidden`, `contain`, `position: relative`) → aplicar ao container do overlay e ao RecycleScroller (`.max-autocomplete-overlay`, etc.).
   - `.p-autocomplete-option-group { position: sticky; top: 40px }` → replicar se grupos forem suportados (o fonte atual não passa `optionGroupLabel`, então grupos podem não estar em uso — verificar; provavelmente removível).
3. **Estados visuais** (`caution`/`error`/`done`, borda do input) já são aplicados por `InputBase` via classes na raiz (`&.caution input { border-color }`, etc.) — garantir que o novo `<input>` receba as bordas corretas (o InputBase migrado deve mirar `input` genérico, como já faz em `InputBase.vue` linhas 216/241).
4. Reproduzir altura de item **40px** (coerente com `itemSize: 40` e `.autocomplete-item-select { height: 40px }`).
5. Verificar `z-index` do overlay teleportado para ficar acima de outros elementos (o comentário em `InputBase` linhas 157–160 mostra que havia conflito de z-index com MaxPopover — atentar).

> **Não introduzir regressão visual.** Comparar lado a lado no playground (`npm run dev:playground`).

---

## 8. Testes / verificação

Arquivo de teste: `tests/components/MaxInputAutoComplete.test.ts` (criar se não existir; seguir setup de `tests/setup.ts` — PrimeVue+Pinia globais, mocks de `fetch`, `localStorage`, `virtual:uno.css`).

Casos mínimos:
1. **Render inicial:** monta sem erro; input presente; placeholder `'SELECIONE'` quando `placeholder` não passado.
2. **Filtro:** com `options` dadas, digitar no input popula/filtra a lista; verificar que `toSearchableString` é respeitado (ex.: digitar `cafe` casa `Café`).
3. **Seleção emite `update:modelValue`:** clicar/Enter num item emite o **objeto** selecionado.
4. **v-model reativo:** alterar `modelValue` externamente atualiza o texto exibido (`query`).
5. **Teclado:** ArrowDown/Up move `activeIndex`; Enter seleciona; Escape fecha.
6. **forceSelection:** digitar texto que não casa e sair (blur) não emite objeto / reverte o texto.
7. **Estados:** `required` + vazio → `isDone` reflete `hasContent`; `error`/`caution` propagados ao `InputBase`.
8. **Item render:** label e subLabel exibidos com os fallbacks (`subLabel`/`sublabel`/`sub-label`).

Comandos:
```bash
npx vitest run tests/components/MaxInputAutoComplete.test.ts
npm run type-check
npm run lint
npm run dev:playground   # verificação visual/manual (posicionamento, teclado, virtual scroll)
```

Critério de aceite: todos os testes passam, `type-check` e `lint` limpos, **nenhum import de `primevue/*` remanescente** no componente (`grep -n "primevue" src/components/MaxInputAutoComplete.vue` retorna vazio), e paridade visual/funcional confirmada no playground.

---

## 9. Skills necessárias

Todas em `/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/`:

| Skill (caminho) | Justificativa |
|---|---|
| `vue-max-components-ui-development-best-practices/SKILL.md` | Convenções da própria lib: `InputBase` como raiz, estrutura de SFC, regeneração do resolver, testes Vitest. **Obrigatória.** |
| `vue-floating-vue-tooltips-popovers-best-practices/SKILL.md` | Padrões de posicionamento e ciclo de vida/cleanup de elementos flutuantes (overlay do dropdown). Referência para posicionamento e limpeza de listeners. |
| `vue-keyboard-shortcuts-navigation-best-practices/SKILL.md` | Navegação por teclado (setas/Enter/Escape), `useActiveElement`, foco e ARIA — núcleo da reimplementação do combobox. |
| `vue-virtual-scroller-best-practices/SKILL.md` | Reproduzir o `virtualScrollerOptions` (RecycleScroller, `item-size: 40`) para listas grandes. |
| `vue-inputs-masks-validation-best-practices/SKILL.md` | Padrões de inputs/validação no ecossistema (estados done/error/caution, `hasContent`). Apoio para o campo de texto e validação. |
| `vue-vitest-testing-best-practices/SKILL.md` | Escrever/ajustar os testes de componente (mount, mocks, interações). |

> `vue-max-components-ui-popovers-confirmations-best-practices` **pode** ser relevante se a implementação optar por reutilizar `MaxPopover`/store de popover em vez de Floating UI direto — consultar apenas nesse caso.

---

## 10. Riscos e pontos de atenção

1. **Dependência de `InputBase`:** este componente **não pode ser migrado antes** de `InputBase`. Confirmar que a versão migrada mantém a mesma API de props (`value`, `done`, `error`, `caution`, `class`, `icon`, slots) e o mesmo comportamento de bordas/estados por CSS.
2. **Primitiva compartilhada:** `MaxInputSelect` e `MaxInputAutoCompleteApi` usam o mesmo padrão de dropdown/teclado. **Coordenar** para não duplicar; idealmente migrar `MaxInputSelect` primeiro e reutilizar sua primitiva.
3. **`forceSelection: true`:** comportamento sutil — texto digitado não confirmado deve ser descartado no blur. Fácil de introduzir regressão (emitir string livre). Testar explicitamente.
4. **Emissão condicional:** o `watch` atual só emite quando `temp_value` **não é string** (objeto). Preservar exatamente para não emitir valores parciais durante a digitação.
5. **`temp_value_string`:** ordem de fallback (`value ?? label ?? id ?? [optionValue]`) é usada tanto para exibição quanto para busca — manter idêntica.
6. **Virtual scroll + scrollIntoView:** ao navegar por teclado, o item ativo deve permanecer visível; RecycleScroller exige `scrollToItem`/cálculo de offset. Risco de item ativo fora da viewport.
7. **Overlay teleportado + z-index:** o comentário em `InputBase.vue` (linhas 157–160) indica conflito histórico de z-index entre `.p-inputicon` e `MaxPopover`. Garantir empilhamento correto do novo overlay.
8. **Largura do overlay:** hoje `.p-autocomplete-overlay { width: auto }`. Reproduzir com Floating UI `size` middleware ou largura fixada ao campo.
9. **Estilos globais não-scoped:** as regras miram classes `.p-*` globais; ao removê-las, garantir que nenhum outro componente dependa delas indiretamente. Buscar usos (`grep -rn "p-autocomplete-overlay" src`).
10. **`class="if"` e `.main-div-input-auto-complete-api`:** nomes herdados/possivelmente incoerentes (o CSS cita "api"). Manter as classes para compatibilidade externa, mas revisar se são realmente aplicadas.
11. **Slot `#content` vazio:** o fonte passa `<template #content></template>` (linha 10). Investigar se era um workaround do AutoComplete; provavelmente descartável na nova implementação, mas confirmar que não altera markup esperado.
12. **`targetValue` prop:** declarada mas aparentemente não usada no corpo atual — manter na API por compatibilidade, mas não inventar comportamento novo.
13. **Acessibilidade:** o PrimeVue fornecia ARIA de combobox de graça; a reimplementação precisa recriá-lo manualmente (`role`, `aria-*`) para não regredir acessibilidade.
14. **Dependências novas:** confirmar que `@floating-ui/*` e `vue-virtual-scroller` já existem no projeto antes de adicioná-las ao bundle da lib (impacto em tamanho do pacote publicado).
