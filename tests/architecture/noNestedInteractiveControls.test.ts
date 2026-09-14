import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPopover from '../../src/components/MaxPopover.vue';
import MaxPopoverMenu from '../../src/components/MaxPopoverMenu.vue';
import MaxBottomMenu from '../../src/components/MaxBottomMenu.vue';
import MaxMenuVerticalItem from '../../src/components/MaxMenuVerticalItem.vue';
import MaxTopToolbar from '../../src/components/MaxTopToolbar.vue';
import MaxTopToolbarSubmenu from '../../src/components/MaxTopToolbarSubmenu.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import MaxTagsList from '../../src/components/MaxTagsList.vue';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';
import { useTopToolbarStore } from '../../src/stores/useTopToolbar.Store';

vi.mock('vue-router', () => ({
    useRoute: () => ({ name: 'dashboard', path: '/dashboard' }),
    useRouter: () => ({ push: vi.fn() })
}));

vi.mock('@maxvue/max-use', async () => {
    const actual = await vi.importActual<any>('@maxvue/max-use');
    return {
        ...actual,
        goToRoute: vi.fn()
    };
});

/**
 * Seletores de elementos interativos a11y segundo WAI-ARIA e HTML5.
 */
const INTERACTIVE_SELECTORS = [
    'button:not([disabled])',
    'a[href]',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="link"]',
    '[role="combobox"]'
];

/**
 * Verifica se dentro do contêiner existe algum controle interativo aninhado dentro de outro.
 */
function assertNoNestedInteractive(container: HTMLElement): void {
    INTERACTIVE_SELECTORS.forEach((parentSel) => {
        const parents = container.querySelectorAll(parentSel);
        Array.from(parents).forEach((parent) => {
            INTERACTIVE_SELECTORS.forEach((childSel) => {
                const nestedChildren = parent.querySelectorAll(childSel);
                // Exclui o próprio elemento se o seletor casar com ele
                const realNested = Array.from(nestedChildren).filter((child) => child !== parent);
                if (realNested.length > 0) {
                    const parentTag = `${parent.tagName.toLowerCase()}${parent.getAttribute('role') ? `[role="${parent.getAttribute('role')}"]` : ''}`;
                    const childTag = `${realNested[0].tagName.toLowerCase()}${realNested[0].getAttribute('role') ? `[role="${realNested[0].getAttribute('role')}"]` : ''}`;
                    expect.fail(
                        `Controle interativo aninhado detectado: <${childTag}> dentro de <${parentTag}>.`
                    );
                }
            });
        });
    });
}

describe('Auditoria Arquitetural: Zero Controles Interativos Aninhados (E08-03)', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('MaxPopover: não possui controles interativos aninhados no modo padrão', () => {
        const wrapper = mount(MaxPopover, {
            props: {
                icon: 'lucide:info',
                label: 'Ajuda'
            },
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxPopoverMenu: não possui controles interativos aninhados no modo padrão', () => {
        const wrapper = mount(MaxPopoverMenu, {
            props: {
                icon: 'lucide:menu',
                label: 'Opções',
                items: [{ label: 'Item 1' }]
            },
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxBottomMenu: não possui controles interativos aninhados no FAB com menu de adição', () => {
        const wrapper = mount(MaxBottomMenu, {
            props: {
                curved: true,
                addItems: [{ label: 'Criar Item' }]
            },
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxMenuVerticalItem: não possui controles interativos aninhados nos links de menu', () => {
        const wrapper = mount(MaxMenuVerticalItem, {
            props: {
                items: [
                    {
                        id: 'item-1',
                        details: {
                            page_component: 'dashboard',
                            route: 'dashboard',
                            icon: 'mdi:view-dashboard',
                            tooltip: 'Painel'
                        }
                    },
                    {
                        id: 'item-2',
                        details: {
                            page_component: 'settings',
                            route: 'settings',
                            icon: 'mdi:cog',
                            tooltip: 'Configurações'
                        }
                    }
                ]
            },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxTopToolbar: não possui controles interativos aninhados nos itens e submenus', () => {
        const store = useTopToolbarStore();
        store.show = true;
        store.items = [
            { label: 'Novo Projeto', icon: 'mdi:plus' },
            { divider: true },
            {
                label: 'Arquivo',
                icon: 'mdi:folder',
                items: [
                    { label: 'Salvar', icon: 'mdi:content-save' },
                    { label: 'Exportar', icon: 'mdi:export' }
                ]
            },
            { icon: 'mdi:settings', action: vi.fn(), tooltip: 'Configurações' }
        ];

        const wrapper = mount(MaxTopToolbar, {
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIcon: true,
                    MaxIconButton: true
                }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxTopToolbarSubmenu: submenu com chevron e itens recursivos sem controles aninhados', () => {
        const wrapper = mount(MaxTopToolbarSubmenu, {
            props: {
                items: [
                    { label: 'Item 1', icon: 'mdi:star' },
                    { divider: true },
                    {
                        label: 'Item com Filhos',
                        icon: 'mdi:folder',
                        items: [
                            { label: 'Filho 1', icon: 'mdi:file' }
                        ]
                    }
                ]
            },
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIcon: true,
                    MaxIconButton: true
                }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxInputSelect: botão de limpar e dropdown são irmãos do combobox, não aninhados', () => {
        const wrapper = mount(MaxInputSelect, {
            props: {
                modelValue: '1',
                clearable: true,
                options: [
                    { value: '1', name: 'Opção 1' },
                    { value: '2', name: 'Opção 2' }
                ]
            },
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxTagSelect: modo isButton e modo normal não aninham botões no combobox', () => {
        const wrapperNormal = mount(MaxTagSelect, {
            props: {
                modelValue: 'tag1',
                options: [{ value: 'tag1', name: 'Tag 1' }]
            },
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            }
        });
        assertNoNestedInteractive(wrapperNormal.element as HTMLElement);

        const wrapperButton = mount(MaxTagSelect, {
            props: {
                modelValue: null,
                isButton: true,
                icon: 'mdi:plus',
                options: [{ value: 'tag1', name: 'Tag 1' }]
            },
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true, MaxIconButton: true }
            }
        });
        assertNoNestedInteractive(wrapperButton.element as HTMLElement);
    });

    it('MaxTagsList: botão de remoção é irmão do seletor, sem aninhamento de botões', () => {
        const wrapper = mount(MaxTagsList, {
            props: {
                modelValue: [
                    { value: 'vue', name: 'Vue.js' },
                    { value: 'ts', name: 'TypeScript' }
                ],
                options: [
                    { value: 'vue', name: 'Vue.js' },
                    { value: 'ts', name: 'TypeScript' }
                ]
            },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true, MaxTagSelect: true, MaxIconButton: true }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });

    it('MaxInputFileUpload: botão de preview e botão de remoção são irmãos, sem aninhamento', () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: {
                modelValue: [
                    { id: 1, name: 'documento.pdf', size: 10240 },
                    { id: 2, name: 'imagem.png', size: 20480 }
                ],
                removable: true,
                showMetadata: true
            },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { Icon: true, MaxIcon: true }
            }
        });

        assertNoNestedInteractive(wrapper.element as HTMLElement);
    });
});
