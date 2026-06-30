<template>
    <div class="max-auth-page" s100 flex items-center justify-center>
        <div class="max-auth-card">
            <slot name="header">
                <MaxTitle2 :icon="icon" :title="title" :subtitle="subtitle" center p0 />
            </slot>

            <MaxGrid mt-6 gap-4>
                <MaxInputPhoneMail s100 v-if="identifier === 'email-phone'" :label="t.email" v-model="email" email @keyup.enter="onSubmit" />
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
 * Card de autenticação reutilizável (login).
 * Componente puramente visual: não conhece HTTP, router store nem store.
 * Emite os eventos `submit` e `social` para o projeto consumidor tratar a lógica.
 */
<script setup lang="ts">
    import { computed } from 'vue';
    import type { RouteLocationRaw } from 'vue-router';
    import MaxTitle2 from './MaxTitle2.vue';
    import MaxGrid from './MaxGrid.vue';
    import MaxInputText from './MaxInputText.vue';
    import MaxInputPhoneMail from './MaxInputPhoneMail.vue';
    import MaxButton from './MaxButton.vue';

    /** Provedor de login social configurável */
    interface AuthProvider {
        /** Identificador enviado no evento `social` (ex: 'google') */
        id: string;
        /** Rótulo exibido no botão */
        label: string;
        /** Ícone (ex: 'mdi:google') */
        icon: string;
        /** Classe(s) CSS opcional(is) para customizar a cor de marca */
        class?: string;
    }

    /** Textos do card (todos com default pt-BR) */
    interface AuthLabels {
        email?: string;
        password?: string;
        remember?: string;
        forgot?: string;
        submit?: string;
        socialDivider?: string;
        registerPrompt?: string;
        register?: string;
    }

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
        }>(),
        {
            title: 'Acesse sua conta',
            subtitle: 'Bem-vindo de volta',
            icon: 'mdi:account-circle-outline',
            providers: () => [],
            loading: false,
            error: '',
            showRemember: true,
            identifier: 'email'
        }
    );

    const emit = defineEmits<{
        submit: [payload: { email: string; password: string; remember: boolean }];
        social: [providerId: string];
    }>();

    const email = defineModel<string>('email', { default: '' });
    const password = defineModel<string>('password', { default: '' });
    const remember = defineModel<boolean>('remember', { default: true });

    const defaults: Required<AuthLabels> = {
        email: 'E-mail',
        password: 'Senha',
        remember: 'Lembrar-me por 30 dias',
        forgot: 'Esqueci a senha',
        submit: 'Entrar',
        socialDivider: 'ou acesse com',
        registerPrompt: 'Não tem uma conta?',
        register: 'Cadastre-se'
    };

    const t = computed<Required<AuthLabels>>(() => ({ ...defaults, ...(props.labels ?? {}) }));

    const onSubmit = (): void => {
        if (props.loading) return;
        emit('submit', { email: email.value, password: password.value, remember: remember.value });
    };
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
