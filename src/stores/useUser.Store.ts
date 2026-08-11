import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, watch } from 'vue';
import { apiGetRoute, computedAsync } from '@maxvue/max-use';

import type { MaxAppUser } from '../types/app';
import { getMaxAppConfig } from '../helpers/maxAppConfig';

/**
 * Store do usuário autenticado.
 *
 * **Esta store não busca os dados por conta própria.** Ela apenas declara
 * `options`, e o plugin `@maxvue/max-pinia` — registrado no boot da aplicação
 * via `createMaxPinia()` — é quem executa o GET, mantém o cache offline e
 * popula `status.server.get.is_success`, a flag que governa todo o branching
 * de autenticação do `MaxApp`.
 *
 * Sem o plugin instalado, `status` fica indefinido e o shell trata o usuário
 * como não carregado.
 *
 * As rotas vêm de `configureMaxApp()`, nunca hardcoded.
 */
export const useUserStore = defineStore('user', () => {

    /** Dados do usuário autenticado. `null` enquanto não carregado. */
    const data: Ref<MaxAppUser | null> = ref(null);

    /** Habilita o cache offline do `@maxvue/max-pinia`. */
    const isCached: Ref<boolean> = ref(true);

    /**
     * Contrato lido pelo `@maxvue/max-pinia`: de onde carregar, para onde
     * salvar e sob qual chave cachear.
     */
    const options = computed(() => {
        const config = getMaxAppConfig();

        return {
            get: { route: config.routeUser },
            save: config.routeUserSave,
            key: 'user'
        };
    });

    /** IDs dos departamentos do usuário. */
    const departments_id = computed(() => data.value?.departments?.map((item: any) => item.id) ?? []);

    /**
     * Status das operações do servidor, injetado pelo `@maxvue/max-pinia`.
     */
    function getStatus(this: any) {
        return this?.status?.server ?? null;
    }

    /**
     * Indica se a sessão atual é uma impersonação.
     *
     * Só consulta o servidor depois que o usuário foi carregado com sucesso.
     */
    const isImpersonated = computedAsync(
        async function (this: any) {
            const status_server = getStatus.call(this);

            if (data.value?.id && status_server?.get?.is_success) return await apiGetRoute(getMaxAppConfig().routeImpersonateStatus as string);


            return false;
        },
        false
    );

    /**
     * Resolve quando o usuário terminar de carregar ou falhar/expirar o timeout.
     *
     * Resolve imediatamente se o carregamento já ocorreu ou falhou.
     */
    function waitRequest(this: any, timeout = 15000): Promise<void> {
        return new Promise((resolve) => {
            if (this?.status?.server?.get?.is_success || this?.status?.server?.get?.is_error) return resolve();


            let timer: ReturnType<typeof setTimeout> | null = null;
            let unwatch: (() => void) | null = null;

            const cleanup = () => {
                if (unwatch) {
                    unwatch();
                    unwatch = null;
                }
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            };

            unwatch = watch(
                () => [this?.status?.server?.get?.is_success, this?.status?.server?.get?.is_error],
                ([is_success, is_error]) => {
                    if (is_success || is_error) {
                        cleanup();
                        resolve();
                    }
                }
            );

            if (timeout > 0) timer = setTimeout(() => {
                cleanup();
                resolve();
            }, timeout);

        });
    }

    return {
        data,
        options,
        isCached,
        departments_id,
        isImpersonated,
        waitRequest
    };
});
