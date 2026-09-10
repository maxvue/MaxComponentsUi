import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCodeToolbar from '../../src/components/MaxInputCodeToolbar.vue';

describe('MaxInputCodeToolbar', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('Gerenciamento de Ciclo de Vida e Timers (Memory Leak Prevention)', () => {
        it('cancela o timer copyTimeout ao desmontar o componente antes de 1800ms', async () => {
            const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

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

            const copyButton = wrapper.find('button[title="Copiar Código"]');
            expect(copyButton.exists()).toBe(true);

            // 1. Clica no botão de cópia agendando o timer de 1800ms
            await copyButton.trigger('click');
            expect(wrapper.emitted('copy')).toBeTruthy();

            const callsBeforeUnmount = clearTimeoutSpy.mock.calls.length;

            // 2. Desmonta o componente enquanto o timer ainda está ativo (< 1800ms)
            wrapper.unmount();

            // 3. Asserção do Red/Green: clearTimeout deve ter sido invocado para limpar o timer
            expect(clearTimeoutSpy).toHaveBeenCalledTimes(callsBeforeUnmount + 1);

            // 4. Avança o tempo além de 1800ms para garantir que nenhuma mutação tardia dispare
            vi.advanceTimersByTime(2000);
        });

        it('reseta e agenda novo timer ao clicar em cópia repetidamente antes de 1800ms', async () => {
            const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

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

            const copyButton = wrapper.find('button[title="Copiar Código"]');

            // Primeiro clique
            await copyButton.trigger('click');
            expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

            // Segundo clique aos 500ms
            vi.advanceTimersByTime(500);
            await copyButton.trigger('click');
            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

            wrapper.unmount();
            expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
        });

        it('restaura estado visual isCopied após 1800ms se permanecer montado', async () => {
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

            const copyButton = wrapper.find('button[title="Copiar Código"]');
            await copyButton.trigger('click');

            expect(wrapper.find('button[title="Copiado!"]').exists()).toBe(true);

            // Avança o tempo em 1800ms
            vi.advanceTimersByTime(1800);
            await wrapper.vm.$nextTick();

            expect(wrapper.find('button[title="Copiar Código"]').exists()).toBe(true);
            expect(wrapper.find('button[title="Copiado!"]').exists()).toBe(false);
        });
    });

    describe('Emissão de Eventos e Interações da Toolbar', () => {
        it('emite update:language quando a linguagem é alterada no select', async () => {
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
            expect(wrapper.emitted('update:language')?.[0]).toEqual(['php']);
        });

        it('emite format ao clicar no botão de formatar', async () => {
            const wrapper = mount(MaxInputCodeToolbar, {
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            const btn = wrapper.find('button[title="Formatar Código (Shift+Alt+F)"]');
            await btn.trigger('click');

            expect(wrapper.emitted('format')).toBeTruthy();
        });

        it('emite toggle-comment ao clicar no botão de comentar', async () => {
            const wrapper = mount(MaxInputCodeToolbar, {
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            const btn = wrapper.find('button[title="Comentar Linhas (Ctrl+/)"]');
            await btn.trigger('click');

            expect(wrapper.emitted('toggle-comment')).toBeTruthy();
        });

        it('emite indent e outdent ao clicar nos botões respectivos', async () => {
            const wrapper = mount(MaxInputCodeToolbar, {
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            const indentBtn = wrapper.find('button[title="Indentar (Tab)"]');
            await indentBtn.trigger('click');
            expect(wrapper.emitted('indent')).toBeTruthy();

            const outdentBtn = wrapper.find('button[title="Desindentar (Shift+Tab)"]');
            await outdentBtn.trigger('click');
            expect(wrapper.emitted('outdent')).toBeTruthy();
        });

        it('emite undo e redo ao clicar nos botões respectivos', async () => {
            const wrapper = mount(MaxInputCodeToolbar, {
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            const undoBtn = wrapper.find('button[title="Desfazer (Ctrl+Z)"]');
            await undoBtn.trigger('click');
            expect(wrapper.emitted('undo')).toBeTruthy();

            const redoBtn = wrapper.find('button[title="Refazer (Ctrl+Y)"]');
            await redoBtn.trigger('click');
            expect(wrapper.emitted('redo')).toBeTruthy();
        });

        it('emite toggle-wrap, toggle-minimap e toggle-fullscreen ao clicar nos botões respectivos', async () => {
            const wrapper = mount(MaxInputCodeToolbar, {
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            const wrapBtn = wrapper.find('button[title="Alternar Quebra Automática de Linha"]');
            await wrapBtn.trigger('click');
            expect(wrapper.emitted('toggle-wrap')).toBeTruthy();

            const minimapBtn = wrapper.find('button[title="Alternar Mini-mapa Lateral"]');
            await minimapBtn.trigger('click');
            expect(wrapper.emitted('toggle-minimap')).toBeTruthy();

            const fullscreenBtn = wrapper.find('button[title="Tela Cheia"]');
            await fullscreenBtn.trigger('click');
            expect(wrapper.emitted('toggle-fullscreen')).toBeTruthy();
        });
    });

    describe('Props e Estados Visuais', () => {
        it('aplica classes ativas quando wordWrap, minimap e isFullscreen são true', () => {
            const wrapper = mount(MaxInputCodeToolbar, {
                props: {
                    wordWrap: true,
                    minimap: true,
                    isFullscreen: true
                },
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            const wrapBtn = wrapper.find('button[title="Alternar Quebra Automática de Linha"]');
            expect(wrapBtn.classes()).toContain('active');

            const minimapBtn = wrapper.find('button[title="Alternar Mini-mapa Lateral"]');
            expect(minimapBtn.classes()).toContain('active');

            const fullscreenBtn = wrapper.find('button[title="Sair da Tela Cheia (Esc)"]');
            expect(fullscreenBtn.classes()).toContain('active');
        });

        it('desabilita os controles quando props.disabled é true', () => {
            const wrapper = mount(MaxInputCodeToolbar, {
                props: {
                    disabled: true
                },
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            expect(wrapper.classes()).toContain('max-input-code-toolbar--disabled');

            const select = wrapper.find('select');
            expect(select.attributes('disabled')).toBeDefined();

            const buttons = wrapper.findAll('button');
            buttons.forEach((button) => {
                expect(button.attributes('disabled')).toBeDefined();
            });
        });

        it('utiliza lista customizada de linguagens quando fornecida', () => {
            const customLanguages = [
                { label: 'Rust Custom', value: 'rust' },
                { label: 'Go Custom', value: 'go' }
            ];

            const wrapper = mount(MaxInputCodeToolbar, {
                props: {
                    languages: customLanguages
                },
                global: {
                    stubs: {
                        MaxIcon: true
                    }
                }
            });

            const options = wrapper.findAll('option');
            expect(options).toHaveLength(2);
            expect(options[0].text()).toBe('Rust Custom');
            expect(options[1].text()).toBe('Go Custom');
        });
    });
});
