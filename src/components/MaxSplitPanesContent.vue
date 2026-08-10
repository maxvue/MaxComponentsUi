<template>
    <div ref="main_board_ref" class="board_page_content_main_div">
        <Splitpanes :style="{ height: '100%', width: '100%', overflow: 'hidden' }" @resize="onResize">
            <Pane id="panel1" :size="system.split_panel" :style="{ backgroundColor: 'transparent' }" relative>
                <div class="pane1">
                    <slot></slot>
                </div>
            </Pane>
            <Pane v-if="showSidePanel" id="panel2" :size="100 - system.split_panel" style="background-color: transparent;" relative>
                <div v-if="system.split_panel !== 100" relative flex class="second-panel">
                    <TransitionFade>
                        <slot name="side"></slot>
                    </TransitionFade>
                </div>
            </Pane>
        </Splitpanes>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import { Splitpanes, Pane } from 'splitpanes';
    import 'splitpanes/dist/splitpanes.css';
    import { useElementSize } from '@maxvue/max-use';
    import TransitionFade from './TransitionFade.vue';
    import { useSystemStore } from '../stores/useSystem.Store';

    const props = withDefaults(defineProps<{
        /**
         * Exibe o painel lateral.
         *
         * No engeapp a condição vinha da store de chat (`is_visible`); como o
         * painel agora chega por slot, quem decide é a aplicação.
         */
        sideVisible?: boolean;
    }>(), {
        sideVisible: false
    });

    const system: any = useSystemStore();

    /** O painel lateral só reserva espaço quando visível e com largura útil. */
    const showSidePanel = computed<boolean>(() => props.sideVisible && (100 - system.split_panel) > 0);

    /** Persiste o tamanho do painel ao arrastar o divisor. */
    const onResize = (event: any): void => {
        system.split_panel = event.prevPane.size;
    };

    const main_board_ref = ref<HTMLElement>();
    const { width, height } = useElementSize(() => main_board_ref.value);

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
        padding: 8px;
        border-radius: 1rem;
        grid-template-columns: 1fr auto auto;
        background-color: var(--blue-825);

        &[screen='small'] {
            width: calc(100vw);
            height: calc(100vh - 64px - 69px);
            border-radius: 0;
            grid-template-columns: 1fr !important;
        }

        .move-divider {
            position: absolute;
            top: 20px;
            display: grid;
            width: 9px;
            height: calc(100% - 40px);
            cursor: col-resize;
            user-select: none;
            place-items: center;
        }

        .splitpanes__pane {
            overflow: hidden;
            border-radius: 10px;

            // O shorthand precisa vir antes de border-color, senão o sobrescreve.
            border: unset !important;
            border-color: transparent !important;
            outline: unset !important;
            background-color: var(--background-0) !important;
            border-image-width: 0 !important;
        }

        .splitpanes__splitter {
            width: 8px !important;
        }

        .pane1 {
            overflow: hidden;
            width: 100%;
            max-width: 100%;
            height: 100%;
            max-height: 100%;
            padding: 1rem;
        }
    }
</style>
