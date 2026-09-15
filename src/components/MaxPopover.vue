<template>
    <div ref="btn_el" v-tooltip="null" class="max-popover max-popover-main" :class="props.class">
        <slot
            v-if="$slots.trigger || $slots.button"
            :name="$slots.trigger ? 'trigger' : 'button'"
            v-bind="triggerSlotProps"
        />
        <button
            v-else
            type="button"
            v-tooltip="null"
            @click.stop="toggle"
            @keydown="onKeydownTrigger"
            role="button"
            tabindex="0"
            :aria-expanded="isOpen"
            :aria-controls="dialog_id"
            :aria-haspopup="'dialog'"
            :aria-label="props.label || props.title || props.ariaLabel || 'Abrir informações adicionais'"
            :style="{ width: size_icon, height: size_icon }"
            class="max-popover-icon"
        >
            <MaxIcon
                v-if="props.icon || props.i"
                :icon="props.icon ?? props.i"
                :size="size_icon"
                :dark="props.dark"
                :light="props.light"
                aria-hidden="true"
            />
            <span v-if="props.label" class="max-popover-label">{{ props.label }}</span>
        </button>
        <Teleport to="body" v-if="isOpen">
            <div v-tooltip="null" class="popover-item">
                <MaxAnimateFade :show="isOpen" :duration="0.3">
                    <div
                        class="max-popover-dialog"
                        ref="el"
                        role="dialog"
                        :id="dialog_id"
                        :aria-labelledby="computedAriaLabelledby"
                        :aria-label="computedAriaLabel"
                        :style="dialogStyle"
                        :class="[position.isTop ? 'is-top' : 'is-bottom', position.isLeft ? 'is-left' : 'is-right', props.noPicker ? 'no-picker' : '', props.class]"
                        @click.stop="() => {}"
                    >
                        <div v-if="!props.noHeader" :id="title_id" class="max-popover-header-wrapper">
                            <slot name="header" :title-id="title_id">
                                <MaxGrid class="max-popover-header">
                                    <MaxTitle1 class="max-popover-title" :title="props.title ?? 'Titulo'" :subtitle="resolvedSubTitle ?? 'Sub Titulo'" />
                                    <MaxIconButton class="max-popover-close" i="iconoir:xmark" size="1.3" aria-label="Fechar" @click.stop="hide" />
                                </MaxGrid>
                            </slot>
                        </div>
                        <div class="max-popover-content">
                            <slot name="content"></slot>
                            <slot></slot>
                        </div>
                    </div>
                </MaxAnimateFade>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { useTemplateRef, ref, computed, useId, watch, onBeforeUnmount, useSlots } from 'vue';
    import { usePopoverStore } from '../stores/usePopover.Store';
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { getElementAccessibleText, resolveAriaLabelledby } from '../helpers/useAccessibleName';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxTitle1 from './MaxTitle1.vue';
    import MaxGrid from './MaxGrid.vue';
    import MaxAnimateFade from './MaxAnimateFade.vue';
    import { getCssSize } from '../helpers/getCssSize';

    const props = withDefaults(defineProps<{
        /** Classes passadas ao componente */
        class?: string;
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** link para abrir em nova aba */
        blank?: string;
        /** Rota para navegação ao clicar */
        route?: string;
        /** Label para botão */
        label?: string;
        /** Titulo do popover */
        title?: string;
        /** Subtitulo do popover */
        subTitle?: string;
        /** Alias retrocompatível para o subtítulo */
        subtitle?: string;
        /** Rotação do ícone em graus */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;
        sizeIcon?: string | number;
        iconSize?: string | number;
        /** Alias para o tamanho */
        scale?: string | number;
        /** Mensagem de confirmação */
        loading?: boolean;
        /** Largura específica */
        width?: string | number;
        /** Altura específica */
        height?: string | number;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
        /** Icone de checagem */
        checked?: boolean | string | number | undefined;
        /** Icone de adição opcional */
        plus?: boolean | string | number | undefined;
        /** Oculta o triangulo de ligação com o botão */
        noPicker?: boolean;
        /** Desativa o cabeçalho do popover */
        noHeader?: boolean;
        /** Nome acessível explícito para o diálogo */
        ariaLabel?: string;
        /** ID do elemento que rotula o diálogo */
        ariaLabelledby?: string;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        noPicker: false,
        noHeader: false
    });

    const size_icon = computed(() => {
        const raw = props.size ?? props.sizeIcon ?? props.iconSize ?? 1.1;
        const factor = Number(raw);
        if (!isNaN(factor)) return `${factor}rem`;
        return getCssSize(String(raw));
    });

    const id = ref(useId());

    const popover_store = usePopoverStore();

    const isOpen = computed(() => popover_store.show_id === id.value);

    const slots = useSlots();
    const dialog_id = computed(() => 'max-popover-dialog-' + id.value);
    const title_id = computed(() => (!props.noHeader ? 'max-popover-title-' + id.value : undefined));


    const getTextFromVNodes = (vnodes: any): string => {
        if (!vnodes) return '';
        if (typeof vnodes === 'string') return vnodes.trim();
        if (typeof vnodes === 'number') return String(vnodes);
        if (Array.isArray(vnodes)) return vnodes.map(getTextFromVNodes).join('').trim();
        if (typeof vnodes === 'object') {
            if (typeof vnodes.children === 'string') return vnodes.children.trim();
            if (Array.isArray(vnodes.children)) return getTextFromVNodes(vnodes.children);
            if (typeof vnodes.children === 'object' && vnodes.children !== null) if (typeof vnodes.children.default === 'function') return getTextFromVNodes(vnodes.children.default());

        }
        return '';
    };

    const getSlotText = (slotFn?: (props: any) => any): string => {
        if (!slotFn) return '';
        try {
            return getTextFromVNodes(slotFn({}));
        } catch {
            return '';
        }
    };

    const resolvedSubTitle = computed(() => props.subTitle ?? props.subtitle);

    // Ver comentário equivalente em MaxModal: referências removidas da árvore
    // de acessibilidade ou sem texto usam o fallback do diálogo; o helper
    // canônico continua sendo a fonte de AccName genérica.
    const resolveDialogLabelledby = (ids: string) => {
        const resolved = resolveAriaLabelledby(ids);
        if (!resolved || typeof document === 'undefined') return undefined;
        const usable = resolved.split(' ').filter((labelId) => {
            const target = document.getElementById(labelId) as HTMLElement | null;
            return Boolean(target)
                && !target!.hasAttribute('hidden')
                && target!.getAttribute('aria-hidden') !== 'true'
                && !target!.hasAttribute('inert')
                && Boolean(getElementAccessibleText(target!));
        });
        return usable.length ? usable.join(' ') : undefined;
    };

    const computedAriaLabelledby = computed(() => {
        if (props.ariaLabelledby) return resolveDialogLabelledby(props.ariaLabelledby);
        if (props.noHeader) return undefined;
        if (slots.header) {
            const slotText = getSlotText(slots.header);
            return slotText.length > 0 ? title_id.value : undefined;
        }
        if (props.title?.trim() || resolvedSubTitle.value?.trim()) return title_id.value;
        return undefined;
    });

    const computedAriaLabel = computed(() => {
        if (computedAriaLabelledby.value) return undefined;
        const rawLabel = props.ariaLabel?.trim() || (props.title?.trim() || undefined);
        return rawLabel && rawLabel.length > 0 ? rawLabel : 'Informações adicionais';
    });

    const el = useTemplateRef<HTMLElement>('el');
    const btn_el = useTemplateRef('btn_el');

    const trap = useFocusTrap(el, {
        onEscape: () => hide(),
        outsideElements: () => [btn_el.value],
        onOutsidePointer: () => hide()
    });

    const { position, isPositioned } = useActiveOverlayPosition<{
        top: number;
        left: number;
        isTop: boolean;
        isLeft: boolean;
        maxWidth: number;
        maxHeight: number;
    }>({
        target: btn_el,
        overlay: el,
        active: isOpen,
        compute: ({ targetRect, overlayRect, viewportWidth, viewportHeight, safeArea, visualViewport }) => {
            const width_btn = targetRect.width;
            const height_btn = targetRect.height;
            const width_el = overlayRect.width || 300;
            const height_el = overlayRect.height || 60;

            const safeTop = safeArea?.top ?? 0;
            const safeRight = safeArea?.right ?? 0;
            const safeBottom = safeArea?.bottom ?? 0;
            const safeLeft = safeArea?.left ?? 0;

            const margin = 8;
            const arrowSpacing = 15;
            // As coordenadas de `fixed` e de DOMRect pertencem à layout
            // viewport. Em pinch-zoom, a viewport visual pode começar longe
            // de zero: sem estes offsets o popover fica fora da área tocável.
            const viewportLeft = visualViewport?.offsetLeft ?? 0;
            const viewportTop = visualViewport?.offsetTop ?? 0;

            const minTop = viewportTop + Math.max(margin, safeTop + margin);
            const maxBottom = Math.max(minTop, viewportTop + viewportHeight - safeBottom - margin);
            const minLeft = viewportLeft + Math.max(margin, safeLeft + margin);
            const maxRight = Math.max(minLeft, viewportLeft + viewportWidth - safeRight - margin);

            const spaceBelow = maxBottom - (targetRect.top + height_btn);
            const spaceAbove = targetRect.top - minTop;

            let isTop = false;
            let top: number;

            if (spaceBelow >= height_el + arrowSpacing) {
                top = targetRect.top + height_btn + arrowSpacing;
                isTop = false;
            } else if (spaceAbove >= height_el + arrowSpacing) {
                top = targetRect.top - height_el - arrowSpacing;
                isTop = true;
            } else if (spaceAbove > spaceBelow) {
                top = targetRect.top - height_el - arrowSpacing;
                isTop = true;
            } else {
                top = targetRect.top + height_btn + arrowSpacing;
                isTop = false;
            }

            top = Math.max(minTop, Math.min(top, maxBottom - height_el));

            let left = targetRect.left + (width_btn / 2) - (width_el / 2);

            if (left + width_el + margin > maxRight) left = targetRect.left + width_btn - width_el + 10;

            left = Math.max(minLeft, Math.min(left, maxRight - width_el));

            const isLeft = (targetRect.left + (width_btn / 2)) > (left + (width_el / 2));

            return {
                top,
                left,
                isTop,
                isLeft,
                maxWidth: maxRight - minLeft,
                maxHeight: maxBottom - minTop
            };
        }
    });

    const dialogStyle = computed(() => {
        const style: Record<string, string | number> = {
            top: `${position.value.top}px`,
            left: `${position.value.left}px`,
            opacity: isPositioned.value ? 1 : 0,
            maxWidth: `${position.value.maxWidth}px`,
            maxHeight: `${position.value.maxHeight}px`
        };

        if (props.width) {
            const widthVal = typeof props.width === 'number' ? `${props.width}px` : props.width;
            style.width = `min(${widthVal}, calc(100vw - 16px))`;
        }

        if (props.height) style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;

        return style;
    });

    const onKeydownTrigger = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            toggle();
        }
    };

    watch(isOpen, (value) => {
        if (value) trap.activate();
        else trap.deactivate();
    });

    onBeforeUnmount(() => {
        trap.deactivate();
        if (popover_store.show_id === id.value) popover_store.hide();
    });

    const toggle = () => {
        popover_store.toggle(id.value);
    };

    const hide = () => {
        popover_store.hide();
    };

    const show = () => {
        popover_store.show(id.value);
    };


    const style = computed(() => ({
        opacity: isPositioned.value ? 1 : 0
    }));

    const triggerSlotProps = computed(() => ({
        'aria-expanded': isOpen.value,
        'aria-controls': dialog_id.value,
        'aria-haspopup': 'dialog',
        role: 'button',
        tabindex: 0,
        type: 'button' as const,
        toggle,
        show,
        hide,
        isOpen: isOpen.value,
        dialogId: dialog_id.value,
        onClick: toggle,
        onKeydown: onKeydownTrigger,
        ...props
    }));

    defineExpose({
        hide,
        show,
        toggle,
        style
    });
</script>

<style lang="scss" scoped>
.max-popover-main {
    position: relative;
    cursor: pointer;
    display: grid;
    place-items: center;

    .max-popover-icon {
        position: relative;
        display: grid;
        place-items: center;
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        color: inherit;
        outline: none;

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e)); /* Foco canônico */
            outline-offset: 2px;
            border-radius: 4px;
        }
    }
}

.popover-item {
    position: fixed;
    z-index: var(--max-z-index-popover, var(--max-layer-popover, 1200));

    .max-popover-dialog {
        position: fixed;
        width: min(300px, calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px));
        max-width: calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px);
        box-sizing: border-box;
        min-height: 60px;
        max-height: calc(100vh - 32px);
        max-height: calc(100dvh - 32px);
        max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px);
        overflow: hidden auto;
        background-color: var(--background-0);
        color: var(--background-700);
        z-index: var(--max-z-index-popover, var(--max-layer-popover, 1200));
        border: 1px solid var(--surface-border);
        display: grid;
        grid-template-rows: auto 1fr;
        transition: opacity 0.3s ease;

        /* O drop-shadow traça o contorno real do elemento + seus ::before, criando o balão perfeito */
        filter: drop-shadow(0 4px 8px rgb(0 0 0 / 20%));
        border-radius: 0.75rem;
        padding: 10px;

        &:not(.no-picker) {
            &::before {
                content: '';
                position: absolute;
                width: 14px;
                height: 14px;
                background-color: var(--background-0);
                transform: rotate(45deg);
                z-index: 1; /* Cobre a borda principal para unificar o desenho */
            }

            &.is-bottom::before {
                top: -7px;
                border-top: 1px solid var(--surface-border);
                border-left: 1px solid var(--surface-border);
            }

            &.is-top::before {
                bottom: -7px;
                border-bottom: 1px solid var(--surface-border);
                border-right: 1px solid var(--surface-border);
            }

            &.is-left::before {
                right: clamp(10px, 15px, calc(100% - 24px));
            }

            &.is-right::before {
                left: clamp(10px, 15px, calc(100% - 24px));
            }
        }

        .max-popover-header-wrapper {
            display: block;
            width: 100%;
        }

        .max-popover-header {
            width: 100%;
            flex: 1 0 calc(100% - 8px);
            padding-top: 0;
            margin-top: 0;
            margin-bottom: 15px;

            .max-popover-title {
                flex: 1 0 calc(90% - 8px);
                padding: 0;
                margin: 0;
            }

            .max-popover-close {
                flex: 1 0 calc(10% - 8px);
            }
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    ::before,
    ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
</style>
