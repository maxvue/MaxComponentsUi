import type { MaxAppConfig } from '../types/app';

/** Endpoint padrão de ícones do Engeapp. */
const DEFAULT_ICON_ENDPOINT = 'https://engeapp.com.br/api/icons';

/**
 * Configuração padrão do app shell.
 *
 * Os nomes de rota seguem a convenção já usada pelo engeapp, mas são apenas
 * *defaults*: qualquer aplicação pode sobrescrevê-los via `configureMaxApp()`
 * ou pelas props do `MaxApp`. Nenhum nome de rota é embutido nas stores.
 */
const BASE_DEFAULT_CONFIG: Required<Pick<MaxAppConfig,
    'routeUser' | 'routeUserSave' | 'routeLogin' | 'routeProviders' |
    'routeSocialRedirect' | 'routeImpersonateStatus' | 'routeMenus' |
    'routeIconsFallback' | 'undefinedEmail'>> = {
    routeUser: 'user.data',
    routeUserSave: 'user.save',
    routeLogin: 'login',
    routeProviders: 'social.providers',
    routeSocialRedirect: 'social.redirect',
    routeImpersonateStatus: 'user.impersonate.status',
    routeMenus: 'menus',
    routeIconsFallback: 'https://api.iconify.design',
    undefinedEmail: 'undefined@enge.tec.br'
};

/**
 * Normaliza o servidor de ícones configurado e resolve o endpoint da API (/api/icons).
 *
 * Regras:
 * - Sem servidor, string vazia ou apenas espaços: devolve o endpoint padrão.
 * - Deve ser uma URL absoluta HTTP ou HTTPS válida.
 * - Rejeita credenciais (username/password), query string (?) e fragmento (#).
 * - Remove barras finais e não duplica o sufixo '/api/icons' se já estiver presente.
 * - Em caso de URL inválida, não lança erro nem expõe valores brutos em log: recorre ao padrão.
 */
function resolveIconEndpoint(server?: string): string {
    if (!server || typeof server !== 'string') return DEFAULT_ICON_ENDPOINT;
    const trimmed = server.trim();
    if (!trimmed) return DEFAULT_ICON_ENDPOINT;

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return DEFAULT_ICON_ENDPOINT;
        if (parsed.username !== '' || parsed.password !== '') return DEFAULT_ICON_ENDPOINT;
        if (parsed.search !== '' || parsed.hash !== '') return DEFAULT_ICON_ENDPOINT;

        const clean = trimmed.replace(/\/+$/, '');
        if (clean.endsWith('/api/icons')) return clean;

        return `${clean}/api/icons`;
    } catch {
        return DEFAULT_ICON_ENDPOINT;
    }
}

/** Opções explicitamente configuradas na aplicação. */
let explicitOptions: MaxAppConfig = {};

/**
 * Constrói o objeto de configuração efetivo acumulando defaults e overrides explícitos.
 */
function computeEffectiveConfig(): MaxAppConfig {
    const derivedIconEndpoint = resolveIconEndpoint(explicitOptions.iconServer);

    const effective: MaxAppConfig = {
        ...BASE_DEFAULT_CONFIG,
        routeIcons: explicitOptions.routeIcons !== undefined ? explicitOptions.routeIcons : derivedIconEndpoint,
        routeIconsSync: explicitOptions.routeIconsSync !== undefined ? explicitOptions.routeIconsSync : derivedIconEndpoint,
        ...explicitOptions
    };

    if (explicitOptions.routeIcons === undefined) effective.routeIcons = derivedIconEndpoint;
    if (explicitOptions.routeIconsSync === undefined) effective.routeIconsSync = derivedIconEndpoint;

    return effective;
}

let config: MaxAppConfig = computeEffectiveConfig();

/**
 * Define a configuração global do app shell.
 *
 * Deve ser chamada no boot da aplicação, **antes** de qualquer store do shell
 * ser instanciada — as stores leem a configuração ao resolver suas rotas.
 *
 * Chamadas subsequentes fazem merge sobre a configuração vigente — o `MaxApp`
 * reconfigura suas props de rota no setup e não pode apagar o que o boot da
 * aplicação já definiu (ex.: `googleMapsApiKey`). Para voltar aos padrões,
 * use `resetMaxAppConfig()`.
 *
 * @example
 * configureMaxApp({ routeUser: 'me', routeLogin: 'auth.login' });
 */
export function configureMaxApp(options: MaxAppConfig = {}): void {
    for (const [key, value] of Object.entries(options)) {
        delete (explicitOptions as any)[key];
        if (value !== undefined) (explicitOptions as any)[key] = value;
    }
    config = computeEffectiveConfig();
}

/**
 * Devolve a configuração atual do app shell (com os defaults aplicados).
 */
export function getMaxAppConfig(): MaxAppConfig {
    return config;
}

/**
 * Restaura a configuração para os valores padrão.
 *
 * Usado principalmente pelos testes, para isolar um caso do outro.
 */
export function resetMaxAppConfig(): void {
    explicitOptions = {};
    config = computeEffectiveConfig();
}
