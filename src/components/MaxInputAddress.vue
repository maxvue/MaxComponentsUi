<template>
    <div class="max-input-address-root" :class="{ 'is-compact': props.compact, 'is-disabled': props.disabled }">
        <div v-if="props.label" class="max-input-address-header">
            <span class="max-input-address-title">{{ props.label }}</span>
        </div>

        <div class="max-address-grid">
            <div class="max-address-col-cep">
                <MaxInputCep label="CEP" :modelValue="addressData.cep" :disabled="props.disabled" :readonly="props.readonly" :required="props.required" @update:modelValue="onFieldUpdate('cep', $event)" @complete="onCepComplete" />
            </div>

            <div class="max-address-col-street">
                <MaxInputText label="Logradouro" :modelValue="addressData.street" placeholder="Rua, Avenida, etc." :disabled="props.disabled" :readonly="props.readonly" :required="props.required" @update:modelValue="onFieldUpdate('street', $event)" />
            </div>

            <div class="max-address-col-number">
                <MaxInputText label="Número" :modelValue="addressData.number" placeholder="S/N" :disabled="props.disabled" :readonly="props.readonly" :required="props.required" @update:modelValue="onFieldUpdate('number', $event)" />
            </div>

            <div v-if="props.showComplement" class="max-address-col-complement">
                <MaxInputText label="Complemento" :modelValue="addressData.complement" placeholder="Apto, Bloco..." :disabled="props.disabled" :readonly="props.readonly" @update:modelValue="onFieldUpdate('complement', $event)" />
            </div>

            <div class="max-address-col-neighborhood">
                <MaxInputText label="Bairro" :modelValue="addressData.neighborhood" placeholder="Bairro" :disabled="props.disabled" :readonly="props.readonly" @update:modelValue="onFieldUpdate('neighborhood', $event)" />
            </div>

            <div class="max-address-col-city">
                <MaxInputText label="Cidade" :modelValue="addressData.city" placeholder="Cidade" :disabled="props.disabled" :readonly="props.readonly" :required="props.required" @update:modelValue="onFieldUpdate('city', $event)" />
            </div>

            <div class="max-address-col-uf">
                <MaxInputUF label="UF" :modelValue="addressData.state" :disabled="props.disabled" :required="props.required" @update:modelValue="onFieldUpdate('state', $event)" />
            </div>
        </div>

        <div v-if="props.error" class="max-address-error" role="alert">
            <span>{{ typeof props.error === 'string' ? props.error : 'Endereço incompleto ou inválido' }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxInputText from './MaxInputText.vue';
    import MaxInputCep from './MaxInputCep.vue';
    import MaxInputUF from './MaxInputUF.vue';

    defineOptions({
        name: 'MaxInputAddress'
    });

    export interface AddressValue {
        cep?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
    }

    export interface MaxInputAddressProps {
        modelValue?: AddressValue | null;
        label?: string;
        compact?: boolean;
        disabled?: boolean;
        readonly?: boolean;
        required?: boolean;
        showComplement?: boolean;
        error?: string | boolean | null;
    }

    const props = withDefaults(defineProps<MaxInputAddressProps>(), {
        modelValue: () => ({}),
        label: 'Endereço',
        compact: false,
        disabled: false,
        readonly: false,
        required: false,
        showComplement: true
    });

    const emit = defineEmits<{
        'update:modelValue': [value: AddressValue];
        'change': [value: AddressValue];
        'cep-complete': [cep: string];
    }>();

    const addressData = computed<AddressValue>(() => props.modelValue ?? {});

    const onFieldUpdate = (field: keyof AddressValue, value: any) => {
        const next: AddressValue = {
            ...addressData.value,
            [field]: value ?? ''
        };
        emit('update:modelValue', next);
        emit('change', next);
    };

    const onCepComplete = (cep: string) => {
        emit('cep-complete', cep);
    };
</script>

<style lang="scss" scoped>
    .max-input-address-root {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;

        &.is-disabled {
            opacity: 0.6;
            pointer-events: none;
        }
    }

    .max-input-address-header {
        margin-bottom: 2px;
    }

    .max-input-address-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--max-neutral-700, #374151);
    }

    .max-address-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 8px;
        width: 100%;
    }

    .max-address-col-cep {
        grid-column: span 3;
    }

    .max-address-col-street {
        grid-column: span 6;
    }

    .max-address-col-number {
        grid-column: span 3;
    }

    .max-address-col-complement {
        grid-column: span 4;
    }

    .max-address-col-neighborhood {
        grid-column: span 3;
    }

    .max-address-col-city {
        grid-column: span 3;
    }

    .max-address-col-uf {
        grid-column: span 2;
    }

    @media (width <= 768px) {
        .max-address-col-cep,
        .max-address-col-street,
        .max-address-col-number,
        .max-address-col-complement,
        .max-address-col-neighborhood,
        .max-address-col-city,
        .max-address-col-uf {
            grid-column: span 12;
        }
    }

    .max-address-error {
        font-size: 12px;
        color: var(--max-danger-500, #ef4444);
        margin-top: 2px;
    }
</style>
