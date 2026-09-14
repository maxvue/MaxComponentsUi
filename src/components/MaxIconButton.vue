<template>
    <button
        type="button"
        ref="icon_ref"
        v-bind="buttonAttrs"
        :class="`max-icon-button icon-div ico-btn ${hover ? 'hover' : ''} ${isDisabled ? 'is-disabled' : ''} ${props.transparent ? 'is-transparent' : ''}`"
        :style="[
            {
                width: size,
                height: size,
                transform: 'scale(' + (hover && !isDisabled ? props.hoverScale : 1) + ')'
            },
            attrs.style
        ]"
        :disabled="isDisabled"
        :aria-label="ariaLabelComputed"
        :aria-disabled="isDisabled ? 'true' : undefined"
        :aria-busy="isBusy ? 'true' : 'false'"
        @click="onClick"
        @mouseenter="!isDisabled && (hover = true)"
        @mouseleave="hover = false"
    >
        <slot>
            <MaxIcon
                v-if="isBusy"
                icon="eos-icons:loading"
                :size="size"
                aria-hidden="true"
            />
            <MaxIcon
                v-else
                :icon="props.icon"
                :i="props.i"
                :dark="props.dark"
                :light="props.light"
                :checked="props.checked"
                :plus="props.plus"
                :rotate="props.rotate"
                :flip="props.flip"
                :size="size"
                :color="props.color ?? props.iconColor"
                aria-hidden="true"
            />
        </slot>
    </button>
</template>

<script setup lang="ts">
    import { computed, ref, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { goToRoute } from '@maxvue/max-use';
    import type { MaxButtonsType } from '../types';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const hover = ref(false);
    const warned = ref(false);

    const props = withDefaults(defineProps<MaxButtonsType>(), { data: {}, params: {}, query: {}, hoverScale: 1.2 });

    const executing = ref(false);
    const isBusy = computed(() => Boolean(props.loading || executing.value));
    const isDisabled = computed(() => Boolean(props.disabled || isBusy.value || (attrs.disabled !== undefined && attrs.disabled !== false)));

    const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

    const buttonAttrs = computed(() => {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(attrs)) if (!key.startsWith('on') && key !== 'style') result[key] = value;


        return result;
    });

    const size = computed(() => {
        const factor = Number(props.size);
        return 16 * (isNaN(factor) ? 1 : factor) + 'px';
    });

    const ariaLabelComputed = computed(() => {
        const rawAria = props.ariaLabel || props['aria-label'] || (attrs.ariaLabel as string | undefined) || (attrs['aria-label'] as string | undefined);
        if (rawAria && typeof rawAria === 'string' && rawAria.trim()) return rawAria.trim();
        if (props.label && typeof props.label === 'string' && props.label.trim()) return props.label.trim();
        const rawTitle = props.title || (attrs.title as string | undefined);
        if (rawTitle && typeof rawTitle === 'string' && rawTitle.trim()) return rawTitle.trim();
        const rawTooltip = props.tooltip || (attrs.tooltip as string | undefined);
        if (rawTooltip && typeof rawTooltip === 'string' && rawTooltip.trim()) return rawTooltip.trim();

        if (process.env.NODE_ENV !== 'production' && !warned.value) {
            warned.value = true;
            console.warn('[MaxIconButton] Botão de ícone renderizado sem nome acessível (ariaLabel, label, title ou tooltip). Um fallback temporário foi aplicado.');
        }

        // Fallbacks contextuais baseados no nome do ícone
        const iconName = props.icon || props.i || '';
        if (iconName.includes('close') || iconName.includes('xmark')) return 'Fechar';
        if (iconName.includes('chevron-down') || iconName.includes('angle-down')) return 'Expandir opções';
        if (iconName.includes('chevron-up') || iconName.includes('angle-up')) return 'Recolher opções';
        if (iconName.includes('search')) return 'Buscar';
        if (iconName.includes('trash') || iconName.includes('delete')) return 'Excluir';
        if (iconName.includes('edit')) return 'Editar';
        if (iconName.includes('plus') || iconName.includes('add')) return 'Adicionar';
        return 'Botão de ação';
    });

    const emit = defineEmits<{
        /** @deprecated Use o evento canônico click */
        action: [value: boolean];
        click: [event: PointerEvent];
    }>();

    const onClick = async (event: PointerEvent) => {
        if (isDisabled.value || executing.value) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        executing.value = true;
        try {
            if (props.route) {
                goToRoute(props.route, data.value);
                return;
            }

            if (props.action) {
                await props.action({ event, data: data.value });
                return;
            }

            emit('click', event);
            emit('action', true);
        } finally {
            executing.value = false;
        }
    };


    defineExpose({
        onClick,
        executing
    });
</script>

<style lang="scss" scoped>
    .icon-div {
        display: inline-grid;
        place-items: center;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        transition: transform 0.3s ease, color 0.2s ease-in-out;
        position: relative;
        font-family: inherit;
        line-height: 1;

        // Expansão da área de toque acessível (mínimo 36px) sem deformar o tamanho visual do ícone
        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 36px;
            min-height: 36px;
            width: 100%;
            height: 100%;
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768E);
            outline-offset: 2px;
            border-radius: 4px;
        }

        &.is-transparent {
            background-color: transparent;
            border-color: transparent;
            outline-color: transparent;
            color: var(--background-700);

            &:hover {
                color: var(--max-primary-600);
            }
        }

        &.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
    }
</style>
