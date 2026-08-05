import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import MaxTabs from '../../src/components/MaxTabs.vue';
import MaxTabList from '../../src/components/MaxTabList.vue';
import MaxTab from '../../src/components/MaxTab.vue';
import MaxTabPanels from '../../src/components/MaxTabPanels.vue';
import MaxTabPanel from '../../src/components/MaxTabPanel.vue';

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

    it('sem value, o primeiro tab recebe tabindex 0 e os demais -1', async () => {
        const wrapper = mountTabList({ value: undefined });
        // O registro dos tabs no contexto acontece no onMounted de cada
        // MaxTab, entao o fallback so fica visivel no DOM apos um tick.
        await nextTick();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('tabindex')).toBe('0');
        expect(tabs[1].attributes('tabindex')).toBe('-1');
        expect(tabs[2].attributes('tabindex')).toBe('-1');
    });

    it('sem value e com o primeiro tab desabilitado, o primeiro habilitado recebe tabindex 0', async () => {
        const wrapper = mount(MaxTabs, {
            props: { value: undefined },
            slots: {
                default: `
                    <MaxTabList>
                        <MaxTab value="0" disabled>Um</MaxTab>
                        <MaxTab value="1">Dois</MaxTab>
                        <MaxTab value="2">Tres</MaxTab>
                    </MaxTabList>
                `
            },
            global: { components: { MaxTabList, MaxTab } }
        });
        await nextTick();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('tabindex')).toBe('-1');
        expect(tabs[1].attributes('tabindex')).toBe('0');
        expect(tabs[2].attributes('tabindex')).toBe('-1');
    });

    it('com value orfao (sem tab correspondente), o primeiro tab habilitado recebe tabindex 0', async () => {
        const wrapper = mountTabList({ value: 'zzz' });
        await nextTick();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('tabindex')).toBe('0');
        expect(tabs[1].attributes('tabindex')).toBe('-1');
        expect(tabs[2].attributes('tabindex')).toBe('-1');
    });

    it('com value orfao e o primeiro tab desabilitado, o primeiro habilitado recebe tabindex 0', async () => {
        const wrapper = mount(MaxTabs, {
            props: { value: 'zzz' },
            slots: {
                default: `
                    <MaxTabList>
                        <MaxTab value="0" disabled>Um</MaxTab>
                        <MaxTab value="1">Dois</MaxTab>
                        <MaxTab value="2">Tres</MaxTab>
                    </MaxTabList>
                `
            },
            global: { components: { MaxTabList, MaxTab } }
        });
        await nextTick();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('tabindex')).toBe('-1');
        expect(tabs[1].attributes('tabindex')).toBe('0');
        expect(tabs[2].attributes('tabindex')).toBe('-1');
    });

    it('com value valido, so o tab ativo tem tabindex 0, inclusive apos o registro popular (nextTick)', async () => {
        const wrapper = mountTabList();
        const tabs_sync = wrapper.findAll('.max-tab');
        expect(tabs_sync[0].attributes('tabindex')).toBe('0');
        expect(tabs_sync[2].attributes('tabindex')).toBe('-1');
        await nextTick();
        const tabs_after_tick = wrapper.findAll('.max-tab');
        expect(tabs_after_tick[0].attributes('tabindex')).toBe('0');
        expect(tabs_after_tick[1].attributes('tabindex')).toBe('-1');
        expect(tabs_after_tick[2].attributes('tabindex')).toBe('-1');
    });

    it('tab ativo removido dinamicamente da lista: o fallback assume e o tablist continua alcancavel', async () => {
        // Componente hospedeiro com estado reativo proprio, controlando quais
        // tabs existem — simula uma lista dinamica onde o tab ativo e removido
        // em runtime, deixando o value do MaxTabs orfao sem o pai muda-lo.
        const Host = {
            components: { MaxTabs, MaxTabList, MaxTab },
            data: () => ({ show_middle: true }),
            template: `
                <MaxTabs value="1">
                    <MaxTabList>
                        <MaxTab value="0">Um</MaxTab>
                        <MaxTab v-if="show_middle" value="1">Dois</MaxTab>
                        <MaxTab value="2">Tres</MaxTab>
                    </MaxTabList>
                </MaxTabs>
            `
        };
        const wrapper = mount(Host);
        await nextTick();
        // Antes da remocao, o tab '1' (ativo) e o unico alcancavel.
        expect(wrapper.findAll('.max-tab')[1].attributes('tabindex')).toBe('0');

        // Remove o tab '1' da lista dinamicamente; o MaxTabs continua com value="1", agora orfao.
        wrapper.vm.show_middle = false;
        await nextTick();
        await nextTick();

        const tabs = wrapper.findAll('.max-tab');
        expect(tabs.length).toBe(2);
        // Nenhum tab casa mais com o value '1': o primeiro habilitado assume o fallback.
        expect(tabs[0].attributes('tabindex')).toBe('0');
        expect(tabs[1].attributes('tabindex')).toBe('-1');
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

/** Monta a estrutura completa de tabs com painéis. */
const mountFull = (props: Record<string, unknown> = {}) => mount(MaxTabs, {
    props: { value: '0', ...props },
    slots: {
        default: `
            <MaxTabList>
                <MaxTab value="0">Um</MaxTab>
                <MaxTab value="1">Dois</MaxTab>
            </MaxTabList>
            <MaxTabPanels>
                <MaxTabPanel value="0"><span class="p0">Painel Um</span></MaxTabPanel>
                <MaxTabPanel value="1"><span class="p1">Painel Dois</span></MaxTabPanel>
            </MaxTabPanels>
        `
    },
    global: { components: { MaxTabList, MaxTab, MaxTabPanels, MaxTabPanel } }
});

describe('MaxTabPanel', () => {
    it('mostra apenas o painel do tab ativo', () => {
        const wrapper = mountFull();
        expect(wrapper.find('.p0').isVisible()).toBe(true);
        expect(wrapper.find('.p1').isVisible()).toBe(false);
    });

    it('troca o painel visivel quando value muda', async () => {
        const wrapper = mountFull();
        await wrapper.setProps({ value: '1' });
        expect(wrapper.find('.p0').isVisible()).toBe(false);
        expect(wrapper.find('.p1').isVisible()).toBe(true);
    });

    it('aplica role tabpanel e aria-labelledby apontando ao header', () => {
        const wrapper = mountFull();
        const panel = wrapper.find('.max-tab-panel');
        expect(panel.attributes('role')).toBe('tabpanel');
        expect(panel.attributes('aria-labelledby')).toContain('-tab-0');
    });

    it('com lazy, o painel inativo nunca foi montado', () => {
        const wrapper = mountFull({ lazy: true });
        expect(wrapper.find('.p1').exists()).toBe(false);
    });

    it('sem lazy, o painel inativo permanece no DOM apenas oculto', () => {
        const wrapper = mountFull();
        const panels = wrapper.findAll('.max-tab-panel');
        expect(panels.length).toBe(2);
    });

    it('com lazy, painel ja visitado continua montado apos sair', async () => {
        const wrapper = mountFull({ lazy: true });
        await wrapper.setProps({ value: '1' });
        await wrapper.setProps({ value: '0' });
        expect(wrapper.findAll('.max-tab-panel').length).toBe(2);
    });
});
