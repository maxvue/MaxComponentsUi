import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import * as fs from 'node:fs';
import * as sass from 'sass';

const CSS = sass.compile(resolve(__dirname, '../../src/themes/tokens.scss')).css;

const blockVars = (css: string, selector: string): Record<string, string> => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
    if (!match) return {};
    const out: Record<string, string> = {};
    for (const decl of match[1].split(';')) {
        const [name, ...rest] = decl.split(':');
        if (!name || !rest.length) continue;
        const key = name.trim();
        if (key.startsWith('--')) out[key] = rest.join(':').trim();
    }
    return out;
};

const ROOT = blockVars(CSS, ':root');

describe('Escala Semântica de Camadas (Stacking Layers)', () => {
    const CANONICAL_LAYERS: { token: string; value: number; role: string }[] = [
        { token: '--max-layer-sticky', value: 100, role: 'Cabeçalhos ou colunas sticky locais' },
        { token: '--max-layer-navigation', value: 500, role: 'Navegação principal, menus laterais e topbars' },
        { token: '--max-layer-floating', value: 850, role: 'Botões e elementos flutuantes arrastáveis' },
        { token: '--max-layer-dropdown', value: 1000, role: 'Menus suspensos, selects, autocompletes e pickers' },
        { token: '--max-layer-popover', value: 1200, role: 'Popovers, confirmações flutuantes e painéis contextuais' },
        { token: '--max-layer-modal-backdrop', value: 1300, role: 'Backdrop escurecido de modais e drawers' },
        { token: '--max-layer-modal', value: 1310, role: 'Diálogos modais, drawers e assistentes' },
        { token: '--max-layer-fullscreen', value: 1400, role: 'Modos tela cheia de código, markdown e lightbox de imagem' },
        { token: '--max-layer-toast', value: 1500, role: 'Notificações flutuantes (toasts)' },
        { token: '--max-layer-tooltip', value: 1600, role: 'Dicas de ferramentas e balões informativos instantâneos' },
        { token: '--max-layer-screen-block', value: 10000, role: 'Bloqueio global de tela (loading/lockdown intransponível)' }
    ];

    it('declara todos os 11 tokens canônicos de camadas em :root com valores numéricos corretos', () => {
        for (const layer of CANONICAL_LAYERS) expect(ROOT[layer.token]).toBe(String(layer.value));

    });

    it('declara a família correspondente de tokens semânticos --max-z-index-*', () => {
        for (const layer of CANONICAL_LAYERS) {
            const zIndexToken = layer.token.replace('--max-layer-', '--max-z-index-');
            expect(ROOT[zIndexToken]).toBe(`var(${layer.token}, ${layer.value})`);
        }
    });

    it('respeita a ordem estritamente ascendente dos níveis visuais', () => {
        for (let i = 0; i < CANONICAL_LAYERS.length - 1; i++) {
            const current = CANONICAL_LAYERS[i];
            const next = CANONICAL_LAYERS[i + 1];
            expect(current.value).toBeLessThan(next.value);
        }
    });

    it('mantém aliases legados mapeados para a escala canônica com fallback idêntico', () => {
        expect(ROOT['--z-dropdown']).toBe('var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000))');
        expect(ROOT['--z-sticky']).toBe('var(--max-z-index-sticky, var(--max-layer-sticky, 100))');
        expect(ROOT['--z-modal-backdrop']).toBe('var(--max-z-index-modal-backdrop, var(--max-layer-modal-backdrop, 1300))');
        expect(ROOT['--z-modal']).toBe('var(--max-z-index-modal, var(--max-layer-modal, 1310))');
        expect(ROOT['--z-popover']).toBe('var(--max-z-index-popover, var(--max-layer-popover, 1200))');
        expect(ROOT['--z-toast']).toBe('var(--max-z-index-toast, var(--max-layer-toast, 1500))');
        expect(ROOT['--z-tooltip']).toBe('var(--max-z-index-tooltip, var(--max-layer-tooltip, 1600))');
    });

    it('suporta override direto de --max-z-index-* e --max-layer-* via CSS sem quebrar camadas', () => {
        const overrideScss = `
            @use "tokens";
            .custom-scope {
                --max-z-index-popover: 2500;
                --max-layer-modal: 3000;
            }
        `;
        const compiled = sass.compileString(overrideScss, {
            loadPaths: [resolve(__dirname, '../../src/themes')]
        }).css;
        const customVars = blockVars(compiled, '.custom-scope');
        expect(customVars['--max-z-index-popover']).toBe('2500');
        expect(customVars['--max-layer-modal']).toBe('3000');
    });

    it('rejeita literais arbitrários legados (9999, 99999, 100000, 999999) nos componentes', () => {
        const componentsDir = resolve(__dirname, '../../src/components');
        const getFiles = (dir: string): string[] => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const files: string[] = [];
            for (const entry of entries) {
                const full = resolve(dir, entry.name);
                if (entry.isDirectory()) files.push(...getFiles(full));
                else if (entry.name.endsWith('.vue') || entry.name.endsWith('.scss')) files.push(full);
            }
            return files;
        };

        const files = getFiles(componentsDir);
        const forbiddenLiterals = [/\bz-index:\s*(?:9999|99999|100000|999999)\b/];
        const violations: { file: string; match: string }[] = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            for (const pattern of forbiddenLiterals) {
                const m = pattern.exec(content);
                if (m) violations.push({
                    file: file.replace(componentsDir, ''),
                    match: m[0]
                });

            }
        }

        expect(violations).toEqual([]);
    });
});
