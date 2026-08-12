import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, watch } from 'vue';
import { apiGetRoute, apiPostRoute, getRoute } from '@maxvue/max-use';

import { useToastStore } from './useToast.Store';
import { getMaxAppConfig } from '../helpers/maxAppConfig';

/** Metadados de exibição de um provedor social. */
export interface LoginProvider {
    id: string;
    label: string;
    icon: string;
    class: string;
}

/**
 * Provedores sociais suportados → metadados do botão.
 */
const PROVIDER_MAP: Record<string, Omit<LoginProvider, 'id'>> = {
    google: { label: 'Google', icon: 'mdi:google', class: 'btn-google' },
    facebook: { label: 'Facebook', icon: 'mdi:facebook', class: 'btn-facebook' }
};

/**
 * Mensagens de erro devolvidas pelo redirect social via `?error=`.
 */
const SOCIAL_ERROR_MESSAGES: Record<string, string> = {
    invalid_provider: 'Provedor de login inválido.',
    oauth_failed: 'Não foi possível autenticar com o provedor. Tente novamente.',
    no_email: 'Sua conta social não forneceu um e-mail. Use e-mail e senha.'
};

/**
 * Store do formulário de login.
 *
 * O método de autenticação é detectado a partir do que o usuário digita:
 * um valor com `@` vira e-mail, só dígitos e separadores vira telefone, e o
 * restante vira nome de usuário. Métodos desabilitados pelas flags `allow_*`
 * são descartados.
 *
 * As rotas vêm de `configureMaxApp()`, nunca hardcoded.
 */
export const useLoginStore = defineStore('login', () => {

    /** Indica requisição de login em andamento. */
    const loading: Ref<boolean> = ref(false);

    /** Habilita a detecção de login por telefone. */
    const allow_phone: Ref<boolean> = ref(true);

    /** Habilita a detecção de login por e-mail. */
    const allow_email: Ref<boolean> = ref(true);

    /** Habilita a detecção de login por nome de usuário. */
    const allow_user_name: Ref<boolean> = ref(true);

    /** Valor digitado no campo de identificação. */
    const value: Ref<string> = ref('');

    /** Método detectado: `'email'`, `'phone'`, `'user_name'` ou vazio. */
    const method: Ref<string> = ref('');

    /** Senha informada. */
    const password: Ref<string> = ref('');

    /** Mantém a sessão ativa entre visitas. */
    const remember: Ref<boolean> = ref(true);

    /** Mensagem de erro exibida no formulário. */
    const error: Ref<string> = ref('');

    /** Provedores sociais habilitados no backend. */
    const providers: Ref<LoginProvider[]> = ref([]);

    /**
     * E-mail informado.
     *
     * Quando o método é outro, envia o sentinela em vez de vazio: o backend
     * valida `email` como `required|email` mesmo no login por telefone, e um
     * vazio derruba a requisição com 422 antes de conferir a senha. O servidor
     * reconhece o sentinela e o trata como ausente.
     */
    const email = computed(() => method.value === 'email'
        ? value.value
        : getMaxAppConfig().undefinedEmail as string);

    /** Telefone informado, ou vazio quando o método é outro. */
    const phone_number = computed(() => method.value === 'phone' ? value.value : '');

    /** Nome de usuário informado, ou vazio quando o método é outro. */
    const user_name = computed(() => method.value === 'user_name' ? value.value : '');

    /**
     * Submete o formulário de login.
     *
     * Em caso de sucesso recarrega a página, para que o servidor reemita a
     * sessão e o token CSRF.
     */
    const submit = async (): Promise<void> => {
        loading.value = true;
        error.value = '';

        try {
            const result_api = await apiPostRoute(getMaxAppConfig().routeLogin as string, {
                method: method.value,
                email: email.value,
                password: password.value,
                remember: remember.value,
                phone_number: phone_number.value,
                user_name: user_name.value
            });

            if (result_api) {
                if (typeof location !== 'undefined') location.reload();
            } else {
                useToastStore().add({
                    title: 'Não foi possível realizar o login.',
                    message: 'Verifique os dados e tente novamente.',
                    severity: 'error'
                });

                error.value = 'Usuário ou senha inválidos.';
            }
        } catch (_e) {
            useToastStore().add({
                title: 'Não foi possível realizar o login.',
                message: 'Não foi possível conectar ao servidor. Tente novamente.',
                severity: 'error'
            });

            error.value = 'Não foi possível conectar ao servidor. Tente novamente.';
        } finally {
            loading.value = false;
        }
    };

    /**
     * Detecta o método de autenticação conforme o usuário digita.
     */
    watch(value, () => {
        const current = String(value.value ?? '').trim();

        if (current.length === 0) {
            method.value = '';
            return;
        }

        const detected = current.includes('@')
            ? 'email'
            : /^[0-9\s+()-]+$/.test(current) && /[0-9]/.test(current)
                ? 'phone'
                : 'user_name';

        const allowed: Record<string, boolean> = {
            email: allow_email.value,
            phone: allow_phone.value,
            user_name: allow_user_name.value
        };

        method.value = allowed[detected] ? detected : '';
    });

    /**
     * Carrega do backend os provedores sociais habilitados.
     */
    const loadProviders = async (): Promise<void> => {
        try {
            const ids = await apiGetRoute(getMaxAppConfig().routeProviders as string);

            const rawIds = Array.isArray(ids) ? ids : [];
            providers.value = rawIds
                .filter((id: string) => PROVIDER_MAP[id])
                .map((id: string) => ({ id, ...PROVIDER_MAP[id] }));
        } catch (_e) {
            providers.value = [];
        }
    };

    /**
     * Redireciona o navegador para o fluxo OAuth do provedor.
     */
    const social = (provider: string): void => {
        const url = getRoute(getMaxAppConfig().routeSocialRedirect as string, { provider });

        if (url && typeof window !== 'undefined') window.location.href = url;
    };

    /**
     * Lê `?error=` da URL e exibe a mensagem correspondente.
     */
    const loadUrlError = (): void => {
        if (typeof window === 'undefined') return;

        const code = new URLSearchParams(window.location.search).get('error');

        if (code && SOCIAL_ERROR_MESSAGES[code]) error.value = SOCIAL_ERROR_MESSAGES[code];
    };

    return {
        value,
        method,
        email,
        phone_number,
        user_name,
        password,
        remember,
        loading,
        error,
        allow_email,
        allow_phone,
        allow_user_name,
        providers,
        submit,
        loadProviders,
        social,
        loadUrlError
    };
});
