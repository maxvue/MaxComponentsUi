import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxListBox from '../../src/components/MaxListBox.vue';

const OPTIONS = [
    { value: 1, label: 'Alfa', sub_label: 'primeiro' },
    { value: 2, label: 'Beta', sub_label: 'segundo' },
    { value: 3, label: 'Gama', sub_label: 'terceiro', disabled: true }
];

function mountListBox(props: Record<string, any> = {}) {
    return mount(MaxListBox, {
        props: { modelValue: null, options: OPTIONS, ...props }
    });
}

describe('MaxListBox - renderizacao e selecao', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza um item por opcao', () => {
        const wrapper = mountListBox();
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(3);
    });

    it('exibe label e sublabel', () => {
        const wrapper = mountListBox();
        const first = wrapper.findAll('.max-listbox-item')[0];
        expect(first.text()).toContain('Alfa');
        expect(first.text()).toContain('primeiro');
    });

    it('respeita optionLabel e optionValue customizados', () => {
        const wrapper = mountListBox({
            options: [{ id: 10, nome: 'Custom' }],
            optionValue: 'id',
            optionLabel: 'nome'
        });
        expect(wrapper.find('.max-listbox-item').text()).toContain('Custom');
    });

    it('emite update:modelValue e change ao clicar', async () => {
        const wrapper = mountListBox();
        await wrapper.findAll('.max-listbox-item')[1].trigger('click');

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);
        expect(wrapper.emitted('change')?.[0][0]).toEqual({ value: 2, option: OPTIONS[1] });
    });

    it('nao emite ao clicar em item desabilitado', async () => {
        const wrapper = mountListBox();
        await wrapper.findAll('.max-listbox-item')[2].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('marca aria-selected no item correspondente ao modelValue', () => {
        const wrapper = mountListBox({ modelValue: 2 });
        const items = wrapper.findAll('.max-listbox-item');

        expect(items[1].attributes('aria-selected')).toBe('true');
        expect(items[0].attributes('aria-selected')).toBe('false');
    });

    it('marca aria-disabled no item desabilitado', () => {
        const wrapper = mountListBox();
        expect(wrapper.findAll('.max-listbox-item')[2].attributes('aria-disabled')).toBe('true');
    });

    it('usa selectedOption quando o valor nao esta na lista', () => {
        const wrapper = mountListBox({ modelValue: 99, selectedOption: { value: 99, label: 'Externo' } });
        expect(wrapper.text()).toContain('Externo');
    });

    it('exibe emptyMessage quando nao ha opcoes', () => {
        const wrapper = mountListBox({ options: [], emptyMessage: 'Nada aqui' });
        expect(wrapper.text()).toContain('Nada aqui');
    });

    it('nao emite quando o painel esta disabled', async () => {
        const wrapper = mountListBox({ disabled: true });
        await wrapper.findAll('.max-listbox-item')[0].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('renderiza o slot option customizado', () => {
        const wrapper = mount(MaxListBox, {
            props: { modelValue: null, options: OPTIONS },
            slots: { option: '<template #option="{ option }"><b class="custom">{{ option.label }}</b></template>' }
        });
        expect(wrapper.findAll('.custom')).toHaveLength(3);
    });

    it('renderiza os slots header e footer', () => {
        const wrapper = mount(MaxListBox, {
            props: { modelValue: null, options: OPTIONS },
            slots: { header: '<div class="hdr">Topo</div>', footer: '<div class="ftr">Base</div>' }
        });
        expect(wrapper.find('.hdr').exists()).toBe(true);
        expect(wrapper.find('.ftr').exists()).toBe(true);
    });

    it('renderiza o titulo quando a prop title e informada', () => {
        const wrapper = mountListBox({ title: 'Registros' });
        expect(wrapper.text()).toContain('Registros');
    });

    it('aplica role listbox e option', () => {
        const wrapper = mountListBox();
        expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
        expect(wrapper.findAll('[role="option"]')).toHaveLength(3);
    });
});
