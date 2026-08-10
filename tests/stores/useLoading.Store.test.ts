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

    it('mantém o target enquanto houver item carregando', async () => {
        vi.useFakeTimers();
        const store = useLoadingStore();

        store.start({ key: 'a' });
        store.start({ key: 'b' });
        store.end('a');

        await vi.advanceTimersByTimeAsync(600);

        expect(Object.keys(store.targets['body'].items)).toHaveLength(2);
        vi.useRealTimers();
    });
});
