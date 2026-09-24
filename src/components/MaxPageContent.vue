<template>
    <div
        ref="main_board_ref"
        class="max-page-content board_page_content_main_div"
        :class="{ 'has-panel0': isSubmenuOpen }"
    >
        <!-- panel0: submenu lateral aberto no desktop -->
        <MaxSideMenuFlyout
            v-if="!isMobile && isSubmenuOpen"
            :visible="isSubmenuOpen"
            :item="system.active_side_submenu"
            @close="system.closeSideSubmenu"
        />

        <div class="pane1">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs } from 'vue';
    import { useElementSize } from '@maxvue/max-use';
    import { useSystemStore } from '../stores/useSystem.Store';
    import MaxSideMenuFlyout from './MaxSideMenuFlyout.vue';

    const attrs = useAttrs();
    const system = useSystemStore();

    /** Determina se está em modo mobile. */
    const isMobile = computed<boolean>(() => {
        const target = attrs.screen as string | undefined;
        if (target) return target === 'mobile';
        return system.type_device === 'mobile';
    });

    /** Indica se o submenu lateral deve ser exibido como panel0. */
    const isSubmenuOpen = computed<boolean>(() => {
        return Boolean(!isMobile.value && system.active_side_submenu);
    });

    const main_board_ref = ref<HTMLElement>();
    const { width, height } = useElementSize(() => main_board_ref.value);

    // Várias telas dimensionam seu conteúdo a partir do `content_page_size`; ele
    // é medido aqui porque este é o elemento que define a área útil da aplicação.
    watch(() => [width.value, height.value], ([w, h]) => {
        if (h > 0 || w > 0) system.content_page_size = { height: h, width: w };
    }, { immediate: true });
</script>

<style lang="scss" scoped>
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
        background-color: var(--layout-content-frame-bg, #004860);
        transition: grid-template-columns 0.22s cubic-bezier(0.16, 1, 0.3, 1), gap 0.22s ease;

        &.has-panel0 {
            grid-template-columns: 240px 1fr;
            gap: 8px;
        }

        &[screen='mobile'] {
            width: 100%;
            height: calc(100dvh - var(--top-menu-height, 60px) - var(--bottom-menu-height, 58px) - env(safe-area-inset-bottom, 0px));
            border-radius: 0;

            &.has-panel0 {
                grid-template-columns: 1fr;
                gap: 0;
            }
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

    @media (prefers-reduced-motion: reduce) {
        .board_page_content_main_div,
        .pane1 {
            transition: none !important;
        }
    }
</style>
