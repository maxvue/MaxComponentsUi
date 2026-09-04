import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import * as sass from 'sass';

const CSS = sass.compile(resolve(__dirname, '../../src/themes/params.scss')).css;

describe('themes/params.scss', () => {
    it('aplica cursor not-allowed em [disabled] dentro de .p-button', () => {
        expect(CSS).toContain('cursor: not-allowed !important');
        expect(CSS).not.toMatch(/\.p-button\s+\[disabled\]\s*\{[^}]*cursor:\s*pointer\s*!important/);
    });
});
