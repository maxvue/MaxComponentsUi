import { describe, it, expect, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import MaxTabs from '../../src/components/MaxTabs.vue';
import MaxTabItem from '../../src/components/MaxTabItem.vue';

/** Aguarda os setTimeout(0/10) internos do registro das abas. */
const settle = () => new Promise((r) => setTimeout(r, 25));

/** Monta MaxTabs + itens no documento (teleport do título exige alvo no DOM). */
const mountTabs = (slots: string, props: Record<string, unknown> = {}) =>
    mount(MaxTabs, {
        props: { id: 'test-tabs', cached: false, value: 'a', ...props },
        slots: { default: slots },
        global: { components: { MaxTabItem } },
        attachTo: document.body
    });

describe('MaxTabItem — disabled', () => {
    it('marca o titulo com o atributo disabled', async () => {
        const wrapper = mountTabs(`
            <MaxTabItem value="a" title="Um" />
            <MaxTabItem value="b" title="Dois" disabled />
        `);
        await settle();
        const titles = wrapper.findAll('.max-tab-item-title');
        expect(titles[0].attributes('disabled')).toBeUndefined();
        expect(titles[1].attributes('disabled')).toBeDefined();
        wrapper.unmount();
    });

    it('clique em aba desabilitada nao troca a aba ativa', async () => {
        const wrapper = mountTabs(`
            <MaxTabItem value="a" title="Um"><span class="c-a">A</span></MaxTabItem>
            <MaxTabItem value="b" title="Dois" disabled><span class="c-b">B</span></MaxTabItem>
        `);
        await settle();
        await wrapper.findAll('.max-tab-item-title')[1].trigger('click');
        await settle();
        expect(wrapper.find('.c-a').exists()).toBe(true);
        expect(wrapper.find('.c-b').exists()).toBe(false);
        wrapper.unmount();
    });

    it('clique em aba habilitada continua trocando a aba', async () => {
        const wrapper = mountTabs(`
            <MaxTabItem value="a" title="Um"><span class="c-a">A</span></MaxTabItem>
            <MaxTabItem value="b" title="Dois"><span class="c-b">B</span></MaxTabItem>
        `);
        await settle();
        await wrapper.findAll('.max-tab-item-title')[1].trigger('click');
        await settle();
        expect(wrapper.find('.c-b').exists()).toBe(true);
        wrapper.unmount();
    });
});

describe('MaxTabItem — slot #title', () => {
    it('renderiza o slot no lugar do texto do title', async () => {
        const wrapper = mountTabs(`
            <MaxTabItem value="a" title="Texto ignorado">
                <template #title>Custom <span class="badge">3</span></template>
                <span class="c-a">A</span>
            </MaxTabItem>
        `);
        await settle();
        const title = wrapper.find('.max-tab-item-title');
        expect(title.find('.badge').text()).toBe('3');
        expect(title.text()).not.toContain('Texto ignorado');
        wrapper.unmount();
    });

    it('sem o slot, o title via prop continua renderizando (compatibilidade)', async () => {
        const wrapper = mountTabs('<MaxTabItem value="a" title="Padrao" />');
        await settle();
        expect(wrapper.find('.max-tab-item-title').text()).toContain('Padrao');
        wrapper.unmount();
    });
});

describe('MaxTabItem — actionButton', () => {
    it('renderiza MaxButton com label quando actionButtonLabel e actionButton são fornecidos (sem actionButtonIcon)', async () => {
        const wrapper = mountTabs(`
            <MaxTabItem value="a" title="Aba A" actionButtonLabel="Salvar" :actionButton="() => {}" />
        `);
        await settle();
        const buttonItem = wrapper.find('.button-tab-item');
        expect(buttonItem.exists()).toBe(true);
        expect(buttonItem.text()).toContain('Salvar');
        wrapper.unmount();
    });

    it('renderiza o botao apenas para a aba ativa', async () => {
        const fnA = vi.fn();
        const fnB = vi.fn();
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            setup() {
                return { fnA, fnB };
            },
            template: `
                <MaxTabs id="test-tabs-action" :cached="false" value="a">
                    <MaxTabItem value="a" title="Um" actionButtonLabel="Btn A" :actionButton="fnA">
                        <span class="c-a">A</span>
                    </MaxTabItem>
                    <MaxTabItem value="b" title="Dois" actionButtonLabel="Btn B" :actionButton="fnB">
                        <span class="c-b">B</span>
                    </MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();
        const buttonsContainer = wrapper.find('.max-tabs-title-buttons');
        expect(buttonsContainer.text()).toContain('Btn A');
        expect(buttonsContainer.text()).not.toContain('Btn B');

        // Troca para a aba b
        await wrapper.findAll('.max-tab-item-title')[1].trigger('click');
        await settle();

        expect(buttonsContainer.text()).not.toContain('Btn A');
        expect(buttonsContainer.text()).toContain('Btn B');
        wrapper.unmount();
    });

    it('permite botao apenas com icone renderizando MaxIconButton', async () => {
        const fn = vi.fn();
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            setup() {
                return { fn };
            },
            template: `
                <MaxTabs id="test-tabs-icon-only" :cached="false" value="a">
                    <MaxTabItem value="a" title="Um" actionButtonIcon="plus" :actionButton="fn">
                        <span>A</span>
                    </MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();
        const button = wrapper.find('.max-tabs-title-buttons .button-tab-item');
        expect(button.exists()).toBe(true);
        expect(button.findComponent({ name: 'MaxIconButton' }).exists()).toBe(true);
        wrapper.unmount();
    });

    it('renderiza botao global do MaxTabs junto com o botao da aba ativa', async () => {
        const fnGlobal = vi.fn();
        const fnItem = vi.fn();
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            setup() {
                return { fnGlobal, fnItem };
            },
            template: `
                <MaxTabs id="test-tabs-both" :cached="false" value="a" actionButtonLabel="Global" :actionButton="fnGlobal">
                    <MaxTabItem value="a" title="Um" actionButtonLabel="Item A" :actionButton="fnItem">
                        <span>A</span>
                    </MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();
        const buttonsContainer = wrapper.find('.max-tabs-title-buttons');
        expect(buttonsContainer.text()).toContain('Global');
        expect(buttonsContainer.text()).toContain('Item A');
        const buttons = buttonsContainer.findAll('.button-tab-item');
        wrapper.unmount();
    });
});

