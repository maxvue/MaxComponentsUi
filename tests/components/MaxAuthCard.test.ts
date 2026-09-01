import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
        vi.useFakeTimers();
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
    });

    describe('Modo Tradicional (mode=password)', () => {
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

    describe('Modo Telefone / OTP (mode=phone-otp)', () => {
        it('renderiza MaxPhoneField com bandeiras e não exibe MaxInputOTP antes do envio', () => {
            const wrapper = mountAuthCard({ mode: 'phone-otp' });

            expect(wrapper.findComponent({ name: 'MaxPhoneField' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(false);
            expect(wrapper.text()).toContain('Receber via WhatsApp');
            expect(wrapper.find('input[type="password"]').exists()).toBe(false);
        });

        it('dispara send-code com 1º endpoint prioritário ao submeter telefone e passa a exibir MaxInputOTP', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999'
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();

            expect(wrapper.emitted('send-code')).toBeTruthy();
            const sendPayload = wrapper.emitted('send-code')![0][0] as any;
            expect(sendPayload.phone).toBe('62999999999');
            expect(sendPayload.endpoint.channel).toBe('whatsapp');
            expect(sendPayload.index).toBe(0);

            await wrapper.vm.$nextTick();
            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(true);
        });

        it('salva o timestamp no localStorage ao enviar código para persistir cooldown', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999'
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();

            const saved = window.localStorage.getItem('max_auth_otp_62999999999');
            expect(saved).toBeTruthy();
            expect(Number(saved)).toBeGreaterThan(0);
        });

        it('restaura cooldown e exibe MaxInputOTP ao montar com timestamp recente no cache', () => {
            const now = Date.now();
            // Simula envio realizado há 20 segundos
            window.localStorage.setItem('max_auth_otp_62999999999', String(now - 20000));

            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(true);
            const button = wrapper.findComponent({ name: 'MaxButton' });
            expect(button.props('label')).toBe('Solicitar novamente (40s)');
        });

        it('comportamento dinâmico do botão durante o cooldown com código incompleto (no-op e sem disabled)', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Botão deve mostrar "Solicitar novamente (60s)"
            expect(button.props('label')).toBe('Solicitar novamente (60s)');
            // Não deve ter atributo disabled
            expect(button.attributes('disabled')).toBeUndefined();

            // Clica no botão durante o cooldown com código incompleto
            await (button.props('action') as any)?.();
            // Não dispara novo send-code nem submit
            expect(wrapper.emitted('send-code')?.length).toBe(1);
            expect(wrapper.emitted('resend-code')).toBeFalsy();
            expect(wrapper.emitted('submit')).toBeFalsy();

            // Avança 30 segundos
            vi.advanceTimersByTime(30000);
            await wrapper.vm.$nextTick();
            expect(button.props('label')).toBe('Solicitar novamente (30s)');
            expect(button.attributes('disabled')).toBeUndefined();
        });

        it('botão dinâmico muda para "Entrar" quando todos os 6 dígitos forem preenchidos', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Preenche o código com 6 dígitos
            await wrapper.setProps({ code: '123456' });
            await wrapper.vm.$nextTick();

            expect(button.props('label')).toBe('Entrar');
            expect(button.attributes('disabled')).toBeUndefined();

            // Ao clicar, efetua login emitindo submit
            await (button.props('action') as any)?.();

            expect(wrapper.emitted('submit')).toBeTruthy();
            const submitPayload = wrapper.emitted('submit')![0][0] as any;
            expect(submitPayload.phone).toBe('62999999999');
            expect(submitPayload.code).toBe('123456');
            expect(submitPayload.endpoint.channel).toBe('whatsapp');
        });

        it('botão dinâmico muda para "Solicitar código novamente" após 60s com código incompleto', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Avança 60 segundos
            vi.advanceTimersByTime(60000);
            await wrapper.vm.$nextTick();

            expect(button.props('label')).toBe('Solicitar código novamente');
            expect(button.attributes('disabled')).toBeUndefined();

            // Ao clicar, reenvia código para o próximo endpoint (SMS)
            await (button.props('action') as any)?.();

            expect(wrapper.emitted('resend-code')).toBeTruthy();
            const resendPayload = wrapper.emitted('resend-code')![0][0] as any;
            expect(resendPayload.phone).toBe('62999999999');
            expect(resendPayload.endpoint.channel).toBe('sms');
            expect(resendPayload.index).toBe(1);

            // Cooldown reinicia em 60s
            await wrapper.vm.$nextTick();
            expect(button.props('label')).toBe('Solicitar novamente (60s)');
        });
    });
});


