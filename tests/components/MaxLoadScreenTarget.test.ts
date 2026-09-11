import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxLoadScreenTarget from '../../src/components/MaxLoadScreenTarget.vue';
import type { LoadingTarget } from '../../src/types/app';

describe('MaxLoadScreenTarget', () => {
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
});
