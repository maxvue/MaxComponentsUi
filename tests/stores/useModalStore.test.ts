import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useModalStore } from '../../src/stores/useModal.Store';

describe('useModalStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('inicia com show_id nulo', () => {
        const store = useModalStore();
        expect(store.show_id).toBeNull();
    });

    it('show() define o show_id', () => {
        const store = useModalStore();
        store.show('modal-1');
        expect(store.show_id).toBe('modal-1');
    });

    it('hide() reseta show_id para null', () => {
        const store = useModalStore();
        store.show('modal-1');
        store.hide();
        expect(store.show_id).toBeNull();
    });

    it('toggle() abre quando show_id é null', () => {
        const store = useModalStore();
        store.toggle('modal-1');
        expect(store.show_id).toBe('modal-1');
    });

    it('toggle() fecha quando show_id é o mesmo ID', () => {
        const store = useModalStore();
        store.show('modal-1');
        store.toggle('modal-1');
        expect(store.show_id).toBeNull();
    });

    it('toggle() troca para outro ID quando show_id é diferente', () => {
        const store = useModalStore();
        store.show('modal-1');
        store.toggle('modal-2');
        expect(store.show_id).toBe('modal-2');
    });

    it('gerencia pilha com múltiplos IDs via push e pop', () => {
        const store = useModalStore();
        store.push('modal-1');
        store.push('modal-2');
        store.push('modal-3');

        expect(store.stack).toEqual(['modal-1', 'modal-2', 'modal-3']);
        expect(store.show_id).toBe('modal-3');
        expect(store.isOpen('modal-1')).toBe(true);
        expect(store.isOpen('modal-2')).toBe(true);
        expect(store.isOpen('modal-3')).toBe(true);
        expect(store.isTop('modal-3')).toBe(true);
        expect(store.isTop('modal-2')).toBe(false);
        expect(store.getIndex('modal-2')).toBe(1);

        store.pop();
        expect(store.stack).toEqual(['modal-1', 'modal-2']);
        expect(store.show_id).toBe('modal-2');
        expect(store.isTop('modal-2')).toBe(true);
    });

    it('remove modal específico no meio da pilha via pop(id)', () => {
        const store = useModalStore();
        store.push('modal-1');
        store.push('modal-2');
        store.push('modal-3');

        store.pop('modal-2');
        expect(store.stack).toEqual(['modal-1', 'modal-3']);
        expect(store.show_id).toBe('modal-3');
        expect(store.isOpen('modal-2')).toBe(false);
    });

    it('permite atribuição em show_id mantendo compatibilidade', () => {
        const store = useModalStore();
        store.show_id = 'modal-a';
        expect(store.stack).toEqual(['modal-a']);
        expect(store.show_id).toBe('modal-a');

        store.show_id = null;
        expect(store.stack).toEqual([]);
        expect(store.show_id).toBeNull();
    });
});
