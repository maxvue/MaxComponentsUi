import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed } from 'vue';

/**
 * Store central do sistema que gerencia estados globais da aplicação.
 * Inclui controle de loading, metadados de roteamento, configurações de tela e estado de salvamento.
 */
export const useSystemStore = defineStore('system', () => {

    /**
     * Token CSRF lido da meta tag renderizada pelo Blade a cada carregamento da página.
     *
     * Jamais use o token vindo de `user.data.token`: a store `user` é cacheada em localStorage,
     * então após o logout (que regenera o token no servidor) o valor cacheado fica obsoleto e
     * todo POST subsequente — inclusive o de login — passa a ser rejeitado com 419.
     */
    const csrf_token: Ref<string> = computed(() => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '');

    // USER AND LOGIN
    const is_logged = computed(() => user?.data?.id && user.data?.token && user.status?.server?.get?.is_success);
    const isLoggedId = computed(() => user?.data?.id ?? false);
    const session_token: Ref<string> = csrf_token;
    const base_url: Ref<string> = computed(() => user.data?.base_url ?? 'https://app.test');
    const sandbox = ref(base_url.value.includes('test') || base_url.value.includes('dev.'));

    // ROUTES
    const route = useRoute();
    const sub_page: Ref = computed(() => route?.query?.sub_page ?? null);
    const page = computed<string>(() => String(route?.name ?? ''));
    const params: Ref = computed(() => ({ ...(route?.query ?? {}), ...(route?.params ?? {}) }));
    const token: Ref<string> = csrf_token;
    const headerRequests: Ref = computed(() => ({ headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token.value, 'X-Requested-With': 'XMLHttpRequest' }, withCredentials: true }));


    // Device screen info
    const screen: UseWindowSizeReturn = useWindowSize();
    const breakpoints = useBreakpoints({ sm: 640,md: 768,lg: 1024,xl: 1280 });
    const isMobile = breakpoints.smaller('md');
    const type_device = computed<'desktop' | 'mobile'>(() => isMobile.value ? 'mobile' : 'desktop');
    const content_page_size = ref<{ width: number; height: number }>({ width: 0, height: 0 });

    const started: Ref<boolean> = ref(true);

    const chat_settings = useChatSettingsStore();

    // LAYOUT PARAMS
    const split_panel_key = computed<string>(() => {
        let key = 'split_panel';
        if (page.value?.toLowerCase() === 'chat') key += '_chatpage';
        key += chat_settings.is_hide ? '_hidded' : '_not_hidded';
        key += chat_settings.is_visible ? '_visible' : '_notvisible';
        return key;
    });

    const split_panel = useRefCached<number>(split_panel_key, 100);

    function reloadAll(this: any) {
        loading.start({ target: 'body', message: 'Limpando memória', key: 'system.clear.memory' });
        loading.start({ target: 'body', message: 'Atualizando a página', status: 'waiting', key: 'system.reload.all' });
        localStorage.clear();
        user.clearAll()
            .then(() => {
                loading.update({ target: 'body', key: 'system.clear.memory', status: 'done' });
                loading.update({ target: 'body', key: 'system.reload.all', status: 'loading' });
                setTimeout(() => {
                    loading.update({ target: 'body', key: 'system.reload.all', status: 'done' });
                    location.reload();
                }, 250);
            });
    }


    return {
        page,
        sandbox,
        version,
        started,
        sub_page,
        route,
        is_logged,
        isLoggedId,
        params,
        split_panel,
        screen,
        split_panel_key,
        user,
        base_url,
        loading,
        token,
        headerRequests,
        isMobile,
        type_device,
        session_token,
        content_page_size,
        reloadAll
    };
});
