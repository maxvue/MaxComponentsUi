import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxAccordionItem from '../../src/components/MaxAccordionItem.vue';
import { ACCORDION_INJECTION_KEY, type AccordionContext } from '../../src/helpers/accordionContext';

function createMockAccordionContext(overrides: Partial<AccordionContext> = {}): AccordionContext {
    return {
        open_values: ref(['item-1']),
        toggle: vi.fn(),
        lazy: ref(false),
        expand_icon: ref('mdi:chevron-down'),
        collapse_icon: ref('mdi:chevron-up'),
        id_prefix: 'test-acc',
        nextAutoValue: vi.fn(() => 'auto-1'),
        ...overrides
    };
}

describe('MaxAccordionItem', () => {
    it('dispara erro explicativo se renderizado fora de um <MaxAccordion>', () => {
        expect(() => {
            mount(MaxAccordionItem, {
                props: { value: 'item-1' }
            });
        }).toThrowError(/\[MaxComponentsUi\] <MaxAccordionItem> precisa estar dentro de um <MaxAccordion>/);
    });

    it('renderiza título via prop e atributos de acessibilidade ARIA', () => {
        const context = createMockAccordionContext();
        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'item-1', title: 'Título do Item' },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.text()).toContain('Título do Item');
        const header = wrapper.find('.max-accordion-item-header');
        expect(header.attributes('role')).toBe('button');
        expect(header.attributes('aria-expanded')).toBe('true');
        expect(header.attributes('id')).toBe('test-acc-header-item-1');
        expect(header.attributes('aria-controls')).toBe('test-acc-content-item-1');
    });

    it('invoca context.toggle ao clicar no cabeçalho quando habilitado', async () => {
        const context = createMockAccordionContext({ open_values: ref([]) });
        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'item-2', title: 'Item Fechado' },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        await wrapper.find('.max-accordion-item-header').trigger('click');
        expect(context.toggle).toHaveBeenCalledWith('item-2');
    });

    it('não invoca context.toggle quando desabilitado (disabled=true)', async () => {
        const context = createMockAccordionContext();
        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'item-1', disabled: true },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        await wrapper.find('.max-accordion-item-header').trigger('click');
        expect(context.toggle).not.toHaveBeenCalled();
        expect(wrapper.find('.max-accordion-item-header').attributes('tabindex')).toBe('-1');
    });

    it('renderiza slots customizados header e content', () => {
        const context = createMockAccordionContext();
        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'item-1' },
            slots: {
                header: '<span class="custom-header">Cabeçalho Custom</span>',
                content: '<div class="custom-content">Corpo Custom</div>'
            },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.find('.custom-header').text()).toBe('Cabeçalho Custom');
        expect(wrapper.find('.custom-content').text()).toBe('Corpo Custom');
    });

    it('respeita o modo lazy: só renderiza conteúdo após primeira abertura', async () => {
        const openValues = ref<string[]>([]);
        const context = createMockAccordionContext({
            lazy: ref(true),
            open_values: openValues
        });

        const wrapper = mount(MaxAccordionItem, {
            props: { value: 'lazy-item', title: 'Lazy' },
            slots: {
                default: '<div class="lazy-body">Lazy Body</div>'
            },
            global: {
                provide: {
                    [ACCORDION_INJECTION_KEY as symbol]: context
                }
            }
        });

        expect(wrapper.find('.max-accordion-item-content').exists()).toBe(false);

        openValues.value = ['lazy-item'];
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-accordion-item-content').exists()).toBe(true);
        expect(wrapper.find('.lazy-body').text()).toBe('Lazy Body');

        openValues.value = [];
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-accordion-item-content').exists()).toBe(true);
        expect(wrapper.find('.max-accordion-item-content').isVisible()).toBe(false);
    });
});
