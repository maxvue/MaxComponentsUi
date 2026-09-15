import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxAuthCard from '../../src/components/MaxAuthCard.vue';
import { clearAuthOtpCache } from '../../src/helpers/clearAuthOtpCache';

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
            expect(wrapper.emitted('submit')![0][0]).toMatchObject({
                email: 'a@b.com',
                password: 'segredo',
                remember: true
            });
            expect(typeof (wrapper.emitted('submit')![0][0] as any).clearCache).toBe('function');
        });

        it('não emite submit quando loading=true', async () => {
            const wrapper = mountAuthCard({ loading: true, email: 'a@b.com', password: 'x' });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();

            expect(wrapper.emitted('submit')).toBeFalsy();
        });

        it('exibe a mensagem de erro quando a prop error é informada e associa via aria-describedby com ID único', () => {
            const wrapper = mountAuthCard({ error: 'Credenciais inválidas' });

            const errorEl = wrapper.find('.max-auth-error');
            expect(errorEl.exists()).toBe(true);
            expect(errorEl.attributes('id')).toMatch(/^max-auth-card-error-/);
            expect(errorEl.attributes('role')).toBe('alert');
            expect(errorEl.attributes('aria-live')).toBe('assertive');
            expect(errorEl.attributes('aria-atomic')).toBe('true');
            expect(errorEl.text()).toContain('Credenciais inválidas');

            const errorId = errorEl.attributes('id')!;
            const textInputs = wrapper.findAllComponents({ name: 'MaxInputText' });
            textInputs.forEach((input) => {
                expect(input.attributes('aria-describedby') || input.find('input').attributes('aria-describedby')).toContain(errorId);
            });
        });

        it('associa o container de grade ao erro via aria-describedby com ID único', () => {
            const wrapper = mountAuthCard({ error: 'Erro geral' });
            const errorEl = wrapper.find('.max-auth-error');
            const grid = wrapper.find('.auth-card-grid');
            expect(grid.attributes('aria-describedby')).toBe(errorEl.attributes('id'));
        });

        it('não duplica regiões alert simultâneas no card', () => {
            const wrapper = mountAuthCard({ error: 'Erro de autenticação' });
            const errorEl = wrapper.find('.max-auth-error');
            const alertEls = wrapper.findAll('[role="alert"]');
            expect(alertEls).toHaveLength(1);
            expect(alertEls[0].attributes('id')).toBe(errorEl.attributes('id'));
            expect(alertEls[0].attributes('aria-atomic')).toBe('true');
        });

        it('gera IDs de erro únicos e não colidentes ao montar duas instâncias simultâneas', () => {
            const wrapper1 = mountAuthCard({ error: 'Erro no form 1' });
            const wrapper2 = mountAuthCard({ error: 'Erro no form 2' });

            const errorEl1 = wrapper1.find('.max-auth-error');
            const errorEl2 = wrapper2.find('.max-auth-error');

            expect(errorEl1.exists()).toBe(true);
            expect(errorEl2.exists()).toBe(true);

            const id1 = errorEl1.attributes('id');
            const id2 = errorEl2.attributes('id');

            expect(id1).toMatch(/^max-auth-card-error-/);
            expect(id2).toMatch(/^max-auth-card-error-/);
            expect(id1).not.toBe(id2);

            // Cada grid referencia o ID exclusivo da sua respectiva instância
            expect(wrapper1.find('.auth-card-grid').attributes('aria-describedby')).toBe(id1);
            expect(wrapper2.find('.auth-card-grid').attributes('aria-describedby')).toBe(id2);

            // Cada input referencia o ID exclusivo da sua respectiva instância
            const inputs1 = wrapper1.findAllComponents({ name: 'MaxInputText' });
            inputs1.forEach((input) => {
                const describedBy = input.attributes('aria-describedby') || input.find('input').attributes('aria-describedby');
                expect(describedBy).toBe(id1);
            });

            const inputs2 = wrapper2.findAllComponents({ name: 'MaxInputText' });
            inputs2.forEach((input) => {
                const describedBy = input.attributes('aria-describedby') || input.find('input').attributes('aria-describedby');
                expect(describedBy).toBe(id2);
            });

            wrapper1.unmount();
            wrapper2.unmount();
        });

        it('não move foco passivamente no mount com erro, mas move após submissão inválida', async () => {
            const wrapper = mount(MaxAuthCard, {
                attachTo: document.body,
                props: { error: 'Credenciais inválidas', email: '', password: '' },
                global: {
                    stubs: {
                        'router-link': { template: '<a><slot /></a>' }
                    }
                }
            });

            const emailInput = wrapper.findAll('input').find((i) => i.attributes('type') === 'email');
            expect(emailInput).toBeTruthy();
            expect(document.activeElement).not.toBe(emailInput!.element);

            // Submissão inválida move o foco para o primeiro campo inválido
            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            expect(document.activeElement).toBe(emailInput!.element);
            wrapper.unmount();
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
        it('renderiza MaxInputPhone com bandeiras e não exibe MaxInputOTP antes do envio', () => {
            const wrapper = mountAuthCard({ mode: 'phone-otp' });

            expect(wrapper.findComponent({ name: 'MaxInputPhone' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(false);
            expect(wrapper.text()).toContain('Receber via WhatsApp');
            expect(wrapper.find('input[type="password"]').exists()).toBe(false);
        });

        it('não exibe MaxInputOTP ao apenas digitar o telefone antes do envio', () => {
            const wrapper = mountAuthCard({ mode: 'phone-otp', phone: '62999999999' });

            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(false);
        });

        it('ao pressionar ENTER com telefone preenchido antes do envio: dispara send-code e exibe MaxInputOTP', async () => {
            const wrapper = mountAuthCard({ mode: 'phone-otp', phone: '62999999999' });

            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(false);

            // Pressiona ENTER no card com telefone preenchido antes do envio (aciona submit nativo)
            await wrapper.find('form').trigger('submit');

            expect(wrapper.emitted('send-code')).toBeTruthy();
            const sendPayload = wrapper.emitted('send-code')![0][0] as any;
            expect(sendPayload.phone).toBe('62999999999');
            expect(sendPayload.endpoint.channel).toBe('whatsapp');

            await wrapper.vm.$nextTick();
            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(true);
        });

        it('ao pressionar ENTER com telefone vazio: move foco para o telefone e não envia código', async () => {
            const wrapper = mount(MaxAuthCard, {
                attachTo: document.body,
                props: { mode: 'phone-otp', phone: '' },
                global: {
                    stubs: {
                        'router-link': { template: '<a><slot /></a>' }
                    }
                }
            });

            await wrapper.find('form').trigger('submit');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('send-code')).toBeFalsy();
            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(false);

            const phoneInputEl = wrapper.find('.phone-number-input').element;
            expect(document.activeElement).toBe(phoneInputEl);
            wrapper.unmount();
        });

        it('dispara send-code com 1º endpoint prioritário ao clicar no botão de envio e passa a exibir MaxInputOTP', async () => {
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

        it('salva a sessão em JSON no localStorage ao enviar código', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999'
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();

            const sessionRaw = window.localStorage.getItem('max_auth_otp_session');
            expect(sessionRaw).toBeTruthy();
            const session = JSON.parse(sessionRaw!);
            expect(session.phone).toBe('62999999999');
            expect(session.timestamp).toBeGreaterThan(0);
        });

        it('restaura sessão, número de telefone, cooldown e exibe MaxInputOTP ao recarregar a página (mount com cache)', () => {
            const now = Date.now();
            const session = {
                phone: '62988881111',
                timestamp: now - 20000,
                channel: 'whatsapp',
                endpointIndex: 0
            };
            window.localStorage.setItem('max_auth_otp_session', JSON.stringify(session));
            window.localStorage.setItem('max_auth_otp_62988881111', JSON.stringify(session));

            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                cooldown: 60
            });

            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(true);
            const button = wrapper.findComponent({ name: 'MaxButton' });
            expect(button.props('label')).toBe('Solicitar novamente (40s)');
        });

        it('ao pressionar ENTER com código incompleto: nada acontece', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            // Envia código
            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Código com apenas 3 dígitos
            await wrapper.setProps({ code: '123' });
            await wrapper.vm.$nextTick();

            // Submete o form (como acionado pelo Enter)
            await wrapper.find('form').trigger('submit');

            expect(wrapper.emitted('submit')).toBeFalsy();
        });

        it('renderiza a opção "Manter conectado" no modo phone-otp por padrão e permite ocultar via showRemember=false', async () => {
            const wrapper = mountAuthCard({ mode: 'phone-otp' });

            expect(wrapper.findComponent({ name: 'MaxInputCheckbox' }).exists() || wrapper.find('.max-auth-remember').exists()).toBe(true);
            expect(wrapper.text()).toContain('Manter conectado');

            const wrapperNoRemember = mountAuthCard({ mode: 'phone-otp', showRemember: false });
            expect(wrapperNoRemember.findComponent({ name: 'MaxInputCheckbox' }).exists() || wrapperNoRemember.find('.max-auth-remember').exists()).toBe(false);
        });

        it('ao pressionar ENTER com código completo de 6 dígitos: efetua login com remember', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60,
                remember: true
            });

            // Envia código
            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Código completo de 6 dígitos
            await wrapper.setProps({ code: '654321' });
            await wrapper.vm.$nextTick();

            // Pressiona ENTER (aciona submit nativo do form)
            await wrapper.find('form').trigger('submit');

            expect(wrapper.emitted('submit')).toBeTruthy();
            const submitPayload = wrapper.emitted('submit')![0][0] as any;
            expect(submitPayload.phone).toBe('62999999999');
            expect(submitPayload.code).toBe('654321');
            expect(submitPayload.remember).toBe(true);
        });

        it('comportamento dinâmico do botão durante o cooldown com código incompleto (com disabled e role=status)', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Botão deve mostrar "Solicitar novamente (60s)", estar disabled e associado a role="status"
            expect(button.props('label')).toBe('Solicitar novamente (60s)');
            expect(button.props('disabled')).toBe(true);
            const statusEl = wrapper.find('#otp-cooldown-status');
            expect(statusEl.exists()).toBe(true);
            expect(statusEl.attributes('role')).toBe('status');
            expect(statusEl.text()).toContain('Aguarde 60s');
            expect(button.attributes('aria-describedby')).toBe('otp-cooldown-status');

            // Clica no botão durante o cooldown com código incompleto
            await (button.props('action') as any)?.();
            // Não dispara novo send-code nem submit
            expect(wrapper.emitted('send-code')?.length).toBe(1);
            expect(wrapper.emitted('resend-code')).toBeFalsy();
            expect(wrapper.emitted('submit')).toBeFalsy();

            // Pressiona Enter / submit durante cooldown com código incompleto: não contorna cooldown
            await wrapper.find('form').trigger('submit');
            expect(wrapper.emitted('submit')).toBeFalsy();

            // Avança 30 segundos
            vi.advanceTimersByTime(30000);
            await wrapper.vm.$nextTick();
            expect(button.props('label')).toBe('Solicitar novamente (30s)');
            expect(button.props('disabled')).toBe(true);
            expect(wrapper.find('#otp-cooldown-status').text()).toContain('Aguarde 30s');

            // Avança até o final do cooldown (mais 30 segundos)
            vi.advanceTimersByTime(30000);
            await wrapper.vm.$nextTick();
            expect(button.props('label')).toBe('Solicitar código novamente');
            expect(button.props('disabled')).toBe(false);
            expect(wrapper.find('#otp-cooldown-status').exists()).toBe(false);
        });

        it('botão dinâmico muda para "Entrar" quando todos os 6 dígitos forem preenchidos', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60,
                remember: false
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
            expect(submitPayload.remember).toBe(false);
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

        it('disponibiliza clearCache no payload do evento submit para limpar o cache após login bem-sucedido', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            // Envia código
            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            // Verifica que o cache foi gravado
            expect(window.localStorage.getItem('max_auth_otp_session')).toBeTruthy();
            expect(window.localStorage.getItem('max_auth_otp_62999999999')).toBeTruthy();

            // Digita código completo
            await wrapper.setProps({ code: '654321' });
            await wrapper.vm.$nextTick();

            // Clica em Entrar
            await (button.props('action') as any)?.();

            expect(wrapper.emitted('submit')).toBeTruthy();
            const submitPayload = wrapper.emitted('submit')![0][0] as any;
            expect(typeof submitPayload.clearCache).toBe('function');

            // Simula o consumidor chamando clearCache() após o login bem-sucedido na API
            submitPayload.clearCache();

            // Verifica que o localStorage foi limpo
            expect(window.localStorage.getItem('max_auth_otp_session')).toBeNull();
            expect(window.localStorage.getItem('max_auth_otp_62999999999')).toBeNull();

            // Verifica que o MaxInputOTP voltou a ficar oculto
            await wrapper.vm.$nextTick();
            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(false);
        });

        it('permite chamar clearCache via método exposto no componente (defineExpose)', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62999999999',
                cooldown: 60
            });

            const button = wrapper.findComponent({ name: 'MaxButton' });
            await (button.props('action') as any)?.();
            await wrapper.vm.$nextTick();

            expect(window.localStorage.getItem('max_auth_otp_session')).toBeTruthy();

            // Chama o método exposto
            (wrapper.vm as any).clearCache();

            expect(window.localStorage.getItem('max_auth_otp_session')).toBeNull();
            expect(window.localStorage.getItem('max_auth_otp_62999999999')).toBeNull();

            await wrapper.vm.$nextTick();
            expect(wrapper.findComponent({ name: 'MaxInputOTP' }).exists()).toBe(false);
        });

        it('função utilitária clearAuthOtpCache remove chaves específicas e globais', () => {
            window.localStorage.setItem('max_auth_otp_session', '{"phone":"123"}');
            window.localStorage.setItem('max_auth_otp_123', '{"phone":"123"}');
            window.localStorage.setItem('max_auth_otp_456', '{"phone":"456"}');

            clearAuthOtpCache('max_auth_otp_', '123');

            expect(window.localStorage.getItem('max_auth_otp_session')).toBeNull();
            expect(window.localStorage.getItem('max_auth_otp_123')).toBeNull();
            expect(window.localStorage.getItem('max_auth_otp_456')).toBeTruthy();

            // Limpa tudo
            clearAuthOtpCache('max_auth_otp_');
            expect(window.localStorage.getItem('max_auth_otp_456')).toBeNull();
        });
    });

    describe('Submit Nativo HTML5 e Acessibilidade de Feedback (R14 / F21)', () => {
        it('botão principal possui type="submit" no modo password e no modo phone-otp', () => {
            const wrapperPassword = mountAuthCard({ mode: 'password' });
            const btnPassword = wrapperPassword.findComponent({ name: 'MaxButton' });
            expect(btnPassword.props('type')).toBe('submit');
            expect(btnPassword.find('button').attributes('type')).toBe('submit');

            const wrapperPhoneOtp = mountAuthCard({ mode: 'phone-otp' });
            const btnPhoneOtp = wrapperPhoneOtp.findComponent({ name: 'MaxButton' });
            expect(btnPhoneOtp.props('type')).toBe('submit');
            expect(btnPhoneOtp.find('button').attributes('type')).toBe('submit');
        });

        it('submete o formulário via evento submit nativo HTML5 (simulando Enter em input ou autofill)', async () => {
            const wrapper = mountAuthCard({
                email: 'usuario@teste.com',
                password: 'minhasenha123',
                remember: true
            });

            // Dispara submit nativo diretamente no elemento <form>
            await wrapper.find('form').trigger('submit');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('submit')).toBeTruthy();
            expect(wrapper.emitted('submit')).toHaveLength(1);
            expect(wrapper.emitted('submit')![0][0]).toMatchObject({
                email: 'usuario@teste.com',
                password: 'minhasenha123',
                remember: true
            });
        });

        it('garante ausência de submissão duplicada quando click no botão de submit e evento submit ocorrem no mesmo ciclo', async () => {
            const wrapper = mountAuthCard({
                email: 'usuario@teste.com',
                password: 'minhasenha123',
                remember: true
            });

            // Dispara click no botão e submit no form no mesmo ciclo de eventos
            const btn = wrapper.findComponent({ name: 'MaxButton' });
            (btn.props('action') as any)?.();
            await wrapper.find('form').trigger('submit');
            await wrapper.vm.$nextTick();

            // A proteção de coalescência garante EXATAMENTE 1 emissão
            expect(wrapper.emitted('submit')).toHaveLength(1);
        });

        it('suporta autofill nativo onde valores são injetados e form.submit é acionado', async () => {
            const wrapper = mountAuthCard();

            const inputs = wrapper.findAll('input');
            const emailInput = inputs.find((i) => i.attributes('type') === 'email') ?? inputs[0];
            const passInput = inputs.find((i) => i.attributes('type') === 'password') ?? inputs[1];

            // Simula preenchimento por gerenciador de senhas / autofill do navegador
            await emailInput.setValue('autofill@empresa.com');
            await passInput.setValue('senhaForteAutofill!#');

            // Gerenciador submete o form nativo
            await wrapper.find('form').trigger('submit');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('submit')).toBeTruthy();
            expect(wrapper.emitted('submit')![0][0]).toMatchObject({
                email: 'autofill@empresa.com',
                password: 'senhaForteAutofill!#'
            });
        });

        it('modo phone-otp submete envio de código via evento submit nativo', async () => {
            const wrapper = mountAuthCard({
                mode: 'phone-otp',
                phone: '62988887777'
            });

            // Dispara submit nativo no <form>
            await wrapper.find('form').trigger('submit');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('send-code')).toBeTruthy();
            expect(wrapper.emitted('send-code')).toHaveLength(1);
            const payload = wrapper.emitted('send-code')![0][0] as any;
            expect(payload.phone).toBe('62988887777');
        });

        it('instâncias concorrentes com erros independentes mantêm IDs distintos e exatamente 1 live region alert cada', async () => {
            const wrapperA = mountAuthCard({ error: 'Erro no Card A' });
            const wrapperB = mountAuthCard();

            expect(wrapperA.findAll('[role="alert"]')).toHaveLength(1);
            expect(wrapperB.findAll('[role="alert"]')).toHaveLength(0);

            const alertA = wrapperA.find('[role="alert"]');
            const idA = alertA.attributes('id');

            // Adiciona erro ao Card B
            await wrapperB.setProps({ error: 'Erro no Card B' });
            await wrapperB.vm.$nextTick();

            expect(wrapperB.findAll('[role="alert"]')).toHaveLength(1);
            const alertB = wrapperB.find('[role="alert"]');
            const idB = alertB.attributes('id');

            expect(idA).not.toBe(idB);
            expect(alertA.text()).toContain('Erro no Card A');
            expect(alertB.text()).toContain('Erro no Card B');

            // Atualiza erro do Card A
            await wrapperA.setProps({ error: 'Erro no Card A Atualizado' });
            await wrapperA.vm.$nextTick();

            expect(wrapperA.findAll('[role="alert"]')).toHaveLength(1);
            expect(wrapperB.findAll('[role="alert"]')).toHaveLength(1);
            expect(wrapperA.find('[role="alert"]').text()).toContain('Erro no Card A Atualizado');
            expect(wrapperB.find('[role="alert"]').text()).toContain('Erro no Card B');
        });

        it('adversarial: ciclo completo de tecla Enter (submit nativo no pressionamento e keyup 80ms depois) emite submit exatamente uma vez', async () => {
            const wrapper = mountAuthCard({
                email: 'adversarial@teste.com',
                password: 'senhaSegura123!',
                remember: true
            });

            // 1. Navegador dispara submit nativo ao pressionar Enter em campo de formulário
            await wrapper.find('form').trigger('submit');
            await wrapper.vm.$nextTick();

            // 2. Tecla Enter é liberada 80ms depois (keyup borbulha até o form)
            vi.advanceTimersByTime(80);
            const passInput = wrapper.findAll('input').find((i) => i.attributes('type') === 'password');
            if (passInput) await passInput.trigger('keyup.enter');
            await wrapper.find('form').trigger('keyup.enter');
            await wrapper.vm.$nextTick();

            // Sem handler duplicado @keyup.enter no form, emite EXATAMENTE 1 vez
            const emitted = wrapper.emitted('submit');
            expect(emitted).toHaveLength(1);
        });
    });
});
