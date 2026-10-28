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

    it('aceita logo e routeLogo na configuração do app shell', () => {
        configureMaxApp({ logo: '/get_file?file=logo.svg', routeLogo: '/dashboard' });

        const config = getMaxAppConfig();

        expect(config.logo).toBe('/get_file?file=logo.svg');
        expect(config.routeLogo).toBe('/dashboard');
    });

    it('aceita logoAlt e logoFallbackLabel na configuração do app shell', () => {
        configureMaxApp({
            logo: 'brand.logo',
            routeLogo: '/',
            logoAlt: 'Símbolo ENGEAPP',
            logoFallbackLabel: 'MaxCode'
        });

        const config = getMaxAppConfig();

        expect(config.logo).toBe('brand.logo');
        expect(config.routeLogo).toBe('/');
        expect(config.logoAlt).toBe('Símbolo ENGEAPP');
        expect(config.logoFallbackLabel).toBe('MaxCode');
    });

    it('resetMaxAppConfig restaura os padrões', () => {
        configureMaxApp({ routeUser: 'me', logo: '/logo.svg', logoAlt: 'Alt', logoFallbackLabel: 'Fallback' });
        resetMaxAppConfig();

        expect(getMaxAppConfig().routeUser).toBe('user.data');
        expect(getMaxAppConfig().logo).toBeUndefined();
        expect(getMaxAppConfig().logoAlt).toBeUndefined();
        expect(getMaxAppConfig().logoFallbackLabel).toBeUndefined();
    });

    describe('resolução de iconServer e rotas de ícones', () => {
        it('usa os endpoints padrão do Engeapp quando iconServer não é informado, é vazio ou contém apenas espaços', () => {
            configureMaxApp({});
            expect(getMaxAppConfig().routeIcons).toBe('https://engeapp.com.br/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://engeapp.com.br/api/icons');

            configureMaxApp({ iconServer: '' });
            expect(getMaxAppConfig().routeIcons).toBe('https://engeapp.com.br/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://engeapp.com.br/api/icons');

            configureMaxApp({ iconServer: '   ' });
            expect(getMaxAppConfig().routeIcons).toBe('https://engeapp.com.br/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://engeapp.com.br/api/icons');
        });

        it('resolve iconServer absoluto HTTP/HTTPS adicionando /api/icons para GET e POST', () => {
            configureMaxApp({ iconServer: 'https://icones.exemplo.com' });

            const config = getMaxAppConfig();
            expect(config.iconServer).toBe('https://icones.exemplo.com');
            expect(config.routeIcons).toBe('https://icones.exemplo.com/api/icons');
            expect(config.routeIconsSync).toBe('https://icones.exemplo.com/api/icons');
        });

        it('remove espaços externos e barras finais sem duplicar barras na junção', () => {
            configureMaxApp({ iconServer: '  https://icones.exemplo.com///  ' });

            const config = getMaxAppConfig();
            expect(config.routeIcons).toBe('https://icones.exemplo.com/api/icons');
            expect(config.routeIconsSync).toBe('https://icones.exemplo.com/api/icons');
        });

        it('preserva prefixo de caminho em iconServer', () => {
            configureMaxApp({ iconServer: 'https://icones.exemplo.com/prefixo' });
            expect(getMaxAppConfig().routeIcons).toBe('https://icones.exemplo.com/prefixo/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://icones.exemplo.com/prefixo/api/icons');

            configureMaxApp({ iconServer: 'https://icones.exemplo.com/prefixo/' });
            expect(getMaxAppConfig().routeIcons).toBe('https://icones.exemplo.com/prefixo/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://icones.exemplo.com/prefixo/api/icons');
        });

        it('não duplica o sufixo /api/icons quando já estiver presente', () => {
            configureMaxApp({ iconServer: 'https://icones.exemplo.com/api/icons' });
            expect(getMaxAppConfig().routeIcons).toBe('https://icones.exemplo.com/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://icones.exemplo.com/api/icons');

            configureMaxApp({ iconServer: 'https://icones.exemplo.com/api/icons/' });
            expect(getMaxAppConfig().routeIcons).toBe('https://icones.exemplo.com/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://icones.exemplo.com/api/icons');

            configureMaxApp({ iconServer: 'https://icones.exemplo.com/prefixo/api/icons/' });
            expect(getMaxAppConfig().routeIcons).toBe('https://icones.exemplo.com/prefixo/api/icons');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://icones.exemplo.com/prefixo/api/icons');
        });

        it('recorre ao padrão Engeapp quando iconServer for inválido sem lançar erro', () => {
            const invalidUrls = [
                '/api/icons',
                'icones.exemplo.com',
                'ftp://icones.exemplo.com',
                'javascript:alert(1)',
                'https://user:pass@icones.exemplo.com',
                'https://icones.exemplo.com?token=123',
                'https://icones.exemplo.com#secao'
            ];

            for (const invalid of invalidUrls) {
                configureMaxApp({ iconServer: invalid });
                expect(getMaxAppConfig().routeIcons).toBe('https://engeapp.com.br/api/icons');
                expect(getMaxAppConfig().routeIconsSync).toBe('https://engeapp.com.br/api/icons');
            }
        });

        it('routeIcons explicitamente definida prevalece apenas no GET sem reescrever o POST', () => {
            configureMaxApp({
                iconServer: 'https://icones.exemplo.com',
                routeIcons: 'https://outro.com/api/custom-icons'
            });

            const config = getMaxAppConfig();
            expect(config.routeIcons).toBe('https://outro.com/api/custom-icons');
            expect(config.routeIconsSync).toBe('https://icones.exemplo.com/api/icons');
        });

        it('routeIconsSync explicitamente definida prevalece apenas no POST', () => {
            configureMaxApp({
                iconServer: 'https://icones.exemplo.com',
                routeIconsSync: 'https://sync.outro.com/api/sync'
            });

            const config = getMaxAppConfig();
            expect(config.routeIcons).toBe('https://icones.exemplo.com/api/icons');
            expect(config.routeIconsSync).toBe('https://sync.outro.com/api/sync');
        });

        it('passar undefined para uma rota remove o override anterior e resolve pelo servidor ou default', () => {
            configureMaxApp({
                iconServer: 'https://icones.exemplo.com',
                routeIcons: 'https://outro.com/api'
            });
            expect(getMaxAppConfig().routeIcons).toBe('https://outro.com/api');

            configureMaxApp({ routeIcons: undefined });
            expect(getMaxAppConfig().routeIcons).toBe('https://icones.exemplo.com/api/icons');

            configureMaxApp({ iconServer: undefined });
            expect(getMaxAppConfig().routeIcons).toBe('https://engeapp.com.br/api/icons');
        });

        it('chamadas sucessivas de configureMaxApp preservam iconServer e overrides de ícones', () => {
            configureMaxApp({ iconServer: 'https://icones.exemplo.com' });
            configureMaxApp({ routeLogin: 'auth.login' });

            const config = getMaxAppConfig();
            expect(config.iconServer).toBe('https://icones.exemplo.com');
            expect(config.routeIcons).toBe('https://icones.exemplo.com/api/icons');
            expect(config.routeLogin).toBe('auth.login');
        });

        it('resetMaxAppConfig limpa servidor e overrides de ícones restaurando defaults', () => {
            configureMaxApp({
                iconServer: 'https://icones.exemplo.com',
                routeIcons: 'https://outro.com/api'
            });
            resetMaxAppConfig();

            const config = getMaxAppConfig();
            expect(config.iconServer).toBeUndefined();
            expect(config.routeIcons).toBe('https://engeapp.com.br/api/icons');
            expect(config.routeIconsSync).toBe('https://engeapp.com.br/api/icons');
        });

        it('alteração de iconServer recalcula os destinos derivados preservando overrides explícitos', () => {
            configureMaxApp({
                iconServer: 'https://primeiro.com',
                routeIcons: 'https://override.com'
            });
            expect(getMaxAppConfig().routeIcons).toBe('https://override.com');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://primeiro.com/api/icons');

            configureMaxApp({ iconServer: 'https://segundo.com' });
            expect(getMaxAppConfig().routeIcons).toBe('https://override.com');
            expect(getMaxAppConfig().routeIconsSync).toBe('https://segundo.com/api/icons');
        });
    });
});
