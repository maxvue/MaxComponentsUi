import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTogglePopover from '../../src/components/MaxTogglePopover.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';

describe('MaxTogglePopover.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente sem label (usa MaxIconButton)', () => {
        const wrapper = mount(MaxTogglePopover, {
            global: {
                directives: { tooltip: vi.fn() },
                stubs: {
                    MaxPopover: {
                        template: '<div class="max-popover"><slot /></div>'
                    },
                    MaxIconButton: {
                        template: '<button class="max-icon-button"></button>',
                        props: ['icon', 'i']
                    },
                    MaxButton: {
                        template: '<button class="max-button"></button>',
                        props: ['label', 'icon']
                    }
                }
            },
            props: {
                icon: 'mdi:home'
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.max-icon-button').exists()).toBe(true);
        expect(wrapper.find('.max-button').exists()).toBe(false);
    });

    it('renderiza corretamente com label (usa MaxButton)', () => {
        const wrapper = mount(MaxTogglePopover, {
            global: {
                directives: { tooltip: vi.fn() },
                stubs: {
                    MaxPopover: {
                        template: '<div class="max-popover"><slot /></div>'
                    },
                    MaxIconButton: true,
                    MaxButton: {
                        template: '<button class="max-button"></button>',
                        props: ['label', 'icon']
                    }
                }
            },
            props: {
                label: 'Confirmar'
            }
        });

        expect(wrapper.find('.max-button').exists()).toBe(true);
    });

    it('onClickToggle atualiza confirm_store', async () => {
        const wrapper = mount(MaxTogglePopover, {
            global: {
                directives: { tooltip: vi.fn() },
                stubs: {
                    MaxPopover: {
                        template: '<div class="max-popover"><slot /></div>'
                    },
                    MaxIconButton: {
                        name: 'MaxIconButton',
                        template: '<button class="max-icon-button" @click="$emit(\'click\', $event)"></button>'
                    }
                }
            }
        });

        const store = useConfirmStore();
        expect(store.show).toBe(false);

        await wrapper.findComponent({ name: 'MaxIconButton' }).vm.$emit('click', { stopPropagation: vi.fn() });

        expect(store.show).toBe(true);
        expect(store.message).toBe('Deseja continuar?'); // default prop
    });
});
