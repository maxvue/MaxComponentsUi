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
        useElementSize: () => ({ width: ref(0), height: ref(0) }),
        useWindowSize: () => ({ width: windowWidth, height: ref(800) })
    };
});

vi.mock('../../src/composables/useActiveElementBounding', () => ({
    useActiveElementBounding: () => ({
        x: ref(0),
        y: ref(100),
        top: ref(100),
        bottom: ref(136),
        left: ref(0),
        right: triggerWidth,
        width: triggerWidth,
        height: ref(36),
        update: () => {}
    })
}));

import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountSelect(customTriggerLeft = 0) {
    Object.defineProperty(window, 'innerWidth', { value: windowWidth.value, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    const wrapper = mount(MaxInputSelect, {
        props: { modelValue: null, options: [{ value: 'a', label: 'A' }] },
        global: { stubs: { Icon: true, MaxIcon: true } }
    });
    const trigger = (wrapper.vm as any).triggerEl as HTMLElement | null;
    if (!trigger) return wrapper;

    trigger.getBoundingClientRect = () => ({
        top: 100,
        left: customTriggerLeft,
        right: customTriggerLeft + triggerWidth.value,
        bottom: 136,
        width: triggerWidth.value,
        height: 36,
        x: customTriggerLeft,
        y: 100,
        toJSON: () => ({})
    } as DOMRect);

    (wrapper.vm as any).isOpen = true;
    (wrapper.vm as any).updatePosition?.();
    return wrapper;
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

    it('não ultrapassa o teto de 500px quando o campo é muito largo', () => {
        triggerWidth.value = 1100;
        const wrapper = mountSelect();
        expect((wrapper.vm as any).position.width).toBe('500px');
    });

    it('respeita um piso mínimo em campos minúsculos', () => {
        triggerWidth.value = 40;
        const wrapper = mountSelect();
        expect((wrapper.vm as any).position.width).toBe('160px');
    });

    it('encolhe para caber em viewport estreita respeitando calc(100vw - 50px)', () => {
        triggerWidth.value = 1100;
        windowWidth.value = 320;
        const wrapper = mountSelect();

        const { width, left } = (wrapper.vm as any).position;
        expect(width).toBe('270px'); // 320 - 50 de margem
        // O que importa é não vazar pela direita da viewport.
        expect(left + parseInt(width, 10)).toBeLessThanOrEqual(320);
    });

    it('reposiciona à esquerda quando o campo está perto da borda direita', () => {
        triggerWidth.value = 300;
        windowWidth.value = 400;
        const wrapper = mountSelect(350);

        // Campo em x=350 com 300px não cabe; força o cenário de reposicionamento
        const { width, left } = (wrapper.vm as any).position;
        expect(left + parseInt(width, 10)).toBeLessThanOrEqual(400);
    });

    it('acompanha a largura do conteúdo interno quando maior que o campo', async () => {
        triggerWidth.value = 180;
        const wrapper = mountSelect();
        await wrapper.vm.$nextTick();
        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();
        const label = overlay.querySelector('.labelz') as HTMLElement;
        expect(label).not.toBeNull();
        Object.defineProperties(label, {
            clientWidth: { configurable: true, value: 100 },
            scrollWidth: { configurable: true, value: 250 }
        });
        Object.defineProperty(overlay, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 180,
                height: 200,
                top: 48,
                left: 0,
                right: 180,
                bottom: 248,
                x: 0,
                y: 48,
                toJSON: () => ({})
            })
        });
        (wrapper.vm as any).updatePosition();
        await wrapper.vm.$nextTick();
        expect(parseInt((wrapper.vm as any).position.width, 10)).toBeGreaterThanOrEqual(250);
    });
});
