<template>
    <div class="max-auth-page" s100 flex items-center justify-center>
        <div class="max-auth-card">
            <slot name="header" :step="codeSent ? 'code' : 'phone'" :mode="mode" :phone="phone">
                <MaxTitle2
                    :icon="mode === 'phone-otp' && codeSent ? 'mdi:shield-check-outline' : icon"
                    :title="computedTitle"
                    :subtitle="computedSubtitle"
                    center
                    p0
                />
            </slot>

            <MaxGrid mt-6 gap-4>
                <!-- Modo Tradicional (E-mail / Senha) -->
                <template v-if="mode === 'password'">
                    <MaxInputPhoneMail s100 v-if="identifier === 'email-phone'" v-model="email" @keyup.enter="onSubmit" />
                    <MaxInputText s100 v-else :label="t.email" type="email" v-model="email" icon="mdi:email-outline" @keyup.enter="onSubmit" />
                    <MaxInputText s100 :label="t.password" type="password" v-model="password" icon="mdi:lock-outline" @keyup.enter="onSubmit" />

                    <div class="max-auth-options" s100 v-if="showRemember || forgotTo">
                        <label class="max-auth-remember" v-if="showRemember">
                            <input type="checkbox" v-model="remember" />
                            <span>{{ t.remember }}</span>
                        </label>
                        <router-link v-if="forgotTo" :to="forgotTo" class="max-auth-link max-auth-link--muted">{{ t.forgot }}</router-link>
                    </div>

                    <slot name="extra"></slot>

                    <span s100 class="max-auth-error" v-if="error">{{ error }}</span>

                    <MaxButton s100 :label="t.submit" icon="mdi:login" :loading="loading" :action="onSubmit" />
                </template>

                <!-- Modo Phone OTP (Telefone + MaxInputOTP + Botão Dinâmico) -->
                <template v-else-if="mode === 'phone-otp'">
                    <slot name="phone-input">
                        <MaxPhoneField s100 v-model="phone" :label="t.phone" @keyup.enter="handleDynamicSubmit" />
                    </slot>

                    <!-- Campo de Código de 6 Dígitos (exibido apenas após o envio) -->
                    <template v-if="codeSent">
                        <slot name="code-input">
                            <MaxInputOTP
                                s100
                                v-model="code"
                                :length="codeLength"
                                :integer-only="true"
                                :autofocus="true"
                                @complete="handleDynamicSubmit"
                            />
                        </slot>
                    </template>

                    <slot name="extra"></slot>

                    <span s100 class="max-auth-error" v-if="error">{{ error }}</span>

                    <!-- Botão Dinâmico de Ação Única (sem disabled) -->
                    <MaxButton
                        s100
                        :label="dynamicButtonLabel"
                        :icon="dynamicButtonIcon"
                        :loading="loading"
                        :action="handleDynamicSubmit"
                    />
                </template>

                <!-- Provedores Sociais -->
                <template v-if="providers.length">
                    <div class="max-auth-divider" s100>
                        <div class="line"></div>
                        <span class="text">{{ t.socialDivider }}</span>
                        <div class="line"></div>
                    </div>

                    <div class="max-auth-social" s100>
                        <MaxButton
                            v-for="provider in providers"
                            :key="provider.id"
                            :label="provider.label"
                            :icon="provider.icon"
                            class="max-auth-social-btn"
                            :class="provider.class"
                            :action="() => emit('social', provider.id)"
                        />
                    </div>
                </template>

                <!-- Footer (ex: Cadastre-se) -->
                <slot name="footer">
                    <div flex justify-center mt-4 text-sm class="max-auth-register" v-if="registerTo">
                        <span class="text-secondary">{{ t.registerPrompt }}</span>
                        <router-link :to="registerTo" class="max-auth-link" ml-1>{{ t.register }}</router-link>
                    </div>
                </slot>
            </MaxGrid>
        </div>
    </div>
</template>

/**
 * Card de autenticação reutilizável (login tradicional ou por telefone/OTP).
 * Componente puramente visual: não conhece HTTP, router store nem store.
 * Emite os eventos `submit`, `send-code`, `resend-code` e `social` para o projeto consumidor tratar a lógica.
 */
<script setup lang="ts">
    import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
    import type { RouteLocationRaw } from 'vue-router';
    import MaxTitle2 from './MaxTitle2.vue';
    import MaxGrid from './MaxGrid.vue';
    import MaxInputText from './MaxInputText.vue';
    import MaxInputPhoneMail from './MaxInputPhoneMail.vue';
    import MaxPhoneField from './MaxPhoneField.vue';
    import MaxInputOTP from './MaxInputOTP.vue';
    import MaxButton from './MaxButton.vue';

    /** Provedor de login social configurável */
    export interface AuthProvider {
        /** Identificador enviado no evento `social` (ex: 'google') */
        id: string;
        /** Rótulo exibido no botão */
        label: string;
        /** Ícone (ex: 'mdi:google') */
        icon: string;
        /** Classe(s) CSS opcional(is) para customizar a cor de marca */
        class?: string;
    }

    /** Endpoint de envio/validação de código OTP ordenado por prioridade */
    export interface AuthOtpEndpoint {
        /** URL do endpoint no backend (ex: '/api/auth/otp/whatsapp') */
        url?: string;
        /** Rótulo do botão de ação/reenvio (ex: 'Receber via WhatsApp') */
        label: string;
        /** Canal de comunicação (ex: 'whatsapp', 'sms') */
        channel?: 'whatsapp' | 'sms' | string;
        /** Ícone do botão (ex: 'ic:baseline-whatsapp', 'mdi:message-text-outline') */
        icon?: string;
        /** Payload extra opcional enviado junto aos eventos */
        payload?: Record<string, any>;
    }

    export type AuthMode = 'password' | 'phone-otp';
    export type AuthStep = 'phone' | 'code';

    /** Textos do card (todos com default pt-BR) */
    export interface AuthLabels {
        email?: string;
        password?: string;
        remember?: string;
        forgot?: string;
        submit?: string;
        socialDivider?: string;
        registerPrompt?: string;
        register?: string;
        phone?: string;
        phonePlaceholder?: string;
        code?: string;
        codePlaceholder?: string;
        codeTitle?: string;
        sendCode?: string;
        verifyCode?: string;
        resendCode?: string;
        resendIn?: string;
        changePhone?: string;
        codeSentTo?: string;
        didNotReceive?: string;
    }

    const defaultEndpoints: AuthOtpEndpoint[] = [
        { label: 'Receber via WhatsApp', channel: 'whatsapp', icon: 'ic:baseline-whatsapp' },
        { label: 'Receber via SMS', channel: 'sms', icon: 'mdi:message-text-outline' }
    ];

    const props = withDefaults(
        defineProps<{
            /** Título do header */
            title?: string;
            /** Subtítulo do header */
            subtitle?: string;
            /** Ícone do header */
            icon?: string;
            /** Provedores de login social (vazio = seção oculta) */
            providers?: AuthProvider[];
            /** Estado de carregamento do botão entrar */
            loading?: boolean;
            /** Mensagem de erro */
            error?: string;
            /** Exibe o checkbox "lembrar-me" */
            showRemember?: boolean;
            /** Rota do "Cadastre-se" (vazio = link oculto) */
            registerTo?: RouteLocationRaw;
            /** Rota do "Esqueci a senha" (vazio = link oculto) */
            forgotTo?: RouteLocationRaw;
            /** Sobrescreve textos pt-BR */
            labels?: AuthLabels;
            /** Tipo do campo de identificação: 'email' (padrão) ou 'email-phone' (e-mail OU telefone) */
            identifier?: 'email' | 'email-phone';
            /** Modo de autenticação: 'password' (padrão) ou 'phone-otp' */
            mode?: AuthMode;
            /** Endpoints ordenados por prioridade para envio de código OTP */
            endpoints?: AuthOtpEndpoint[];
            /** Tempo de cooldown em segundos para reenvio de código (padrão 60) */
            cooldown?: number;
            /** Quantidade de dígitos esperados no código OTP */
            codeLength?: number;
            /** Prefixo da chave de cache no localStorage */
            cacheKeyPrefix?: string;
        }>(),
        {
            title: 'Acesse sua conta',
            subtitle: 'Bem-vindo de volta',
            icon: 'mdi:account-circle-outline',
            providers: () => [],
            loading: false,
            error: '',
            showRemember: true,
            identifier: 'email',
            mode: 'password',
            endpoints: () => [
                { label: 'Receber via WhatsApp', channel: 'whatsapp', icon: 'ic:baseline-whatsapp' },
                { label: 'Receber via SMS', channel: 'sms', icon: 'mdi:message-text-outline' }
            ],
            cooldown: 60,
            codeLength: 6,
            cacheKeyPrefix: 'max_auth_otp_'
        }
    );

    const emit = defineEmits<{
        submit: [payload: {
            email?: string;
            password?: string;
            remember?: boolean;
            phone?: string;
            code?: string;
            endpoint?: AuthOtpEndpoint;
            channel?: string;
        }];
        'send-code': [payload: { phone: string; endpoint: AuthOtpEndpoint; channel: string; index: number }];
        'resend-code': [payload: { phone: string; endpoint: AuthOtpEndpoint; channel: string; index: number }];
        social: [providerId: string];
    }>();

    const email = defineModel<string>('email', { default: '' });
    const password = defineModel<string>('password', { default: '' });
    const remember = defineModel<boolean>('remember', { default: true });
    const phone = defineModel<string>('phone', { default: '' });
    const code = defineModel<string>('code', { default: '' });

    const codeSent = ref(false);
    const currentEndpointIndex = ref(0);
    const remainingCooldown = ref(0);
    let cooldownTimer: ReturnType<typeof setInterval> | null = null;

    const defaults: Required<AuthLabels> = {
        email: 'E-mail',
        password: 'Senha',
        remember: 'Lembrar-me por 30 dias',
        forgot: 'Esqueci a senha',
        submit: 'Entrar',
        socialDivider: 'ou acesse com',
        registerPrompt: 'Não tem uma conta?',
        register: 'Cadastre-se',
        phone: 'Telefone',
        phonePlaceholder: '(99) 9 9999 - 9999',
        code: 'Código de verificação',
        codePlaceholder: '000000',
        codeTitle: 'Código de confirmação',
        sendCode: 'Enviar código',
        verifyCode: 'Entrar',
        resendCode: 'Solicitar código novamente',
        resendIn: 'Solicitar novamente',
        changePhone: 'Alterar número',
        codeSentTo: 'Código enviado para',
        didNotReceive: 'Não recebeu o código?'
    };

    const t = computed<Required<AuthLabels>>(() => ({ ...defaults, ...(props.labels ?? {}) }));

    const activeEndpoints = computed<AuthOtpEndpoint[]>(() => (props.endpoints && props.endpoints.length > 0 ? props.endpoints : defaultEndpoints));
    const firstEndpoint = computed<AuthOtpEndpoint>(() => activeEndpoints.value[0] || defaultEndpoints[0]);
    const nextEndpoint = computed<AuthOtpEndpoint>(() => {
        const list = activeEndpoints.value;
        const nextIndex = (currentEndpointIndex.value + 1) % list.length;
        return list[nextIndex];
    });

    const computedTitle = computed(() => {
        if (props.mode === 'phone-otp' && codeSent.value) return props.title !== 'Acesse sua conta' ? props.title : t.value.codeTitle;
        return props.title;
    });

    const computedSubtitle = computed(() => {
        if (props.mode === 'phone-otp' && codeSent.value) return `${t.value.codeSentTo} ${phone.value}`;
        return props.subtitle;
    });

    const getStorageKey = (rawPhone: string) => {
        const clean = (rawPhone || '').replace(/\D/g, '');
        return clean ? `${props.cacheKeyPrefix}${clean}` : `${props.cacheKeyPrefix}last`;
    };

    const stopCooldown = () => {
        if (cooldownTimer) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
        }
    };

    const startCooldownInterval = () => {
        stopCooldown();
        if (remainingCooldown.value <= 0) return;

        cooldownTimer = setInterval(() => {
            if (remainingCooldown.value > 1) remainingCooldown.value -= 1;
            else {
                remainingCooldown.value = 0;
                stopCooldown();
            }
        }, 1000);
    };

    const startCooldown = () => {
        remainingCooldown.value = props.cooldown;
        startCooldownInterval();
    };

    const persistTimestamp = (phoneVal: string) => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        const key = getStorageKey(phoneVal);
        localStorage.setItem(key, String(Date.now()));
    };

    const checkAndRestoreCooldown = (phoneVal: string) => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        const key = getStorageKey(phoneVal);
        const cached = localStorage.getItem(key);
        if (!cached) return;

        const timestamp = parseInt(cached, 10);
        if (Number.isNaN(timestamp)) return;

        const elapsed = Math.floor((Date.now() - timestamp) / 1000);
        if (elapsed < props.cooldown) {
            codeSent.value = true;
            remainingCooldown.value = props.cooldown - elapsed;
            startCooldownInterval();
        } else {
            codeSent.value = true;
            remainingCooldown.value = 0;
            stopCooldown();
        }
    };

    const dynamicButtonLabel = computed<string>(() => {
        if (props.mode === 'password') return t.value.submit;

        if (!codeSent.value) return firstEndpoint.value.label || t.value.sendCode;

        const isComplete = code.value && String(code.value).length >= props.codeLength;
        if (isComplete) return t.value.submit;

        if (remainingCooldown.value <= 0) return t.value.resendCode;

        return `${t.value.resendIn} (${remainingCooldown.value}s)`;
    });

    const dynamicButtonIcon = computed<string>(() => {
        if (props.mode === 'password') return 'mdi:login';

        if (!codeSent.value) return firstEndpoint.value.icon || 'mdi:arrow-right';

        const isComplete = code.value && String(code.value).length >= props.codeLength;
        if (isComplete) return 'mdi:login';

        if (remainingCooldown.value <= 0) return nextEndpoint.value.icon || 'mdi:refresh';

        return 'mdi:clock-outline';
    });

    const onSendCode = (): void => {
        if (props.loading || !phone.value) return;
        currentEndpointIndex.value = 0;
        const endpoint = firstEndpoint.value;
        codeSent.value = true;
        persistTimestamp(phone.value);
        emit('send-code', {
            phone: phone.value,
            endpoint,
            channel: endpoint.channel ?? 'whatsapp',
            index: 0
        });

        startCooldown();
    };

    const onResendCode = (): void => {
        if (props.loading || !phone.value) return;
        const list = activeEndpoints.value;
        currentEndpointIndex.value = (currentEndpointIndex.value + 1) % list.length;
        const endpoint = list[currentEndpointIndex.value];
        persistTimestamp(phone.value);

        emit('resend-code', {
            phone: phone.value,
            endpoint,
            channel: endpoint.channel ?? '',
            index: currentEndpointIndex.value
        });

        startCooldown();
    };

    const onVerifyCode = (): void => {
        if (props.loading) return;
        const endpoint = activeEndpoints.value[currentEndpointIndex.value];
        emit('submit', {
            phone: phone.value,
            code: code.value,
            endpoint,
            channel: endpoint.channel
        });
    };

    const handleDynamicSubmit = (): void => {
        if (props.loading) return;

        if (props.mode === 'password') {
            emit('submit', { email: email.value, password: password.value, remember: remember.value });
            return;
        }

        if (!codeSent.value) {
            onSendCode();
            return;
        }

        const isComplete = code.value && String(code.value).length >= props.codeLength;
        if (isComplete) {
            onVerifyCode();
            return;
        }

        if (remainingCooldown.value <= 0) {
            onResendCode();
            return;
        }

        // Durante cooldown ativo com código incompleto: não faz nada
    };

    const onSubmit = (): void => {
        if (props.loading) return;
        if (props.mode === 'phone-otp') {
            handleDynamicSubmit();
            return;
        }

        emit('submit', { email: email.value, password: password.value, remember: remember.value });
    };

    watch(
        phone,
        (newPhone) => {
            if (newPhone) checkAndRestoreCooldown(newPhone);
        },
        { immediate: true }
    );

    onMounted(() => {
        if (phone.value) checkAndRestoreCooldown(phone.value);
    });

    onBeforeUnmount(() => {
        stopCooldown();
    });
</script>

<style lang="scss">
    .max-auth-page {
        background: var(--background-100);

        .max-auth-card {
            width: 360px;
            max-width: 90vw;
            background: var(--background-0);
            border: 1px solid var(--background-200);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 30px rgb(0 0 0 / 8%);
        }

        .max-auth-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .max-auth-remember {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-size: 0.82rem;
            color: var(--background-600);
            user-select: none;

            input[type='checkbox'] {
                width: 16px;
                height: 16px;
                accent-color: var(--background-650);
                cursor: pointer;
            }

            span {
                font-weight: 500;
            }
        }

        .max-auth-error {
            color: var(--red-500, #ef4444);
            font-size: 0.8rem;
            text-align: center;
        }

        .max-auth-link {
            color: var(--background-650);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
            white-space: nowrap;

            &:hover {
                text-decoration: underline;
                color: var(--background-750);
            }

            &--muted {
                font-size: 0.82rem;
                font-weight: 400;
            }
        }

        .max-auth-register {
            color: var(--background-500);

            .text-secondary {
                color: var(--background-500);
            }
        }

        .max-auth-divider {
            display: flex;
            align-items: center;
            text-align: center;
            color: var(--background-400);
            margin: 1.5rem 0 1rem;

            .line {
                flex: 1;
                height: 1px;
                background: var(--background-200);
            }

            .text {
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--background-400);
                padding: 0 0.5rem;
            }
        }

        .max-auth-social {
            display: flex;
            gap: 0.75rem;
            justify-content: space-between;

            .max-auth-social-btn {
                flex: 1;
            }
        }
    }
</style>
