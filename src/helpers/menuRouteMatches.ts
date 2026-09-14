import { snakeCase } from '@maxvue/max-use';
import type { SideMenuItem } from '../types/app';

/**
 * Normaliza e determina se um item de menu corresponde à rota atual.
 */
export function isMenuRouteActive(
    item: SideMenuItem | Record<string, any> | null | undefined,
    currentRouteName: string | null | undefined
): boolean {
    if (!item || !currentRouteName) return false;

    const current = snakeCase(String(currentRouteName).trim());
    if (!current) return false;

    const rawRoute = item.route || item.details?.route || item.rota || item.details?.page_component;
    if (rawRoute && snakeCase(String(rawRoute).trim()) === current) return true;

    if (item.details?.page_component && snakeCase(String(item.details.page_component).trim()) === current) return true;


    const declaredMatches: unknown = item.matches || item.details?.matches;
    if (Array.isArray(declaredMatches)) return declaredMatches.some((match) => typeof match === 'string' && snakeCase(match.trim()) === current);


    return false;
}
