<template>
    <InputBase v-bind="props" :done="props.done ?? isDone" :error="props.error ?? error_msg" :caution="caution" class="max-input-color">
        <ColorPicker v-model="modelValue" :defaultColor="props.defaultColor" :format="props.format" :inline="props.inline" :disabled="props.disabled" :panelClass="props.panelClass" :appendTo="props.appendTo" :autoZIndex="props.autoZIndex" :baseZIndex="props.baseZIndex" :inputId="props.inputId" :ariaLabel="props.ariaLabel" :ariaLabelledby="props.ariaLabelledby" />
        <InputText v-model="modelValue" />
    </InputBase>
</template>

/**
 * Componente de entrada de texto padrão.
 * Oferece suporte a validação de obrigatoriedade e comparação de valores.
 */
<script setup lang="ts">
    import InputText from 'primevue/inputtext';
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import ColorPicker from 'primevue/colorpicker';

    const modelValue = defineModel<any>({ default: '' });
    const attrs: any = useAttrs();

    interface Props {
        /** Valor padrão para exibir quando o valor do seletor não está definido */
        defaultColor?: string;
        /** Formato da cor ('hex', 'rgb' ou 'hsb') */
        format?: 'hex' | 'rgb' | 'hsb';
        /** Se true, renderiza o seletor em linha (inline) ao invés de popup */
        inline?: boolean;
        /** Classe CSS para o painel do seletor de cores */
        panelClass?: any;
        /** Elemento ao qual o painel do seletor deve ser anexado */
        appendTo?: 'body' | 'self' | string | any;
        /** Se true, gerencia o z-index do painel automaticamente */
        autoZIndex?: boolean;
        /** Z-index base para o painel */
        baseZIndex?: number;
        /** Identificador do elemento de input subjacente */
        inputId?: string;
        /** Rótulo de acessibilidade para o input */
        ariaLabel?: string;
        /** Associa o input a outro elemento de rótulo para acessibilidade */
        ariaLabelledby?: string;

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
        /** Texto de placeholder do campo */
        placeholder?: string | undefined;
    }

    const props = withDefaults(
        defineProps<Props>(),
        {
            defaultColor: 'ff0000',
            format: 'hex',
            inline: false,
            appendTo: 'body',
            autoZIndex: true,
            baseZIndex: 0,
            done: undefined,
            required: false,
            caution: undefined,
            disabled: false,
            error: undefined
        }
    );

    const isDone: Ref = ref(props.done ?? null);

    const isEqual = computed(() => typeof props.targetValue === 'string' && hasContent(props.targetValue) ? toSearchableString(props.targetValue) === toSearchableString(modelValue.value) : null);

    const isRequiredDone = computed(() => (props.required ? hasContent(modelValue.value) : null));

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

    watch(modelValue, () => {
        isDone.value = testIsDone();
    }, { immediate: true });
</script>

<style lang="scss">
.max-input-color {
    display: grid;
    grid-template-columns: 30px 1fr;
    place-items: center;
    grid-template-rows: 1fr !important;
    gap: 0.5rem;

    .message-spacer {
        display: none;
    }

    .p-floatlabel {
        grid-template-rows: 1fr !important;
    }

    .p-colorpicker-preview {
        outline: 1px solid var(--background-400);
        border-radius: 0.5rem;
    }
}
</style>