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

describe('useIconStore', () => {
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

    it('deve inicializar com dados vazios', () => {
        const store = useIconStore();
        expect(store.icons_data).toEqual({});
        expect(store.list_icons_waiting_request).toEqual([]);
    });

    it('deve carregar do cache ao buscar o primeiro icone', () => {
        localStorage.setItem('all_icons', JSON.stringify({ 'icon-a': 'svg-a' }));
        const store = useIconStore();
        const res = store.getIcon('icon-a');
        expect(res).toBe('svg-a');
        expect(store.icons_data['icon-a']).toBe('svg-a');
    });

    it('getIcon nao deve colocar em waiting se o icone ja existir', () => {
        const store = useIconStore();
        store.icons_data['icon-x'] = 'svg-x';
        const res = store.getIcon('icon-x');
        expect(res).toBe('svg-x');
        expect(store.list_icons_waiting_request).not.toContain('icon-x');
    });

    it('getIcon deve colocar em waiting e retornar null se nao tiver no cache', () => {
        const store = useIconStore();
        const res = store.getIcon('icon-b');
        expect(res).toBeNull();
        expect(store.icons_data['icon-b']).toBe('waiting');
        expect(store.list_icons_waiting_request).toContain('icon-b');
    });

    it('deve acionar o fetch quando novos icones sao requisitados', async () => {
        const store = useIconStore();

        let resolveJson: any;
        const mockFetch = vi.spyOn(globalThis, 'fetch').mockReturnValue(Promise.resolve({
            json: () => new Promise((resolve) => { resolveJson = resolve; })
        } as any));

        store.getIcon('icon-c');

        await new Promise((r) => setTimeout(r, 250)); // wait for debounce

        expect(mockFetch).toHaveBeenCalled();
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('icons%5B%5D=icon-c');

        resolveJson({ 'icon-c': 'svg-c' });

        // Wait for fetch promises to resolve
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(store.icons_data['icon-c']).toBe('svg-c');
        expect(localStorage.getItem('all_icons')).toBe(JSON.stringify({ 'icon-c': 'svg-c' }));
    });

    it('deve lidar com erros no fetch', async () => {
        const store = useIconStore();

        const mockFetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        store.getIcon('icon-d');

        await new Promise((r) => setTimeout(r, 250)); // wait for debounce

        expect(mockFetch).toHaveBeenCalled();

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleSpy).toHaveBeenCalled();
        expect(store.icons_data['icon-d']).toBe('waiting');

        consoleSpy.mockRestore();
    });

    it('deve lidar com a ausencia do icone no retorno do fetch', async () => {
        const store = useIconStore();

        let resolveJson: any;
        const _mockFetch = vi.spyOn(globalThis, 'fetch').mockReturnValue(Promise.resolve({
            json: () => new Promise((resolve) => { resolveJson = resolve; })
        } as any));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});

        store.getIcon('icon-e');

        await new Promise((r) => setTimeout(r, 250)); // wait for debounce

        // Resolve com json vazio (icone faltante)
        if (resolveJson) resolveJson({});

        await new Promise((resolve) => setTimeout(resolve, 50));

        // Ainda em waiting pois erro < 4
        expect(store.icons_data['icon-e']).toBe('waiting');
        expect(consoleSpy).toHaveBeenCalledWith('Erro na obtenção do ícone', 'icon-e');

        // Simular tentativas ate estourar o limite de retries no caso de icone indisponivel
        // O watcher eh engatilhado novamente quando errors.value[icon_name] eh modificado
        for (let i = 0; i < 4; i++) {
            delete store.icons_data['icon-e']; // Remove to change list
            store.getIcon('icon-e'); // Re-adds and triggers computed change
            await new Promise((r) => setTimeout(r, 250)); // wait for debounce

            vi.spyOn(globalThis, 'fetch').mockReturnValue(Promise.resolve({
                json: () => Promise.resolve({})
            } as any));
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        expect(store.icons_data['icon-e']).toBe('');

        consoleSpy.mockRestore();
        traceSpy.mockRestore();
    });
});
