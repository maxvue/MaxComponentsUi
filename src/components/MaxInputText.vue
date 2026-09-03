<template>
    <!--
        Decisão deliberada: `v-bind="props"` fica no InputBase (elemento raiz),
        não no <input> interno. Attrs extras não declarados em `props` (ex.:
        `maxlength`, `autocomplete`) caem no root do InputBase, não no <input>.
        Não é fallthrough "quebrado" — é o mesmo padrão usado por
        MaxInputTextArea. Não "corrigir" isso sem entender que foi escolhido
        conscientemente (ver achado 38 / CLAUDE.md).
    -->
    <InputBase v-bind="props" :done="props.done ?? isDone" :error="props.error ?? error_msg" :caution="caution">
        <input
            class="p-inputtext p-component"
            :type="props.type"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            :spellcheck="resolvedSpellcheck"
            :value="temp_value"
            @input="temp_value = ($event.target as HTMLInputElement).value"
            @blur="isDone = testIsDone()"
        />
        <slot></slot>
    </InputBase>
</template>

<script setup lang="ts">
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            type?: string;
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
            /** Texto de placeholder do campo */
            placeholder?: string | undefined;
            /** Habilita ou desabilita a verificação ortográfica nativa */
            spellcheck?: boolean | undefined;
        }>(),
        { modelValue: '', done: undefined, required: false, type: 'text', caution: undefined, disabled: false, error: undefined, spellcheck: true }
    );

    const resolvedSpellcheck = computed(() => {
        if (props.type === 'password') return false;
        return props.spellcheck;
    });

    const temp_value = ref<any>(props.modelValue);

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
    watch(temp_value, () => {
        isDone.value = testIsDone();
        emit('update:modelValue', temp_value.value);
    });
    watch(
        () => props.modelValue,
        () => (temp_value.value = props.modelValue)
    );
</script>