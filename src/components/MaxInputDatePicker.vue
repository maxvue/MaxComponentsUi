<template>
    <InputBase
        v-bind="props"
        class="input-base-date-picker"
        :error="errorMessage"
        :caution="isCaution"
        :done="isDone"
        :icon="props.icon ?? 'solar:calendar-line-duotone'"
    >
        <div ref="triggerEl" class="max-datepicker-wrapper">
            <input
                ref="inputElement"
                type="text"
                class="p-inputtext max-datepicker-input"
                :value="formattedDisplay"
                :placeholder="props.placeholder ?? 'dd/mm/aaaa'"
                :disabled="props.disabled"
                @focus="open"
                @click="open"
                @blur="onBlur"
                @change="onInputChange"
            />
        </div>

        <Teleport to="body">
            <div v-if="isOpen" class="max-datepicker-backdrop" @click="hide">
                <div
                    ref="overlayEl"
                    class="p-datepicker-panel max-datepicker-panel"
                    :style="{ top: position.top + 'px', left: position.left + 'px' }"
                    @click.stop
                >
                    <div class="max-datepicker-header">
                        <button type="button" class="max-datepicker-nav-btn" @click.stop="prevMonth">
                            <MaxIcon icon="lucide:chevron-left" size="1.1" />
                        </button>
                        <div class="max-datepicker-title">
                            {{ monthNames[currentMonth] }} {{ currentYear }}
                        </div>
                        <button type="button" class="max-datepicker-nav-btn" @click.stop="nextMonth">
                            <MaxIcon icon="lucide:chevron-right" size="1.1" />
                        </button>
                    </div>

                    <div class="max-datepicker-grid">
                        <div class="max-datepicker-weekdays">
                            <span v-for="(wd, idx) in weekDays" :key="idx" class="max-datepicker-weekday">
                                {{ wd }}
                            </span>
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
                                    'is-today': isToday(cell.date)
                                }"
                                @click.stop="selectDate(cell)"
                            >
                                {{ cell.day }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onBeforeUnmount } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import { useDateFormat, useElementBounding, useElementSize, useWindowSize } from '@maxvue/max-use';
    import { SelectGroupOptions } from '../types';

    const modelValue = defineModel<any>({ default: '' });
    const internalDate = ref<Date | null>(null);
    const hasBeenTouched = ref(false);

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
        inLine: false
    });

    const triggerEl = ref<HTMLElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const inputElement = ref<HTMLInputElement | null>(null);
    const isOpen = ref(false);

    const currentMonth = ref(new Date().getMonth());
    const currentYear = ref(new Date().getFullYear());

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const { x, y, width: width_btn, height: height_btn } = useElementBounding(triggerEl as any);
    const { width: width_el, height: height_el } = useElementSize(overlayEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetW = width_btn.value;
        const targetH = height_btn.value;

        let top = targetY + targetH + 4;
        let left = targetX;

        if (top + (height_el.value || 280) > window_height.value && targetY - (height_el.value || 280) > 0) top = targetY - (height_el.value || 280) - 4;


        if (left + (width_el.value || 280) > window_width.value) left = Math.max(10, window_width.value - (width_el.value || 280) - 10);


        return { top, left };
    });

    // Sincroniza modelValue -> internalDate
    watch(
        modelValue,
        (val) => {
            if (!val) {
                internalDate.value = null;
                return;
            }
            const dateObj =
                val instanceof Date
                    ? val
                    : new Date(typeof val === 'string' && !val.includes('T') && !val.includes(' ') ? val + 'T00:00:00' : val);
            if (!isNaN(dateObj.getTime())) {
                if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime()) {
                    internalDate.value = dateObj;
                    currentMonth.value = dateObj.getMonth();
                    currentYear.value = dateObj.getFullYear();
                }
            } else internalDate.value = null;

        },
        { immediate: true }
    );

    // Sincroniza internalDate -> modelValue
    watch(internalDate, (newDate) => {
        if (!newDate) {
            if (modelValue.value !== '') modelValue.value = '';
            return;
        }
        const formatted = useDateFormat(newDate, 'YYYY-MM-DD HH:mm:ss').value;
        if (formatted !== modelValue.value) modelValue.value = formatted;
    });

    const formattedDisplay = computed(() => {
        if (!internalDate.value) return '';
        const d = String(internalDate.value.getDate()).padStart(2, '0');
        const m = String(internalDate.value.getMonth() + 1).padStart(2, '0');
        const y = String(internalDate.value.getFullYear());
        return `${d}/${m}/${y}`;
    });

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

    const selectDate = (cell: { date: Date }) => {
        internalDate.value = cell.date;
        hide();
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

    const open = () => {
        if (props.disabled) return;
        isOpen.value = true;
    };

    const hide = () => {
        isOpen.value = false;
    };

    const onBlur = () => {
        validate();
    };

    const onInputChange = (e: Event) => {
        const val = (e.target as HTMLInputElement).value.trim();
        if (!val) {
            internalDate.value = null;
            return;
        }
        const parts = val.split(/[\/\-.]/);
        if (parts.length === 3) {
            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1;
            let year = parseInt(parts[2], 10);
            if (parts[0].length === 4) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                day = parseInt(parts[2], 10);
            }
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime()) && date.getDate() === day) internalDate.value = date;

        }
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

    const onGlobalKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value) hide();

    };

    if (typeof window !== 'undefined') window.addEventListener('keydown', onGlobalKeydown);


    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') window.removeEventListener('keydown', onGlobalKeydown);

    });

    defineExpose({
        internalDate,
        validate,
        open,
        hide
    });
</script>

<style lang="scss">
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
            color: var(--text-c, #334155);
            padding: 0 10px;
            cursor: pointer;
        }
    }

    .max-datepicker-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1100;
        background: transparent;
    }

    .max-datepicker-panel {
        position: fixed;
        z-index: 1101;
        background: var(--background-0, #fff);
        border: 1px solid var(--surface-border, #e2e8f0);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 15%);
        padding: 12px;
        width: 280px;
        user-select: none;

        .max-datepicker-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;

            .max-datepicker-title {
                font-weight: 600;
                font-size: 0.95rem;
                color: var(--text-c, #334155);
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
                color: var(--background-600, #64748b);

                &:hover {
                    background: var(--background-100, #f1f5f9);
                    color: var(--primary-500, #3b82f6);
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
                color: var(--background-500, #94a3b8);
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
                    color: var(--text-c, #334155);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;

                    &:hover {
                        background: var(--background-100, #f1f5f9);
                    }

                    &.is-other-month {
                        opacity: 0.35;
                    }

                    &.is-today {
                        border: 1px solid var(--primary-400, #60a5fa);
                    }

                    &.is-selected {
                        background: var(--primary-500, #3b82f6) !important;
                        color: #fff !important;
                        font-weight: 600;
                    }
                }
            }
        }
    }
</style>
