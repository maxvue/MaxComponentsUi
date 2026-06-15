import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPopover from '../../src/components/MaxPopover.vue';
import { ref } from 'vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        useWindowSize: () => ({ width: ref(800), height: ref(600) }),
        useElementSize: () => ({ width: ref(500), height: ref(500) })
    };
});

function mountPopover(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
    return mount(MaxPopover, {
        props: { icon: 'mdi:dots-vertical', title: 'Menu', subTitle: 'Opções', ...props },
        slots,
        global: {
            stubs: {
                MaxButton: {
                    template: '<button class="max-button"><slot /></button>',
                    props: ['icon', 'i', 'label', 'size', 'action']
                },
                MaxIconButton: {
                    template: '<button class="icon-button"><slot /></button>',
                    props: ['icon', 'i', 'size']
                },
                MaxTitle1: {
                    template: '<div class="title"><slot /></div>',
                    props: ['h1', 'h2']
                },
                MaxGrid: {
                    template: '<div class="grid"><slot /></div>',
                    props: ['label']
                },
                MaxAnimateFade: {
                    template: '<div><slot /></div>',
                    props: ['show', 'duration']
                },
                Teleport: true
            }
        }
    });
}

describe('MaxPopover', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o botão trigger', () => {
        const wrapper = mountPopover();
        expect(wrapper.exists()).toBe(true);
    });

    it('expõe os métodos show, hide e toggle', () => {
        const wrapper = mountPopover();
        const vm = wrapper.vm as any;

        expect(typeof vm.show).toBe('function');
        expect(typeof vm.hide).toBe('function');
        expect(typeof vm.toggle).toBe('function');
    });

    it('aceita slot de conteúdo', () => {
        const wrapper = mountPopover({}, {
            content: '<p>Menu de opções</p>'
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita título e subtítulo via props', () => {
        const wrapper = mountPopover({
            title: 'Ações',
            subTitle: 'Escolha uma opção'
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('abre e fecha o popover usando toggle, show e hide', async () => {
        vi.useFakeTimers();
        const wrapper = mountPopover();
        const vm = wrapper.vm as any;

        expect(vm.isOpen).toBe(false);

        // testando show()
        vm.show();
        expect(vm.isOpen).toBe(true);
        vi.advanceTimersByTime(2);

        // testando hide()
        vm.hide();
        expect(vm.isOpen).toBe(false);

        // testando toggle()
        vm.toggle();
        expect(vm.isOpen).toBe(true);
        vi.advanceTimersByTime(2); // resolve o setTimeout

        expect(vm.style.opacity).toBe(1);

        vi.useRealTimers();
    });

    it('ajusta a posição se o popover exceder os limites da tela', async () => {
        vi.useFakeTimers();
        const wrapper = mountPopover();
        const vm = wrapper.vm as any;

        // Mock window size
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

        // Mock element dimensions
        const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = vi.fn(() => ({
            width: 500,
            height: 500,
            top: 400,
            left: 400,
            bottom: 900,
            right: 900,
            x: 400,
            y: 400,
            toJSON: () => {}
        })) as any;

        vm.show();
        vi.advanceTimersByTime(10); // resolve setTimeout

        expect(vm.style.isTop).toBe(true);
        expect(vm.style.isLeft).toBe(true);

        // Restore mocks
        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
        vi.useRealTimers();
    });

    it('renderiza e pode ser fechado via click no background', async () => {
        const wrapper = mountPopover({ title: 'Test', subTitle: 'Sub' });
        const vm = wrapper.vm as any;

        vm.toggle();
        await wrapper.vm.$nextTick();

        expect(vm.isOpen).toBe(true);
        const bg = wrapper.find('.background-popover');
        expect(bg.exists()).toBe(true);

        // Testa fechamento
        await bg.trigger('click');
        expect(vm.isOpen).toBe(false);
    });
});
