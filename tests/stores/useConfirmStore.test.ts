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
        expect(store.count_loadeds).toBe(0);
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
});
