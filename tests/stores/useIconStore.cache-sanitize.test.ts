// @vitest-environment jsdom
//
// Pinado em jsdom pelo mesmo motivo de tests/helpers/sanitizeSvg.test.ts: sob happy-dom
// o DOMPurify é um no-op, então um teste de sanitização rodando lá passaria mesmo que
// a sanitização do cache não existisse. Veja o relatório da Etapa 5 (Fix round 1).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useIconStore } from '../../src/stores/useIcon.Store';
import { watch } from 'vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        watchDebounced: vi.fn((source, cb) => {
            watch(source, cb, { deep: true, flush: 'sync' });
        })
    };
});

const CACHE_KEY = 'all_icons_v2';

describe('useIconStore — sanitização do cache do localStorage', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.stubGlobal('fetch', vi.fn().mockReturnValue(Promise.resolve({
            json: () => Promise.resolve({})
        })));
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sanitiza SVG malicioso gravado diretamente no cache por outro script do mesmo origin', () => {
        // Simula um atacante com execução de script no mesmo origin gravando JSON
        // válido, porém com markup malicioso, na chave de cache.
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            'icon-evil': '<svg onload="alert(1)"><script>alert(2)</script><path d="M0 0"/></svg>',
            'icon-link': '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>'
        }));

        const store = useIconStore();
        store.getIcon('icon-evil');

        const evil = store.icons_data['icon-evil'] ?? '';
        expect(evil).not.toContain('<script');
        expect(evil).not.toMatch(/\son\w+\s*=/i);
        expect(evil).not.toContain('alert');

        const link = store.icons_data['icon-link'] ?? '';
        expect(link).not.toContain('javascript:');
    });

    it('preserva SVG legítimo vindo do cache, incluindo o elemento <svg> raiz', () => {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            'icon-ok': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24"/></svg>'
        }));

        const store = useIconStore();
        const res = store.getIcon('icon-ok');

        expect(res).toContain('<svg');
        expect(res).toContain('<path');
    });

    it('preserva o sentinela \'waiting\' sem passá-lo pelo sanitizador', () => {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            'icon-pending': 'waiting',
            'icon-empty': ''
        }));

        const store = useIconStore();
        store.getIcon('icon-other');

        // 'waiting' não é markup: sanitizá-lo devolveria '' e apagaria o estado
        // de "buscando", fazendo o ícone nunca mais ser requisitado.
        expect(store.icons_data['icon-pending']).toBe('waiting');
        expect(store.icons_data['icon-empty']).toBe('');
    });

    it('descarta cache que não é um objeto sem lançar exceção', () => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(['nao', 'é', 'objeto']));

        const store = useIconStore();
        expect(() => store.getIcon('icon-a')).not.toThrow();
        expect(store.icons_data['icon-a']).toBe('waiting');
        expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    });
});
