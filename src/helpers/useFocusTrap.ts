import { nextTick, type Ref, unref, onBeforeUnmount, getCurrentInstance } from 'vue';

export interface FocusTrapOptions {
    onEscape?: () => void;
    escapeDeactivates?: boolean;
}

export interface FocusTrap {
    activate: () => void;
    deactivate: () => void;
    onKeydown: (event: KeyboardEvent) => void;
}

interface TrapEntry {
    id: number;
    el: Ref<HTMLElement | null>;
    previous: HTMLElement | null;
    options?: FocusTrapOptions;
    onKeydown: (event: KeyboardEvent) => void;
}

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

let nextId = 1;
const trapStack: TrapEntry[] = [];
let isGlobalAttached = false;

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const isVisible = (element: HTMLElement, container: HTMLElement | null): boolean => {
    if (typeof HTMLElement !== 'undefined' && !(element instanceof HTMLElement)) return false;
    let curr: HTMLElement | null = element;
    while (curr && curr !== container) {
        if (curr.hidden) return false;
        if (curr.style?.display === 'none') return false;
        if (curr.style?.visibility === 'hidden') return false;
        if (curr.getAttribute?.('aria-hidden') === 'true') return false;
        curr = curr.parentElement;
    }
    return true;
};

const getFocusable = (container: HTMLElement | null): HTMLElement[] => {
    if (!isBrowser() || !container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => isVisible(el, container));
};

const onGlobalKeydown = (event: KeyboardEvent) => {
    if (!isBrowser() || trapStack.length === 0) return;

    const topTrap = trapStack[trapStack.length - 1];
    topTrap.onKeydown(event);
};

const attachGlobal = () => {
    if (isGlobalAttached || !isBrowser()) return;
    document.addEventListener('keydown', onGlobalKeydown, true);
    isGlobalAttached = true;
};

const detachGlobal = () => {
    if (!isGlobalAttached || !isBrowser()) return;
    document.removeEventListener('keydown', onGlobalKeydown, true);
    isGlobalAttached = false;
};

export const useFocusTrap = (el: Ref<HTMLElement | null>, options?: FocusTrapOptions): FocusTrap => {
    const id = nextId++;
    let isActive = false;

    const onKeydown = (event: KeyboardEvent) => {
        if (!isBrowser() || !el.value) return;

        if (event.key === 'Escape') {
            if (options?.onEscape) {
                event.preventDefault();
                event.stopPropagation();
                options.onEscape();
            }
            return;
        }

        if (event.key === 'Tab') {
            const container = el.value;
            const items = getFocusable(container);

            if (!items.length) {
                event.preventDefault();
                if (container) {
                    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
                    container.focus();
                }
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];
            const target = event.target as HTMLElement | null;

            // Ensure focus is within the trap
            if (!target || !items.includes(target)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
                return;
            }

            if (event.shiftKey && target === first) {
                event.preventDefault();
                last.focus();
                return;
            }

            if (!event.shiftKey && target === last) {
                event.preventDefault();
                first.focus();
            }
        }
    };

    const activate = () => {
        if (!isBrowser() || isActive) return;
        isActive = true;
        const previous = (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement)
            ? document.activeElement
            : null;

        trapStack.push({ id, el, previous, options, onKeydown });
        attachGlobal();

        nextTick(() => {
            if (!isBrowser() || !isActive) return;
            const items = getFocusable(el.value);
            if (items.length > 0) items[0]?.focus();
            else if (el.value) {
                if (!el.value.hasAttribute('tabindex')) el.value.setAttribute('tabindex', '-1');
                el.value.focus();
            }
        });
    };

    const deactivate = () => {
        if (!isBrowser() || !isActive) return;
        isActive = false;

        const idx = trapStack.findIndex((t) => t.id === id);
        if (idx >= 0) {
            const entry = trapStack[idx];
            trapStack.splice(idx, 1);
            if (entry.previous?.isConnected) entry.previous.focus();

        }

        if (trapStack.length === 0) detachGlobal();

    };

    if (getCurrentInstance()) onBeforeUnmount(() => {
        deactivate();
    });


    return { activate, deactivate, onKeydown };
};
