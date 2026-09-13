import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxPopover from '../../src/components/MaxPopover.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxButtonConfirm from '../../src/components/MaxButtonConfirm.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';

describe('Performance: Overlay Positioning (E04-01)', () => {
    let pinia: ReturnType<typeof createPinia>;
    let wrappers: any[] = [];

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        wrappers = [];
    });

    afterEach(() => {
        wrappers.forEach((w) => {
            try {
                w.unmount();
            } catch {}
        });
        wrappers = [];
        vi.restoreAllMocks();
    });

    it('1, 10 e 30 instâncias fechadas de overlays produzem zero getBoundingClientRect em scroll/resize', () => {
        const counts = [1, 10, 30];

        for (const count of counts) {
            const currentWrappers: any[] = [];
            for (let i = 0; i < count; i++) currentWrappers.push(
                mount(MaxInputSelect, {
                    props: {
                        modelValue: null,
                        options: [{ label: 'Item 1', value: 1 }]
                    }

                })
            );


            const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect');

            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));

            expect(spy).not.toHaveBeenCalled();

            currentWrappers.forEach((w) => w.unmount());
            spy.mockRestore();
        }
    });

    it('instâncias fechadas de MaxPopover e MaxInputDatePicker não chamam getBoundingClientRect em scroll', () => {
        for (let i = 0; i < 5; i++) {
            wrappers.push(
                mount(MaxPopover, {
                    props: {
                        icon: 'mdi:dots-vertical'
                    }
                })
            );
            wrappers.push(
                mount(MaxInputDatePicker, {
                    props: {
                        modelValue: null
                    }
                })
            );
        }

        const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect');

        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));

        expect(spy).not.toHaveBeenCalled();
    });

    it('um overlay aberto mede sob demanda e coalesce scroll em no máximo uma medição por frame', async () => {
        const wrapper = mount(MaxInputSelect, {
            props: {
                modelValue: null,
                options: [{ label: 'Opção 1', value: 1 }]
            }
        });
        wrappers.push(wrapper);

        const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 200,
            height: 40,
            top: 100,
            left: 50,
            bottom: 140,
            right: 250,
            x: 50,
            y: 100,
            toJSON: () => {}
        });

        // Abrir overlay clicando no seletor
        await wrapper.find('.max-select').trigger('click');

        const callsOnOpen = spy.mock.calls.length;
        expect(callsOnOpen).toBeGreaterThan(0);

        spy.mockClear();

        // Disparar múltiplos scrolls no mesmo frame
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));

        // Antes do RAF, nenhum evento adicional deve ter recalculado sincronamente de forma redundante
        expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('confirmações medem getBoundingClientRect exatamente uma vez por acionamento', async () => {
        const confirmStore = useConfirmStore(pinia);
        const wrapper = mount(MaxButtonConfirm, {
            props: {
                label: 'Excluir',
                message: 'Confirmar exclusão?'
            },
            global: {
                plugins: [pinia]
            }
        });
        wrappers.push(wrapper);

        const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 80,
            height: 36,
            top: 200,
            left: 100,
            bottom: 236,
            right: 180,
            x: 100,
            y: 200,
            toJSON: () => {}
        });

        await wrapper.find('button').trigger('click');

        expect(spy).toHaveBeenCalledTimes(1);
        expect(confirmStore.show).toBe(true);
        expect(confirmStore.x).toBe(100);
        expect(confirmStore.y).toBe(200);
    });
});
