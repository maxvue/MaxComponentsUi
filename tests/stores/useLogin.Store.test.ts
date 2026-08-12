import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';

const apiPostRoute = vi.fn();
const apiGetRoute = vi.fn();
const getRoute = vi.fn();

vi.mock('@maxvue/max-use', () => ({
    apiPostRoute: (...args: any[]) => apiPostRoute(...args),
    apiGetRoute: (...args: any[]) => apiGetRoute(...args),
    getRoute: (...args: any[]) => getRoute(...args)
}));

import { useLoginStore } from '../../src/stores/useLogin.Store';
import { useToastStore } from '../../src/stores/useToast.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

describe('useLoginStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        resetMaxAppConfig();
        apiPostRoute.mockReset();
        apiGetRoute.mockReset();
        getRoute.mockReset();
    });

    afterEach(() => {
        resetMaxAppConfig();
    });

    describe('detecção do método', () => {
        it('inicia sem método', () => {
            expect(useLoginStore().method).toBe('');
        });

        it('detecta e-mail pelo @', async () => {
            const store = useLoginStore();
            store.value = 'pessoa@exemplo.com';
            await nextTick();

            expect(store.method).toBe('email');
            expect(store.email).toBe('pessoa@exemplo.com');
            expect(store.phone_number).toBe('');
            expect(store.user_name).toBe('');
        });

        it('detecta telefone com dígitos e separadores', async () => {
            const store = useLoginStore();
            store.value = '+55 (11) 99999-8888';
            await nextTick();

            expect(store.method).toBe('phone');
            expect(store.phone_number).toBe('+55 (11) 99999-8888');
            expect(store.email).toBe('undefined@enge.tec.br');
        });

        it('detecta nome de usuário', async () => {
            const store = useLoginStore();
            store.value = 'joao.silva';
            await nextTick();

            expect(store.method).toBe('user_name');
            expect(store.user_name).toBe('joao.silva');
        });

        it('limpa o método quando o campo esvazia', async () => {
            const store = useLoginStore();
            store.value = 'pessoa@exemplo.com';
            await nextTick();

            store.value = '   ';
            await nextTick();

            expect(store.method).toBe('');
        });

        it('ignora e-mail quando allow_email é falso', async () => {
            const store = useLoginStore();
            store.allow_email = false;
            store.value = 'pessoa@exemplo.com';
            await nextTick();

            expect(store.method).toBe('');
        });

        it('ignora nome de usuário quando allow_user_name é falso', async () => {
            const store = useLoginStore();
            store.allow_user_name = false;
            store.value = 'joao.silva';
            await nextTick();

            expect(store.method).toBe('');
        });

        it('ignora telefone quando allow_phone é falso', async () => {
            const store = useLoginStore();
            store.allow_phone = false;
            store.value = '11999998888';
            await nextTick();

            expect(store.method).toBe('');
        });
    });

    describe('submit', () => {
        it('envia os dados para a rota configurada', async () => {
            configureMaxApp({ routeLogin: 'auth.entrar' });
            apiPostRoute.mockResolvedValue(false);

            const store = useLoginStore();
            store.value = 'pessoa@exemplo.com';
            store.password = 'segredo';
            await nextTick();

            await store.submit();

            expect(apiPostRoute).toHaveBeenCalledWith('auth.entrar', {
                method: 'email',
                email: 'pessoa@exemplo.com',
                password: 'segredo',
                remember: true,
                phone_number: '',
                user_name: ''
            });
        });

        // Regressão: enviar `email` vazio no login por telefone derrubava a
        // requisição com 422 antes de o backend conferir a senha — a regra
        // `required|email` do LoginRequest vale para qualquer método. O
        // servidor descarta este sentinela ao montar as credenciais.
        it('envia o sentinela de e-mail no login por telefone', async () => {
            const store = useLoginStore();
            store.value = '+55 (62) 9 9988-1717';
            store.password = 'segredo';
            await nextTick();

            await store.submit();

            expect(apiPostRoute).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                method: 'phone',
                email: 'undefined@enge.tec.br',
                phone_number: '+55 (62) 9 9988-1717'
            }));
        });

        it('envia o sentinela de e-mail no login por nome de usuário', async () => {
            const store = useLoginStore();
            store.value = 'joao.silva';
            store.password = 'segredo';
            await nextTick();

            await store.submit();

            expect(apiPostRoute).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                method: 'user_name',
                email: 'undefined@enge.tec.br',
                user_name: 'joao.silva'
            }));
        });

        it('exibe toast e mensagem de erro quando falha', async () => {
            apiPostRoute.mockResolvedValue(false);

            const store = useLoginStore();
            await store.submit();

            expect(store.error).toBe('Usuário ou senha inválidos.');
            expect(useToastStore().items).toHaveLength(1);
            expect(useToastStore().items[0].severity).toBe('error');
        });

        it('limpa o erro anterior ao reenviar', async () => {
            apiPostRoute.mockResolvedValue(false);

            const store = useLoginStore();
            await store.submit();
            expect(store.error).not.toBe('');

            apiPostRoute.mockImplementation(async () => {
                expect(store.error).toBe('');
                return false;
            });

            await store.submit();
        });

        it('desliga o loading e exibe erro quando apiPostRoute rejeita (ex: erro de rede)', async () => {
            apiPostRoute.mockRejectedValue(new Error('Erro de rede'));

            const store = useLoginStore();
            await store.submit();

            expect(store.loading).toBe(false);
            expect(store.error).toBe('Não foi possível conectar ao servidor. Tente novamente.');
            expect(useToastStore().items).toHaveLength(1);
            expect(useToastStore().items[0].severity).toBe('error');
        });
    });

    describe('provedores sociais', () => {
        it('carrega e mapeia apenas os provedores conhecidos', async () => {
            apiGetRoute.mockResolvedValue(['google', 'facebook', 'inexistente']);

            const store = useLoginStore();
            await store.loadProviders();

            expect(store.providers).toHaveLength(2);
            expect(store.providers[0]).toEqual({
                id: 'google',
                label: 'Google',
                icon: 'mdi:google',
                class: 'btn-google'
            });
        });

        it('usa a rota de provedores configurada', async () => {
            configureMaxApp({ routeProviders: 'oauth.lista' });
            apiGetRoute.mockResolvedValue([]);

            await useLoginStore().loadProviders();

            expect(apiGetRoute).toHaveBeenCalledWith('oauth.lista');
        });

        it('lida com resposta vazia da API', async () => {
            apiGetRoute.mockResolvedValue(null);

            const store = useLoginStore();
            await store.loadProviders();

            expect(store.providers).toEqual([]);
        });

        it('lida com rejeição da API em loadProviders', async () => {
            apiGetRoute.mockRejectedValue(new Error('Falha de rede'));

            const store = useLoginStore();
            await expect(store.loadProviders()).resolves.not.toThrow();
            expect(store.providers).toEqual([]);
        });

        it('lida com resposta não-array da API em loadProviders', async () => {
            apiGetRoute.mockResolvedValue({ error: 'unauthorized' });

            const store = useLoginStore();
            await store.loadProviders();
            expect(store.providers).toEqual([]);
        });

        it('resolve a rota de redirect com o provedor', () => {
            getRoute.mockReturnValue('https://app.exemplo.com/oauth/google');

            useLoginStore().social('google');

            expect(getRoute).toHaveBeenCalledWith('social.redirect', { provider: 'google' });
        });

        it('não navega quando a rota não resolve', () => {
            getRoute.mockReturnValue(null);

            expect(() => useLoginStore().social('google')).not.toThrow();
        });
    });

    describe('loadUrlError', () => {
        const setSearch = (search: string) => {
            Object.defineProperty(window, 'location', {
                value: { ...window.location, search },
                writable: true,
                configurable: true
            });
        };

        it('traduz o código de erro da URL', () => {
            setSearch('?error=no_email');

            const store = useLoginStore();
            store.loadUrlError();

            expect(store.error).toBe('Sua conta social não forneceu um e-mail. Use e-mail e senha.');
        });

        it('ignora códigos desconhecidos', () => {
            setSearch('?error=qualquer_coisa');

            const store = useLoginStore();
            store.loadUrlError();

            expect(store.error).toBe('');
        });

        it('não faz nada sem o parâmetro', () => {
            setSearch('');

            const store = useLoginStore();
            store.loadUrlError();

            expect(store.error).toBe('');
        });
    });
});
