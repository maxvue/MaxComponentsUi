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

describe('MaxListBox - filtro local', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('nao renderiza o campo de busca por padrao', () => {
        const wrapper = mountListBox();
        expect(wrapper.find('input').exists()).toBe(false);
    });

    it('renderiza o campo de busca quando filter e true', () => {
        const wrapper = mountListBox({ filter: true });
        expect(wrapper.find('input').exists()).toBe(true);
    });

    it('filtra os itens pelo label', async () => {
        const wrapper = mountListBox({ filter: true });
        await wrapper.find('input').setValue('alf');
        await wrapper.vm.$nextTick();

        const items = wrapper.findAll('.max-listbox-item');
        expect(items).toHaveLength(1);
        expect(items[0].text()).toContain('Alfa');
    });

    it('filtra ignorando acentos e caixa', async () => {
        const wrapper = mountListBox({
            filter: true,
            options: [{ value: 1, label: 'Órgão Público' }, { value: 2, label: 'Outro' }]
        });
        await wrapper.find('input').setValue('ORGAO');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(1);
    });

    it('filtra tambem pelo sublabel', async () => {
        const wrapper = mountListBox({ filter: true });
        await wrapper.find('input').setValue('segundo');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')[0].text()).toContain('Beta');
    });

    it('respeita filterFields customizado', async () => {
        const wrapper = mountListBox({
            filter: true,
            filterFields: ['codigo'],
            options: [{ value: 1, label: 'Alfa', codigo: 'X9' }, { value: 2, label: 'Beta', codigo: 'Y7' }]
        });
        await wrapper.find('input').setValue('y7');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(1);
        expect(wrapper.findAll('.max-listbox-item')[0].text()).toContain('Beta');
    });

    it('exibe emptyMessage quando o filtro nao casa com nada', async () => {
        const wrapper = mountListBox({ filter: true, emptyMessage: 'Nada aqui' });
        await wrapper.find('input').setValue('zzzz');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(0);
        expect(wrapper.text()).toContain('Nada aqui');
    });

    it('emite filter apos o debounce de 300ms', async () => {
        const wrapper = mountListBox({ filter: true });
        await wrapper.find('input').setValue('alf');

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(wrapper.emitted('filter')).toBeFalsy();

        await new Promise((resolve) => setTimeout(resolve, 250));

        expect(wrapper.emitted('filter')).toHaveLength(1);
        expect(wrapper.emitted('filter')?.[0]).toEqual(['alf']);
    });

    it('nao fixa selectedOption que nao casa com o termo de busca ativo', async () => {
        const wrapper = mountListBox({
            filter: true,
            selectedOption: { value: 99, label: 'Externo' }
        });
        await wrapper.find('input').setValue('alf');
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).not.toContain('Externo');
    });

    it('fixa selectedOption quando ele casa com o termo de busca ativo', async () => {
        const wrapper = mountListBox({
            filter: true,
            selectedOption: { value: 99, label: 'Externo' }
        });
        await wrapper.find('input').setValue('exter');
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Externo');
    });

    it('mantem selectedOption fixado quando o termo de busca esta vazio', () => {
        const wrapper = mountListBox({
            filter: true,
            selectedOption: { value: 99, label: 'Externo' }
        });

        expect(wrapper.text()).toContain('Externo');
    });
});

describe('MaxListBox - virtual scroll', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    function manyOptions(n: number) {
        return Array.from({ length: n }, (_, i) => ({ value: i, label: `Item ${i}` }));
    }

    it('renderiza todos os itens abaixo do threshold', () => {
        const wrapper = mountListBox({ options: manyOptions(50) });
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(50);
    });

    it('nao virtualiza automaticamente em 500 itens', () => {
        const wrapper = mountListBox({ options: manyOptions(500) });
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(500);
    });

    it('virtualiza automaticamente acima de 500 itens', () => {
        const wrapper = mountListBox({ options: manyOptions(501) });
        expect(wrapper.findAll('.max-listbox-item').length).toBeLessThan(501);
    });

    it('respeita virtualScrollThreshold customizado', () => {
        const wrapper = mountListBox({ options: manyOptions(30), virtualScrollThreshold: 10 });
        expect(wrapper.findAll('.max-listbox-item').length).toBeLessThan(30);
    });

    it('virtualiza quando virtualScroll e true, mesmo em lista pequena', () => {
        const wrapper = mountListBox({ options: manyOptions(100), virtualScroll: true, itemHeight: 44 });
        expect(wrapper.findAll('.max-listbox-item').length).toBeLessThan(100);
    });

    it('nao virtualiza quando virtualScroll e false, mesmo em lista grande', () => {
        const wrapper = mountListBox({ options: manyOptions(600), virtualScroll: false });
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(600);
    });

    it('renderiza o spacer com a altura total quando virtualizado', () => {
        const wrapper = mountListBox({ options: manyOptions(1000), itemHeight: 44 });
        const spacer = wrapper.find('.max-listbox-spacer');

        expect(spacer.exists()).toBe(true);
        expect(spacer.attributes('style')).toContain('44000px');
    });

    it('mantem a selecao funcionando com virtualizacao ativa', async () => {
        const wrapper = mountListBox({ options: manyOptions(1000) });
        await wrapper.findAll('.max-listbox-item')[0].trigger('click');

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0]);
    });
});
