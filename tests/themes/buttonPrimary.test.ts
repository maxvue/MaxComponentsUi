import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as sass from 'sass';

const BUTTON = readFileSync(resolve(__dirname, '../../src/components/MaxButton.vue'), 'utf-8');
const COLORS = sass.compile(resolve(__dirname, '../../src/themes/colors.scss')).css;

/** Valor de um token dentro do primeiro bloco `:root` do CSS compilado. */
const rootToken = (name: string): string | undefined => {
    const root = /:root\s*\{([\s\S]*?)\}/.exec(COLORS);
    if (!root) return undefined;
    const decl = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(root[1]);
    return decl?.[1].trim();
};

describe('cor primária do MaxButton', () => {
    // A rampa --primary-* de colors.scss é uma escala de CINZA (#F0F2F4 → #0E1622).
    // A cor da marca é declarada em src/styles/style.ts e congelada como
    // --max-primary-*. Ler a rampa errada deixa todos os botões cinza.
    it('a rampa --primary-* de colors.scss não é a cor da marca', () => {
        expect(rootToken('--primary-500')).toBe('#B8BFCA');
    });

    it('o botão usa a rampa da marca, não a rampa cinza', () => {
        const style = BUTTON.split('<style')[1] ?? '';

        expect(style).not.toMatch(/var\(--primary-\d/);
        expect(style).toMatch(/var\(--max-primary-500/);
    });

    it('o estado hover também usa a rampa da marca', () => {
        const style = BUTTON.split('<style')[1] ?? '';
        expect(style).toMatch(/var\(--max-primary-600/);
    });
});
