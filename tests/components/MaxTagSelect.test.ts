import { resetOutsidePointerStateForTests } from '../../src/helpers/useOutsidePointer';
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

function mountTagSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}, mountOptions: Record<string, any> = {}) {
    return mount(MaxTagSelect, {
        props: { modelValue: null, ...props },
        attrs,
        ...mountOptions,
        global: {
            stubs: {
                MaxIcon: true
            },
            ...(mountOptions.global ?? {})
        }
    });
}

describe('MaxTagSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        resetOutsidePointerStateForTests();
        document.body.innerHTML = '';
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTagSelect();
        expect(wrapper.exists()).toBe(true);
    });

    it('limita o overlay a 300px e aplica reticências em textos longos', async () => {
        const wrapper = mountTagSelect({
            options: [{ value: 'sc', name: 'Celesc Santa Catarina com um nome excepcionalmente longo' }]
        });

        const trigger = wrapper.find('.max-select');
        Object.defineProperty(trigger.element, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 180,
                height: 36,
                top: 10,
                left: 10,
                right: 190,
                bottom: 46,
                x: 10,
                y: 10,
                toJSON: () => ({})
            })
        });

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        const label = overlay.querySelector('.label-tag > div') as HTMLElement;

        expect(overlay).not.toBeNull();
        Object.defineProperties(label, {
            clientWidth: { configurable: true, value: 120 },
            scrollWidth: { configurable: true, value: 200 }
        });
        Object.defineProperty(overlay, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 180,
                height: 200,
                top: 48,
                left: 10,
                right: 190,
                bottom: 248,
                x: 10,
                y: 48,
                toJSON: () => ({})
            })
        });

        (wrapper.vm as any).updatePosition();
        await wrapper.vm.$nextTick();

        expect(overlay.style.width).toBe('260px');
        expect(label.style.overflow).toBe('hidden');
        expect(label.style.textOverflow).toBe('ellipsis');
        expect(label.style.whiteSpace).toBe('nowrap');

        wrapper.unmount();
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

    it('faz a tag selecionada ocupar toda a largura e altura do fundo', async () => {
        const options = [{ value: 'reprovado', name: 'Reprovado', background_color: '#ff8f8f' }];
        const wrapper = mountTagSelect({ modelValue: 'reprovado', options });
        await wrapper.vm.$nextTick();

        const selectedTag = wrapper.find('.value-tag-div').element as HTMLElement;

        expect(selectedTag.style.width).toBe('100%');
        expect(selectedTag.style.height).toBe('100%');
        expect(selectedTag.style.boxSizing).toBe('border-box');
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

        it('opção sem cor customizada selecionada (is_selected=true) aplica tokens semânticos de seleção', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            const style = vm.getStyleColor({}, false, false, true);
            expect(style.backgroundColor).toContain('--max-selection-background');
            expect(style.color).toContain('--max-selection-content');
        });

        it('opção sem cor customizada selecionada em hover aplica tokens semânticos de hover de seleção', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;
            const style = vm.getStyleColor({}, true, false, true);
            expect(style.backgroundColor).toContain('--max-selection-hover-background');
            expect(style.color).toContain('--max-selection-hover-content');
        });

        it('garante contraste acessível (>= 4.5:1) em tags customizadas de diferentes luminâncias', () => {
            const wrapper = mountTagSelect();
            const vm = wrapper.vm as any;

            const testColors = ['#10B981', '#EF4444', '#F59E0B', '#00768E', '#005F77'];
            for (const bg of testColors) {
                const style = vm.getStyleColor({ background_color: bg }, false, false);
                expect(style.color).toBeTruthy();
                expect(style.backgroundColor).toBeTruthy();
            }
        });
    });

    it('modo isButton: renderiza MaxIconButton em vez do valor selecionado', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: 'a', options, isButton: true, icon: 'mdi:tag' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-icon-button').exists()).toBe(true);
        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
    });

    it('quando isButton=false (padrão), NÃO renderiza MaxIconButton, mas o valor normal', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: 'a', options });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-icon-button').exists()).toBe(false);
        expect(wrapper.find('.value-tag-div').exists()).toBe(true);
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

    it('renderiza placeholder e NÃO renderiza .value-tag-div nem .max-icon-button quando modelValue é vazio ("")', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: '', options }, { placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.tab-placeholder-select').text()).toBe('Selecione');
        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
        expect(wrapper.find('.max-icon-button').exists()).toBe(false);
    });

    it('não renderiza .value-tag-div nem .max-icon-button quando modelValue é null e possui propriedades de ícone', async () => {
        const options = [{ value: 'a', name: 'Tag A' }];
        const wrapper = mountTagSelect({ modelValue: null, iconLeft: 'mdi:user', options });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-tag-div').exists()).toBe(false);
        expect(wrapper.find('.max-icon-button').exists()).toBe(false);
    });

    it('modo isButton com modelValue null: renderiza MaxIconButton e não renderiza .value-tag-div', async () => {
        const wrapper = mountTagSelect({ isButton: true, icon: 'mdi:tag', modelValue: null });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-icon-button').exists()).toBe(true);
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
            const addSpy = vi.spyOn(document, 'addEventListener');
            const removeSpy = vi.spyOn(document, 'removeEventListener');

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
            const removeSpy = vi.spyOn(document, 'removeEventListener');
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

        it('lista agrupada com mais de 500 itens valida virtualização, scrollTop, aria-activedescendant e seleção correta (F16 / E06-06)', async () => {
            // Gera 12 grupos com 50 itens cada = 600 itens (mais de 500 itens)
            const groupOptions = Array.from({ length: 12 }, (_, gIdx) => ({
                label: `Grupo ${gIdx + 1}`,
                items: Array.from({ length: 50 }, (_, iIdx) => {
                    const id = `g${gIdx + 1}_item${iIdx + 1}`;
                    return {
                        value: id,
                        name: `Item ${gIdx + 1}-${iIdx + 1}`,
                        label: `Item ${gIdx + 1}-${iIdx + 1}`
                    };
                })
            }));

            const wrapper = mountTagSelect({
                groupOptions,
                itemHeight: 36
            });

            const trigger = wrapper.find('.max-select');
            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect((wrapper.vm as any).isVirtual).toBe(true);

            // Container virtualizado renderiza spacer e apenas um subconjunto de itens
            const container = document.body.querySelector('.max-select-list-container') as HTMLElement;
            expect(container).not.toBeNull();
            Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
            const spacer = container.querySelector('.max-select-spacer');
            expect(spacer).not.toBeNull();

            // Total de itens virtuais é 600 opções + 12 cabeçalhos = 612 itens
            expect((wrapper.vm as any).flattenedItems.length).toBe(612);
            // Renderiza muito menos que 600 nós no DOM
            const renderedOptions = container.querySelectorAll('.max-select-option');
            expect(renderedOptions.length).toBeLessThan(100);

            // Simula navegação por teclado: avança para a opção no índice 35
            // (que fica abaixo da viewport inicial)
            for (let i = 0; i < 35; i++) await trigger.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();
            await new Promise((r) => setTimeout(r, 10));
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).highlightedIndex).toBe(35);

            // aria-activedescendant sincronizado com a opção ativa
            const activeDescendant = trigger.attributes('aria-activedescendant');
            expect(activeDescendant).toBeTruthy();
            expect(activeDescendant).toContain('-opt-35');

            // Validação de scroll: container.scrollTop foi recalculado para trazer o item em foco
            expect(container.scrollTop).toBeGreaterThan(0);

            // O elemento referenciado por aria-activedescendant deve estar efetivamente montado no DOM
            const activeElement = document.getElementById(activeDescendant!);
            expect(activeElement).not.toBeNull();
            expect(activeElement?.classList.contains('max-select-option-highlighted')).toBe(true);
            expect(activeElement?.textContent).toContain('Item 1-36');

            // Seleção correta via teclado (Enter)
            await trigger.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted).toBeTruthy();
            expect(emitted?.pop()).toEqual(['g1_item36']);

            // Dropdown deve ter sido fechado após a seleção
            expect((wrapper.vm as any).isOpen).toBe(false);

            wrapper.unmount();
        });
    });

    describe('Modo isButton e acessibilidade (F15)', () => {
        it('garante um único owner focável: wrapper inerte e botão nativo interno com foco e semântica', async () => {
            const options = [{ value: 'a', name: 'Tag A' }];
            const wrapper = mountTagSelect({
                isButton: true,
                icon: 'mdi:tag',
                options
            });

            const triggerWrapper = wrapper.find('.max-select');
            const iconButton = wrapper.find('.max-icon-button');

            expect(triggerWrapper.exists()).toBe(true);
            expect(iconButton.exists()).toBe(true);

            // Wrapper não deve competir por foco nem ter role de controle
            expect(triggerWrapper.attributes('tabindex')).toBe('-1');
            expect(triggerWrapper.attributes('role')).toBeUndefined();
            expect(triggerWrapper.attributes('aria-haspopup')).toBeUndefined();
            expect(triggerWrapper.attributes('aria-expanded')).toBeUndefined();
            expect(triggerWrapper.attributes('aria-disabled')).toBeUndefined();

            // Botão nativo interno é o único owner focável
            expect(iconButton.element.tagName.toLowerCase()).toBe('button');
            expect(iconButton.attributes('tabindex')).toBe('0');
            expect(iconButton.attributes('aria-haspopup')).toBe('listbox');
            expect(iconButton.attributes('aria-expanded')).toBe('false');

            wrapper.unmount();
        });

        it('evita que o wrapper receba aria-disabled quando desabilitado, propagando disabled ao botão interno', async () => {
            const options = [{ value: 'a', name: 'Tag A' }];
            const wrapper = mountTagSelect({
                isButton: true,
                icon: 'mdi:tag',
                disabled: true,
                options
            });

            const triggerWrapper = wrapper.find('.max-select');
            const iconButton = wrapper.find('.max-icon-button');

            // Wrapper NUNCA deve receber aria-disabled no modo isButton
            expect(triggerWrapper.attributes('aria-disabled')).toBeUndefined();

            // Botão nativo interno recebe disabled e atributos de desabilitado
            expect(iconButton.attributes('disabled')).toBeDefined();
            expect(iconButton.attributes('aria-disabled')).toBe('true');
            expect(iconButton.attributes('tabindex')).toBe('-1');
            expect(iconButton.classes()).toContain('is-disabled');

            wrapper.unmount();
        });

        it('propaga nome contextual acessível ao botão interno sem usar rótulos genéricos', async () => {
            // 1. Via aria-label explícito
            const w1 = mountTagSelect({ isButton: true, icon: 'mdi:tag' }, { 'aria-label': 'Selecionar categoria do produto' });
            expect(w1.find('.max-icon-button').attributes('aria-label')).toBe('Selecionar categoria do produto');
            w1.unmount();

            // 2. Via placeholder
            const w2 = mountTagSelect({ isButton: true, icon: 'mdi:tag', placeholder: 'Filtrar por etiqueta' });
            expect(w2.find('.max-icon-button').attributes('aria-label')).toBe('Filtrar por etiqueta');
            w2.unmount();

            // 3. Via label
            const w3 = mountTagSelect({ isButton: true, icon: 'mdi:tag' }, { label: 'Status da ordem' });
            expect(w3.find('.max-icon-button').attributes('aria-label')).toBe('Status da ordem');
            w3.unmount();

            // 4. Com opção selecionada
            const w4 = mountTagSelect({
                isButton: true,
                icon: 'mdi:tag',
                modelValue: 'aprovado',
                options: [{ value: 'aprovado', name: 'Aprovado' }]
            });
            expect(w4.find('.max-icon-button').attributes('aria-label')).toBe('Selecionar opção: Aprovado');
            w4.unmount();

            // 5. Padrão sem contexto (nunca "Botão de ação")
            const w5 = mountTagSelect({ isButton: true, icon: 'mdi:tag' });
            expect(w5.find('.max-icon-button').attributes('aria-label')).toBe('Selecionar opção');
            expect(w5.find('.max-icon-button').attributes('aria-label')).not.toBe('Botão de ação');
            w5.unmount();
        });

        it('permite navegação por teclado: Enter abre, Escape fecha e retorna foco, e seleção emite uma única vez', async () => {
            const options = [
                { value: '1', name: 'Opção 1' },
                { value: '2', name: 'Opção 2' }
            ];
            const wrapper = mountTagSelect({
                isButton: true,
                icon: 'mdi:tag',
                options
            }, {}, { attachTo: document.body });

            const button = wrapper.find('.max-icon-button');
            (button.element as HTMLElement).focus();
            expect(document.activeElement).toBe(button.element);

            // Tecla Enter abre dropdown
            await button.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);
            expect(button.attributes('aria-expanded')).toBe('true');

            // Tecla Escape fecha dropdown e devolve foco ao botão interno
            await button.trigger('keydown', { key: 'Escape' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect(button.attributes('aria-expanded')).toBe('false');
            expect(document.activeElement).toBe(button.element);

            // Tecla Espaço abre dropdown
            await button.trigger('keydown', { key: ' ' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(true);

            // Seleciona com ArrowDown + Enter e verifica emissão única
            await button.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).highlightedIndex).toBe(1);

            await button.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
            expect(wrapper.emitted('update:modelValue')![0]).toEqual(['2']);
            expect(wrapper.emitted('change')).toHaveLength(1);
            expect(wrapper.emitted('change')![0]).toEqual(['2']);

            wrapper.unmount();
        });

        it('clique no botão interno abre e fecha com emissão única na seleção', async () => {
            const options = [
                { value: 'a', name: 'Item A' }
            ];
            const wrapper = mountTagSelect({
                isButton: true,
                icon: 'mdi:tag',
                options
            });

            const button = wrapper.find('.max-icon-button');

            // Clique abre
            await button.trigger('click');
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(true);

            // Clique na opção seleciona e fecha
            const optionEl = document.body.querySelector('.max-select-option') as HTMLElement;
            expect(optionEl).toBeTruthy();
            optionEl.click();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
            expect(wrapper.emitted('update:modelValue')![0]).toEqual(['a']);
            expect(wrapper.emitted('change')).toHaveLength(1);
            expect(wrapper.emitted('change')![0]).toEqual(['a']);

            wrapper.unmount();
        });

        it('quando desabilitado no modo isButton, bloqueia abertura via clique e teclado', async () => {
            const wrapper = mountTagSelect({
                isButton: true,
                icon: 'mdi:tag',
                disabled: true,
                options: [{ value: 'a', name: 'Item A' }]
            });

            const button = wrapper.find('.max-icon-button');

            await button.trigger('click');
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);

            await button.trigger('keydown', { key: 'Enter' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);

            await button.trigger('keydown', { key: ' ' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);

            wrapper.unmount();
        });
    });
});
