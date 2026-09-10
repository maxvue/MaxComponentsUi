import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MaxInputCode from '../../src/components/MaxInputCode.vue';
import MaxInputCodeToolbar from '../../src/components/MaxInputCodeToolbar.vue';

const mockEditorInstance = {
    getValue: vi.fn(() => 'const a = 1;'),
    setValue: vi.fn(),
    getModel: vi.fn(() => ({})),
    updateOptions: vi.fn(),
    getAction: vi.fn(() => ({ run: vi.fn() })),
    trigger: vi.fn(),
    onDidChangeModelContent: vi.fn((_cb: () => void) => {
        return { dispose: vi.fn() };
    }),
    layout: vi.fn(),
    dispose: vi.fn()
};

const mockMonacoInstance = {
    editor: {
        create: vi.fn(() => mockEditorInstance),
        setModelLanguage: vi.fn(),
        setTheme: vi.fn()
    }
};

vi.mock('@monaco-editor/loader', () => ({
    default: {
        init: vi.fn(async () => mockMonacoInstance)
    }
}));

describe('MaxInputCodeToolbar', () => {
    it('renderiza os botões e o seletor de linguagem', () => {
        const wrapper = mount(MaxInputCodeToolbar, {
            props: {
                language: 'typescript',
                wordWrap: true,
                minimap: false,
                isFullscreen: false
            },
            global: {
                stubs: {
                    MaxIcon: true
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('select').exists()).toBe(true);
        expect(wrapper.findAll('button').length).toBeGreaterThanOrEqual(8);
    });

    it('emite update:language ao trocar opção do select', async () => {
        const wrapper = mount(MaxInputCodeToolbar, {
            props: {
                language: 'typescript'
            },
            global: {
                stubs: {
                    MaxIcon: true
                }
            }
        });

        const select = wrapper.find('select');
        await select.setValue('php');
        expect(wrapper.emitted('update:language')).toBeTruthy();
        expect(wrapper.emitted('update:language')![0]).toEqual(['php']);
    });

    it('emite eventos de ações ao clicar nos botões', async () => {
        const wrapper = mount(MaxInputCodeToolbar, {
            props: {
                language: 'typescript',
                wordWrap: true,
                minimap: false
            },
            global: {
                stubs: {
                    MaxIcon: true
                }
            }
        });

        const buttons = wrapper.findAll('button');
        // Botão de formatar
        await buttons[0].trigger('click');
        expect(wrapper.emitted('format')).toBeTruthy();

        // Botão de comentar
        await buttons[1].trigger('click');
        expect(wrapper.emitted('toggle-comment')).toBeTruthy();

        // Botão de indentar
        await buttons[2].trigger('click');
        expect(wrapper.emitted('indent')).toBeTruthy();

        // Botão de desindentar
        await buttons[3].trigger('click');
        expect(wrapper.emitted('outdent')).toBeTruthy();
    });
});

describe('MaxInputCode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.documentElement.classList.remove('dark');
    });

    it('renderiza o container principal com a classe .max-input-code', () => {
        const wrapper = mount(MaxInputCode, {
            props: {
                modelValue: 'const x = 10;'
            },
            global: {
                stubs: {
                    MaxIcon: true,
                    MaxInputCodeToolbar: true
                }
            }
        });

        expect(wrapper.find('.max-input-code').exists()).toBe(true);
    });

    it('inicializa o Monaco Editor e expõe a instância', async () => {
        const wrapper = mount(MaxInputCode, {
            props: {
                modelValue: 'console.log("hello");',
                language: 'javascript'
            },
            global: {
                stubs: {
                    MaxIcon: true,
                    MaxInputCodeToolbar: true
                }
            }
        });

        // Aguarda a resolução assíncrona do loader.init()
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(wrapper.emitted('mount')).toBeTruthy();
        const exposed = wrapper.vm as any;
        expect(typeof exposed.format).toBe('function');
        expect(typeof exposed.toggleFullscreen).toBe('function');
    });

    it('aplica tema dark quando a prop dark é true', async () => {
        const wrapper = mount(MaxInputCode, {
            props: {
                dark: true
            },
            global: {
                stubs: {
                    MaxIcon: true,
                    MaxInputCodeToolbar: true
                }
            }
        });

        expect(wrapper.classes()).toContain('max-input-code--dark');
    });

    it('detecta dark mode do documento caso a prop dark seja omitida', async () => {
        document.documentElement.classList.add('dark');

        const wrapper = mount(MaxInputCode, {
            props: {},
            global: {
                stubs: {
                    MaxIcon: true,
                    MaxInputCodeToolbar: true
                }
            }
        });

        expect(wrapper.classes()).toContain('max-input-code--dark');
    });

    it('alterna para modo tela cheia ao invocar toggleFullscreen', async () => {
        const wrapper = mount(MaxInputCode, {
            props: {},
            global: {
                stubs: {
                    MaxIcon: true,
                    MaxInputCodeToolbar: true
                }
            }
        });

        const vm = wrapper.vm as any;
        vm.toggleFullscreen();
        await nextTick();

        expect(wrapper.classes()).toContain('max-input-code--fullscreen');
    });
});
