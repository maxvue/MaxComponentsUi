<template>
    <InputBase
        v-bind="inputBaseProps"
        class="max-input-birthday input-base-birthday"
        :error="errorMessage"
        :caution="isCaution"
        :done="isDone"
        :icon="props.icon ?? 'solar:calendar-line-duotone'"
    >
        <template #default="{ inputAttrs }">
            <div
                ref="wrapperRef"
                v-bind="inputAttrs"
                class="max-birthday-wrapper"
                :class="{
                    'is-disabled': props.disabled,
                    'is-focused': Boolean(activeSegment),
                    'is-complete': isDateComplete
                }"
            >
                <div class="max-birthday-controls" role="group" aria-label="Data de nascimento">
                    <!-- Segmento: Dia -->
                    <button
                        ref="dayTriggerRef"
                        type="button"
                        class="max-birthday-segment max-birthday-segment--day"
                        :class="{
                            'is-empty': !selectedDay,
                            'is-active': activeSegment === 'day'
                        }"
                        :disabled="props.disabled"
                        role="combobox"
                        aria-haspopup="listbox"
                        :aria-expanded="activeSegment === 'day'"
                        aria-label="Dia de nascimento"
                        @click.stop="toggleSegment('day')"
                        @keydown="onSegmentKeydown($event, 'day')"
                    >
                        <span class="max-birthday-segment-text">
                            {{ formattedDay }}
                        </span>
                    </button>

                    <!-- Separador 1 -->
                    <span class="max-birthday-separator" aria-hidden="true">de</span>

                    <!-- Segmento: Mês -->
                    <button
                        ref="monthTriggerRef"
                        type="button"
                        class="max-birthday-segment max-birthday-segment--month"
                        :class="{
                            'is-empty': !selectedMonth,
                            'is-active': activeSegment === 'month'
                        }"
                        :disabled="props.disabled"
                        role="combobox"
                        aria-haspopup="listbox"
                        :aria-expanded="activeSegment === 'month'"
                        aria-label="Mês de nascimento"
                        @click.stop="toggleSegment('month')"
                        @keydown="onSegmentKeydown($event, 'month')"
                    >
                        <span class="max-birthday-segment-text">
                            {{ formattedMonth }}
                        </span>
                    </button>

                    <!-- Separador 2 -->
                    <span class="max-birthday-separator" aria-hidden="true">de</span>

                    <!-- Segmento: Ano -->
                    <button
                        ref="yearTriggerRef"
                        type="button"
                        class="max-birthday-segment max-birthday-segment--year"
                        :class="{
                            'is-empty': !selectedYear,
                            'is-active': activeSegment === 'year'
                        }"
                        :disabled="props.disabled"
                        role="combobox"
                        aria-haspopup="listbox"
                        :aria-expanded="activeSegment === 'year'"
                        aria-label="Ano de nascimento"
                        @click.stop="toggleSegment('year')"
                        @keydown="onSegmentKeydown($event, 'year')"
                    >
                        <span class="max-birthday-segment-text">
                            {{ formattedYear }}
                        </span>
                    </button>
                </div>

                <!-- Botão Limpar -->
                <button
                    v-if="props.clearable && hasAnyValue && !props.disabled"
                    type="button"
                    class="max-birthday-clear-btn"
                    aria-label="Limpar data de nascimento"
                    @click.stop="clearSelection"
                >
                    <MaxIcon icon="lucide:x" size="0.85" />
                </button>
            </div>

            <!-- Popover / Overlay ancorado ao segmento ativo -->
            <MaxBaseOverlay
                :visible="Boolean(activeSegment)"
                :target="activeTriggerElement"
                :offset="6"
                role="listbox"
                :aria-label="activeOverlayLabel"
                layer="dropdown"
                @update:visible="onOverlayVisibleChange"
                @before-show="onOverlayBeforeShow"
            >
                <div class="max-birthday-popover" @click.stop>
                    <!-- Popover do Dia -->
                    <div v-if="activeSegment === 'day'" class="max-birthday-days-panel">
                        <div class="max-birthday-panel-header">
                            <span class="max-birthday-panel-title">Selecione o dia</span>
                        </div>
                        <div class="max-birthday-days-grid" role="listbox" aria-label="Dias">
                            <button
                                v-for="d in availableDaysInMonth"
                                :key="d"
                                type="button"
                                class="max-birthday-option-btn max-birthday-day-btn"
                                :class="{ 'is-selected': selectedDay === d }"
                                role="option"
                                :aria-selected="selectedDay === d"
                                @click="selectDay(d)"
                            >
                                {{ String(d).padStart(2, '0') }}
                            </button>
                        </div>
                    </div>

                    <!-- Popover do Mês -->
                    <div v-else-if="activeSegment === 'month'" class="max-birthday-months-panel">
                        <div class="max-birthday-panel-header">
                            <span class="max-birthday-panel-title">Selecione o mês</span>
                        </div>
                        <div class="max-birthday-months-grid" role="listbox" aria-label="Meses">
                            <button
                                v-for="(mName, idx) in monthNames"
                                :key="idx + 1"
                                type="button"
                                class="max-birthday-option-btn max-birthday-month-btn"
                                :class="{ 'is-selected': selectedMonth === idx + 1 }"
                                role="option"
                                :aria-selected="selectedMonth === idx + 1"
                                @click="selectMonth(idx + 1)"
                            >
                                {{ mName }}
                            </button>
                        </div>
                    </div>

                    <!-- Popover do Ano -->
                    <div v-else-if="activeSegment === 'year'" class="max-birthday-years-panel">
                        <div class="max-birthday-panel-header">
                            <span class="max-birthday-panel-title">Selecione o ano</span>
                        </div>
                        <div
                            ref="yearsListRef"
                            class="max-birthday-years-list"
                            role="listbox"
                            aria-label="Anos"
                        >
                            <button
                                v-for="y in availableYears"
                                :key="y"
                                :ref="(el) => setYearButtonRef(el, y)"
                                type="button"
                                class="max-birthday-option-btn max-birthday-year-btn"
                                :class="{ 'is-selected': selectedYear === y }"
                                role="option"
                                :aria-selected="selectedYear === y"
                                @click="selectYear(y)"
                            >
                                {{ y }}
                            </button>
                        </div>
                    </div>
                </div>
            </MaxBaseOverlay>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, nextTick, ref, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxBaseOverlay from './base/MaxBaseOverlay.vue';

    type SegmentType = 'day' | 'month' | 'year';

    const monthNames = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ] as const;

    interface Props {
        /** Valor no padrão ISO 'YYYY-MM-DD' (ou null / vazio) */
        modelValue?: string | null;
        /** Alias para o valor v-model */
        value?: string | null;
        /** Rótulo do campo exibido acima ou inline */
        label?: string;
        /** Mensagem de erro ou estado booleano de erro */
        error?: string | boolean | null;
        /** Mensagem de aviso ou estado booleano de atenção */
        caution?: string | boolean | null;
        /** Define se o campo foi preenchido com sucesso */
        done?: string | boolean | null;
        /** Desativa o status de sucesso automático */
        noDone?: boolean;
        /** Desativa o status de atenção automático */
        noCaution?: boolean;
        /** Desativa o status de erro automático */
        noError?: boolean;
        /** Desativa todos os indicadores de status */
        noStatus?: boolean;
        /** Ícone principal exibido à esquerda */
        icon?: string;
        /** Campo desabilitado */
        disabled?: boolean;
        /** Campo obrigatório */
        required?: boolean;
        /** Mensagem auxiliar ou de feedback */
        message?: string;
        /** Alias para message */
        msg?: string;
        /** Ícone da mensagem de feedback */
        iconMessage?: string;
        /** Estilo FloatLabel */
        float?: boolean;
        /** Alinhamento do rótulo inline */
        inLine?: boolean;
        /** Classes CSS adicionais */
        class?: string;
        /** Ano mínimo permitido (default: 1900) */
        minYear?: number;
        /** Ano máximo permitido (default: ano atual) */
        maxYear?: number;
        /** Avanço automático suave para o próximo segmento ao selecionar (default: true) */
        autoAdvance?: boolean;
        /** Habilita botão para limpar o valor selecionado (default: true) */
        clearable?: boolean;
        /** Texto de placeholder para o dia (default: 'Dia') */
        dayPlaceholder?: string;
        /** Texto de placeholder para o mês (default: 'Mês') */
        monthPlaceholder?: string;
        /** Texto de placeholder para o ano (default: 'Ano') */
        yearPlaceholder?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: null,
        value: undefined,
        label: undefined,
        error: undefined,
        caution: undefined,
        done: undefined,
        noDone: false,
        noCaution: false,
        noError: false,
        noStatus: false,
        icon: undefined,
        disabled: false,
        required: false,
        message: undefined,
        msg: undefined,
        iconMessage: undefined,
        float: undefined,
        inLine: false,
        class: '',
        minYear: 1900,
        maxYear: () => new Date().getFullYear(),
        autoAdvance: true,
        clearable: true,
        dayPlaceholder: 'Dia',
        monthPlaceholder: 'Mês',
        yearPlaceholder: 'Ano'
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string | null];
        'update:value': [value: string | null];
        change: [value: string | null];
        clear: [];
    }>();

    // Referências dos elementos gatilho
    const wrapperRef = ref<HTMLElement | null>(null);
    const dayTriggerRef = ref<HTMLButtonElement | null>(null);
    const monthTriggerRef = ref<HTMLButtonElement | null>(null);
    const yearTriggerRef = ref<HTMLButtonElement | null>(null);
    const yearsListRef = ref<HTMLElement | null>(null);
    const yearButtonMap = new Map<number, HTMLButtonElement>();

    // Segmento ativo no momento
    const activeSegment = ref<SegmentType | null>(null);

    // Estado interno dos segmentos selecionados
    const selectedDay = ref<number | null>(null);
    const selectedMonth = ref<number | null>(null);
    const selectedYear = ref<number | null>(null);
    const hasBeenTouched = ref(false);

    const setYearButtonRef = (el: unknown, year: number) => {
        if (el) yearButtonMap.set(year, el as HTMLButtonElement);
        else yearButtonMap.delete(year);

    };

    /**
     * Calcula o número máximo de dias do mês e ano fornecidos.
     */
    const getDaysInMonth = (year: number | null, month: number | null): number => {
        if (!month) return 31;
        // Se o ano ainda não foi escolhido, usa 2024 (ano bissexto) como padrão flexível
        const y = year ?? 2024;
        return new Date(y, month, 0).getDate();
    };

    /**
     * Lista de dias válidos para o mês/ano selecionados (1 até 28..31).
     */
    const availableDaysInMonth = computed(() => {
        const maxDays = getDaysInMonth(selectedYear.value, selectedMonth.value);
        const days: number[] = [];
        for (let d = 1; d <= maxDays; d++) days.push(d);

        return days;
    });

    /**
     * Lista de anos em ordem decrescente (do maxYear até o minYear).
     */
    const availableYears = computed(() => {
        const years: number[] = [];
        const start = Math.max(1000, props.maxYear);
        const end = Math.max(1000, props.minYear);
        for (let y = start; y >= end; y--) years.push(y);

        return years;
    });

    /**
     * Elemento gatilho ativo para o posicionamento do MaxBaseOverlay.
     */
    const activeTriggerElement = computed<HTMLElement | null>(() => {
        if (activeSegment.value === 'day') return dayTriggerRef.value;
        if (activeSegment.value === 'month') return monthTriggerRef.value;
        if (activeSegment.value === 'year') return yearTriggerRef.value;
        return null;
    });

    /**
     * Rótulo de acessibilidade para o popover aberto.
     */
    const activeOverlayLabel = computed(() => {
        if (activeSegment.value === 'day') return 'Lista de seleção de dia';
        if (activeSegment.value === 'month') return 'Lista de seleção de mês';
        if (activeSegment.value === 'year') return 'Lista de seleção de ano';
        return 'Seleção de data';
    });

    // Formatações visuais
    const formattedDay = computed(() => {
        if (!selectedDay.value) return props.dayPlaceholder;
        return String(selectedDay.value).padStart(2, '0');
    });

    const formattedMonth = computed(() => {
        if (!selectedMonth.value) return props.monthPlaceholder;
        return monthNames[selectedMonth.value - 1] ?? props.monthPlaceholder;
    });

    const formattedYear = computed(() => {
        if (!selectedYear.value) return props.yearPlaceholder;
        return String(selectedYear.value);
    });

    const isDateComplete = computed(() => {
        return Boolean(selectedDay.value && selectedMonth.value && selectedYear.value);
    });

    const hasAnyValue = computed(() => {
        return Boolean(selectedDay.value || selectedMonth.value || selectedYear.value);
    });

    /**
     * Realiza o parsing de uma string ISO 'YYYY-MM-DD'.
     */
    const parseIsoDate = (val: string | null | undefined) => {
        if (!val || typeof val !== 'string') {
            selectedDay.value = null;
            selectedMonth.value = null;
            selectedYear.value = null;
            return;
        }

        const match = val.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (match) {
            const parsedYear = parseInt(match[1], 10);
            const parsedMonth = parseInt(match[2], 10);
            const parsedDay = parseInt(match[3], 10);

            if (parsedMonth >= 1 && parsedMonth <= 12) {
                const maxDays = getDaysInMonth(parsedYear, parsedMonth);
                if (parsedDay >= 1 && parsedDay <= maxDays) {
                    selectedYear.value = parsedYear;
                    selectedMonth.value = parsedMonth;
                    selectedDay.value = parsedDay;
                    return;
                }
            }
        }

        selectedDay.value = null;
        selectedMonth.value = null;
        selectedYear.value = null;
    };

    /**
     * Emite a alteração no formato ISO 'YYYY-MM-DD' ou null.
     */
    const emitDateUpdate = () => {
        hasBeenTouched.value = true;
        if (isDateComplete.value && selectedYear.value && selectedMonth.value && selectedDay.value) {
            const y = String(selectedYear.value).padStart(4, '0');
            const m = String(selectedMonth.value).padStart(2, '0');
            const d = String(selectedDay.value).padStart(2, '0');
            const iso = `${y}-${m}-${d}`;
            emit('update:modelValue', iso);
            emit('update:value', iso);
            emit('change', iso);
        } else {
            emit('update:modelValue', null);
            emit('update:value', null);
            emit('change', null);
        }
    };

    // Sincroniza props -> estado interno
    watch(
        () => props.modelValue ?? props.value,
        (newVal) => {
            parseIsoDate(newVal);
        },
        { immediate: true }
    );

    const toggleSegment = (segment: SegmentType) => {
        if (props.disabled) return;
        if (activeSegment.value === segment) activeSegment.value = null;
        else activeSegment.value = segment;

    };

    const closeOverlay = () => {
        activeSegment.value = null;
    };

    const onOverlayVisibleChange = (visible: boolean) => {
        if (!visible) closeOverlay();

    };

    /**
     * Ações de seleção de valores
     */
    const selectDay = (day: number) => {
        selectedDay.value = day;
        emitDateUpdate();

        if (props.autoAdvance) {
            activeSegment.value = 'month';
            nextTick(() => {
                monthTriggerRef.value?.focus();
            });
        } else {
            closeOverlay();
            nextTick(() => {
                dayTriggerRef.value?.focus();
            });
        }
    };

    const selectMonth = (month: number) => {
        selectedMonth.value = month;

        // Se o dia selecionado for maior que a quantidade de dias do mês, ajusta automaticamente
        const maxDays = getDaysInMonth(selectedYear.value, month);
        if (selectedDay.value && selectedDay.value > maxDays) selectedDay.value = maxDays;


        emitDateUpdate();

        if (props.autoAdvance) {
            activeSegment.value = 'year';
            nextTick(() => {
                yearTriggerRef.value?.focus();
            });
        } else {
            closeOverlay();
            nextTick(() => {
                monthTriggerRef.value?.focus();
            });
        }
    };

    const selectYear = (year: number) => {
        selectedYear.value = year;

        // Ajusta se Fevereiro for afetado por ano bissexto
        if (selectedMonth.value === 2 && selectedDay.value) {
            const maxDays = getDaysInMonth(year, 2);
            if (selectedDay.value > maxDays) selectedDay.value = maxDays;

        }

        emitDateUpdate();
        closeOverlay();
        nextTick(() => {
            yearTriggerRef.value?.focus();
        });
    };

    const clearSelection = () => {
        if (props.disabled) return;
        selectedDay.value = null;
        selectedMonth.value = null;
        selectedYear.value = null;
        closeOverlay();
        emitDateUpdate();
        emit('clear');
        nextTick(() => {
            dayTriggerRef.value?.focus();
        });
    };

    /**
     * Tratamento de teclado nos botões de trigger
     */
    const onSegmentKeydown = (event: KeyboardEvent, segment: SegmentType) => {
        if (props.disabled) return;

        if (event.key === 'ArrowDown' || (event.altKey && event.key === 'ArrowDown')) {
            event.preventDefault();
            activeSegment.value = segment;
        } else if (event.key === 'Escape') if (activeSegment.value) {
            event.preventDefault();
            closeOverlay();
        }

    };

    /**
     * Scroll automático no popover de anos para focar no ano selecionado
     */
    const onOverlayBeforeShow = () => {
        if (activeSegment.value === 'year') nextTick(() => {
            const targetYear = selectedYear.value ?? props.maxYear;
            const yearButton = yearButtonMap.get(targetYear);
            if (yearButton && yearsListRef.value) yearButton.scrollIntoView({ block: 'center', behavior: 'instant' });

        });

    };

    // Estados de validação para o InputBase
    const isDone = computed(() => {
        if (props.noDone || props.noStatus) return null;
        if (props.done !== undefined) return props.done;
        return isDateComplete.value;
    });

    const isCaution = computed(() => {
        if (props.noCaution || props.noStatus) return false;
        if (props.caution !== undefined) return props.caution;
        if (!hasBeenTouched.value && !hasAnyValue.value) return false;
        return props.required && !isDateComplete.value;
    });

    const errorMessage = computed(() => {
        if (props.noStatus || props.noError) return null;
        if (typeof props.error === 'string') return props.error;
        if (isCaution.value && typeof props.caution === 'string') return props.caution;
        if (isCaution.value) return 'Data de nascimento é obrigatória';
        return null;
    });

    // Filtra props repassadas para o InputBase
    const inputBaseProps = computed(() => {
        const {
            modelValue: _mv,
            value: _val,
            minYear: _minY,
            maxYear: _maxY,
            autoAdvance: _aa,
            clearable: _c,
            dayPlaceholder: _dp,
            monthPlaceholder: _mp,
            yearPlaceholder: _yp,
            ...rest
        } = props;
        return rest;
    });
</script>

<style lang="scss" scoped>
    .max-birthday-wrapper {
        display: inline-flex;
        align-items: center;
        width: 100%;
        min-height: 36px;
        position: relative;
        box-sizing: border-box;

        &.is-disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    .max-birthday-controls {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        gap: 6px;
    }

    .max-birthday-segment {
        background: transparent;
        border: none;
        padding: 4px 6px;
        margin: 0;
        font-family: inherit;
        font-size: 0.875rem;
        color: var(--background-800, #1e293b);
        border-radius: 4px;
        cursor: pointer;
        outline: none;
        transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        line-height: 1.25;
        white-space: nowrap;

        &:hover:not(:disabled) {
            background-color: var(--background-100, #f1f5f9);
        }

        &:focus-visible {
            outline: 2px solid var(--max-primary-500, #00768e);
            outline-offset: 1px;
        }

        &.is-active {
            background-color: var(--max-primary-50, #67c8db);
            color: var(--max-primary-600, #005f77);
            font-weight: 500;
        }

        &.is-empty {
            color: var(--background-400, #94a3b8);
        }

        &:disabled {
            cursor: not-allowed;
            color: var(--background-400, #94a3b8);
        }

        &--day {
            min-width: 28px;
            text-align: center;
        }

        &--month {
            text-align: center;
        }

        &--year {
            min-width: 44px;
            text-align: center;
        }
    }

    .max-birthday-separator {
        color: var(--background-400, #94a3b8);
        font-size: 0.8125rem;
        user-select: none;
        display: inline-flex;
        align-items: center;
    }

    .max-birthday-clear-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        padding: 4px;
        margin-left: auto;
        color: var(--background-400, #94a3b8);
        border-radius: 50%;
        cursor: pointer;
        transition: color 0.15s ease, background-color 0.15s ease;

        &:hover {
            color: var(--background-700, #334155);
            background-color: var(--background-100, #f1f5f9);
        }

        &:focus-visible {
            outline: 2px solid var(--max-primary-500, #00768e);
        }
    }

    .max-birthday-popover {
        background-color: var(--background-0, #fff);
        border: 1px solid var(--background-200, #e2e8f0);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
        padding: 10px;
        box-sizing: border-box;
        user-select: none;
        color: var(--background-800, #1e293b);
    }

    .max-birthday-panel-header {
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--background-100, #f1f5f9);
    }

    .max-birthday-panel-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--background-500, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .max-birthday-option-btn {
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        font-family: inherit;
        font-size: 0.8125rem;
        color: var(--background-700, #334155);
        cursor: pointer;
        transition: background-color 0.12s ease, color 0.12s ease;

        &:hover {
            background-color: var(--background-100, #f1f5f9);
            color: var(--background-900, #0f172a);
        }

        &:focus-visible {
            outline: 2px solid var(--max-primary-500, #00768e);
        }

        &.is-selected {
            background-color: var(--max-primary-500, #00768e);
            color: #fff;
            font-weight: 600;

            &:hover {
                background-color: var(--max-primary-600, #005f77);
            }
        }
    }

    // Grid de dias
    .max-birthday-days-grid {
        display: grid;
        grid-template-columns: repeat(7, 32px);
        gap: 4px;
    }

    .max-birthday-day-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }

    // Grid de meses
    .max-birthday-months-grid {
        display: grid;
        grid-template-columns: repeat(3, 86px);
        gap: 6px;
    }

    .max-birthday-month-btn {
        padding: 8px 6px;
        text-align: center;
        white-space: nowrap;
    }

    // Lista de anos
    .max-birthday-years-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 220px;
        min-width: 110px;
        overflow-y: auto;
        padding-right: 4px;

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: var(--background-300, #cbd5e1);
            border-radius: 3px;
        }
    }

    .max-birthday-year-btn {
        padding: 6px 12px;
        text-align: center;
    }

    // Modo escuro
    :global(.dark) {
        .max-birthday-popover {
            background-color: var(--background-850, #0f1d2a);
            border-color: var(--background-700, #1e3a52);
            color: var(--background-100, #e2e8f0);
            box-shadow: 0 4px 20px rgb(0 0 0 / 40%);
        }

        .max-birthday-panel-header {
            border-bottom-color: var(--background-700, #1e3a52);
        }

        .max-birthday-panel-title {
            color: var(--background-400, #8ad6e8);
        }

        .max-birthday-option-btn {
            color: var(--background-200, #e2e8f0);

            &:hover {
                background-color: var(--background-700, #1e3a52);
                color: #fff;
            }

            &.is-selected {
                background-color: var(--max-primary-500, #00768e);
                color: #fff;
            }
        }

        .max-birthday-segment {
            color: var(--background-100, #f1f5f9);

            &:hover:not(:disabled) {
                background-color: var(--background-800, #1a2c3d);
            }

            &.is-active {
                background-color: rgb(0 118 142 / 25%);
                color: var(--max-primary-400, #178da5);
            }

            &.is-empty {
                color: var(--background-500, #64748b);
            }
        }

        .max-birthday-years-list::-webkit-scrollbar-thumb {
            background-color: var(--background-600, #334155);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
</style>
