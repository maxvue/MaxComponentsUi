import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTogglePopover from '../../src/components/MaxTogglePopover.vue';
import MaxButtonConfirm from '../../src/components/MaxButtonConfirm.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';

const popoverStub = {
    MaxPopover: {
        template: '<div class="max-popover"><slot /></div>'
    },
    MaxIconButton: {
        name: 'MaxIconButton',
        template: '<button class="max-icon-button" @click="$emit(\'click\', $event)"></button>'
    }
};

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

    it('abrir o confirm do botão A com o confirm do botão B já aberto reabre em A (não fecha)', async () => {
        const wrapperA = mount(MaxTogglePopover, {
            global: { directives: { tooltip: vi.fn() }, stubs: popoverStub },
            props: { message: 'Confirma A?' }
        });
        const wrapperB = mount(MaxTogglePopover, {
            global: { directives: { tooltip: vi.fn() }, stubs: popoverStub },
            props: { message: 'Confirma B?' }
        });

        const store = useConfirmStore();

        // Abre o confirm do botão B primeiro
        await wrapperB.findComponent({ name: 'MaxIconButton' }).vm.$emit('click', { stopPropagation: vi.fn() });
        expect(store.show).toBe(true);
        expect(store.message).toBe('Confirma B?');

        // Clicar no botão A deve MANTER show=true e trocar os dados para A
        // (nao fazer toggle, que fecharia por já estar show=true)
        await wrapperA.findComponent({ name: 'MaxIconButton' }).vm.$emit('click', { stopPropagation: vi.fn() });
        expect(store.show).toBe(true);
        expect(store.message).toBe('Confirma A?');
    });

    it('abrir via MaxTogglePopover depois de um confirm com messageIcon nao vaza o icone anterior', async () => {
        const wrapperConfirmComIcone = mount(MaxButtonConfirm, {
            global: {
                directives: { tooltip: vi.fn() },
                stubs: {
                    MaxButton: {
                        name: 'MaxButton',
                        template: '<button class="max-button"></button>',
                        props: ['action']
                    }
                }
            },
            props: { label: 'Excluir', messageIcon: 'mdi:alert' }
        });

        const store = useConfirmStore();

        (wrapperConfirmComIcone.vm as any).onClickToggle();
        expect(store.messageIcon).toBe('mdi:alert');

        const wrapperToggle = mount(MaxTogglePopover, {
            global: { directives: { tooltip: vi.fn() }, stubs: popoverStub },
            props: { message: 'Sem icone' }
        });

        await wrapperToggle.findComponent({ name: 'MaxIconButton' }).vm.$emit('click', { stopPropagation: vi.fn() });

        expect(store.messageIcon).toBeNull();
    });
});
