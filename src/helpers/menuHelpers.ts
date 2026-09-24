import type { SideMenuSubItem } from '../types/app';
import { isMenuRouteActive } from './menuRouteMatches';

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
