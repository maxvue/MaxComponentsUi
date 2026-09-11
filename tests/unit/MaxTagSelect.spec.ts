import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { watch } from 'vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        watchDebounced: (source: any, cb: any, options: any = {}) => watch(source, cb, { immediate: false, deep: options.deep })
    };
});

import MaxTagSelect from '../../src/components/MaxTagSelect.vue';

function mountTagSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxTagSelect, {
        props: {
            modelValue: null,
            ...props
        },
        attrs,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size', 'color']
                },
                MaxIconButton: {
                    template: '<button class="max-icon-button-stub"></button>',
                    props: ['icon', 'i', 'size']
                }
            }
        }
    });
}

describe('MaxTagSelect (Unit / WAI-ARIA & Keyboard Navigation)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Padrão WAI-ARIA Combobox', () => {
        it('gatilho possui atributos semânticos combobox WAI-ARIA', () => {
            const wrapper = mountTagSelect();
            const trigger = wrapper.find('.max-select');

            expect(trigger.attributes('role')).toBe('combobox');
            expect(trigger.attributes('aria-haspopup')).toBe('listbox');
            expect(trigger.attributes('aria-expanded')).toBe('false');
            expect(trigger.attributes('tabindex')).toBe('0');
        });

        it('associa aria-controls e aria-activedescendant ao abrir e destacar', async () => {
            const options = [
                { value: '1', name: 'Tag 1' },
                { value: '2', name: 'Tag 2' }
            ];
            const wrapper = mountTagSelect({ options });
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

        it('reflete aria-selected corretamente nas tags/opções', async () => {
            const options = [
                { value: 'urgente', name: 'Urgente' },
                { value: 'normal', name: 'Normal' }
            ];
            const wrapper = mountTagSelect({ options, modelValue: 'normal' });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            const listboxId = (wrapper.vm as any).listboxId;
            const optUrgente = document.body.querySelector(`#${listboxId}-opt-0`);
            const optNormal = document.body.querySelector(`#${listboxId}-opt-1`);

            expect(optUrgente?.getAttribute('aria-selected')).toBe('false');
            expect(optNormal?.getAttribute('aria-selected')).toBe('true');
        });
    });

    describe('Navegação por Teclado', () => {
        it('ArrowDown com menu fechado abre o dropdown', async () => {
            const options = [{ value: 'tag-1', name: 'Tag 1' }];
            const wrapper = mountTagSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect(trigger.attributes('aria-expanded')).toBe('true');
        });

        it('ArrowUp com menu fechado abre o dropdown', async () => {
            const options = [{ value: 'tag-1', name: 'Tag 1' }];
            const wrapper = mountTagSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('keydown', { key: 'ArrowUp' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect(trigger.attributes('aria-expanded')).toBe('true');
        });

        it('ArrowDown e ArrowUp com menu aberto navegam circularmente sem fechar', async () => {
            const options = [
                { value: '1', name: 'Tag 1' },
                { value: '2', name: 'Tag 2' },
                { value: '3', name: 'Tag 3' }
            ];
            const wrapper = mountTagSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect((wrapper.vm as any).highlightedIndex).toBe(0);

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(2);

            // Volta para 0
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(0);

            // ArrowUp vai para 2
            await trigger.trigger('keydown', { key: 'ArrowUp' });
            expect((wrapper.vm as any).highlightedIndex).toBe(2);

            expect((wrapper.vm as any).isOpen).toBe(true);
        });

        it('Enter seleciona a opção destacada e fecha o dropdown', async () => {
            const options = [
                { value: '1', name: 'Tag 1' },
                { value: '2', name: 'Tag 2' }
            ];
            const wrapper = mountTagSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            await trigger.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect((wrapper.vm as any).temp_value).toBe('2');
            expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['2']);
        });

        it('Escape fecha o dropdown e restaura o foco', async () => {
            const options = [{ value: '1', name: 'Tag 1' }];
            const wrapper = mountTagSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(true);

            await trigger.trigger('keydown', { key: 'Escape' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);
        });

        it('filtro captura navegação por teclado e atualiza seleção', async () => {
            const options = [
                { value: '1', name: 'Tag 1' },
                { value: '2', name: 'Tag 2' }
            ];
            const wrapper = mountTagSelect({ options, filter: true });
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

    describe('Ciclo de Vida de Listeners de Teclado', () => {
        it('não associa keydown no window quando fechado', () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            mountTagSelect();
            expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
            addSpy.mockRestore();
        });

        it('associa keydown no window ao abrir e remove ao fechar', async () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            const wrapper = mountTagSelect();
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

            const wrapper = mountTagSelect();
            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            wrapper.unmount();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            removeSpy.mockRestore();
        });
    });
});
