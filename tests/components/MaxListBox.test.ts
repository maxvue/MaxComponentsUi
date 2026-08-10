import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('MaxListBox - modo API', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    function page(n: number, size = 3) {
        return Array.from({ length: size }, (_, i) => ({ value: n * 100 + i, label: `P${n}I${i}` }));
    }

    async function flush() {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    it('chama loadOptions na montagem com page 1', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });
        mountListBox({ options: undefined, loadOptions, pageSize: 25 });
        await flush();

        expect(loadOptions).toHaveBeenCalledWith({ page: 1, search: '', pageSize: 25 });
    });

    it('renderiza os itens retornados pela API', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(3);
        expect(wrapper.text()).toContain('P1I0');
    });

    it('ignora options quando loadOptions esta definido', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });
        const wrapper = mountListBox({ options: OPTIONS, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).not.toContain('Alfa');
        expect(wrapper.text()).toContain('P1I0');
    });

    it('refaz a busca do zero ao filtrar, enviando o termo', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: true });
        const wrapper = mountListBox({ options: undefined, loadOptions, filter: true });
        await flush();

        await wrapper.find('input').setValue('teste');
        await new Promise((resolve) => setTimeout(resolve, 350));

        expect(loadOptions).toHaveBeenLastCalledWith({ page: 1, search: 'teste', pageSize: 50 });
    });

    it('descarta resposta fora de ordem', async () => {
        let resolveFirst: (v: any) => void = () => {};
        const loadOptions = vi.fn()
            .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
            .mockResolvedValueOnce({ items: [{ value: 9, label: 'Recente' }], hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions, filter: true });

        await wrapper.find('input').setValue('novo');
        await new Promise((resolve) => setTimeout(resolve, 350));
        await flush();

        // a primeira requisicao (obsoleta) responde depois da segunda
        resolveFirst({ items: [{ value: 1, label: 'Obsoleto' }], hasMore: false });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Recente');
        expect(wrapper.text()).not.toContain('Obsoleto');
    });

    it('emite load-error quando loadOptions rejeita', async () => {
        const loadOptions = vi.fn().mockRejectedValue(new Error('falhou'));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();

        expect(wrapper.emitted('load-error')).toBeTruthy();
    });

    it('exibe o botao de retry apos erro', async () => {
        const loadOptions = vi.fn().mockRejectedValue(new Error('falhou'));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-listbox-retry').exists()).toBe(true);
    });

    it('retry refaz a mesma pagina', async () => {
        const loadOptions = vi.fn().mockRejectedValue(new Error('falhou'));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        loadOptions.mockResolvedValueOnce({ items: page(1), hasMore: false });
        await wrapper.find('.max-listbox-retry').trigger('click');
        await flush();

        expect(loadOptions).toHaveBeenLastCalledWith({ page: 1, search: '', pageSize: 50 });
    });

    it('deriva hasMore a partir de total', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), total: 10 });
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        // 3 carregados de 10 -> ainda ha mais
        expect(wrapper.find('.max-listbox-loader').exists()).toBe(true);
    });

    it('exibe o loader durante o carregamento inicial', async () => {
        const loadOptions = vi.fn().mockImplementation(() => new Promise(() => {}));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-listbox-loader').exists()).toBe(true);
    });
});

describe('MaxListBox - scroll infinito', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    async function flush() {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    function page(n: number, size = 3) {
        return Array.from({ length: size }, (_, i) => ({ value: n * 100 + i, label: `P${n}I${i}` }));
    }

    /** Simula o usuário rolando até o fim da lista. */
    async function scrollToBottom(wrapper: any) {
        const list = wrapper.find('.max-listbox-list');
        Object.defineProperty(list.element, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list.element, 'clientHeight', { value: 400, configurable: true });
        Object.defineProperty(list.element, 'scrollTop', { value: 600, configurable: true, writable: true });
        await list.trigger('scroll');
    }

    it('carrega a proxima pagina ao rolar ate o fim', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockResolvedValueOnce({ items: page(2), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenLastCalledWith({ page: 2, search: '', pageSize: 50 });
    });

    it('acumula os itens das paginas carregadas', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockResolvedValueOnce({ items: page(2), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(6);
    });

    it('para de carregar quando hasMore e false', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenCalledTimes(1);
    });

    it('nao dispara requisicao duplicada com uma ja em voo', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockImplementationOnce(() => new Promise(() => {}));

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await scrollToBottom(wrapper);
        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenCalledTimes(2);
    });

    it('nao dispara scroll infinito no modo local', async () => {
        const wrapper = mountListBox({ options: OPTIONS });
        await scrollToBottom(wrapper);
        await flush();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(3);
    });

    it('para de carregar apos um erro', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockRejectedValueOnce(new Error('falhou'));

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenCalledTimes(2);
    });
});

describe('MaxListBox - preenchimento automatico do painel', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    async function flush() {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    function page(n: number, size = 3) {
        return Array.from({ length: size }, (_, i) => ({ value: n * 100 + i, label: `P${n}I${i}` }));
    }

    /** Marca o painel como "curto": conteúdo não preenche a altura visível. */
    function markAsShort(wrapper: any) {
        const list = wrapper.find('.max-listbox-list');
        Object.defineProperty(list.element, 'clientHeight', { value: 400, configurable: true });
        Object.defineProperty(list.element, 'scrollHeight', { value: 120, configurable: true });
    }

    /** Marca o painel como "cheio": conteúdo já preenche (e excede) a altura visível. */
    function markAsFilled(wrapper: any) {
        const list = wrapper.find('.max-listbox-list');
        Object.defineProperty(list.element, 'clientHeight', { value: 400, configurable: true });
        Object.defineProperty(list.element, 'scrollHeight', { value: 1000, configurable: true });
    }

    it('busca a proxima pagina quando a primeira nao preenche o painel, sem nenhum evento de scroll', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockResolvedValueOnce({ items: page(2), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        markAsShort(wrapper);
        await flush();
        await wrapper.vm.$nextTick();
        await flush();
        await wrapper.vm.$nextTick();

        expect(loadOptions).toHaveBeenCalledTimes(2);
        expect(loadOptions).toHaveBeenLastCalledWith({ page: 2, search: '', pageSize: 50 });
    });

    it('para a cadeia de auto-preenchimento quando hasMore fica false', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockResolvedValueOnce({ items: page(2), hasMore: true })
            .mockResolvedValueOnce({ items: page(3), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        markAsShort(wrapper);
        await flush();
        await wrapper.vm.$nextTick();
        await flush();
        await wrapper.vm.$nextTick();
        await flush();
        await wrapper.vm.$nextTick();

        expect(loadOptions).toHaveBeenCalledTimes(3);

        // Mais um ciclo de flush/tick nao deve gerar chamadas extras.
        await flush();
        await wrapper.vm.$nextTick();
        expect(loadOptions).toHaveBeenCalledTimes(3);
    });

    it('nao busca pagina extra quando a primeira pagina ja preenche o painel', async () => {
        const loadOptions = vi.fn().mockResolvedValueOnce({ items: page(1), hasMore: true });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        markAsFilled(wrapper);
        await flush();
        await wrapper.vm.$nextTick();
        await flush();
        await wrapper.vm.$nextTick();

        expect(loadOptions).toHaveBeenCalledTimes(1);
    });
});

describe('MaxListBox - teclado', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('a lista e focavel', () => {
        const wrapper = mountListBox();
        expect(wrapper.find('.max-listbox-list').attributes('tabindex')).toBe('0');
    });

    it('seta para baixo move o foco para o primeiro item', async () => {
        const wrapper = mountListBox();
        await wrapper.find('.max-listbox-list').trigger('keydown', { key: 'ArrowDown' });

        expect(wrapper.findAll('.max-listbox-item')[0].classes()).toContain('is-focused');
    });

    it('seta para baixo duas vezes move para o segundo item', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: 'ArrowDown' });

        expect(wrapper.findAll('.max-listbox-item')[1].classes()).toContain('is-focused');
    });

    it('seta para cima nao passa do primeiro item', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: 'ArrowUp' });
        await list.trigger('keydown', { key: 'ArrowUp' });

        expect(wrapper.findAll('.max-listbox-item')[0].classes()).toContain('is-focused');
    });

    it('Enter seleciona o item em foco', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });

    it('Espaco seleciona o item em foco', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: ' ' });

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });

    it('Enter nao seleciona item desabilitado', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        // terceiro item (indice 2) esta disabled
        await list.trigger('keydown', { key: 'End' });
        await list.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('Home vai para o primeiro item e End para o ultimo', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');

        await list.trigger('keydown', { key: 'End' });
        expect(wrapper.findAll('.max-listbox-item')[2].classes()).toContain('is-focused');

        await list.trigger('keydown', { key: 'Home' });
        expect(wrapper.findAll('.max-listbox-item')[0].classes()).toContain('is-focused');
    });

    it('nao reage ao teclado quando disabled', async () => {
        const wrapper = mountListBox({ disabled: true });
        await wrapper.find('.max-listbox-list').trigger('keydown', { key: 'ArrowDown' });

        expect(wrapper.find('.is-focused').exists()).toBe(false);
    });

    it('aplica aria-activedescendant no item em foco', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });

        const active = list.attributes('aria-activedescendant');
        expect(active).toBeTruthy();
        expect(wrapper.findAll('.max-listbox-item')[0].attributes('id')).toBe(active);
    });
});
