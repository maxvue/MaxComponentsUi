import { snakeCase } from '@maxvue/max-use';
import { getMenuItemRoute, getSubItems } from './menuHelpers';
import { isMenuRouteActive } from './menuRouteMatches';

/**
 * Alvo mínimo de rota para correspondência de menu.
 */
export interface MenuRouteTarget {
    name?: string | symbol | null;
    path?: string | null;
}

type CandidateMatchType = 'direct' | 'alias';

interface MenuCandidate {
    item: any;
    matchType: CandidateMatchType;
    depth: number;
    order: number;
}

/**
 * Normaliza o nome da rota atual com snakeCase do MaxUse.
 */
function normalizeRouteName(name: string | symbol | null | undefined): string | null {
    if (name === null || name === undefined) return null;
    const str = String(name).trim();
    if (!str) return null;
    return snakeCase(str);
}

/**
 * Verifica se um nó de menu corresponde diretamente à rota informada.
 */
function checkDirectMatch(
    item: any,
    normalizedRouteName: string | null,
    currentRoutePath: string | null
): boolean {
    if (!item || typeof item !== 'object') return false;

    const directTargets: string[] = [];
    if (typeof item.route === 'string') directTargets.push(item.route);
    if (typeof item.rota === 'string') directTargets.push(item.rota);
    if (typeof item.page_component === 'string') directTargets.push(item.page_component);

    if (item.details && typeof item.details === 'object') {
        if (typeof item.details.route === 'string') directTargets.push(item.details.route);
        if (typeof item.details.page_component === 'string') directTargets.push(item.details.page_component);
    }

    const helperRoute = getMenuItemRoute(item);
    if (helperRoute && !directTargets.includes(helperRoute)) directTargets.push(helperRoute);

    for (const target of directTargets) {
        const trimmed = target.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('/') && currentRoutePath && trimmed === currentRoutePath) return true;
        if (!trimmed.startsWith('/') && normalizedRouteName && snakeCase(trimmed) === normalizedRouteName) return true;
    }

    return false;
}

/**
 * Verifica se um nó de menu corresponde por alias (`matches`) à rota informada.
 */
function checkAliasMatch(
    item: any,
    currentRouteNameStr: string | null,
    currentRoutePath: string | null
): boolean {
    if (!item || typeof item !== 'object') return false;

    const declaredMatches: unknown = item.matches ?? item.details?.matches;
    if (!Array.isArray(declaredMatches)) return false;

    for (const match of declaredMatches) {
        if (typeof match !== 'string') continue;
        const trimmed = match.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('/') && currentRoutePath && trimmed === currentRoutePath) return true;
        if (!trimmed.startsWith('/') && currentRouteNameStr && isMenuRouteActive({ matches: [trimmed] }, currentRouteNameStr)) return true;
    }

    return false;
}

/**
 * Obtém o valor estrito de disponibilidade de um item ou subitem.
 * O valor da raiz prevalece sobre `details.is_disponible`.
 */
function getItemAvailability(item: any): boolean | null | undefined {
    if (!item || typeof item !== 'object') return undefined;

    if (item.is_disponible !== undefined && item.is_disponible !== null) return item.is_disponible;

    return item.details?.is_disponible;
}

/**
 * Avalia se o item de menu correspondente à rota atual está marcado como indisponível.
 *
 * Regras de resolução e precedência:
 * 1. Campo: lê `item.is_disponible ?? item.details?.is_disponible`. O valor da raiz prevalece sobre `details`.
 *    Apenas o booleano `false` estrito indica indisponibilidade; valores omitidos, `null`, `true`,
 *    números (`0`) ou strings (`"false"`) mantêm o recurso disponível.
 * 2. Correspondência:
 *    - Destinos diretos: `getMenuItemRoute`, `route`, `rota`, `page_component` (na raiz e em `details`).
 *      Nomes de rotas são normalizados via `snakeCase`; caminhos iniciados com `/` devem coincidir exatamente com `route.path`.
 *    - Aliases: após destinos diretos, avalia `matches` ou `details.matches` via `isMenuRouteActive`.
 * 3. Precedência entre múltiplos candidatos correspondentes:
 *    - Destino direto tem prioridade absoluta sobre correspondência por alias.
 *    - Dentro da mesma categoria (direto ou alias), vence o item mais profundo na hierarquia (maior profundidade).
 *    - Em caso de empate na mesma profundidade, vence a primeira ocorrência na ordem de exibição.
 * 4. Sem herança implícita: a disponibilidade pertence exclusivamente ao item vencedor.
 *    Um pai indisponível não bloqueia filhos com rota própria nem páginas adjacentes.
 * 5. Ciclos e segurança: protegido contra referências cíclicas em subitens via `Set` de identidade de objetos.
 *
 * @param items Lista de itens de menu a inspecionar.
 * @param currentRoute Objeto contendo nome e/ou caminho da rota atual.
 * @returns `true` se o item vencedor estiver indisponível (`is_disponible === false`); caso contrário, `false`.
 */
export function isCurrentMenuUnavailable(
    items: any[] | null | undefined,
    currentRoute: MenuRouteTarget | null | undefined
): boolean {
    if (!items || !Array.isArray(items) || items.length === 0) return false;
    if (!currentRoute || typeof currentRoute !== 'object') return false;

    const normalizedRouteName = normalizeRouteName(currentRoute.name);
    const currentRouteNameStr = currentRoute.name !== null && currentRoute.name !== undefined ? String(currentRoute.name) : null;
    const currentRoutePath = typeof currentRoute.path === 'string' ? currentRoute.path.trim() : null;

    if (!normalizedRouteName && !currentRoutePath) return false;

    const visited = new Set<object>();
    const candidates: MenuCandidate[] = [];
    let orderCounter = 0;

    function traverse(node: any, depth: number): void {
        if (!node || typeof node !== 'object') return;
        if (visited.has(node)) return;
        visited.add(node);

        const currentOrder = orderCounter++;

        if (checkDirectMatch(node, normalizedRouteName, currentRoutePath)) candidates.push({ item: node, matchType: 'direct', depth, order: currentOrder });
        else if (checkAliasMatch(node, currentRouteNameStr, currentRoutePath)) candidates.push({ item: node, matchType: 'alias', depth, order: currentOrder });

        const subitems = getSubItems(node);
        for (const sub of subitems) traverse(sub, depth + 1);
    }

    for (const item of items) traverse(item, 0);

    if (candidates.length === 0) return false;

    candidates.sort((a, b) => {
        if (a.matchType !== b.matchType) return a.matchType === 'direct' ? -1 : 1;
        if (a.depth !== b.depth) return b.depth - a.depth;
        return a.order - b.order;
    });

    const winner = candidates[0].item;
    const rawAvailability = getItemAvailability(winner);

    return rawAvailability === false;
}
