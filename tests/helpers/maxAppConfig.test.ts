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

    it('acumula configurações entre chamadas', () => {
        configureMaxApp({ routeUser: 'primeiro' });
        configureMaxApp({ routeLogin: 'segundo' });

        const config = getMaxAppConfig();

        expect(config.routeLogin).toBe('segundo');
        // routeUser sobrevive: chamadas posteriores fazem merge, não reset
        expect(config.routeUser).toBe('primeiro');
    });

    it('preserva a configuração do boot quando o MaxApp reconfigura só as rotas', () => {
        // Cenário real: o app configura as credenciais do Google Maps no boot...
        configureMaxApp({ googleMapsApiKey: 'chave-do-boot', googleMapsMapId: 'MAPA' });
        // ...e o setup do MaxApp chama configureMaxApp de novo, só com props de rota.
        configureMaxApp({ routeLogin: 'auth.login' });

        const config = getMaxAppConfig();

        expect(config.googleMapsApiKey).toBe('chave-do-boot');
        expect(config.googleMapsMapId).toBe('MAPA');
        expect(config.routeLogin).toBe('auth.login');
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
