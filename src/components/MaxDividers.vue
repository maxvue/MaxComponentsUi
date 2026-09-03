<template>
    <div
        ref="containerRef"
        class="max-dividers"
        :class="[
            isColumn ? 'is-column' : 'is-line',
            isMobile ? 'is-mobile' : 'is-desktop',
            { 'is-resizing': isDragging }
        ]"
        :style="rootStyle"
    >
        <div
            class="max-dividers-track"
            :class="`active-pane-${currentPane}`"
            :style="trackStyle"
        >
            <!-- Primeiro Painel -->
            <div
                class="max-divider-pane max-divider-pane--first"
                :style="firstPaneStyle"
            >
                <slot
                    name="first"
                    :next="next"
                    :back="back"
                    :active="currentPane"
                    :is-mobile="isMobile"
                />
            </div>

            <!-- Gutter Divisor (Desktop Resizable) -->
            <div
                v-if="props.resizable && !isMobile"
                class="max-dividers-gutter"
                :class="isColumn ? 'gutter-col' : 'gutter-row'"
                role="separator"
                tabindex="0"
                aria-label="Redimensionar divisor"
                @mousedown="onGutterMouseDown"
                @touchstart="onGutterTouchStart"
            >
                <div class="max-dividers-gutter-handle" />
            </div>

            <!-- Segundo Painel -->
            <div
                class="max-divider-pane max-divider-pane--second"
                :style="secondPaneStyle"
            >
                <!-- Barra superior do Mobile com Botão Voltar -->
                <div
                    v-if="isMobile && props.showBackButton"
                    class="max-divider-mobile-header"
                >
                    <slot
                        name="second-header"
                        :back="back"
                        :title="props.secondTitle"
                    >
                        <div class="max-divider-mobile-header-inner">
                            <button
                                type="button"
                                class="max-divider-back-btn"
                                aria-label="Voltar"
                                @click="back"
                            >
                                <MaxIcon :icon="props.backButtonIcon" size="1.2" />
                            </button>
                            <span
                                v-if="props.secondTitle"
                                class="max-divider-mobile-title"
                            >
                                {{ props.secondTitle }}
                            </span>
                        </div>
                    </slot>
                </div>

                <div class="max-divider-second-content">
                    <slot
                        name="second"
                        :next="next"
                        :back="back"
                        :active="currentPane"
                        :is-mobile="isMobile"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { useSystemStore } from '../stores/useSystem.Store';

    /**
     * Componente MaxDividers
     *
     * Responsável por criar divisões de layout em duas colunas ou duas linhas, com comportamento
     * responsivo avançado para desktop e mobile, permitindo aninhamento hierárquico (master-detail drill-down).
     *
     * Principais Funcionalidades:
     * 1. Modos de Orientação:
     *    - 'in-column' (padrão / prop booleana `in-column`): Divide o contêiner em duas colunas lado a lado.
     *    - 'in-line' (prop booleana `in-line`): Divide o contêiner em duas linhas empilhadas verticalmente.
     *
     * 2. Comportamento Desktop (>= breakpoint, padrão 1024px / 'lg'):
     *    - Exibe ambos os painéis (`#first` e `#second`) simultaneamente.
     *    - Suporta proporções flexíveis via prop `sizes` (ex.: `[33, 67]` ou `[4, 8]`) ou tamanho fixo via `firstSize` (ex.: '380px').
     *    - Divisor arrastável opcional (`resizable`) para redimensionamento manual em tempo real via mouse ou touch.
     *
     * 3. Comportamento Mobile (< breakpoint):
     *    - Efeito deslizante suave (300ms com aceleração por hardware via translate3d):
     *      * Horizontal (eixo X) no modo 'in-column'.
     *      * Vertical (eixo Y) no modo 'in-line'.
     *    - Ao navegar para o segundo painel (`active = 2` ou chamada a `next()`), exibe uma barra de cabeçalho
     *      superior com botão de voltar (setinha) e título opcional (`secondTitle`).
     *    - Ao clicar na setinha de voltar (ou chamar `back()`), retorna suavemente ao primeiro painel.
     *
     * 4. Aninhamento Hierárquico:
     *    - Permite aninhar múltiplos MaxDividers (ex.: Lista de Distritos -> Lista de Igrejas -> Detalhes da Igreja)
     *      onde cada nível gerencia seu estado e transição de forma isolada, criando uma navegação em cascata perfeita no mobile.
     */
    export interface MaxDividersProps {
        /** Direção do divisor: 'in-column' (colunas horizontais) ou 'in-line' (linhas verticais) */
        direction?: 'in-column' | 'in-line';
        /** Flag booleana de atalho para dividir em duas linhas empilhadas (<MaxDividers in-line>) */
        inLine?: boolean;
        /** Flag booleana de atalho para dividir em duas colunas lado a lado (<MaxDividers in-column>) */
        inColumn?: boolean;
        /** Painel atualmente ativo no mobile (1 para primeiro, 2 para segundo) - controle v-model padrão */
        modelValue?: 1 | 2;
        /** Painel atualmente ativo no mobile com controle v-model:active */
        active?: 1 | 2;
        /** Breakpoint em pixels ou alias ('sm', 'md', 'lg', 'xl') abaixo do qual ativa o modo mobile (padrão 1024) */
        breakpoint?: number | 'sm' | 'md' | 'lg' | 'xl';
        /** Força explicitamente o modo mobile (true) ou desktop (false), ignorando o resize de tela */
        mobile?: boolean;
        /** Proporções entre o primeiro e o segundo painel no desktop (ex: [35, 65] ou [4, 8]) */
        sizes?: [number, number] | string;
        /** Tamanho fixo do primeiro painel no desktop (ex: '380px' ou '30%') */
        firstSize?: string;
        /** Espaçamento entre os painéis no modo desktop (padrão '1rem') */
        gap?: string | number;
        /** Habilita barra divisora arrastável para redimensionamento manual no desktop */
        resizable?: boolean;
        /** Se true, exibe barra de cabeçalho com botão de voltar no topo do segundo painel no mobile */
        showBackButton?: boolean;
        /** Ícone do botão voltar no mobile (padrão 'mdi:arrow-left') */
        backButtonIcon?: string;
        /** Título exibido na barra superior do segundo painel no mobile */
        secondTitle?: string;
        /** Desativa animação de transição deslizante no mobile se true */
        disabledTransition?: boolean;
    }

    const props = withDefaults(defineProps<MaxDividersProps>(), {
        direction: 'in-column',
        inLine: false,
        inColumn: false,
        modelValue: 1,
        active: undefined,
        breakpoint: 1024,
        mobile: undefined,
        sizes: undefined,
        firstSize: undefined,
        gap: '1rem',
        resizable: false,
        showBackButton: true,
        backButtonIcon: 'mdi:arrow-left',
        secondTitle: '',
        disabledTransition: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: 1 | 2];
        'update:active': [value: 1 | 2];
        'next': [];
        'back': [];
        'resize': [sizes: [number, number]];
    }>();

    const containerRef = ref<HTMLElement | null>(null);
    const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const isDragging = ref(false);
    const customRatio = ref<number | null>(null);

    const isColumn = computed(() => {
        if (props.inLine) return false;
        if (props.inColumn) return true;
        return props.direction !== 'in-line';
    });

    const breakpointPixels = computed(() => {
        if (typeof props.breakpoint === 'number') return props.breakpoint;
        const breakpoints: Record<string, number> = {
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280
        };
        return breakpoints[props.breakpoint] ?? 1024;
    });

    let systemStore: any = null;
    try {
        systemStore = useSystemStore();
    } catch {
        // Ignora caso Pinia não esteja ativo no escopo
    }

    const isMobile = computed(() => {
        if (typeof props.mobile === 'boolean') return props.mobile;
        if (systemStore && typeof systemStore.isMobile === 'boolean') return systemStore.isMobile;
        return windowWidth.value < breakpointPixels.value;
    });

    const currentPane = ref<1 | 2>(props.active ?? props.modelValue ?? 1);

    watch(() => props.active, (val) => {
        if (val !== undefined) currentPane.value = val;
    });

    watch(() => props.modelValue, (val) => {
        if (val !== undefined && props.active === undefined) currentPane.value = val;
    });

    function setPane(pane: 1 | 2) {
        currentPane.value = pane;
        emit('update:active', pane);
        emit('update:modelValue', pane);
    }

    function next() {
        setPane(2);
        emit('next');
    }

    function back() {
        setPane(1);
        emit('back');
    }

    defineExpose({
        currentPane,
        isMobile,
        next,
        back,
        setPane
    });

    function handleResize() {
        if (typeof window !== 'undefined') windowWidth.value = window.innerWidth;
    }

    onMounted(() => {
        if (typeof window !== 'undefined') {
            windowWidth.value = window.innerWidth;
            window.addEventListener('resize', handleResize, { passive: true });
        }
    });

    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onGutterMouseMove);
            window.removeEventListener('mouseup', onGutterMouseUp);
            window.removeEventListener('touchmove', onGutterTouchMove);
            window.removeEventListener('touchend', onGutterTouchEnd);
        }
    });

    const parsedSizes = computed<[number, number] | null>(() => {
        if (customRatio.value !== null) return [customRatio.value, 100 - customRatio.value];

        if (!props.sizes) return null;
        if (Array.isArray(props.sizes) && props.sizes.length === 2) {
            const sum = props.sizes[0] + props.sizes[1];
            if (sum <= 0) return [50, 50];
            const p1 = Math.round((props.sizes[0] / sum) * 1000) / 10;
            return [p1, 100 - p1];
        }
        return null;
    });

    const rootStyle = computed(() => {
        const gapVal = props.resizable ? '0px' : (typeof props.gap === 'number' ? `${props.gap}px` : props.gap);
        return {
            '--max-divider-gap': gapVal
        };
    });

    const trackStyle = computed(() => {
        if (props.disabledTransition) return { transition: 'none !important' };
        return undefined;
    });

    const firstPaneStyle = computed(() => {
        if (isMobile.value) return undefined;

        if (props.firstSize) {
            if (isColumn.value) return {
                flex: `0 0 ${props.firstSize}`,
                width: props.firstSize,
                maxWidth: '100%'
            };
            return {
                flex: `0 0 ${props.firstSize}`,
                height: props.firstSize,
                maxHeight: '100%'
            };
        }

        if (parsedSizes.value) {
            const p1 = parsedSizes.value[0];
            const offset = props.resizable ? '3px' : 'calc(var(--max-divider-gap, 1rem) / 2)';
            if (isColumn.value) return {
                flex: `0 0 calc(${p1}% - ${offset})`,
                maxWidth: `calc(${p1}% - ${offset})`
            };
            return {
                flex: `0 0 calc(${p1}% - ${offset})`,
                maxHeight: `calc(${p1}% - ${offset})`
            };
        }

        return {
            flex: '1 1 0%',
            minWidth: '0',
            minHeight: '0'
        };
    });

    const secondPaneStyle = computed(() => {
        if (isMobile.value) return undefined;

        if (props.firstSize) return {
            flex: '1 1 0%',
            minWidth: '0',
            minHeight: '0'
        };

        if (parsedSizes.value) {
            const p2 = parsedSizes.value[1];
            const offset = props.resizable ? '3px' : 'calc(var(--max-divider-gap, 1rem) / 2)';
            if (isColumn.value) return {
                flex: `0 0 calc(${p2}% - ${offset})`,
                maxWidth: `calc(${p2}% - ${offset})`
            };
            return {
                flex: `0 0 calc(${p2}% - ${offset})`,
                maxHeight: `calc(${p2}% - ${offset})`
            };
        }

        return {
            flex: '1 1 0%',
            minWidth: '0',
            minHeight: '0'
        };
    });

    function onGutterMouseDown(event: MouseEvent) {
        event.preventDefault();
        isDragging.value = true;
        window.addEventListener('mousemove', onGutterMouseMove);
        window.addEventListener('mouseup', onGutterMouseUp);
    }

    function onGutterMouseMove(event: MouseEvent) {
        if (!isDragging.value || !containerRef.value) return;
        updateRatio(event.clientX, event.clientY);
    }

    function onGutterMouseUp() {
        if (!isDragging.value) return;
        isDragging.value = false;
        window.removeEventListener('mousemove', onGutterMouseMove);
        window.removeEventListener('mouseup', onGutterMouseUp);
        if (parsedSizes.value) emit('resize', parsedSizes.value);
    }

    function onGutterTouchStart(event: TouchEvent) {
        if (!event.touches.length) return;
        isDragging.value = true;
        window.addEventListener('touchmove', onGutterTouchMove, { passive: false });
        window.addEventListener('touchend', onGutterTouchEnd);
    }

    function onGutterTouchMove(event: TouchEvent) {
        if (!isDragging.value || !containerRef.value || !event.touches.length) return;
        event.preventDefault();
        const touch = event.touches[0];
        updateRatio(touch.clientX, touch.clientY);
    }

    function onGutterTouchEnd() {
        if (!isDragging.value) return;
        isDragging.value = false;
        window.removeEventListener('touchmove', onGutterTouchMove);
        window.removeEventListener('touchend', onGutterTouchEnd);
        if (parsedSizes.value) emit('resize', parsedSizes.value);
    }

    function updateRatio(clientX: number, clientY: number) {
        if (!containerRef.value) return;
        const rect = containerRef.value.getBoundingClientRect();
        let percent = 50;

        if (isColumn.value) {
            const width = rect.width;
            if (width > 0) percent = ((clientX - rect.left) / width) * 100;
        } else {
            const height = rect.height;
            if (height > 0) percent = ((clientY - rect.top) / height) * 100;
        }

        percent = Math.max(10, Math.min(90, Math.round(percent * 10) / 10));
        customRatio.value = percent;
    }
</script>

<style lang="scss" scoped>
.max-dividers {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
    position: relative;

    &.is-resizing {
        user-select: none;
        cursor: col-resize;
    }

    /* Desktop Layout */
    &.is-desktop {
        > .max-dividers-track {
            display: flex;
            width: 100%;
            height: 100%;
            min-height: 0;
            min-width: 0;
            gap: var(--max-divider-gap, 1rem);
        }

        &.is-column > .max-dividers-track {
            flex-direction: row;
        }

        &.is-line > .max-dividers-track {
            flex-direction: column;
        }

        > .max-dividers-track > .max-divider-pane {
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 0;
            min-width: 0;
        }

        .max-divider-second-content {
            display: flex;
            flex-direction: column;
            flex: 1 1 0%;
            min-height: 0;
            min-width: 0;
            height: 100%;
            width: 100%;
        }
    }

    /* Mobile Layout com Deslizamento */
    &.is-mobile {
        overflow: hidden;

        &.is-column {
            > .max-dividers-track {
                display: flex;
                flex-direction: row;
                width: 200%;
                height: 100%;
                min-height: 0;
                transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);

                &.active-pane-1 {
                    transform: translate3d(0, 0, 0);
                }

                &.active-pane-2 {
                    transform: translate3d(-50%, 0, 0);
                }

                > .max-divider-pane {
                    width: 50%;
                    height: 100%;
                    min-height: 0;
                    flex-shrink: 0;
                    box-sizing: border-box;
                }
            }
        }

        &.is-line {
            > .max-dividers-track {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 200%;
                min-height: 0;
                transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);

                &.active-pane-1 {
                    transform: translate3d(0, 0, 0);
                }

                &.active-pane-2 {
                    transform: translate3d(0, -50%, 0);
                }

                > .max-divider-pane {
                    width: 100%;
                    height: 50%;
                    min-height: 0;
                    flex-shrink: 0;
                    box-sizing: border-box;
                }
            }
        }

        .max-divider-pane {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .max-divider-second-content {
            display: flex;
            flex-direction: column;
            flex: 1 1 0%;
            min-height: 0;
            overflow: hidden;
            width: 100%;
        }

        .max-divider-mobile-header {
            display: flex;
            align-items: center;
            padding: 0.5rem 0.75rem;
            border-bottom: 1px solid var(--background-200, #e5e7eb);
            background-color: var(--background-0, #fff);
            flex-shrink: 0;
            z-index: 10;
        }

        .max-divider-mobile-header-inner {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
        }

        .max-divider-back-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.375rem;
            border-radius: 0.5rem;
            border: 1px solid var(--background-200, #e5e7eb);
            background-color: var(--background-0, #f8fafc);
            color: var(--background-800, #374151);
            cursor: pointer;
            transition: background-color 0.15s ease, transform 0.1s ease;

            &:hover {
                background-color: var(--background-100, #f3f4f6);
            }

            &:active {
                transform: scale(0.95);
            }
        }

        .max-divider-mobile-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--background-900, #1f2937);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    /* Gutter Bar (Divisor Arrastável) */
    .max-dividers-gutter {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--gray-200, #e5e7eb);
        transition: background-color 0.2s ease;
        flex-shrink: 0;
        z-index: 5;

        &:hover, &:focus {
            background-color: var(--blue-400, #60a5fa);
        }

        &.gutter-col {
            width: 6px;
            cursor: col-resize;
            height: 100%;

            .max-dividers-gutter-handle {
                width: 2px;
                height: 24px;
                border-radius: 1px;
                background-color: var(--gray-400, #9ca3af);
            }
        }

        &.gutter-row {
            height: 6px;
            cursor: row-resize;
            width: 100%;

            .max-dividers-gutter-handle {
                height: 2px;
                width: 24px;
                border-radius: 1px;
                background-color: var(--gray-400, #9ca3af);
            }
        }
    }
}
</style>
