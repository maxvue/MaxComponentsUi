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
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
        it('renderiza o campo de telefone na Etapa 1 por padrão', () => {
            const wrapper = mountAuthCard({ mode: 'phone-otp' });

            expect(wrapper.findComponent({ name: 'MaxPhoneField' }).exists()).toBe(true);
            expect(wrapper.text()).toContain('Receber via WhatsApp');
            expect(wrapper.find('input[type="password"]').exists()).toBe(false);
        });

        it('dispara send-code com o 1º endpoint prioritário ao submeter telefone', async () => {
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

            // Verifica avanço automático para etapa 'code'
            expect(wrapper.emitted('change-step')).toBeTruthy();
            expect(wrapper.emitted('change-step')![0]).toEqual(['code']);
            expect(wrapper.emitted('update:step')![0]).toEqual(['code']);
        });

        it('não avança nem emite send-code se phone estiver vazio', async () => {
            const wrapper = mountAuthCard({ mode: 'phone-otp', phone: '' });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();

            expect(wrapper.emitted('send-code')).toBeFalsy();
        });

        it('não avança automaticamente quando autoAdvance=false', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                autoAdvance: false
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();

            expect(wrapper.emitted('send-code')).toBeTruthy();
            expect(wrapper.emitted('change-step')).toBeFalsy();
        });

        it('renderiza a Etapa 2 (código OTP) com telefone e botão de confirmação', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                step: 'code',
                phone: '62999999999',
                code: '123456'
            });

            expect(wrapper.text()).toContain('62999999999');
            expect(wrapper.text()).toContain('Alterar número');
            expect(wrapper.find('.max-auth-code-input').exists() || wrapper.findComponent({ name: 'MaxInputText' }).exists()).toBe(true);

            const verifyButton = wrapper.findAllComponents({ name: 'MaxButton' })[0];
            expect(verifyButton.props('label')).toBe('Confirmar código');

            await (verifyButton.props('action') as any)?.();

            expect(wrapper.emitted('submit')).toBeTruthy();
            const submitPayload = wrapper.emitted('submit')![0][0] as any;
            expect(submitPayload.phone).toBe('62999999999');
            expect(submitPayload.code).toBe('123456');
            expect(submitPayload.endpoint.channel).toBe('whatsapp');
        });

        it('permite retornar para a etapa de telefone ao clicar em Alterar número', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                step: 'code',
                phone: '62999999999'
            });

            const changeBtn = wrapper.find('.max-auth-change-phone-btn');
            expect(changeBtn.exists()).toBe(true);

            await changeBtn.trigger('click');

            expect(wrapper.emitted('change-step')).toBeTruthy();
            expect(wrapper.emitted('change-step')![0]).toEqual(['phone']);
            expect(wrapper.emitted('update:step')![0]).toEqual(['phone']);
        });

        it('gerencia o temporizador de cooldown e o reenvio pelo próximo endpoint prioritário', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 30
            });

            // Dispara envio inicial
            const sendButton = wrapper.findComponent({ name: 'MaxButton' });
            await (sendButton.props('action') as any)?.();

            await wrapper.vm.$nextTick();

            // Na etapa 'code', o cooldown está ativo (30s)
            const resendBtn = wrapper.find('.max-auth-resend-btn');
            expect(resendBtn.attributes('disabled')).toBeDefined();
            expect(resendBtn.text()).toContain('Reenviar em 30s');

            // Avança 15s no timer
            vi.advanceTimersByTime(15000);
            await wrapper.vm.$nextTick();
            expect(resendBtn.text()).toContain('Reenviar em 15s');

            // Avança os 15s restantes
            vi.advanceTimersByTime(15000);
            await wrapper.vm.$nextTick();

            // Cooldown zerou: botão habilitado mostrando o próximo endpoint (SMS)
            expect(resendBtn.attributes('disabled')).toBeUndefined();
            expect(resendBtn.text()).toContain('Receber via SMS');

            // Clica em reenviar por SMS
            await resendBtn.trigger('click');

            expect(wrapper.emitted('resend-code')).toBeTruthy();
            const resendPayload = wrapper.emitted('resend-code')![0][0] as any;
            expect(resendPayload.phone).toBe('62999999999');
            expect(resendPayload.endpoint.channel).toBe('sms');
            expect(resendPayload.index).toBe(1);

            // Cooldown reinicia
            await wrapper.vm.$nextTick();
            expect(resendBtn.attributes('disabled')).toBeDefined();
            expect(resendBtn.text()).toContain('Reenviar em 30s');
        });

        it('aceita lista customizada de endpoints', async () => {
            const customEndpoints = [
                { url: '/api/otp/zap', label: 'Zap Prioritário', channel: 'whatsapp' },
                { url: '/api/otp/sms', label: 'SMS Secundário', channel: 'sms' },
                { url: '/api/otp/call', label: 'Ligação de Voz', channel: 'call' }
            ];

            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62988887777',
                endpoints: customEndpoints,
                cooldown: 0
            });

            // 1º botão exibe o label do 1º endpoint
            const sendButton = wrapper.findComponent({ name: 'MaxButton' });
            expect(sendButton.props('label')).toBe('Zap Prioritário');

            await (sendButton.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Na etapa de código, o reenvio oferece o 2º endpoint
            const resendBtn = wrapper.find('.max-auth-resend-btn');
            expect(resendBtn.text()).toBe('SMS Secundário');

            await resendBtn.trigger('click');
            expect(wrapper.emitted('resend-code')![0][0]).toMatchObject({
                endpoint: customEndpoints[1],
                index: 1
            });

            // Próximo reenvio oferece o 3º endpoint
            await resendBtn.trigger('click');
            expect(wrapper.emitted('resend-code')![1][0]).toMatchObject({
                endpoint: customEndpoints[2],
                index: 2
            });

            // Próximo reenvio cicla de volta para o 1º endpoint
            await resendBtn.trigger('click');
            expect(wrapper.emitted('resend-code')![2][0]).toMatchObject({
                endpoint: customEndpoints[0],
                index: 0
            });
        });
    });
});

