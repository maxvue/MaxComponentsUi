# Plano de Implementação: Ausência de Rótulos Acessíveis e Navegação em MaxInputDatePicker e MaxInputSearch

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L35-L71):**
   - Os botões de navegação mensal (`prevMonth` e `nextMonth`) renderizam apenas ícones SVG sem qualquer atributo `aria-label`, sendo anunciados por leitores de tela como "Botão" sem contexto (violação WCAG 4.1.2 - Nome, Função, Valor).
   - A grade de calendário não utiliza semântica ARIA para tabelas de datas (`role="grid"`, `role="rowgroup"`, `role="row"`, `role="columnheader"`, `role="gridcell"`).
   - Cada botão de dia renderiza unicamente o numeral simples `{{ cell.day }}`. Para dias de meses adjacentes (`is-other-month`), um usuário cego ouve apenas números soltos ("30", "1") sem indicação do mês e ano de pertencimento.
   - O calendário carece de navegação por setas (`ArrowLeft`/`ArrowRight` para dias, `ArrowUp`/`ArrowDown` para semanas), exigindo dezenas de toques de `Tab` para selecionar datas.
2. **[`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L1-L5):**
   - O campo usa `type="text"` genérico em vez do semântico `type="search"`.
   - Não há garantia de `aria-label="Pesquisar"` ou fallback quando nenhum label é fornecido.
   - Quando `isLoading: true`, o ícone muda para um spinner visual, mas o input não recebe `:aria-busy="isLoading"` e não há região `aria-live="polite"` para anunciar a busca assíncrona em processamento (WCAG 4.1.3 - Mensagens de Status).

### Objetivo
- Implementar o padrão WAI-ARIA Datepicker Grid em `MaxInputDatePicker.vue` com `aria-label` completo em todos os botões, navegação direcional por teclado nas células de datas e gerenciamento de foco acessível.
- Tornar `MaxInputSearch.vue` totalmente acessível com `type="search"`, atributo `aria-label` com fallback semântico, `aria-busy` dinâmico e live region invisível para status assíncrono.

---

## 2. Arquivos a Modificar

- [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue)
- [`src/components/MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue)
- [`tests/unit/MaxInputDatePicker.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputDatePicker.spec.ts) (criação/atualização de testes)
- [`tests/unit/MaxInputSearch.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputSearch.spec.ts) (criação/atualização de testes)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxInputDatePicker.vue`

#### Alterações no Template
1. Botões de navegação mensal recebem `aria-label="Mês anterior"` e `aria-label="Próximo mês"`:
```html
<div class="max-datepicker-header">
    <button
        type="button"
        class="max-datepicker-nav-btn"
        aria-label="Mês anterior"
        @click.stop="prevMonth"
    >
        <MaxIcon icon="lucide:chevron-left" size="1.1" />
    </button>
    <div class="max-datepicker-title" aria-live="polite" aria-atomic="true">
        {{ monthNames[currentMonth] }} {{ currentYear }}
    </div>
    <button
        type="button"
        class="max-datepicker-nav-btn"
        aria-label="Próximo mês"
        @click.stop="nextMonth"
    >
        <MaxIcon icon="lucide:chevron-right" size="1.1" />
    </button>
</div>
```

2. Estrutura em grade ARIA com dias da semana como cabeçalhos e células com `role="gridcell"`:
```html
<div
    class="max-datepicker-grid"
    role="grid"
    :aria-label="`${monthNames[currentMonth]} de ${currentYear}`"
    @keydown="onGridKeydown"
>
    <div class="max-datepicker-weekdays" role="row">
        <span
            v-for="(wd, idx) in weekDays"
            :key="idx"
            class="max-datepicker-weekday"
            role="columnheader"
            :aria-label="fullWeekDayNames[idx]"
        >
            {{ wd }}
        </span>
    </div>
    <div class="max-datepicker-days" role="rowgroup">
        <button
            v-for="(cell, cIdx) in calendarDays"
            :key="cIdx"
            :ref="(el) => setDayButtonRef(el, cIdx)"
            type="button"
            class="max-datepicker-day"
            :class="{
                'is-other-month': !cell.isCurrentMonth,
                'is-selected': isSelectedDate(cell.date),
                'is-today': isToday(cell.date)
            }"
            role="gridcell"
            :aria-selected="isSelectedDate(cell.date) ? 'true' : 'false'"
            :aria-current="isToday(cell.date) ? 'date' : undefined"
            :aria-label="formatDateAria(cell.date)"
            :tabindex="focusedCellIndex === cIdx ? 0 : -1"
            @click.stop="selectDate(cell)"
        >
            {{ cell.day }}
        </button>
    </div>
</div>
```

#### Alterações no `<script setup lang="ts">`
Adicionar a lógica de formatação falada e navegação direcional por teclado:
```typescript
const fullWeekDayNames = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const focusedCellIndex = ref(0);
const dayButtonRefs = ref<(HTMLButtonElement | null)[]>([]);

const setDayButtonRef = (el: any, index: number) => {
    dayButtonRefs.value[index] = el as HTMLButtonElement | null;
};

const formatDateAria = (date: Date): string => {
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const isCurMonth = date.getMonth() === currentMonth.value;
    return `${day} de ${month} de ${year}${!isCurMonth ? ' (outro mês)' : ''}`;
};

const onGridKeydown = (event: KeyboardEvent) => {
    const total = calendarDays.value.length;
    let nextIndex = focusedCellIndex.value;

    switch (event.key) {
        case 'ArrowRight':
            event.preventDefault();
            nextIndex = (nextIndex + 1) % total;
            break;
        case 'ArrowLeft':
            event.preventDefault();
            nextIndex = (nextIndex - 1 + total) % total;
            break;
        case 'ArrowDown':
            event.preventDefault();
            if (nextIndex + 7 < total) nextIndex += 7;
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (nextIndex - 7 >= 0) nextIndex -= 7;
            break;
        case 'Home':
            event.preventDefault();
            nextIndex = 0;
            break;
        case 'End':
            event.preventDefault();
            nextIndex = total - 1;
            break;
        case 'Escape':
            event.preventDefault();
            hide();
            inputElement.value?.focus();
            return;
        default:
            return;
    }

    focusedCellIndex.value = nextIndex;
    dayButtonRefs.value[nextIndex]?.focus();
};

watch(isOpen, (open) => {
    if (open) {
        dayButtonRefs.value = [];
        nextTick(() => {
            const selectedIdx = calendarDays.value.findIndex(c => isSelectedDate(c.date));
            focusedCellIndex.value = selectedIdx >= 0 ? selectedIdx : calendarDays.value.findIndex(c => c.isCurrentMonth && c.day === 1);
        });
    }
});
```

#### Estilos SCSS Scoped
Adicionar `:focus-visible` nas células de dia e nos botões de navegação:
```scss
.max-datepicker-nav-btn {
    &:focus-visible {
        outline: 2px solid var(--blue-600);
        outline-offset: 2px;
        border-radius: 4px;
    }
}

.max-datepicker-day {
    &:focus-visible {
        outline: 2px solid var(--blue-600);
        outline-offset: 1px;
        z-index: 1;
    }
}
```

---

### 3.2. `MaxInputSearch.vue`

#### Alterações no Template
```html
<template>
    <InputBase
        class="max-input-search input-search-main-div"
        :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'"
    >
        <input
            :type="props.type"
            class="p-inputtext"
            v-bind="attrs"
            :value="temp_value"
            :placeholder="props.placeholder || 'Pesquisar...'"
            :aria-label="ariaLabelComputed"
            :aria-busy="isLoading ? 'true' : undefined"
            @input="onInput"
        />
        <span class="sr-only" aria-live="polite" aria-atomic="true">
            {{ isLoading ? 'Buscando resultados...' : '' }}
        </span>
    </InputBase>
</template>
```

#### Alterações no `<script setup lang="ts">`
```typescript
interface Props {
    modelValue: string;
    isLoading?: boolean;
    type?: string;
    placeholder?: string;
    ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    isLoading: false,
    type: 'search',
    placeholder: 'Pesquisar...',
    ariaLabel: undefined
});

const ariaLabelComputed = computed(() => {
    if (props.ariaLabel) return props.ariaLabel;
    if (attrs['aria-label']) return attrs['aria-label'] as string;
    return props.placeholder || 'Pesquisar';
});
```

#### Estilos SCSS Scoped
```scss
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

---

## 4. Garantia de Retrocompatibilidade

1. **Assinaturas e Props Mantidas:**
   - Em `MaxInputDatePicker.vue`, todas as propriedades de formatação, v-model, ícones e datas permanecem idênticas.
   - Em `MaxInputSearch.vue`, `modelValue` e `isLoading` continuam como default. A nova prop `type` tem `'search'` como default, mas aceita `'text'` caso o consumidor necessite.
2. **Eventos Preservados:**
   - Emissões de `@update:modelValue`, `@search`, `@change` e `@input` continuam funcionando sem qualquer regressão.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] Botões anterior e próximo de `MaxInputDatePicker` possuem atributos `aria-label="Mês anterior"` e `aria-label="Próximo mês"`.
- [ ] A grade do calendário expõe `role="grid"`, `role="row"`, `role="columnheader"` e `role="gridcell"`.
- [ ] Cada célula de data possui `aria-label` completo (ex: "15 de Outubro de 2026") e `aria-selected` booleano.
- [ ] Pressionar setas direcionais (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) navega entre as células de datas do calendário aberto.
- [ ] `MaxInputSearch` possui `type="search"`, `aria-label="Pesquisar..."` (ou valor configurado), `:aria-busy` quando em loading e elemento com `aria-live="polite"`.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxInputDatePicker.spec.ts
npx vitest run tests/unit/MaxInputSearch.spec.ts
```
