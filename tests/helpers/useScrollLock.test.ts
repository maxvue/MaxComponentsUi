import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { effectScope } from 'vue';
import { useScrollLock, forceReset, getActiveLockCount } from '../../src/helpers/useScrollLock';

describe('useScrollLock Helper', () => {
    beforeEach(() => {
        forceReset();
    });

    afterEach(() => {
        forceReset();
    });

    it('aplica overflow hidden no body e adiciona classe no documentElement no lock', () => {
        const { lock, unlock } = useScrollLock();

        lock();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(true);
        expect(getActiveLockCount()).toBe(1);

        unlock();
        expect(document.body.style.overflow).toBe('');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(false);
        expect(getActiveLockCount()).toBe(0);
    });

    it('é idempotente para chamadas repetidas de lock na mesma instância', () => {
        const { lock, unlock } = useScrollLock();

        lock();
        lock();
        lock();
        expect(getActiveLockCount()).toBe(1);

        unlock();
        expect(getActiveLockCount()).toBe(0);
        expect(document.body.style.overflow).toBe('');
    });

    it('gerencia múltiplos locks de forma cumulativa', () => {
        const lock1 = useScrollLock();
        const lock2 = useScrollLock();

        lock1.lock();
        lock2.lock();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(true);
        expect(getActiveLockCount()).toBe(2);

        lock1.unlock();
        // Ainda deve estar travado porque lock2 continua ativo
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(true);
        expect(getActiveLockCount()).toBe(1);

        lock2.unlock();
        // Agora que o conjunto esvaziou, destrava
        expect(document.body.style.overflow).toBe('');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(false);
        expect(getActiveLockCount()).toBe(0);
    });

    it('auto-libera o lock no onScopeDispose caso o escopo Vue seja finalizado', () => {
        const scope = effectScope();
        let lockRef: ReturnType<typeof useScrollLock>;

        scope.run(() => {
            lockRef = useScrollLock();
            lockRef.lock();
        });

        expect(document.body.style.overflow).toBe('hidden');
        expect(getActiveLockCount()).toBe(1);

        // Desmontagem do escopo (simulando desmontagem de componente Vue)
        scope.stop();

        expect(getActiveLockCount()).toBe(0);
        expect(document.body.style.overflow).toBe('');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(false);
    });

    it('forceReset limpa todos os locks ativos e restaura o DOM', () => {
        const lock1 = useScrollLock();
        const lock2 = useScrollLock();
        lock1.lock();
        lock2.lock();
        expect(getActiveLockCount()).toBe(2);

        forceReset();

        expect(getActiveLockCount()).toBe(0);
        expect(document.body.style.overflow).toBe('');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(false);
    });
});
