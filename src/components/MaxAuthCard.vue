<template>
    <div class="max-auth-page" s100 flex items-center justify-center>
        <div class="max-auth-card">
            <slot name="header" :step="step" :mode="mode" :phone="phone">
                <MaxTitle2
                    :icon="mode === 'phone-otp' && step === 'code' ? 'mdi:shield-check-outline' : icon"
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

                <!-- Modo Phone OTP: Etapa 1 (Telefone) -->
                <template v-else-if="mode === 'phone-otp' && step === 'phone'">
                    <slot name="phone-input">
                        <MaxPhoneField s100 v-model="phone" :label="t.phone" @keyup.enter="onSendCode" />
                    </slot>

                    <slot name="extra"></slot>

                    <span s100 class="max-auth-error" v-if="error">{{ error }}</span>

                    <MaxButton
                        s100
                        :label="firstEndpoint.label || t.sendCode"
                        :icon="firstEndpoint.icon || 'mdi:arrow-right'"
                        :loading="loading"
                        :action="onSendCode"
                    />
                </template>

                <!-- Modo Phone OTP: Etapa 2 (Código OTP) -->
                <template v-else-if="mode === 'phone-otp' && step === 'code'">
                    <div class="max-auth-phone-summary" s100>
                        <div class="max-auth-phone-info">
                            <span class="max-auth-phone-number">{{ phone }}</span>
                            <button type="button" class="max-auth-change-phone-btn" @click="onChangePhone">
                                {{ t.changePhone }}
                            </button>
                        </div>
                    </div>

                    <slot name="code-input">
                        <MaxInputText
                            s100
                            :label="t.code"
                            :placeholder="t.codePlaceholder"
                            type="text"
                            v-model="code"
                            icon="mdi:numeric"
                            class="max-auth-code-input"
                            autofocus
                            @keyup.enter="onVerifyCode"
                        />
                    </slot>

                    <slot name="extra"></slot>

                    <span s100 class="max-auth-error" v-if="error">{{ error }}</span>

                    <MaxButton
                        s100
                        :label="t.verifyCode"
                        icon="mdi:check-circle-outline"
                        :loading="loading"
                        :action="onVerifyCode"
                    />

                    <!-- Seção de Reenvio com Prioridade de Endpoints e Cooldown -->
                    <slot name="resend">
                        <div class="max-auth-resend-section" s100>
                            <span class="max-auth-resend-label">{{ t.didNotReceive }}</span>
                            <button
                                type="button"
                                class="max-auth-resend-btn"
                                :disabled="remainingCooldown > 0 || loading"
                                @click="onResendCode"
                            >
                                <template v-if="remainingCooldown > 0">
                                    {{ t.resendIn }} {{ remainingCooldown }}s
                                </template>
                                <template v-else>
                                    {{ nextEndpoint.label || t.resendCode }}
                                </template>
                            </button>
                        </div>
                    </slot>
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
    import { ref, computed, onBeforeUnmount } from 'vue';
    import type { RouteLocationRaw } from 'vue-router';
    import MaxTitle2 from './MaxTitle2.vue';
    import MaxGrid from './MaxGrid.vue';
    import MaxInputText from './MaxInputText.vue';
    import MaxInputPhoneMail from './MaxInputPhoneMail.vue';
    import MaxPhoneField from './MaxPhoneField.vue';
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
            /** Avança automaticamente para a etapa de código ao disparar o envio inicial */
            autoAdvance?: boolean;
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
            autoAdvance: true
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
        'change-step': [step: AuthStep];
        social: [providerId: string];
    }>();

    const email = defineModel<string>('email', { default: '' });
    const password = defineModel<string>('password', { default: '' });
    const remember = defineModel<boolean>('remember', { default: true });
    const phone = defineModel<string>('phone', { default: '' });
    const code = defineModel<string>('code', { default: '' });
    const step = defineModel<AuthStep>('step', { default: 'phone' });

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
        sendCode: 'Receber código',
        verifyCode: 'Confirmar código',
        resendCode: 'Reenviar código',
        resendIn: 'Reenviar em',
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
        if (props.mode === 'phone-otp' && step.value === 'code') return props.title !== 'Acesse sua conta' ? props.title : t.value.codeTitle;
        return props.title;
    });

    const computedSubtitle = computed(() => {
        if (props.mode === 'phone-otp' && step.value === 'code') return `${t.value.codeSentTo} ${phone.value}`;
        return props.subtitle;
    });

    const stopCooldown = () => {
        if (cooldownTimer) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
        }
    };

    const startCooldown = () => {
        stopCooldown();
        remainingCooldown.value = props.cooldown;
        if (remainingCooldown.value <= 0) return;

        cooldownTimer = setInterval(() => {
            if (remainingCooldown.value > 1) remainingCooldown.value -= 1;
            else {
                remainingCooldown.value = 0;
                stopCooldown();
            }
        }, 1000);
    };

    const onSendCode = (): void => {
        if (props.loading || !phone.value) return;
        currentEndpointIndex.value = 0;
        const endpoint = firstEndpoint.value;
        emit('send-code', {
            phone: phone.value,
            endpoint,
            channel: endpoint.channel ?? 'whatsapp',
            index: 0
        });

        if (props.autoAdvance) {
            step.value = 'code';
            emit('change-step', 'code');
            startCooldown();
        }
    };

    const onResendCode = (): void => {
        if (props.loading || remainingCooldown.value > 0) return;
        const list = activeEndpoints.value;
        currentEndpointIndex.value = (currentEndpointIndex.value + 1) % list.length;
        const endpoint = list[currentEndpointIndex.value];

        emit('resend-code', {
            phone: phone.value,
            endpoint,
            channel: endpoint.channel ?? '',
            index: currentEndpointIndex.value
        });

        startCooldown();
    };

    const onChangePhone = (): void => {
        step.value = 'phone';
        emit('change-step', 'phone');
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

    const onSubmit = (): void => {
        if (props.loading) return;
        if (props.mode === 'phone-otp') {
            if (step.value === 'phone') onSendCode();
            else onVerifyCode();
            return;
        }

        emit('submit', { email: email.value, password: password.value, remember: remember.value });
    };

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

        .max-auth-phone-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--background-100);
            border: 1px solid var(--background-200);
            border-radius: 8px;
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;

            .max-auth-phone-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
            }

            .max-auth-phone-number {
                font-weight: 600;
                color: var(--background-800);
            }

            .max-auth-change-phone-btn {
                background: transparent;
                border: none;
                color: var(--background-650);
                cursor: pointer;
                font-size: 0.8rem;
                font-weight: 500;
                padding: 0;

                &:hover {
                    text-decoration: underline;
                    color: var(--background-750);
                }
            }
        }

        .max-auth-resend-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            text-align: center;
            margin-top: 0.5rem;

            .max-auth-resend-label {
                font-size: 0.8rem;
                color: var(--background-500);
            }

            .max-auth-resend-btn {
                background: transparent;
                border: none;
                color: var(--background-650);
                cursor: pointer;
                font-size: 0.82rem;
                font-weight: 600;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                transition: all 0.2s ease;

                &:hover:not(:disabled) {
                    text-decoration: underline;
                    color: var(--background-750);
                }

                &:disabled {
                    color: var(--background-400);
                    cursor: not-allowed;
                }
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
