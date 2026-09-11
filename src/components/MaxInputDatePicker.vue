<template>
    <InputBase
        v-bind="props"
        class="max-input-date-picker input-base-date-picker"
        :error="errorMessage"
        :caution="isCaution"
        :done="isDone"
        :icon="props.icon ?? 'solar:calendar-line-duotone'"
    >
        <template #default="{ inputId, messageId, hasMessage, isError: slotError, isRequired }">
            <div ref="triggerEl" class="max-datepicker-wrapper">
                <input
                    :id="inputId"
                    ref="inputElement"
                    type="text"
                    class="max-datepicker-input"
                    :value="displayValue"
                    v-maska="maskValue"
                    :placeholder="props.placeholder ?? 'dd/mm/aaaa'"
                    :disabled="props.disabled"
                    :aria-describedby="hasMessage ? messageId : undefined"
                    :aria-invalid="slotError ? 'true' : undefined"
                    :aria-required="isRequired ? 'true' : undefined"
                    @focus="open"
                    @click="open"
                    @blur="onBlur"
                    @input="onInput"
                    @change="onInputChange"
                    @keydown="onInputKeydown"
                />
            </div>

            <Teleport to="body" v-if="isOpen">
                <div
                    ref="overlayEl"
                    class="max-datepicker-panel"
                    :style="{ top: position.top + 'px', left: position.left + 'px' }"
                    @click.stop
                >
                    <div class="max-datepicker-header">
                        <button
                            type="button"
                            class="max-datepicker-nav-btn"
                            :aria-label="prevNavAriaLabel"
                            @click.stop="prevHeader"
                        >
                            <MaxIcon icon="lucide:chevron-left" size="1.1" />
                        </button>

                        <button
                            type="button"
                            class="max-datepicker-title max-datepicker-title-btn"
                            @click.stop="toggleView"
                        >
                            <span v-if="currentView === 'date'">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
                            <span v-else-if="currentView === 'month'">{{ currentYear }}</span>
                            <span v-else>{{ yearRangeStart }} - {{ yearRangeStart + 9 }}</span>
                        </button>

                        <button
                            type="button"
                            class="max-datepicker-nav-btn"
                            :aria-label="nextNavAriaLabel"
                            @click.stop="nextHeader"
                        >
                            <MaxIcon icon="lucide:chevron-right" size="1.1" />
                        </button>
                    </div>

                    <div
                        v-if="currentView === 'date'"
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
                                    'is-today': isToday(cell.date),
                                    'is-disabled': isDateDisabled(cell.date)
                                }"
                                role="gridcell"
                                :aria-selected="isSelectedDate(cell.date) ? 'true' : 'false'"
                                :aria-current="isToday(cell.date) ? 'date' : undefined"
                                :aria-label="formatDateAria(cell.date)"
                                :tabindex="focusedCellIndex === cIdx ? 0 : -1"
                                :disabled="isDateDisabled(cell.date)"
                                @focus="focusedCellIndex = cIdx"
                                @click.stop="!isDateDisabled(cell.date) && selectDate(cell)"
                            >
                                {{ cell.day }}
                            </button>
                        </div>
                    </div>

                    <div v-else-if="currentView === 'month'" class="max-datepicker-months">
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

                    <div v-else class="max-datepicker-years">
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

                    <div v-if="props.showButtonBar" class="max-datepicker-footer">
                        <button
                            type="button"
                            class="max-datepicker-action-btn today"
                            @click.stop="selectToday"
                        >
                            Hoje
                        </button>
                        <button
                            type="button"
                            class="max-datepicker-action-btn clear"
                            @click.stop="clearValue"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            </Teleport>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import { useDateFormat, useElementSize, useWindowSize } from '@maxvue/max-use';
    import { useActiveElementBounding } from '../composables/useActiveElementBounding';
    import { vMaska } from 'maska/vue';
    import { SelectGroupOptions } from '../types';

    const modelValue = defineModel<any>({ default: '' });
    const internalDate = ref<Date | null>(null);
    const hasBeenTouched = ref(false);
    const displayValue = ref('');
    const isTyping = ref(false);

    const maskValue = computed(() => ({
        tokens: {
            '#': { pattern: /[0-9]/ }
        },
        mask: '##/##/####'
    }));

    interface Props {
        /** Valor do input (suporta v-model) */
        value?: any;
        /** Valor do input para v-model no Vue 3 */
        modelValue?: any;
        /** Lista de opções simples [{ name, value, icon, sub_label }] */
        class?: string;
        /** Ícone principal (ex: 'mdi:user') */
        icon?: string | undefined;
        /** Alias para o ícone principal */
        i?: string | undefined;
        /** Estado desabilitado do componente */
        disabled?: boolean | undefined;
        /** Ativa o estilo de label flutuante (FloatLabel) */
        float?: boolean | undefined;
        /** Mensagem de feedback ou instrução (alias para message) */
        msg?: string | undefined;
        /** Mensagem de feedback, erro ou aviso exibida abaixo do input */
        message?: string | undefined;
        /** Ícone exibido ao lado da mensagem de feedback */
        iconMessage?: string | undefined;
        /** Rótulo (label) exibido acima ou dentro do campo */
        label?: string | undefined;
        /** Define se o campo foi preenchido corretamente (exibe ícone de check) */
        done?: string | boolean | null | undefined;
        /** Mensagem de erro ou estado de erro (exibe em destaque) */
        error?: string | boolean | null | undefined;
        /** Mensagem de atenção ou estado de alerta (exibe em laranja) */
        caution?: string | boolean | null | undefined;
        /** Indica se o preenchimento deste campo é obrigatório (exibe asterisco) */
        required?: boolean | undefined;
        /** Alinha o texto do input ao centro */
        textCenter?: boolean | undefined;
        /** Alinha o texto do input à direita */
        textRight?: boolean | undefined;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
        /** Default Value */
        default?: string | number | boolean | null | undefined;
        /** Lista de opções simples [{ name, value, icon, sub_label }] */
        options?: any[];
        /** Lista de opções agrupadas [{ label, items: [] }] */
        groupOptions?: SelectGroupOptions;
        /** Ícone posicionado à esquerda */
        iconLeft?: string | undefined;
        /** Ícone posicionado à direita */
        iconRight?: string | undefined;
        /** Valor selecionado */
        loadOptions?: () => Promise<any[]>;
        /** Flag que informa o campo do valor */
        optionValue?: string;
        /** Flag que informa o campo do label */
        optionLabel?: string;
        /** Flag que informa o campo do name */
        optionName?: string;
        /** Ícone escuro comparado ao fundo */
        iconDark?: boolean | undefined | number | string;
        /** Ícone claro comparado ao fundo */
        iconLight?: boolean | undefined | number | string;
        /** Ícone claro comparado ao fundo */
        iconPos?: 'left' | 'right';
        /** Ícone claro comparado ao fundo */
        inLine?: boolean;
        /** Flag que força ocultar o icone done */
        noDone?: boolean;
        /** Flag que força ocultar o icone done */
        noCaution?: boolean;
        /** Flag que força ocultar o icone error */
        noError?: boolean;
        /** Flag que força ocultar os icones done, caution e error */
        noStatus?: boolean;
        /** Flag que força ocultar o icone */
        noIcon?: boolean;
        /** Data Format */
        dateFormat?: string;
        /** Placeholder Text */
        placeholder?: string;
        /** Data mínima permitida para seleção (Date, string ISO ou DD/MM/AAAA) */
        minDate?: Date | string | null;
        /** Data máxima permitida para seleção (Date, string ISO ou DD/MM/AAAA) */
        maxDate?: Date | string | null;
        /** Exibe rodapé com botões de ação rápida 'Hoje' e 'Limpar' */
        showButtonBar?: boolean;
    }

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

    const triggerEl = ref<HTMLElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const inputElement = ref<HTMLInputElement | null>(null);
    const isOpen = ref(false);

    type CalendarView = 'date' | 'month' | 'year';
    const currentView = ref<CalendarView>('date');
    const yearRangeStart = ref(Math.floor(new Date().getFullYear() / 10) * 10);

    const currentMonth = ref(new Date().getMonth());
    const currentYear = ref(new Date().getFullYear());

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const { x, y, height: height_btn } = useActiveElementBounding(triggerEl, isOpen);
    const { width: width_el, height: height_el } = useElementSize(overlayEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetH = height_btn.value;

        let top = targetY + targetH + 4;
        let left = targetX;

        if (top + (height_el.value || 280) > window_height.value && targetY - (height_el.value || 280) > 0) top = targetY - (height_el.value || 280) - 4;


        if (left + (width_el.value || 280) > window_width.value) left = Math.max(10, window_width.value - (width_el.value || 280) - 10);


        return { top, left };
    });

    const parseDateValue = (val: unknown): Date | null => {
        if (!val) return null;
        if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

        if (typeof val === 'number') {
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof val !== 'string') return null;

        const trimmed = val.trim();
        if (!trimmed) return null;

        // Formato brasileiro: DD/MM/YYYY ou DD-MM-YYYY (com ou sem hora)
        const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[\sT](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (brMatch) {
            const day = parseInt(brMatch[1], 10);
            const month = parseInt(brMatch[2], 10) - 1;
            const year = parseInt(brMatch[3], 10);
            const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
            const minute = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
            const second = brMatch[6] ? parseInt(brMatch[6], 10) : 0;

            if (month >= 0 && month <= 11 && year >= 1000 && year <= 9999) {
                const date = new Date(year, month, day, hour, minute, second);
                if (
                    date.getFullYear() === year &&
                    date.getMonth() === month &&
                    date.getDate() === day &&
                    date.getHours() === hour &&
                    date.getMinutes() === minute &&
                    date.getSeconds() === second
                ) return date;
            }
            return null;
        }

        // Formato ISO: YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss ou YYYY-MM-DDTHH:mm:ss
        const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[\sT](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10) - 1;
            const day = parseInt(isoMatch[3], 10);
            const hour = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
            const minute = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
            const second = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;

            if (month >= 0 && month <= 11 && year >= 1000 && year <= 9999) {
                const date = new Date(year, month, day, hour, minute, second);
                if (
                    date.getFullYear() === year &&
                    date.getMonth() === month &&
                    date.getDate() === day &&
                    date.getHours() === hour &&
                    date.getMinutes() === minute &&
                    date.getSeconds() === second
                ) return date;
            }
            return null;
        }

        const fallback = new Date(trimmed);
        return isNaN(fallback.getTime()) ? null : fallback;
    };

    const parsedMinDate = computed(() => (props.minDate ? parseDateValue(props.minDate) : null));
    const parsedMaxDate = computed(() => (props.maxDate ? parseDateValue(props.maxDate) : null));

    const isDateDisabled = (date: Date): boolean => {
        if (!date) return false;
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

    // Sincroniza modelValue -> internalDate e displayValue
    watch(
        modelValue,
        (val) => {
            if (!val) {
                if (internalDate.value !== null) internalDate.value = null;

                if (!isTyping.value) displayValue.value = '';

                return;
            }
            const dateObj = parseDateValue(val);
            if (dateObj) {
                if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime()) {
                    internalDate.value = dateObj;
                    currentMonth.value = dateObj.getMonth();
                    currentYear.value = dateObj.getFullYear();
                }
                if (!isTyping.value) {
                    const d = String(dateObj.getDate()).padStart(2, '0');
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const y = String(dateObj.getFullYear());
                    displayValue.value = `${d}/${m}/${y}`;
                }
            } else {
                if (internalDate.value !== null) internalDate.value = null;

                if (!isTyping.value) displayValue.value = '';

            }
        },
        { immediate: true }
    );

    // Sincroniza internalDate -> modelValue e displayValue
    watch(internalDate, (newDate) => {
        if (!newDate) {
            if (!isTyping.value) displayValue.value = '';

            if (modelValue.value !== '') modelValue.value = '';
            return;
        }
        const d = String(newDate.getDate()).padStart(2, '0');
        const m = String(newDate.getMonth() + 1).padStart(2, '0');
        const y = String(newDate.getFullYear());
        const formatted = `${d}/${m}/${y}`;
        if (!isTyping.value && displayValue.value !== formatted) displayValue.value = formatted;

        const formattedModel = useDateFormat(newDate, 'YYYY-MM-DD HH:mm:ss').value;
        if (formattedModel !== modelValue.value) modelValue.value = formattedModel;
    });

    const formattedDisplay = computed(() => displayValue.value);

    const calendarDays = computed(() => {
        const year = currentYear.value;
        const month = currentMonth.value;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean; date: Date }> = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const prevMonthVal = month === 0 ? 11 : month - 1;
            const prevYearVal = month === 0 ? year - 1 : year;
            days.push({
                day: d,
                month: prevMonthVal,
                year: prevYearVal,
                isCurrentMonth: false,
                date: new Date(prevYearVal, prevMonthVal, d)
            });
        }

        for (let i = 1; i <= daysInMonth; i++) days.push({
            day: i,
            month,
            year,
            isCurrentMonth: true,
            date: new Date(year, month, i)
        });


        const total = Math.ceil(days.length / 7) * 7;
        const remaining = total - days.length;
        for (let i = 1; i <= remaining; i++) {
            const nextMonthVal = month === 11 ? 0 : month + 1;
            const nextYearVal = month === 11 ? year + 1 : year;
            days.push({
                day: i,
                month: nextMonthVal,
                year: nextYearVal,
                isCurrentMonth: false,
                date: new Date(nextYearVal, nextMonthVal, i)
            });
        }

        return days;
    });

    const yearsList = computed(() => {
        const list: number[] = [];
        const start = yearRangeStart.value - 1;
        for (let i = 0; i < 12; i++) list.push(start + i);

        return list;
    });

    const toggleView = () => {
        if (currentView.value === 'date') currentView.value = 'month';
        else if (currentView.value === 'month') {
            yearRangeStart.value = Math.floor(currentYear.value / 10) * 10;
            currentView.value = 'year';
        } else currentView.value = 'date';

    };

    const selectMonth = (monthIndex: number) => {
        currentMonth.value = monthIndex;
        currentView.value = 'date';
    };

    const selectYear = (year: number) => {
        currentYear.value = year;
        currentView.value = 'month';
    };

    const prevMonth = () => {
        if (currentMonth.value === 0) {
            currentMonth.value = 11;
            currentYear.value--;
        } else currentMonth.value--;
    };

    const nextMonth = () => {
        if (currentMonth.value === 11) {
            currentMonth.value = 0;
            currentYear.value++;
        } else currentMonth.value++;
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

    const prevNavAriaLabel = computed(() => {
        if (currentView.value === 'date') return 'Mês anterior';
        if (currentView.value === 'month') return 'Ano anterior';
        return 'Década anterior';
    });

    const nextNavAriaLabel = computed(() => {
        if (currentView.value === 'date') return 'Próximo mês';
        if (currentView.value === 'month') return 'Próximo ano';
        return 'Próxima década';
    });

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

    const fullWeekDayNames = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    const focusedCellIndex = ref(0);
    const dayButtonRefs = ref<(HTMLButtonElement | null)[]>([]);

    const setDayButtonRef = (el: unknown, index: number) => {
        dayButtonRefs.value[index] = el as HTMLButtonElement | null;
    };

    const formatDateAria = (date: Date): string => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const isCurMonth = date.getMonth() === currentMonth.value && date.getFullYear() === currentYear.value;
        return `${day} de ${month} de ${year}${!isCurMonth ? ' (outro mês)' : ''}`;
    };

    const selectDate = (cell: { date: Date }) => {
        if (isDateDisabled(cell.date)) return;
        internalDate.value = cell.date;
        hide();
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
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (calendarDays.value[nextIndex] && !isDateDisabled(calendarDays.value[nextIndex].date)) selectDate(calendarDays.value[nextIndex]);

                return;
            case 'Escape':
                event.preventDefault();
                skipFocusOpen = true;
                hide();
                inputElement.value?.focus();
                return;
            default:
                return;
        }

        focusedCellIndex.value = nextIndex;
        dayButtonRefs.value[nextIndex]?.focus();
    };

    const isSelectedDate = (cellDate: Date) => {
        if (!internalDate.value) return false;
        return (
            cellDate.getFullYear() === internalDate.value.getFullYear() &&
            cellDate.getMonth() === internalDate.value.getMonth() &&
            cellDate.getDate() === internalDate.value.getDate()
        );
    };

    const isToday = (cellDate: Date) => {
        const today = new Date();
        return (
            cellDate.getFullYear() === today.getFullYear() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getDate() === today.getDate()
        );
    };

    let skipFocusOpen = false;

    const open = () => {
        if (props.disabled) return;
        if (skipFocusOpen) {
            skipFocusOpen = false;
            return;
        }
        isOpen.value = true;
    };

    const hide = () => {
        isOpen.value = false;
    };

    const onBlur = () => {
        validate();
    };

    const onInput = (e: Event) => {
        const el = e.target as HTMLInputElement;
        const val = el.value;
        displayValue.value = val;
        isTyping.value = true;

        try {
            if (!val) {
                internalDate.value = null;
                return;
            }
            const digits = val.replace(/\D/g, '');
            if (digits.length === 8) {
                const day = parseInt(digits.slice(0, 2), 10);
                const month = parseInt(digits.slice(2, 4), 10) - 1;
                const year = parseInt(digits.slice(4, 8), 10);

                if (month >= 0 && month <= 11 && year >= 1000 && year <= 9999) {
                    const date = new Date(year, month, day);
                    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) if (!isDateDisabled(date)) {
                        internalDate.value = date;
                        currentMonth.value = month;
                        currentYear.value = year;
                        return;
                    }

                }
            }
            if (internalDate.value !== null) internalDate.value = null;

        } finally {
            isTyping.value = false;
        }
    };

    const onInputChange = (e: Event) => {
        onInput(e);
    };

    const validate = () => {
        hasBeenTouched.value = true;
    };

    const isDone = computed(() => {
        if (props.noDone || props.noStatus) return null;
        if (props.done !== undefined) return props.done;
        return internalDate.value !== null;
    });

    const isCaution = computed(() => {
        if (props.noCaution || props.noStatus) return false;
        if (props.caution !== undefined) return props.caution;
        if (!hasBeenTouched.value && !modelValue.value) return false;
        return props.required && !internalDate.value;
    });

    const errorMessage = computed(() => {
        if (props.noStatus) return null;
        if (props.noError) return null;
        if (typeof props.error === 'string') return props.error;
        if (isCaution.value && typeof props.caution === 'string') return props.caution;
        if (isCaution.value) return 'Data é obrigatória';
        return null;
    });

    const onInputKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' || (event.altKey && event.key === 'ArrowDown')) {
            event.preventDefault();
            if (!isOpen.value) open();

            nextTick(() => {
                dayButtonRefs.value[focusedCellIndex.value]?.focus();
            });
        } else if (event.key === 'Escape' && isOpen.value) {
            event.preventDefault();
            skipFocusOpen = true;
            hide();
        }
    };

    const onGlobalKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value) {
            skipFocusOpen = true;
            hide();
        }
    };

    let outsidePointerDown = false;
    const onDocPointerDown = (e: MouseEvent | TouchEvent | PointerEvent) => {
        const target = e.target as Node | null;
        if (overlayEl.value && !overlayEl.value.contains(target) && triggerEl.value && !triggerEl.value.contains(target)) outsidePointerDown = true;
        else outsidePointerDown = false;

    };

    const onDocClick = (e: MouseEvent) => {
        const target = e.target as Node | null;
        if (outsidePointerDown && overlayEl.value && !overlayEl.value.contains(target) && triggerEl.value && !triggerEl.value.contains(target)) hide();

        outsidePointerDown = false;
    };

    watch(isOpen, (open) => {
        if (typeof window !== 'undefined') if (open) {
            window.addEventListener('keydown', onGlobalKeydown);
            document.addEventListener('pointerdown', onDocPointerDown, true);
            document.addEventListener('click', onDocClick, true);
        } else {
            window.removeEventListener('keydown', onGlobalKeydown);
            document.removeEventListener('pointerdown', onDocPointerDown, true);
            document.removeEventListener('click', onDocClick, true);
        }


        if (open) {
            currentView.value = 'date';
            dayButtonRefs.value = [];
            nextTick(() => {
                const selectedIdx = calendarDays.value.findIndex((c) => isSelectedDate(c.date));
                if (selectedIdx >= 0) focusedCellIndex.value = selectedIdx;
                else {
                    const firstDayIdx = calendarDays.value.findIndex((c) => c.isCurrentMonth && c.day === 1);
                    focusedCellIndex.value = firstDayIdx >= 0 ? firstDayIdx : 0;
                }
            });
        }
    });

    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', onGlobalKeydown);
            document.removeEventListener('pointerdown', onDocPointerDown, true);
            document.removeEventListener('click', onDocClick, true);
        }
    });

    defineExpose({
        internalDate,
        displayValue,
        formattedDisplay,
        validate,
        open,
        hide,
        currentView,
        currentMonth,
        currentYear,
        isDateDisabled,
        selectToday,
        clearValue,
        toggleView,
        selectMonth,
        selectYear
    });
</script>

<style lang="scss" scoped>
    .max-input-date-picker {
        .max-datepicker-wrapper {
            width: 100%;
            display: flex;
            align-items: center;

            .max-datepicker-input {
                width: 100%;
                height: 36px;
                border: none;
                outline: none;
                background: transparent;
                font-size: 0.9rem;
                color: var(--background-700);
                padding: 0 10px;
                cursor: pointer;
            }
        }
    }

    .max-datepicker-panel {
        position: fixed;
        z-index: var(--z-dropdown, 1000);
        background: var(--background-0, #fff);
        border: 1px solid var(--surface-border);
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

            .max-datepicker-title {
                font-weight: 600;
                font-size: 0.95rem;
                color: var(--background-775);
            }

            .max-datepicker-title-btn {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background-color 0.15s ease;

                &:hover {
                    background: var(--background-100, #f1f5f9);
                    color: var(--max-primary-500, #00768E);
                }

                &:focus-visible {
                    outline: 2px solid var(--max-primary-500, #00768E);
                    outline-offset: 2px;
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
                    color: var(--max-primary-500, #00768E);
                }

                &:focus-visible {
                    outline: 2px solid var(--max-primary-500, #00768E);
                    outline-offset: 2px;
                    border-radius: 4px;
                }
            }
        }

        .max-datepicker-grid {
            .max-datepicker-weekdays {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                text-align: center;
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--background-650);
                margin-bottom: 6px;
            }

            .max-datepicker-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;

                .max-datepicker-day {
                    aspect-ratio: 1;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 0.85rem;
                    color: var(--background-700);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;

                    &:hover:not(:disabled) {
                        background: var(--background-100, #f1f5f9);
                    }

                    &:focus-visible {
                        outline: 2px solid var(--max-primary-500, #00768E);
                        outline-offset: 1px;
                        z-index: 1;
                    }

                    &.is-other-month {
                        opacity: 0.35;
                    }

                    &.is-today {
                        border: 1px solid var(--max-primary-400, #178da5);
                    }

                    &.is-selected {
                        background: var(--max-primary-500, #00768e) !important;
                        color: #fff !important;
                        font-weight: 600;
                    }

                    &.is-disabled,
                    &:disabled {
                        opacity: 0.25 !important;
                        cursor: not-allowed !important;
                        pointer-events: none;
                    }
                }
            }
        }

        .max-datepicker-months,
        .max-datepicker-years {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 8px 0;

            .max-datepicker-month-btn,
            .max-datepicker-year-btn {
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

                &:focus-visible {
                    outline: 2px solid var(--max-primary-500, #00768E);
                    outline-offset: 1px;
                }

                &.is-selected {
                    background: var(--max-primary-500, #00768E);
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
            border-top: 1px solid var(--surface-border);
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
                color: var(--max-primary-500, #00768E);

                &:hover {
                    background: var(--background-100, #f1f5f9);
                }

                &:focus-visible {
                    outline: 2px solid var(--max-primary-500, #00768E);
                    outline-offset: 1px;
                }

                &.clear {
                    color: var(--red-700, #b91c1c);
                }
            }
        }
    }
</style>
