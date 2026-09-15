<template>
    <Teleport :to="appendTo">
        <Transition name="max-base-overlay">
            <div
                v-if="visible"
                ref="panelRef"
                class="max-base-overlay"
                :role="role"
                tabindex="-1"
                :aria-label="computedAriaLabel"
                :aria-labelledby="computedAriaLabelledby"
                :style="panelStyle"
            >
                <slot></slot>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
    import { computed, nextTick, onMounted, ref, toRef, watch } from 'vue';
    import { useOutsidePointer } from '../../helpers/useOutsidePointer';
    import { resolveSafeAreaInsets } from '../../composables/useActiveOverlayPosition';

    const props = withDefaults(
        defineProps<{
            /** controla visibilidade (v-model:visible) */
            visible?: boolean;
            /** elemento-gatilho ao qual o painel se ancora */
            target?: HTMLElement | null;
            /** destino do teleport */
            appendTo?: string | HTMLElement;
            /** alinhamento horizontal em relação ao gatilho */
            align?: 'left' | 'right';
            /** força largura mínima igual à do gatilho */
            matchTargetWidth?: boolean;
            /** fecha ao clicar fora */
            dismissable?: boolean;
            /** fecha com ESC */
            closeOnEscape?: boolean;
            /** distância em px entre gatilho e painel */
            offset?: number;
            /** role ARIA do painel */
            role?: string;
            /** rótulo acessível direto */
            ariaLabel?: string;
            /** id do elemento que rotula o painel */
            ariaLabelledby?: string;
            /** papel semântico de camada ('dropdown' | 'popover' | 'modal' | 'fullscreen' | 'tooltip') */
            layer?: 'dropdown' | 'popover' | 'modal' | 'fullscreen' | 'tooltip';
            /** offset adicional sobre o z-index da camada */
            layerOffset?: number;
        }>(),
        {
            visible: false,
            target: null,
            appendTo: 'body',
            align: 'left',
            matchTargetWidth: false,
            dismissable: true,
            closeOnEscape: true,
            offset: 4,
            role: 'dialog',
            ariaLabel: undefined,
            ariaLabelledby: undefined,
            layer: 'dropdown',
            layerOffset: 0
        }
    );

    const emit = defineEmits<{
        'update:visible': [value: boolean];
        show: [];
        hide: [];
        'before-show': [];
        'before-hide': [];
    }>();

    const panelRef = ref<HTMLElement | null>(null);
    const panelStyle = ref<Record<string, string | undefined>>({});

    const isValidExternalId = (idToCheck?: string): boolean => {
        if (!idToCheck) return false;
        if (typeof document === 'undefined') return true;
        return Boolean(document.getElementById(idToCheck));
    };

    const computedAriaLabelledby = computed(() => {
        if (props.ariaLabelledby) return isValidExternalId(props.ariaLabelledby) ? props.ariaLabelledby : undefined;

        return undefined;
    });

    const computedAriaLabel = computed(() => {
        if (computedAriaLabelledby.value) return undefined;
        if (props.ariaLabel) return props.ariaLabel;
        if (props.role === 'dialog' || props.role === 'alertdialog') return 'Painel de sobreposição';

        return undefined;
    });

    const zIndex = computed(() => {
        const isInModal = Boolean(props.target?.closest?.('.max-modal, .max-drawer, [role="dialog"]'));
        const rawOffset = props.layerOffset ?? 0;
        const offset = Math.max(-100, Math.min(100, rawOffset));
        let token: string;

        switch (props.layer) {
            case 'popover':
                token = 'var(--max-z-index-popover, var(--max-layer-popover, 1200))';
                break;
            case 'modal':
                token = 'var(--max-z-index-modal, var(--max-layer-modal, 1310))';
                break;
            case 'fullscreen':
                token = 'var(--max-z-index-fullscreen, var(--max-layer-fullscreen, 1400))';
                break;
            case 'tooltip':
                token = 'var(--max-z-index-tooltip, var(--max-layer-tooltip, 1600))';
                break;
            case 'dropdown':
            default:
                token = isInModal
                    ? 'calc(var(--max-z-index-modal, var(--max-layer-modal, 1310)) + 10)'
                    : 'var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000))';
                break;
        }

        if (offset !== 0) return `calc(${token} + ${offset})`;

        return token;
    });

    const position = () => {
        if (!props.target || !panelRef.value) return;

        const t = props.target.getBoundingClientRect();
        const p = panelRef.value.getBoundingClientRect();
        const vv = typeof window !== 'undefined' ? window.visualViewport : null;
        const vh = vv ? vv.height : window.innerHeight;
        const vw = vv ? vv.width : window.innerWidth;
        const viewportTop = vv?.offsetTop ?? 0;
        const viewportLeft = vv?.offsetLeft ?? 0;
        const safeArea = resolveSafeAreaInsets();

        const minTop = viewportTop + Math.max(8, safeArea.top + 8);
        const maxBottom = Math.max(minTop, viewportTop + vh - safeArea.bottom - 8);
        const minLeft = viewportLeft + Math.max(8, safeArea.left + 8);
        const maxRight = Math.max(minLeft, viewportLeft + vw - safeArea.right - 8);
        const pHeight = Math.min(p.height || panelRef.value.offsetHeight || 200, maxBottom - minTop);
        const pWidth = Math.min(p.width || panelRef.value.offsetWidth || t.width || 200, maxRight - minLeft);
        const spaceBelow = maxBottom - t.bottom;
        const spaceAbove = t.top - minTop;
        const openUp = spaceBelow < pHeight && spaceAbove > spaceBelow;
        const rawTop = openUp ? t.top - pHeight - props.offset : t.bottom + props.offset;
        const top = Math.max(minTop, Math.min(rawTop, maxBottom - pHeight));

        let left = props.align === 'right' ? t.right - pWidth : t.left;
        left = Math.max(minLeft, Math.min(left, maxRight - pWidth));

        panelStyle.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            // min-width tem precedência sobre max-width no CSS; limite-o também
            // para que um gatilho largo não empurre o painel para fora da tela.
            minWidth: props.matchTargetWidth ? `${Math.min(t.width, maxRight - minLeft)}px` : undefined,
            maxWidth: `${Math.max(0, maxRight - minLeft)}px`,
            maxHeight: `${Math.max(0, maxBottom - minTop)}px`,
            overflow: 'auto',
            zIndex: zIndex.value
        };
    };

    const close = () => {
        emit('update:visible', false);
    };

    useOutsidePointer(toRef(props, 'visible'), {
        elements: () => [panelRef.value, props.target],
        onClose: () => {
            close();
        },
        closeOnEscape: toRef(props, 'closeOnEscape'),
        dismissable: toRef(props, 'dismissable'),
        triggerEl: () => props.target,
        repositionOnScroll: true,
        repositionOnResize: true,
        onReposition: position
    });

    const openOverlay = async () => {
        panelStyle.value = {
            position: 'fixed',
            visibility: 'hidden',
            opacity: '0',
            zIndex: zIndex.value
        };
        await nextTick();
        position();
        panelRef.value?.focus();
    };

    watch(
        () => props.visible,
        async (isVisible) => {
            if (isVisible) {
                emit('before-show');
                await openOverlay();
                emit('show');
            } else {
                emit('before-hide');
                props.target?.focus();
                emit('hide');
            }
        }
    );

    onMounted(() => {
        if (props.visible) openOverlay();
    });
</script>

<style lang="scss" scoped>
    .max-base-overlay {
        background: var(--background-0);
        border: 1px solid var(--surface-border);
        border-radius: 0.75rem;
        box-shadow: 0 4px 8px rgb(0 0 0 / 20%);
    }

    .max-base-overlay-enter-active,
    .max-base-overlay-leave-active {
        transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .max-base-overlay-enter-from,
    .max-base-overlay-leave-to {
        opacity: 0;
        transform: translateY(-4px);
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
