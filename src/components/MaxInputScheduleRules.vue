<template>
    <div :id="props.id" class="max-input-schedule-rules" role="group" :aria-label="resolvedLabel" :aria-describedby="props.ariaDescribedby">
        <div v-if="resolvedLabel" class="rules-header">
            <label class="rules-label">{{ resolvedLabel }}</label>
        </div>
        <div class="rules-list">
            <div v-for="(rule, index) in draftRules" :key="index" class="rule-card">
                <div class="rule-header-row">
                    <div class="rule-type-field">
                        <MaxInputScheduleType :modelValue="rule.type" :disabled="props.disabled" :noMessage="true" @update:modelValue="(val: any) => onTypeChange(index, val)" />
                    </div>
                    <div class="rule-time-field">
                        <MaxInputTime :modelValue="rule.time ?? null" :disabled="props.disabled" :noMessage="true" @update:modelValue="(val: string | null) => updateRuleTime(index, val)" />
                    </div>
                    <div class="rule-remove-action">
                        <MaxIconButton ref="removeButtons" icon="tabler:trash" ariaLabel="Remover regra" :disabled="props.disabled" class="rule-remove-btn" @click="() => removeRule(index)" />
                    </div>
                </div>

                <div class="rule-body-row">
                    <template v-if="rule.type === 'specific_dates'">
                        <div class="rule-subfield full-width">
                            <MaxInputText :modelValue="getDatesString(rule.dates)" :disabled="props.disabled" placeholder="Datas (AAAA-MM-DD, separadas por vírgula)" :noMessage="true" :error="rule.dates.length === 0 || !areDatesValid(rule.dates)" @update:modelValue="(val: any) => updateSpecificDates(index, val ? String(val) : '')" />
                        </div>
                    </template>

                    <template v-else-if="rule.type === 'weekly'">
                        <div class="rule-weekly-row">
                            <div class="rule-weekdays-selector" role="group" aria-label="Dias da semana">
                                <button v-for="w in WEEKDAY_ITEMS" :key="w.value" type="button" class="weekday-toggle-btn" :class="{ 'is-selected': isWeekdaySelected(rule.weekdays, w.value) }" :disabled="props.disabled" :aria-pressed="isWeekdaySelected(rule.weekdays, w.value)" @click="() => toggleWeekday(index, w.value)">
                                    {{ w.label }}
                                </button>
                            </div>
                            <div class="rule-subfield interval-width">
                                <MaxInputWeekInterval :modelValue="rule.interval_weeks" :options="WEEK_INTERVAL_OPTIONS" :disabled="props.disabled" :noMessage="true" @update:modelValue="(val: number | null) => updateWeeklyInterval(index, val)" />
                            </div>
                        </div>
                    </template>

                    <template v-else-if="rule.type === 'monthly_days'">
                        <div class="rule-subfield full-width">
                            <MaxInputMonthDays :modelValue="rule.days" :disabled="props.disabled" :noMessage="true" @update:modelValue="(val: number[]) => updateMonthlyDays(index, val)" />
                        </div>
                    </template>

                    <template v-else-if="rule.type === 'monthly_nth_weekday'">
                        <div class="rule-nth-row">
                            <div class="rule-subfield nth-width">
                                <MaxInputMonthOccurrence :modelValue="rule.nth" :disabled="props.disabled" :noMessage="true" @update:modelValue="(val: any) => updateNth(index, val)" />
                            </div>
                            <div class="rule-subfield weekday-width">
                                <MaxInputWeekday :modelValue="rule.weekday" :disabled="props.disabled" :noMessage="true" @update:modelValue="(val: any) => updateNthWeekday(index, val)" />
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <div class="rules-footer">
            <MaxButton ref="addButtonRef" label="Adicionar regra" :disabled="props.disabled" class="rule-add-btn" @click="addRule" />
        </div>

        <div v-if="effectiveError && !props.noMessage" class="rules-error-message" role="alert">
            {{ effectiveError }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, nextTick, ref, watch } from 'vue';
    import MaxButton from './MaxButton.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxInputMonthDays from './MaxInputMonthDays.vue';
    import MaxInputMonthOccurrence from './MaxInputMonthOccurrence.vue';
    import MaxInputScheduleType from './MaxInputScheduleType.vue';
    import MaxInputText from './MaxInputText.vue';
    import MaxInputTime from './MaxInputTime.vue';
    import MaxInputWeekday from './MaxInputWeekday.vue';
    import MaxInputWeekInterval from './MaxInputWeekInterval.vue';
    import {
        changeRuleType,
        createDefaultScheduleRule,
        isValidDateString,
        isValidScheduleRule
    } from '../helpers/scheduleRules';
    import type {
        MaxInputScheduleRulesProps,
        ScheduleRule,
        ScheduleWeekday
    } from '../types/specializedInputs';
    import type { WeekIntervalOption } from '../types/semanticInputs';

    const props = withDefaults(defineProps<MaxInputScheduleRulesProps>(), {
        modelValue: () => [],
        id: undefined,
        label: undefined,
        disabled: false,
        required: false,
        error: undefined,
        caution: undefined,
        noMessage: false,
        ariaDescribedby: undefined
    });

    const emit = defineEmits<{
        'update:modelValue': [value: ScheduleRule[]];
        'change': [value: ScheduleRule[]];
    }>();

    const addButtonRef = ref<any>(null);
    const removeButtons = ref<any[]>([]);

    const WEEKDAY_ITEMS: { value: ScheduleWeekday; label: string }[] = [
        { value: 'monday', label: 'Seg' },
        { value: 'tuesday', label: 'Ter' },
        { value: 'wednesday', label: 'Qua' },
        { value: 'thursday', label: 'Qui' },
        { value: 'friday', label: 'Sex' },
        { value: 'saturday', label: 'Sáb' },
        { value: 'sunday', label: 'Dom' }
    ];

    const WEEK_INTERVAL_OPTIONS: WeekIntervalOption[] = Array.from({ length: 52 }, (_, i) => {
        const val = i + 1;
        return {
            value: val,
            name: val === 1 ? 'Toda semana' : `A cada ${val} semanas`
        };
    });

    const draftRules = ref<ScheduleRule[]>(JSON.parse(JSON.stringify(props.modelValue ?? [])));

    watch(
        () => props.modelValue,
        (newVal) => {
            const currentJson = JSON.stringify(draftRules.value);
            const newJson = JSON.stringify(newVal ?? []);
            if (currentJson !== newJson) draftRules.value = JSON.parse(newJson);

        },
        { deep: true }
    );

    const resolvedLabel = computed<string>(() => {
        if (props.label !== undefined) return props.label;
        return 'Agendamento';
    });

    const areDatesValid = (dates: string[]): boolean => {
        if (!Array.isArray(dates) || dates.length === 0) return false;
        return dates.every((d) => typeof d === 'string' && isValidDateString(d));
    };

    const hasInvalidRules = computed<boolean>(() => {
        return draftRules.value.some((rule) => !isValidScheduleRule(rule));
    });

    const effectiveError = computed<string | null>(() => {
        if (typeof props.error === 'string' && props.error !== '') return props.error;
        if (props.error === true) return 'Regras de agendamento inválidas';
        if (props.required && draftRules.value.length === 0) return 'Pelo menos uma regra de agendamento é obrigatória';
        if (hasInvalidRules.value) return 'Uma ou mais regras de agendamento estão incompletas ou inválidas';
        return null;
    });

    function getDatesString(dates: string[]): string {
        if (!Array.isArray(dates) || dates.length === 0) return '';
        return dates.join(', ');
    }

    function isWeekdaySelected(weekdays: ScheduleWeekday[], day: ScheduleWeekday): boolean {
        return Array.isArray(weekdays) && weekdays.includes(day);
    }

    function emitIfValid() {
        const validRules = draftRules.value.filter(isValidScheduleRule);
        if (validRules.length === draftRules.value.length) {
            const cloned = JSON.parse(JSON.stringify(validRules));
            emit('update:modelValue', cloned);
            emit('change', cloned);
        }
    }

    const onTypeChange = (index: number, newType: any) => {
        if (props.disabled || !newType) return;
        const currentRule = draftRules.value[index];
        draftRules.value[index] = changeRuleType(currentRule, newType);
        emitIfValid();
    };

    const updateRuleTime = (index: number, newTime: string | null) => {
        if (props.disabled) return;
        const rule = draftRules.value[index];
        if (newTime) rule.time = newTime;
        else delete rule.time;

        emitIfValid();
    };

    const updateSpecificDates = (index: number, rawString: string) => {
        if (props.disabled) return;
        const rule = draftRules.value[index];
        if (rule.type !== 'specific_dates') return;
        const parts = rawString.split(',').map((p) => p.trim()).filter((p) => p !== '');
        rule.dates = parts;
        emitIfValid();
    };

    const toggleWeekday = (index: number, day: ScheduleWeekday) => {
        if (props.disabled) return;
        const rule = draftRules.value[index];
        if (rule.type !== 'weekly') return;
        const currentDays = rule.weekdays ?? [];
        if (currentDays.includes(day)) rule.weekdays = currentDays.filter((d) => d !== day);
        else rule.weekdays = [...currentDays, day];

        emitIfValid();
    };

    const updateWeeklyInterval = (index: number, val: number | null) => {
        if (props.disabled) return;
        const rule = draftRules.value[index];
        if (rule.type !== 'weekly') return;
        if (typeof val === 'number' && val >= 1 && val <= 52) {
            rule.interval_weeks = val;
            emitIfValid();
        }
    };

    const updateMonthlyDays = (index: number, days: number[]) => {
        if (props.disabled) return;
        const rule = draftRules.value[index];
        if (rule.type !== 'monthly_days') return;
        rule.days = days;
        emitIfValid();
    };

    const updateNth = (index: number, nth: any) => {
        if (props.disabled) return;
        const rule = draftRules.value[index];
        if (rule.type !== 'monthly_nth_weekday') return;
        if ([1, 2, 3, 4, 5].includes(Number(nth))) {
            rule.nth = Number(nth) as any;
            emitIfValid();
        }
    };

    const updateNthWeekday = (index: number, weekday: any) => {
        if (props.disabled) return;
        const rule = draftRules.value[index];
        if (rule.type !== 'monthly_nth_weekday') return;
        if (weekday) {
            rule.weekday = weekday;
            emitIfValid();
        }
    };

    const addRule = () => {
        if (props.disabled) return;
        const newRule = createDefaultScheduleRule('specific_dates');
        draftRules.value.push(newRule);
        // Não emite imediatamente porque dates está vazio (rascunho incompleto)
    };

    const removeRule = (index: number) => {
        if (props.disabled) return;
        draftRules.value.splice(index, 1);
        emitIfValid();

        nextTick(() => {
            if (draftRules.value.length === 0) {
                const addEl = addButtonRef.value?.$el ?? addButtonRef.value;
                addEl?.focus?.();
            } else {
                const targetIdx = Math.min(index, draftRules.value.length - 1);
                const targetBtn = removeButtons.value?.[targetIdx]?.$el ?? removeButtons.value?.[targetIdx];
                targetBtn?.focus?.();
            }
        });
    };
</script>

<style lang="scss" scoped>
    .max-input-schedule-rules {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    .rules-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--max-text-primary, #334155);
    }

    .rules-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .rule-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: var(--background-50, #f8fafc);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 6px;
    }

    .rule-header-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .rule-type-field {
        flex-grow: 1;
    }

    .rule-time-field {
        width: 150px;
        flex-shrink: 0;
    }

    .rule-remove-action {
        flex-shrink: 0;
    }

    .rule-body-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .full-width {
        width: 100%;
    }

    .rule-weekly-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .rule-weekdays-selector {
        display: flex;
        gap: 4px;
    }

    .weekday-toggle-btn {
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid var(--border-color, #cbd5e1);
        border-radius: 4px;
        background: var(--background-0, #fff);
        color: var(--max-text-secondary, #64748b);
        cursor: pointer;
        transition: all 0.15s ease;

        &.is-selected {
            background: var(--max-primary-500, #00768e);
            border-color: var(--max-primary-500, #00768e);
            color: #fff;
            font-weight: 600;
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    .interval-width {
        width: 200px;
    }

    .rule-nth-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .nth-width {
        width: 180px;
    }

    .weekday-width {
        flex-grow: 1;
    }

    .rules-footer {
        display: flex;
        padding-top: 4px;
    }

    .rules-error-message {
        font-size: 12px;
        color: var(--max-danger-500, #ef4444);
    }

    @media (prefers-reduced-motion: reduce) {
        .weekday-toggle-btn {
            transition: none !important;
        }
    }
</style>
