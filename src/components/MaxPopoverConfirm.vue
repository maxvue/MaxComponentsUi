<template>
    <Teleport to="body">
        <TransitionFade>
            <div class="background-popover-confirm" @click.stop="confirm_store.hide" v-if="confirm_store.show">
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
                    <div pw4 pt-4 full text-center color-background-750 class="popover-confirm-content">
                        <MaxIcon :i="confirm_store.messageIcon ?? 'mingcute:question-fill'" size="1.2" color-red-600 />
                        <div :id="msg_id">
                            {{confirm_store.message}}
                        </div>
                    </div>
                    <MaxGrid>
                        <MaxButton s50 :action="reject" :label="confirm_store.rejectProps.label" :icon="confirm_store.rejectProps.icon" />
                        <MaxButton s50 :action="accept" :label="confirm_store.acceptProps.label" :icon="confirm_store.acceptProps.icon" />
                    </MaxGrid>
                </div>
            </div>
        </TransitionFade>
    </Teleport>
</template>

<script setup lang="ts">
    import { useConfirmStore } from '../stores/useConfirm.Store';
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import MaxGrid from './MaxGrid.vue';
    import MaxButton from './MaxButton.vue';
    import MaxIcon from './MaxIcon.vue';
    import { useElementSize, useWindowSize } from '@maxvue/max-use';
    import { useTemplateRef, computed, watch, onBeforeUnmount, useId } from 'vue';
    import TransitionFade from './TransitionFade.vue';

    const confirm_store = useConfirmStore();
    const { width: window_width, height: window_height } = useWindowSize();

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

    watch(() => confirm_store.show, (value) => {
        if (value) {
            trap.activate();
            document.addEventListener('keydown', onEscape);
        } else {
            trap.deactivate();
            document.removeEventListener('keydown', onEscape);
        }
    }, { immediate: true });

    onBeforeUnmount(() => {
        trap.deactivate();
        document.removeEventListener('keydown', onEscape);
    });

    const position = computed(() => {
        const data ={
            top: confirm_store.y + confirm_store.height + 15,
            left: confirm_store.x,
            isTop: false,
            isLeft: false
        };
        if (data.top + height.value + 15 > window_height.value) {
            data.top = confirm_store.y - height.value - 30;
            data.isTop = true;
        }
        if (data.left + width.value + 15 > window_width.value) {
            data.left = confirm_store.x - width.value + 20;
            data.isLeft = true;
        }
        return data;
    });

    const { width, height } = useElementSize(el as any);
</script>

<style lang="scss">
.background-popover-confirm {
    background-color: rgb(0 0 0 / 10%);
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: 99;
    top: 0;
    left: 0;
}

.max-icon-confirm-dialog {
    position: fixed;
    min-width: 300px;
    min-height: 60px;
    background-color: var(--background-0);
    z-index: 2;
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
        right: 15px;
    }

    &.is-right::before {
        left: 15px;
    }

    .popover-confirm-content {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 5px;
    }
}
</style>
