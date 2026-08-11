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
        const dados = { 'mdi:cached': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24"/></svg>' };
        localStorage.setItem('all_icons_v2', JSON.stringify(dados));

        const store = useIconStore();
        const result = store.getIcon('mdi:cached');

        // O cache agora é re-sanitizado na leitura, então o valor não volta
        // byte-a-byte; o que importa é que o <svg> raiz e o conteúdo sobrevivam.
        expect(result).toContain('<path');
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

    it('rejeita nomes de icone em formato invalido ou malicioso', () => {
        const store = useIconStore();
        expect(store.getIcon('javascript:alert(1)')).toBeNull();
        expect(store.getIcon('../../path/traversal')).toBeNull();
        expect(store.getIcon('http://malicioso.com')).toBeNull();
        expect(store.getIcon('<script>alert(1)</script>')).toBeNull();
        expect(store.list_icons_waiting_request).toHaveLength(0);
    });
});
