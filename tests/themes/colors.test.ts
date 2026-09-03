import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import * as sass from 'sass';

describe('themes/colors.scss e themes/params.scss', () => {
    it('declara --violet-375 e --violet-400 corretamente sem truncar no :root', () => {
        const css = sass.compile(resolve(__dirname, '../../src/themes/colors.scss')).css;

        expect(css).toMatch(/--violet-375:\s*#C38BF9;/);
        expect(css).toMatch(/--violet-400:\s*#BF83F9;/);
    });

    it('declara animação spin no utilitário [spinner] e não anula inadvertidamente', () => {
        const css = sass.compile(resolve(__dirname, '../../src/themes/params.scss')).css;

        // O seletor ativo deve conter a animação spin para spinner
        expect(css).toMatch(/\[rotate=['"]?true['"]?\]:not\(svg\),\s*\[spinner\]:not\(svg\)/);

        // O seletor de reset não pode conter [spinner] isolado (sem =false)
        expect(css).not.toMatch(/\[rotate=['"]?false['"]?\]:not\(svg\),\s*\[spinner\]:not\(svg\)/);
        expect(css).toMatch(/\[rotate=['"]?false['"]?\]:not\(svg\),\s*\[spinner=['"]?false['"]?\]:not\(svg\)/);
    });
});
