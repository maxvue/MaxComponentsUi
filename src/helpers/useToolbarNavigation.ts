import { onBeforeUnmount, onMounted, type Ref } from 'vue';

export interface UseToolbarNavigationOptions {
    /**
     * Seletor CSS para localizar os botões navegáveis na toolbar.
     * Padrão: 'button'
     */
    buttonSelector?: string;
}

export function useToolbarNavigation(
    toolbarRef: Ref<HTMLElement | null>,
    options: UseToolbarNavigationOptions = {}
) {
    const buttonSelector = options.buttonSelector ?? 'button';

    const getAllButtons = (): HTMLButtonElement[] => {
        if (!toolbarRef.value) return [];
        return Array.from(
            toolbarRef.value.querySelectorAll<HTMLButtonElement>(buttonSelector)
        ).filter((btn) => !btn.closest('.md-popover'));
    };

    const getEnabledButtons = (): HTMLButtonElement[] => {
        return getAllButtons().filter((btn) => !btn.disabled && !btn.hasAttribute('disabled'));
    };

    const updateTabindices = (activeBtn?: HTMLElement | null) => {
        const enabledButtons = getEnabledButtons();
        const allButtons = getAllButtons();

        if (allButtons.length === 0) return;

        if (enabledButtons.length === 0) {
            allButtons.forEach((btn) => btn.setAttribute('tabindex', '-1'));
            return;
        }

        let target: HTMLButtonElement | undefined;

        if (activeBtn && enabledButtons.includes(activeBtn as HTMLButtonElement)) target = activeBtn as HTMLButtonElement;
        else if (typeof document !== 'undefined' && document.activeElement && enabledButtons.includes(document.activeElement as HTMLButtonElement)) target = document.activeElement as HTMLButtonElement;
        else {
            const currentZero = enabledButtons.find((btn) => btn.getAttribute('tabindex') === '0');
            target = currentZero ?? enabledButtons[0];
        }

        allButtons.forEach((btn) => {
            btn.setAttribute('tabindex', btn === target ? '0' : '-1');
        });
    };

    const onToolbarKeydown = (event: KeyboardEvent) => {
        const enabledButtons = getEnabledButtons();
        if (enabledButtons.length === 0) return;

        const targetEl = event.target as HTMLElement | null;
        if (targetEl && (targetEl.tagName === 'SELECT' || targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.closest('.md-popover'))) return;

        const activeEl = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLButtonElement | null;
        let currentTarget: HTMLButtonElement | undefined;

        if (activeEl && enabledButtons.includes(activeEl)) currentTarget = activeEl;
        else if (targetEl && enabledButtons.includes(targetEl as HTMLButtonElement)) currentTarget = targetEl as HTMLButtonElement;
        else currentTarget = enabledButtons.find((btn) => btn.getAttribute('tabindex') === '0') ?? enabledButtons[0];

        if (!currentTarget) return;

        const currentIndex = enabledButtons.indexOf(currentTarget);
        let targetIndex = -1;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                targetIndex = (currentIndex + 1) % enabledButtons.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                targetIndex = (currentIndex - 1 + enabledButtons.length) % enabledButtons.length;
                break;
            case 'Home':
                event.preventDefault();
                targetIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                targetIndex = enabledButtons.length - 1;
                break;
            default:
                return;
        }

        if (targetIndex >= 0 && enabledButtons[targetIndex]) {
            const nextBtn = enabledButtons[targetIndex];
            updateTabindices(nextBtn);
            nextBtn.focus();
        }
    };

    const onFocusIn = (event: FocusEvent) => {
        const target = event.target as HTMLButtonElement | null;
        if (!target) return;
        const enabledButtons = getEnabledButtons();
        if (enabledButtons.includes(target)) updateTabindices(target);
    };

    onMounted(() => {
        updateTabindices();
        if (toolbarRef.value) toolbarRef.value.addEventListener('focusin', onFocusIn);
    });

    onBeforeUnmount(() => {
        if (toolbarRef.value) toolbarRef.value.removeEventListener('focusin', onFocusIn);
    });

    return {
        getAllButtons,
        getEnabledButtons,
        updateTabindices,
        onToolbarKeydown
    };
}
