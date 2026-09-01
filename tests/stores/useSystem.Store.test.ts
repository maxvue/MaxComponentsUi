import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { reactive } from 'vue';

/** Rota mutável compartilhada com o mock do vue-router. */
const route = reactive<Record<string, any>>({ name: 'home', query: {}, params: {} });

vi.mock('vue-router', () => ({
    useRoute: () => route
}));

import { useSystemStore } from '../../src/stores/useSystem.Store';
import { useUserStore } from '../../src/stores/useUser.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

/** Reseta a rota compartilhada entre os casos. */
const resetRoute = () => Object.assign(route, { name: 'home', query: {}, params: {} });

describe('useSystemStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        resetMaxAppConfig();
        resetRoute();
        localStorage.clear();
        document.head.innerHTML = '';
    });

    afterEach(() => {
        resetMaxAppConfig();
        vi.restoreAllMocks();
    });

    describe('rotas', () => {
        it('expõe o nome da rota atual', () => {
            expect(useSystemStore().page).toBe('home');
        });

        it('devolve string vazia quando a rota não tem nome', () => {
            route.name = undefined;
            expect(useSystemStore().page).toBe('');
        });

        it('combina query e params', () => {
            route.query = { busca: 'abc' };
            route.params = { id: '7' };

            expect(useSystemStore().params).toEqual({ busca: 'abc', id: '7' });
        });

        it('expõe sub_page a partir da query', () => {
            route.query = { sub_page: 'detalhes' };
            expect(useSystemStore().sub_page).toBe('detalhes');
        });

        it('sub_page é null quando ausente', () => {
            expect(useSystemStore().sub_page).toBeNull();
        });
    });

    describe('csrf token', () => {
        it('lê o token da meta tag', () => {
            document.head.innerHTML = '<meta name="csrf-token" content="abc123">';

            const store = useSystemStore();

            expect(store.token).toBe('abc123');
            expect(store.session_token).toBe('abc123');
        });

        it('devolve string vazia sem a meta tag', () => {
            expect(useSystemStore().token).toBe('');
        });

        it('inclui o token nos headers das requisições', () => {
            document.head.innerHTML = '<meta name="csrf-token" content="tok">';

            const headers = useSystemStore().headerRequests;

            expect(headers.headers['X-CSRF-TOKEN']).toBe('tok');
            expect(headers.headers.Accept).toBe('application/json');
            expect(headers.withCredentials).toBe(true);
        });
    });

    describe('autenticação', () => {
        it('is_logged é falso sem usuário', () => {
            expect(useSystemStore().is_logged).toBe(false);
        });

        it('is_logged é falso com usuário mas sem status do servidor', () => {
            const user = useUserStore();
            user.data = { id: 1 };

            expect(useSystemStore().is_logged).toBe(false);
        });

        it('is_logged é verdadeiro com usuário carregado do servidor', () => {
            const user = useUserStore();
            user.data = { id: 1 };
            (user as any).status = { server: { get: { is_success: true } } };

            expect(useSystemStore().is_logged).toBe(true);
        });

        it('isLoggedId devolve o id, ou false', () => {
            const store = useSystemStore();
            expect(store.isLoggedId).toBe(false);

            useUserStore().data = { id: 42 };
            expect(store.isLoggedId).toBe(42);
        });
    });

    describe('base_url e sandbox', () => {
        it('usa a base_url do usuário quando disponível', () => {
            useUserStore().data = { id: 1, base_url: 'https://app.exemplo.com' };

            expect(useSystemStore().base_url).toBe('https://app.exemplo.com');
        });

        it('cai para a configuração quando o usuário não tem base_url', () => {
            configureMaxApp({ baseUrl: 'https://config.exemplo.com' });

            expect(useSystemStore().base_url).toBe('https://config.exemplo.com');
        });

        it('marca sandbox para domínios de teste e dev', () => {
            useUserStore().data = { id: 1, base_url: 'https://app.test' };
            expect(useSystemStore().sandbox).toBe(true);
        });

        it('não marca sandbox em produção', () => {
            useUserStore().data = { id: 1, base_url: 'https://app.exemplo.com' };
            expect(useSystemStore().sandbox).toBe(false);
        });
    });

    describe('versão e estado inicial', () => {
        it('version vem da configuração', () => {
            configureMaxApp({ version: '3.2.1' });
            expect(useSystemStore().version).toBe('3.2.1');
        });

        it('version é vazia por padrão', () => {
            expect(useSystemStore().version).toBe('');
        });

        it('started inicia verdadeiro', () => {
            expect(useSystemStore().started).toBe(true);
        });

        it('content_page_size inicia zerado', () => {
            expect(useSystemStore().content_page_size).toEqual({ width: 0, height: 0 });
        });

        it('side_menu_open inicia falso e é reativo', () => {
            const store = useSystemStore();
            expect(store.side_menu_open).toBe(false);
            store.side_menu_open = true;
            expect(store.side_menu_open).toBe(true);
        });

        it('top_menu_title inicia como string vazia e é reativo', () => {
            const store = useSystemStore();
            expect(store.top_menu_title).toBe('');
            store.top_menu_title = 'Dashboard';
            expect(store.top_menu_title).toBe('Dashboard');
        });
    });

    describe('reloadAll', () => {
        it('registra os loadings e limpa apenas o cache da biblioteca', () => {
            const store = useSystemStore();

            localStorage.setItem('token_da_app', 'nao-me-apague');
            localStorage.setItem('all_icons_v2', '{}');
            localStorage.setItem('max-tab-opened-x', '"a"');
            localStorage.setItem('split_panel', '50');

            store.reloadAll();

            // Chave de terceiro: o localStorage pertence à app hospedeira.
            expect(localStorage.getItem('token_da_app')).toBe('nao-me-apague');

            expect(localStorage.getItem('all_icons_v2')).toBeNull();
            expect(localStorage.getItem('max-tab-opened-x')).toBeNull();
            expect(localStorage.getItem('split_panel')).toBeNull();

            expect(store.loading.keys['system.clear.memory']).toBeDefined();
            expect(store.loading.keys['system.reload.all']).toBeDefined();
        });

        it('usa clearAll do MaxPinia quando disponível', async () => {
            const user = useUserStore();
            const clearAll = vi.fn().mockResolvedValue(undefined);
            (user as any).clearAll = clearAll;

            useSystemStore().reloadAll();

            await Promise.resolve();

            expect(clearAll).toHaveBeenCalled();
        });

        it('funciona sem o MaxPinia instalado', () => {
            expect(() => useSystemStore().reloadAll()).not.toThrow();
        });
    });
});
