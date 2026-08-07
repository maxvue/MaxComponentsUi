import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../../src/stores/useUser.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

describe('useUserStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        resetMaxAppConfig();
    });

    afterEach(() => {
        resetMaxAppConfig();
    });

    it('inicia sem usuário carregado', () => {
        const store = useUserStore();

        expect(store.data).toBeNull();
        expect(store.isCached).toBe(true);
    });

    it('monta options com as rotas padrão', () => {
        const store = useUserStore();

        expect(store.options).toEqual({
            get: { route: 'user.data' },
            save: 'user.save',
            key: 'user'
        });
    });

    it('reflete as rotas configuradas em configureMaxApp', () => {
        configureMaxApp({ routeUser: 'me', routeUserSave: 'me.update' });

        const store = useUserStore();

        expect(store.options.get.route).toBe('me');
        expect(store.options.save).toBe('me.update');
    });

    it('mantém a chave de cache fixa em "user"', () => {
        configureMaxApp({ routeUser: 'outra.rota' });

        expect(useUserStore().options.key).toBe('user');
    });

    it('departments_id devolve lista vazia sem usuário', () => {
        expect(useUserStore().departments_id).toEqual([]);
    });

    it('departments_id mapeia os ids dos departamentos', () => {
        const store = useUserStore();
        store.data = { id: 1, departments: [{ id: 10 }, { id: 20 }] };

        expect(store.departments_id).toEqual([10, 20]);
    });

    it('departments_id devolve lista vazia quando o usuário não tem departamentos', () => {
        const store = useUserStore();
        store.data = { id: 1 };

        expect(store.departments_id).toEqual([]);
    });

    it('waitRequest resolve de imediato quando o usuário já carregou', async () => {
        const store = useUserStore();
        (store as any).status = { server: { get: { is_success: true } } };

        await expect(store.waitRequest()).resolves.toBeUndefined();
    });

    it('waitRequest aguarda o carregamento concluir', async () => {
        const store = useUserStore();
        (store as any).status = { server: { get: { is_success: false } } };

        let resolvido = false;
        const promessa = store.waitRequest().then(() => resolvido = true);

        await Promise.resolve();
        expect(resolvido).toBe(false);

        (store as any).status.server.get.is_success = true;
        await promessa;

        expect(resolvido).toBe(true);
    });
});
