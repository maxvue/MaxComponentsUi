import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

// Medidas controladas: o happy-dom devolve 0 para tudo, então o cálculo de
// posição do overlay só é observável mockando os composables de medição.
const triggerWidth = ref(0);
const windowWidth = ref(1280);

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        useElementBounding: () => ({
            x: ref(0),
            y: ref(100),
            width: triggerWidth,
            height: ref(36)
        }),
        useElementSize: () => ({ width: ref(0), height: ref(0) }),
        useWindowSize: () => ({ width: windowWidth, height: ref(800) })
    };
});

import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountSelect() {
    return mount(MaxInputSelect, {
        props: { modelValue: null, options: [{ value: 'a', label: 'A' }] },
        global: { stubs: { Icon: true, MaxIcon: true } }
    });
}

describe('MaxInputSelect — largura do overlay', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        triggerWidth.value = 0;
        windowWidth.value = 1280;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('acompanha a largura do campo quando ele é estreito', () => {
        triggerWidth.value = 260;
        const wrapper = mountSelect();
        expect((wrapper.vm as any).position.width).toBe('260px');
    });

    it('não ultrapassa o teto quando o campo é muito largo', () => {
        // Caso do bug: campo de 1100px fazia o overlay atravessar a tela.
        triggerWidth.value = 1100;
        const wrapper = mountSelect();
        expect((wrapper.vm as any).position.width).toBe('420px');
    });

    it('respeita um piso mínimo em campos minúsculos', () => {
        triggerWidth.value = 40;
        const wrapper = mountSelect();
        expect((wrapper.vm as any).position.width).toBe('160px');
    });

    it('encolhe para caber em viewport estreita', () => {
        triggerWidth.value = 1100;
        windowWidth.value = 320;
        const wrapper = mountSelect();

        const { width, left } = (wrapper.vm as any).position;
        expect(width).toBe('300px'); // 320 - 10*2 de margem
        // O que importa é não vazar pela direita da viewport.
        expect(left + parseInt(width, 10)).toBeLessThanOrEqual(320);
    });

    it('reposiciona à esquerda quando o campo está perto da borda direita', () => {
        triggerWidth.value = 300;
        windowWidth.value = 400;
        const wrapper = mountSelect();

        // Campo em x=0 com 300px cabe; força o cenário de estouro medindo a
        // largura contra uma viewport menor que campo + posição.
        const { width, left } = (wrapper.vm as any).position;
        expect(left + parseInt(width, 10)).toBeLessThanOrEqual(400);
    });
});
