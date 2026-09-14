import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxLoadScreenTarget from '../../src/components/MaxLoadScreenTarget.vue';
import type { LoadingTarget } from '../../src/types/app';

describe('MaxLoadScreenTarget', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('não renderiza se target.items estiver vazio', async () => {
        const target: LoadingTarget = {
            target: 'body',
            items: {}
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target }
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-load-screen-target').exists()).toBe(false);
    });

    it('renderiza os itens de loading com suas mensagens e estados', async () => {
        const target: LoadingTarget = {
            target: 'body',
            items: {
                item1: {
                    key: 'k1',
                    message: 'Processando dados...',
                    status: 'loading'
                },
                item2: {
                    key: 'k2',
                    message: 'Concluído com sucesso',
                    status: 'done'
                },
                item3: {
                    key: 'k3',
                    message: 'Aguardando fila...',
                    status: 'waiting'
                },
                item4: {
                    key: 'k4',
                    message: 'Falha na operação',
                    status: 'error'
                }
            }
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target },
            global: {
                stubs: {
                    MaxIcon: true,
                    MaxDoneIcon: true,
                    MaxWaitIcon: true,
                    MaxErrorIcon: true,
                    MaxLoaderIcon: true
                }
            }
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-load-screen-target').exists()).toBe(true);
        expect(document.body.querySelectorAll('.load-screen-message-item')).toHaveLength(4);
        expect(document.body.textContent).toContain('Processando dados...');
        expect(document.body.textContent).toContain('Concluído com sucesso');
        expect(document.body.textContent).toContain('Aguardando fila...');
        expect(document.body.textContent).toContain('Falha na operação');
    });

    it('renderiza o slot default customizado quando fornecido', async () => {
        const target: LoadingTarget = {
            target: 'body',
            items: {
                item1: { key: 'k1', message: 'Carregando' }
            }
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target },
            slots: {
                default: '<div class="custom-loading">Aguarde um momento...</div>'
            }
        });
        await wrapper.vm.$nextTick();

        expect(document.body.querySelector('.custom-loading')?.textContent).toBe('Aguarde um momento...');
    });

    it('alvo inválido ou inexistente NÃO monta no body e emite aviso', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const target: LoadingTarget = {
            target: '#alvo-inexistente-xyz',
            items: {
                item1: { key: 'k1', message: 'Carregando...', status: 'loading' }
            }
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target }
        });
        await wrapper.vm.$nextTick();

        // Não deve renderizar a tela de loading nem anexar no body
        expect(wrapper.find('.max-load-screen-target').exists()).toBe(false);
        expect(document.body.querySelector('.load-screen')).toBeNull();
        expect(warnSpy).toHaveBeenCalled();
    });

    it('alvo local aplica classe is-local-target e aria-busy="true" no contêiner durante o carregamento', async () => {
        const host = document.createElement('div');
        host.id = 'painel-local';
        document.body.appendChild(host);

        const target: LoadingTarget = {
            target: '#painel-local',
            items: {
                item1: { key: 'k1', message: 'Carregando dados...', status: 'loading' }
            }
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target },
            attachTo: host
        });
        await wrapper.vm.$nextTick();

        expect(host.getAttribute('aria-busy')).toBe('true');
        const loadScreenEl = host.querySelector('.load-screen');
        expect(loadScreenEl).not.toBeNull();
        expect(loadScreenEl?.classList.contains('is-local-target')).toBe(true);

        wrapper.unmount();
        expect(host.getAttribute('aria-busy')).toBeNull();
        host.remove();
    });

    it('itens com erro possuem role="alert" e botões de retry e dismiss', async () => {
        const target: LoadingTarget = {
            target: 'body',
            items: {
                item1: {
                    key: 'k1',
                    message: 'Falha na conexão',
                    status: 'error',
                    retry: () => {}
                }
            }
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target }
        });
        await wrapper.vm.$nextTick();

        const errorItem = document.body.querySelector('.load-screen-message-item.status-error');
        expect(errorItem).not.toBeNull();
        expect(errorItem?.getAttribute('role')).toBe('alert');
        expect(errorItem?.getAttribute('aria-live')).toBe('assertive');

        expect(document.body.querySelector('.action-retry')).not.toBeNull();
        expect(document.body.querySelector('.action-dismiss')).not.toBeNull();

        wrapper.unmount();
    });

    it('aplica inert nos conteúdos encobertos e restaura o estado anterior ao finalizar', async () => {
        const host = document.createElement('div');
        host.id = 'painel-com-filhos';

        const btn1 = document.createElement('button');
        btn1.id = 'btn1';
        btn1.textContent = 'Ação 1';

        const btn2 = document.createElement('button');
        btn2.id = 'btn2';
        btn2.textContent = 'Já desabilitado';
        btn2.setAttribute('inert', '');

        host.appendChild(btn1);
        host.appendChild(btn2);
        document.body.appendChild(host);

        const target: LoadingTarget = {
            target: '#painel-com-filhos',
            items: {
                item1: { key: 'k1', message: 'Processando...', status: 'loading' }
            }
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target },
            attachTo: host
        });
        await wrapper.vm.$nextTick();

        // Enquanto pendente, btn1 deve ter recebido inert e btn2 continua com inert
        expect(btn1.hasAttribute('inert')).toBe(true);
        expect(btn2.hasAttribute('inert')).toBe(true);

        // Ao mudar para status done (não pendente), btn1 deve ter inert restaurado (removido) e btn2 preserva inert
        await wrapper.setProps({
            target: {
                target: '#painel-com-filhos',
                items: {
                    item1: { key: 'k1', message: 'Concluído', status: 'done' }
                }
            }
        });
        await wrapper.vm.$nextTick();

        expect(btn1.hasAttribute('inert')).toBe(false);
        expect(btn2.hasAttribute('inert')).toBe(true);

        wrapper.unmount();
        host.remove();
    });

    it('itens loading e done expõem role="status" com aria-atomic="true"', async () => {
        const target: LoadingTarget = {
            target: 'body',
            items: {
                item1: { key: 'k1', message: 'Carregando...', status: 'loading' },
                item2: { key: 'k2', message: 'Sucesso', status: 'done' }
            }
        };

        const wrapper = mount(MaxLoadScreenTarget, {
            props: { target }
        });
        await wrapper.vm.$nextTick();

        const statusItems = document.body.querySelectorAll('.load-screen-message-item[role="status"]');
        expect(statusItems).toHaveLength(2);
        statusItems.forEach((el) => {
            expect(el.getAttribute('aria-atomic')).toBe('true');
            expect(el.getAttribute('aria-live')).toBe('polite');
        });

        wrapper.unmount();
    });
});
