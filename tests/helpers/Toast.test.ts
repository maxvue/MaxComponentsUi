import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { Toast } from '../../src/helpers/Toast';
import { useToastStore } from '../../src/stores/useToast.Store';

describe('Toast helper', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('add() adiciona toast e retorna ID', () => {
        const id = Toast.add({ title: 'Salvo!', severity: 'success' });
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);

        const store = useToastStore();
        expect(store.items).toHaveLength(1);
        expect(store.items[0].title).toBe('Salvo!');
    });

    it('show() é alias de add()', () => {
        const id = Toast.show({ title: 'Info', severity: 'info' });
        const store = useToastStore();
        expect(store.items).toHaveLength(1);
        expect(store.items[0].id).toBe(id);
    });

    it('hide() remove toast pelo ID', () => {
        const id = Toast.add({ title: 'Temp', severity: 'info' });
        const store = useToastStore();
        expect(store.items).toHaveLength(1);

        Toast.hide(id);
        expect(store.items).toHaveLength(0);
    });

    it('delete() é alias de hide()', () => {
        const id = Toast.add({ title: 'Temp2', severity: 'warning' });
        const store = useToastStore();

        Toast.delete(id);
        expect(store.items).toHaveLength(0);
    });

    it('clear() remove todos os toasts', () => {
        Toast.add({ title: 'A', severity: 'success' });
        Toast.add({ title: 'B', severity: 'info' });
        Toast.add({ title: 'C', severity: 'error' });

        const store = useToastStore();
        expect(store.items).toHaveLength(3);

        Toast.clear();
        expect(store.items).toHaveLength(0);
    });
});
