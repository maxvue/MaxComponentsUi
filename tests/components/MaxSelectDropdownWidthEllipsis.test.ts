import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

describe('Dropdown de Selects — Largura Dinâmica e Reticências', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        document.body.innerHTML = '';
        Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('MaxTagSelect: ajusta estilo da label com display block, white-space nowrap e text-overflow ellipsis', async () => {
        const wrapper = mount(MaxTagSelect, {
            props: {
                modelValue: null,
                options: [
                    { value: 'mt', name: 'Energisa Mato Grosso' },
                    { value: 'sc', name: 'Celesc Santa Catarina Distribuição de Energia Elétrica S.A.' }
                ]
            },
            global: { stubs: { MaxIcon: true } }
        });

        const trigger = wrapper.find('.max-select');
        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();

        const labelDivs = overlay.querySelectorAll<HTMLElement>('.label-tag-div');
        expect(labelDivs.length).toBe(2);

        // Verifica que todas as opções possuem box-sizing: border-box (evitando vazar 16px de padding)
        labelDivs.forEach((el) => {
            expect(el.style.boxSizing).toBe('border-box');
        });

        // Verifica que o label de texto possui display: block com elipse sem quebra de linha
        const labels = overlay.querySelectorAll<HTMLElement>('.max-tag-select-option-label');
        labels.forEach((label) => {
            expect(label.style.display).toBe('block');
            expect(label.style.overflow).toBe('hidden');
            expect(label.style.textOverflow).toBe('ellipsis');
            expect(label.style.whiteSpace).toBe('nowrap');
        });

        wrapper.unmount();
    });

    it('MaxTagSelect: expande além do gatilho estreito para acomodar o conteúdo interno até 500px', async () => {
        const wrapper = mount(MaxTagSelect, {
            props: {
                modelValue: null,
                options: [
                    { value: 'mt', name: 'Energisa Mato Grosso com texto extraordinariamente longo que precisa de espaço' }
                ]
            },
            global: { stubs: { MaxIcon: true } }
        });

        const trigger = wrapper.find('.max-select');
        Object.defineProperty(trigger.element, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 120, // Gatilho pequeno (como na foto do usuário)
                height: 36,
                top: 20,
                left: 20,
                right: 140,
                bottom: 56,
                x: 20,
                y: 20,
                toJSON: () => ({})
            })
        });

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();

        const label = overlay.querySelector('.max-tag-select-option-label') as HTMLElement;
        expect(label).not.toBeNull();

        Object.defineProperties(label, {
            clientWidth: { configurable: true, value: 100 },
            scrollWidth: { configurable: true, value: 340 }
        });

        Object.defineProperty(overlay, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 120,
                height: 200,
                top: 58,
                left: 20,
                right: 140,
                bottom: 258,
                x: 20,
                y: 58,
                toJSON: () => ({})
            })
        });

        (wrapper.vm as any).updatePosition();
        await wrapper.vm.$nextTick();

        // O overlay expandiu bem além dos 120px do gatilho para acomodar o texto
        const width = parseInt(overlay.style.width, 10);
        expect(width).toBeGreaterThanOrEqual(340);
        expect(width).toBeLessThanOrEqual(500);

        wrapper.unmount();
    });

    it('MaxTagSelect: em viewport móvel estreita, o teto respeita calc(100vw - 50px)', async () => {
        Object.defineProperty(window, 'innerWidth', { value: 360, configurable: true });

        const wrapper = mount(MaxTagSelect, {
            props: {
                modelValue: null,
                options: [
                    { value: 'mt', name: 'Energisa Mato Grosso com texto longo' }
                ]
            },
            global: { stubs: { MaxIcon: true } }
        });

        const trigger = wrapper.find('.max-select');
        Object.defineProperty(trigger.element, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 100,
                height: 36,
                top: 20,
                left: 10,
                right: 110,
                bottom: 56,
                x: 10,
                y: 20,
                toJSON: () => ({})
            })
        });

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        const label = overlay.querySelector('.max-tag-select-option-label') as HTMLElement;

        Object.defineProperties(label, {
            clientWidth: { configurable: true, value: 80 },
            scrollWidth: { configurable: true, value: 450 }
        });

        Object.defineProperty(overlay, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 100,
                height: 200,
                top: 58,
                left: 10,
                right: 110,
                bottom: 258,
                x: 10,
                y: 58,
                toJSON: () => ({})
            })
        });

        (wrapper.vm as any).updatePosition();
        await wrapper.vm.$nextTick();

        // calc(100vw - 50px) em viewport 360 = 310px
        const width = parseInt(overlay.style.width, 10);
        expect(width).toBe(310);

        wrapper.unmount();
    });

    it('MaxInputSelect: acomoda opções de texto longo e aplica teto máximo de 500px', async () => {
        const wrapper = mount(MaxInputSelect, {
            props: {
                modelValue: null,
                options: [
                    { value: 'long', label: 'Opção com texto extremamente longo para testar a largura do dropdown' }
                ]
            },
            global: { stubs: { MaxIcon: true } }
        });

        const trigger = (wrapper.vm as any).triggerEl as HTMLElement;
        Object.defineProperty(trigger, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 150,
                height: 36,
                top: 20,
                left: 20,
                right: 170,
                bottom: 56,
                x: 20,
                y: 20,
                toJSON: () => ({})
            })
        });

        (wrapper.vm as any).isOpen = true;
        await wrapper.vm.$nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();

        const label = overlay.querySelector('.labelz') as HTMLElement;
        expect(label).not.toBeNull();

        Object.defineProperties(label, {
            clientWidth: { configurable: true, value: 100 },
            scrollWidth: { configurable: true, value: 600 }
        });

        Object.defineProperty(overlay, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 150,
                height: 200,
                top: 58,
                left: 20,
                right: 170,
                bottom: 258,
                x: 20,
                y: 58,
                toJSON: () => ({})
            })
        });

        (wrapper.vm as any).updatePosition();
        await wrapper.vm.$nextTick();

        // Limitado a 500px no desktop
        expect((wrapper.vm as any).position.width).toBe('500px');

        wrapper.unmount();
    });
});
