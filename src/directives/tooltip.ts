import type { Directive, DirectiveBinding } from 'vue';
import { sanitizeHtml } from '../helpers/sanitizeHtml';

interface TooltipOptions {
    value?: string;
    disabled?: boolean;
    escape?: boolean;
    showDelay?: number;
    hideDelay?: number;
    autoHide?: boolean;
    fitContent?: boolean;
    class?: string;
}

type Position = 'top' | 'right' | 'bottom' | 'left';

interface TooltipState {
    tooltipEl: HTMLElement | null;
    showTimer: ReturnType<typeof setTimeout> | null;
    hideTimer: ReturnType<typeof setTimeout> | null;
    options: TooltipOptions;
    position: Position;
    listeners: Array<[string, EventListener]>;
    scrollListeners: Array<[string, EventListener]>;
    tooltipId: string;
}

const states = new WeakMap<HTMLElement, TooltipState>();

let idCounter = 0;
const nextId = () => `max-tooltip-${++idCounter}`;

const parseOptions = (binding: DirectiveBinding<string | TooltipOptions>): TooltipOptions =>
    typeof binding.value === 'string' ? { value: binding.value } : (binding.value ?? {});

const parsePosition = (binding: DirectiveBinding<string | TooltipOptions>): Position => {
    if (binding.modifiers.top) return 'top';
    if (binding.modifiers.right) return 'right';
    if (binding.modifiers.bottom) return 'bottom';
    if (binding.modifiers.left) return 'left';
    return 'right';
};

const position = (el: HTMLElement, tooltipEl: HTMLElement, pos: Position) => {
    const t = el.getBoundingClientRect();
    const p = tooltipEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const gap = 8;

    let top = 0;
    let left = 0;
    let finalPos = pos;

    const place = (candidate: Position) => {
        switch (candidate) {
            case 'top':
                top = t.top - p.height - gap;
                left = t.left + (t.width / 2) - (p.width / 2);
                break;
            case 'bottom':
                top = t.bottom + gap;
                left = t.left + (t.width / 2) - (p.width / 2);
                break;
            case 'left':
                top = t.top + (t.height / 2) - (p.height / 2);
                left = t.left - p.width - gap;
                break;
            case 'right':
            default:
                top = t.top + (t.height / 2) - (p.height / 2);
                left = t.right + gap;
                break;
        }
    };

    place(finalPos);

    if (finalPos === 'top' && top < 0) { finalPos = 'bottom'; place(finalPos); }
    else if (finalPos === 'bottom' && top + p.height > vh) { finalPos = 'top'; place(finalPos); }
    else if (finalPos === 'right' && left + p.width > vw) { finalPos = 'left'; place(finalPos); }
    else if (finalPos === 'left' && left < 0) { finalPos = 'right'; place(finalPos); }

    left = Math.max(gap, Math.min(left, vw - p.width - gap));
    top = Math.max(gap, Math.min(top, vh - p.height - gap));

    tooltipEl.style.top = `${top + window.scrollY}px`;
    tooltipEl.style.left = `${left + window.scrollX}px`;
    tooltipEl.classList.remove('max-tooltip-top', 'max-tooltip-right', 'max-tooltip-bottom', 'max-tooltip-left');
    tooltipEl.classList.add(`max-tooltip-${finalPos}`);
};

const renderText = (tooltipEl: HTMLElement, options: TooltipOptions) => {
    const textEl = tooltipEl.querySelector('.max-tooltip-text') as HTMLElement | null;
    if (!textEl) return;
    const value = options.value ?? '';
    if (options.escape === false) textEl.innerHTML = sanitizeHtml(value);
    else textEl.textContent = value;
};

const createTooltip = (el: HTMLElement, state: TooltipState) => {
    if (!el.isConnected) return;
    if (state.tooltipEl) return;
    if (state.options.disabled) return;
    if (!state.options.value) return;

    const tooltipEl = document.createElement('div');
    tooltipEl.id = state.tooltipId;
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.className = ['max-tooltip', state.options.class].filter(Boolean).join(' ');
    tooltipEl.style.position = 'absolute';
    if (state.options.fitContent === false) tooltipEl.style.width = `${el.getBoundingClientRect().width}px`;

    const arrowEl = document.createElement('div');
    arrowEl.className = 'max-tooltip-arrow';
    tooltipEl.appendChild(arrowEl);

    const textEl = document.createElement('div');
    textEl.className = 'max-tooltip-text';
    tooltipEl.appendChild(textEl);

    document.body.appendChild(tooltipEl);
    state.tooltipEl = tooltipEl;
    el.setAttribute('aria-describedby', state.tooltipId);

    renderText(tooltipEl, state.options);
    position(el, tooltipEl, state.position);

    const onScrollResize = () => {
        if (state.tooltipEl && el.isConnected) position(el, state.tooltipEl, state.position);

    };
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    state.scrollListeners = [
        ['scroll', onScrollResize],
        ['resize', onScrollResize]
    ];
};

const destroyTooltip = (el: HTMLElement, state: TooltipState) => {
    if (state.scrollListeners && state.scrollListeners.length > 0) {
        for (const [type, listener] of state.scrollListeners) window.removeEventListener(type, listener, type === 'scroll');

        state.scrollListeners = [];
    }
    if (!state.tooltipEl) return;
    state.tooltipEl.remove();
    state.tooltipEl = null;
    el.removeAttribute('aria-describedby');
};

const clearTimers = (state: TooltipState) => {
    if (state.showTimer !== null) { clearTimeout(state.showTimer); state.showTimer = null; }
    if (state.hideTimer !== null) { clearTimeout(state.hideTimer); state.hideTimer = null; }
};

const show = (el: HTMLElement, state: TooltipState) => {
    clearTimers(state);
    const delay = state.options.showDelay ?? 0;
    state.showTimer = setTimeout(() => {
        state.showTimer = null;
        if (!el.isConnected) return;
        createTooltip(el, state);
    }, delay);
};

const hide = (el: HTMLElement, state: TooltipState) => {
    clearTimers(state);
    const delay = state.options.hideDelay ?? 0;
    state.hideTimer = setTimeout(() => {
        state.hideTimer = null;
        destroyTooltip(el, state);
    }, delay);
};

const attachListeners = (el: HTMLElement, state: TooltipState, binding: DirectiveBinding<string | TooltipOptions>) => {
    const listeners: Array<[string, EventListener]> = [];

    const onEnter = () => show(el, state);
    const onLeave = () => { if (state.options.autoHide !== false) hide(el, state); };
    const onFocus = () => show(el, state);
    const onBlur = () => hide(el, state);

    if (binding.modifiers.focus) listeners.push(['focus', onFocus], ['blur', onBlur]);
    else listeners.push(['mouseenter', onEnter], ['mouseleave', onLeave], ['focus', onFocus], ['blur', onBlur]);


    for (const [type, listener] of listeners) el.addEventListener(type, listener);
    state.listeners = listeners;
};

const detachListeners = (el: HTMLElement, state: TooltipState) => {
    for (const [type, listener] of state.listeners) el.removeEventListener(type, listener);
    state.listeners = [];
};

export const Tooltip: Directive<HTMLElement, string | TooltipOptions> = {
    mounted(el, binding) {
        const state: TooltipState = {
            tooltipEl: null,
            showTimer: null,
            hideTimer: null,
            options: parseOptions(binding),
            position: parsePosition(binding),
            listeners: [],
            scrollListeners: [],
            tooltipId: nextId()
        };
        states.set(el, state);
        attachListeners(el, state, binding);
    },
    updated(el, binding) {
        const state = states.get(el);
        if (!state) return;
        state.options = parseOptions(binding);
        state.position = parsePosition(binding);

        if (state.options.disabled || !state.options.value) {
            clearTimers(state);
            destroyTooltip(el, state);
            return;
        }

        if (!state.tooltipEl) return;

        renderText(state.tooltipEl, state.options);
        position(el, state.tooltipEl, state.position);
    },
    unmounted(el) {
        const state = states.get(el);
        if (!state) return;
        clearTimers(state);
        detachListeners(el, state);
        destroyTooltip(el, state);
        states.delete(el);
    }
};

export default Tooltip;
