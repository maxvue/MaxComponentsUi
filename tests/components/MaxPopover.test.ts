import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPopover from '../../src/components/MaxPopover.vue';
import { ref, defineComponent, h } from 'vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        useWindowSize: () => ({ width: ref(800), height: ref(600) }),
        useElementSize: () => ({ width: ref(500), height: ref(500) })
    };
});

const mountedWrappers: any[] = [];

function mountPopover(props: Record<string, any> = {}, slots: Record<string, any> = {}, options: Record<string, any> = {}) {
    const wrapper = mount(MaxPopover, {
        props: { icon: 'mdi:dots-vertical', title: 'Menu', subTitle: 'Opções', ...props },
        slots,
        global: {
            stubs: {
                MaxButton: {
                    template: '<button class="max-button" v-bind="$attrs"><slot /></button>',
                    props: ['icon', 'i', 'label', 'size', 'action']
                },
                MaxIconButton: {
                    template: '<button class="icon-button" v-bind="$attrs"><slot /></button>',
                    props: ['icon', 'i', 'size']
                },
                MaxTitle1: {
                    template: '<div class="title" v-bind="$attrs"><slot /></div>',
                    props: ['h1', 'h2', 'title', 'subtitle', 'subTitle']
                },
                MaxGrid: {
                    template: '<div class="grid" v-bind="$attrs"><slot /></div>',
                    props: ['label']
                },
                MaxAnimateFade: {
                    template: '<div><slot /></div>',
                    props: ['show', 'duration']
                },
                Teleport: true
            }
        },
        ...options
    });
    mountedWrappers.push(wrapper);
    return wrapper;
}

describe('MaxPopover', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        while (mountedWrappers.length > 0) {
            const w = mountedWrappers.pop();
            try { w?.unmount(); } catch {}
        }
        document.body.innerHTML = '';
        vi.useRealTimers();
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

        // Mock window size
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

        // Mock element dimensions. Precisa ser configurado ANTES do mount,
        // já que useElementBounding agora é instanciado no nível de setup
        // (nao mais recriado dentro do handler a cada clique).
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

        const wrapper = mountPopover();
        const vm = wrapper.vm as any;

        vm.show();
        expect(vm.position.isTop).toBe(true);
        expect(vm.position.isLeft).toBe(true);

        // Restore mocks
        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
        vi.useRealTimers();
    });

    it('renderiza e pode ser fechado via click outside', async () => {
        const wrapper = mountPopover({ title: 'Test', subTitle: 'Sub' });
        const vm = wrapper.vm as any;

        vm.toggle();
        await wrapper.vm.$nextTick();

        expect(vm.isOpen).toBe(true);
        const dialog = wrapper.find('.max-popover-dialog');
        expect(dialog.exists()).toBe(true);

        // Testa fechamento via click outside
        document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
        document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(vm.isOpen).toBe(false);
    });

    it('abrir um segundo MaxPopover fecha o primeiro automaticamente (integração com usePopoverStore)', () => {
        vi.useFakeTimers();

        // Ambos os popovers precisam compartilhar a mesma app Vue (como
        // aconteceria numa página real) para que o `useId()` de cada um
        // gere ids distintos entre si.
        const stubs = {
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
                props: ['h1', 'h2', 'title', 'subtitle', 'subTitle']
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
        };

        const Parent = defineComponent({
            components: { MaxPopover },
            setup() {
                return () => h('div', [
                    h(MaxPopover, { icon: 'mdi:dots-vertical' }),
                    h(MaxPopover, { icon: 'mdi:dots-horizontal' })
                ]);
            }
        });

        const wrapper = mount(Parent, { global: { stubs } });
        const popovers = wrapper.findAllComponents(MaxPopover);
        const vm1 = popovers[0].vm as any;
        const vm2 = popovers[1].vm as any;

        vm1.toggle();
        expect(vm1.isOpen).toBe(true);
        expect(vm2.isOpen).toBe(false);

        vm2.toggle();
        expect(vm2.isOpen).toBe(true);
        expect(vm1.isOpen).toBe(false);

        vi.useRealTimers();
    });

    it('MaxPopover fechado não renderiza .popover-item no DOM', () => {
        const wrapper = mountPopover();
        const vm = wrapper.vm as any;

        expect(vm.isOpen).toBe(false);
        expect(wrapper.find('.popover-item').exists()).toBe(false);
    });

    it('desmontar MaxPopover enquanto aberto restaura popover_store.show_id para null', () => {
        const wrapper = mountPopover();
        const vm = wrapper.vm as any;
        const popover_store = vm.popover_store;

        vm.show();
        expect(popover_store.show_id).toBe(vm.id);

        wrapper.unmount();
        expect(popover_store.show_id).toBe(null);
    });

    describe('Acessibilidade (Etapa 5.1)', () => {
        afterEach(() => {
            while (mountedWrappers.length > 0) {
                const w = mountedWrappers.pop();
                try { w.unmount(); } catch {}
            }
            document.body.innerHTML = '';
        });

        it('fecha o popover com a tecla Escape', async () => {
            const wrapper = mountPopover();
            const vm = wrapper.vm as any;

            vm.show();
            await wrapper.vm.$nextTick();
            expect(vm.isOpen).toBe(true);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await wrapper.vm.$nextTick();

            expect(vm.isOpen).toBe(false);
        });

        it('gatilho possui role="button", tabindex="0", aria-expanded e aria-controls', async () => {
            const wrapper = mountPopover();
            const vm = wrapper.vm as any;

            const iconBtn = wrapper.find('.max-popover-icon');
            expect(iconBtn.exists()).toBe(true);
            expect(iconBtn.attributes('role')).toBe('button');
            expect(iconBtn.attributes('tabindex')).toBe('0');
            expect(iconBtn.attributes('aria-expanded')).toBe('false');
            expect(iconBtn.attributes('aria-controls')).toBeTruthy();

            vm.show();
            await wrapper.vm.$nextTick();
            expect(iconBtn.attributes('aria-expanded')).toBe('true');
        });

        it('gatilho abre o popover com Enter ou Espaço', async () => {
            const wrapper = mountPopover();
            const vm = wrapper.vm as any;
            const iconBtn = wrapper.find('.max-popover-icon');

            await iconBtn.trigger('keydown', { key: 'Enter' });
            expect(vm.isOpen).toBe(true);

            vm.hide();
            await wrapper.vm.$nextTick();

            await iconBtn.trigger('keydown', { key: ' ' });
            expect(vm.isOpen).toBe(true);
        });

        it('painel possui role="dialog", id e aria-labelledby', async () => {
            const wrapper = mountPopover({ title: 'Menu' });
            const vm = wrapper.vm as any;

            vm.show();
            await wrapper.vm.$nextTick();

            const dialog = wrapper.find('.max-popover-dialog');
            expect(dialog.exists()).toBe(true);
            expect(dialog.attributes('role')).toBe('dialog');
            expect(dialog.attributes('id')).toBeTruthy();
            expect(dialog.attributes('aria-labelledby')).toBeTruthy();
        });

        it('botão de fechar possui aria-label="Fechar"', async () => {
            const wrapper = mountPopover();
            const vm = wrapper.vm as any;

            vm.show();
            await wrapper.vm.$nextTick();

            const closeBtn = wrapper.find('.max-popover-header .icon-button');
            expect(closeBtn.exists()).toBe(true);
            expect(closeBtn.attributes('aria-label')).toBe('Fechar');
        });

        it('ativa focus trap e restaura o foco ao gatilho ao fechar', async () => {
            const wrapper = mountPopover({}, {
                content: '<button id="opt1">Opção 1</button>'
            }, { attachTo: document.body });
            const vm = wrapper.vm as any;
            const iconBtn = wrapper.find<HTMLElement>('.max-popover-icon').element;

            iconBtn.focus();
            expect(document.activeElement).toBe(iconBtn);

            vm.show();
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            // O foco deve estar retido no diálogo flutuante
            const dialog = wrapper.find('.max-popover-dialog').element;
            expect(dialog.contains(document.activeElement)).toBe(true);

            vm.hide();
            await wrapper.vm.$nextTick();

            expect(document.activeElement).toBe(iconBtn);
        });

        it('calcula o tamanho do ícone corretamente em rem para fatores numéricos', () => {
            const wrapper = mountPopover({ size: 1.4 });
            const iconContainer = wrapper.find('.max-popover-icon');
            expect(iconContainer.attributes('style')).toContain('width: 1.4rem');
            expect(iconContainer.attributes('style')).toContain('height: 1.4rem');
        });
    });

    describe('Geometria Responsiva, Clamp e Camadas (F11 / E04-07)', () => {
        const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

        afterEach(() => {
            Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
        });

        it('aplica clamp vertical e horizontal em viewport estreito de 280px', async () => {
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 280 });
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 400 });

            Element.prototype.getBoundingClientRect = vi.fn(function (this: HTMLElement) {
                if (this.classList?.contains('max-popover-dialog')) {
                    return {
                        width: 250,
                        height: 180,
                        top: 0,
                        left: 0,
                        bottom: 180,
                        right: 250,
                        x: 0,
                        y: 0,
                        toJSON: () => {}
                    } as DOMRect;
                }
                return {
                    width: 36,
                    height: 36,
                    top: 250,
                    left: 20,
                    bottom: 286,
                    right: 56,
                    x: 20,
                    y: 250,
                    toJSON: () => {}
                } as DOMRect;
            });

            const wrapper = mountPopover();
            const vm = wrapper.vm as any;
            vm.show();
            await wrapper.vm.$nextTick();

            expect(vm.position.left).toBeGreaterThanOrEqual(8);
            expect(vm.position.left).toBeLessThanOrEqual(280 - 250 - 8);
            expect(vm.position.top).toBeGreaterThanOrEqual(8);
            expect(vm.position.top).toBeLessThanOrEqual(400 - 180 - 8);
        });

        it('aplica clamp em viewport landscape com altura reduzida (320px)', async () => {
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 568 });
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 320 });

            Element.prototype.getBoundingClientRect = vi.fn(function (this: HTMLElement) {
                if (this.classList?.contains('max-popover-dialog')) {
                    return {
                        width: 280,
                        height: 200,
                        top: 0,
                        left: 0,
                        bottom: 200,
                        right: 280,
                        x: 0,
                        y: 0,
                        toJSON: () => {}
                    } as DOMRect;
                }
                return {
                    width: 40,
                    height: 40,
                    top: 240,
                    left: 200,
                    bottom: 280,
                    right: 240,
                    x: 200,
                    y: 240,
                    toJSON: () => {}
                } as DOMRect;
            });

            const wrapper = mountPopover();
            const vm = wrapper.vm as any;
            vm.show();
            await wrapper.vm.$nextTick();

            // Espaço abaixo é insuficiente (320 - 280 = 40px < 200px), deve posicionar acima
            expect(vm.position.isTop).toBe(true);
            expect(vm.position.top).toBeGreaterThanOrEqual(8);
            expect(vm.position.top).toBeLessThanOrEqual(320 - 200 - 8);
        });

        it('mantém popover dentro dos limites sob zoom de 200% (viewport efetivo 400x300)', async () => {
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 });
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 300 });

            Element.prototype.getBoundingClientRect = vi.fn(function (this: HTMLElement) {
                if (this.classList?.contains('max-popover-dialog')) {
                    return {
                        width: 260,
                        height: 160,
                        top: 0,
                        left: 0,
                        bottom: 160,
                        right: 260,
                        x: 0,
                        y: 0,
                        toJSON: () => {}
                    } as DOMRect;
                }
                return {
                    width: 32,
                    height: 32,
                    top: 260,
                    left: 360,
                    bottom: 292,
                    right: 392,
                    x: 360,
                    y: 260,
                    toJSON: () => {}
                } as DOMRect;
            });

            const wrapper = mountPopover();
            const vm = wrapper.vm as any;
            vm.show();
            await wrapper.vm.$nextTick();

            expect(vm.position.left).toBeGreaterThanOrEqual(8);
            expect(vm.position.left).toBeLessThanOrEqual(400 - 260 - 8);
            expect(vm.position.top).toBeGreaterThanOrEqual(8);
            expect(vm.position.top).toBeLessThanOrEqual(300 - 160 - 8);
            // Botão está à direita do popover clamped, então isLeft é true (seta à direita)
            expect(vm.position.isLeft).toBe(true);
        });

        it('sincroniza seta com a posição do gatilho (is-top / is-bottom / is-left / is-right)', async () => {
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1000 });
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

            // Caso 1: botão no topo esquerdo -> abre abaixo (isTop = false), seta à esquerda (isLeft = false)
            Element.prototype.getBoundingClientRect = vi.fn(function (this: HTMLElement) {
                if (this.classList?.contains('max-popover-dialog')) {
                    return { width: 300, height: 100, top: 0, left: 0, bottom: 100, right: 300, x: 0, y: 0, toJSON: () => {} } as DOMRect;
                }
                return { width: 40, height: 40, top: 50, left: 100, bottom: 90, right: 140, x: 100, y: 50, toJSON: () => {} } as DOMRect;
            });

            const wrapper1 = mountPopover();
            const vm1 = wrapper1.vm as any;
            vm1.show();
            await wrapper1.vm.$nextTick();

            expect(vm1.position.isTop).toBe(false);
            expect(vm1.position.isLeft).toBe(false);

            // Caso 2: botão na extrema direita e parte inferior -> abre acima (isTop = true) e desloca popover à esquerda (isLeft = true)
            Element.prototype.getBoundingClientRect = vi.fn(function (this: HTMLElement) {
                if (this.classList?.contains('max-popover-dialog')) {
                    return { width: 300, height: 100, top: 0, left: 0, bottom: 100, right: 300, x: 0, y: 0, toJSON: () => {} } as DOMRect;
                }
                return { width: 40, height: 40, top: 750, left: 920, bottom: 790, right: 960, x: 920, y: 750, toJSON: () => {} } as DOMRect;
            });

            const wrapper2 = mountPopover();
            const vm2 = wrapper2.vm as any;
            vm2.show();
            await wrapper2.vm.$nextTick();

            expect(vm2.position.isTop).toBe(true);
            expect(vm2.position.isLeft).toBe(true);
        });
    });
});
