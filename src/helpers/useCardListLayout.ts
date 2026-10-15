import { ref, onUnmounted, type Ref } from 'vue';

export interface UseCardListLayoutOptions {
    fallbackSubcardWidth?: Ref<number> | number;
}

export interface UseCardListLayoutReturn {
    preferredWidths: Ref<Map<string | number, number>>;
    isGroupMap: Ref<Map<string | number, boolean>>;
    registerCellElement: (key: string | number, el: HTMLElement | null) => void;
    unregisterCellElement: (key: string | number) => void;
    measureAll: () => void;
    cleanRemovedKeys: (currentKeys: Set<string | number>) => void;
}

/**
 * Composable para medição progressiva e layout contextual dos grupos de subcards
 * no MaxCardList.
 */
export function useCardListLayout(options: UseCardListLayoutOptions = {}): UseCardListLayoutReturn {
    const preferredWidths = ref<Map<string | number, number>>(new Map());
    const isGroupMap = ref<Map<string | number, boolean>>(new Map());

    const elementMap = new Map<string | number, HTMLElement>();
    const resizeObserverMap = new Map<string | number, ResizeObserver>();

    let rafId: number | null = null;
    let isDisposed = false;

    function getFallbackWidth(): number {
        if (typeof options.fallbackSubcardWidth === 'number') return options.fallbackSubcardWidth;

        if (options.fallbackSubcardWidth && 'value' in options.fallbackSubcardWidth) return options.fallbackSubcardWidth.value;

        return 320;
    }

    function scheduleMeasurement() {
        if (isDisposed) return;
        if (rafId !== null) return;

        rafId = requestAnimationFrame(() => {
            rafId = null;
            if (isDisposed) return;
            executeMeasurement();
        });
    }

    function executeMeasurement() {
        let hasChanges = false;
        const newPreferred = new Map(preferredWidths.value);
        const newIsGroup = new Map(isGroupMap.value);

        for (const [key, el] of elementMap.entries()) {
            if (!el || !el.isConnected) continue;

            const cardEl = el.classList.contains('max-card')
                ? el
                : el.querySelector<HTMLElement>('.max-card');

            if (!cardEl) {
                if (newIsGroup.get(key) !== false) {
                    newIsGroup.set(key, false);
                    hasChanges = true;
                }
                continue;
            }

            const contentEl = cardEl.querySelector<HTMLElement>('.max-card-content');
            const hasSubcard = Boolean(contentEl?.querySelector('.max-subcard'));

            if (!hasSubcard || !contentEl) {
                if (newIsGroup.get(key) !== false) {
                    newIsGroup.set(key, false);
                    hasChanges = true;
                }
                continue;
            }

            // Descobre subcards imediatos pertencentes diretamente a este card
            const directSubcards = Array.from(contentEl.querySelectorAll<HTMLElement>('.max-subcard'))
                .filter((sub) => sub.closest('.max-card') === cardEl);

            const count = directSubcards.length;
            if (count === 0) {
                if (newIsGroup.get(key) !== false) {
                    newIsGroup.set(key, false);
                    hasChanges = true;
                }
                continue;
            }

            if (newIsGroup.get(key) !== true) {
                newIsGroup.set(key, true);
                hasChanges = true;
            }

            // Determina a largura preferencial de cada subcard
            const cardComputed = typeof window !== 'undefined' ? window.getComputedStyle(cardEl) : null;
            const contentComputed = typeof window !== 'undefined' ? window.getComputedStyle(contentEl) : null;

            const customVar = cardEl.style.getPropertyValue('--max-card-list-subcard-width')?.trim()
                || cardEl.style.getPropertyValue('--max-card-subcard-width')?.trim()
                || cardComputed?.getPropertyValue('--max-card-list-subcard-width')?.trim()
                || cardComputed?.getPropertyValue('--max-card-subcard-width')?.trim()
                || contentEl.style.getPropertyValue('--max-card-list-subcard-width')?.trim()
                || contentComputed?.getPropertyValue('--max-card-list-subcard-width')?.trim();
            const parsedCustom = customVar ? parseFloat(customVar) : NaN;

            let explicitWidth = 0;
            for (const sub of directSubcards) {
                const styleWidth = sub.style.width;
                if (styleWidth && styleWidth.endsWith('px')) {
                    const parsed = parseFloat(styleWidth);
                    if (parsed > explicitWidth) explicitWidth = parsed;
                }
            }

            let singleSubcardWidth = getFallbackWidth();
            if (!Number.isNaN(parsedCustom) && parsedCustom > 0) singleSubcardWidth = parsedCustom;
            else if (explicitWidth > 0) singleSubcardWidth = explicitWidth;


            // Espaçamento e padding internos
            const internalGap = contentComputed
                ? (parseFloat(contentComputed.gap) || parseFloat(contentComputed.columnGap) || 12)
                : 12;

            const padLeft = cardComputed ? (parseFloat(cardComputed.paddingLeft) || 0) : 0;
            const padRight = cardComputed ? (parseFloat(cardComputed.paddingRight) || 0) : 0;
            const borderLeft = cardComputed ? (parseFloat(cardComputed.borderLeftWidth) || 0) : 0;
            const borderRight = cardComputed ? (parseFloat(cardComputed.borderRightWidth) || 0) : 0;
            const contentPadLeft = contentComputed ? (parseFloat(contentComputed.paddingLeft) || 0) : 0;
            const contentPadRight = contentComputed ? (parseFloat(contentComputed.paddingRight) || 0) : 0;

            const totalPaddingBorder = padLeft + padRight + borderLeft + borderRight + contentPadLeft + contentPadRight;
            const effectivePaddingBorder = totalPaddingBorder > 0 ? totalPaddingBorder : 34; // 32px padding + 2px border

            const desiredTotal = Math.round(count * singleSubcardWidth + (count - 1) * internalGap + effectivePaddingBorder);

            const oldVal = newPreferred.get(key);
            if (oldVal === undefined || Math.abs(oldVal - desiredTotal) >= 1) {
                newPreferred.set(key, desiredTotal);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            preferredWidths.value = newPreferred;
            isGroupMap.value = newIsGroup;
        }
    }

    function registerCellElement(key: string | number, el: HTMLElement | null) {
        if (!el) {
            unregisterCellElement(key);
            return;
        }

        const oldEl = elementMap.get(key);
        if (oldEl === el) return;

        unregisterCellElement(key);
        elementMap.set(key, el);

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => {
                scheduleMeasurement();
            });
            observer.observe(el);
            resizeObserverMap.set(key, observer);
        }

        scheduleMeasurement();
    }

    function unregisterCellElement(key: string | number) {
        const observer = resizeObserverMap.get(key);
        if (observer) {
            observer.disconnect();
            resizeObserverMap.delete(key);
        }
        elementMap.delete(key);
    }

    function cleanRemovedKeys(currentKeys: Set<string | number>) {
        let changed = false;
        const newPreferred = new Map(preferredWidths.value);
        const newIsGroup = new Map(isGroupMap.value);

        for (const key of newPreferred.keys()) if (!currentKeys.has(key)) {
            newPreferred.delete(key);
            newIsGroup.delete(key);
            unregisterCellElement(key);
            changed = true;
        }


        if (changed) {
            preferredWidths.value = newPreferred;
            isGroupMap.value = newIsGroup;
        }
    }

    onUnmounted(() => {
        isDisposed = true;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        for (const observer of resizeObserverMap.values()) observer.disconnect();

        resizeObserverMap.clear();
        elementMap.clear();
    });

    return {
        preferredWidths,
        isGroupMap,
        registerCellElement,
        unregisterCellElement,
        measureAll: executeMeasurement,
        cleanRemovedKeys
    };
}
