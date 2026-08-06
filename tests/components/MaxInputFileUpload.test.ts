import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';

describe('MaxInputFileUpload', () => {
    it('deve renderizar o componente corretamente com a label e sem marcações do PrimeVue', () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { label: 'Fazer Upload', modelValue: [] },
            global: {
                directives: { tooltip: () => {} }
            }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });

    it('deve disparar evento de seleção de arquivo', async () => {
        const onSelectMock = vi.fn();
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: { onSelect: onSelectMock },
            global: { directives: { tooltip: () => {} } }
        });

        const input = wrapper.find('input[type="file"]');
        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        Object.defineProperty(input.element, 'files', { value: [file] });
        await input.trigger('change');

        expect(onSelectMock).toHaveBeenCalledWith(expect.objectContaining({ files: [file] }));
    });

    it('covers showError true branches and timeout', async () => {
        vi.useFakeTimers();
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: { directives: { tooltip: () => {} } }
        });

        (wrapper.vm as any).showError = true;
        await wrapper.vm.$nextTick();

        vi.runAllTimers();
        expect((wrapper.vm as any).showError).toBe(false);
        vi.useRealTimers();
    });
});
