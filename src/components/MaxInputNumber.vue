<template>
    <InputBase v-bind="props" :value="temp_value" :done="isDone" :error="error_msg" :caution="caution">
        <input
            ref="inputRef"
            type="text"
            inputmode="decimal"
            class="max-inputnumber p-inputtext p-component"
            :value="displayValue"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
        />
    </InputBase>
</template>

/**
 * Componente de entrada de texto padrão para números.
 * Oferece suporte a formatação numérica pt-BR, prefixos, sufixos, validação e comparação de valores.
 */
<script setup lang="ts">
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor atual do input */
            modelValue: any;
            /** Ícone opcional (ex: 'mdi:email') */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Desabilita o campo */
            disabled?: boolean | undefined;
            /** Ativa estilo FloatLabel */
            float?: boolean | undefined;
            /** Mensagem de feedback (alias) */
            msg?: string | undefined;
            /** Mensagem de feedback */
            message?: string | undefined;
            /** Ícone da mensagem de feedback */
            iconMessage?: string | undefined;
            /** Rótulo do campo */
            label?: string | undefined;
            /** Estado de conclusão/validação manual */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | boolean | undefined;
            /** Valor para comparação (valida se o input é igual a este valor) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
            /** Prefixo do campo */
            prefix?: string | undefined;
            /** Sufixo do campo */
            suffix?: string | undefined;
            /** Placeholder do campo */
            placeholder?: string | undefined;
            /** Mínimo de casas decimais */
            minFractionDigits?: number | undefined;
            /** Máximo de casas decimais */
            maxFractionDigits?: number | undefined;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined, prefix: undefined, suffix: undefined, placeholder: undefined, minFractionDigits: 0, maxFractionDigits: 2 }
    );

    const inputRef = ref<HTMLInputElement | null>(null);
    const isFocused = ref(false);

    const formatter = computed(() => new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: props.minFractionDigits ?? 0,
        maximumFractionDigits: props.maxFractionDigits ?? 2
    }));

    function formatDisplay(val: any): string {
        if (val === null || val === undefined || val === '') return '';
        const num = typeof val === 'number' ? val : Number(val);
        if (Number.isNaN(num)) return String(val);
        const formatted = formatter.value.format(num);
        return `${props.prefix ?? ''}${formatted}${props.suffix ?? ''}`;
    }

    function parseLocaleNumber(raw: string): number | null {
        if (!hasContent(raw)) return null;
        let s = raw;
        if (props.prefix) s = s.split(props.prefix).join('');
        if (props.suffix) s = s.split(props.suffix).join('');
        s = s.replace(/[^\d,.-]/g, '');
        s = s.replace(/\./g, '');
        s = s.replace(',', '.');
        const n = Number(s);
        return Number.isNaN(n) ? null : n;
    }

    const temp_value = ref(props.modelValue);
    const displayValue = ref(formatDisplay(props.modelValue));

    const isDone: Ref = ref(props.done ?? null);

    const isEqual = computed(() => typeof props.targetValue === 'string' && hasContent(props.targetValue) ? toSearchableString(props.targetValue) === toSearchableString(temp_value.value) : null);

    const isRequiredDone = computed(() => (props.required ? hasContent(temp_value.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isEqual.value !== null) return isEqual.value;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
        if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    const emit = defineEmits(['update:modelValue']);

    const onInput = (event: Event) => {
        const raw = (event.target as HTMLInputElement).value;
        displayValue.value = raw;
        const parsed = parseLocaleNumber(raw);
        temp_value.value = parsed;
    };

    const onFocus = () => {
        isFocused.value = true;
    };

    const onBlur = () => {
        isFocused.value = false;
        displayValue.value = formatDisplay(temp_value.value);
        isDone.value = testIsDone();
    };

    watch(temp_value, () => {
        isDone.value = testIsDone();
        emit('update:modelValue', temp_value.value);
    });

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val;
            if (!isFocused.value) displayValue.value = formatDisplay(val);

        }
    );
</script>

<style lang="scss">
    .max-inputnumber {
        width: 100%;
    }
</style>