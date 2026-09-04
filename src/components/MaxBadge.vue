<template>
    <div
        class="max-badge"
        :class="[
            badgeSizeClass,
            {
                'is-neon': props.neon,
                'no-uppercase': !isUppercase
            }
        ]"
        :style="badgeStyles"
    >
        <!-- Ponto indicador de status -->
        <span
            v-if="statusColor"
            class="max-badge-status-dot"
            :style="{ backgroundColor: statusColor }"
        ></span>

        <!-- Ícone à esquerda -->
        <MaxIcon
            v-if="props.icon"
            :icon="props.icon"
            class="max-badge-icon"
            :color="colors.text"
        />

        <!-- Texto principal do badge -->
        <span class="max-badge-label">{{ props.label }}</span>

        <!-- Overlay de notificação (número ou string) -->
        <span
            v-if="hasOverlayValue"
            class="max-badge-overlay"
            :style="overlayStyles"
        >
            {{ overlayValue }}
        </span>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import { useDark } from '@vueuse/core';
    import MaxIcon from './MaxIcon.vue';
    import {
        resolveBadgeColors,
        BADGE_STATUS_COLORS
    } from '../helpers/colorLuminance';

    export type MaxBadgeStatus =
        | 'done'
        | 'success'
        | 'error'
        | 'danger'
        | 'info'
        | 'help'
        | 'warn'
        | 'caution';

    export interface MaxBadgeProps {
        /** Texto principal do badge (obrigatório) */
        label: string | number;
        /** Ícone Iconify à esquerda do texto label */
        icon?: string;
        /** Cor base do componente (hex, rgb, hsl ou var CSS) */
        color?: string;
        /** Ativa o estilo visual neon (fundo translúcido, borda 1px e glow) */
        neon?: boolean;
        /** Círculo indicador de status exibido antes do texto/ícone */
        status?: MaxBadgeStatus;
        /**
         * Overlay de notificação.
         * - undefined: não exibe
         * - true: alias para status = 'done'
         * - false: alias para status = 'error'
         * - string | number: exibe contador/pílula à direita com espaçamento mínimo de 10px
         */
        overlay?: boolean | string | number;
        /**
         * Aplica uppercase ao label. Padrão true.
         * Suporta :uppercase="false" ou prop no-uppercase para preservar caixa original.
         */
        uppercase?: boolean;
        /** Prop explícita para desativar uppercase (alias conveniente para no-uppercase) */
        noUppercase?: boolean;
        /** Tamanho do componente ('large', 'xlarge' ou custom) */
        size?: string | number;
        /** Sobrescrita opcional legada de background */
        background?: string;
        /** Sobrescrita opcional legada de cor de texto */
        textColor?: string;
    }

    const attrs = useAttrs();
    const isDark = useDark();

    const props = withDefaults(defineProps<MaxBadgeProps>(), {
        color: 'var(--blue-600)',
        neon: false,
        uppercase: true,
        noUppercase: false,
        overlay: undefined,
        icon: undefined,
        status: undefined,
        size: undefined,
        background: undefined,
        textColor: undefined
    });

    /** Detecta no-uppercase passado via prop ou atributo sem valor */
    const isUppercase = computed<boolean>(() => {
        if (props.noUppercase) return false;
        const attrNoUpper = attrs['no-uppercase'];
        if (attrNoUpper !== undefined && attrNoUpper !== false) return false;

        return props.uppercase !== false;
    });

    /** Classe de tamanho para compatibilidade */
    const badgeSizeClass = computed<string>(() => {
        const sizeVal = (props.size ?? attrs.size) as string | undefined;
        if (sizeVal === 'large') return 'max-badge-lg';
        if (sizeVal === 'xlarge') return 'max-badge-xl';
        return '';
    });

    /** Cores resolvidas por WCAG de acordo com modo claro/escuro e neon */
    const colors = computed(() => {
        return resolveBadgeColors(props.color, isDark.value, props.neon);
    });

    /** Determina a cor do círculo de status */
    const statusColor = computed<string | null>(() => {
        let resolvedStatus: string | undefined = props.status;

        // Se status não foi explicitado mas overlay é booleano, atua como alias
        if (!resolvedStatus) if (props.overlay === true) resolvedStatus = 'done';
        else if (props.overlay === false) resolvedStatus = 'error';


        if (!resolvedStatus) return null;
        return BADGE_STATUS_COLORS[resolvedStatus] ?? null;
    });

    /** Verifica se o overlay tem valor para exibição à direita */
    const hasOverlayValue = computed<boolean>(() => {
        return (
            props.overlay !== undefined &&
            props.overlay !== null &&
            typeof props.overlay !== 'boolean' &&
            String(props.overlay).trim() !== ''
        );
    });

    const overlayValue = computed<string | number>(() => {
        return (props.overlay as string | number) ?? '';
    });

    /** Estilos CSS em linha calculados para o badge */
    const badgeStyles = computed(() => {
        const bg = props.background || colors.value.background;
        const color = props.textColor || colors.value.text;

        const styles: Record<string, string> = {
            backgroundColor: bg,
            color: color
        };

        if (colors.value.border) styles.border = colors.value.border;


        if (colors.value.boxShadow) styles.boxShadow = colors.value.boxShadow;


        if (!isUppercase.value) styles.textTransform = 'none';


        return styles;
    });

    /** Estilos CSS em linha calculados para o overlay numérico/string */
    const overlayStyles = computed(() => {
        return {
            backgroundColor: colors.value.overlayBg,
            color: colors.value.overlayText
        };
    });
</script>

<style lang="scss">
    .max-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        position: relative;
        font-size: 0.65rem;
        font-weight: 600;
        height: 22.5px;
        line-height: 1;
        border-radius: 6px;
        padding: 0 8px;
        text-transform: uppercase;
        box-sizing: border-box;
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        user-select: none;
        white-space: nowrap;

        &.no-uppercase {
            text-transform: none;
        }

        &.max-badge-lg {
            font-size: 0.72rem;
            height: 25px;
            padding: 0 10px;
        }

        &.max-badge-xl {
            font-size: 0.8rem;
            height: 28px;
            padding: 0 12px;
        }

        .max-badge-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            margin-right: 6px;
            flex-shrink: 0;
            display: inline-block;
        }

        .max-badge-icon {
            margin-right: 5px;
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .max-badge-label {
            display: inline-flex;
            align-items: center;
            line-height: normal;
        }

        .max-badge-overlay {
            margin-left: 10px; // Espaçamento mínimo de 10px em relação ao label
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 16px;
            height: 16px;
            padding: 1px 5px 0;
            border-radius: 9999px;
            font-size: 0.6rem;
            font-weight: 700;
            line-height: normal;
            box-sizing: border-box;
            flex-shrink: 0;
            text-transform: none;
        }
    }
</style>
