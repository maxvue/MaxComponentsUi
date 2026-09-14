import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLoadingStore } from '../../src/stores/useLoading.Store';

describe('useLoadingStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('inicia vazia', () => {
        const store = useLoadingStore();
        expect(store.targets).toEqual({});
        expect(store.keys).toEqual({});
    });

    it('registra um item com os valores padrão', () => {
        const store = useLoadingStore();
        store.start({ key: 'carregando.projeto' });

        const internal_key = store.keys['carregando.projeto'];
        const item = store.targets['body'].items[internal_key];

        expect(internal_key).toBe('0000.carregando.projeto');
        expect(item.status).toBe('loading');
        expect(item.target).toBe('body');
        expect(item.message).toBe('Carregando mais informações.');
    });

    it('respeita target, message e status informados', () => {
        const store = useLoadingStore();
        store.start({ key: 'x', target: '#painel', message: 'Aguarde', status: 'waiting' });

        const item = store.targets['#painel'].items[store.keys['x']];

        expect(item.target).toBe('#painel');
        expect(item.message).toBe('Aguarde');
        expect(item.status).toBe('waiting');
    });

    it('gera chaves internas sequenciais que preservam a ordem', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.start({ key: 'b' });
        store.start({ key: 'c' });

        expect(store.keys['a']).toBe('0000.a');
        expect(store.keys['b']).toBe('0001.b');
        expect(store.keys['c']).toBe('0002.c');
    });

    it('reusa a mesma chave interna para a mesma chave lógica', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.start({ key: 'a', message: 'segunda' });

        expect(Object.keys(store.targets['body'].items)).toHaveLength(1);
        expect(store.targets['body'].items['0000.a'].message).toBe('segunda');
    });

    it('agrupa itens por target', () => {
        const store = useLoadingStore();
        store.start({ key: 'a', target: 'body' });
        store.start({ key: 'b', target: '#lateral' });

        expect(Object.keys(store.targets)).toEqual(['body', '#lateral']);
    });

    it('atualiza um item existente', () => {
        const store = useLoadingStore();
        store.start({ key: 'a', message: 'inicial' });
        store.update({ key: 'a', message: 'atualizada' });

        expect(store.targets['body'].items['0000.a'].message).toBe('atualizada');
    });

    it('não quebra ao atualizar uma chave desconhecida', () => {
        const store = useLoadingStore();
        expect(() => store.update({ key: 'inexistente' })).not.toThrow();
    });

    it('end marca o item como done e libera a chave lógica', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.end('a');

        expect(store.targets['body'].items['0000.a'].status).toBe('done');
        expect(store.keys['a']).toBeUndefined();
    });

    it('liberar a chave permite reiniciar o mesmo loading depois', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.end('a');
        store.start({ key: 'a' });

        // nova chave interna, pois a lógica foi liberada
        expect(store.keys['a']).toBe('0001.a');
        expect(store.targets['body'].items['0001.a'].status).toBe('loading');
    });

    it('error marca o item como error', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.error('a');

        expect(store.targets['body'].items['0000.a'].status).toBe('error');
    });

    it('stop é alias de end', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.stop('a');

        expect(store.targets['body'].items['0000.a'].status).toBe('done');
    });

    it('não quebra ao encerrar uma chave desconhecida', () => {
        const store = useLoadingStore();
        expect(() => store.end('inexistente')).not.toThrow();
        expect(() => store.error('inexistente')).not.toThrow();
    });

    it('limpa o target quando nenhum item continua pendente', async () => {
        vi.useFakeTimers();
        const store = useLoadingStore();

        store.start({ key: 'a' });
        store.end('a');

        await vi.advanceTimersByTimeAsync(600);

        expect(store.targets['body'].items).toEqual({});
        vi.useRealTimers();
    });

    it('mantém o target enquanto houver item carregando e limpa item finalizado de forma independente', async () => {
        vi.useFakeTimers();
        const store = useLoadingStore();

        store.start({ key: 'a' });
        store.start({ key: 'b' });
        store.end('a');

        // Imediatamente após end('a'), o item 'a' está 'done' e 'b' está 'loading'
        expect(Object.keys(store.targets['body'].items)).toHaveLength(2);

        // Após a duração terminal de 'a' (500ms), 'a' é limpo de forma independente, mantendo 'b' ativo
        await vi.advanceTimersByTimeAsync(600);

        expect(Object.keys(store.targets['body'].items)).toHaveLength(1);
        expect(store.targets['body'].items[store.keys['b']].status).toBe('loading');
        vi.useRealTimers();
    });

    it('erro persiste indefinidamente até dismiss() explícito', async () => {
        vi.useFakeTimers();
        const store = useLoadingStore();

        store.start({ key: 'err' });
        store.error('err', 'Falha crítica');

        // Avança tempo arbitrário
        await vi.advanceTimersByTimeAsync(5000);

        const internal_key = Object.keys(store.targets['body'].items)[0];
        expect(store.targets['body'].items[internal_key].status).toBe('error');
        expect(store.targets['body'].items[internal_key].message).toBe('Falha crítica');

        // Descarte explícito
        store.dismiss(internal_key);
        expect(store.targets['body'].items).toEqual({});
        vi.useRealTimers();
    });

    it('permite reexecução via retry()', async () => {
        const retryFn = vi.fn();
        const store = useLoadingStore();

        store.start({ key: 'req', retry: retryFn });
        store.error('req');

        const internal_key = Object.keys(store.targets['body'].items)[0];
        await store.retry(internal_key);

        expect(retryFn).toHaveBeenCalledTimes(1);
        expect(store.targets['body'].items[internal_key].status).toBe('loading');
    });

    it('não acumula chaves em keys_target ao finalizar loadings com end()', async () => {
        vi.useFakeTimers();
        const store = useLoadingStore();

        for (let i = 0; i < 10; i++) {
            const key = `temp_key_${i}`;
            store.start({ key });
            store.end(key);
        }

        await vi.advanceTimersByTimeAsync(600);

        expect(Object.keys(store.keys_target)).toHaveLength(0);
        vi.useRealTimers();
    });

    it('dismiss() sem parâmetros limpa todas as filas e timers de todos os targets', () => {
        const store = useLoadingStore();
        store.start({ key: 'a', target: 'body' });
        store.start({ key: 'b', target: '#painel' });

        expect(Object.keys(store.targets)).toHaveLength(2);
        expect(store.items).toHaveLength(2);

        store.dismiss();

        expect(store.targets).toEqual({});
        expect(store.items).toHaveLength(0);
        expect(store.keys).toEqual({});
        expect(store.keys_target).toEqual({});
    });

    it('diferencia itens pendentes de itens terminais via pendingItems e terminalItems', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.start({ key: 'b', status: 'waiting' });
        store.start({ key: 'c' });
        store.end('c');
        store.start({ key: 'd' });
        store.error('d', 'Erro teste');

        expect(store.pendingItems).toHaveLength(2);
        expect(store.pendingItems.map((i) => i.key)).toContain(store.keys['a']);
        expect(store.pendingItems.map((i) => i.key)).toContain(store.keys['b']);

        expect(store.terminalItems).toHaveLength(2);
        expect(store.terminalItems.some((i) => i.status === 'done')).toBe(true);
        expect(store.terminalItems.some((i) => i.status === 'error')).toBe(true);
    });

    it('isPending indica se há itens pendentes globalmente ou por target específico', () => {
        const store = useLoadingStore();
        expect(store.isPending()).toBe(false);

        store.start({ key: 'a', target: '#painel' });
        expect(store.isPending()).toBe(true);
        expect(store.isPending('#painel')).toBe(true);
        expect(store.isPending('body')).toBe(false);

        store.end('a');
        expect(store.isPending('#painel')).toBe(false);
        expect(store.isPending()).toBe(false);
    });

    it('error aceita objeto com mensagem, metadados de erro e callback de retry', async () => {
        const store = useLoadingStore();
        const customRetry = vi.fn();
        const customError = new Error('Falha de conexão');

        store.start({ key: 'sync' });
        store.error('sync', {
            message: 'Erro ao sincronizar',
            error: customError,
            retry: customRetry
        });

        const internal_key = Object.keys(store.targets['body'].items)[0];
        const item = store.targets['body'].items[internal_key];

        expect(item.status).toBe('error');
        expect(item.message).toBe('Erro ao sincronizar');
        expect(item.error).toBe(customError);

        await store.retry(internal_key);
        expect(customRetry).toHaveBeenCalledTimes(1);
    });

    it('end aceita duração de done configurável por chamada', async () => {
        vi.useFakeTimers();
        const store = useLoadingStore();

        store.start({ key: 'custom_done' });
        store.end('custom_done', { done_duration: 1200 });

        const internal_key = Object.keys(store.targets['body'].items)[0];
        expect(store.targets['body'].items[internal_key].status).toBe('done');

        await vi.advanceTimersByTimeAsync(800);
        expect(store.targets['body'].items[internal_key]).toBeDefined();

        await vi.advanceTimersByTimeAsync(500);
        expect(store.targets['body']?.items[internal_key]).toBeUndefined();

        vi.useRealTimers();
    });
});
