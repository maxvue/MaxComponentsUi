import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAlert from '../../src/components/MaxAlert.vue';

describe('MaxAlert.vue', () => {
    it('não deve renderizar quando não houver título, mensagem ou slot default', () => {
        const wrapper = mount(MaxAlert);
        expect(wrapper.find('.max-alert').exists()).toBe(false);
    });

    it('deve renderizar com título e mensagem', () => {
        const wrapper = mount(MaxAlert, {
            props: {
                title: 'Atenção',
                message: 'Operação realizada com sucesso.'
            }
        });
        expect(wrapper.find('.max-alert').exists()).toBe(true);
        expect(wrapper.find('.max-alert__title').text()).toBe('Atenção');
        expect(wrapper.find('.max-alert__message').text()).toBe('Operação realizada com sucesso.');
    });

    it('deve aplicar atributos de acessibilidade para severidade info (padrão)', () => {
        const wrapper = mount(MaxAlert, {
            props: {
                message: 'Informação útil',
                severity: 'info'
            }
        });
        const alert = wrapper.find('.max-alert');
        expect(alert.attributes('role')).toBe('status');
        expect(alert.attributes('aria-live')).toBe('polite');
    });

    it('deve aplicar role alert e live assertive para severidade danger', () => {
        const wrapper = mount(MaxAlert, {
            props: {
                message: 'Erro grave',
                severity: 'danger'
            }
        });
        const alert = wrapper.find('.max-alert');
        expect(alert.attributes('role')).toBe('alert');
        expect(alert.attributes('aria-live')).toBe('assertive');
    });

    it('deve respeitar override de live', () => {
        const wrapper = mount(MaxAlert, {
            props: {
                message: 'Aviso suave',
                severity: 'danger',
                live: 'polite'
            }
        });
        expect(wrapper.find('.max-alert').attributes('aria-live')).toBe('polite');
    });

    it('deve emitir evento close ao clicar no botão de fechar quando closable for true', async () => {
        const wrapper = mount(MaxAlert, {
            props: {
                message: 'Alerta fechável',
                closable: true
            }
        });
        const closeBtn = wrapper.find('.max-alert__close-button');
        expect(closeBtn.exists()).toBe(true);
        expect(closeBtn.attributes('aria-label')).toBe('Fechar alerta');

        await closeBtn.trigger('click');
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('deve renderizar slots customizados', () => {
        const wrapper = mount(MaxAlert, {
            slots: {
                default: '<div class="custom-body">Conteúdo customizado</div>',
                actions: '<button class="custom-action">Ação</button>'
            }
        });
        expect(wrapper.find('.custom-body').text()).toBe('Conteúdo customizado');
        expect(wrapper.find('.custom-action').text()).toBe('Ação');
    });
});
