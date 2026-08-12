import type { MaxAppConfig } from '../types/app';

/**
 * Configuração padrão do app shell.
 *
 * Os nomes de rota seguem a convenção já usada pelo engeapp, mas são apenas
 * *defaults*: qualquer aplicação pode sobrescrevê-los via `configureMaxApp()`
 * ou pelas props do `MaxApp`. Nenhum nome de rota é embutido nas stores.
 */
const DEFAULT_CONFIG: Required<Pick<MaxAppConfig,
    'routeUser' | 'routeUserSave' | 'routeLogin' | 'routeProviders' |
    'routeSocialRedirect' | 'routeImpersonateStatus' | 'routeMenus' | 'routeIcons' |
    'undefinedEmail'>> = {
    routeUser: 'user.data',
    routeUserSave: 'user.save',
    routeLogin: 'login',
    routeProviders: 'social.providers',
    routeSocialRedirect: 'social.redirect',
    routeImpersonateStatus: 'user.impersonate.status',
    routeMenus: 'menus',
    routeIcons: 'https://engeapp.com.br/api/icons',
    undefinedEmail: 'undefined@enge.tec.br'
};

let config: MaxAppConfig = { ...DEFAULT_CONFIG };

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
    config = { ...config, ...options };
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
    config = { ...DEFAULT_CONFIG };
}
