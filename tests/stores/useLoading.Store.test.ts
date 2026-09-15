import { describe, it, expect, beforeEach, vi } from 'vitest';
import { effectScope } from 'vue';
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

        const internal_key = store.keys['carregando.projeto'][0];
        const item = store.targets['body'].items[internal_key];

        expect(internal_key).toBe('0000.carregando.projeto');
        expect(item.status).toBe('loading');
        expect(item.target).toBe('body');
        expect(item.message).toBe('Carregando mais informações.');
    });

    it('respeita target, message e status informados', () => {
        const store = useLoadingStore();
        store.start({ key: 'x', target: '#painel', message: 'Aguarde', status: 'waiting' });

        const item = store.targets['#painel'].items[store.keys['x'][0]];

        expect(item.target).toBe('#painel');
        expect(item.message).toBe('Aguarde');
        expect(item.status).toBe('waiting');
    });

    it('gera chaves internas sequenciais que preservam a ordem', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.start({ key: 'b' });
        store.start({ key: 'c' });

        expect(store.keys['a']?.[0]).toBe('0000.a');
        expect(store.keys['b']?.[0]).toBe('0001.b');
        expect(store.keys['c']?.[0]).toBe('0002.c');
    });

    it('cria instâncias independentes com handles distintos para chamadas concorrentes com a mesma chave lógica', () => {
        const store = useLoadingStore();
        const handle1 = store.start({ key: 'a' });
        const handle2 = store.start({ key: 'a', message: 'segunda' });

        expect(handle1).not.toBe(handle2);
        expect(Object.keys(store.targets['body'].items)).toHaveLength(2);
        expect(store.targets['body'].items[handle1].message).toBe('Carregando mais informações.');
        expect(store.targets['body'].items[handle2].message).toBe('segunda');
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
        expect(store.keys['a']?.[0]).toBeUndefined();
    });

    it('liberar a chave permite reiniciar o mesmo loading depois', () => {
        const store = useLoadingStore();
        store.start({ key: 'a' });
        store.end('a');
        store.start({ key: 'a' });

        // nova chave interna, pois a lógica foi liberada
        expect(store.keys['a']?.[0]).toBe('0001.a');
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
        expect(store.targets['body'].items[store.keys['b']?.[0]].status).toBe('loading');
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
        expect(store.pendingItems.map((i) => i.key)).toContain(store.keys['a']?.[0]);
        expect(store.pendingItems.map((i) => i.key)).toContain(store.keys['b']?.[0]);

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

    describe('R15 — F22 / E09-02: Ciclo de retry, múltiplos targets e descarte de timers', () => {
        it('executa ciclo completo start -> error -> retry -> end com a MESMA chave lógica sem prender o loading', async () => {
            vi.useFakeTimers();
            const store = useLoadingStore();
            let retryExecutionCount = 0;

            const logicalKey = 'usuario.fatura.download';

            store.start({
                key: logicalKey,
                message: 'Iniciando download da fatura...',
                retry: async () => {
                    retryExecutionCount++;
                    // A própria rotina de recuperação chama end com a mesma chave lógica
                    store.end(logicalKey);
                }
            });

            const internalKey = store.keys[logicalKey]?.[0];
            expect(internalKey).toBeDefined();
            expect(store.targets['body'].items[internalKey].status).toBe('loading');
            expect(store.isPending()).toBe(true);

            // 1. Simula falha na operação
            store.error(logicalKey, 'Falha ao conectar no gateway de pagamento');

            // A chave lógica NÃO deve ser apagada no erro para permitir resolução pública
            expect(store.keys[logicalKey]?.[0]).toBe(internalKey);
            expect(store.targets['body'].items[internalKey].status).toBe('error');
            expect(store.targets['body'].items[internalKey].message).toBe('Falha ao conectar no gateway de pagamento');
            expect(store.isPending()).toBe(false);

            // 2. Aciona retry usando a MESMA chave lógica
            await store.retry(logicalKey);

            expect(retryExecutionCount).toBe(1);
            // Durante o retry, o status é restaurado para loading e em seguida para done pelo end(logicalKey)
            expect(store.targets['body'].items[internalKey].status).toBe('done');

            // 3. Após a expiração do timer de conclusão (500ms padrão), o item é limpo e não fica preso
            await vi.advanceTimersByTimeAsync(600);

            expect(store.targets['body'].items[internalKey]).toBeUndefined();
            expect(store.keys[logicalKey]?.[0]).toBeUndefined();
            expect(store.isPending()).toBe(false);
            vi.useRealTimers();
        });

        it('permite chamada de retry diretamente pela chave lógica mesmo sem callback registrado', async () => {
            const store = useLoadingStore();
            const logicalKey = 'consulta.cep';

            store.start({ key: logicalKey, message: 'Consultando CEP...' });
            store.error(logicalKey, 'Timeout');

            const internalKey = store.keys[logicalKey]?.[0];
            expect(store.targets['body'].items[internalKey].status).toBe('error');

            // Retry restaura status para loading e preserva a chave
            await store.retry(logicalKey);

            expect(store.targets['body'].items[internalKey].status).toBe('loading');
            expect(store.targets['body'].items[internalKey].error).toBeUndefined();

            store.end(logicalKey);
            expect(store.targets['body'].items[internalKey].status).toBe('done');
        });

        it('gerencia múltiplos targets de forma isolada e segura em operações concorrentes', async () => {
            vi.useFakeTimers();
            const store = useLoadingStore();

            // Dispara itens simultâneos em 3 targets distintos
            store.start({ key: 'job.geral', target: 'body', message: 'Carga geral' });
            store.start({ key: 'job.menu', target: '#menu-lateral', message: 'Carga menu' });
            store.start({ key: 'job.painel', target: '#painel-central', message: 'Carga painel' });

            expect(store.isPending('body')).toBe(true);
            expect(store.isPending('#menu-lateral')).toBe(true);
            expect(store.isPending('#painel-central')).toBe(true);
            expect(store.isPending()).toBe(true);

            // Falha apenas no menu
            store.error('job.menu', {
                message: 'Erro na API do menu',
                retry: async () => {
                    store.end('job.menu');
                }
            });

            expect(store.isPending('body')).toBe(true);
            expect(store.isPending('#menu-lateral')).toBe(false);
            expect(store.isPending('#painel-central')).toBe(true);

            // Finaliza o body com sucesso
            store.end('job.geral');
            await vi.advanceTimersByTimeAsync(600);

            expect(store.isPending('body')).toBe(false);
            expect(store.isPending('#painel-central')).toBe(true);

            // Recupera o menu via retry pela chave lógica
            await store.retry('job.menu');
            await vi.advanceTimersByTimeAsync(600);

            expect(store.isPending('#menu-lateral')).toBe(false);
            expect(store.isPending('#painel-central')).toBe(true);

            // Finaliza o painel
            store.end('job.painel');
            await vi.advanceTimersByTimeAsync(600);

            expect(store.isPending('#painel-central')).toBe(false);
            expect(store.isPending()).toBe(false);
            vi.useRealTimers();
        });

        it('evita colisão de chaves internas caso a mesma chave lógica seja iniciada em targets diferentes', () => {
            const store = useLoadingStore();

            store.start({ key: 'recurso.sync', target: '#secao-a' });
            store.start({ key: 'recurso.sync', target: '#secao-b' });

            const itemA = Object.values(store.targets['#secao-a'].items)[0];
            const itemB = Object.values(store.targets['#secao-b'].items)[0];

            expect(itemA).toBeDefined();
            expect(itemB).toBeDefined();
            expect(itemA.key).not.toBe(itemB.key);
            expect(itemA.target).toBe('#secao-a');
            expect(itemB.target).toBe('#secao-b');
        });

        it('store.reset() cancela todos os timers pendentes e descarta alvos e chaves', async () => {
            vi.useFakeTimers();
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
            const store = useLoadingStore();

            store.start({ key: 'timer.1' });
            store.start({ key: 'timer.2' });
            store.end('timer.1', { done_duration: 10000 });
            store.end('timer.2', { done_duration: 10000 });

            expect(clearTimeoutSpy).not.toHaveBeenCalled();

            store.reset();

            // Garante que clearTimeout foi chamado para cada timer ativo
            expect(clearTimeoutSpy).toHaveBeenCalled();
            expect(store.targets).toEqual({});
            expect(store.keys).toEqual({});
            expect(store.keys_target).toEqual({});
            expect(store.items).toEqual([]);

            clearTimeoutSpy.mockRestore();
            vi.useRealTimers();
        });

        it('cancela timers pendentes no descarte de escopo do Vue (unmount / scope dispose)', async () => {
            vi.useFakeTimers();
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

            const scope = effectScope();
            let scopedStore: ReturnType<typeof useLoadingStore>;

            scope.run(() => {
                const pinia = createPinia();
                setActivePinia(pinia);
                scopedStore = useLoadingStore();
            });

            scopedStore!.start({ key: 'transiente' });
            scopedStore!.end('transiente', { done_duration: 15000 });

            // Descarta a store / escopo do Pinia (simula unmount do contexto da store)
            scopedStore!.$dispose();

            expect(clearTimeoutSpy).toHaveBeenCalled();

            clearTimeoutSpy.mockRestore();
            vi.useRealTimers();
        });

        it('start() retorna um handle opaco e individualiza instâncias concorrentes com a mesma chave', () => {
            const store = useLoadingStore();

            const handleA = store.start({ key: 'relatorio.pdf', message: 'Gerando página 1' });
            const handleB = store.start({ key: 'relatorio.pdf', message: 'Gerando página 2' });

            expect(handleA).toBeDefined();
            expect(handleB).toBeDefined();
            expect(handleA).not.toBe(handleB);

            // Cada instância é registrada com seu handle opaco individual
            expect(store.targets['body'].items[handleA]).toBeDefined();
            expect(store.targets['body'].items[handleB]).toBeDefined();
            expect(store.targets['body'].items[handleA].handle).toBe(handleA);
            expect(store.targets['body'].items[handleB].handle).toBe(handleB);
            expect(store.targets['body'].items[handleA].message).toBe('Gerando página 1');
            expect(store.targets['body'].items[handleB].message).toBe('Gerando página 2');

            // Ambas estão sob a mesma chave lógica
            expect(store.keys['relatorio.pdf']).toEqual([handleA, handleB]);
        });

        it('end(handle) encerra exatamente a instância individual disparada mantendo a concorrente ativa', async () => {
            vi.useFakeTimers();
            const store = useLoadingStore();

            const handleA = store.start({ key: 'processamento', message: 'Processo A' });
            const handleB = store.start({ key: 'processamento', message: 'Processo B' });

            expect(store.isPending()).toBe(true);
            expect(store.isPending('processamento')).toBe(true);
            expect(store.isPending(handleA)).toBe(true);
            expect(store.isPending(handleB)).toBe(true);

            // Encerra apenas o processo A pelo seu handle
            store.end(handleA);

            // Instância A foi para 'done'; instância B continua 'loading'
            expect(store.targets['body'].items[handleA].status).toBe('done');
            expect(store.targets['body'].items[handleB].status).toBe('loading');

            // O loading da chave lógica e global continua pendente porque B ainda está rodando
            expect(store.isPending(handleA)).toBe(false);
            expect(store.isPending(handleB)).toBe(true);
            expect(store.isPending('processamento')).toBe(true);
            expect(store.isPending()).toBe(true);

            // Após o tempo de auto-dismiss de A (500ms), A é descartada, mas B persiste
            await vi.advanceTimersByTimeAsync(600);
            expect(store.targets['body'].items[handleA]).toBeUndefined();
            expect(store.targets['body'].items[handleB]).toBeDefined();
            expect(store.targets['body'].items[handleB].status).toBe('loading');

            // Agora encerra B pelo seu handle
            store.end(handleB);
            expect(store.targets['body'].items[handleB].status).toBe('done');
            expect(store.isPending('processamento')).toBe(false);

            await vi.advanceTimersByTimeAsync(600);
            expect(store.targets['body'].items[handleB]).toBeUndefined();
            expect(store.isPending()).toBe(false);

            vi.useRealTimers();
        });

        it('end(chaveLogica) encerra de forma determinística todas as instâncias associadas à chave', async () => {
            vi.useFakeTimers();
            const store = useLoadingStore();

            const handle1 = store.start({ key: 'batch.export', message: 'Parte 1' });
            const handle2 = store.start({ key: 'batch.export', message: 'Parte 2' });
            const handle3 = store.start({ key: 'batch.export', message: 'Parte 3' });

            expect(store.keys['batch.export']).toHaveLength(3);

            // Encerra pela chave lógica
            store.end('batch.export');

            // Todas as 3 instâncias devem transitar para 'done'
            expect(store.targets['body'].items[handle1].status).toBe('done');
            expect(store.targets['body'].items[handle2].status).toBe('done');
            expect(store.targets['body'].items[handle3].status).toBe('done');
            expect(store.isPending('batch.export')).toBe(false);

            await vi.advanceTimersByTimeAsync(600);
            expect(store.targets['body'].items[handle1]).toBeUndefined();
            expect(store.targets['body'].items[handle2]).toBeUndefined();
            expect(store.targets['body'].items[handle3]).toBeUndefined();
            expect(store.keys['batch.export']).toBeUndefined();

            vi.useRealTimers();
        });

        it('gerencia concorrência de timers independentes com durações distintas sob a mesma chave', async () => {
            vi.useFakeTimers();
            const store = useLoadingStore();

            const handleRapido = store.start({ key: 'tarefa', done_duration: 200 });
            const handleLongo = store.start({ key: 'tarefa', done_duration: 800 });

            store.end(handleRapido);
            store.end(handleLongo);

            expect(store.targets['body'].items[handleRapido].status).toBe('done');
            expect(store.targets['body'].items[handleLongo].status).toBe('done');

            // Em 300ms, o rápido já foi descartado, mas o longo ainda permanece no DOM
            await vi.advanceTimersByTimeAsync(300);
            expect(store.targets['body'].items[handleRapido]).toBeUndefined();
            expect(store.targets['body'].items[handleLongo]).toBeDefined();
            expect(store.targets['body'].items[handleLongo].status).toBe('done');

            // Em 900ms, ambos foram descartados
            await vi.advanceTimersByTimeAsync(600);
            expect(store.targets['body'].items[handleLongo]).toBeUndefined();

            vi.useRealTimers();
        });

        it('retry(handle) opera exclusivamente sobre a instância individual e incrementa retryCount', async () => {
            const store = useLoadingStore();
            const retryA = vi.fn();
            const retryB = vi.fn();

            const handleA = store.start({ key: 'sync', retry: retryA });
            const handleB = store.start({ key: 'sync', retry: retryB });

            store.error(handleA, 'Erro no serviço A');
            store.error(handleB, 'Erro no serviço B');

            expect(store.targets['body'].items[handleA].status).toBe('error');
            expect(store.targets['body'].items[handleB].status).toBe('error');
            expect(store.targets['body'].items[handleA].retryCount).toBe(0);
            expect(store.targets['body'].items[handleB].retryCount).toBe(0);

            // Aciona retry somente para a instância A
            await store.retry(handleA);

            expect(retryA).toHaveBeenCalledTimes(1);
            expect(retryB).not.toHaveBeenCalled();

            expect(store.targets['body'].items[handleA].status).toBe('loading');
            expect(store.targets['body'].items[handleA].retryCount).toBe(1);

            // Instância B permanece inalterada em erro
            expect(store.targets['body'].items[handleB].status).toBe('error');
            expect(store.targets['body'].items[handleB].retryCount).toBe(0);

            // Segunda tentativa na instância A
            store.error(handleA, 'Falha secundária');
            await store.retry(handleA);
            expect(store.targets['body'].items[handleA].retryCount).toBe(2);
            expect(retryA).toHaveBeenCalledTimes(2);
        });

        it('dismiss(handle) descarta imediatamente a instância individual sem afetar concorrentes', () => {
            const store = useLoadingStore();

            const handle1 = store.start({ key: 'upload.multi', message: 'Arquivo 1' });
            const handle2 = store.start({ key: 'upload.multi', message: 'Arquivo 2' });

            expect(Object.keys(store.targets['body'].items)).toHaveLength(2);

            store.dismiss(handle1);

            expect(store.targets['body'].items[handle1]).toBeUndefined();
            expect(store.targets['body'].items[handle2]).toBeDefined();
            expect(store.targets['body'].items[handle2].message).toBe('Arquivo 2');
            expect(store.keys['upload.multi']).toEqual([handle2]);
        });

        it('não vaza estado após ciclos de execução concorrente', async () => {
            vi.useFakeTimers();
            const store = useLoadingStore();

            const handles: string[] = [];
            for (let i = 0; i < 5; i++) handles.push(store.start({ key: 'stress.key' }));


            expect(Object.keys(store.targets['body'].items)).toHaveLength(5);

            for (const h of handles) store.end(h);


            await vi.advanceTimersByTimeAsync(600);

            expect(store.targets['body'].items).toEqual({});
            expect(store.keys['stress.key']).toBeUndefined();
            expect(store.keys_target).toEqual({});
            expect(store.items).toEqual([]);
            expect(store.isPending()).toBe(false);

            vi.useRealTimers();
        });
    });
});
