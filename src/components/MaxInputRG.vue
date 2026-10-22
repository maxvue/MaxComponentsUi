<template>
    <InputBase s8-8 text-center v-bind="{ ...inputBaseProps, ...attrsWithoutModelProps }" class="max-input-rg-wrapper" :icon="props.icon ?? 'solar:card-id-line-duotone'">
        <template #default="{ inputAttrs }">
            <div class="max-rg-container" :class="{ 'has-extra-fields': props.showIssuer || props.showUf }">
                <input ref="numberInputRef" type="text" class="max-rg-input max-rg-number" v-bind="inputAttrs" :value="currentNumber" v-maska="rgMask" :placeholder="props.placeholder ?? '00.000.000-0'" :disabled="props.disabled" :readonly="props.readonly" aria-label="Número do RG" @input="onNumberInput" @change="onNumberChange" />

                <div v-if="props.showIssuer" class="max-rg-field-wrapper">
                    <input type="text" class="max-rg-input max-rg-issuer" :autocomplete="inputAttrs.autocomplete" :value="currentIssuer" placeholder="SSP" :disabled="props.disabled" :readonly="props.readonly" maxlength="10" aria-label="Órgão emissor do RG" @input="onIssuerInput" />
                </div>

                <div v-if="props.showUf" class="max-rg-field-wrapper">
                    <input type="text" class="max-rg-input max-rg-uf" :autocomplete="inputAttrs.autocomplete" :value="currentUf" placeholder="UF" :disabled="props.disabled" :readonly="props.readonly" maxlength="2" aria-label="UF emissora do RG" @input="onUfInput" />
                </div>
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import { vMaska } from 'maska/vue';
    import InputBase from './InputBase.vue';

    defineOptions({
        name: 'MaxInputRG',
        inheritAttrs: false
    });

    export interface RGObjectValue {
        number?: string;
        issuer?: string;
        uf?: string;
    }

    export interface MaxInputRGProps {
        modelValue?: string | RGObjectValue | null;
        showIssuer?: boolean;
        showUf?: boolean;
        issuer?: string;
        uf?: string;
        mask?: string;
        placeholder?: string;
        disabled?: boolean;
        readonly?: boolean;
        label?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
    }

    const props = withDefaults(defineProps<MaxInputRGProps>(), {
        modelValue: '',
        showIssuer: false,
        showUf: false,
        issuer: '',
        uf: '',
        mask: '##.###.###-X',
        placeholder: '00.000.000-0',
        disabled: false,
        readonly: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string | RGObjectValue];
        'update:issuer': [value: string];
        'update:uf': [value: string];
        'change': [value: string | RGObjectValue];
    }>();

    const attrs = useAttrs();
    const attrsWithoutModelProps = computed(() => {
        const { modelValue: _, issuer: _i, uf: _u, ...rest } = attrs;
        return rest;
    });

    const inputBaseProps = computed(() => ({
        label: props.label,
        error: props.error,
        caution: props.caution,
        done: props.done ?? undefined,
        required: props.required ?? undefined,
        message: props.message,
        disabled: props.disabled,
        readonly: props.readonly
    }));

    const rgMask = computed(() => ({
        tokens: {
            '#': { pattern: /[0-9]/ },
            'X': { pattern: /[0-9a-zA-Z]/, transform: (val: string) => val.toUpperCase() }
        },
        mask: props.mask
    }));

    const isObjectValue = computed(() => typeof props.modelValue === 'object' && props.modelValue !== null);

    const currentNumber = computed<string>(() => {
        if (!props.modelValue) return '';
        if (typeof props.modelValue === 'object') return props.modelValue.number ?? '';

        return String(props.modelValue);
    });

    const currentIssuer = computed<string>(() => {
        if (isObjectValue.value) return (props.modelValue as RGObjectValue).issuer ?? props.issuer ?? '';

        return props.issuer ?? '';
    });

    const currentUf = computed<string>(() => {
        if (isObjectValue.value) return (props.modelValue as RGObjectValue).uf ?? props.uf ?? '';

        return props.uf ?? '';
    });

    const buildOutputValue = (num: string, iss: string, stateUf: string) => {
        if (isObjectValue.value || props.showIssuer || props.showUf) return {
            number: num,
            issuer: iss,
            uf: stateUf
        };

        return num;
    };

    const onNumberInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        const out = buildOutputValue(val, currentIssuer.value, currentUf.value);
        emit('update:modelValue', out);
    };

    const onNumberChange = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        const out = buildOutputValue(val, currentIssuer.value, currentUf.value);
        emit('change', out);
    };

    const onIssuerInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value.toUpperCase();
        emit('update:issuer', val);
        const out = buildOutputValue(currentNumber.value, val, currentUf.value);
        emit('update:modelValue', out);
        emit('change', out);
    };

    const onUfInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value.toUpperCase();
        emit('update:uf', val);
        const out = buildOutputValue(currentNumber.value, currentIssuer.value, val);
        emit('update:modelValue', out);
        emit('change', out);
    };
</script>

<style lang="scss" scoped>
    .max-rg-container {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 6px;
        text-align: center;

        &.has-extra-fields {
            .max-rg-number {
                flex: 2;
            }
        }
    }

    .max-rg-input {
        background: transparent;
        border: none;
        outline: none;
        font-size: 13px;
        color: inherit;
        min-width: 0;

        &::placeholder {
            color: var(--max-neutral-400, #9ca3af);
        }

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
        }
    }

    .max-rg-number {
        flex: 1;
    }

    .max-rg-field-wrapper {
        display: flex;
        align-items: center;
        border-left: 1px solid var(--border-color, #e5e7eb);
        padding-left: 6px;
    }

    .max-rg-issuer {
        width: 60px;
        text-align: center;
        text-transform: uppercase;
    }

    .max-rg-uf {
        width: 36px;
        text-align: center;
        text-transform: uppercase;
    }
</style>
