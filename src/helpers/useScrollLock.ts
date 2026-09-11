import { getCurrentScope, onScopeDispose } from 'vue';

export interface ScrollLock {
    lock: () => void;
    unlock: () => void;
}

/**
 * Conjunto de tokens proprietários de lock de scroll compartilhado entre TODAS as instâncias.
 * Operar com Set previne que a mesma instância incremente contadores duplicados
 * e permite rastrear posse individual com auto-limpeza em onScopeDispose.
 */
const activeLockOwners = new Set<symbol | object | string>();

/** Valor de `overflow` salvo antes do primeiro lock, para restaurar. */
let previous_overflow = '';

/**
 * Força a liberação de todos os locks de scroll e restaura o overflow do body.
 * Útil para tear-down de testes e recuperação emergencial.
 */
export const forceReset = (): void => {
    activeLockOwners.clear();
    if (typeof document !== 'undefined') {
        document.body.style.overflow = previous_overflow || '';
        document.documentElement.classList.remove('max-scroll-locked');
    }
    previous_overflow = '';
};

/**
 * Retorna a contagem atual de locks ativos (útil para inspeção e testes).
 */
export const getActiveLockCount = (): number => activeLockOwners.size;

/**
 * Trava o scroll do `body` de forma cumulativa e resiliente:
 * Cada lock é associado a um token único ou ao `owner` fornecido.
 * Múltiplas chamadas a `lock()` na mesma instância são idempotentes.
 * Se executado dentro de um efeito/escopo Vue ativo, registra `onScopeDispose`
 * para garantir destravamento mesmo se o componente for desmontado sem chamar `unlock()`.
 */
export const useScrollLock = (owner?: object | string | symbol): ScrollLock => {
    const instanceToken = owner ?? Symbol('scroll-lock-instance');
    let isInstanceLocked = false;

    const lock = () => {
        if (typeof document === 'undefined') return;
        if (isInstanceLocked) return;
        if (activeLockOwners.size === 0) {
            previous_overflow = document.body.style.overflow;
            document.documentElement.classList.add('max-scroll-locked');
        }
        activeLockOwners.add(instanceToken);
        isInstanceLocked = true;
        document.body.style.overflow = 'hidden';
    };

    const unlock = () => {
        if (typeof document === 'undefined' || !isInstanceLocked) return;
        activeLockOwners.delete(instanceToken);
        isInstanceLocked = false;
        if (activeLockOwners.size === 0) {
            document.body.style.overflow = previous_overflow;
            document.documentElement.classList.remove('max-scroll-locked');
            previous_overflow = '';
        }
    };

    if (getCurrentScope()) onScopeDispose(() => {
        if (isInstanceLocked) unlock();
    });


    return { lock, unlock };
};
