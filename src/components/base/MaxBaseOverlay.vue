<template>
    <Teleport :to="appendTo">
        <Transition name="max-base-overlay">
            <div
                v-if="visible"
                ref="panelRef"
                class="max-base-overlay"
                :role="role"
                tabindex="-1"
                :style="panelStyle"
            >
                <slot></slot>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
    import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

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
            role: 'dialog'
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

    let zIndexCounter = 1000;
    const nextZIndex = () => ++zIndexCounter;

    const position = () => {
        if (!props.target || !panelRef.value) return;

        const t = props.target.getBoundingClientRect();
        const p = panelRef.value.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        const spaceBelow = vh - t.bottom;
        const openUp = spaceBelow < p.height && t.top > spaceBelow;
        const top = openUp ? t.top - p.height - props.offset : t.bottom + props.offset;

        let left = props.align === 'right' ? t.right - p.width : t.left;
        left = Math.max(8, Math.min(left, vw - p.width - 8));

        panelStyle.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            minWidth: props.matchTargetWidth ? `${t.width}px` : undefined,
            zIndex: String(nextZIndex())
        };
    };

    const onClickOutside = (event: MouseEvent) => {
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

    const onReposition = () => position();

    const attachListeners = () => {
        document.addEventListener('click', onClickOutside);
        document.addEventListener('keydown', onKeydown);
        window.addEventListener('scroll', onReposition, true);
        window.addEventListener('resize', onReposition);
    };

    const detachListeners = () => {
        document.removeEventListener('click', onClickOutside);
        document.removeEventListener('keydown', onKeydown);
        window.removeEventListener('scroll', onReposition, true);
        window.removeEventListener('resize', onReposition);
    };

    const close = () => {
        emit('update:visible', false);
    };

    const openOverlay = async () => {
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
