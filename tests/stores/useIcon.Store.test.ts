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
        localStorage.setItem('all_icons_v2', JSON.stringify({ 'icon-a': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24"/></svg>' }));
        const store = useIconStore();
        const res = store.getIcon('icon-a');

        // O cache agora é re-sanitizado na leitura, então o valor não volta
        // byte-a-byte; o que importa é que o conteúdo do ícone sobreviva.
        expect(res).toContain('<path');
        expect(store.icons_data['icon-a']).toContain('<path');
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

        resolveJson({ 'icon-c': '<svg><path d="M0 0"/></svg>' });

        // Wait for fetch promises to resolve
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(store.icons_data['icon-c']).toContain('<path');
        expect(localStorage.getItem('all_icons_v2')).toContain('<path');
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

    it('nao deve lancar excecao e deve tratar como cache vazio quando o localStorage esta corrompido', () => {
        localStorage.setItem('all_icons_v2', 'isto não é json válido{{{');

        const store = useIconStore();

        expect(() => store.getIcon('icon-corrupted')).not.toThrow();

        const res = store.getIcon('icon-corrupted');
        expect(res).toBeNull();
        expect(store.icons_data['icon-corrupted']).toBe('waiting');
        // Storage corrompido deve ser descartado
        expect(localStorage.getItem('all_icons_v2')).toBeNull();
    });

    it('sanitiza SVG malicioso vindo do fetch antes de gravar em icons_data e no cache persistido', async () => {
        const store = useIconStore();

        let resolveJson: any;
        vi.spyOn(globalThis, 'fetch').mockReturnValue(Promise.resolve({
            json: () => new Promise((resolve) => { resolveJson = resolve; })
        } as any));

        store.getIcon('icon-malicious');

        await new Promise((r) => setTimeout(r, 250)); // wait for debounce

        resolveJson({ 'icon-malicious': '<svg onload="alert(1)"><script>alert(2)</script><path d="M0 0"/></svg>' });

        await new Promise((resolve) => setTimeout(resolve, 50));

        const stored = store.icons_data['icon-malicious'];
        expect(stored).not.toContain('<script');
        expect(stored).not.toMatch(/\son\w+\s*=/i);

        const persisted = localStorage.getItem('all_icons_v2') ?? '';
        expect(persisted).not.toContain('<script');
        expect(persisted).not.toMatch(/\son\w+\s*=/i);
    });

    it('reseta o contador de falhas de fetch apos o intervalo de backoff, permitindo novas requisicoes', async () => {
        vi.useFakeTimers();

        const store = useIconStore();

        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Esgota as tentativas ate atingir MAX_FETCH_RETRIES (4)
        for (let i = 0; i < 4; i++) {
            store.getIcon(`icon-retry-${i}`);
            await vi.advanceTimersByTimeAsync(250); // debounce
            await vi.advanceTimersByTimeAsync(50); // flush da promise rejeitada
        }

        expect(store.icons_data['fetch' as any]).toBeUndefined(); // errors nao fica em icons_data
        // Depois de 4 falhas, novas requisicoes nao devem disparar fetch (contador travado)
        const fetchCallsBeforeReset = (globalThis.fetch as any).mock.calls.length;
        store.getIcon('icon-blocked');
        await vi.advanceTimersByTimeAsync(250);
        expect((globalThis.fetch as any).mock.calls.length).toBe(fetchCallsBeforeReset);

        // A partir daqui, o fetch passa a ter sucesso para qualquer icone pendente
        // (inclui 'icon-blocked', que continua na fila de waiting_request)
        vi.spyOn(globalThis, 'fetch').mockReturnValue(Promise.resolve({
            json: () => Promise.resolve({ 'icon-blocked': '<svg><path d="M0 0"/></svg>', 'icon-after-reset': '<svg><path d="M0 0"/></svg>' })
        } as any));

        // Avanca o backoff (30s) para que o contador de erros seja resetado
        await vi.advanceTimersByTimeAsync(30000);
        await vi.advanceTimersByTimeAsync(250); // deixa o watcher assentar apos o reset do errors.fetch
        await vi.advanceTimersByTimeAsync(50);

        // Novo icone pedido depois do reset deve conseguir disparar fetch novamente
        store.getIcon('icon-after-reset');
        await vi.advanceTimersByTimeAsync(250);
        await vi.advanceTimersByTimeAsync(50);

        expect(store.icons_data['icon-after-reset']).toContain('<path');

        consoleSpy.mockRestore();
        vi.useRealTimers();
    });
});
