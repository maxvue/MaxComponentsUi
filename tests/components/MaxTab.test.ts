import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxTab from '../../src/components/MaxTab.vue';
import { TABS_INJECTION_KEY, type TabsContext } from '../../src/helpers/tabsContext';

function createMockTabsContext(overrides: Partial<TabsContext> = {}): { context: TabsContext; selectSpy: any; registerSpy: any; unregisterSpy: any } {
    const selectSpy = vi.fn();
    const unregisterSpy = vi.fn();
    const registerSpy = vi.fn().mockReturnValue(unregisterSpy);

    const context: TabsContext = {
        active_value: ref('tab-1'),
        fallback_tab_value: ref('tab-1'),
        effective_active_value: ref('tab-1'),
        has_registered_active_tab: ref(true),
        select: selectSpy,
        lazy: ref(false),
        select_on_focus: ref(false),
        tabindex: ref(0),
        id_prefix: 'test-tabs',
        registerTab: registerSpy,
        navigate: vi.fn(),
        scrollable: ref(false),
        show_navigators: ref(false),
        ...overrides
    };

    return { context, selectSpy, registerSpy, unregisterSpy };
}

describe('MaxTab', () => {
    it('lança erro descritivo quando montado fora de um contexto MaxTabs', () => {
        expect(() => {
            mount(MaxTab, {
                props: { value: 'tab-1' }
            });
        }).toThrow(/<MaxTab> precisa estar dentro de um <MaxTabs>/);
    });

    it('registra e desregistra a aba no ciclo de vida do componente', () => {
        const { context, registerSpy, unregisterSpy } = createMockTabsContext();

        const wrapper = mount(MaxTab, {
            props: { value: 'tab-1' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(registerSpy).toHaveBeenCalledWith('tab-1', expect.any(HTMLElement), expect.any(Function));

        wrapper.unmount();
        expect(unregisterSpy).toHaveBeenCalled();
    });

    it('aplica estado ativo e atributos WAI-ARIA correspondentes', () => {
        const { context } = createMockTabsContext({
            effective_active_value: ref('tab-active')
        });

        const wrapper = mount(MaxTab, {
            props: { value: 'tab-active' },
            slots: { default: 'Aba Ativa' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.classes()).toContain('max-tab-active');
        expect(wrapper.attributes('aria-selected')).toBe('true');
        expect(wrapper.attributes('role')).toBe('tab');
        expect(wrapper.attributes('tabindex')).toBe('0');
        expect(wrapper.attributes('id')).toBe('test-tabs-tab-tab-active');
        expect(wrapper.attributes('aria-controls')).toBe('test-tabs-panel-tab-active');
        expect(wrapper.text()).toBe('Aba Ativa');
    });

    it('aplica estado inativo quando o valor difere do ativo', () => {
        const { context } = createMockTabsContext({
            effective_active_value: ref('outra-aba')
        });

        const wrapper = mount(MaxTab, {
            props: { value: 'minha-aba' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.classes()).not.toContain('max-tab-active');
        expect(wrapper.attributes('aria-selected')).toBe('false');
        expect(wrapper.attributes('tabindex')).toBe('-1');
    });

    it('aciona select ao clicar em uma aba habilitada', async () => {
        const { context, selectSpy } = createMockTabsContext();

        const wrapper = mount(MaxTab, {
            props: { value: 'tab-click' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        await wrapper.trigger('click');
        expect(selectSpy).toHaveBeenCalledWith('tab-click');
    });

    it('não seleciona ao clicar se a aba estiver desabilitada', async () => {
        const { context, selectSpy } = createMockTabsContext();

        const wrapper = mount(MaxTab, {
            props: { value: 'tab-disabled', disabled: true },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.classes()).toContain('max-tab-disabled');
        expect(wrapper.attributes('aria-disabled')).toBe('true');

        await wrapper.trigger('click');
        expect(selectSpy).not.toHaveBeenCalled();
    });

    it('seleciona ao focar quando select_on_focus=true no contexto', async () => {
        const { context, selectSpy } = createMockTabsContext({
            select_on_focus: ref(true)
        });

        const wrapper = mount(MaxTab, {
            props: { value: 'tab-focus' },
            global: {
                provide: {
                    [TABS_INJECTION_KEY as symbol]: context
                }
            }
        });

        await wrapper.trigger('focus');
        expect(selectSpy).toHaveBeenCalledWith('tab-focus');
    });
});
