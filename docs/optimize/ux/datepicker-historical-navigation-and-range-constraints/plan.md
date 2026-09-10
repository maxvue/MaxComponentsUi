# Plano de Implementação: Fricção em Navegação de Datas Históricas e Falta de Limites no DatePicker (`MaxInputDatePicker`)

## 1. Diagnóstico e Objetivo

O componente [`MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue) permite navegar no calendário exclusivamente através de botões de avanço e recuo mês a mês (`prevMonth` e `nextMonth`). Para selecionar datas de nascimento ou marcos históricos de décadas anteriores (ex.: 1980 ou 1990), o usuário necessita clicar centenas de vezes no botão de recuo mensal, gerando atrito severo e inviabilizando o uso prático do seletor. Além disso, o componente não suporta as propriedades `minDate` e `maxDate`, permitindo que o usuário selecione qualquer dia arbitrário (inclusive datas futuras proibidas ou datas passadas inválidas para agendamentos) sem desabilitação visual das células.

**Objetivo:**
1. Implementar alternância dinâmica de visualização no painel (`view: 'date' | 'month' | 'year'`), permitindo selecionar diretamente o mês do ano e a década/ano desejado em 2 cliques.
2. Adicionar suporte a restrições de intervalo via props `minDate` e `maxDate` (aceitando `Date | string`).
3. Bloquear e desabilitar visualmente as células fora do intervalo permitido (`.is-disabled`, `disabled`, opacidade reduzida, cursor `not-allowed`).
4. Adicionar barra de rodapé com atalhos "Hoje" e "Limpar" para rápida seleção e reset do valor.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue): inclusão dos modos de navegação ano/mês, lógica de restrição `minDate`/`maxDate` e botões de atalho.
- [`tests/components/MaxInputDatePicker.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputDatePicker.test.ts): testes unitários validando limites de data, navegação de anos e atalhos.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Novas Props e Estado Reativo em `MaxInputDatePicker.vue`

Extensão da interface `Props`:

```ts
interface Props {
    // ... props já existentes ...
    /** Data mínima permitida para seleção (Date, string ISO ou DD/MM/AAAA) */
    minDate?: Date | string | null;
    /** Data máxima permitida para seleção (Date, string ISO ou DD/MM/AAAA) */
    maxDate?: Date | string | null;
    /** Exibe rodapé com botões de ação rápida 'Hoje' e 'Limpar' */
    showButtonBar?: boolean;
}
```

Declaração de defaults:

```ts
const props = withDefaults(defineProps<Props>(), {
    value: '',
    textCenter: false,
    dark: 0.5,
    done: undefined,
    caution: undefined,
    error: undefined,
    light: false,
    iconPos: 'left',
    inLine: false,
    minDate: null,
    maxDate: null,
    showButtonBar: true
});
```

Estados reativos para controle de visualização do calendário:

```ts
type CalendarView = 'date' | 'month' | 'year';
const currentView = ref<CalendarView>('date');
const yearRangeStart = ref(Math.floor(new Date().getFullYear() / 10) * 10);

const parsedMinDate = computed(() => (props.minDate ? parseDateValue(props.minDate) : null));
const parsedMaxDate = computed(() => (props.maxDate ? parseDateValue(props.maxDate) : null));

const isDateDisabled = (date: Date): boolean => {
    const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (parsedMinDate.value) {
        const min = new Date(
            parsedMinDate.value.getFullYear(),
            parsedMinDate.value.getMonth(),
            parsedMinDate.value.getDate()
        ).getTime();
        if (time < min) return true;
    }
    if (parsedMaxDate.value) {
        const max = new Date(
            parsedMaxDate.value.getFullYear(),
            parsedMaxDate.value.getMonth(),
            parsedMaxDate.value.getDate()
        ).getTime();
        if (time > max) return true;
    }
    return false;
};

const yearsList = computed(() => {
    const list: number[] = [];
    const start = yearRangeStart.value - 1; // 1 ano antes para padding visual
    for (let i = 0; i < 12; i++) {
        list.push(start + i);
    }
    return list;
});
```

Funções de navegação rápida:

```ts
const toggleView = () => {
    if (currentView.value === 'date') {
        currentView.value = 'month';
    } else if (currentView.value === 'month') {
        yearRangeStart.value = Math.floor(currentYear.value / 10) * 10;
        currentView.value = 'year';
    } else {
        currentView.value = 'date';
    }
};

const selectMonth = (monthIndex: number) => {
    currentMonth.value = monthIndex;
    currentView.value = 'date';
};

const selectYear = (year: number) => {
    currentYear.value = year;
    currentView.value = 'month';
};

const prevHeader = () => {
    if (currentView.value === 'date') prevMonth();
    else if (currentView.value === 'month') currentYear.value--;
    else yearRangeStart.value -= 10;
};

const nextHeader = () => {
    if (currentView.value === 'date') nextMonth();
    else if (currentView.value === 'month') currentYear.value++;
    else yearRangeStart.value += 10;
};

const selectToday = () => {
    const today = new Date();
    if (isDateDisabled(today)) return;
    internalDate.value = today;
    currentMonth.value = today.getMonth();
    currentYear.value = today.getFullYear();
    currentView.value = 'date';
    hide();
};

const clearValue = () => {
    internalDate.value = null;
    displayValue.value = '';
    modelValue.value = '';
    hide();
};
```

### 3.2. Template Dinâmico do Painel do Calendário

```html
<div ref="overlayEl" class="p-datepicker-panel max-datepicker-panel" :style="{ top: position.top + 'px', left: position.left + 'px' }" @click.stop>
    <!-- CABEÇALHO COM NAVEGADOR -->
    <div class="max-datepicker-header">
        <button type="button" class="max-datepicker-nav-btn" @click.stop="prevHeader" aria-label="Anterior">
            <MaxIcon icon="lucide:chevron-left" size="1.1" />
        </button>

        <button type="button" class="max-datepicker-title-btn" @click.stop="toggleView">
            <span v-if="currentView === 'date'">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
            <span v-else-if="currentView === 'month'">{{ currentYear }}</span>
            <span v-else>{{ yearRangeStart }} - {{ yearRangeStart + 9 }}</span>
        </button>

        <button type="button" class="max-datepicker-nav-btn" @click.stop="nextHeader" aria-label="Próximo">
            <MaxIcon icon="lucide:chevron-right" size="1.1" />
        </button>
    </div>

    <!-- VISTA 1: GRADE DE DIAS -->
    <div class="max-datepicker-grid" v-if="currentView === 'date'">
        <div class="max-datepicker-weekdays">
            <span v-for="(wd, idx) in weekDays" :key="idx" class="max-datepicker-weekday">{{ wd }}</span>
        </div>
        <div class="max-datepicker-days">
            <button
                v-for="(cell, cIdx) in calendarDays"
                :key="cIdx"
                type="button"
                class="max-datepicker-day"
                :class="{
                    'is-other-month': !cell.isCurrentMonth,
                    'is-selected': isSelectedDate(cell.date),
                    'is-today': isToday(cell.date),
                    'is-disabled': isDateDisabled(cell.date)
                }"
                :disabled="isDateDisabled(cell.date)"
                @click.stop="!isDateDisabled(cell.date) && selectDate(cell)"
            >
                {{ cell.day }}
            </button>
        </div>
    </div>

    <!-- VISTA 2: GRADE DE MESES -->
    <div class="max-datepicker-months" v-else-if="currentView === 'month'">
        <button
            v-for="(mName, mIdx) in monthNames"
            :key="mIdx"
            type="button"
            class="max-datepicker-month-btn"
            :class="{ 'is-selected': mIdx === currentMonth }"
            @click.stop="selectMonth(mIdx)"
        >
            {{ mName.slice(0, 3) }}
        </button>
    </div>

    <!-- VISTA 3: GRADE DE ANOS -->
    <div class="max-datepicker-years" v-else>
        <button
            v-for="yr in yearsList"
            :key="yr"
            type="button"
            class="max-datepicker-year-btn"
            :class="{
                'is-selected': yr === currentYear,
                'is-out-of-range': yr < yearRangeStart || yr > yearRangeStart + 9
            }"
            @click.stop="selectYear(yr)"
        >
            {{ yr }}
        </button>
    </div>

    <!-- RODAPÉ DE ATALHOS -->
    <div class="max-datepicker-footer" v-if="props.showButtonBar">
        <button type="button" class="max-datepicker-action-btn today" @click.stop="selectToday">Hoje</button>
        <button type="button" class="max-datepicker-action-btn clear" @click.stop="clearValue">Limpar</button>
    </div>
</div>
```

### 3.3. Estilização SCSS Scoped

```scss
<style lang="scss" scoped>
.max-datepicker-panel {
    position: fixed;
    z-index: 1101;
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border, #e2e8f0);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgb(0 0 0 / 15%);
    padding: 12px;
    width: 290px;
    user-select: none;

    .max-datepicker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;

        .max-datepicker-title-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--background-775);
            padding: 4px 8px;
            border-radius: 4px;
            transition: background-color 0.15s ease;

            &:hover {
                background: var(--background-100, #f1f5f9);
                color: var(--primary-500, #3b82f6);
            }
        }

        .max-datepicker-nav-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--background-700);

            &:hover {
                background: var(--background-100, #f1f5f9);
                color: var(--primary-500, #3b82f6);
            }
        }
    }

    .max-datepicker-days {
        .max-datepicker-day {
            &.is-disabled {
                opacity: 0.25 !important;
                cursor: not-allowed !important;
                pointer-events: none;
            }
        }
    }

    .max-datepicker-months,
    .max-datepicker-years {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 8px 0;

        button {
            height: 40px;
            border: none;
            background: transparent;
            border-radius: 6px;
            font-size: 0.85rem;
            color: var(--background-700);
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
                background: var(--background-100, #f1f5f9);
            }

            &.is-selected {
                background: var(--max-primary-500, #00768e);
                color: #fff;
                font-weight: 600;
            }

            &.is-out-of-range {
                opacity: 0.4;
            }
        }
    }

    .max-datepicker-footer {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid var(--surface-border, #e2e8f0);
        margin-top: 10px;
        padding-top: 8px;

        .max-datepicker-action-btn {
            background: transparent;
            border: none;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            color: var(--primary-600, #2563eb);

            &:hover {
                background: var(--background-100, #f1f5f9);
            }

            &.clear {
                color: var(--red-600, #dc2626);
            }
        }
    }
}
</style>
```

---

## 4. Garantia de Retrocompatibilidade

- O fluxo padrão de preenchimento via digitação manual ou seleção mensal não sofre nenhuma alteração sintática ou quebra de contrato.
- As props `minDate` e `maxDate` são opcionais (`default: null`); na ausência delas, todos os dias continuam selecionáveis exatamente como antes.
- As emissões de `update:modelValue` preservam rigorosamente o formato de string `'YYYY-MM-DD HH:mm:ss'`.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Clicar no título do cabeçalho abre a visão de seleção de meses (`view: 'month'`). Clicar novamente abre a visão de anos da década (`view: 'year'`).
2. Selecionar um ano retorna para a visão de meses; selecionar um mês retorna para a visão de dias atualizada no período escolhido.
3. Se `minDate` ou `maxDate` for fornecido, dias anteriores ao mínimo ou posteriores ao máximo recebem a classe `.is-disabled`, atributo `disabled` e ignoram cliques.
4. O botão "Hoje" preenche a data atual no input e o botão "Limpar" reseta o valor para string vazia.

### 5.2. Comandos de Validação
```bash
# Checagem estrita de tipos TypeScript
npm run type-check

# Testes unitários do DatePicker
npx vitest run tests/components/MaxInputDatePicker.test.ts
```
