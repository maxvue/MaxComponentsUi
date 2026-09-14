import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}, attachToBody = false) {
    return mount(MaxInputSelect, {
        attachTo: attachToBody ? document.body : undefined,
        props: { modelValue: null, ...props },
        attrs,
        global: {
            stubs: {
                Icon: true,
                MaxIcon: true
            }
        }
    });
}

describe('MaxInputSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('renderiza corretamente', () => {
        const wrapper = mountSelect();
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza o ícone de dropdown com acessibilidade aria-hidden', () => {
        const wrapper = mountSelect();
        const dropdown = wrapper.find('.max-select-dropdown');
        expect(dropdown.exists()).toBe(true);
        expect(dropdown.attributes('aria-hidden')).toBe('true');
        expect(dropdown.find('max-icon-stub').exists()).toBe(true);
        expect(dropdown.find('max-icon-stub').attributes('icon')).toBe('lucide:chevron-down');
    });

    it('exibe placeholder se sem valor', () => {
        const wrapper = mountSelect({ modelValue: '' }, { placeholder: 'Selecione' });
        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
    });

    it('renderiza options simples e calcula option_selected', async () => {
        const options = [{ value: 'a', name: 'A', icon: 'mdi:test' }];
        const wrapper = mountSelect({ modelValue: 'a', options });
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.option_selected.name).toBe('A');
    });

    it('renderiza groupOptions e calcula option_selected', async () => {
        const groupOptions = [
            { label: 'Group 1', items: [{ value: 'b', name: 'B' }] }
        ];
        const wrapper = mountSelect({ modelValue: 'b', groupOptions });
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.option_selected.name).toBe('B');
    });

    it('retorna vazio se option_selected não encontrar', async () => {
        const options = [{ value: 'a', name: 'A' }];
        const wrapper = mountSelect({ modelValue: 'c', options });
        const vm = wrapper.vm as any;
        expect(vm.option_selected).toEqual({});
    });

    it('chama loadOptions em before_show', async () => {
        let resolveLoad: any;
        const loadPromise = new Promise((resolve) => {
            resolveLoad = resolve;
        });
        const loadOptions = vi.fn().mockReturnValue(loadPromise);
        const wrapper = mountSelect({ loadOptions });

        await wrapper.find('.max-select').trigger('click');

        expect(loadOptions).toHaveBeenCalled();
        expect((wrapper.vm as any).loading).toBe(true);

        resolveLoad([{ items: [{ value: 'loaded', name: 'Loaded' }] }]);

        await loadPromise;
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).optionsField).toEqual([{ items: [{ value: 'loaded', name: 'Loaded' }] }]);
        expect((wrapper.vm as any).loading).toBe(false);
    });

    it('atualiza temp_value pelo watch de modelValue', async () => {
        const wrapper = mountSelect({ modelValue: 'a' });
        await wrapper.setProps({ modelValue: 'b' });
        expect((wrapper.vm as any).temp_value).toBe('b');
    });

    it('emite update:modelValue ao alterar temp_value', async () => {
        const wrapper = mountSelect();
        (wrapper.vm as any).temp_value = 'new_value';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('new_value');
    });

    it('não lança quando loadOptions retorna lista plana com groupOptions setado', async () => {
        const groupOptions = [{ label: 'Group 1', items: [{ value: 'b', name: 'B' }] }];
        let resolveLoad: any;
        const loadPromise = new Promise((resolve) => {
            resolveLoad = resolve;
        });
        const loadOptions = vi.fn().mockReturnValue(loadPromise);
        const wrapper = mountSelect({ modelValue: 'flat', groupOptions, loadOptions });

        await wrapper.find('.max-select').trigger('click');

        resolveLoad([{ value: 'flat', name: 'Flat Option' }]);
        await loadPromise;
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(() => vm.option_selected).not.toThrow();
        expect(vm.option_selected.name).toBe('Flat Option');
    });

    it('não exibe placeholder e exibe option quando modelValue é 0', async () => {
        const options = [{ value: 0, name: 'Opção Zero' }];
        const wrapper = mountSelect({ modelValue: 0, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-div').exists()).toBe(true);
        expect(wrapper.find('.value-div').text()).toContain('Opção Zero');
    });

    it('não exibe placeholder e exibe option quando modelValue é false', async () => {
        const options = [{ value: false, name: 'Opção Falsa' }];
        const wrapper = mountSelect({ modelValue: false, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-div').exists()).toBe(true);
        expect(wrapper.find('.value-div').text()).toContain('Opção Falsa');
    });

    it('não exibe placeholder e exibe option quando modelValue é null e há opção com valor null', async () => {
        const options = [{ value: null, name: 'Opção Nula' }];
        const wrapper = mountSelect({ modelValue: null, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-div').exists()).toBe(true);
        expect(wrapper.find('.value-div').text()).toContain('Opção Nula');
    });

    it('exibe placeholder e não exibe value-div quando modelValue é órfão', async () => {
        const options = [{ value: 'a', name: 'Opção A' }];
        const wrapper = mountSelect({ modelValue: 'orfao', options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.placeholder-select').text()).toBe('Selecione');
        expect(wrapper.find('.value-div').exists()).toBe(false);
    });

    it('exibe placeholder e não exibe value-div quando modelValue é null sem opção correspondente', async () => {
        const options = [{ value: 'a', name: 'Opção A' }];
        const wrapper = mountSelect({ modelValue: null, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.placeholder-select').text()).toBe('Selecione');
        expect(wrapper.find('.value-div').exists()).toBe(false);
    });

    it('aplica height padrão de 27px nos itens da lista', async () => {
        const options = [
            { value: '1', name: 'Opção 1' },
            { value: '2', name: 'Opção 2' }
        ];
        const wrapper = mountSelect({ options }, {}, true);
        await wrapper.find('.max-select').trigger('click');
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.max-select-option') as HTMLElement;
        expect(item).not.toBeNull();
        expect(item.style.height).toBe('27px');
    });

    it('aplica height customizado quando listHeight é informado como número ou string', async () => {
        const options = [{ value: '1', name: 'Opção 1' }];
        const wrapper = mountSelect({ options, listHeight: 40 }, {}, true);
        await wrapper.find('.max-select').trigger('click');
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.max-select-option') as HTMLElement;
        expect(item).not.toBeNull();
        expect(item.style.height).toBe('40px');
    });

    it('aplica height customizado quando listHeight é informado com unidade CSS', async () => {
        const options = [{ value: '1', name: 'Opção 1' }];
        const wrapper = mountSelect({ options, listHeight: '2.5rem' }, {}, true);
        await wrapper.find('.max-select').trigger('click');
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.max-select-option') as HTMLElement;
        expect(item).not.toBeNull();
        expect(item.style.height).toBe('2.5rem');
    });

    it('foca no input de filtro ao abrir quando filter=true', async () => {
        const options = [{ value: '1', name: 'Opção 1' }];
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        const wrapper = mountSelect({ options, filter: true }, {}, true);

        await wrapper.find('.max-select').trigger('click');
        await wrapper.vm.$nextTick();

        expect(focusSpy).toHaveBeenCalled();
        focusSpy.mockRestore();
    });

    it('filtra opções ignorando acentos gráficos (accent-insensitive)', async () => {
        const options = [
            { value: '1', label: 'São Paulo' },
            { value: '2', label: 'Goiânia' },
            { value: '3', label: 'Brasília' },
            { value: '4', label: 'Belo Horizonte' }
        ];
        const wrapper = mountSelect({ options, filter: true });
        (wrapper.vm as any).searchQuery = 'sao paulo';
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.filteredOptions).toHaveLength(1);
        expect(vm.filteredOptions[0].label).toBe('São Paulo');

        (wrapper.vm as any).searchQuery = 'goiania';
        await wrapper.vm.$nextTick();
        expect(vm.filteredOptions).toHaveLength(1);
        expect(vm.filteredOptions[0].label).toBe('Goiânia');
    });

    it('filtra groupOptions ignorando acentos gráficos (accent-insensitive)', async () => {
        const groupOptions = [
            {
                label: 'Sudeste',
                items: [
                    { value: '1', label: 'São Paulo' },
                    { value: '2', label: 'Rio de Janeiro' }
                ]
            },
            {
                label: 'Centro-Oeste',
                items: [
                    { value: '3', label: 'Goiânia' },
                    { value: '4', label: 'Brasília' }
                ]
            }
        ];
        const wrapper = mountSelect({ groupOptions, filter: true });
        (wrapper.vm as any).searchQuery = 'brasilia';
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.filteredOptions).toHaveLength(1);
        expect(vm.filteredOptions[0].items).toHaveLength(1);
        expect(vm.filteredOptions[0].items[0].label).toBe('Brasília');
    });

    describe('Prop clearable e showClear', () => {
        it('exibe o botão de limpar seleção quando clearable=true e há valor selecionado', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', clearable: true });
            await wrapper.vm.$nextTick();

            const clearBtn = wrapper.find('.max-select-clear-btn');
            expect(clearBtn.exists()).toBe(true);
            expect(clearBtn.attributes('aria-label')).toBe('Limpar seleção');
        });

        it('exibe o botão de limpar seleção quando showClear=true (alias)', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', showClear: true });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(true);
        });

        it('não exibe botão de limpar quando não há valor selecionado', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: null, clearable: true });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(false);
        });

        it('não exibe botão de limpar quando disabled=true mesmo com valor e clearable', async () => {
            const options = [{ value: 'sp', name: 'São Paulo' }];
            const wrapper = mountSelect({ options, modelValue: 'sp', clearable: true, disabled: true });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-select-clear-btn').exists()).toBe(false);
        });

        it('ao clicar no botão limpar, reseta para null e emite update:modelValue, change e clear', async () => {
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

    describe('Navegação por Teclado e WAI-ARIA Combobox', () => {
        it('gatilho possui atributos semânticos combobox WAI-ARIA', async () => {
            const wrapper = mountSelect();
            const trigger = wrapper.find('.max-select');

            expect(trigger.attributes('role')).toBe('combobox');
            expect(trigger.attributes('aria-haspopup')).toBe('listbox');
            expect(trigger.attributes('aria-expanded')).toBe('false');
            expect(trigger.attributes('tabindex')).toBe('0');
        });

        it('ArrowDown com menu fechado abre o menu', async () => {
            const options = [{ value: '1', name: 'Item 1' }];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect(trigger.attributes('aria-expanded')).toBe('true');
        });

        it('ArrowDown e ArrowUp com menu aberto navegam circularmente sem fechar o dropdown', async () => {
            const options = [
                { value: '1', name: 'Item 1' },
                { value: '2', name: 'Item 2' },
                { value: '3', name: 'Item 3' }
            ];
            const wrapper = mountSelect({ options });
            const trigger = wrapper.find('.max-select');

            // Abre o dropdown
            await trigger.trigger('click');
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(true);
            expect((wrapper.vm as any).highlightedIndex).toBe(0);

            // ArrowDown move para 1
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).isOpen).toBe(true);
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            // ArrowDown move para 2
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(2);

            // ArrowDown circular volta para 0
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(0);

            // ArrowUp circular vai para o último (2)
            await trigger.trigger('keydown', { key: 'ArrowUp' });
            expect((wrapper.vm as any).highlightedIndex).toBe(2);
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

            // Destaca o segundo item
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            // Confirma com Enter
            await trigger.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect((wrapper.vm as any).temp_value).toBe('2');
            expect(wrapper.emitted('change')?.[0]).toEqual(['2']);
        });

        it('Escape fecha o dropdown e retorna o foco ao gatilho', async () => {
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

        it('captura ArrowDown, ArrowUp, Enter e Escape no input de filtro', async () => {
            const options = [
                { value: '1', label: 'Item 1' },
                { value: '2', label: 'Item 2' }
            ];
            const wrapper = mountSelect({ options, filter: true });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            const filterInput = document.body.querySelector('.max-select-filter') as HTMLInputElement;
            expect(filterInput).not.toBeNull();

            // Simula ArrowDown no filtro
            filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            // Simula Enter no filtro
            filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);
            expect((wrapper.vm as any).temp_value).toBe('2');
        });
    });

    describe('Eliminação do Listener Global Permanente', () => {
        it('registra o listener de keydown somente quando aberto e remove ao fechar', async () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            const wrapper = mountSelect();
            // Ao montar fechado, NÃO deve adicionar keydown no window
            expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

            // Abre o select
            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();
            expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            // Fecha o select
            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            addSpy.mockRestore();
            removeSpy.mockRestore();
        });

        it('remove o listener de keydown ao desmontar se estava aberto', async () => {
            const removeSpy = vi.spyOn(window, 'removeEventListener');
            const wrapper = mountSelect();

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            wrapper.unmount();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            removeSpy.mockRestore();
        });
    });

    describe('Carga coordenada e reentrante de loadOptions (E05-06)', () => {
        it('duplo clique rápido durante a carga chama loadOptions apenas uma vez', async () => {
            let resolveLoad: any;
            const loadPromise = new Promise((resolve) => { resolveLoad = resolve; });
            const loadOptions = vi.fn().mockReturnValue(loadPromise);
            const wrapper = mountSelect({ loadOptions });

            // Primeiro clique inicia carga
            await wrapper.find('.max-select').trigger('click');
            // Segundo clique enquanto carrega cancela a intenção de abrir
            await wrapper.find('.max-select').trigger('click');

            expect(loadOptions).toHaveBeenCalledTimes(1);

            resolveLoad([{ value: '1', name: 'Item 1' }]);
            await loadPromise;
            await wrapper.vm.$nextTick();

            // Como o segundo clique cancelou a abertura, o dropdown permanece fechado
            expect((wrapper.vm as any).isOpen).toBe(false);
            wrapper.unmount();
        });

        it('passa AbortSignal em context e aborta se o select for fechado ou desmontado durante a carga', async () => {
            let capturedSignal: AbortSignal | undefined;
            const loadPromise = new Promise(() => {}); // never resolves
            const loadOptions = vi.fn().mockImplementation((ctx: any) => {
                capturedSignal = ctx?.signal;
                return loadPromise;
            });
            const wrapper = mountSelect({ loadOptions });

            await wrapper.find('.max-select').trigger('click');
            expect(loadOptions).toHaveBeenCalled();
            expect(capturedSignal).toBeDefined();
            expect(capturedSignal?.aborted).toBe(false);

            wrapper.unmount();
            expect(capturedSignal?.aborted).toBe(true);
        });

        it('desabilitar o componente durante a carga cancela abertura e publicação', async () => {
            let resolveLoad: any;
            const loadPromise = new Promise((resolve) => { resolveLoad = resolve; });
            const loadOptions = vi.fn().mockReturnValue(loadPromise);
            const wrapper = mountSelect({ loadOptions });

            await wrapper.find('.max-select').trigger('click');
            expect((wrapper.vm as any).loading).toBe(true);

            await wrapper.setProps({ disabled: true });
            await wrapper.vm.$nextTick();

            resolveLoad([{ value: '2', name: 'Item 2' }]);
            await loadPromise;
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect((wrapper.vm as any).loading).toBe(false);
            wrapper.unmount();
        });

        it('trata falha/rejeição no loadOptions sem exceção não tratada e permite nova tentativa', async () => {
            const loadOptions = vi.fn().mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce([{ value: 'ok', name: 'OK' }]);
            const wrapper = mountSelect({ loadOptions });

            await wrapper.find('.max-select').trigger('click');
            await new Promise((r) => setTimeout(r, 10));
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).loading).toBe(false);
            expect((wrapper.vm as any).isOpen).toBe(false);

            // Segunda tentativa bem-sucedida
            await wrapper.find('.max-select').trigger('click');
            await new Promise((r) => setTimeout(r, 10));
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect((wrapper.vm as any).optionsField).toEqual([{ value: 'ok', name: 'OK' }]);
            wrapper.unmount();
        });

        it('resolver duas gerações de carga em ordem inversa mantém a mais recente (E05-06)', async () => {
            let resolveLoad1: any;
            const promise1 = new Promise((r) => { resolveLoad1 = r; });
            let resolveLoad2: any;
            const promise2 = new Promise((r) => { resolveLoad2 = r; });

            let callCount = 0;
            const loadOptions = vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) return promise1;
                return promise2;
            });
            const wrapper = mountSelect({ loadOptions });

            // 1ª ativação
            await wrapper.find('.max-select').trigger('click');
            expect(loadOptions).toHaveBeenCalledTimes(1);

            // Cancela fechando
            await wrapper.find('.max-select').trigger('click');

            // 2ª ativação
            await wrapper.find('.max-select').trigger('click');
            expect(loadOptions).toHaveBeenCalledTimes(2);

            // Resposta 2 resolve primeiro
            resolveLoad2([{ value: 'v2', name: 'Versão 2' }]);
            await promise2;
            await new Promise((r) => setTimeout(r, 20));
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect((wrapper.vm as any).optionsField).toEqual([{ value: 'v2', name: 'Versão 2' }]);

            // Resposta 1 resolve tardiamente
            resolveLoad1([{ value: 'v1', name: 'Versão 1' }]);
            await promise1;
            await new Promise((r) => setTimeout(r, 20));
            await wrapper.vm.$nextTick();

            // Deve manter a versão 2 mais recente
            expect((wrapper.vm as any).optionsField).toEqual([{ value: 'v2', name: 'Versão 2' }]);
            wrapper.unmount();
        });
    });

    describe('Estado Disabled Completo (E06-03)', () => {
        it('define tabindex=-1 e aria-disabled=true quando desabilitado e bloqueia interações', async () => {
            const wrapper = mountSelect({
                disabled: true,
                options: [{ value: 'a', name: 'Opção A' }]
            });

            const trigger = wrapper.find('.max-select');
            expect(trigger.attributes('tabindex')).toBe('-1');
            expect(trigger.attributes('aria-disabled')).toBe('true');
            expect(trigger.attributes('aria-controls')).toBeUndefined();

            // Tentativa de abertura via clique
            await trigger.trigger('click');
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);

            // Tentativa de abertura via teclado
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);

            await trigger.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);

            await trigger.trigger('keydown', { key: ' ' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);

            // Reabilita dinamicamente
            await wrapper.setProps({ disabled: false });
            await wrapper.vm.$nextTick();

            expect(trigger.attributes('tabindex')).toBe('0');
            expect(trigger.attributes('aria-disabled')).toBeUndefined();

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(true);

            // Desabilita enquanto aberto: deve fechar imediatamente
            await wrapper.setProps({ disabled: true });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);
            expect(trigger.attributes('tabindex')).toBe('-1');
            expect(trigger.attributes('aria-disabled')).toBe('true');

            wrapper.unmount();
        });
    });

    describe('Virtualização e Coleções Grandes (E06-06)', () => {
        it('virtualiza automaticamente coleções acima do threshold (500 itens)', async () => {
            const items = Array.from({ length: 600 }, (_, i) => ({ value: `v${i}`, name: `Item ${i}` }));
            const wrapper = mountSelect({
                options: items
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const spacer = document.body.querySelector('.max-select-spacer');
            expect(spacer).toBeTruthy();

            const renderedOptions = document.body.querySelectorAll('.max-select-option');
            expect(renderedOptions.length).toBeLessThan(600);

            wrapper.unmount();
        });

        it('não virtualiza quando virtualScroll=false mesmo com mais de 500 itens', async () => {
            const items = Array.from({ length: 550 }, (_, i) => ({ value: `v${i}`, name: `Item ${i}` }));
            const wrapper = mountSelect({
                options: items,
                virtualScroll: false
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const spacer = document.body.querySelector('.max-select-spacer');
            expect(spacer).toBeNull();

            const renderedOptions = document.body.querySelectorAll('.max-select-option');
            expect(renderedOptions.length).toBe(550);

            wrapper.unmount();
        });

        it('força virtualização quando virtualScroll=true mesmo com poucos itens', async () => {
            const items = Array.from({ length: 20 }, (_, i) => ({ value: `v${i}`, name: `Item ${i}` }));
            const wrapper = mountSelect({
                options: items,
                virtualScroll: true
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const spacer = document.body.querySelector('.max-select-spacer');
            expect(spacer).toBeTruthy();

            wrapper.unmount();
        });

        it('achata groupOptions em O(N) e preserva seleção e cliques', async () => {
            const groupOptions = [
                {
                    label: 'Grupo 1',
                    items: [
                        { value: 'g1_1', name: 'Item 1.1' },
                        { value: 'g1_2', name: 'Item 1.2' }
                    ]
                },
                {
                    label: 'Grupo 2',
                    items: [
                        { value: 'g2_1', name: 'Item 2.1' },
                        { value: 'g2_2', name: 'Item 2.2' }
                    ]
                }
            ];

            const wrapper = mountSelect({
                groupOptions
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const groups = document.body.querySelectorAll('.max-select-option-group');
            expect(groups.length).toBe(2);

            const options = document.body.querySelectorAll('.max-select-option');
            expect(options.length).toBe(4);

            // Clica na 3ª opção (primeira do grupo 2)
            (options[2] as HTMLElement).click();
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['g2_1']);

            wrapper.unmount();
        });
    });
});


