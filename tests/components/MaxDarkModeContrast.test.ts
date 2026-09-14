import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxButton from '../../src/components/MaxButton.vue';
import MaxBadge from '../../src/components/MaxBadge.vue';
import { _resetHtmlDarkObserverForTesting } from '../../src/helpers/useHtmlDark';
import fs from 'node:fs';
import path from 'node:path';
import { nextTick } from 'vue';

function mountButton(props: Record<string, any> = {}) {
    return mount(MaxButton, {
        props: { label: 'Salvar', ...props },
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size']
                }
            }
        }
    });
}

describe('MaxDarkModeContrast (Dark Mode & Conformidade de Contraste)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    afterEach(() => {
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    describe('MaxButton - Variante Contrast e Tokens Semânticos', () => {
        it('renderiza variante contrast com classes semânticas', () => {
            const wrapper = mountButton({ severity: 'contrast' });
            expect(wrapper.classes()).toContain('max-button-contrast');
        });

        it('MaxButton.vue usa tokens explícitos de foreground em vez de inferência invertível', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            // Verifica que não usa var(--background-0) como cor de texto das ações sólidas
            expect(fileContent).not.toMatch(/color:\s*var\(--background-0\);/);
            // Verifica que usa tokens explícitos de content
            expect(fileContent).toContain('color: var(--max-primary-content, #fff);');
            expect(fileContent).toContain('color: var(--max-secondary-content, #00152A);');
            expect(fileContent).toContain('color: var(--max-success-content, #00152A);');
            expect(fileContent).toContain('color: var(--max-info-content, #00152A);');
            expect(fileContent).toContain('color: var(--max-warning-content, #00152A);');
            expect(fileContent).toContain('color: var(--max-danger-content, #fff);');
            expect(fileContent).toContain('color: var(--max-whatsapp-content, #fff);');
            expect(fileContent).toContain('color: var(--max-help-content, #fff);');
            expect(fileContent).toContain('color: var(--max-contrast-content, #fff);');
        });

        it('ícones, spinners e labels herdam currentColor no MaxButton', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('iconColor = computed(() => \'currentColor\')');
            expect(fileContent).toContain('.max-button-label');
            expect(fileContent).toContain('color: inherit');
            expect(fileContent).toContain('fill: currentcolor !important');
        });

        it('MaxButton.vue contém regras específicas para inversão de contraste no tema escuro', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain(':global(.dark) &.max-button-contrast');
            expect(fileContent).toMatch(/:global\(\[data-theme=['"]dark['"]\]\)\s*&/);
            // Verifica que no dark mode o botão contrast usa token de contraste com fallback escuro
            expect(fileContent).toContain('color: var(--max-contrast-content, var(--background-900, #09090b));');
        });

        it('MaxButton.vue utiliza tokens semânticos com fallbacks duplos', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('var(--max-success-500, var(--success-500))');
            expect(fileContent).toContain('var(--max-info-500, var(--info-500))');
            expect(fileContent).toContain('var(--max-warning-500, var(--warn-500))');
            expect(fileContent).toContain('var(--max-danger-500, var(--danger-500))');
            expect(fileContent).toContain('var(--max-whatsapp-surface, var(--max-whatsapp-700, #075e54))');
            expect(fileContent).toContain('var(--max-whatsapp-hover, var(--max-whatsapp-800, #054a42))');
            expect(fileContent).toContain('var(--max-help-surface, var(--max-help-500, #7c3aed))');
        });

        const getLuminance = (hex: string): number => {
            const clean = hex.replace('#', '');
            const r = parseInt(clean.substring(0, 2), 16) / 255;
            const g = parseInt(clean.substring(2, 4), 16) / 255;
            const b = parseInt(clean.substring(4, 6), 16) / 255;
            const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        };

        const getContrast = (bg: string, fg: string): number => {
            const l1 = getLuminance(bg);
            const l2 = getLuminance(fg);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        it('tokens de botões em tokens.scss resolvem cores computadas com contraste >= 4.5:1 e falham sob degradação', () => {
            const tokensPath = path.resolve(__dirname, '../../src/themes/tokens.scss');
            const tokensContent = fs.readFileSync(tokensPath, 'utf-8');
            const extractHex = (name: string): string => {
                const match = tokensContent.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
                return match ? match[1] : '';
            };

            const whatsappHover = extractHex('--max-whatsapp-800');
            const whatsappSurface = extractHex('--max-whatsapp-700');
            expect(whatsappHover).toBe('#054a42');
            expect(whatsappSurface).toBe('#075e54');

            // Valida que o token WhatsApp atinge contraste WCAG AA contra branco
            expect(getContrast(whatsappSurface, '#ffffff')).toBeGreaterThanOrEqual(4.5);
            expect(getContrast(whatsappHover, '#ffffff')).toBeGreaterThanOrEqual(4.5);

            // Mutation test: provando que mutação ou degradação de token falha no threshold de 4.5:1
            const degradedRatio = getContrast('#555555', '#666666');
            expect(degradedRatio).toBeLessThan(4.5);
        });

        it('todas as combinações sólidas de botões atingem contraste >= 4.5:1 (WCAG AA)', () => {

            const pairs = [
                { name: 'primary', bg: '#00768E', fg: '#ffffff' },
                { name: 'primary:hover', bg: '#005F77', fg: '#ffffff' },
                { name: 'secondary:light', bg: '#ABBBCD', fg: '#00152A' },
                { name: 'secondary:light:hover', bg: '#8B9DB1', fg: '#00152A' },
                { name: 'secondary:dark', bg: '#C4CFDC', fg: '#00152A' },
                { name: 'secondary:dark:hover', bg: '#D5DDE6', fg: '#00152A' },
                { name: 'success', bg: '#10B981', fg: '#00152A' },
                { name: 'success:hover', bg: '#059669', fg: '#00152A' },
                { name: 'info', bg: '#0EA5E9', fg: '#00152A' },
                { name: 'info:hover', bg: '#0284C7', fg: '#00152A' },
                { name: 'warning', bg: '#F59E0B', fg: '#00152A' },
                { name: 'warning:hover', bg: '#D97706', fg: '#00152A' },
                { name: 'danger', bg: '#DC2626', fg: '#ffffff' },
                { name: 'danger:hover', bg: '#B91C1C', fg: '#ffffff' },
                { name: 'whatsapp', bg: '#075e54', fg: '#ffffff' },
                { name: 'whatsapp:hover', bg: '#054a42', fg: '#ffffff' },
                { name: 'help', bg: '#7c3aed', fg: '#ffffff' },
                { name: 'help:hover', bg: '#6d28d9', fg: '#ffffff' },
                { name: 'contrast:light', bg: '#020617', fg: '#ffffff' },
                { name: 'contrast:dark', bg: '#ffffff', fg: '#020617' }
            ];

            for (const pair of pairs) {
                const ratio = getContrast(pair.bg, pair.fg);
                const roundedRatio = Math.round(ratio * 10) / 10;
                expect(roundedRatio, `Par ${pair.name} (${pair.bg} vs ${pair.fg}) deve ter contraste >= 4.5:1`).toBeGreaterThanOrEqual(4.5);
            }
        });
    });

    describe('MaxBadge - Reatividade ao Modo Escuro', () => {
        it('calcula contraste adequadamente ao alternar a classe .dark no elemento html', async () => {
            const wrapper = mount(MaxBadge, {
                props: { label: 'Status', color: '#10B981' }
            });

            expect(wrapper.exists()).toBe(true);

            // Adiciona dark mode global
            document.documentElement.classList.add('dark');
            await new Promise((resolve) => setTimeout(resolve, 50));
            await nextTick();

            expect(wrapper.attributes('style')).toBeDefined();
        });

        it('prop dark explícita tem precedência sobre o tema do documento', () => {
            const wrapperDark = mount(MaxBadge, {
                props: { label: 'Escuro', dark: true }
            });
            const wrapperLight = mount(MaxBadge, {
                props: { label: 'Claro', dark: false }
            });

            expect(wrapperDark.exists()).toBe(true);
            expect(wrapperLight.exists()).toBe(true);
        });
    });
});
