import { describe, it, expect, vi } from 'vitest';
import { defineComponent, ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useBrowserEventListener } from '../../src/composables/useBrowserEventListener';

describe('useBrowserEventListener', () => {
    it('anexa listener no mount quando isActive é verdadeiro por padrão', () => {
        const handler = vi.fn();
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');

        const Comp = defineComponent({
            setup() {
                useBrowserEventListener('keydown', handler, () => true);
                return () => null;
            }
        });

        const wrapper = mount(Comp);
        expect(addSpy).toHaveBeenCalledWith('keydown', handler, expect.any(Object));

        wrapper.unmount();
        expect(removeSpy).toHaveBeenCalledWith('keydown', handler, expect.any(Object));

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('não anexa listener no mount quando isActive é falso', () => {
        const handler = vi.fn();
        const addSpy = vi.spyOn(document, 'addEventListener');

        const Comp = defineComponent({
            setup() {
                useBrowserEventListener('keydown', handler, () => false);
                return () => null;
            }
        });

        const wrapper = mount(Comp);
        expect(addSpy).not.toHaveBeenCalled();

        wrapper.unmount();
        addSpy.mockRestore();
    });

    it('reage reativamente à alteração de isActive', async () => {
        const handler = vi.fn();
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');

        const activeRef = ref(false);

        const Comp = defineComponent({
            setup() {
                useBrowserEventListener('keydown', handler, activeRef);
                return () => null;
            }
        });

        const wrapper = mount(Comp);
        expect(addSpy).not.toHaveBeenCalled();

        activeRef.value = true;
        await nextTick();
        expect(addSpy).toHaveBeenCalledTimes(1);

        activeRef.value = false;
        await nextTick();
        expect(removeSpy).toHaveBeenCalledTimes(1);

        wrapper.unmount();
        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('é idempotente e previne registros duplicados', () => {
        const handler = vi.fn();
        const addSpy = vi.spyOn(document, 'addEventListener');

        let controls: any;
        const Comp = defineComponent({
            setup() {
                controls = useBrowserEventListener('keydown', handler);
                return () => null;
            }
        });

        const wrapper = mount(Comp);
        expect(addSpy).toHaveBeenCalledTimes(1);

        // Chamadas adicionais manuais a attach não devem duplicar o registro
        controls.attach();
        controls.attach();
        expect(addSpy).toHaveBeenCalledTimes(1);

        wrapper.unmount();
        addSpy.mockRestore();
    });
});
