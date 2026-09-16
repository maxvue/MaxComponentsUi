import { defineStore } from 'pinia';
import { useRefCachedApi } from '@maxvue/max-use';

import type { SideMenuItem } from '../types/app';
import { getMaxAppConfig } from '../helpers/maxAppConfig';

/** Menus da aplicação, agrupados por posição. */
export interface ListMenu {
    /** Itens do menu lateral. */
    side?: SideMenuItem[];
    [key: string]: any;
}

/**
 * Store dos menus da aplicação.
 *
 * Os dados vêm da rota configurada em `configureMaxApp({ routeMenus })` e são
 * mantidos em cache local pelo `useRefCachedApi`: a primeira leitura devolve o
 * cache e a atualização chega em segundo plano.
 */
export const useListMenusStore = defineStore('menus.list', () => {
    const list = useRefCachedApi<ListMenu | null | undefined>(getMaxAppConfig().routeMenus as string);

    return { list };
});
