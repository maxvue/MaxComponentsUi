/**
 * Preset de tema da biblioteca.
 *
 * Até a Fase 1 este preset derivava do preset Aura do @primeuix/themes.
 * Agora é um objeto próprio: as 5 rampas semânticas abaixo já eram literais no arquivo,
 * e os tokens que vinham por herança estão congelados em src/themes/tokens.scss.
 */
export const MaxStyle = {
    semantic: {
        primary: {
            50: '#67C8DB',
            100: '#56C2D7',
            200: '#46BCD4',
            300: '#2EA4BC',
            400: '#178DA5',
            500: '#00768E',
            600: '#005F77',
            700: '#004860',
            800: '#003048',
            900: '#001931',
            950: '#00152A'
        },
        success: {
            50: '#E8FDF3',
            100: '#D4FCE8',
            200: '#A5F3D3',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
            950: '#054232'
        },
        info: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            200: '#BAE6FD',
            300: '#7DD3FC',
            400: '#38BDF8',
            500: '#0EA5E9',
            600: '#0284C7',
            700: '#0369A1',
            800: '#075985',
            900: '#0C4A6E',
            950: '#0A3F5E'
        },
        warning: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
            950: '#662D0D'
        },
        danger: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
            950: '#6C1919'
        }
    }
};
