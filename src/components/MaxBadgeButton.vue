<template>
    <button
        type="button"
        class="max-badge-button"
        :class="{
            'is-active': isActive,
            'is-disabled': props.disabled
        }"
        :disabled="props.disabled"
        :aria-pressed="isActive"
        @click="handleClick"
    >
        <MaxBadge
            :label="props.label"
            :icon="props.icon"
            :color="currentColor"
            :neon="props.neon"
            :status="props.status"
            :overlay="props.overlay"
            :uppercase="props.uppercase"
            :size="props.size"
            :background="props.background"
            :text-color="props.textColor"
        />
    </button>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';
    import MaxBadge from './MaxBadge.vue';
    import type { MaxBadgeStatus } from './MaxBadge.vue';

    export interface MaxBadgeButtonProps {
        /** Texto do badge (obrigatório) */
        label: string | number;
        /** Ícone Iconify à esquerda do texto */
        icon?: string;
        /** Cor ativa do badge (hex, rgb, hsl ou var CSS). Padrão: var(--blue-600) */
        color?: string;
        /** Ativa o estilo visual neon */
        neon?: boolean;
        /** Círculo de status opcional */
        status?: MaxBadgeStatus;
        /** Overlay de notificação (booleano, número ou string) */
        overlay?: boolean | string | number;
        /** Se aplica caixa alta ao label. Padrão: true */
        uppercase?: boolean;
        /** Tamanho do badge */
        size?: string | number;
        /** Sobrescrita de cor de fundo */
        background?: string;
        /** Sobrescrita de cor de texto */
        textColor?: string;
        /** Estado de alternância controlado por v-model (true/false ou 1/0) */
        modelValue?: boolean | number;
        /** Desabilita a interação com o botão */
        disabled?: boolean;
        /** Callback de clique geral */
        onClick?: (event: MouseEvent, state: boolean | number) => void;
        /** Callback disparado quando o botão se torna ativo */
        onActive?: (event: MouseEvent) => void;
        /** Alias de onActive */
        onTrue?: (event: MouseEvent) => void;
        /** Callback disparado quando o botão se torna inativo */
        onDeactive?: (event: MouseEvent) => void;
        /** Alias de onDeactive */
        onFalse?: (event: MouseEvent) => void;
    }

    const props = withDefaults(defineProps<MaxBadgeButtonProps>(), {
        color: 'var(--blue-600)',
        modelValue: undefined,
        disabled: false,
        neon: false,
        uppercase: true,
        overlay: undefined,
        icon: undefined,
        status: undefined,
        size: undefined,
        background: undefined,
        textColor: undefined,
        onClick: undefined,
        onActive: undefined,
        onTrue: undefined,
        onDeactive: undefined,
        onFalse: undefined
    });

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean | number): void;
        (e: 'change', value: boolean | number): void;
        (e: 'click', event: MouseEvent, state: boolean | number): void;
        (e: 'active', event: MouseEvent): void;
        (e: 'deactive', event: MouseEvent): void;
    }>();

    /** Controle autônomo caso modelValue não seja fornecido pelo consumidor */
    const internalActive = ref(false);

    /** Estado ativo/inativo derivado de modelValue ou do estado interno */
    const isActive = computed<boolean>(() => {
        if (props.modelValue !== undefined) return props.modelValue === true || props.modelValue === 1;

        return internalActive.value;
    });

    /**
     * Cor resolvida para o MaxBadge interno:
     * - ativo => cor normal da própria prop
     * - inativo => var(--background-400)
     */
    const currentColor = computed<string>(() => {
        if (isActive.value) return props.color;

        return 'var(--background-400)';
    });

    function handleClick(event: MouseEvent) {
        if (props.disabled) return;

        const nextActive = !isActive.value;
        const isNumeric = typeof props.modelValue === 'number';
        const nextValue: boolean | number = isNumeric ? (nextActive ? 1 : 0) : nextActive;

        if (props.modelValue === undefined) internalActive.value = nextActive;


        emit('update:modelValue', nextValue);
        emit('change', nextValue);
        emit('click', event, nextValue);

        if (nextActive) {
            emit('active', event);
            props.onTrue?.(event);
        } else {
            emit('deactive', event);
            props.onFalse?.(event);
        }
    }
</script>

<style lang="scss">
    .max-badge-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        outline: none;
        vertical-align: middle;
        font-family: inherit;
        transition: transform 0.1s ease, opacity 0.2s ease;

        &:focus-visible {
            border-radius: 6px;
            box-shadow: 0 0 0 2px var(--blue-500);
        }

        &:hover:not(:disabled) {
            transform: translateY(-1px);
        }

        &:active:not(:disabled) {
            transform: translateY(0);
        }

        &.is-disabled,
        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
    }
</style>
