import { getActivePinia, type Pinia, type Store } from 'pinia';
import { watch, getCurrentScope, onScopeDispose } from 'vue';
import { useSystemStore } from '../stores/useSystem.Store';

const trackedStores = new WeakSet<object>();

/**
 * Rastreia salvamentos das stores MaxPinia conectadas à instância ativa do Pinia.
 * Conecta o ciclo de vida dos salvamentos (sucesso/erro) ao useSystemStore.
 */
export function useMaxPiniaSaveTracker(customPinia?: Pinia): void {
    const system = useSystemStore();
    const pinia = customPinia ?? getActivePinia();

    if (!pinia) return;

    const stopWatchers: Array<() => void> = [];

    function trackStore(store: Store): void {
        if (!store || trackedStores.has(store)) return;
        trackedStores.add(store);

        // Observa save.is_success
        const stopSuccess = watch(
            () => (store as any).status?.server?.save?.is_success,
            (isSuccess, oldIsSuccess) => {
                if (isSuccess && !oldIsSuccess) system.notifySaveSuccess();
            }
        );
        stopWatchers.push(stopSuccess);

        // Observa save.is_error
        const stopError = watch(
            () => (store as any).status?.server?.save?.is_error,
            (isError, oldIsError) => {
                if (isError && !oldIsError) {
                    const errorMsg = (store as any).status?.server?.save?.error?.message;
                    system.notifySaveError(errorMsg ? { message: errorMsg } : undefined);
                }
            }
        );
        stopWatchers.push(stopError);
    }

    // 1. Rastreia stores já existentes
    if (pinia._s && typeof pinia._s.forEach === 'function') pinia._s.forEach((store) => trackStore(store));

    // 2. Intercepta novas stores criadas posteriormente via plugin
    pinia.use(({ store }) => {
        trackStore(store);
    });

    // 3. Fallback/complementar: escuta o evento global 'status-updated' disparado pelo MaxPinia
    let cleanupEventListener: (() => void) | null = null;
    if (typeof document !== 'undefined') {
        let lastServerSaveSuccess = false;
        let lastServerSaveError = false;

        const statusUpdatedHandler = (event: Event) => {
            const detail = (event as CustomEvent)?.detail;
            const saveStatus = detail?.server?.save;
            if (!saveStatus) return;

            const isSuccess = Boolean(saveStatus.is_success);
            const isError = Boolean(saveStatus.is_error);

            if (isSuccess && !lastServerSaveSuccess) system.notifySaveSuccess();
            if (isError && !lastServerSaveError) {
                const errorMsg = saveStatus.error?.message;
                system.notifySaveError(errorMsg ? { message: errorMsg } : undefined);
            }

            lastServerSaveSuccess = isSuccess;
            lastServerSaveError = isError;
        };

        document.addEventListener('status-updated', statusUpdatedHandler);
        cleanupEventListener = () => {
            document.removeEventListener('status-updated', statusUpdatedHandler);
        };
    }

    if (getCurrentScope()) onScopeDispose(() => {
        stopWatchers.forEach((stop) => stop());
        stopWatchers.length = 0;
        if (cleanupEventListener) {
            cleanupEventListener();
            cleanupEventListener = null;
        }
    });
}
