import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useHtmlDark, _resetHtmlDarkObserverForTesting } from '../../src/helpers/useHtmlDark';
import { nextTick } from 'vue';

describe('useHtmlDark singleton', () => {
    beforeEach(() => {
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    afterEach(() => {
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    it('retorna ref falsa quando a classe dark não está presente', () => {
        const isDark = useHtmlDark();
        expect(isDark.value).toBe(false);
    });

    it('retorna a mesma instância de Ref para múltiplas chamadas', () => {
        const ref1 = useHtmlDark();
        const ref2 = useHtmlDark();
        expect(ref1).toBe(ref2);
    });

    it('atualiza a ref quando a classe dark é adicionada ao elemento html', async () => {
        const isDark = useHtmlDark();
        expect(isDark.value).toBe(false);

        document.documentElement.classList.add('dark');
        await new Promise((resolve) => setTimeout(resolve, 50));
        await nextTick();

        expect(isDark.value).toBe(true);
    });

    it('atualiza a ref quando a classe dark é removida do elemento html', async () => {
        document.documentElement.classList.add('dark');
        const isDark = useHtmlDark();
        expect(isDark.value).toBe(true);

        document.documentElement.classList.remove('dark');
        await new Promise((resolve) => setTimeout(resolve, 50));
        await nextTick();

        expect(isDark.value).toBe(false);
    });
});
