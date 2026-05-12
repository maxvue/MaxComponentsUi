<template>
    <TransitionFade>
        <div class="background-popover" @click.stop="confirm_store.hide" v-if="confirm_store.show">
            <div class="max-icon-confirm-dialog" ref="el" :style="{top: position.top + 'px', left: position.left + 'px'}"  :class="[position.isTop ? 'is-top' : 'is-bottom', position.isLeft ? 'is-left' : 'is-right']">
                <div pw4 pt-4 full text-center color-background-750 class="popover-confirm-content" >
                    <MaxIcon i="mingcute:question-fill" size="1.2" color-red-600 />
                    <div>
                        {{confirm_store.message}}
                    </div>
                </div>
                <MaxGrid>
                    <MaxButton s50 @click="confirm_store.rejectProps.action" :label="confirm_store.rejectProps.label" :icon="confirm_store.rejectProps.icon" />
                    <MaxButton s50 @click="confirm_store.acceptProps.action" :label="confirm_store.acceptProps.label" :icon="confirm_store.acceptProps.icon"  />
                </MaxGrid>
            </div>
        </div>
    </TransitionFade>
</template>

<script setup lang="ts">
    import { useConfirmStore } from '../stores/useConfirm.Store';
    import MaxGrid from './MaxGrid.vue';
    import MaxButton from './MaxButton.vue';
    import MaxIcon from './MaxIcon.vue';
    import { useElementSize, useWindowSize } from '@maxvue/max-use';
    import { useTemplateRef, computed } from 'vue';
    import TransitionFade from './TransitionFade.vue';

    const confirm_store = useConfirmStore();
    const { width: window_width, height: window_height } = useWindowSize();


    const el = useTemplateRef('el');
    const { width, height } = useElementSize(el as any);


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

</script>

<style lang="scss">
.background-popover {
    background-color: rgb(0 0 0 / 10%);
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: 3;
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
