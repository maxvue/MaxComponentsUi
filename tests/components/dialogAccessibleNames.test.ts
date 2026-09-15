import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick, defineComponent } from 'vue';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxPopover from '../../src/components/MaxPopover.vue';
import MaxBaseOverlay from '../../src/components/base/MaxBaseOverlay.vue';
import MaxSideMenuMobile from '../../src/components/MaxSideMenuMobile.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

describe('F10 — E04-05: Nomes acessíveis estáveis e prevenção de nós órfãos', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        // Sem endpoint configurado, o lifecycle real da store não deve iniciar
        // I/O. O contrato ARIA não depende do carregamento de menus.
        configureMaxApp({ routeMenus: undefined });
        pinia = createPinia();
        setActivePinia(pinia);
    });

    afterEach(() => {
        resetMaxAppConfig();
    });

    describe('MaxModal', () => {
        it('vincula aria-labelledby ao wrapper de título estável no header padrão', async () => {
            const wrapper = mount(MaxModal, {
                props: { title: 'Modal Padrão' },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxButton: true, MaxIconButton: true, MaxTitle1: true }
                }
            });

            wrapper.vm.open();
            await nextTick();

            const dialog = wrapper.find('.max-modal');
            const labelledby = dialog.attributes('aria-labelledby');
            expect(labelledby).toBeTruthy();
            expect(wrapper.find(`#${labelledby}`).exists()).toBe(true);
            wrapper.unmount();
        });

        it('mantém aria-labelledby resolvível quando slot de header customizado é utilizado', async () => {
            const wrapper = mount(MaxModal, {
                props: { title: 'Título Base' },
                slots: {
                    header: '<div class="meu-header-customizado">Cabeçalho Substituído</div>'
                },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxButton: true, MaxIconButton: true, MaxTitle1: true }
                }
            });

            wrapper.vm.open();
            await nextTick();

            const dialog = wrapper.find('.max-modal');
            const labelledby = dialog.attributes('aria-labelledby');
            expect(labelledby).toBeTruthy();
            // O wrapper estável garante que o id referenciado existe no DOM mesmo com o slot customizado
            expect(wrapper.find(`#${labelledby}`).exists()).toBe(true);
            expect(wrapper.find('.meu-header-customizado').exists()).toBe(true);
            wrapper.unmount();
        });

        it('com noHeader: true, omite aria-labelledby órfão e aplica fallback em aria-label', async () => {
            const wrapper = mount(MaxModal, {
                props: { noHeader: true, title: 'Modal Sem Header' },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxButton: true }
                }
            });

            wrapper.vm.open();
            await nextTick();

            const dialog = wrapper.find('.max-modal');
            expect(dialog.attributes('aria-labelledby')).toBeUndefined();
            expect(dialog.attributes('aria-label')).toBe('Modal Sem Header');
            wrapper.unmount();
        });

        it('não emite aria-labelledby para ID externo inexistente, aplicando fallback seguro', async () => {
            const wrapper = mount(MaxModal, {
                props: {
                    ariaLabelledby: 'elemento-que-nao-existe-12345',
                    title: 'Título de Fallback'
                },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxButton: true, MaxIconButton: true, MaxTitle1: true }
                }
            });

            wrapper.vm.open();
            await nextTick();

            const dialog = wrapper.find('.max-modal');
            expect(dialog.attributes('aria-labelledby')).toBeUndefined();
            expect(dialog.attributes('aria-label')).toBe('Título de Fallback');
            wrapper.unmount();
        });

        it('garante IDs únicos e estáveis em múltiplas instâncias simultâneas', async () => {
            const Parent = defineComponent({
                components: { MaxModal },
                template: `
                    <div>
                        <MaxModal ref="m1" title="Modal 1" />
                        <MaxModal ref="m2" title="Modal 2" />
                    </div>
                `
            });

            const wrapper = mount(Parent, {
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxButton: true, MaxIconButton: true, MaxTitle1: true }
                }
            });

            const m1 = wrapper.findComponent({ ref: 'm1' });
            const m2 = wrapper.findComponent({ ref: 'm2' });

            m1.vm.open();
            m2.vm.open();
            await nextTick();

            const dialogs = wrapper.findAll('.max-modal');
            expect(dialogs.length).toBe(2);
            const id1 = dialogs[0]?.attributes('aria-labelledby');
            const id2 = dialogs[1]?.attributes('aria-labelledby');

            expect(id1).toBeTruthy();
            expect(id2).toBeTruthy();
            expect(id1).not.toBe(id2);
            expect(wrapper.find(`#${id1}`).exists()).toBe(true);
            expect(wrapper.find(`#${id2}`).exists()).toBe(true);

            wrapper.unmount();
        });
    });

    describe('MaxPopover', () => {
        it('vincula aria-labelledby ao wrapper de título estável no header padrão', async () => {
            const wrapper = mount(MaxPopover, {
                props: { title: 'Popover Título' },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxIcon: true, MaxIconButton: true, MaxTitle1: true }
                }
            });

            wrapper.vm.show();
            await nextTick();

            const dialog = wrapper.find('.max-popover-dialog');
            const labelledby = dialog.attributes('aria-labelledby');
            expect(labelledby).toBeTruthy();
            expect(wrapper.find(`#${labelledby}`).exists()).toBe(true);
            wrapper.unmount();
        });

        it('mantém aria-labelledby resolvível com slot de header customizado', async () => {
            const wrapper = mount(MaxPopover, {
                props: { title: 'Popover Base' },
                slots: {
                    header: '<div class="custom-pop-header">Header Popover</div>'
                },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxIcon: true, MaxIconButton: true, MaxTitle1: true }
                }
            });

            wrapper.vm.show();
            await nextTick();

            const dialog = wrapper.find('.max-popover-dialog');
            const labelledby = dialog.attributes('aria-labelledby');
            expect(labelledby).toBeTruthy();
            expect(wrapper.find(`#${labelledby}`).exists()).toBe(true);
            expect(wrapper.find('.custom-pop-header').exists()).toBe(true);
            wrapper.unmount();
        });

        it('com noHeader: true, omite aria-labelledby órfão e aplica fallback em aria-label', async () => {
            const wrapper = mount(MaxPopover, {
                props: { noHeader: true, title: 'Popover Sem Header' },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxIcon: true }
                }
            });

            wrapper.vm.show();
            await nextTick();

            const dialog = wrapper.find('.max-popover-dialog');
            expect(dialog.attributes('aria-labelledby')).toBeUndefined();
            expect(dialog.attributes('aria-label')).toBe('Popover Sem Header');
            wrapper.unmount();
        });

        it('ignora ID externo inexistente em ariaLabelledby e aplica fallback', async () => {
            const wrapper = mount(MaxPopover, {
                props: {
                    ariaLabelledby: 'inexistente-popover-id-456',
                    title: 'Popover Info'
                },
                global: {
                    plugins: [pinia],
                    stubs: { Teleport: true, MaxIcon: true, MaxIconButton: true, MaxTitle1: true }
                }
            });

            wrapper.vm.show();
            await nextTick();

            const dialog = wrapper.find('.max-popover-dialog');
            expect(dialog.attributes('aria-labelledby')).toBeUndefined();
            expect(dialog.attributes('aria-label')).toBe('Popover Info');
            wrapper.unmount();
        });
    });

    describe('MaxBaseOverlay', () => {
        it('fornece nome acessível padrão para role="dialog" sem label explícito', async () => {
            const wrapper = mount(MaxBaseOverlay, {
                props: {
                    visible: true,
                    role: 'dialog'
                },
                global: {
                    stubs: { Teleport: true }
                }
            });

            await nextTick();
            const panel = wrapper.find('.max-base-overlay');
            expect(panel.attributes('role')).toBe('dialog');
            expect(panel.attributes('aria-label')).toBe('Painel de sobreposição');
            expect(panel.attributes('aria-labelledby')).toBeUndefined();
            wrapper.unmount();
        });

        it('usa ariaLabel explícito quando informado', async () => {
            const wrapper = mount(MaxBaseOverlay, {
                props: {
                    visible: true,
                    role: 'dialog',
                    ariaLabel: 'Menu de Opções'
                },
                global: {
                    stubs: { Teleport: true }
                }
            });

            await nextTick();
            const panel = wrapper.find('.max-base-overlay');
            expect(panel.attributes('aria-label')).toBe('Menu de Opções');
            expect(panel.attributes('aria-labelledby')).toBeUndefined();
            wrapper.unmount();
        });

        it('não emite aria-labelledby para ID ausente e preserva fallback diagnosticável', async () => {
            const wrapper = mount(MaxBaseOverlay, {
                props: {
                    visible: true,
                    role: 'dialog',
                    ariaLabelledby: 'id-que-nao-existe'
                },
                global: {
                    stubs: { Teleport: true }
                }
            });

            await nextTick();
            const panel = wrapper.find('.max-base-overlay');
            expect(panel.attributes('aria-labelledby')).toBeUndefined();
            expect(panel.attributes('aria-label')).toBe('Painel de sobreposição');
            wrapper.unmount();
        });

        it('utiliza aria-labelledby quando ID externo existe no documento', async () => {
            const externalEl = document.createElement('h2');
            externalEl.id = 'titulo-externo-valido';
            externalEl.textContent = 'Cabeçalho Externo';
            document.body.appendChild(externalEl);

            const wrapper = mount(MaxBaseOverlay, {
                props: {
                    visible: true,
                    role: 'dialog',
                    ariaLabelledby: 'titulo-externo-valido'
                },
                attachTo: document.body
            });

            await nextTick();
            const panel = document.querySelector('.max-base-overlay');
            expect(panel?.getAttribute('aria-labelledby')).toBe('titulo-externo-valido');
            expect(panel?.getAttribute('aria-label')).toBeNull();

            wrapper.unmount();
            externalEl.remove();
        });
    });

    describe('MaxSideMenuMobile', () => {
        it('anuncia "Menu principal" como nome acessível do diálogo modal', async () => {
            const system = useSystemStore();
            system.side_menu_open = true;

            const wrapper = mount(MaxSideMenuMobile, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        Teleport: true,
                        MaxIcon: true,
                        MaxUserAvatar: true
                    }
                }
            });

            await nextTick();
            const drawer = wrapper.find('.max-drawer');
            expect(drawer.exists()).toBe(true);
            expect(drawer.attributes('aria-label')).toBe('Menu principal');
            wrapper.unmount();
        });
    });
});
