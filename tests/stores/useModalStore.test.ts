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
});
