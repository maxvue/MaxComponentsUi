# Plano 23 — `MaxInputSelect` (substitui `primevue/select`)

| | |
|---|---|
| **id** | 23 |
| **Arquivo** | `src/components/MaxInputSelect.vue` |
| **Primitiva eliminada** | `Select` |
| **Depende de** | 1 (`MaxBaseInput`), 2 (`MaxBaseOverlay`) |
| **Bloqueia** | ids 24 (`MaxPhoneField`), 25 (`MaxTagSelect`) |
| **Teste existente** | `tests/components/MaxInputSelect.test.ts` |

Componente de alto uso e alta superfície. Faça-o com calma — dois outros dependem dele.

---

## 1. O `Select` do PrimeVue 4

### Props

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `modelValue` | `any` | — | valor selecionado |
| `options` | `any[]` | — | lista de opções |
| `optionLabel` | `string \| fn` | — | campo do rótulo |
| `optionValue` | `string \| fn` | — | campo do valor |
| `optionDisabled` | `string \| fn` | — | campo de desabilitado |
| `optionGroupLabel` | `string \| fn` | — | rótulo do grupo |
| `optionGroupChildren` | `string \| fn` | — | itens do grupo |
| `placeholder` | `string` | — | texto quando vazio |
| `filter` | `boolean` | `false` | campo de busca no painel |
| `filterPlaceholder` | `string` | — | placeholder da busca |
| `filterFields` | `string[]` | — | campos considerados na busca |
| `showClear` | `boolean` | `false` | botão de limpar |
| `loading` | `boolean` | `false` | estado de carregamento |
| `editable` | `boolean` | `false` | permite digitar valor livre |
| `emptyMessage` | `string` | | mensagem de lista vazia |
| `emptyFilterMessage` | `string` | | mensagem de busca sem resultado |
| `disabled`, `invalid`, `readonly`, `fluid`, `inputId` | | | |
| `appendTo` | `string \| element` | `'body'` | destino do painel |
| `scrollHeight` | `string` | `'14rem'` | altura máxima do painel |

### Eventos
`update:modelValue`, `change`, `focus`, `blur`, `before-show`, `show`, `before-hide`,
`hide`, `filter`, `clear`.

### Slots
`value`, `option`, `optiongroup`, `header`, `footer`, `empty`, `emptyfilter`,
`dropdownicon`, `clearicon`, `filtericon`, `loadingicon`.

### Markup

```html
<div class="p-select p-component">
    <span class="p-select-label">Rótulo selecionado</span>
    <div class="p-select-dropdown"><svg class="p-select-dropdown-icon" /></div>
</div>
<!-- teleportado -->
<div class="p-select-overlay p-component">
    <div class="p-select-header">…filtro…</div>
    <ul class="p-select-list" role="listbox">
        <li class="p-select-option" role="option" aria-selected="…">…</li>
    </ul>
</div>
```

---

## 2. Superfície realmente usada neste repositório

Lendo `MaxInputSelect.vue`, o uso é:

**Props passadas ao `Select`:** `v-bind="{...props, ...attrs}"`, `filter`, `loading`,
`options`, `optionGroupLabel="label"`, `optionGroupChildren="items"`, `optionValue`,
`optionLabel`, `emptyMessage`, `editable`, `disabled`.

**Evento:** `@before-show` → `before_show()` (dispara `loadOptions()` assíncrono).

**Slots consumidos:** `#option`, `#optiongroup`, `#value`.

**Slots re-expostos ao consumidor:** `#option` (com slot-props `option`, `selected`,
`index`) — **isto é API pública e não pode mudar**.

### Lógica própria a preservar

- `temp_value` + os dois `watch` de sincronização;
- `optionsField` + `loading` + `before_show()` com `loadOptions()`;
- `options` computed (precedência: `optionsField` → `props.options` → `props.groupOptions`);
- `option_selected` computed (busca em lista simples **e** em grupos);
- `watchDebounced` aplicando `props.default` quando o valor está em branco;
- os dois modos de template (agrupado vs. simples);
- a div `.placeholder-select` customizada;
- renderização de `icon`, `sub_label`/`sub`/`subLabel`, `img` e `category` nas opções.

---

## 3. Implementação

### Estrutura

```vue
<template>
    <InputBase v-bind="{...props, ...attrs}" class="select_input_div">
        <div class="placeholder-select" v-if="showPlaceholder">{{ attrs.placeholder }}</div>

        <div
            ref="triggerRef"
            :class="selectClass"
            role="combobox"
            :aria-expanded="overlayVisible"
            :aria-controls="panelId"
            :aria-haspopup="'listbox'"
            :tabindex="props.disabled ? -1 : 0"
            @click="toggle"
            @keydown="onTriggerKeydown"
        >
            <span class="p-select-label">
                <slot name="value" :value="temp_value" :placeholder="attrs.placeholder">
                    <!-- markup atual de .value-div preservado -->
                </slot>
            </span>
            <div class="p-select-dropdown"><MaxIcon icon="mdi:chevron-down" /></div>
        </div>

        <MaxBaseOverlay
            v-model:visible="overlayVisible"
            :target="triggerRef"
            match-target-width
            @before-show="before_show"
        >
            <div class="p-select-overlay" :id="panelId">
                <div class="p-select-header" v-if="props.filter">
                    <MaxBaseInput v-model="filterValue" :placeholder="filterPlaceholder" />
                </div>
                <ul class="p-select-list" role="listbox" :aria-activedescendant="activeOptionId">
                    <!-- grupos -->
                    <template v-if="isGrouped">
                        <li v-for="group in filteredGroups" role="group">
                            <div class="p-select-option-group"><slot name="optiongroup" :option="group" /></div>
                            <li v-for="opt in group.items" role="option" ...>
                                <slot name="option" :option="opt" :selected="..." :index="..." />
                            </li>
                        </li>
                    </template>
                    <!-- simples -->
                    <li v-else v-for="(opt, i) in filteredOptions" role="option" ...>
                        <slot name="option" :option="opt" :selected="isSelected(opt)" :index="i" />
                    </li>
                </ul>
                <div class="p-select-empty-message" v-if="isEmpty">{{ emptyMessage }}</div>
            </div>
        </MaxBaseOverlay>
    </InputBase>
</template>
```

> **Preserve o markup interno dos slots `#option` exatamente como está hoje** (a div
> `.label_div`, o `Icon`, `.labelz`, `.subLabel`, `.img-label`, `.category`). Esses
> nós têm CSS associado e alguns são usados como fallback quando o consumidor não passa
> o slot.

### Teclado (obrigatório — o `<div>` não é focável de graça)

| Tecla | Ação |
|---|---|
| `Enter` / `Space` | abre o painel; se aberto, seleciona a opção ativa |
| `ArrowDown` | abre; move a opção ativa para baixo |
| `ArrowUp` | move a opção ativa para cima |
| `Home` / `End` | primeira / última opção |
| `Escape` | fecha e devolve o foco ao gatilho |
| `Tab` | fecha e segue o fluxo natural |
| letra digitada | pula para a primeira opção que começa com ela (typeahead) |

Um `<div role="combobox">` sem isso é inutilizável por teclado — o `Select` do PrimeVue
entregava tudo pronto.

### ARIA

- gatilho: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`,
  `tabindex="0"`;
- lista: `role="listbox"`, `aria-activedescendant` apontando para o id da opção ativa;
- cada opção: `role="option"`, `aria-selected`, `id` estável;
- opção desabilitada: `aria-disabled="true"`.

### Filtro

Quando `filter` está ativo, filtre por `optionLabel` (ou `filterFields`), sem diferenciar
maiúsculas/acentos — use `toSearchableString` de `@maxvue/max-use`, que o repositório já
usa em `MaxInputText`.

---

## 4. Teste

Baseline primeiro (`npx vitest run tests/components/MaxInputSelect.test.ts`), depois:

1. renderiza com placeholder quando vazio;
2. clicar no gatilho abre o painel; clicar de novo fecha;
3. selecionar uma opção emite `update:modelValue` com o `optionValue` correto;
4. rótulo exibido usa `optionLabel`;
5. **modo agrupado**: renderiza cabeçalhos de grupo e itens;
6. `option_selected` resolve corretamente em lista **agrupada**;
7. `loadOptions` é chamado no `before-show` e `loading` fica `true` durante;
8. `before-show` é emitido para o consumidor;
9. `filter` filtra as opções (case/acento-insensível);
10. `emptyMessage` aparece com lista vazia;
11. `props.default` é aplicado quando o valor está em branco (debounced — use fake timers);
12. slot `#option` recebe `{ option, selected, index }`;
13. slot `#value` sobrescreve o rótulo;
14. **teclado**: `ArrowDown` abre, `ArrowDown` move, `Enter` seleciona, `Escape` fecha;
15. `disabled` impede a abertura;
16. `aria-expanded` acompanha o estado; opção selecionada tem `aria-selected="true"`;
17. `editable` permite valor livre (se o componente usa).

---

## 5. Checklist

- [ ] Sem PrimeVue
- [ ] Toda a lógica própria (seção 2) preservada — confirme lendo o diff
- [ ] Slot `#option` com os **mesmos** slot-props de hoje
- [ ] Markup interno das opções preservado (`.label_div`, `.subLabel`, `.img-label`, `.category`)
- [ ] Navegação por teclado completa (tabela da seção 3)
- [ ] ARIA de combobox/listbox completo
- [ ] 17 asserções passam; mutação testada
- [ ] Validado no playground: simples, agrupado, com filtro e com `loadOptions`
- [ ] `type-check`, `lint`, `test` OK
