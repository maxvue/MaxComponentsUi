import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputSelect, {
        props: {
            modelValue: null,
            ...props
        },
        attrs,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size']
                }
            }
        }
    });
}

describe('MaxInputSelect (Unit / WAI-ARIA & Keyboard Navigation)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Padrão WAI-ARIA Combobox', () => {
        it('gatilho possui atributos semânticos combobox WAI-ARIA', () => {
            const wrapper = mountSelect();
            const trigger = wrapper.find('.max-select');

            expect(trigger.attributes('role')).toBe('combobox');
            expect(trigger.attributes('aria-haspopup')).toBe('listbox');
            expect(trigger.attributes('aria-expanded')).toBe('false');
            expect(trigger.attributes('tabindex')).toBe('0');
        });

        it('associa aria-controls e aria-activedescendant ao abrir e destacar', async () => {
            const options = [
                { value: '1', name: 'Primeiro' },
                { value: '2', name: 'Segundo' }
            ];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            const listboxId = (wrapper.vm as any).listboxId;
            expect(trigger.attributes('aria-controls')).toBe(listboxId);
            expect(trigger.attributes('aria-expanded')).toBe('true');
            expect(trigger.attributes('aria-activedescendant')).toBe(`${listboxId}-opt-0`);

            const overlay = document.body.querySelector('.max-select-overlay');
            expect(overlay).not.toBeNull();
            expect(overlay?.getAttribute('role')).toBe('listbox');
            expect(overlay?.id).toBe(listboxId);

            const opt0 = document.body.querySelector(`#${listboxId}-opt-0`);
            expect(opt0?.getAttribute('role')).toBe('option');
        });

        it('reflete aria-selected corretamente nas opções', async () => {
            const options = [
                { value: 'sp', name: 'São Paulo' },
                { value: 'rj', name: 'Rio de Janeiro' }
            ];
            const wrapper = mountSelect({ options, modelValue: 'rj' });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            const listboxId = (wrapper.vm as any).listboxId;
            const optSp = document.body.querySelector(`#${listboxId}-opt-0`);
            const optRj = document.body.querySelector(`#${listboxId}-opt-1`);

            expect(optSp?.getAttribute('aria-selected')).toBe('false');
            expect(optRj?.getAttribute('aria-selected')).toBe('true');
        });
    });

    describe('Navegação por Teclado', () => {
        it('ArrowDown com menu fechado abre o dropdown', async () => {
            const options = [{ value: 'a', name: 'Opção A' }];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect(trigger.attributes('aria-expanded')).toBe('true');
        });

        it('ArrowUp com menu fechado abre o dropdown', async () => {
            const options = [{ value: 'a', name: 'Opção A' }];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('keydown', { key: 'ArrowUp' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect(trigger.attributes('aria-expanded')).toBe('true');
        });

        it('ArrowDown e ArrowUp com menu aberto navegam circularmente sem fechar', async () => {
            const options = [
                { value: '1', name: 'Item 1' },
                { value: '2', name: 'Item 2' },
                { value: '3', name: 'Item 3' }
            ];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect((wrapper.vm as any).highlightedIndex).toBe(0);

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(2);

            // Circular: 2 -> 0
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(0);

            // Circular com ArrowUp: 0 -> 2
            await trigger.trigger('keydown', { key: 'ArrowUp' });
            expect((wrapper.vm as any).highlightedIndex).toBe(2);

            expect((wrapper.vm as any).isOpen).toBe(true);
        });

        it('Enter seleciona a opção destacada e fecha o dropdown', async () => {
            const options = [
                { value: '1', name: 'Item 1' },
                { value: '2', name: 'Item 2' }
            ];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            await trigger.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect((wrapper.vm as any).temp_value).toBe('2');
            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2']);
            expect(wrapper.emitted('change')?.[0]).toEqual(['2']);
        });

        it('Escape fecha o dropdown e foca novamente o gatilho', async () => {
            const options = [{ value: '1', name: 'Item 1' }];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(true);

            await trigger.trigger('keydown', { key: 'Escape' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);
        });

        it('filtro captura navegação por teclado e reflete no dropdown', async () => {
            const options = [
                { value: '1', name: 'Alpha' },
                { value: '2', name: 'Beta' }
            ];
            const wrapper = mountSelect({ options, filter: true });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            const filterInput = document.body.querySelector('.max-select-filter') as HTMLInputElement;
            expect(filterInput).not.toBeNull();

            filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);
            expect((wrapper.vm as any).temp_value).toBe('2');
        });
    });

    describe('Funcionalidade de Limpeza (clearable / showClear)', () => {
        it('não renderiza botão clear quando clearable e showClear são falsos', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', clearable: false, showClear: false });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(false);
        });

        it('renderiza botão clear quando clearable=true e há valor selecionado', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', clearable: true });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(true);
        });

        it('renderiza botão clear quando showClear=true (alias) e há valor selecionado', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', showClear: true });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(true);
        });

        it('não renderiza botão clear quando o valor é null/vazio', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: null, clearable: true });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(false);
        });

        it('não renderiza botão clear se disabled=true mesmo com valor', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', clearable: true, disabled: true });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(false);
        });

        it('ao clicar no botão clear reseta temp_value e emite eventos @clear, @change e update:modelValue', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', clearable: true });
            await wrapper.vm.$nextTick();

            const clearBtn = wrapper.find('.max-select-clear-btn');
            await clearBtn.trigger('click');
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).temp_value).toBeNull();
            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
            expect(wrapper.emitted('change')?.[0]).toEqual([null]);
            expect(wrapper.emitted('clear')).toHaveLength(1);
        });
    });

    describe('Ciclo de Vida de Listeners de Teclado', () => {
        it('não associa keydown no window quando fechado', () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            mountSelect();
            expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
            addSpy.mockRestore();
        });

        it('associa keydown no window ao abrir e remove ao fechar', async () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            const wrapper = mountSelect();
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();
            expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            addSpy.mockRestore();
            removeSpy.mockRestore();
        });

        it('remove keydown no unmount se o menu estiver aberto', async () => {
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            const wrapper = mountSelect();
            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            wrapper.unmount();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            removeSpy.mockRestore();
        });
    });
});
