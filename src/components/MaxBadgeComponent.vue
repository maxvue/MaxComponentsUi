<template>
    <MaxBadge
        :label="resolvedLabel"
        :icon="props.icon ?? props.i"
        :color="props.color"
        :neon="props.neon"
        :status="props.status"
        :overlay="props.overlay"
        :uppercase="props.uppercase"
        :size="props.size ?? props.scale"
        :background="props.background"
        :text-color="props.textColor"
        v-bind="passthroughAttrs"
    />
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxBadge from './MaxBadge.vue';
    import type { MaxBadgeStatus } from './MaxBadge.vue';

    const attrs = useAttrs();

    const props = withDefaults(defineProps<{
        /** Texto principal do badge */
        label?: string | number;
        /** Alias legado */
        value?: string | number;
        /** Alias legado */
        msg?: string | number;
        /** Alias legado */
        mensagem?: string | number;
        /** Alias legado */
        text?: string | number;
        /** Alias legado */
        txt?: string | number;
        /** Alias legado */
        number?: string | number;
        /** Ícone Iconify */
        icon?: string;
        /** Alias legado para ícone */
        i?: string;
        /** Cor base do badge */
        color?: string;
        /** Estilo visual neon */
        neon?: boolean;
        /** Indicador de status */
        status?: MaxBadgeStatus;
        /** Notificação overlay */
        overlay?: boolean | string | number;
        /** Forçar ou desativar caixa alta */
        uppercase?: boolean;
        /** Tamanho */
        size?: string | number;
        /** Alias legado para tamanho */
        scale?: string | number;
        /** Cor de fundo legada */
        background?: string;
        /** Cor de texto legada */
        textColor?: string;
        /** Compatibilidade com ícone legado */
        iconColor?: string;
        /** Compatibilidade com ícone legado */
        iconValue?: string;
    }>(), {});

    const resolvedLabel = computed<string | number>(() => {
        return props.label ?? props.msg ?? props.value ?? props.mensagem ?? props.text ?? props.txt ?? props.number ?? '';
    });

    const passthroughAttrs = computed(() => {
        const out: Record<string, unknown> = {};
        for (const key in attrs) out[key] = attrs[key];

        return out;
    });
</script>
