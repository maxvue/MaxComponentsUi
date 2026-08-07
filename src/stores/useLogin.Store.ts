import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, watch } from 'vue';

export const useLoginStore = defineStore('login', () => {
    /**
     * Flag que indica se está carregando.
     */
    const loading: Ref<boolean> = ref(false);

    /**
     * Flag que habilita o login via telefone.
     */
    const allow_phone: Ref<boolean> = ref(true);

    /**
     * Flag que habilita o login via email.
     */
    const allow_email: Ref<boolean> = ref(true);

    /**
     * Flag que habilita o login via nome de usuário.
     */
    const allow_user_name: Ref<boolean> = ref(true);

    /**
     * Valor de entrada (email, telefone ou nome de usuário).
     */
    const value: Ref = ref('');

    /**
     * Método de autenticação ('email' ou 'phone' ou 'user_name').
     */
    const method: Ref<string> = ref('');

    /**
     * Senha do usuário.
     */
    const password: Ref<string> = ref('');

    /**
     * Flag que indica se deve lembrar o usuário.
     */
    const remember: Ref<boolean> = ref(true);

    /**
     * Mensagem de erro do login.
     */
    const error: Ref<string> = ref('');

    /**
     * Mapa de provedores sociais suportados → metadados de exibição do botão.
     */
    const PROVIDER_MAP: Record<string, { label: string; icon: string; class: string }> = {
        google:   { label: 'Google', icon: 'mdi:google', class: 'btn-google' },
        facebook: { label: 'Facebook', icon: 'mdi:facebook', class: 'btn-facebook' }
    };

    /**
     * Provedores sociais habilitados (carregados do backend).
     */
    const providers: Ref<Array<{ id: string; label: string; icon: string; class: string }>> = ref([]);

    /**
     * Email do usuário.
     * Lógica de negócio:
     * - Se método é 'email', retorna value.
     * - Caso contrário, retorna 'undefined@enge.tec.br'.
     */
    const email = computed(() => {
        if (method.value === 'email') return value.value;

        return 'undefined@enge.tec.br';
    });

    /**
     * Número de telefone.
     * Lógica de negócio:
     * - Se método é 'phone', retorna value.
     * - Caso contrário, retorna string vazia.
     */
    const phone_number = computed(() => {
        if (method.value === 'phone') return value.value;

        return '';
    });

    /**
     * Nome de usuário.
     * Lógica de negócio:
     * - Se método é 'user_name', retorna value.
     * - Caso contrário, retorna string vazia.
     */
    const user_name = computed(() => {
        if (method.value === 'user_name') return value.value;

        return '';
    });

    /**
     * Submete formulário de login.
     * Lógica de negócio:
     * - Define loading como true.
     * - Faz POST para 'login' com dados.
     * - Se sucesso, recarrega página.
     * - Se erro, mostra toast e define error como true.
     * - Reseta error após 1 segundo.
     * - Define loading como false.
     *
     * Dependências externas:
     * - apiPostRoute(): função para fazer requisições POST à API.
     * - showToast(): função para mostrar notificação.
     *
     * Efeito colateral: modifica loading, error e recarrega página.
     */
    const submit = async () => {
        loading.value = true;
        error.value = '';
        const result_api = await apiPostRoute('login', {
            method: method.value,
            email: email.value,
            password: password.value,
            remember: remember.value,
            phone_number: phone_number.value,
            user_name: user_name.value
        });

        if (result_api) location.reload();

        else {
            toast('Não foi possível realizar o login. <br>Verifique os dados e tente novamente.', { type: 'error', dangerouslyHTMLString: true });
            error.value = 'Usuário ou senha inválidos.';
        }
        loading.value = false;
    };

    /**
     * Watcher para detectar método de autenticação.
     * Lógica de negócio:
     * - Monitora value.
     * - Se value está vazio, limpa method.
     * - Se value contém '@', define method como 'email'.
     * - Se value contém apenas caracteres de telefone (dígitos, espaço, +, -, parênteses)
     *   e ao menos um dígito, define method como 'phone'.
     * - Caso contrário (contém letras sem '@'), define method como 'user_name'.
     * - Métodos desabilitados pelas flags allow_* são ignorados e method fica vazio.
     *
     * Efeito colateral: modifica method.
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
     * Carrega os provedores sociais habilitados no backend e os mapeia para o card.
     */
    const loadProviders = async () => {
        const ids = await apiGetRoute('social.providers');
        providers.value = (ids ?? [])
            .filter((id: string) => PROVIDER_MAP[id])
            .map((id: string) => ({ id, ...PROVIDER_MAP[id] }));
    };

    /**
     * Inicia o login social: navega o navegador para a rota de redirect do provedor.
     */
    const social = (provider: string) => {
        window.location.href = route('social.redirect', { provider });
    };

    /**
     * Mensagens de erro vindas do redirect social (?error=).
     */
    const SOCIAL_ERROR_MESSAGES: Record<string, string> = {
        invalid_provider: 'Provedor de login inválido.',
        oauth_failed: 'Não foi possível autenticar com o provedor. Tente novamente.',
        no_email: 'Sua conta social não forneceu um e-mail. Use e-mail e senha.'
    };

    /**
     * Lê o parâmetro ?error= da URL e exibe a mensagem correspondente no card.
     */
    const loadUrlError = () => {
        const code = new URLSearchParams(window.location.search).get('error');
        if (code && SOCIAL_ERROR_MESSAGES[code]) error.value = SOCIAL_ERROR_MESSAGES[code];
    };

    return {
        email,
        value,
        phone_number,
        user_name,
        allow_user_name,
        allow_phone,
        allow_email,
        method,
        password,
        remember,
        loading,
        error,
        submit,
        providers,
        loadProviders,
        social,
        loadUrlError
    };
});
