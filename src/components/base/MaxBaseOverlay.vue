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
    import { useOverlayZIndex } from '../../composables/useOverlayZIndex';

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

    const zIndex = useOverlayZIndex({
        target: () => props.target,
        layer: props.layer,
        layerOffset: props.layerOffset
    });

    const position = () => {
        if (!props.target || !panelRef.value) return;

        const t = props.target.getBoundingClientRect();
        const p = panelRef.value.getBoundingClientRect();
        const vv = typeof window !== 'undefined' ? window.visualViewport : null;
        const vh = vv ? vv.height : window.innerHeight;
        const vw = vv ? vv.width : window.innerWidth;

        const pHeight = p.height || panelRef.value.offsetHeight || 200;
        const spaceBelow = vh - t.bottom;
        const spaceAbove = t.top;
        const openUp = spaceBelow < pHeight && spaceAbove > spaceBelow;
        const rawTop = openUp ? t.top - pHeight - props.offset : t.bottom + props.offset;
        const top = Math.max(8, Math.min(rawTop, vh - pHeight - 8));

        let left = props.align === 'right' ? t.right - p.width : t.left;
        left = Math.max(8, Math.min(left, vw - p.width - 8));

        panelStyle.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            minWidth: props.matchTargetWidth ? `${t.width}px` : undefined,
            zIndex: String(zIndex.value)
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
            zIndex: String(zIndex.value)
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
