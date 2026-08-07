/**
 * Tipos do app shell (`MaxApp`) — loading, usuário e configuração.
 *
 * Estes tipos eram ambientes (globais) no engeapp (`resources/Types/Global.d.ts`).
 * Aqui são exportados explicitamente, já que a biblioteca não usa auto-import.
 */

/** Estado de um item de carregamento. */
export type ItemStatus = 'loading' | 'done' | 'error' | 'waiting';

/** Um item individual da fila de carregamento. */
export interface LoadingItem {
    /** Identificador lógico do item (não é a chave interna gerada). */
    key: string;
    /** Mensagem exibida ao usuário. */
    message?: string;
    /** Estado atual. Padrão: `'loading'`. */
    status?: ItemStatus;
    /** Alvo onde o loading é renderizado. Padrão: `'body'`. */
    target?: string;
    /** Imagem exibida junto ao item. */
    image?: string | null;
    /** Usa a animação de IA. */
    ai?: boolean;
    /** Ícone padrão. */
    icon?: string | null;
    /** Tamanho do ícone. */
    icon_size?: string | number | null;
    /** Ícone do estado `loading`. */
    icon_loading?: string | null;
    /** Ícone do estado `done`. */
    icon_done?: string | null;
    /** Ícone do estado `waiting`. */
    icon_waiting?: string | null;
    /** Animação Lottie. */
    lottie_icon?: string | null;
    /** Permite desabilitar o item sem removê-lo. */
    enabled?: boolean;
}

/** Mapa de itens de carregamento, indexado pela chave interna. */
export type LoadingItems = Record<string, LoadingItem>;

/** Agrupamento de itens de carregamento por alvo de renderização. */
export interface LoadingTarget {
    target: string;
    items: LoadingItems;
}

/**
 * Formato mínimo do usuário autenticado exigido pelo app shell.
 *
 * Deliberadamente estrutural: cada aplicação consumidora tem seu próprio modelo
 * de usuário (o do engeapp é um model Laravel gerado, com dezenas de campos).
 * O shell só precisa de `id`; o restante passa pelo index signature.
 */
export interface MaxAppUser {
    id?: string | number | null;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    base_url?: string | null;
    [key: string]: any;
}

/**
 * Configuração global do app shell, injetada no boot via `configureMaxApp()`.
 *
 * Mantém a biblioteca desacoplada das rotas e do backend de cada aplicação:
 * nenhum nome de rota do engeapp é embutido no código.
 */
export interface MaxAppConfig {
    /** Rota que devolve os dados do usuário autenticado. Padrão: `'user.data'`. */
    routeUser?: string;
    /** Rota que salva os dados do usuário. Padrão: `'user.save'`. */
    routeUserSave?: string;
    /** Rota de submissão do login. Padrão: `'login'`. */
    routeLogin?: string;
    /** Rota que lista os provedores sociais habilitados. Padrão: `'social.providers'`. */
    routeProviders?: string;
    /** Rota de redirecionamento para o provedor social. Padrão: `'social.redirect'`. */
    routeSocialRedirect?: string;
    /** Rota que informa se o usuário está sendo impersonado. Padrão: `'user.impersonate.status'`. */
    routeImpersonateStatus?: string;
    /** URL base usada quando o usuário ainda não foi carregado. */
    baseUrl?: string;
    /** Versão da aplicação, exibida na interface. */
    version?: string;
}
