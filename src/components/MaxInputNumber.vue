<template>
    <InputBase v-bind="props" :value="temp_value" :done="isDone" :error="error_msg" :caution="caution">
        <MaxBaseInput
            ref="inputRef"
            type="text"
            role="spinbutton"
            v-bind="attrs"
            :modelValue="displayString"
            :disabled="props.disabled"
            :aria-valuenow="temp_value ?? undefined"
            :aria-valuemin="minVal ?? undefined"
            :aria-valuemax="maxVal ?? undefined"
            @update:modelValue="onInput"
            @focus="onFocus"
            @blur="onBlur"
            @keydown.up.prevent="stepUp"
            @keydown.down.prevent="stepDown"
        />
    </InputBase>
</template>

<script setup lang="ts">
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';

    const attrs: any = useAttrs();
    const inputRef = ref<any>(null);

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
            /** Mínimo */
            min?: number | undefined;
            /** Máximo */
            max?: number | undefined;
            /** Passo */
            step?: number | undefined;
            /** Permitir vazio */
            allowEmpty?: boolean | undefined;
        }>(),
        {
            modelValue: '',
            done: undefined,
            required: false,
            caution: undefined,
            prefix: undefined,
            suffix: undefined,
            placeholder: undefined,
            minFractionDigits: 0,
            maxFractionDigits: 2,
            allowEmpty: true,
            step: 1
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [val: number | null];
        'blur': [event: FocusEvent];
        'focus': [event: FocusEvent];
        'input': [val: number | null];
    }>();

    const temp_value = ref<number | null>(props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined ? Number(props.modelValue) : null);
    const isFocused = ref(false);
    const rawInput = ref('');

    const minVal = computed(() => props.min ?? attrs.min);
    const maxVal = computed(() => props.max ?? attrs.max);
    const stepVal = computed(() => props.step ?? attrs.step ?? 1);

    const separators = computed(() => {
        const loc = (props as any).locale ?? attrs.locale ?? 'pt-BR';
        const parts = new Intl.NumberFormat(loc).formatToParts(12345.6);
        return {
            group: parts.find((p) => p.type === 'group')?.value ?? '.',
            decimal: parts.find((p) => p.type === 'decimal')?.value ?? ','
        };
    });

    const formatter = computed(() => {
        const loc = (props as any).locale ?? attrs.locale ?? 'pt-BR';
        const mode = (props as any).mode ?? attrs.mode ?? 'decimal';
        const currency = (props as any).currency ?? attrs.currency;

        return new Intl.NumberFormat(loc, {
            style: mode === 'currency' ? 'currency' : 'decimal',
            currency: mode === 'currency' ? currency : undefined,
            useGrouping: (props as any).useGrouping ?? attrs.useGrouping ?? true,
            minimumFractionDigits: props.minFractionDigits ?? 0,
            maximumFractionDigits: props.maxFractionDigits ?? 2
        });
    });

    const formatValue = (val: number | null): string => {
        if (val === null || val === undefined || Number.isNaN(val)) return '';
        const formatted = formatter.value.format(val);
        const pfx = props.prefix ?? attrs.prefix ?? '';
        const sfx = props.suffix ?? attrs.suffix ?? '';
        return `${pfx}${formatted}${sfx}`;
    };

    const parseValue = (text: string): number | null => {
        if (!text || text.trim() === '') return null;

        let clean = text;
        const pfx = props.prefix ?? attrs.prefix;
        const sfx = props.suffix ?? attrs.suffix;
        if (pfx) clean = clean.replace(pfx, '');
        if (sfx) clean = clean.replace(sfx, '');

        clean = clean
            .split(separators.value.group).join('')
            .split(separators.value.decimal).join('.')
            .replace(/[^\d.-]/g, '');

        if (clean === '' || clean === '-') return null;
        const parsed = Number(clean);
        return Number.isNaN(parsed) ? null : parsed;
    };

    const clamp = (val: number | null): number | null => {
        if (val === null) {
            if (props.allowEmpty === false) return minVal.value ?? 0;
            return null;
        }
        if (minVal.value !== undefined && val < minVal.value) return minVal.value;
        if (maxVal.value !== undefined && val > maxVal.value) return maxVal.value;
        return val;
    };

    const displayString = computed(() => {
        if (isFocused.value) return rawInput.value;

        return formatValue(temp_value.value);
    });

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

    const onInput = (val: string) => {
        rawInput.value = val;
        const parsed = parseValue(val);
        temp_value.value = parsed;
        emit('input', parsed);
        emit('update:modelValue', parsed);
    };

    const onFocus = (event: FocusEvent) => {
        isFocused.value = true;
        rawInput.value = temp_value.value !== null ? String(temp_value.value).replace('.', separators.value.decimal) : '';
        emit('focus', event);
    };

    const onBlur = (event: FocusEvent) => {
        isFocused.value = false;
        const parsed = rawInput.value !== '' ? parseValue(rawInput.value) : temp_value.value;
        const clamped = clamp(parsed);
        temp_value.value = clamped;
        isDone.value = testIsDone();
        emit('update:modelValue', clamped);
        emit('blur', event);
    };

    const stepUp = () => {
        if (props.disabled) return;
        const current = temp_value.value ?? 0;
        const next = clamp(current + stepVal.value);
        temp_value.value = next;
        isDone.value = testIsDone();
        emit('update:modelValue', next);
    };

    const stepDown = () => {
        if (props.disabled) return;
        const current = temp_value.value ?? 0;
        const next = clamp(current - stepVal.value);
        temp_value.value = next;
        isDone.value = testIsDone();
        emit('update:modelValue', next);
    };

    watch(
        () => props.modelValue,
        (val) => {
            const num = val !== '' && val !== null && val !== undefined ? Number(val) : null;
            temp_value.value = Number.isNaN(num) ? null : num;
            if (!isFocused.value) isDone.value = testIsDone();

        }
    );
</script>