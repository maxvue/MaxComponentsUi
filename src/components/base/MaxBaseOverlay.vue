<template>
    <Teleport :to="appendTo">
        <Transition name="max-base-overlay">
            <div
                v-if="visible"
                ref="panelRef"
                class="max-base-overlay"
                :role="role"
                tabindex="-1"
                :aria-label="ariaLabelledby ? undefined : ariaLabel"
                :aria-labelledby="ariaLabelledby"
                :style="panelStyle"
            >
                <slot></slot>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

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

    const computeZIndex = (): string => {
        const isInModal = Boolean(props.target?.closest?.('.max-modal, .max-drawer, [role="dialog"]'));
        let token = 'var(--max-layer-dropdown, 1000)';
        let baseNum = 1000;
        let minBound = 900;
        let maxBound = 1100;

        switch (props.layer) {
            case 'popover':
                token = 'var(--max-layer-popover, 1200)';
                baseNum = 1200;
                minBound = 1150;
                maxBound = 1290;
                break;
            case 'modal':
                token = 'var(--max-layer-modal, 1310)';
                baseNum = 1310;
                minBound = 1300;
                maxBound = 1390;
                break;
            case 'fullscreen':
                token = 'var(--max-layer-fullscreen, 1400)';
                baseNum = 1400;
                minBound = 1395;
                maxBound = 1490;
                break;
            case 'tooltip':
                token = 'var(--max-layer-tooltip, 1600)';
                baseNum = 1600;
                minBound = 1590;
                maxBound = 9999;
                break;
            case 'dropdown':
            default:
                if (isInModal) {
                    token = 'calc(var(--max-layer-modal, 1310) + 10)';
                    baseNum = 1320;
                    minBound = 1315;
                    maxBound = 1390;
                } else {
                    token = 'var(--max-layer-dropdown, 1000)';
                    baseNum = 1000;
                    minBound = 900;
                    maxBound = 1100;
                }
                break;
        }

        const rawOffset = props.layerOffset ?? 0;
        const clampedOffset = Math.max(minBound - baseNum, Math.min(rawOffset, maxBound - baseNum));

        if (clampedOffset !== 0) return `calc(${token} + ${clampedOffset})`;

        return token;
    };

    const zIndex = computed(() => computeZIndex());

    const position = () => {
        if (!props.target || !panelRef.value) return;

        const t = props.target.getBoundingClientRect();
        const p = panelRef.value.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        const pHeight = p.height || panelRef.value.offsetHeight || 200;
        const spaceBelow = vh - t.bottom;
        const spaceAbove = t.top;
        const openUp = spaceBelow < pHeight && spaceAbove > spaceBelow;
        let top = openUp ? t.top - pHeight - props.offset : t.bottom + props.offset;

        // Safe area / viewport boundaries clamp (8px safe margin)
        top = Math.max(8, Math.min(top, vh - pHeight - 8));

        let left = props.align === 'right' ? t.right - p.width : t.left;
        left = Math.max(8, Math.min(left, vw - p.width - 8));

        panelStyle.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            minWidth: props.matchTargetWidth ? `${t.width}px` : undefined,
            zIndex: zIndex.value
        };
    };

    const onDocumentPointerDown = (event: PointerEvent | MouseEvent) => {
        if (!props.dismissable) return;
        const el = event.target as Node;
        if (panelRef.value?.contains(el)) return;
        if (props.target?.contains(el)) return;
        close();
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (!props.closeOnEscape) return;
        if (event.key === 'Escape') close();
    };

    let rafId: number | null = null;

    const onReposition = () => {
        if (rafId !== null) return;

        if (typeof requestAnimationFrame !== 'undefined') rafId = requestAnimationFrame(() => {
            rafId = null;
            position();
        });
        else position();

    };

    const attachListeners = () => {
        document.addEventListener('pointerdown', onDocumentPointerDown);
        document.addEventListener('click', onDocumentPointerDown);
        document.addEventListener('keydown', onKeydown);
        window.addEventListener('scroll', onReposition, true);
        window.addEventListener('resize', onReposition);
    };

    const detachListeners = () => {
        if (rafId !== null) {
            if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId);

            rafId = null;
        }
        document.removeEventListener('pointerdown', onDocumentPointerDown);
        document.removeEventListener('click', onDocumentPointerDown);
        document.removeEventListener('keydown', onKeydown);
        window.removeEventListener('scroll', onReposition, true);
        window.removeEventListener('resize', onReposition);
    };

    const close = () => {
        emit('update:visible', false);
    };

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
        attachListeners();
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
                detachListeners();
                props.target?.focus();
                emit('hide');
            }
        }
    );

    onMounted(() => {
        if (props.visible) openOverlay();
    });

    onBeforeUnmount(() => {
        detachListeners();
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
</style>
