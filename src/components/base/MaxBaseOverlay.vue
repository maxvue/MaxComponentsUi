<template>
    <Teleport :to="appendTo" :disabled="appendTo === 'self'">
        <div v-if="visible && modal" class="max-base-overlay-mask" :style="maskStyle" @click="onMaskClick"></div>
        <Transition name="max-base-overlay">
            <div
                v-if="visible"
                ref="panelRef"
                v-bind="attrs"
                class="max-base-overlay p-component"
                :class="{ 'max-base-overlay-up': openUp }"
                :style="panelStyle"
                :role="role"
                :aria-modal="modal ? 'true' : undefined"
                tabindex="-1"
                @keydown.esc="onEscape"
                @keydown.tab="onTab"
            >
                <slot :open-up="openUp"></slot>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
    /**
     * Primitiva de sobreposição (painel flutuante ancorado a um gatilho).
     *
     * Substitui a infraestrutura de overlay do PrimeVue (Portal + DomHandler.absolutePosition
     * + ZIndexUtils + ConnectedOverlayScrollHandler) por uma implementação própria.
     *
     * RESPONSABILIDADE DO CONSUMIDOR:
     * - os atributos ARIA do **gatilho** (`aria-expanded`, `aria-controls`,
     *   `aria-haspopup`) não são gerenciados aqui — a primitiva não conhece o markup
     *   do gatilho. Quem usa deve aplicá-los;
     * - o posicionamento é calculado na abertura e em scroll/resize. Se o conteúdo do
     *   painel mudar de altura depois disso (lista carregada por API, virtual scroller,
     *   troca de mês do calendário), chame `position()` — exposto via `defineExpose` —
     *   senão o flip vertical continua decidido pela altura antiga.
     */
    import { computed, nextTick, onBeforeUnmount, ref, useAttrs, watch, type CSSProperties } from 'vue';
    import { isTopOverlay, lockBodyScroll, nextZIndex, pushOverlay, removeOverlay, unlockBodyScroll } from '../../helpers/overlayStack';

    // O Teleport é o nó raiz, então a herança automática não alcança o painel: os
    // atributos (id, aria-*) precisam ser aplicados nele à mão. O consumidor depende
    // disso para apontar o aria-controls do gatilho para o id do painel.
    defineOptions({ inheritAttrs: false });

    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Controla a visibilidade (v-model:visible) */
            visible?: boolean;
            /** Elemento-gatilho ao qual o painel se ancora. Sem target, o painel não é posicionado (modo drawer/diálogo, posicionado por CSS). */
            target?: HTMLElement | null;
            /** Destino do Teleport; 'self' desativa o teleport */
            appendTo?: string | HTMLElement;
            /** Alinhamento horizontal em relação ao gatilho */
            align?: 'left' | 'right';
            /** Força largura mínima igual à do gatilho */
            matchTargetWidth?: boolean;
            /** Altura máxima do painel; aplicada ANTES da medição, para o flip decidir certo */
            maxHeight?: string | null;
            /** Fecha ao clicar fora do painel e do gatilho */
            dismissable?: boolean;
            /** Fecha com a tecla Escape */
            closeOnEscape?: boolean;
            /** Distância em px entre o gatilho e o painel */
            offset?: number;
            /** Papel ARIA do painel (listbox para dropdowns, dialog para diálogos) */
            role?: string;
            /** Move o foco para o painel ao abrir. Default false: Select/AutoComplete/Menu gerenciam o foco por conta própria. */
            focusOnShow?: boolean;
            /** Devolve o foco ao gatilho ao fechar (independente de focusOnShow) */
            returnFocusOnHide?: boolean;
            /** Exibe máscara de fundo (diálogo/drawer) */
            modal?: boolean;
            /** Trava o scroll do body enquanto aberto */
            blockScroll?: boolean;
            /** Impede que o Tab escape do painel (obrigatório em diálogo modal) */
            trapFocus?: boolean;
        }>(),
        {
            visible: false,
            target: null,
            appendTo: 'body',
            align: 'left',
            matchTargetWidth: true,
            maxHeight: null,
            dismissable: true,
            closeOnEscape: true,
            offset: 2,
            role: 'dialog',
            focusOnShow: false,
            returnFocusOnHide: true,
            modal: false,
            blockScroll: false,
            trapFocus: false
        }
    );

    const emit = defineEmits<{
        'update:visible': [value: boolean];
        show: [];
        hide: [];
        'before-show': [];
        'before-hide': [];
    }>();

    /** Identidade desta instância na pilha global de overlays. */
    const overlayId = Symbol('max-base-overlay');

    const panelRef = ref<HTMLElement | null>(null);
    const openUp = ref(false);
    const style = ref<CSSProperties>({});

    /** Alocado UMA vez por abertura — reposicionar não deve inflar o empilhamento. */
    const zIndex = ref<number | null>(null);

    const panelStyle = computed<CSSProperties>(() => ({
        maxHeight: props.maxHeight ?? undefined,
        ...style.value
    }));

    const maskStyle = computed<CSSProperties>(() => ({
        position: 'fixed',
        inset: '0',
        zIndex: zIndex.value !== null ? String(zIndex.value - 1) : undefined
    }));

    /** Elemento que tinha o foco antes de abrir — o foco volta para ele ao fechar. */
    let previouslyFocused: HTMLElement | null = null;

    /** Esta instância contribui com uma trava de scroll no contador global. */
    let holdsScrollLock = false;

    const position = () => {
        if (!props.target || !panelRef.value) return;

        const t = props.target.getBoundingClientRect();
        const p = panelRef.value.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        // Flip vertical: abre acima quando não cabe abaixo e há mais espaço em cima.
        const spaceBelow = vh - t.bottom;
        const up = spaceBelow < p.height && t.top > spaceBelow;
        const top = up ? t.top - p.height - props.offset : t.bottom + props.offset;

        // Clamp horizontal: nunca ultrapassa as bordas da viewport.
        let left = props.align === 'right' ? t.right - p.width : t.left;
        left = Math.max(8, Math.min(left, vw - p.width - 8));

        openUp.value = up;
        style.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            minWidth: props.matchTargetWidth ? `${t.width}px` : undefined,
            zIndex: zIndex.value !== null ? String(zIndex.value) : undefined
        };
    };

    /**
     * Pede o fechamento ao consumidor. `before-hide`/`hide` são emitidos pelo watcher
     * de `visible`, para que o par saia igual venha o fechamento daqui (ESC,
     * click-outside) ou de uma mudança direta do v-model pelo consumidor.
     */
    const close = () => emit('update:visible', false);

    /**
     * Alvo onde o gesto de ponteiro começou. Um arraste iniciado dentro do painel que
     * termina fora dele (slider de cor, redimensionamento) gera um `click` cujo alvo
     * está fora — sem isto o overlay fecharia no meio do gesto.
     */
    let pointerDownTarget: Node | null = null;

    const onDocumentPointerDown = (event: Event) => {
        pointerDownTarget = (event.target as Node | null) ?? null;
    };

    /**
     * Um pointerdown que não vira click (drag que virou scroll, pointercancel, menu de
     * contexto) deixaria o alvo preso e faria o próximo clique legítimo ser engolido.
     */
    const onDocumentPointerCancel = () => {
        pointerDownTarget = null;
    };

    const isInside = (node: Node | null) => {
        if (!node) return false;
        if (panelRef.value?.contains(node)) return true;
        // Clique no gatilho também não fecha — senão o toggle do consumidor fecharia
        // e reabriria no mesmo evento.
        return props.target?.contains(node) === true;
    };

    const onDocumentClick = (event: MouseEvent) => {
        const startedInside = isInside(pointerDownTarget);
        pointerDownTarget = null;

        if (!props.dismissable) return;
        if (startedInside) return;
        if (isInside((event.target as Node | null) ?? null)) return;

        close();
    };

    const onMaskClick = () => {
        if (props.dismissable) close();
    };

    const onDocumentKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || !props.closeOnEscape) return;
        // Em overlays aninhados só o do topo reage; sem isto o listener registrado
        // primeiro (o de baixo) consumiria o ESC destinado ao painel de cima.
        if (!isTopOverlay(overlayId)) return;

        event.stopPropagation();
        close();
    };

    const onEscape = (event: KeyboardEvent) => {
        if (!props.closeOnEscape) return;
        event.stopPropagation();
        close();
    };

    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    /** Focus trap: Tab circula dentro do painel em vez de escapar para o fundo. */
    const onTab = (event: KeyboardEvent) => {
        if (!props.trapFocus || !panelRef.value) return;

        const focusables = Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusables.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        // O foco começa no próprio painel (tabindex=-1). Sem tratar esse caso, o
        // primeiro Tab não casa nenhum ramo e o navegador leva o foco para fora do
        // painel — que, teleportado para o fim do body, é o conteúdo de trás.
        const onPanel = active === panelRef.value || !panelRef.value.contains(active);

        if (event.shiftKey && (active === first || onPanel)) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && (active === last || onPanel)) {
            event.preventDefault();
            first.focus();
        }
    };

    const onScrollOrResize = () => position();

    const bindListeners = () => {
        // capture: true no scroll para pegar também containers internos com rolagem.
        document.addEventListener('pointerdown', onDocumentPointerDown, true);
        document.addEventListener('pointercancel', onDocumentPointerCancel, true);
        document.addEventListener('click', onDocumentClick, true);
        document.addEventListener('keydown', onDocumentKeydown, true);
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
    };

    const unbindListeners = () => {
        document.removeEventListener('pointerdown', onDocumentPointerDown, true);
        document.removeEventListener('pointercancel', onDocumentPointerCancel, true);
        document.removeEventListener('click', onDocumentClick, true);
        document.removeEventListener('keydown', onDocumentKeydown, true);
        window.removeEventListener('scroll', onScrollOrResize, true);
        window.removeEventListener('resize', onScrollOrResize);
    };

    let listenersBound = false;

    const bindOnce = () => {
        if (listenersBound) return;
        bindListeners();
        listenersBound = true;
    };

    const unbindOnce = () => {
        if (!listenersBound) return;
        unbindListeners();
        listenersBound = false;
    };

    // A trava vive no módulo compartilhado, com contagem de referências: vários
    // overlays modais abertos ao mesmo tempo precisam de um único lock coerente.
    const lockScroll = () => {
        if (!props.blockScroll) return;
        lockBodyScroll();
        holdsScrollLock = true;
    };

    /**
     * `holdsScrollLock` garante simetria: unlockScroll é chamado tanto no fechamento
     * quanto no unmount, e sem a guarda um overlay fechado-e-depois-desmontado
     * decrementaria o contador global duas vezes, destravando o body por baixo de
     * outro overlay modal ainda aberto.
     */
    const unlockScroll = () => {
        if (!holdsScrollLock) return;
        unlockBodyScroll();
        holdsScrollLock = false;
    };

    /**
     * Na primeira execução do watcher (immediate) wasVisible é undefined. Sem esta
     * marca, montar com visible=false emitiria before-hide/hide espúrios — evento
     * falso para qualquer consumidor que escute @hide.
     */
    let firstRun = true;

    watch(
        () => props.visible,
        async (isVisible, wasVisible) => {
            const initial = firstRun;
            firstRun = false;

            if (initial && !isVisible) return;
            if (!initial && isVisible === wasVisible) return;

            if (isVisible) {
                emit('before-show');
                previouslyFocused = (document.activeElement as HTMLElement | null) ?? props.target ?? null;

                zIndex.value = nextZIndex();
                pushOverlay(overlayId);
                lockScroll();

                await nextTick();
                position();
                bindOnce();

                if (props.focusOnShow || props.trapFocus) panelRef.value?.focus();

                emit('show');
                return;
            }

            emit('before-hide');
            unbindOnce();
            removeOverlay(overlayId);
            unlockScroll();
            style.value = {};
            openUp.value = false;

            if (props.returnFocusOnHide) {
                // Devolve o foco ao gatilho (ou a quem o tinha) ao fechar.
                const back = props.target ?? previouslyFocused;
                back?.focus?.();
            }
            previouslyFocused = null;

            emit('hide');
        },
        { immediate: true }
    );

    onBeforeUnmount(() => {
        unbindOnce();
        removeOverlay(overlayId);
        unlockScroll();
    });

    defineExpose({ position, panelRef });
</script>

<style lang="scss">
.max-base-overlay {
    background-color: var(--background-0);
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    outline: none;
    overflow: auto;
}

.max-base-overlay-mask {
    background-color: rgb(0 0 0 / 10%);
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

.max-base-overlay-up {
    &.max-base-overlay-enter-from,
    &.max-base-overlay-leave-to {
        transform: translateY(4px);
    }
}
</style>
