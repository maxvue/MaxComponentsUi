import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useIconStore } from '../../src/stores/useIcon.Store';

describe('useIconStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('getIcon() retorna null e marca como "waiting" para ícone novo', () => {
        const store = useIconStore();
        const result = store.getIcon('mdi:home');

        expect(result).toBeNull();
        expect(store.icons_data['mdi:home']).toBe('waiting');
    });

    it('getIcon() retorna o SVG quando ícone já está carregado', () => {
        const store = useIconStore();
        store.icons_data['mdi:check'] = '<svg>check</svg>';

        const result = store.getIcon('mdi:check');
        expect(result).toBe('<svg>check</svg>');
    });

    it('getIcon() retorna null quando ícone está em espera', () => {
        const store = useIconStore();
        store.icons_data['mdi:pending'] = 'waiting';

        const result = store.getIcon('mdi:pending');
        expect(result).toBeNull();
    });

    it('getIcon() faz trim no nome do ícone', () => {
        const store = useIconStore();
        store.icons_data['mdi:star'] = '<svg>star</svg>';

        const result = store.getIcon('  mdi:star  ');
        expect(result).toBe('<svg>star</svg>');
    });

    it('carrega cache do localStorage quando icons_data está vazio', () => {
        const dados = { 'mdi:cached': '<svg>cached</svg>' };
        localStorage.setItem('all_icons', JSON.stringify(dados));

        const store = useIconStore();
        const result = store.getIcon('mdi:cached');
        expect(result).toBe('<svg>cached</svg>');
    });

    it('list_icons_waiting_request filtra ícones em espera', () => {
        const store = useIconStore();
        store.icons_data = {
            'mdi:loaded': '<svg/>',
            'mdi:wait1': 'waiting',
            'mdi:wait2': 'waiting',
            'mdi:empty': ''
        };

        expect(store.list_icons_waiting_request).toContain('mdi:wait1');
        expect(store.list_icons_waiting_request).toContain('mdi:wait2');
        expect(store.list_icons_waiting_request).toHaveLength(2);
    });
});
