import { describe, it, expect, beforeEach } from 'vitest';
import { configureMaxApp, getMaxAppConfig, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

describe('maxAppConfig', () => {
    beforeEach(() => {
        resetMaxAppConfig();
    });

    it('expõe as rotas padrão', () => {
        const config = getMaxAppConfig();

        expect(config.routeUser).toBe('user.data');
        expect(config.routeUserSave).toBe('user.save');
        expect(config.routeLogin).toBe('login');
        expect(config.routeProviders).toBe('social.providers');
        expect(config.routeSocialRedirect).toBe('social.redirect');
        expect(config.routeImpersonateStatus).toBe('user.impersonate.status');
    });

    it('sobrescreve apenas as chaves informadas', () => {
        configureMaxApp({ routeUser: 'me', routeLogin: 'auth.login' });

        const config = getMaxAppConfig();

        expect(config.routeUser).toBe('me');
        expect(config.routeLogin).toBe('auth.login');
        // as demais seguem no padrão
        expect(config.routeUserSave).toBe('user.save');
        expect(config.routeProviders).toBe('social.providers');
    });

    it('aceita chamada sem argumentos e mantém os padrões', () => {
        configureMaxApp();

        expect(getMaxAppConfig().routeUser).toBe('user.data');
    });

    it('não acumula configurações entre chamadas', () => {
        configureMaxApp({ routeUser: 'primeiro' });
        configureMaxApp({ routeLogin: 'segundo' });

        const config = getMaxAppConfig();

        expect(config.routeLogin).toBe('segundo');
        // routeUser voltou ao padrão, pois a segunda chamada substitui a anterior
        expect(config.routeUser).toBe('user.data');
    });

    it('aceita campos extras de configuração', () => {
        configureMaxApp({ baseUrl: 'https://app.exemplo.com', version: '2.1.0' });

        const config = getMaxAppConfig();

        expect(config.baseUrl).toBe('https://app.exemplo.com');
        expect(config.version).toBe('2.1.0');
    });

    it('resetMaxAppConfig restaura os padrões', () => {
        configureMaxApp({ routeUser: 'me' });
        resetMaxAppConfig();

        expect(getMaxAppConfig().routeUser).toBe('user.data');
    });
});
