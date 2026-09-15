<template>
    <Teleport to="body">
        <TransitionFade>
            <div class="max-popover-confirm background-popover-confirm" @click.stop="confirm_store.hide" v-if="confirm_store.show">
                <div
                    class="max-icon-confirm-dialog"
                    ref="el"
                    role="alertdialog"
                    aria-modal="true"
                    :aria-labelledby="msg_id"
                    :style="{top: position.top + 'px', left: position.left + 'px'}"
                    :class="[position.isTop ? 'is-top' : 'is-bottom', position.isLeft ? 'is-left' : 'is-right']"
                    @click.stop="() => {}"
                    @keydown="trap.onKeydown"
                >
                    <div class="popover-confirm-content">
                        <MaxIcon
                            class="popover-confirm-icon"
                            :class="`severity-${confirm_store.severity ?? 'danger'}`"
                            :i="confirm_store.messageIcon ?? (confirm_store.severity === 'warning' ? 'solar:danger-triangle-bold' : confirm_store.severity === 'info' ? 'solar:info-circle-bold' : confirm_store.severity === 'success' ? 'solar:check-circle-bold' : 'mingcute:question-fill')"
                            size="1.2"
                        />
                        <div :id="msg_id" class="popover-confirm-text">
                            {{ confirm_store.message }}
                        </div>
                    </div>
                    <MaxGrid class="popover-confirm-actions">
                        <MaxButton
                            class="popover-confirm-btn"
                            :action="reject"
                            :label="confirm_store.rejectProps.label"
                            :icon="confirm_store.rejectProps.icon"
                            :severity="confirm_store.rejectProps.severity ?? 'secondary'"
                            :variant="confirm_store.rejectProps.variant ?? 'outlined'"
                        />
                        <MaxButton
                            class="popover-confirm-btn"
                            :action="accept"
                            :label="confirm_store.acceptProps.label"
                            :icon="confirm_store.acceptProps.icon"
                            :severity="confirm_store.acceptProps.severity ?? (confirm_store.severity ?? 'danger')"
                            :variant="confirm_store.acceptProps.variant"
                        />
                    </MaxGrid>
                </div>
            </div>
        </TransitionFade>
    </Teleport>
</template>

<script setup lang="ts">
    import { useConfirmStore } from '../stores/useConfirm.Store';
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import MaxGrid from './MaxGrid.vue';
    import MaxButton from './MaxButton.vue';
    import MaxIcon from './MaxIcon.vue';
    import { useTemplateRef, computed, watch, onBeforeUnmount, onMounted, useId, ref } from 'vue';
    import { useBrowserEventListener } from '../composables/useBrowserEventListener';
    import TransitionFade from './TransitionFade.vue';

    const confirm_store = useConfirmStore();

    const id = useId();
    const msg_id = computed(() => 'max-popover-confirm-msg-' + id);

    const el = useTemplateRef<HTMLElement>('el');
    const trap = useFocusTrap(el);

    const accept = () => {
        confirm_store.acceptProps.action?.();
        confirm_store.hide();
    };
    const reject = () => {
        confirm_store.rejectProps.action?.();
        confirm_store.hide();
    };

    const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && confirm_store.show) confirm_store.hide();
    };

    const is_mounted = ref(false);

    useBrowserEventListener('keydown', onEscape, () => confirm_store.show);

    const activeTarget = computed(() => {
        if (confirm_store.targetElement && typeof confirm_store.targetElement.getBoundingClientRect === 'function') return confirm_store.targetElement;

        return {
            getBoundingClientRect: () => ({
                x: confirm_store.x,
                y: confirm_store.y,
                left: confirm_store.x,
                top: confirm_store.y,
                width: confirm_store.width,
                height: confirm_store.height,
                right: confirm_store.x + confirm_store.width,
                bottom: confirm_store.y + confirm_store.height,
                toJSON: () => {}
            } as DOMRect)
        } as unknown as HTMLElement;
    });

    const { position } = useActiveOverlayPosition<{
        top: number;
        left: number;
        isTop: boolean;
        isLeft: boolean;
    }>({
        target: activeTarget,
        overlay: el,
        active: () => confirm_store.show,
        compute: ({ targetRect, overlayRect, viewportWidth, viewportHeight, safeArea }) => {
            const targetX = targetRect.left;
            const targetY = targetRect.top;
            const targetH = targetRect.height;
            const width_el = overlayRect.width || 300;
            const height_el = overlayRect.height || 60;

            const safeTop = safeArea?.top ?? 0;
            const safeRight = safeArea?.right ?? 0;
            const safeBottom = safeArea?.bottom ?? 0;
            const safeLeft = safeArea?.left ?? 0;

            const margin = 8;
            const minTop = Math.max(margin, safeTop + margin);
            const maxBottom = Math.max(minTop, viewportHeight - safeBottom - margin);
            const minLeft = Math.max(margin, safeLeft + margin);
            const maxRight = Math.max(minLeft, viewportWidth - safeRight - margin);

            let top = targetY + targetH + 15;
            let left = targetX;
            let isTop = false;
            let isLeft = false;

            if (top + height_el + 15 > maxBottom) {
                top = targetY - height_el - 30;
                isTop = true;
            }

            if (left + width_el + 15 > maxRight) {
                left = targetX - width_el + 20;
                isLeft = true;
            }

            left = Math.max(minLeft, Math.min(left, maxRight - width_el));
            top = Math.max(minTop, Math.min(top, maxBottom - height_el));

            return {
                top,
                left,
                isTop,
                isLeft
            };
        }
    });

    onMounted(() => {
        is_mounted.value = true;
        if (confirm_store.show) trap.activate();

    });

    watch(() => confirm_store.show, (value) => {
        if (!is_mounted.value) return;
        if (value) trap.activate();
        else trap.deactivate();
    }, { immediate: true });

    onBeforeUnmount(() => {
        trap.deactivate();
    });
</script>

<style lang="scss" scoped>
.background-popover-confirm {
    background-color: rgb(0 0 0 / 10%);
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    position: fixed;
    z-index: var(--max-z-index-popover, var(--max-layer-popover, 1200));
    top: 0;
    left: 0;

    .max-icon-confirm-dialog {
        position: fixed;
        width: min(300px, calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px));
        max-width: calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px);
        box-sizing: border-box;
        min-height: 60px;
        max-height: calc(100vh - 32px);
        max-height: calc(100dvh - 32px);
        max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px);
        overflow-y: auto;
        background-color: var(--background-0);
        color: var(--background-700);
        z-index: 2; /* Stacking interno relativo ao backdrop .background-popover-confirm */
        border: 1px solid var(--surface-border);

        /* O drop-shadow traça o contorno real do elemento + seus ::before, criando o balão perfeito */
        filter: drop-shadow(0 4px 8px rgb(0 0 0 / 20%));
        border-radius: 0.75rem;
        padding: 10px;

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

        .popover-confirm-content {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 0.75rem 1rem;
            text-align: left;
            color: var(--background-750);

            .popover-confirm-icon {
                &.severity-danger {
                    color: var(--red-600);
                }

                &.severity-warning {
                    color: var(--yellow-600);
                }

                &.severity-info,
                &.severity-secondary {
                    color: var(--blue-600);
                }

                &.severity-success {
                    color: var(--green-600);
                }
            }

            .popover-confirm-text {
                font-size: 0.9rem;
                font-weight: 500;
                line-height: 1.3;
            }
        }

        .popover-confirm-actions {
            .popover-confirm-btn {
                flex: 1 0 calc(50% - 8px);
            }
        }
    }
}
</style>
