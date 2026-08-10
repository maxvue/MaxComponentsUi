import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxAuthCard from '../../src/components/MaxAuthCard.vue';

function mountAuthCard(props: Record<string, any> = {}) {
    return mount(MaxAuthCard, {
        props,
        global: {
            stubs: {
                'router-link': { template: '<a><slot /></a>' }
            }
        }
    });
}

describe('MaxAuthCard', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o título e subtítulo padrão em pt-BR', () => {
        const wrapper = mountAuthCard();

        expect(wrapper.text()).toContain('Acesse sua conta');
        expect(wrapper.text()).toContain('Bem-vindo de volta');
    });

    it('renderiza campo de e-mail por padrão (identifier=email)', () => {
        const wrapper = mountAuthCard();

        expect(wrapper.findComponent({ name: 'MaxInputText' }).exists() || wrapper.find('input[type="email"]').exists()).toBeTruthy();
    });

    it('atualiza o v-model de email ao digitar no campo', async () => {
        const wrapper = mountAuthCard({ email: '' });
        const inputs = wrapper.findAll('input');
        const emailInput = inputs.find((i) => i.attributes('type') === 'email') ?? inputs[0];

        await emailInput.setValue('teste@example.com');

        expect(wrapper.emitted('update:email')).toBeTruthy();
        const emitted = wrapper.emitted('update:email')!;
        expect(emitted[emitted.length - 1]).toEqual(['teste@example.com']);
    });

    it('emite submit com email, password e remember ao chamar onSubmit', async () => {
        const wrapper = mountAuthCard({ email: 'a@b.com', password: 'segredo', remember: true });

        const button = wrapper.findComponent({ name: 'MaxButton' });
        expect(button.exists()).toBe(true);

        await (button.props('action') as any)?.();

        expect(wrapper.emitted('submit')).toBeTruthy();
        expect(wrapper.emitted('submit')![0][0]).toEqual({
            email: 'a@b.com',
            password: 'segredo',
            remember: true
        });
    });

    it('não emite submit quando loading=true', async () => {
        const wrapper = mountAuthCard({ loading: true, email: 'a@b.com', password: 'x' });

        const button = wrapper.findComponent({ name: 'MaxButton' });
        await (button.props('action') as any)?.();

        expect(wrapper.emitted('submit')).toBeFalsy();
    });

    it('exibe a mensagem de erro quando a prop error é informada', () => {
        const wrapper = mountAuthCard({ error: 'Credenciais inválidas' });

        expect(wrapper.text()).toContain('Credenciais inválidas');
    });

    it('renderiza os botões de provedores sociais e emite o evento social ao clicar', async () => {
        const wrapper = mountAuthCard({
            providers: [{ id: 'google', label: 'Google', icon: 'mdi:google' }]
        });

        const socialButtons = wrapper.findAllComponents({ name: 'MaxButton' });
        const googleButton = socialButtons.find((b) => b.props('label') === 'Google');
        expect(googleButton).toBeTruthy();

        await (googleButton!.props('action') as any)?.();

        expect(wrapper.emitted('social')).toBeTruthy();
        expect(wrapper.emitted('social')![0]).toEqual(['google']);
    });

    it('não renderiza a seção de provedores sociais quando providers está vazio', () => {
        const wrapper = mountAuthCard();

        expect(wrapper.find('.max-auth-social').exists()).toBe(false);
    });

    it('permite sobrescrever os textos via a prop labels', () => {
        const wrapper = mountAuthCard({ labels: { submit: 'Login customizado' } });

        expect(wrapper.text()).toContain('Login customizado');
    });
});
