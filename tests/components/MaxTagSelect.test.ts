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
                MaxIconButton: { template: '<button class="max-icon-button-stub"></button>', props: ['icon', 'i', 'size'] }
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

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const optionEl = document.body.querySelector('.p-select-option') as HTMLElement;
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
});

