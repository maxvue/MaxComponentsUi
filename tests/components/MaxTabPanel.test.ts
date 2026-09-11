import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxTabPanel from '../../src/components/MaxTabPanel.vue';
import { TABS_INJECTION_KEY, type TabsContext } from '../../src/helpers/tabsContext';

function createMockTabsContext(overrides: Partial<TabsContext> = {}): TabsContext {
    return {
        active_value: ref('tab-1'),
        fallback_tab_value: ref('tab-1'),
        effective_active_value: ref('tab-1'),
        has_registered_active_tab: ref(true),
        select: vi.fn(),
        lazy: ref(false),
        select_on_focus: ref(false),
        tabindex: ref(0),
        id_prefix: 'test-tabs',
        registerTab: vi.fn(() => vi.fn()),
        navigate: vi.fn(),
        scrollable: ref(false),
        show_navigators: ref(false),
        ...overrides
    };
}

describe('MaxTabPanel', () => {
    it('dispara erro se renderizado fora de um <MaxTabs>', () => {
        expect(() => {
            mount(MaxTabPanel, {
                props: { value: 'tab-1' }
            });
        }).toThrowError(/\[MaxComponentsUi\] <MaxTabPanel> precisa estar dentro de um <MaxTabs>/);
    });

    it('renderiza com role="tabpanel", id, aria-labelledby e conteúdo visível quando ativo', () => {
        const context = createMockTabsContext({ effective_active_value: ref('tab-1') });
        const wrapper = mount(MaxTabPanel, {
            props: { value: 'tab-1' },
            slots: { default: '<div class="content">Conteúdo 1</div>' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        const panel = wrapper.find('.max-tab-panel');
        expect(panel.exists()).toBe(true);
        expect(panel.attributes('role')).toBe('tabpanel');
        expect(panel.attributes('id')).toBe('test-tabs-panel-tab-1');
        expect(panel.attributes('aria-labelledby')).toBe('test-tabs-tab-tab-1');
        expect(panel.isVisible()).toBe(true);
        expect(wrapper.find('.content').text()).toBe('Conteúdo 1');
    });

    it('oculta o painel quando outro tab estiver ativo', () => {
        const context = createMockTabsContext({ effective_active_value: ref('tab-2') });
        const wrapper = mount(MaxTabPanel, {
            props: { value: 'tab-1' },
            slots: { default: 'Conteúdo Oculto' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        const panel = wrapper.find('.max-tab-panel');
        expect(panel.exists()).toBe(true);
        expect(panel.isVisible()).toBe(false);
    });

    it('respeita o modo lazy: só monta no DOM quando ativado pela primeira vez', async () => {
        const activeVal = ref('tab-2');
        const context = createMockTabsContext({
            lazy: ref(true),
            effective_active_value: activeVal
        });

        const wrapper = mount(MaxTabPanel, {
            props: { value: 'tab-1' },
            slots: { default: '<div class="lazy-content">Conteúdo Lazy</div>' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.find('.max-tab-panel').exists()).toBe(false);

        activeVal.value = 'tab-1';
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-tab-panel').exists()).toBe(true);
        expect(wrapper.find('.lazy-content').text()).toBe('Conteúdo Lazy');

        activeVal.value = 'tab-2';
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-tab-panel').exists()).toBe(true);
        expect(wrapper.find('.max-tab-panel').isVisible()).toBe(false);
    });
});
