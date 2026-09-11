import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxTabList from '../../src/components/MaxTabList.vue';
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
        show_navigators: ref(true),
        ...overrides
    };
}

describe('MaxTabList', () => {
    it('dispara erro se renderizado fora de um <MaxTabs>', () => {
        expect(() => {
            mount(MaxTabList, {
                slots: { default: '<div>Tabs</div>' }
            });
        }).toThrowError(/\[MaxComponentsUi\] <MaxTabList> precisa estar dentro de um <MaxTabs>/);
    });

    it('renderiza o container com role="tablist" e o slot default', () => {
        const context = createMockTabsContext();
        const wrapper = mount(MaxTabList, {
            slots: { default: '<div class="tab-item">Item 1</div>' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.find('.max-tab-list-wrapper').exists()).toBe(true);
        const list = wrapper.find('.max-tab-list');
        expect(list.exists()).toBe(true);
        expect(list.attributes('role')).toBe('tablist');
        expect(wrapper.find('.tab-item').text()).toBe('Item 1');
    });

    it('aplica classe max-tab-list-scrollable quando scrollable está ativo no contexto', () => {
        const context = createMockTabsContext({ scrollable: ref(true) });
        const wrapper = mount(MaxTabList, {
            slots: { default: '<div>Tabs</div>' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.find('.max-tab-list').classes()).toContain('max-tab-list-scrollable');
    });

    it('não exibe botões de navegação se não houver overflow', () => {
        const context = createMockTabsContext({
            scrollable: ref(true),
            show_navigators: ref(true)
        });
        const wrapper = mount(MaxTabList, {
            slots: { default: '<div>Tabs</div>' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.findAll('.max-tab-nav')).toHaveLength(0);
    });
});
