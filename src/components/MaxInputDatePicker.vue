<template>
    <InputBase v-bind="props" class="input-base-date-picker" :error="errorMessage" :caution="isCaution" :done="isDone" :icon="props.icon ?? 'solar:calendar-line-duotone'">
        <div ref="triggerRef" class="p-datepicker p-component w-full relative">
            <MaxBaseInput
                type="text"
                v-maska="'##/##/####'"
                :modelValue="formattedDisplayDate"
                :placeholder="props.placeholder ?? 'DD/MM/AAAA'"
                :disabled="props.disabled"
                @update:modelValue="onManualInput"
                @blur="onBlur"
                @focus="onFocus"
            />
        </div>

        <MaxBaseOverlay
            v-model:visible="overlayVisible"
            :target="triggerRef"
        >
            <div class="p-datepicker-panel p-component" role="dialog">
                <div class="p-datepicker-header">
                    <button type="button" class="p-datepicker-prev" aria-label="Mês anterior" @click="prevMonth">
                        ‹
                    </button>
                    <div class="p-datepicker-title">
                        <span>{{ currentMonthName }} {{ currentYear }}</span>
                    </div>
                    <button type="button" class="p-datepicker-next" aria-label="Próximo mês" @click="nextMonth">
                        ›
                    </button>
                </div>

                <div class="p-datepicker-calendar-container">
                    <table class="p-datepicker-calendar" role="grid">
                        <thead>
                            <tr>
                                <th v-for="day in weekDays" :key="day" scope="col">{{ day }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(week, wIdx) in calendarWeeks" :key="wIdx">
                                <td v-for="(day, dIdx) in week" :key="dIdx" role="gridcell" :aria-selected="isSameDay(day.date, internalDate)">
                                    <button
                                        type="button"
                                        :class="['p-datepicker-day', {
                                            'p-datepicker-day-other-month': day.otherMonth,
                                            'p-datepicker-day-selected': isSameDay(day.date, internalDate),
                                            'p-datepicker-day-today': day.isToday
                                        }]"
                                        :disabled="day.disabled"
                                        @click="selectDate(day.date)"
                                    >
                                        {{ day.dayNumber }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="p-datepicker-buttonbar">
                    <button type="button" class="p-button-text" @click="selectToday">Hoje</button>
                    <button type="button" class="p-button-text" @click="clearDate">Limpar</button>
                </div>
            </div>
        </MaxBaseOverlay>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';
    import MaxBaseOverlay from './base/MaxBaseOverlay.vue';
    import { useDateFormat } from '@maxvue/max-use';
    import { SelectGroupOptions } from '../types';
    import { vMaska } from 'maska/vue';

    const modelValue = defineModel<any>({ default: '' });
    const internalDate = ref<Date | null>(null);
    const hasBeenTouched = ref(false);
    const triggerRef = ref<HTMLElement | null>(null);
    const overlayVisible = ref(false);
    const _attrs: any = useAttrs();

    // Data de navegação no calendário
    const viewDate = ref<Date>(new Date());

    interface Props {
        value?: any;
        modelValue?: any;
        class?: string;
        icon?: string | undefined;
        i?: string | undefined;
        disabled?: boolean | undefined;
        float?: boolean | undefined;
        msg?: string | undefined;
        message?: string | undefined;
        iconMessage?: string | undefined;
        label?: string | undefined;
        done?: string | boolean | null | undefined;
        error?: string | boolean | null | undefined;
        caution?: string | boolean | null | undefined;
        required?: boolean | undefined;
        textCenter?: boolean | undefined;
        textRight?: boolean | undefined;
        dark?: boolean | string | number | undefined;
        light?: boolean | string | number | undefined;
        default?: string | number | boolean | null | undefined;
        options?: any[];
        groupOptions?: SelectGroupOptions;
        iconLeft?: string | undefined;
        iconRight?: string | undefined;
        loadOptions?: () => Promise<any[]>;
        optionValue?: string;
        optionLabel?: string;
        optionName?: string;
        iconDark?: boolean | undefined | number | string;
        iconLight?: boolean | undefined | number | string;
        iconPos?: 'left' | 'right';
        inLine?: boolean;
        noDone?: boolean;
        noCaution?: boolean;
        noError?: boolean;
        noStatus?: boolean;
        noIcon?: boolean;
        dateFormat?: string;
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

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const currentMonthName = computed(() => monthNames[viewDate.value.getMonth()]);
    const currentYear = computed(() => viewDate.value.getFullYear());

    const formattedDisplayDate = computed(() => {
        if (!internalDate.value) return '';
        const day = String(internalDate.value.getDate()).padStart(2, '0');
        const month = String(internalDate.value.getMonth() + 1).padStart(2, '0');
        const year = internalDate.value.getFullYear();
        return `${day}/${month}/${year}`;
    });

    const isSameDay = (d1: Date | null, d2: Date | null) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    };

    const calendarWeeks = computed(() => {
        const year = viewDate.value.getFullYear();
        const month = viewDate.value.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const days: Array<{ date: Date; dayNumber: number; otherMonth: boolean; isToday: boolean; disabled: boolean }> = [];
        const today = new Date();

        // Dias do mês anterior
        const startDayOfWeek = firstDayOfMonth.getDay();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push({
                date,
                dayNumber: date.getDate(),
                otherMonth: true,
                isToday: isSameDay(date, today),
                disabled: false
            });
        }

        // Dias do mês atual
        for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
            const date = new Date(year, month, d);
            days.push({
                date,
                dayNumber: d,
                otherMonth: false,
                isToday: isSameDay(date, today),
                disabled: false
            });
        }

        // Dias do próximo mês
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const date = new Date(year, month + 1, d);
            days.push({
                date,
                dayNumber: d,
                otherMonth: true,
                isToday: isSameDay(date, today),
                disabled: false
            });
        }

        const weeks = [];
        for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

        return weeks;
    });

    const prevMonth = () => {
        viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1);
    };

    const nextMonth = () => {
        viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1);
    };

    const selectDate = (date: Date) => {
        internalDate.value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        overlayVisible.value = false;
        validate();
    };

    const selectToday = () => {
        const today = new Date();
        viewDate.value = today;
        selectDate(today);
    };

    const clearDate = () => {
        internalDate.value = null;
        modelValue.value = '';
        overlayVisible.value = false;
        validate();
    };

    const onManualInput = (val: string) => {
        if (!val || val.length < 10) {
            if (!val) {
                internalDate.value = null;
                modelValue.value = '';
            }
            return;
        }
        const parts = val.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                const dateObj = new Date(year, month, day);
                internalDate.value = dateObj;
                viewDate.value = dateObj;
            }
        }
    };

    const onFocus = () => {
        overlayVisible.value = true;
    };

    const onBlur = () => {
        validate();
    };

    // Sincroniza modelValue -> internalDate
    watch(modelValue, (val) => {
        if (!val) {
            internalDate.value = null;
            return;
        }
        const dateObj = val instanceof Date ? val : new Date(typeof val === 'string' && !val.includes('T') && !val.includes(' ') ? val + 'T00:00:00' : val);
        if (!isNaN(dateObj.getTime())) {
            if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime()) {
                internalDate.value = dateObj;
                viewDate.value = dateObj;
            }
        } else internalDate.value = null;
    }, { immediate: true });

    // Sincroniza internalDate -> modelValue
    watch(internalDate, (newDate) => {
        if (!newDate) {
            if (modelValue.value !== '') modelValue.value = '';
            return;
        }
        const formatted = useDateFormat(newDate, 'YYYY-MM-DD HH:mm:ss').value;
        if (formatted !== modelValue.value) modelValue.value = formatted;
    });

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
        if (isCaution.value) return ('Data é obrigatória');
        return null;
    });
</script>

<style lang="scss">
    .p-datepicker-panel {
        transform: translateX(-10px);
        background-color: var(--background-0, #fff);
        border: 1px solid var(--max-border-color, #e2e8f0);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
        padding: 10px;

        .p-datepicker-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;

            button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 4px 8px;
                color: var(--background-600);

                &:hover {
                    color: var(--blue-600);
                }
            }

            .p-datepicker-title {
                font-weight: bold;
                color: var(--background-750);
            }
        }

        .p-datepicker-calendar {
            width: 100%;
            border-collapse: collapse;

            th {
                font-size: 0.8rem;
                color: var(--background-600);
                padding: 4px;
            }

            td {
                padding: 2px;
                text-align: center;
            }

            .p-datepicker-day {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: none;
                background: transparent;
                cursor: pointer;
                color: var(--background-750);
                font-size: 0.85rem;

                &:hover {
                    background-color: var(--background-200);
                }

                &.p-datepicker-day-other-month {
                    color: var(--background-400);
                }

                &.p-datepicker-day-today {
                    border: 1px solid var(--blue-500);
                }

                &.p-datepicker-day-selected {
                    background-color: var(--blue-600);
                    color: #fff;
                }
            }
        }

        .p-datepicker-buttonbar {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;

            button {
                background: none;
                border: none;
                color: var(--blue-600);
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 500;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }
</style>
