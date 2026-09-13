import {
    ref,
    watch,
    onBeforeUnmount,
    getCurrentInstance,
    unref,
    type Ref,
    type ComputedRef
} from 'vue';

export type MaybeRef<T> = Ref<T> | ComputedRef<T> | T;
export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T);

export function resolveValue<V>(val: MaybeRefOrGetter<V> | undefined): V | undefined {
    return typeof val === 'function' ? (val as () => V)() : unref(val);
}

export interface OverlayPositionContext {
    targetRect: DOMRect;
    overlayRect: DOMRect;
    viewportWidth: number;
    viewportHeight: number;
}

export interface OverlayPositionResult {
    top: number;
    left: number;
    width?: string | number;
    placement?: 'top' | 'bottom';
    [key: string]: any;
}

export interface UseActiveOverlayPositionOptions<T extends OverlayPositionResult = OverlayPositionResult> {
    /** Elemento âncora/gatilho */
    target: MaybeRefOrGetter<HTMLElement | null | undefined>;
    /** Elemento do painel flutuante (overlay) */
    overlay: MaybeRefOrGetter<HTMLElement | null | undefined>;
    /** Controla se o posicionamento e os ouvintes estão ativos */
    active: MaybeRefOrGetter<boolean>;
    /** Distância em px entre gatilho e painel (padrão: 4) */
    offset?: number;
    /** Alinhamento horizontal ('left' | 'right', padrão: 'left') */
    align?: 'left' | 'right';
    /** Forçar largura mínima igual à largura do gatilho (padrão: false) */
    matchTargetWidth?: boolean;
    /** Função pura customizada para calcular a posição */
    compute?: (context: OverlayPositionContext) => T;
}

function defaultCompute(
    ctx: OverlayPositionContext,
    options: { offset: number; align: 'left' | 'right'; matchTargetWidth: boolean }
): OverlayPositionResult {
    const { targetRect: t, overlayRect: p, viewportWidth: vw, viewportHeight: vh } = ctx;
    const pHeight = p.height || 200;
    const pWidth = p.width || t.width || 200;

    const spaceBelow = vh - t.bottom;
    const spaceAbove = t.top;
    const openUp = spaceBelow < pHeight && spaceAbove > spaceBelow;
    const top = openUp ? t.top - pHeight - options.offset : t.bottom + options.offset;

    let left = options.align === 'right' ? t.right - pWidth : t.left;
    left = Math.max(8, Math.min(left, vw - pWidth - 8));

    return {
        top,
        left,
        width: options.matchTargetWidth ? `${t.width}px` : undefined,
        placement: openUp ? 'top' : 'bottom'
    };
}

/**
 * Gerencia o cálculo e posicionamento dinâmico de overlays flutuantes sob demanda.
 * Só anexa ouvintes de scroll e resize e só aciona medições geométricas quando ativo.
 * Coalesce eventos em requestAnimationFrame garantindo no máximo 1 cálculo por frame.
 */
export function useActiveOverlayPosition<T extends OverlayPositionResult = OverlayPositionResult>(
    options: UseActiveOverlayPositionOptions<T>
) {
    const position = ref<OverlayPositionResult>({ top: 0, left: 0 }) as Ref<T>;
    const isPositioned = ref(false);

    let rafId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let isListening = false;

    const measureAndPosition = () => {
        if (typeof window === 'undefined') return;

        const rawTarget = resolveValue(options.target);
        const targetEl = (rawTarget as any)?.$el ?? rawTarget;
        const rawOverlay = resolveValue(options.overlay);
        const overlayEl = (rawOverlay as any)?.$el ?? rawOverlay;

        if (!targetEl || typeof targetEl.getBoundingClientRect !== 'function') return;

        const targetRect = targetEl.getBoundingClientRect();
        const overlayRect = overlayEl && typeof overlayEl.getBoundingClientRect === 'function'
            ? overlayEl.getBoundingClientRect()
            : new DOMRect(0, 0, 0, 0);

        const ctx: OverlayPositionContext = {
            targetRect,
            overlayRect,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };

        if (options.compute) position.value = options.compute(ctx);
        else position.value = defaultCompute(ctx, {
            offset: options.offset ?? 4,
            align: options.align ?? 'left',
            matchTargetWidth: options.matchTargetWidth ?? false
        }) as T;


        isPositioned.value = true;
    };

    const scheduleUpdate = () => {
        if (!unref(options.active)) return;
        if (rafId !== null) return;

        if (typeof requestAnimationFrame !== 'undefined') rafId = requestAnimationFrame(() => {
            rafId = null;
            measureAndPosition();
        });
        else measureAndPosition();

    };

    const observeElements = () => {
        if (typeof ResizeObserver === 'undefined') return;

        if (!resizeObserver) resizeObserver = new ResizeObserver(() => scheduleUpdate());
        else resizeObserver.disconnect();

        const rawTarget = resolveValue(options.target);
        const targetEl = (rawTarget as any)?.$el ?? rawTarget;
        if (targetEl instanceof Element) resizeObserver.observe(targetEl);

        const rawOverlay = resolveValue(options.overlay);
        const overlayEl = (rawOverlay as any)?.$el ?? rawOverlay;
        if (overlayEl instanceof Element) resizeObserver.observe(overlayEl);
    };

    const startListening = () => {
        if (isListening || typeof window === 'undefined') return;
        isListening = true;

        window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
        window.addEventListener('resize', scheduleUpdate, { passive: true });

        observeElements();
        measureAndPosition();
    };

    const stopListening = () => {
        if (!isListening) return;
        isListening = false;

        if (rafId !== null) {
            if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId);
            rafId = null;
        }

        if (typeof window !== 'undefined') {
            window.removeEventListener('scroll', scheduleUpdate, { capture: true });
            window.removeEventListener('resize', scheduleUpdate);
        }

        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }

        isPositioned.value = false;
    };

    watch(
        () => resolveValue(options.active),
        (active) => {
            if (active) startListening();
            else stopListening();
        },
        { immediate: true, flush: 'sync' }
    );

    watch(
        [() => resolveValue(options.target), () => resolveValue(options.overlay)],
        () => {
            if (resolveValue(options.active)) {
                observeElements();
                measureAndPosition();
            }
        },
        { flush: 'sync' }
    );

    if (getCurrentInstance()) onBeforeUnmount(() => {
        stopListening();
    });


    return {
        position,
        isPositioned,
        updatePosition: measureAndPosition,
        scheduleUpdate
    };
}
