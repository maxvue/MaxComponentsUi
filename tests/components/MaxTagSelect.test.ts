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
        props: { modelValue: null, ...props },
        attrs,
        global: {
            stubs: {
                MaxIcon: true,
                MaxIconButton: {
                    template: '<button class="max-icon-button-stub" :disabled="disabled" :aria-label="ariaLabel"></button>',
                    props: ['icon', 'i', 'size', 'disabled', 'ariaLabel']
                }
            }
        }
    });
}

function mountTagSelectRealButton(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxTagSelect, {
        props: { modelValue: null, isButton: true, icon: 'lucide:tag', ...props },
        attrs,
        global: {
            stubs: {
                MaxIcon: true
            }
        }
    });
}

describe('MaxTagSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTagSelect();
        expect(wrapper.exists()).toBe(true);
    });

    it('ciclo v-model: selecionar uma opção emite update:modelValue com o valor correto', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ options });

        await wrapper.find('.max-select').trigger('click');
        await wrapper.vm.$nextTick();

        const optionEl = document.body.querySelector('.max-select-option') as HTMLElement;
        expect(optionEl).toBeTruthy();
        optionEl.click();
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['a']);
    });

    it('modelValue externo atualiza temp_value (via watch)', async () => {
        const wrapper = mountTagSelect();
        await wrapper.setProps({ modelValue: 'x' });
        expect((wrapper.vm as any).temp_value).toBe('x');
    });

    it('option_selected resolve para options simples com base no optionValue', async () => {
        const options = [
            { value: 'a', name: 'Tag A' },
            { value: 'b', name: 'Tag B' }
        ];
        const wrapper = mountTagSelect({ modelValue: 'b', options });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).option_selected.name).toBe('Tag B');
    });

    it('option_selected retorna objeto vazio quando o valor não é encontrado', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: 'nao-existe', options });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).option_selected).toEqual({});
    });

    it('exibe o texto da opção selecionada no template (slot value)', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: 'a', options });
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Tag A');
    });

    describe('getColorString / getStyleColor', () => {
        it('usa background_color quando definido', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            expect(vm.getColorString({ background_color: '#ff0000' })).toBe('#ff0000');
        });

        it('usa tag_color como fallback quando background_color não está definido', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            expect(vm.getColorString({ tag_color: '#00ff00' })).toBe('#00ff00');
        });

        it('retorna "unset" quando nenhum campo de cor está definido', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            expect(vm.getColorString({})).toBe('unset');
            expect(vm.getColorString(null)).toBe('unset');
        });

        it('opção sem cor definida cai no fallback transparente (não é valor: background transparent)', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            const style = vm.getStyleColor({}, false, false);
            expect(style.backgroundColor).toBe('transparent');
        });

        it('opção sem cor definida, quando é valor (is_value=true), usa a cor de fundo padrão (não transparente)', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            const style = vm.getStyleColor({}, false, true);
            expect(style.backgroundColor).not.toBe('transparent');
            expect(style.backgroundColor).toBeTruthy();
        });

        it('opção com cor customizada gera backgroundColor correspondente', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            const style = vm.getStyleColor({ background_color: '#ff0000' }, false, false);
            expect(style.backgroundColor.toLowerCase()).toContain('ff0000');
        });
    });

    it('modo isButton: renderiza MaxIconButton em vez do valor selecionado', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: 'a', options, isButton: true, icon: 'mdi:tag' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-icon-button-stub').exists()).toBe(true);
        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
    });

    it('quando isButton=false (padrão), NÃO renderiza MaxIconButton, mas o valor normal', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: 'a', options });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-icon-button-stub').exists()).toBe(false);
        expect(wrapper.find('.value-tag-div').exists()).toBe(true);
    });

    describe('Modo Botão (F15 / E06-03 / E08-04)', () => {
        it('modo isButton: propaga disabled para MaxIconButton impedindo Tab e click', async () => {
            const options = [{ value: 'a', name: 'Tag A' }];
            const wrapper = mountTagSelectRealButton({
                modelValue: null,
                options,
                disabled: true
            });
            await wrapper.vm.$nextTick();

            const button = wrapper.find('button.max-icon-button');
            expect(button.exists()).toBe(true);
            expect(button.attributes('disabled')).toBeDefined();
            expect(button.attributes('aria-disabled')).toBe('true');
            expect((button.element as HTMLButtonElement).disabled).toBe(true);

            // Clique não abre dropdown quando desabilitado
            await button.trigger('click');
            await wrapper.vm.$nextTick();
            expect(document.body.querySelector('.max-select-overlay')).toBeNull();

            // Ao habilitar, o botão é destravado
            await wrapper.setProps({ disabled: false });
            await wrapper.vm.$nextTick();
            expect((button.element as HTMLButtonElement).disabled).toBe(false);
            expect(button.attributes('disabled')).toBeUndefined();

            await button.trigger('click');
            await wrapper.vm.$nextTick();
            expect(document.body.querySelector('.max-select-overlay')).not.toBeNull();
        });

        it('modo isButton: atribui nome acessível contextual sem fallback genérico Botão de ação e sem warnings', async () => {
            const warnSpy = vi.spyOn(console, 'warn');
            const options = [{ value: 'a', name: 'Tag A' }];
            const wrapper = mountTagSelectRealButton({
                modelValue: null,
                options
            });
            await wrapper.vm.$nextTick();

            const button = wrapper.find('button.max-icon-button');
            expect(button.exists()).toBe(true);
            const ariaLabel = button.attributes('aria-label');
            expect(ariaLabel).toBe('Selecionar tag');
            expect(ariaLabel).not.toBe('Botão de ação');

            // Nenhuma advertência emitida pelo MaxIconButton
            expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('[MaxIconButton]'));
            warnSpy.mockRestore();
        });

        it('modo isButton: propaga label e aria-label customizados ao MaxIconButton', async () => {
            const warnSpy = vi.spyOn(console, 'warn');
            const options = [{ value: 'a', name: 'Tag A' }];
            const wrapper = mountTagSelectRealButton({
                modelValue: null,
                options,
                label: 'Status do Projeto'
            });
            await wrapper.vm.$nextTick();

            const button = wrapper.find('button.max-icon-button');
            expect(button.attributes('aria-label')).toBe('Status do Projeto');
            expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('[MaxIconButton]'));
            warnSpy.mockRestore();
        });

        it('modo isButton: com item selecionado, nome reflete o valor selecionado', async () => {
            const options = [{ value: 'a', name: 'Tag A' }];
            const wrapper = mountTagSelectRealButton({
                modelValue: 'a',
                options
            });
            await wrapper.vm.$nextTick();

            const button = wrapper.find('button.max-icon-button');
            expect(button.attributes('aria-label')).toBe('Selecionado: Tag A');
        });
    });

    it('aplica valor default quando modelValue está vazio (watchDebounced mockado para rodar imediatamente)', async () => {
        const options = [{ value: 'a', name: 'Tag A' }, { value: 'b', name: 'Tag B' }];
        const wrapper = mountTagSelect({ modelValue: 'b', options, default: 'a' });

        // Muda o modelValue para um valor "em branco" (string vazia) para acionar o watch
        await wrapper.setProps({ modelValue: '' });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).temp_value).toBe('a');
    });

    it('não aplica default quando modelValue já possui valor', async () => {
        const options = [{ value: 'a', name: 'Tag A' }, { value: 'b', name: 'Tag B' }];
        const wrapper = mountTagSelect({ modelValue: 'b', options, default: 'a' });

        await wrapper.setProps({ modelValue: 'b' });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).temp_value).toBe('b');
    });

    it('emite before-show e carrega loadOptions ao abrir', async () => {
        const loadOptions = vi.fn().mockResolvedValue([{ value: 'z', name: 'Loaded' }]);
        const wrapper = mountTagSelect({ loadOptions });

        await (wrapper.vm as any).before_show({});
        await wrapper.vm.$nextTick();

        expect(loadOptions).toHaveBeenCalled();
        expect(wrapper.emitted('before-show')).toBeTruthy();
        expect((wrapper.vm as any).optionsField).toEqual([{ value: 'z', name: 'Loaded', hover: false }]);
        expect((wrapper.vm as any).loading).toBe(false);
    });

    it('não renderiza placeholder quando modelValue é 0 e exibe a tag correspondente', async () => {
        const options = [
            { value: 0, name: 'Opção Zero' },
            { value: 1, name: 'Opção Um' }
        ];
        const wrapper = mountTagSelect({ modelValue: 0, options }, { placeholder: 'Selecione uma opção' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-tag-div').exists()).toBe(true);
        expect(wrapper.find('.tag-value-text').text()).toBe('Opção Zero');
    });

    it('não renderiza placeholder quando modelValue é false e exibe a tag correspondente', async () => {
        const options = [
            { value: false, name: 'Desativado' },
            { value: true, name: 'Ativado' }
        ];
        const wrapper = mountTagSelect({ modelValue: false, options }, { placeholder: 'Selecione o estado' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-tag-div').exists()).toBe(true);
        expect(wrapper.find('.tag-value-text').text()).toBe('Desativado');
    });

    it('NÃO renderiza badge vazia quando nada está selecionado (modelValue null)', async () => {
        const options = [{ value: 'a', name: 'Opção A' }];
        const wrapper = mountTagSelect({ modelValue: null, options }, { placeholder: 'Escolha uma opção' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(true);
    });

    it('NÃO renderiza badge vazia quando modelValue é valor órfão', async () => {
        const options = [{ value: 'a', name: 'Opção A' }];
        const wrapper = mountTagSelect({ modelValue: 'inexistente', options }, { placeholder: 'Escolha uma opção' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(true);
    });

    it('renderiza placeholder e NÃO renderiza .value-tag-div nem .max-icon-button-stub quando modelValue é vazio ("")', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: '', options }, { placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.tab-placeholder-select').text()).toBe('Selecione');
        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
        expect(wrapper.find('.max-icon-button-stub').exists()).toBe(false);
    });

    it('não renderiza .value-tag-div nem .max-icon-button-stub quando modelValue é null e possui propriedades de ícone', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: null, iconLeft: 'mdi:user', options });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
        expect(wrapper.find('.max-icon-button-stub').exists()).toBe(false);
    });

    it('modo isButton com modelValue null: renderiza MaxIconButton e não renderiza .value-tag-div', async () => {
        const wrapper = mountTagSelect({ isButton: true, icon: 'mdi:tag', modelValue: null });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-icon-button-stub').exists()).toBe(true);
        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
    });

    describe('Navegação por Teclado e WAI-ARIA Combobox', () => {
        it('gatilho possui atributos semânticos combobox WAI-ARIA', async () => {
            const wrapper = mountTagSelect();
            const trigger = wrapper.find('.max-select');

            expect(trigger.attributes('role')).toBe('combobox');
            expect(trigger.attributes('aria-haspopup')).toBe('listbox');
            expect(trigger.attributes('aria-expanded')).toBe('false');
            expect(trigger.attributes('tabindex')).toBe('0');
        });

        it('ArrowDown com menu fechado abre o dropdown', async () => {
            const options = [{ value: 'a', name: 'Tag A' }];
            const wrapper = mountTagSelect({ options });
            const trigger = wrapper.find('.max-select');

            await trigger.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect(trigger.attributes('aria-expanded')).toBe('true');
        });

        it('ArrowDown e ArrowUp com menu aberto navegam circularmente', async () => {
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

            // Circular para o início
            await trigger.trigger('keydown', { key: 'ArrowDown' });
            expect((wrapper.vm as any).highlightedIndex).toBe(0);

            // Circular para o fim com ArrowUp
            await trigger.trigger('keydown', { key: 'ArrowUp' });
            expect((wrapper.vm as any).highlightedIndex).toBe(2);
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

        it('Escape fecha o dropdown', async () => {
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

        it('captura ArrowDown, ArrowUp, Enter e Escape no input de filtro', async () => {
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

    describe('Eliminação do Listener Global Permanente', () => {
        it('registra o listener de keydown somente quando aberto e remove ao fechar', async () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            const wrapper = mountTagSelect();
            expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();
            expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            addSpy.mockRestore();
            removeSpy.mockRestore();
        });

        it('remove o listener de keydown ao desmontar se estava aberto', async () => {
            const removeSpy = vi.spyOn(window, 'removeEventListener');
            const wrapper = mountTagSelect();

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            wrapper.unmount();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            removeSpy.mockRestore();
        });
    });

    describe('Estado Disabled Completo (E06-03)', () => {
        it('define tabindex=-1 e aria-disabled=true quando desabilitado e bloqueia interações', async () => {
            const wrapper = mountTagSelect({
                disabled: true,
                options: [{ value: 'a', name: 'Tag A' }]
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
        it('virtualiza automaticamente coleções acima de 500 itens', async () => {
            const items = Array.from({ length: 600 }, (_, i) => ({ value: `tag_${i}`, name: `Tag ${i}`, label: `Tag ${i}` }));
            const wrapper = mountTagSelect({
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

        it('achata groupOptions em O(N) e preserva seleção e render de grupos', async () => {
            const groupOptions = [
                {
                    label: 'Grupo A',
                    items: [
                        { value: 'a1', name: 'Item A1', label: 'Item A1' },
                        { value: 'a2', name: 'Item A2', label: 'Item A2' }
                    ]
                },
                {
                    label: 'Grupo B',
                    items: [
                        { value: 'b1', name: 'Item B1', label: 'Item B1' }
                    ]
                }
            ];
            const wrapper = mountTagSelect({
                groupOptions
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const groupHeaders = document.body.querySelectorAll('.max-select-option-group-wrapper');
            expect(groupHeaders.length).toBe(2);
            expect(groupHeaders[0].textContent).toContain('Grupo A');
            expect(groupHeaders[1].textContent).toContain('Grupo B');

            const options = document.body.querySelectorAll('.max-select-option');
            expect(options.length).toBe(3);

            (options[0] as HTMLElement).click();
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['a1']);

            wrapper.unmount();
        });

        it('respeita virtualScroll=false desativando virtualização', async () => {
            const items = Array.from({ length: 550 }, (_, i) => ({ value: `tag_${i}`, name: `Tag ${i}`, label: `Tag ${i}` }));
            const wrapper = mountTagSelect({
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

        it('em listas agrupadas virtualizadas (>500 itens), mapeia highlightedIndex para índice em flattenedItems incluindo headers', async () => {
            // 10 grupos com 60 itens cada = 600 itens selecionáveis + 10 headers = 610 itens achatados
            const groupOptions = Array.from({ length: 10 }, (_, gIdx) => ({
                label: `Grupo ${gIdx + 1}`,
                items: Array.from({ length: 60 }, (_, oIdx) => ({
                    value: `g${gIdx}_item_${oIdx}`,
                    name: `G${gIdx + 1} Item ${oIdx + 1}`,
                    label: `G${gIdx + 1} Item ${oIdx + 1}`
                }))
            }));

            const wrapper = mountTagSelect({
                groupOptions
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            // Virtual scroll deve estar ativo (total 610 itens achatados > threshold 500)
            const spacer = document.body.querySelector('.max-select-spacer');
            expect(spacer).toBeTruthy();

            // Total de opções selecionáveis
            const totalSelectable = (wrapper.vm as any).flatSelectableOptions.length;
            expect(totalSelectable).toBe(600);

            // Total de itens achatados (incluindo 10 cabeçalhos)
            const totalFlattened = (wrapper.vm as any).flattenedItems.length;
            expect(totalFlattened).toBe(610);

            // Item selecionável 120 pertence ao Grupo 2
            // Em flattenedItems:
            // Grupo 0: 1 header + 60 items = 61 posições (índices 0..60)
            // Grupo 1: 1 header + 60 items = 61 posições (índices 61..121)
            // Header Grupo 2: índice 122
            // Item 120 selecionável: índice 123 em flattenedItems
            const flatIdxFor120 = (wrapper.vm as any).flattenedItems.findIndex(
                (e: any) => e.type === 'option' && e.selectableIndex === 120
            );
            expect(flatIdxFor120).toBe(123);

            (wrapper.vm as any).highlightedIndex = 120;
            (wrapper.vm as any).scrollHighlightedIntoView();
            await wrapper.vm.$nextTick();

            const container = (wrapper.vm as any).listContainerEl as HTMLElement;
            expect(container).toBeTruthy();

            wrapper.unmount();
        });
    });
});


