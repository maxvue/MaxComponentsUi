<template>
    <InputBase v-bind="props" :modelValue="(props.modelValue as any)" class="input-switch-main" :caution="caution" :done="isDone ?? undefined" :icon-right="icon ?? ''">
        <div class="input-grid-switch">
            <ToggleSwitch v-bind="attrs" v-model="temp_value" />
            <div class="rotulo">{{ props.question }}</div>
        </div>
    </InputBase>
</template>

/**
 * Componente de interruptor (Switch/Toggle).
 * Ideal para opções binárias (Sim/Não, Ativo/Inativo).
 * Exibe uma pergunta ou rótulo ao lado do switch.
 */
<script setup lang="ts">
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import ToggleSwitch from 'primevue/toggleswitch';

    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor booleano do switch */
            modelValue: boolean;
            /** Pergunta ou rótulo exibido ao lado do switch */
            question?: string;
            /** Ícone opcional */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Desabilita o campo */
            disabled?: boolean | undefined;
            /** Estilo FloatLabel */
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
            /** Valor para comparação (opcional) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
        }>(),
        { modelValue: false, done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);
    const isDone = ref(props.done ?? null);

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        return isDone.value === false;
    });

    watch(
        temp_value,
        () => {
            isDone.value = props.done ?? null;
            emit('update:modelValue', temp_value.value);
        },
        { immediate: true }
    );

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val;
        }
    );
</script>

<style lang="scss">
    .input-switch {
        outline: none !important;
    }

    .input-grid-switch {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        width: 100%;
        height: 100%;
        align-items: center;

        .p-toggleswitch {
            grid-column: 1;
        }

        .rotulo {
            text-align: left;
            width: 100%;
            font-size: 0.8rem;
            color: var(--background-700);
        }
    }
</style>
