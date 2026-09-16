import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const componentsDir = path.resolve(__dirname, '../../src/components');

function vueFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) return vueFiles(file);
        return entry.isFile() && file.endsWith('.vue') ? [file] : [];
    });
}

function templateOf(source: string) {
    return source.match(/<template[^>]*>([\s\S]*?)<\/template>/i)?.[1] ?? '';
}

/** Alvos alcançáveis por Tab derivados do template, analisando estrutura real do elemento. */
function hasTabbableTarget(template: string) {
    const tags = template.matchAll(/<(button|input|select|textarea|summary|iframe|audio|video|[\w-]+)\b([^>]*)>/gi);
    for (const match of tags) {
        const tag = match[1].toLowerCase();
        const attrs = match[2];
        // Descarta alvos com tabindex="-1" explícito
        if (/\btabindex\s*=\s*["']?-1["']?/i.test(attrs)) continue;
        // Não aceita atributo estático disabled booleano
        if (/\bdisabled\s*(?:=|>|$|\s)/i.test(attrs) && !/:disabled/i.test(attrs)) continue;
        // Elementos interativos nativos que recebem foco por padrão
        if (/^(button|input|select|textarea|summary|iframe|audio|video)$/.test(tag)) return true;
        // Roles ARIA interativos
        if (/\brole\s*=\s*["'](?:button|link|menuitem|option|tab|checkbox|switch|slider|combobox|listbox)["']/i.test(attrs)) return true;
        // Tabindex positivo ou zero
        if (/\btabindex\s*=\s*["']?(?:0|[1-9]\d*)["']?/i.test(attrs)) return true;
    }
    return false;
}

function styleOf(source: string) {
    return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]).join('\n');
}

/**
 * Exige política canônica de foco específica (:focus-visible ou :focus-within)
 * atrelada aos tokens canônicos do design system (--max-focus-outline ou --max-focus-ring).
 * Não aceita mera menção genérica a :focus sem anel canônico.
 */
function hasCanonicalFocusPolicy(source: string) {
    const styles = styleOf(source);
    // Exige pseudo-classe específica de foco acessível
    const hasFocusPseudo = /:(?:focus-visible|focus-within)\b/i.test(styles);
    // Exige tokens canônicos de foco da biblioteca
    const hasFocusTokens = /--max-focus-(?:outline|ring(?:-color)?)/i.test(styles)
        || /@include\s+(?:max-focus-visible|focus-ring|focus-field)\b/i.test(styles);
    return hasFocusPseudo && hasFocusTokens;
}

describe('R16/F23 — inventário de foco derivado dos fontes', () => {
    const inventory = vueFiles(componentsDir).map((file) => ({
        file: path.relative(componentsDir, file),
        source: fs.readFileSync(file, 'utf8')
    })).filter(({ source }) => hasTabbableTarget(templateOf(source)));

    it('descobre os alvos focáveis a partir dos templates, sem catálogo fixo', () => {
        expect(inventory.length).toBeGreaterThan(20);
        expect(new Set(inventory.map(({ file }) => file)).size).toBe(inventory.length);
    });

    it('exige política canônica local ou delegação verificável ao InputBase', () => {
        const unresolved = inventory
            .filter(({ source }) => !hasCanonicalFocusPolicy(source) && !/<InputBase\b/.test(templateOf(source)))
            .map(({ file }) => file);

        expect(unresolved, 'Todo alvo alcançável por Tab deve possuir foco canônico ou delegar ao InputBase.').toEqual([]);
    });

    it('garante que a delegação usada pelo inventário tem indicador canônico no owner', () => {
        const inputBase = fs.readFileSync(path.join(componentsDir, 'InputBase.vue'), 'utf8');
        expect(hasCanonicalFocusPolicy(inputBase)).toBe(true);
    });

    it('não permite outline removido em um alvo sem política local ou owner verificável', () => {
        const violations = inventory
            .filter(({ source }) => /outline:\s*(?:none|0)(?:\s*!important)?/i.test(styleOf(source)))
            .filter(({ source }) => !hasCanonicalFocusPolicy(source) && !/<InputBase\b/.test(templateOf(source)))
            .map(({ file }) => file);

        expect(violations).toEqual([]);
    });
});
