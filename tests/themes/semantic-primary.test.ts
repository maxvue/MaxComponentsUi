import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('contratos semânticos de cor primária', () => {
    it('declara os tokens de superfície, hover e conteúdo', () => {
        const content = fs.readFileSync(path.resolve(__dirname, '../../src/themes/tokens.scss'), 'utf-8');
        expect(content).toContain('--primary-surface:');
        expect(content).toContain('--primary-hover:');
        expect(content).toContain('--on-primary:');
    });

    it('aplica os tokens nas ações primárias', () => {
        const button = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxButton.vue'), 'utf-8');
        const menu = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxBottomMenu.vue'), 'utf-8');
        expect(button).toContain('var(--primary-surface');
        expect(button).toContain('var(--on-primary');
        expect(button).toContain('var(--primary-hover');
        expect(menu).toContain('background: var(--primary-surface');
        expect(menu).toContain('color: var(--on-primary');
    });
});
