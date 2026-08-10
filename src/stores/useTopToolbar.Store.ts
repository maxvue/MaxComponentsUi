import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getRoute } from '@maxvue/max-use';

/**
 * Store da barra de ferramentas superior.
 *
 * Diferença em relação à versão do engeapp: ali o router era importado como
 * singleton (`@js/router`) e o Ziggy consultado diretamente. Aqui o router vem
 * de `useRouter()` e as rotas do backend passam pelo `getRoute` do MaxUse, que
 * o aplicativo configura via `setRouteResolver()`.
 */
export const useTopToolbarStore = defineStore('top_toolbar', () => {

    /** Itens exibidos na barra. */
    const items: Ref<any[]> = ref([]);

    /** Controla a exibição da barra. */
    const show: Ref<boolean> = ref(false);

    /** Rota usada quando o item não informa uma. */
    const defaultRoute: Ref<string | null> = ref(null);

    /** Dados mesclados em toda navegação. */
    const defaultData: Ref<Record<string, any>> = ref({});

    const router = useRouter();

    /**
     * Navega para a rota do item.
     *
     * Tenta, nesta ordem: rota nomeada do Vue Router, rota do backend resolvida
     * pelo `getRoute` e, por fim, a rota atual — sempre repassando a query.
     */
    const route = (data: any = {}, routeName: any = null): boolean => {
        const target = (routeName && routeName !== false) ? routeName : defaultRoute.value;
        const query = { ...defaultData.value, ...(data ?? {}) };

        if (!target) {
            router.push({ query });

            return true;
        }

        if (router.hasRoute(target)) {
            router.push({ name: target, query });

            return true;
        }

        const url = getRoute(target);

        if (url) {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const path = origin && url.startsWith(origin) ? (url.slice(origin.length) || '/') : url;

            router.push({ path, query });

            return true;
        }

        router.push({ name: String(router.currentRoute.value?.name ?? ''), query });

        return true;
    };

    return { items, show, route, defaultData, defaultRoute };
});
