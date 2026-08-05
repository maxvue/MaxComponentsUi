# Plano 26 — `MaxInputAutoComplete` (substitui `primevue/autocomplete`)

| | |
|---|---|
| **id** | 26 |
| **Arquivo** | `src/components/MaxInputAutoComplete.vue` |
| **Primitiva eliminada** | `AutoComplete` |
| **Depende de** | 1 (`MaxBaseInput`), 2 (`MaxBaseOverlay`) |
| **Bloqueia** | id 27 (`MaxInputAutoCompleteApi`) |
| **Teste existente** | `tests/components/MaxInputAutoComplete.test.ts` |

---

## 1. O `AutoComplete` do PrimeVue 4

### Props

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `modelValue` | `any` | — | valor |
| `suggestions` | `any[]` | — | sugestões (controladas pelo pai) |
| `optionLabel` | `string \| fn` | — | campo do rótulo |
| `optionValue` | `string \| fn` | — | campo do valor |
| `optionGroupLabel` / `optionGroupChildren` | | | agrupamento |
| `minLength` | `number` | `1` | mínimo de caracteres para buscar |
| `delay` | `number` | `300` | debounce da busca (ms) |
| `multiple` | `boolean` | `false` | múltipla seleção com chips |
| `dropdown` | `boolean` | `false` | botão que abre tudo |
| `dropdownMode` | `'blank'\|'current'` | `'blank'` | o que o botão busca |
| `forceSelection` | `boolean` | `false` | só aceita valor da lista |
| `completeOnFocus` | `boolean` | `false` | busca ao focar |
| `typeahead` | `boolean` | `true` | busca ao digitar |
| `loading` | `boolean` | `false` | estado de carregamento |
| `scrollHeight` | `string` | `'14rem'` | altura do painel |
| `disabled`, `invalid`, `fluid`, `inputId`, `placeholder` | | | |

### Eventos (o coração do componente)

| Evento | Payload | Quando |
|---|---|---|
| **`complete`** | `{ originalEvent, query }` | **o pai deve preencher `suggestions`** |
| `item-select` | `{ originalEvent, value }` | opção escolhida |
| `item-unselect` | `{ originalEvent, value }` | chip removido (múltiplo) |
| `dropdown-click` | `{ originalEvent, query }` | botão de dropdown |
| `clear` | — | valor limpo |
| `update:modelValue`, `change`, `focus`, `blur` | | |

> **O modelo mental é "controlado pelo pai".** O `AutoComplete` **não** busca nada
> sozinho: ele emite `complete` e espera que o pai atualize a prop `suggestions`.
> Manter esse contrato é o requisito nº 1 desta migração.

### Slots
`option`, `optiongroup`, `chip`, `header`, `footer`, `empty`, `content`,
`dropdownicon`, `loadingicon`, `removetokenicon`.

---

## 2. Implementação

### Estrutura

```vue
<template>
    <InputBase v-bind="props">
        <div ref="containerRef" class="p-autocomplete p-component" :class="{ 'p-autocomplete-multiple': props.multiple }">
            <!-- chips no modo múltiplo -->
            <ul class="p-autocomplete-chip-list" v-if="props.multiple">
                <li class="p-autocomplete-chip" v-for="(item, i) in selectedItems" :key="i">
                    <slot name="chip" :value="item">{{ labelOf(item) }}</slot>
                    <button type="button" :aria-label="`Remover ${labelOf(item)}`" @click="unselect(item, $event)">×</button>
                </li>
            </ul>

            <MaxBaseInput
                ref="inputRef"
                v-model="inputValue"
                class="p-autocomplete-input"
                role="combobox"
                :aria-expanded="overlayVisible"
                :aria-controls="panelId"
                :aria-activedescendant="activeOptionId"
                autocomplete="off"
                :disabled="props.disabled"
                :placeholder="props.placeholder"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @keydown="onKeydown"
            />

            <button type="button" class="p-autocomplete-dropdown" v-if="props.dropdown" aria-label="Mostrar opções" @click="onDropdownClick">
                <MaxIcon icon="mdi:chevron-down" />
            </button>
        </div>

        <MaxBaseOverlay v-model:visible="overlayVisible" :target="containerRef" match-target-width>
            <ul class="p-autocomplete-list" role="listbox" :id="panelId">
                <li v-for="(opt, i) in props.suggestions" :key="i" role="option" :id="optionId(i)" :aria-selected="i === activeIndex" @click="select(opt, $event)">
                    <slot name="option" :option="opt" :index="i">{{ labelOf(opt) }}</slot>
                </li>
            </ul>
            <div class="p-autocomplete-empty-message" v-if="!props.suggestions?.length">
                <slot name="empty">Nenhum resultado</slot>
            </div>
        </MaxBaseOverlay>
    </InputBase>
</template>
```

### Debounce da busca

```ts
let searchTimer: number | null = null;

const onInput = (event: Event) => {
    const query = (event.target as HTMLInputElement).value;
    if (!props.typeahead) return;

    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
        if (query.length >= props.minLength) {
            emit('complete', { originalEvent: event, query });
            overlayVisible.value = true;
        } else {
            overlayVisible.value = false;
        }
    }, props.delay);
};
```

Limpe `searchTimer` em `onBeforeUnmount`.

### `forceSelection`

No blur, se o texto digitado não corresponder exatamente a nenhuma sugestão, limpe o
input. Sem isso, o usuário "confirma" um valor que nunca foi selecionado.

### Teclado

`ArrowDown`/`ArrowUp` movem a opção ativa; `Enter` seleciona a ativa; `Escape` fecha;
`Backspace` com input vazio remove o último chip (modo múltiplo); `Tab` fecha.

### ARIA

`role="combobox"` no input com `aria-autocomplete="list"`, `aria-expanded`,
`aria-controls` e `aria-activedescendant`. A lista é `role="listbox"`, as opções
`role="option"`. Anuncie a contagem de resultados numa região `aria-live="polite"` —
sem isso, quem usa leitor de tela não sabe que sugestões apareceram.

---

## 3. Teste

1. digitar acima de `minLength` emite `complete` com a `query` correta;
2. digitar abaixo de `minLength` **não** emite;
3. `delay` é respeitado (fake timers; uma emissão, não uma por tecla);
4. `suggestions` preenchidas renderizam o painel;
5. clicar numa sugestão emite `item-select` **e** `update:modelValue`;
6. `optionLabel` é usado no rótulo;
7. modo `multiple` renderiza chips e acumula valores;
8. remover chip emite `item-unselect`;
9. `Backspace` com input vazio remove o último chip;
10. botão `dropdown` emite `dropdown-click`;
11. `forceSelection` limpa entrada inválida no blur;
12. `completeOnFocus` emite `complete` ao focar;
13. teclado: setas movem, `Enter` seleciona, `Escape` fecha;
14. slot `#option` recebe a opção;
15. mensagem de vazio quando não há sugestões;
16. `aria-expanded` e `aria-activedescendant` corretos;
17. timer limpo no desmonte (sem emissão após unmount).

---

## 4. Checklist

- [ ] Sem PrimeVue
- [ ] Contrato `complete` → pai preenche `suggestions` preservado
- [ ] Todos os eventos da tabela da seção 1 emitidos com o mesmo payload
- [ ] Debounce correto (uma emissão por pausa, não por tecla)
- [ ] `forceSelection` implementado
- [ ] Teclado completo + ARIA de combobox
- [ ] Sem vazamento de timer
- [ ] 17 asserções passam
- [ ] `type-check`, `lint`, `test` OK
