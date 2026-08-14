import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    clearMaxCache,
    isMaxCacheKey,
    registerMaxCacheKey,
    resetMaxCacheKeys,
    ICON_CACHE_KEY
} from '../../src/helpers/maxCacheKeys';
import { configureMaxApp, resetMaxAppConfig, getMaxAppConfig } from '../../src/helpers/maxAppConfig';

describe('maxCacheKeys', () => {
    beforeEach(() => {
        resetMaxCacheKeys();
        resetMaxAppConfig();
        localStorage.clear();
    });

    describe('isMaxCacheKey', () => {
        it('reconhece as chaves exatas da biblioteca', () => {
            expect(isMaxCacheKey(ICON_CACHE_KEY)).toBe(true);
        });

        it('reconhece os prefixos dinâmicos da biblioteca', () => {
            expect(isMaxCacheKey('split_panel')).toBe(true);
            expect(isMaxCacheKey('split_panel_chatpage_hidded')).toBe(true);
            expect(isMaxCacheKey('max-tab-opened-')).toBe(true);
            expect(isMaxCacheKey('max-tab-opened-relatorios')).toBe(true);
        });

        it('reconhece a chave da rota de menus configurada', () => {
            expect(isMaxCacheKey(getMaxAppConfig().routeMenus as string)).toBe(true);

            configureMaxApp({ routeMenus: 'app.menus' });

            expect(isMaxCacheKey('app.menus')).toBe(true);
        });

        it('não reconhece chaves da aplicação hospedeira', () => {
            expect(isMaxCacheKey('token_da_app')).toBe(false);
            expect(isMaxCacheKey('preferencias')).toBe(false);
        });

        it('ignora valores vazios ou não string', () => {
            expect(isMaxCacheKey('')).toBe(false);
            expect(isMaxCacheKey(null as any)).toBe(false);
            expect(isMaxCacheKey(123 as any)).toBe(false);
        });
    });

    describe('registerMaxCacheKey', () => {
        it('inclui uma chave exata da aplicação e desfaz o registro', () => {
            const unregister = registerMaxCacheKey('meu_rascunho');

            expect(isMaxCacheKey('meu_rascunho')).toBe(true);

            unregister();

            expect(isMaxCacheKey('meu_rascunho')).toBe(false);
        });

        it('inclui um prefixo da aplicação e desfaz o registro', () => {
            const unregister = registerMaxCacheKey('meu_app_', { prefix: true });

            expect(isMaxCacheKey('meu_app_cache')).toBe(true);

            unregister();

            expect(isMaxCacheKey('meu_app_cache')).toBe(false);
        });

        it('ignora chave inválida sem lançar', () => {
            expect(() => registerMaxCacheKey('')()).not.toThrow();
            expect(isMaxCacheKey('')).toBe(false);
        });
    });

    describe('clearMaxCache', () => {
        it('remove apenas as chaves da biblioteca e devolve o que removeu', () => {
            localStorage.setItem(ICON_CACHE_KEY, '{}');
            localStorage.setItem('split_panel_chatpage', '30');
            localStorage.setItem('max-tab-opened-x', '"a"');
            localStorage.setItem('menus', '[]');
            localStorage.setItem('token_da_app', 'nao-me-apague');

            const removed = clearMaxCache();

            expect(localStorage.getItem('token_da_app')).toBe('nao-me-apague');
            expect(localStorage.getItem(ICON_CACHE_KEY)).toBeNull();
            expect(localStorage.getItem('split_panel_chatpage')).toBeNull();
            expect(localStorage.getItem('max-tab-opened-x')).toBeNull();
            expect(localStorage.getItem('menus')).toBeNull();

            expect(removed.sort()).toEqual([ICON_CACHE_KEY, 'max-tab-opened-x', 'menus', 'split_panel_chatpage'].sort());
        });

        it('remove também as chaves registradas pela aplicação', () => {
            registerMaxCacheKey('meu_rascunho');
            localStorage.setItem('meu_rascunho', 'x');
            localStorage.setItem('outra', 'y');

            clearMaxCache();

            expect(localStorage.getItem('meu_rascunho')).toBeNull();
            expect(localStorage.getItem('outra')).toBe('y');
        });

        it('não lança quando o localStorage é inacessível (SecurityError)', () => {
            localStorage.setItem(ICON_CACHE_KEY, '{}');

            const spy = vi.spyOn(localStorage, 'key').mockImplementation(() => {
                throw new Error('SecurityError');
            });

            expect(() => clearMaxCache()).not.toThrow();
            expect(clearMaxCache()).toEqual([]);

            spy.mockRestore();
        });
    });
});
