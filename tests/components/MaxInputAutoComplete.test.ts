import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAutoComplete from '../../src/components/MaxInputAutoComplete.vue';

function mountAutoComplete(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAutoComplete, {
        props: { modelValue: '', options: [], ...props },
        attrs,
        global: {
            stubs: {
                InputBase: {
                    template: '<div class="input-base"><slot /></div>',
                    props: ['done', 'caution']
                }
            }
        }
    });
}

describe('MaxInputAutoComplete.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('deve renderizar o componente', () => {
        const wrapper = mountAutoComplete();
        expect(wrapper.exists()).toBe(true);
    });

    it('deve reagir à mudança de props', async () => {
        const wrapper = mountAutoComplete({
            options: [{ label: 'Opção 1', value: 'opt1' }]
        });
        await wrapper.setProps({ modelValue: 'opt1' });
        expect((wrapper.vm as any).temp_value).toBe('opt1');
    });

    it('calcula temp_value_string corretamente com string', () => {
        const wrapper = mountAutoComplete({ modelValue: 'string_value' });
        const vm = wrapper.vm as any;
        expect(vm.temp_value_string).toBe('string_value');
    });

    it('calcula temp_value_string corretamente com object', () => {
        const wrapper = mountAutoComplete({ modelValue: { value: 'obj_value' } });
        const vm = wrapper.vm as any;
        expect(vm.temp_value_string).toBe('obj_value');

        wrapper.vm.temp_value = { label: 'obj_label' };
        expect(vm.temp_value_string).toBe('obj_label');

        wrapper.vm.temp_value = { id: 'obj_id' };
        expect(vm.temp_value_string).toBe('obj_id');

        wrapper.vm.temp_value = {};
        expect(vm.temp_value_string).toBe('');
    });

    it('retorna string vazia se temp_value não for string/object com prop', () => {
        const wrapper = mountAutoComplete({ modelValue: null });
        const vm = wrapper.vm as any;
        expect(vm.temp_value_string).toBe('');
    });

    it('calcula isDone e caution corretamente no blur', async () => {
        const wrapper = mountAutoComplete({ required: true, modelValue: '' });
        await wrapper.find('input').trigger('blur');

        expect((wrapper.vm as any).isDone).toBe(false);
        expect((wrapper.vm as any).caution).toBe(true);
    });

    it('calcula isDone = true quando required e tem valor no blur', async () => {
        const wrapper = mountAutoComplete({ required: true, modelValue: 'algum valor' });
        await wrapper.find('input').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('respeita prop done explícita', async () => {
        const wrapper = mountAutoComplete({ done: true });
        await wrapper.find('input').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('executa search e filtra corretamente', async () => {
        const options = [
            { label: 'Maçã', value: 'apple' },
            { name: 'Banana', value: 'banana' }
        ];
        const wrapper = mountAutoComplete({ modelValue: 'açã', options });

        const input = wrapper.find('input');
        await input.setValue('açã');

        const filtered = (wrapper.vm as any).filtered_values;
        expect(filtered.length).toBe(1);
        expect(filtered[0].value).toBe('apple');
    });

    it('emite update:modelValue apenas se for object', async () => {
        const wrapper = mountAutoComplete();

        // Atribuindo string, NÃO deve emitir (Auto-complete cuida disso)
        (wrapper.vm as any).temp_value = 'some_str';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();

        // Atribuindo object, DEVE emitir
        const obj = { value: 'val' };
        (wrapper.vm as any).temp_value = obj;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toEqual(obj);
    });

    it('renderiza o slot de option corretamente', async () => {
        const options = [{ label: 'Item Label', subLabel: 'Sub Label Item' }];
        const wrapper = mountAutoComplete({ options, optionLabel: 'label' });

        const input = wrapper.find('input');
        await input.setValue('Item');
        await wrapper.vm.$nextTick();

        const labelEl = document.body.querySelector('.autocomplete-item-select-label');
        const subLabelEl = document.body.querySelector('.autocomplete-item-select-sub-label');

        expect(labelEl?.textContent?.trim()).toBe('Item Label');
        expect(subLabelEl?.textContent?.trim()).toBe('Sub Label Item');
    });

    it('testIsDone fallback para null se nada casar', () => {
        const wrapper = mountAutoComplete();
        const done = (wrapper.vm as any).testIsDone();
        expect(done).toBeNull();
    });

    it('testIsDone usa caution prop invertida se nulo mas caution defined', () => {
        const wrapper = mountAutoComplete({ caution: false });
        const done = (wrapper.vm as any).testIsDone();
        expect(done).toBe(true);
    });

    it('caution computed quando isDone é falso mas caution é passado via prop', () => {
        const wrapper = mountAutoComplete({ caution: true, done: false });
        expect((wrapper.vm as any).caution).toBe(true);
    });
});

describe('MaxInputAutoComplete.vue — forceSelection', () => {
    const option = { name: 'Sao Paulo', value: 'SP' };

    function mountReal(props: Record<string, any> = {}) {
        return mount(MaxInputAutoComplete, {
            props: { modelValue: option, options: [option], ...props },
            attachTo: document.body,
            global: {
                stubs: {
                    InputBase: {
                        template: '<div class="input-base"><slot /></div>',
                        props: ['done', 'caution']
                    }
                }
            }
        });
    }

    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const typeAndChange = async (wrapper: any, texto: string) => {
        const input = wrapper.find('input');
        (input.element as HTMLInputElement).value = texto;
        await input.trigger('input');
        await input.trigger('change');
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        return input;
    };

    it('regressão: texto sem correspondência não deixa o campo vazio com o pai preso no valor antigo', async () => {
        const wrapper = mountReal();
        await wrapper.vm.$nextTick();

        const input = await typeAndChange(wrapper, 'texto que nao existe');

        // O valor anterior é restaurado: nem campo vazio, nem dessincronia.
        expect((wrapper.vm as any).temp_value).toEqual(option);
        expect((input.element as HTMLInputElement).value).toBe(option.name);

        wrapper.unmount();
    });

    it('limpeza intencional emite update:modelValue null e não restaura', async () => {
        const wrapper = mountReal();
        await wrapper.vm.$nextTick();

        await typeAndChange(wrapper, '');

        expect((wrapper.vm as any).temp_value).toBeFalsy();
        const emitidos = wrapper.emitted('update:modelValue');
        expect(emitidos?.[emitidos.length - 1][0]).toBeNull();

        wrapper.unmount();
    });

    it('escape hatch: com force-selection false o texto digitado permanece', async () => {
        const wrapper = mountReal({ forceSelection: false });
        await wrapper.vm.$nextTick();

        const input = await typeAndChange(wrapper, 'texto livre');

        expect((input.element as HTMLInputElement).value).toBe('texto livre');
        expect((wrapper.vm as any).temp_value).toBe('texto livre');

        wrapper.unmount();
    });

    it('restore-on-invalid false: emite null em vez de restaurar', async () => {
        const wrapper = mountReal({ restoreOnInvalid: false });
        await wrapper.vm.$nextTick();

        await typeAndChange(wrapper, 'texto que nao existe');

        expect((wrapper.vm as any).temp_value).toBeFalsy();
        const emitidos = wrapper.emitted('update:modelValue');
        expect(emitidos?.[emitidos.length - 1][0]).toBeNull();

        wrapper.unmount();
    });

    it('compatibilidade: selecionar uma opção continua emitindo o objeto', async () => {
        const wrapper = mountReal({ modelValue: '' });
        await wrapper.vm.$nextTick();

        (wrapper.vm as any).temp_value = option;
        await wrapper.vm.$nextTick();

        const emitidos = wrapper.emitted('update:modelValue');
        expect(emitidos?.[emitidos.length - 1][0]).toEqual(option);

        wrapper.unmount();
    });
});
