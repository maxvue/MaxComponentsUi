<template>
    <div ref="main_board_ref" class="board_page_content_main_div">
        <div class="pane1">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useElementSize } from '@maxvue/max-use';
    import { useSystemStore } from '../stores/useSystem.Store';

    const system: any = useSystemStore();

    const main_board_ref = ref<HTMLElement>();
    const { width, height } = useElementSize(() => main_board_ref.value);

    // Várias telas dimensionam seu conteúdo a partir do `content_page_size`; ele
    // é medido aqui porque este é o elemento que define a área útil da aplicação.
    watch(() => [width.value, height.value], ([w, h]) => {
        if (h > 0 || w > 0) system.content_page_size = { height: h, width: w };
    }, { immediate: true });
</script>

<style lang="scss">
    .board_page_content_main_div {
        position: relative;
        top: 64px;
        display: grid;
        width: calc(100% - 1rem);
        height: calc(100vh - 64px - 1rem);
        height: calc(100dvh - 64px - 1rem);
        padding: 8px;
        box-sizing: border-box;
        border-radius: 1rem;
        grid-template-columns: 1fr;
        background-color: var(--blue-825);

        &[screen='mobile'] {
            width: 100%;
            height: calc(100dvh - var(--top-menu-height, 60px) - var(--bottom-menu-height, 58px) - env(safe-area-inset-bottom, 0px));
            border-radius: 0;
        }

        .pane1 {
            overflow: hidden auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-y: contain;
            min-height: 0;
            width: 100%;
            max-width: 100%;
            height: 100%;
            max-height: 100%;
            padding: 1rem;
            box-sizing: border-box;
            border-radius: 10px;
            background-color: var(--background-0);
        }
    }
</style>
