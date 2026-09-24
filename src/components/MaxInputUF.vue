<template>
    <MaxInputSelect
        class="max-input-uf"
        v-bind="forwardedAttrs"
        :options="optionsList"
        optionValue="value"
        optionLabel="label"
        :filter="props.filter"
        :label="resolvedLabel"
        :noLabel="props.noLabel"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :clearable="isClearable"
        :done="props.done"
        :error="props.error"
        :caution="props.caution"
        :required="props.required"
        :noMessage="props.noMessage"
        v-model="internalValue"
    >
        <template #value="{ value }">
            <slot name="value" :value="value" :state="selectedState">
                <span v-if="selectedState" class="max-uf-trigger-value">{{ displayTriggerValue }}</span>
            </slot>
        </template>

        <template #option="{ option }">
            <slot name="option" :option="option">
                <div class="max-uf-option-item">
                    <img :src="option.flag" :alt="option.uf" class="max-uf-flag" loading="lazy" />
                    <span class="max-uf-code">{{ option.uf }}</span>
                    <span class="max-uf-dash">-</span>
                    <span class="max-uf-name">{{ option.name }}</span>
                </div>
            </slot>
        </template>
    </MaxInputSelect>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import { BRAZIL_STATES, BRAZIL_NATIONAL_STATE, type BrazilState } from '../constants/brazilStates';

    export type MaxInputUFValueMode = 'uf' | 'state' | 'min';

    export interface MaxInputUFProps {
        /** Valor selecionado (v-model) */
        modelValue?: string | null;
        /**
         * Formato do valor retornado e exibido no v-model:
         * - 'uf' (padrão): apenas a sigla (ex: 'SP', 'RS')
         * - 'state' / 'estado': nome por extenso (ex: 'São Paulo', 'Rio Grande do Sul')
         * - 'min' / 'abbreviated': nome abreviado (ex: 'S. Paulo', 'R. G. do Sul')
         */
        value?: 'uf' | 'state' | 'estado' | 'min' | 'abbreviated' | 'abbrev' | 'abreviado' | string;
        /**
         * Rótulo do InputBase:
         * - 'uf' (padrão): 'UF'
         * - 'state' / 'estado': 'Estado'
         * - 'min' / 'abbreviated': 'Estado (Abrev.)'
         * - Texto arbitrário: repassado diretamente como label
         */
        label?: string;
        /** Se verdadeiro, adiciona 'BR' (Brasil / Nacional) no topo da lista */
        showBr?: boolean;
        showBrasil?: boolean;
        showBrazil?: boolean;
        brazil?: boolean;
        allowBrazil?: boolean;
        brasil?: boolean;
        /** Habilita campo de busca no dropdown (padrão: true) */
        filter?: boolean;
        /** Desativa o rótulo do InputBase */
        noLabel?: boolean;
        placeholder?: string;
        disabled?: boolean;
        clearable?: boolean;
        showClear?: boolean;
        done?: boolean;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        required?: boolean;
        noMessage?: boolean;
    }

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxInputUFProps>(), {
        modelValue: '',
        value: 'uf',
        label: 'uf',
        showBr: false,
        showBrasil: undefined,
        showBrazil: undefined,
        brazil: undefined,
        allowBrazil: undefined,
        brasil: undefined,
        filter: true,
        noLabel: false,
        placeholder: undefined,
        disabled: false,
        clearable: false,
        showClear: false,
        done: undefined,
        error: undefined,
        caution: undefined,
        required: false,
        noMessage: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'change': [value: string, state: BrazilState | undefined];
    }>();

    const resolvedShowBr = computed<boolean>(() => {
        const val = props.showBr
            || props.showBrasil
            || props.showBrazil
            || props.brazil
            || props.allowBrazil
            || props.brasil
            || attrs.showBrasil === true
            || attrs.showBrasil === ''
            || attrs.showBrazil === true
            || attrs.showBrazil === ''
            || attrs.brazil === true
            || attrs.brazil === ''
            || attrs.allowBrazil === true
            || attrs.allowBrazil === ''
            || attrs.brasil === true
            || attrs.brasil === '';

        return Boolean(val);
    });

    const resolvedValueMode = computed<MaxInputUFValueMode>(() => {
        const raw = String(props.value ?? attrs.value ?? 'uf').toLowerCase().trim();
        if (raw === 'state' || raw === 'estado') return 'state';
        if (raw === 'min' || raw === 'abbreviated' || raw === 'abbrev' || raw === 'abreviado') return 'min';
        return 'uf';
    });

    const resolvedLabel = computed<string | undefined>(() => {
        if (props.noLabel || attrs.noLabel === true || attrs.noLabel === '') return undefined;
        const raw = props.label ?? attrs.label ?? 'uf';
        if (!raw && raw !== '') return undefined;

        const lower = String(raw).toLowerCase().trim();
        if (lower === 'uf') return 'UF';
        if (lower === 'state' || lower === 'estado') return 'Estado';
        if (lower === 'min' || lower === 'abbreviated' || lower === 'abbrev' || lower === 'abreviado') return 'Estado (Abrev.)';
        return String(raw);
    });

    const isClearable = computed<boolean>(() => Boolean(props.clearable || props.showClear || attrs.clearable || attrs.showClear));

    const allStates = computed<BrazilState[]>(() => {
        if (resolvedShowBr.value) return [BRAZIL_NATIONAL_STATE, ...BRAZIL_STATES];

        return BRAZIL_STATES;
    });

    const selectedState = computed<BrazilState | undefined>(() => {
        if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return undefined;
        const target = String(props.modelValue).trim().toLowerCase();
        return allStates.value.find((s) =>
            s.uf.toLowerCase() === target
            || s.name.toLowerCase() === target
            || s.min.toLowerCase() === target
        );
    });

    const displayTriggerValue = computed<string>(() => {
        if (!selectedState.value) return '';
        if (resolvedValueMode.value === 'state') return selectedState.value.name;
        if (resolvedValueMode.value === 'min') return selectedState.value.min;
        return selectedState.value.uf;
    });

    const optionsList = computed(() => {
        return allStates.value.map((s) => {
            let val = s.uf;
            if (resolvedValueMode.value === 'state') val = s.name;
            else if (resolvedValueMode.value === 'min') val = s.min;

            return {
                ...s,
                value: val,
                label: `${s.uf} - ${s.name}`,
                subLabel: `${s.uf} ${s.min}`
            };
        });
    });

    const internalValue = computed<string>({
        get() {
            if (!selectedState.value) return '';
            if (resolvedValueMode.value === 'state') return selectedState.value.name;
            if (resolvedValueMode.value === 'min') return selectedState.value.min;
            return selectedState.value.uf;
        },
        set(val: string) {
            if (!val) {
                emit('update:modelValue', '');
                emit('change', '', undefined);
                return;
            }

            const found = allStates.value.find((s) =>
                s.uf.toLowerCase() === String(val).toLowerCase()
                || s.name.toLowerCase() === String(val).toLowerCase()
                || s.min.toLowerCase() === String(val).toLowerCase()
            );

            let emitVal = val;
            if (found) if (resolvedValueMode.value === 'state') emitVal = found.name;
            else if (resolvedValueMode.value === 'min') emitVal = found.min;
            else emitVal = found.uf;


            emit('update:modelValue', emitVal);
            emit('change', emitVal, found);
        }
    });

    const forwardedAttrs = computed(() => {
        const {
            modelValue: _m,
            value: _v,
            label: _l,
            showBr: _sbr,
            showBrasil: _sbr2,
            showBrazil: _sbr3,
            brazil: _br,
            allowBrazil: _abr,
            brasil: _br2,
            filter: _f,
            noLabel: _nl,
            ...rest
        } = attrs;
        return rest;
    });
</script>

<style lang="scss" scoped>
    .max-input-uf {
        width: 100%;
    }

    .max-uf-trigger-value {
        font-size: 0.875rem;
        color: var(--background-800, #1e293b);
        font-weight: 500;
    }

    .max-uf-option-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        line-height: 1;

        .max-uf-flag {
            width: 22px;
            height: 15px;
            border-radius: 2px;
            object-fit: cover;
            flex-shrink: 0;
            box-shadow: 0 0 1px rgb(0 0 0 / 35%);
        }

        .max-uf-code {
            font-weight: 600;
            font-size: 0.875rem;
            color: var(--background-800, #1e293b);
            min-width: 24px;
        }

        .max-uf-dash {
            color: var(--background-400, #94a3b8);
            font-size: 0.875rem;
            user-select: none;
        }

        .max-uf-name {
            font-size: 0.875rem;
            color: var(--background-700, #334155);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
</style>
