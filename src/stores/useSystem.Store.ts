import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useWindowSize, useBreakpoints } from '@maxvue/max-use';

import { useUserStore } from './useUser.Store';
import { useLoadingStore } from './useLoading.Store';
import { getMaxAppConfig } from '../helpers/maxAppConfig';
import { clearMaxCache } from '../helpers/maxCacheKeys';

/**
 * Store central do app shell.
 *
 * Reúne o estado global consumido pelo `MaxApp` e pelo layout: usuário logado,
 * metadados da rota atual, dimensões da tela e o estado de carregamento.
 *
 * Diferenças em relação à versão original do engeapp:
 * - Todos os símbolos são importados explicitamente (a original dependia de
 *   auto-import, que não existe nesta biblioteca).
 * - As rotas vêm de `configureMaxApp()`.
 */
export const useSystemStore = defineStore('system', () => {

    const user = useUserStore();
    const loading = useLoadingStore();
    const route = useRoute();

    /** Versão da aplicação, informada em `configureMaxApp()`. */
    const version = computed<string>(() => getMaxAppConfig().version ?? '');

    /**
     * Token CSRF lido da meta tag renderizada pelo servidor a cada carregamento.
     *
     * Jamais use o token vindo de `user.data.token`: a store `user` é cacheada,
     * então após o logout (que regenera o token no servidor) o valor cacheado
     * fica obsoleto e todo POST subsequente — inclusive o de login — passa a ser
     * rejeitado com 419.
     */
    const csrf_token = computed<string>(() => {
        if (typeof document === 'undefined') return '';

        return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    });

    // USUÁRIO E SESSÃO
    /** Indica se há usuário autenticado e já carregado do servidor. */
    const is_logged = computed<boolean>(() => Boolean(user.data?.id && (user as any).status?.server?.get?.is_success));

    /** ID do usuário logado, ou `false` quando não há. */
    const isLoggedId = computed(() => user.data?.id ?? false);

    const session_token = csrf_token;
    const token = csrf_token;

    /** URL base da aplicação. */
    const base_url = computed<string>(() => user.data?.base_url ?? getMaxAppConfig().baseUrl ?? '');

    /** Indica ambiente de testes/homologação, inferido pela URL base. */
    const sandbox = computed<boolean>(() => base_url.value.includes('test') || base_url.value.includes('dev.'));

    // ROTAS
    /** Nome da rota atual. */
    const page = computed<string>(() => String(route?.name ?? ''));

    /** Valor de `?sub_page=` na query atual. */
    const sub_page = computed(() => route?.query?.sub_page ?? null);

    /** Query e params da rota atual, combinados. */
    const params = computed<Record<string, any>>(() => ({ ...(route?.query ?? {}), ...(route?.params ?? {}) }));

    /** Cabeçalhos padrão para requisições autenticadas. */
    const headerRequests = computed(() => ({
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': token.value,
            'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
    }));

    // TELA
    const screen = useWindowSize();
    const breakpoints = useBreakpoints({ sm: 640, md: 768, lg: 1024, xl: 1280 });

    /** Verdadeiro abaixo do breakpoint `md` (768px). */
    const isMobile = breakpoints.smaller('md');

    /** Tipo de dispositivo derivado do breakpoint. */
    const type_device = computed<'desktop' | 'mobile'>(() => isMobile.value ? 'mobile' : 'desktop');

    /** Dimensões da área de conteúdo, preenchidas pelo layout. */
    const content_page_size = ref<{ width: number; height: number }>({ width: 0, height: 0 });

    /** Controla a abertura do menu lateral (gaveta off-canvas) no mobile. */
    const side_menu_open: Ref<boolean> = ref(false);

    /** Título opcional exibido no cabeçalho do menu superior (útil no mobile). */
    const top_menu_title: Ref<string> = ref('');

    /** Indica que a aplicação terminou de inicializar (gate de loading do MaxPinia). */
    const started: Ref<boolean> = ref(true);

    /**
     * Limpa o cache local da biblioteca e recarrega a aplicação.
     *
     * A limpeza é **escopada às chaves da própria biblioteca** (ver
     * `clearMaxCache`): o `localStorage` pertence à aplicação hospedeira, então
     * tokens, preferências e rascunhos que a lib não gravou são preservados.
     * Para incluir chaves da aplicação nessa limpeza, declare-as com
     * `registerMaxCacheKey()`.
     *
     * `user.clearAll()` é injetado pelo `@maxvue/max-pinia`; quando o plugin não
     * está instalado, o método é ignorado e o reload acontece do mesmo jeito.
     */
    function reloadAll(): void {
        loading.start({ target: 'body', message: 'Limpando memória', key: 'system.clear.memory' });
        loading.start({ target: 'body', message: 'Atualizando a página', status: 'waiting', key: 'system.reload.all' });

        clearMaxCache();

        const finish = () => {
            loading.update({ target: 'body', key: 'system.clear.memory', status: 'done' });
            loading.update({ target: 'body', key: 'system.reload.all', status: 'loading' });

            setTimeout(() => {
                loading.update({ target: 'body', key: 'system.reload.all', status: 'done' });
                if (typeof location !== 'undefined') location.reload();
            }, 250);
        };

        const clearAll = (user as any).clearAll;

        if (typeof clearAll === 'function') Promise.resolve(clearAll.call(user)).then(finish);
        else finish();
    }

    return {
        user,
        loading,
        route,
        version,
        page,
        sub_page,
        params,
        is_logged,
        isLoggedId,
        base_url,
        sandbox,
        token,
        session_token,
        headerRequests,
        screen,
        isMobile,
        type_device,
        content_page_size,
        side_menu_open,
        top_menu_title,
        started,
        reloadAll
    };
});
