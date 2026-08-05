import type { Directive, DirectiveBinding } from 'vue';

/**
 * Diretiva `v-tooltip`. Implementação própria, substituindo a diretiva homônima
 * que vinha da biblioteca de terceiros.
 *
 * ⚠️ É API PÚBLICA: registrada globalmente em `src/index.ts` e usada por apps
 * consumidoras que este repositório não enxerga. Um grep local não revela os
 * consumidores reais — compatibilidade aqui é contrato, não detalhe.
 *
 * Formas de uso preservadas:
 *   v-tooltip="'Texto'"
 *   v-tooltip="{ value: 'Texto', showDelay: 300, escape: false }"
 *   v-tooltip.top / .right / .bottom / .left
 *   v-tooltip.focus="'Só no foco'"
 *   v-tooltip="null"   -> nenhum tooltip (usado para suprimir; ver MaxPopover)
 */

export interface TooltipOptions {
    /** Texto exibido. Aceita HTML apenas quando `escape` é false. */
    value?: string | null;
    /** Desativa o tooltip sem remover a diretiva */
    disabled?: boolean;
    /** true (default) renderiza como texto; false interpreta HTML */
    escape?: boolean;
    /** ms antes de exibir */
    showDelay?: number;
    /** ms antes de esconder */
    hideDelay?: number;
    /** false mantém o tooltip aberto ao sair do gatilho */
    autoHide?: boolean;
    /** Largura ajustada ao conteúdo */
    fitContent?: boolean;
    /** Classe extra aplicada ao nó do tooltip */
    class?: string;
}

type Position = 'top' | 'right' | 'bottom' | 'left';

interface TooltipState {
    tooltip: HTMLElement | null;
    showTimer: number | null;
    hideTimer: number | null;
    options: TooltipOptions;
    position: Position;
    listeners: Array<[string, EventListener]>;
    id: string;
}

const states = new WeakMap<HTMLElement, TooltipState>();

let idCounter = 0;

const parseOptions = (binding: DirectiveBinding): TooltipOptions => {
    const raw = binding.value;
    if (typeof raw === 'string') return { value: raw };
    if (raw && typeof raw === 'object') return raw as TooltipOptions;
    // null/undefined/'' — usado deliberadamente para SUPRIMIR o tooltip
    return { value: null };
};

/**
 * Default `right`: é o da implementação anterior, confirmado na fonte dela (o ramo
 * `else` final de `align` chamava `alignRight`). Trocar para `top` — mais comum em
 * outras libs — reposicionaria silenciosamente todos os tooltips das apps
 * consumidoras.
 */
const parsePosition = (binding: DirectiveBinding): Position => {
    if (binding.modifiers.top) return 'top';
    if (binding.modifiers.right) return 'right';
    if (binding.modifiers.bottom) return 'bottom';
    if (binding.modifiers.left) return 'left';
    return 'right';
};

const hasText = (options: TooltipOptions) => typeof options.value === 'string' && options.value.length > 0;

const isActive = (options: TooltipOptions) => hasText(options) && options.disabled !== true;

const clearTimers = (state: TooltipState) => {
    if (state.showTimer !== null) {
        window.clearTimeout(state.showTimer);
        state.showTimer = null;
    }
    if (state.hideTimer !== null) {
        window.clearTimeout(state.hideTimer);
        state.hideTimer = null;
    }
};

/**
 * `escape` default true: HTML só é interpretado sob pedido explícito, senão um texto
 * vindo de API vira vetor de XSS. Compartilhado por `buildTooltip` e `updated` para
 * que os dois caminhos não possam divergir.
 */
const aplicarTexto = (alvo: Element, options: TooltipOptions) => {
    if (options.escape === false) alvo.innerHTML = options.value ?? '';
    else alvo.textContent = options.value ?? '';
};

const buildTooltip = (state: TooltipState): HTMLElement => {
    const tooltip = document.createElement('div');
    tooltip.id = state.id;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.className = `p-tooltip p-component p-tooltip-${state.position}`;
    if (state.options.class) tooltip.classList.add(state.options.class);
    tooltip.style.position = 'absolute';

    const arrow = document.createElement('div');
    arrow.className = 'p-tooltip-arrow';

    const text = document.createElement('div');
    text.className = 'p-tooltip-text';

    aplicarTexto(text, state.options);

    if (state.options.fitContent !== false) tooltip.style.width = 'fit-content';

    tooltip.appendChild(arrow);
    tooltip.appendChild(text);
    return tooltip;
};

/** Posiciona o tooltip junto ao gatilho, com flip quando não cabe na viewport. */
const align = (el: HTMLElement, state: TooltipState) => {
    const tooltip = state.tooltip;
    if (!tooltip) return;

    const host = el.getBoundingClientRect();
    const size = tooltip.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft || 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;

    // Flip só faz sentido com medição real. Sem layout (elemento ainda não pintado,
    // display:none, ambiente de teste sem layout) todos os rects são zero e qualquer
    // comparação de borda daria "não cabe", virando o tooltip sem motivo.
    const medido = host.width > 0 || host.height > 0;

    const flip = (): Position => {
        if (!medido) return state.position;
        if (state.position === 'right' && host.right + size.width + gap > vw) return 'left';
        if (state.position === 'left' && host.left - size.width - gap < 0) return 'right';
        if (state.position === 'top' && host.top - size.height - gap < 0) return 'bottom';
        if (state.position === 'bottom' && host.bottom + size.height + gap > vh) return 'top';
        return state.position;
    };

    const position = flip();

    tooltip.className = `p-tooltip p-component p-tooltip-${position}`;
    if (state.options.class) tooltip.classList.add(state.options.class);

    let top: number;
    let left: number;

    if (position === 'right') {
        top = host.top + (host.height - size.height) / 2;
        left = host.right + gap;
    } else if (position === 'left') {
        top = host.top + (host.height - size.height) / 2;
        left = host.left - size.width - gap;
    } else if (position === 'top') {
        top = host.top - size.height - gap;
        left = host.left + (host.width - size.width) / 2;
    } else {
        top = host.bottom + gap;
        left = host.left + (host.width - size.width) / 2;
    }

    tooltip.style.top = `${top + scrollTop}px`;
    tooltip.style.left = `${left + scrollLeft}px`;
};

const hide = (el: HTMLElement, immediate = false) => {
    const state = states.get(el);
    if (!state) return;

    if (state.showTimer !== null) {
        window.clearTimeout(state.showTimer);
        state.showTimer = null;
    }

    const remove = () => {
        state.hideTimer = null;
        if (state.tooltip?.parentNode) state.tooltip.parentNode.removeChild(state.tooltip);
        state.tooltip = null;
        el.removeAttribute('aria-describedby');
    };

    const delay = state.options.hideDelay ?? 0;
    if (immediate || delay <= 0) {
        remove();
        return;
    }

    if (state.hideTimer !== null) window.clearTimeout(state.hideTimer);
    state.hideTimer = window.setTimeout(remove, delay);
};

const show = (el: HTMLElement) => {
    const state = states.get(el);
    if (!state || !isActive(state.options)) return;

    if (state.hideTimer !== null) {
        window.clearTimeout(state.hideTimer);
        state.hideTimer = null;
    }

    const render = () => {
        state.showTimer = null;
        if (state.tooltip) return;

        state.tooltip = buildTooltip(state);
        document.body.appendChild(state.tooltip);
        // aponta o gatilho para o texto: é isto que faz o leitor de tela anunciá-lo
        el.setAttribute('aria-describedby', state.id);
        align(el, state);
    };

    const delay = state.options.showDelay ?? 0;
    if (delay <= 0) {
        render();
        return;
    }

    if (state.showTimer !== null) window.clearTimeout(state.showTimer);
    state.showTimer = window.setTimeout(render, delay);
};

const bindListeners = (el: HTMLElement, state: TooltipState, focusOnly: boolean) => {
    const onShow = () => show(el);
    const onHide = () => hide(el);

    // `autoHide` vale SÓ para o mouseleave, como na implementação anterior: blur e
    // click escondem incondicionalmente.
    const onMouseLeave = () => {
        if (state.options.autoHide === false) return;
        hide(el);
    };

    // Escape dispensa o tooltip em qualquer modo — é o comportamento da implementação
    // anterior e o padrão WAI-ARIA para tooltips.
    const onKeydown = ((event: KeyboardEvent) => {
        if (event.code === 'Escape') hide(el);
    }) as EventListener;

    const pairs: Array<[string, EventListener]> = focusOnly
        ? [['focus', onShow], ['blur', onHide], ['keydown', onKeydown]]
        // sem o modificador, mouse E teclado disparam: tooltip só no hover é
        // inacessível para quem navega por Tab. O `click` esconde, como na
        // implementação anterior.
        : [
            ['mouseenter', onShow],
            ['mouseleave', onMouseLeave],
            ['click', onHide],
            ['focus', onShow],
            ['blur', onHide],
            ['keydown', onKeydown]
        ];

    for (const [event, handler] of pairs) {
        el.addEventListener(event, handler);
        state.listeners.push([event, handler]);
    }
};

const unbindListeners = (el: HTMLElement, state: TooltipState) => {
    for (const [event, handler] of state.listeners) el.removeEventListener(event, handler);
    state.listeners = [];
};

export const Tooltip: Directive<HTMLElement, string | TooltipOptions | null | undefined> = {
    mounted(el, binding) {
        idCounter += 1;

        const state: TooltipState = {
            tooltip: null,
            showTimer: null,
            hideTimer: null,
            options: parseOptions(binding),
            position: parsePosition(binding),
            listeners: [],
            id: `max-tooltip-${idCounter}`
        };

        states.set(el, state);
        bindListeners(el, state, binding.modifiers.focus === true);
    },

    updated(el, binding) {
        const state = states.get(el);
        if (!state) return;

        state.options = parseOptions(binding);
        state.position = parsePosition(binding);

        // texto reativo é comum (v-tooltip="labelComputada"); sem isto ele congelaria
        // no valor da primeira renderização
        if (!state.tooltip) return;

        if (!isActive(state.options)) {
            hide(el, true);
            return;
        }

        const text = state.tooltip.querySelector('.p-tooltip-text');
        if (text) aplicarTexto(text, state.options);

        align(el, state);
    },

    unmounted(el) {
        const state = states.get(el);
        if (!state) return;

        // timer órfão dispararia depois do desmonte, sobre um elemento já solto
        clearTimers(state);
        unbindListeners(el, state);
        if (state.tooltip?.parentNode) state.tooltip.parentNode.removeChild(state.tooltip);
        state.tooltip = null;
        states.delete(el);
    }
};

export default Tooltip;
