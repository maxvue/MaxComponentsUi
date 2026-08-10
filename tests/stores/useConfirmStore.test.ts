import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';

describe('useConfirmStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('inicia com valores padrão', () => {
        const store = useConfirmStore();
        expect(store.message).toBe('Deseja continuar?');
        expect(store.messageIcon).toBeNull();
        expect(store.show).toBe(false);
        expect(store.x).toBe(0);
        expect(store.y).toBe(0);
        expect(store.width).toBe(0);
        expect(store.height).toBe(0);
    });

    it('inicia com acceptProps padrão', () => {
        const store = useConfirmStore();
        expect(store.acceptProps.label).toBe('Sim');
        expect(store.acceptProps.icon).toBeUndefined();
        expect(typeof store.acceptProps.action).toBe('function');
    });

    it('inicia com rejectProps padrão', () => {
        const store = useConfirmStore();
        expect(store.rejectProps.label).toBe('Não');
        expect(store.rejectProps.icon).toBeUndefined();
        expect(typeof store.rejectProps.action).toBe('function');
    });

    it('hide() define show como false', () => {
        const store = useConfirmStore();
        store.show = true;
        store.hide();
        expect(store.show).toBe(false);
    });

    it('permite atualizar message', () => {
        const store = useConfirmStore();
        store.message = 'Tem certeza que deseja excluir?';
        expect(store.message).toBe('Tem certeza que deseja excluir?');
    });

    it('permite atualizar coordenadas de posicionamento', () => {
        const store = useConfirmStore();
        store.x = 100;
        store.y = 200;
        store.width = 300;
        store.height = 50;
        expect(store.x).toBe(100);
        expect(store.y).toBe(200);
        expect(store.width).toBe(300);
        expect(store.height).toBe(50);
    });

    it('permite atualizar acceptProps com ação customizada', () => {
        const store = useConfirmStore();
        let chamada = false;
        store.acceptProps = {
            label: 'Confirmar',
            icon: 'mdi:check',
            action: () => { chamada = true; }
        };
        store.acceptProps.action();
        expect(chamada).toBe(true);
        expect(store.acceptProps.label).toBe('Confirmar');
        expect(store.acceptProps.icon).toBe('mdi:check');
    });

    describe('confirm()', () => {
        it('abre sempre com show = true, mesmo chamado repetidamente (nunca faz toggle)', () => {
            const store = useConfirmStore();
            store.confirm({
                message: 'A?',
                rejectProps: { label: 'Não', action: () => {} },
                acceptProps: { label: 'Sim', action: () => {} },
                x: 1, y: 2, width: 3, height: 4
            });
            expect(store.show).toBe(true);

            // Chamar de novo (ex.: outro alvo clicado com o confirm já aberto)
            // deve MANTER show=true (reabrir no novo alvo), nunca fechar.
            store.confirm({
                message: 'B?',
                rejectProps: { label: 'Não', action: () => {} },
                acceptProps: { label: 'Sim', action: () => {} },
                x: 10, y: 20, width: 30, height: 40
            });
            expect(store.show).toBe(true);
            expect(store.message).toBe('B?');
            expect(store.x).toBe(10);
        });

        it('reseta messageIcon para null quando o payload não o informa (evita vazamento entre instâncias)', () => {
            const store = useConfirmStore();
            store.confirm({
                message: 'Com ícone',
                messageIcon: 'mdi:alert',
                rejectProps: { label: 'Não', action: () => {} },
                acceptProps: { label: 'Sim', action: () => {} },
                x: 0, y: 0, width: 0, height: 0
            });
            expect(store.messageIcon).toBe('mdi:alert');

            store.confirm({
                message: 'Sem ícone',
                rejectProps: { label: 'Não', action: () => {} },
                acceptProps: { label: 'Sim', action: () => {} },
                x: 0, y: 0, width: 0, height: 0
            });
            expect(store.messageIcon).toBeNull();
        });
    });
});
