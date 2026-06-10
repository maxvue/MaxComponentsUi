import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePopoverStore } from '../../src/stores/usePopover.Store';

describe('usePopoverStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('inicia com show_id nulo', () => {
        const store = usePopoverStore();
        expect(store.show_id).toBeNull();
    });

    it('show() define o show_id', () => {
        const store = usePopoverStore();
        store.show('popover-1');
        expect(store.show_id).toBe('popover-1');
    });

    it('hide() reseta show_id para null', () => {
        const store = usePopoverStore();
        store.show('popover-1');
        store.hide();
        expect(store.show_id).toBeNull();
    });

    it('toggle() abre quando show_id é null', () => {
        const store = usePopoverStore();
        store.toggle('popover-1');
        expect(store.show_id).toBe('popover-1');
    });

    it('toggle() fecha quando show_id é o mesmo ID', () => {
        const store = usePopoverStore();
        store.show('popover-1');
        store.toggle('popover-1');
        expect(store.show_id).toBeNull();
    });

    it('toggle() troca para outro ID quando show_id é diferente', () => {
        const store = usePopoverStore();
        store.show('popover-1');
        store.toggle('popover-2');
        expect(store.show_id).toBe('popover-2');
    });
});
