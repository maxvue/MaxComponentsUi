import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useScrollLock } from '../../src/helpers/useScrollLock';

describe('useScrollLock Helper', () => {
    beforeEach(() => {
        document.body.style.overflow = '';
        document.documentElement.classList.remove('max-scroll-locked');
    });

    afterEach(() => {
        document.body.style.overflow = '';
        document.documentElement.classList.remove('max-scroll-locked');
    });

    it('aplica overflow hidden no body e adiciona classe no documentElement no lock', () => {
        const { lock, unlock } = useScrollLock();

        lock();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(true);

        unlock();
        expect(document.body.style.overflow).toBe('');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(false);
    });

    it('gerencia múltiplos locks de forma cumulativa', () => {
        const lock1 = useScrollLock();
        const lock2 = useScrollLock();

        lock1.lock();
        lock2.lock();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(true);

        lock1.unlock();
        // Ainda deve estar travado porque lock2 continua ativo
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(true);

        lock2.unlock();
        // Agora que o contador zerou, destrava
        expect(document.body.style.overflow).toBe('');
        expect(document.documentElement.classList.contains('max-scroll-locked')).toBe(false);
    });
});
