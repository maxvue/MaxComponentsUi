import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxQueryState from '../../src/components/MaxQueryState.vue';

describe('MaxQueryState.vue', () => {
    it('deve renderizar estado loading com atributos acessíveis e sem exibir slot default', () => {
        const wrapper = mount(MaxQueryState, {
            props: {
                state: 'loading'
            },
            slots: {
                default: '<div class="data-content">Meus Dados</div>'
            }
        });
        expect(wrapper.find('.max-query-state__loading').exists()).toBe(true);
        expect(wrapper.find('.data-content').exists()).toBe(false);
        expect(wrapper.find('.max-query-state__loading').attributes('role')).toBe('status');
        expect(wrapper.find('.max-query-state__loading').attributes('aria-live')).toBe('polite');
    });

    it('deve renderizar estado ready-empty quando a consulta terminar sem dados', () => {
        const wrapper = mount(MaxQueryState, {
            props: {
                state: 'ready-empty',
                message: 'Nenhum item localizado'
            }
        });
        expect(wrapper.find('.max-query-state__empty').exists()).toBe(true);
        expect(wrapper.text()).toContain('Nenhum item localizado');
    });

    it('deve renderizar estado error com MaxAlert danger e botão de retry quando retryable for true', async () => {
        const wrapper = mount(MaxQueryState, {
            props: {
                state: 'error',
                title: 'Falha na conexão',
                message: 'Servidor indisponível',
                retryable: true
            }
        });
        expect(wrapper.find('.max-query-state__error').exists()).toBe(true);
        expect(wrapper.text()).toContain('Falha na conexão');
        expect(wrapper.text()).toContain('Servidor indisponível');

        const retryBtn = wrapper.find('button');
        expect(retryBtn.exists()).toBe(true);
        await retryBtn.trigger('click');
        expect(wrapper.emitted('retry')).toHaveLength(1);
    });

    it('deve renderizar estado ready-with-data exibindo o slot default', () => {
        const wrapper = mount(MaxQueryState, {
            props: {
                state: 'ready-with-data'
            },
            slots: {
                default: '<div class="data-content">Conteúdo Carregado</div>'
            }
        });
        expect(wrapper.find('.data-content').exists()).toBe(true);
        expect(wrapper.text()).toContain('Conteúdo Carregado');
    });

    it('deve renderizar estado stale mantendo o slot default E exibindo banner de dados em cache', async () => {
        const wrapper = mount(MaxQueryState, {
            props: {
                state: 'stale',
                retryable: true
            },
            slots: {
                default: '<div class="data-content">Conteúdo Antigo Preservado</div>'
            }
        });
        expect(wrapper.find('.data-content').exists()).toBe(true);
        expect(wrapper.find('.max-query-state__stale-banner').exists()).toBe(true);
        expect(wrapper.text()).toContain('Dados em cache');

        const retryBtn = wrapper.find('.max-query-state__stale-banner button');
        expect(retryBtn.exists()).toBe(true);
        await retryBtn.trigger('click');
        expect(wrapper.emitted('retry')).toHaveLength(1);
    });
});
