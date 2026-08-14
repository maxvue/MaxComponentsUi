import { getMaxAppConfig } from './maxAppConfig';

/**
 * Registro central das chaves de `localStorage` que pertencem à biblioteca.
 *
 * O `localStorage` de um origin pertence à **aplicação hospedeira**, não a esta
 * biblioteca: um `localStorage.clear()` apagaria tokens de sessão, preferências
 * e rascunhos de código que a lib não escreveu e sobre os quais não tem
 * informação para decidir. Por isso a limpeza é escopada — só some o que está
 * declarado aqui, e a aplicação pode incluir chaves próprias com
 * {@link registerMaxCacheKey}.
 */

/**
 * Chave versionada do cache de ícones (`useIcon.Store`).
 *
 * Definida aqui — e não na store — para que exista uma única fonte da verdade:
 * a store a importa deste registro.
 */
export const ICON_CACHE_KEY = 'all_icons_v2';

/** Chaves de nome fixo gravadas pela biblioteca. */
const EXACT_KEYS: readonly string[] = [ICON_CACHE_KEY];

/**
 * Prefixos de chaves dinâmicas gravadas pela biblioteca.
 *
 * - `split_panel` — `useSystem.Store` (`split_panel_key`, com os sufixos
 *   registrados por `registerSplitPanelKeyPart`);
 * - `max-tab-opened-` — `MaxTabs`.
 */
const KEY_PREFIXES: readonly string[] = ['split_panel', 'max-tab-opened-'];

/** Chaves exatas declaradas pela aplicação hospedeira. */
const extra_keys = new Set<string>();

/** Prefixos declarados pela aplicação hospedeira. */
const extra_prefixes = new Set<string>();

/**
 * Declara uma chave (ou prefixo) da aplicação hospedeira que também deve ser
 * removida por {@link clearMaxCache} — e, portanto, pelo `reloadAll()` da
 * `useSystemStore`.
 *
 * Devolve uma função que desfaz o registro.
 *
 * @example
 * registerMaxCacheKey('meu_rascunho');
 * registerMaxCacheKey('meu_app_', { prefix: true });
 */
export function registerMaxCacheKey(key: string, options: { prefix?: boolean } = {}): () => void {
    if (!key || typeof key !== 'string') return () => { /* nada a desfazer */ };

    const target = options.prefix ? extra_prefixes : extra_keys;
    target.add(key);

    return () => { target.delete(key); };
}

/**
 * Remove todas as chaves declaradas pela aplicação hospedeira.
 *
 * Usada principalmente pelos testes, para isolar um caso do outro.
 */
export function resetMaxCacheKeys(): void {
    extra_keys.clear();
    extra_prefixes.clear();
}

/** Indica se a chave informada pertence à biblioteca (ou foi registrada pela app). */
export function isMaxCacheKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    if (EXACT_KEYS.includes(key) || extra_keys.has(key)) return true;

    // `useListMenus.Store` persiste a lista de menus sob o nome da rota configurada.
    const route_menus = getMaxAppConfig().routeMenus;
    if (route_menus && key === route_menus) return true;

    for (const prefix of KEY_PREFIXES) if (key.startsWith(prefix)) return true;
    for (const prefix of extra_prefixes) if (key.startsWith(prefix)) return true;

    return false;
}

/**
 * Remove do `localStorage` **apenas** as chaves pertencentes à biblioteca,
 * preservando tudo o que a aplicação hospedeira gravou por conta própria.
 *
 * Devolve a lista de chaves removidas. É SSR-safe (sem `localStorage`, devolve
 * lista vazia) e tolerante a `SecurityError` (cookies bloqueados).
 */
export function clearMaxCache(): string[] {
    if (typeof localStorage === 'undefined') return [];

    try {
        const keys: string[] = [];

        // Coleta antes de remover: apagar durante a iteração reindexa o storage
        // e faria pular chaves.
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            if (key !== null && isMaxCacheKey(key)) keys.push(key);
        }

        keys.forEach((key) => localStorage.removeItem(key));

        return keys;
    } catch {
        return [];
    }
}
