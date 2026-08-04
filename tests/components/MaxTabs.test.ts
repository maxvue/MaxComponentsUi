import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTabs from '../../src/components/MaxTabs.vue';
import MaxTabList from '../../src/components/MaxTabList.vue';
import MaxTab from '../../src/components/MaxTab.vue';

/** Monta a estrutura completa de headers usada nos testes de teclado. */
const mountTabList = (props: Record<string, unknown> = {}) => mount(MaxTabs, {
    props: { value: '0', ...props },
    slots: {
        default: `
            <MaxTabList>
                <MaxTab value="0">Um</MaxTab>
                <MaxTab value="1" disabled>Dois</MaxTab>
                <MaxTab value="2">Tres</MaxTab>
            </MaxTabList>
        `
    },
    global: { components: { MaxTabList, MaxTab } }
});

describe('MaxTabs', () => {
    it('renderiza o slot default dentro da raiz', () => {
        const wrapper = mount(MaxTabs, {
            props: { value: '0' },
            slots: { default: '<div class="filho">Conteudo</div>' }
        });
        expect(wrapper.find('.max-tabs').exists()).toBe(true);
        expect(wrapper.find('.filho').exists()).toBe(true);
    });

    it('emite update:value quando um filho chama select', () => {
        const wrapper = mount(MaxTabs, {
            props: { value: '0' },
            slots: { default: '<div class="filho">Conteudo</div>' }
        });
        // Acessa o contexto exposto para simular a seleção feita por um MaxTab.
        wrapper.vm.select('1');
        expect(wrapper.emitted('update:value')).toBeTruthy();
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['1']);
    });

    it('nao muta o proprio value (componente controlado)', () => {
        const wrapper = mount(MaxTabs, {
            props: { value: '0' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.select('1');
        expect(wrapper.props('value')).toBe('0');
    });
});

describe('MaxTab', () => {
    it('marca o tab ativo com aria-selected', () => {
        const wrapper = mountTabList();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('aria-selected')).toBe('true');
        expect(tabs[2].attributes('aria-selected')).toBe('false');
    });

    it('aplica role e aria-controls ligando ao painel', () => {
        const wrapper = mountTabList();
        const tab = wrapper.find('.max-tab');
        expect(tab.attributes('role')).toBe('tab');
        expect(tab.attributes('aria-controls')).toContain('-panel-0');
    });

    it('emite update:value ao clicar', async () => {
        const wrapper = mountTabList();
        await wrapper.findAll('.max-tab')[2].trigger('click');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });

    it('nao emite ao clicar num tab desabilitado', async () => {
        const wrapper = mountTabList();
        await wrapper.findAll('.max-tab')[1].trigger('click');
        expect(wrapper.emitted('update:value')).toBeFalsy();
    });

    it('marca aria-disabled no tab desabilitado', () => {
        const wrapper = mountTabList();
        expect(wrapper.findAll('.max-tab')[1].attributes('aria-disabled')).toBe('true');
    });

    it('so mantem o tab ativo no fluxo de tabulacao', () => {
        const wrapper = mountTabList();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('tabindex')).toBe('0');
        expect(tabs[2].attributes('tabindex')).toBe('-1');
    });
});

describe('MaxTabList', () => {
    it('aplica role tablist', () => {
        const wrapper = mountTabList();
        expect(wrapper.find('.max-tab-list').attributes('role')).toBe('tablist');
    });

    it('seta a direita pula o tab desabilitado', async () => {
        const wrapper = mountTabList({ selectOnFocus: true });
        await wrapper.findAll('.max-tab')[0].trigger('keydown', { key: 'ArrowRight' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });

    it('Home vai para o primeiro tab habilitado', async () => {
        const wrapper = mountTabList({ selectOnFocus: true, value: '2' });
        await wrapper.findAll('.max-tab')[2].trigger('keydown', { key: 'Home' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['0']);
    });

    it('End vai para o ultimo tab habilitado', async () => {
        const wrapper = mountTabList({ selectOnFocus: true });
        await wrapper.findAll('.max-tab')[0].trigger('keydown', { key: 'End' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });

    it('Enter ativa o tab focado', async () => {
        const wrapper = mountTabList();
        await wrapper.findAll('.max-tab')[2].trigger('keydown', { key: 'Enter' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });
});
