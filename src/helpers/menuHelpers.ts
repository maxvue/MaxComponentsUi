import type { SideMenuSubItem, MenuIconPosition } from '../types/app';
import { isMenuRouteActive } from './menuRouteMatches';

const VALID_ICON_SIZE_PATTERN = /^\d+(\.\d+)?(px|rem|em|vw|vh|vmin|vmax)?$/i;

/**
 * Normaliza e valida um valor candidato para tamanho de ícone de item de menu.
 * Aceita números finitos não negativos, strings decimais equivalentes e comprimentos
 * simples com unidades px, rem, em, vw, vh, vmin, vmax. Zero é preservado.
 */
function parseIconSizeCandidate(value: any): string | number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
        if (Number.isFinite(value) && value >= 0) return value;
        return null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (VALID_ICON_SIZE_PATTERN.test(trimmed)) return trimmed;
    }
    return null;
}

/**
 * Resolve o tamanho do ícone de um item de menu conforme a posição e as regras
 * de precedência do MaxApp:
 * 1. Campo específico da posição na raiz (size_<pos> vence <pos>_size);
 * 2. Campo específico da posição em details (size_<pos> vence <pos>_size);
 * 3. Campo genérico size na raiz;
 * 4. Campo genérico size em details;
 * 5. Fallback fornecido pelo contexto do chamador.
 */
export function getMenuItemIconSize(item: any, position: MenuIconPosition, fallback: string | number): string | number {
    if (!item || typeof item !== 'object') return fallback;

    let candidates: any[];
    switch (position) {
        case 'side':
            candidates = [
                item.size_side,
                item.side_size,
                item.details?.size_side,
                item.details?.side_size,
                item.size,
                item.details?.size
            ];
            break;
        case 'bottom':
            candidates = [
                item.size_bottom,
                item.bottom_size,
                item.details?.size_bottom,
                item.details?.bottom_size,
                item.size,
                item.details?.size
            ];
            break;
        case 'top':
            candidates = [
                item.size_top,
                item.top_size,
                item.details?.size_top,
                item.details?.top_size,
                item.size,
                item.details?.size
            ];
            break;
        default:
            return fallback;
    }

    for (const candidate of candidates) {
        const parsed = parseIconSizeCandidate(candidate);
        if (parsed !== null) return parsed;
    }

    return fallback;
}

/**
 * Extrai e normaliza os subitens de um item de menu lateral.
 *
 * Suporta formatos flexíveis: `item.subitems`, `item.items`, `item.children`,
 * bem como declarados internamente em `item.details.*`.
 */
export function getSubItems(item: any): SideMenuSubItem[] {
    if (!item) return [];

    const candidates = item.subitems
        ?? item.items
        ?? item.children
        ?? item.details?.subitems
        ?? item.details?.items
        ?? item.details?.children;

    if (!Array.isArray(candidates)) return [];

    return candidates.filter((sub) => sub && !sub.hide && !sub.details?.hide);
}

/**
 * Verifica se um item de menu possui ao menos um subitem visível.
 */
export function hasSubItems(item: any): boolean {
    return getSubItems(item).length > 0;
}

/**
 * Obtém o rótulo descritivo de um item ou subitem de menu.
 */
export function getMenuItemLabel(item: any): string {
    if (!item) return '';
    return item.label || item.title || item.details?.title || item.details?.label || item.details?.tooltip || item.tooltip || item.name || '';
}

/**
 * Obtém o ícone de um item ou subitem de menu.
 */
export function getMenuItemIcon(item: any): string | null {
    if (!item) return null;
    return item.icon || item.icone || item.details?.icon || item.details?.icone || null;
}

/**
 * Obtém a rota de destino de um item ou subitem de menu.
 */
export function getMenuItemRoute(item: any): string | null {
    if (!item) return null;
    return item.route || item.rota || item.details?.route || item.details?.page_component || item.page_component || null;
}

/**
 * Verifica se um subitem específico é o ativo para a rota atual.
 */
export function isSubItemActive(subitem: any, currentRouteName: string): boolean {
    return isMenuRouteActive(subitem, currentRouteName);
}

/**
 * Verifica se algum dos subitens de um item está ativo para a rota atual.
 */
export function hasActiveSubItem(item: any, currentRouteName: string): boolean {
    const subitems = getSubItems(item);
    return subitems.some((sub) => isSubItemActive(sub, currentRouteName));
}
