import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxTabPanels from '../../src/components/MaxTabPanels.vue';
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

describe('MaxTabPanels', () => {
    it('dispara erro se renderizado fora de um <MaxTabs>', () => {
        expect(() => {
            mount(MaxTabPanels, {
                slots: { default: '<div>Painéis</div>' }
            });
        }).toThrowError(/\[MaxComponentsUi\] <MaxTabPanels> precisa estar dentro de um <MaxTabs>/);
    });

    it('renderiza o container com classe max-tab-panels e os filhos do slot', () => {
        const context = createMockTabsContext();
        const wrapper = mount(MaxTabPanels, {
            slots: { default: '<div class="custom-panel">Painel A</div>' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.find('.max-tab-panels').exists()).toBe(true);
        expect(wrapper.find('.custom-panel').text()).toBe('Painel A');
    });
});
