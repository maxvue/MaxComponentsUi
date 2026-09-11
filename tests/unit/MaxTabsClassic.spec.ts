import { describe, it, expect } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import MaxTabs from '../../src/components/MaxTabs.vue';
import MaxTabItem from '../../src/components/MaxTabItem.vue';

const settle = () => new Promise((r) => setTimeout(r, 35));

describe('MaxTabs e MaxTabItem — WAI-ARIA Classic Tabs Pattern', () => {
    it('renderiza container com role="tablist" e aria-orientation="horizontal"', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            template: `
                <MaxTabs id="test-aria-tablist" :cached="false" value="tab1">
                    <MaxTabItem value="tab1" title="Aba 1">Conteúdo 1</MaxTabItem>
                    <MaxTabItem value="tab2" title="Aba 2">Conteúdo 2</MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();

        const tablist = wrapper.find('[role="tablist"]');
        expect(tablist.exists()).toBe(true);
        expect(tablist.attributes('aria-orientation')).toBe('horizontal');

        wrapper.unmount();
    });

    it('renderiza itens de aba com role="tab", aria-selected, tabindex e aria-controls', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            template: `
                <MaxTabs id="test-aria-tabs" :cached="false" value="t1">
                    <MaxTabItem value="t1" title="Aba 1">Conteúdo 1</MaxTabItem>
                    <MaxTabItem value="t2" title="Aba 2">Conteúdo 2</MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();

        const tabs = wrapper.findAll('[role="tab"]');
        expect(tabs).toHaveLength(2);

        // Aba 1 ativa
        expect(tabs[0].attributes('aria-selected')).toBe('true');
        expect(tabs[0].attributes('tabindex')).toBe('0');
        expect(tabs[0].attributes('id')).toBe('tab-t1');
        expect(tabs[0].attributes('aria-controls')).toBe('tabpanel-t1');

        // Aba 2 inativa
        expect(tabs[1].attributes('aria-selected')).toBe('false');
        expect(tabs[1].attributes('tabindex')).toBe('-1');
        expect(tabs[1].attributes('id')).toBe('tab-t2');
        expect(tabs[1].attributes('aria-controls')).toBe('tabpanel-t2');

        wrapper.unmount();
    });

    it('renderiza painel de conteúdo com role="tabpanel", tabindex="0" e aria-labelledby', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            template: `
                <MaxTabs id="test-aria-panel" :cached="false" value="t1">
                    <MaxTabItem value="t1" title="Aba 1">Conteúdo 1</MaxTabItem>
                    <MaxTabItem value="t2" title="Aba 2">Conteúdo 2</MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();

        const panel = wrapper.find('[role="tabpanel"]');
        expect(panel.exists()).toBe(true);
        expect(panel.attributes('id')).toBe('tabpanel-t1');
        expect(panel.attributes('aria-labelledby')).toBe('tab-t1');
        expect(panel.attributes('tabindex')).toBe('0');
        expect(panel.text()).toContain('Conteúdo 1');

        wrapper.unmount();
    });

    it('ativa aba ao pressionar Enter ou Espaço', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            template: `
                <MaxTabs id="test-aria-keys" :cached="false" value="t1">
                    <MaxTabItem value="t1" title="Aba 1">Conteúdo 1</MaxTabItem>
                    <MaxTabItem value="t2" title="Aba 2">Conteúdo 2</MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();

        const tabs = wrapper.findAll('[role="tab"]');

        // Pressionar Space na Aba 2
        await tabs[1].trigger('keydown', { key: ' ' });
        await settle();

        expect(tabs[1].attributes('aria-selected')).toBe('true');
        expect(wrapper.find('[role="tabpanel"]').text()).toContain('Conteúdo 2');

        // Pressionar Enter na Aba 1
        await tabs[0].trigger('keydown', { key: 'Enter' });
        await settle();

        expect(tabs[0].attributes('aria-selected')).toBe('true');
        expect(wrapper.find('[role="tabpanel"]').text()).toContain('Conteúdo 1');

        wrapper.unmount();
    });

    it('navega com setas direcionais, Home e End no tablist', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            template: `
                <MaxTabs id="test-aria-arrows" :cached="false" value="t1">
                    <MaxTabItem value="t1" title="Aba 1">Conteúdo 1</MaxTabItem>
                    <MaxTabItem value="t2" title="Aba 2">Conteúdo 2</MaxTabItem>
                    <MaxTabItem value="t3" title="Aba 3">Conteúdo 3</MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();

        const tablist = wrapper.find('[role="tablist"]');
        const tabs = wrapper.findAll('[role="tab"]');

        // Foca primeira aba
        tabs[0].element.focus();

        // Seta Direita -> foca aba 2
        await tablist.trigger('keydown', { key: 'ArrowRight' });
        expect(document.activeElement).toBe(tabs[1].element);

        // Seta Direita -> foca aba 3
        await tablist.trigger('keydown', { key: 'ArrowRight' });
        expect(document.activeElement).toBe(tabs[2].element);

        // Seta Direita -> volta para aba 1 (wrap-around)
        await tablist.trigger('keydown', { key: 'ArrowRight' });
        expect(document.activeElement).toBe(tabs[0].element);

        // Seta Esquerda -> vai para aba 3 (wrap-around)
        await tablist.trigger('keydown', { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(tabs[2].element);

        // Home -> vai para aba 1
        await tablist.trigger('keydown', { key: 'Home' });
        expect(document.activeElement).toBe(tabs[0].element);

        // End -> vai para aba 3
        await tablist.trigger('keydown', { key: 'End' });
        expect(document.activeElement).toBe(tabs[2].element);

        wrapper.unmount();
    });

    it('ativa a aba automaticamente ao receber foco quando selectOnFocus=true', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxTabs, MaxTabItem },
            template: `
                <MaxTabs id="test-aria-select-on-focus" :cached="false" value="t1" :selectOnFocus="true">
                    <MaxTabItem value="t1" title="Aba 1">Conteúdo 1</MaxTabItem>
                    <MaxTabItem value="t2" title="Aba 2">Conteúdo 2</MaxTabItem>
                </MaxTabs>
            `
        }), { attachTo: document.body });

        await settle();

        const tablist = wrapper.find('[role="tablist"]');
        const tabs = wrapper.findAll('[role="tab"]');

        tabs[0].element.focus();

        // ArrowRight deve focar e também clicar/ativar aba 2
        await tablist.trigger('keydown', { key: 'ArrowRight' });
        await settle();

        expect(tabs[1].attributes('aria-selected')).toBe('true');
        expect(wrapper.find('[role="tabpanel"]').text()).toContain('Conteúdo 2');

        wrapper.unmount();
    });
});
