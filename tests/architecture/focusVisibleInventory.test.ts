import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const componentsDir = path.resolve(__dirname, '../../src/components');
const globalFocusSource = fs.readFileSync(path.resolve(__dirname, '../../src/themes/all.scss'), 'utf8');
const background650Inventory = fs.readFileSync(path.resolve(__dirname, '../../docs/optimize-new/execution-fix5/R16-background-650-inventory.md'), 'utf8');

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

/** Alvos alcançáveis por Tab derivados do template, não de uma lista manual de SFCs. */
type FocusTarget = { tag: string; attrs: string; classes: string[] };

/**
 * Parser leve do template: conserva o alvo e suas classes para que a política
 * de foco seja associada ao DOM que de fato recebe Tab, em vez de aceitar uma
 * ocorrência de `:focus` qualquer no SFC.
 */
function tabbableTargets(template: string): FocusTarget[] {
    const targets: FocusTarget[] = [];
    const tags = template.matchAll(/<(button|input|select|textarea|summary|iframe|audio|video|[\w-]+)\b[^>]*>/gi);
    for (const match of tags) {
        const tag = match[1].toLowerCase();
        const attrs = match[0];
        if (/\bdisabled(?:\s|=|>|$)/i.test(attrs) || /\btabindex\s*=\s*["']?-1["']?/i.test(attrs)) continue;
        const isTabbable = /^(button|input|select|textarea|summary|iframe|audio|video)$/.test(tag)
            || /\brole\s*=\s*["'](?:button|link|menuitem|option|tab|checkbox|switch|slider|combobox|listbox)["']/i.test(attrs)
            || /\btabindex\s*=\s*["']?(?:0|[1-9]\d*)["']?/i.test(attrs);
        if (!isTabbable) continue;
        const classValue = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
        targets.push({ tag, attrs, classes: classValue.split(/\s+/).filter(Boolean) });
    }
    return targets;
}

function styleOf(source: string) {
    return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]).join('\n');
}

function hasCanonicalFocusPolicy(source: string) {
    const styles = styleOf(source);
    return /:focus-(?:visible|within)/i.test(styles)
        && /--max-focus-(?:outline|ring(?:-color)?)/i.test(styles);
}

function hasPolicyAssociatedToTarget(source: string, target: FocusTarget) {
    const styles = styleOf(source);
    const focusRule = /(?:[\w.&:#\-[\]='" ]+)(?::focus-(?:visible|within))[^\{]*\{[^}]*--max-focus-(?:outline|ring(?:-color)?)/is;
    const globalPolicy = /:where\([\s\S]*\):focus-visible\s*\{[\s\S]*--max-focus-outline[\s\S]*--max-focus-ring/is.test(globalFocusSource);
    if (!focusRule.test(styles) && !globalPolicy) return false;

    // Classes do alvo precisam participar de um seletor de foco, ou o próprio
    // elemento nativo precisa ser selecionado. Isso impede aprovar um button
    // só porque uma div irmã possui :focus-visible.
    const selectors = [...styles.matchAll(/([^{}]+):focus-(?:visible|within)[^{]*\{/gi)].map((match) => match[1]);
    return globalPolicy || selectors.some((selector) => target.classes.some((className) => selector.includes(`.${className}`))
        || new RegExp(`\\b${target.tag}\\b`, 'i').test(selector));
}

describe('R16/F23 — inventário de foco derivado dos fontes', () => {
    const inventory = vueFiles(componentsDir).map((file) => ({
        file: path.relative(componentsDir, file),
        source: fs.readFileSync(file, 'utf8')
    })).map(({ file, source }) => ({ file, source, targets: tabbableTargets(templateOf(source)) }))
        .filter(({ targets }) => targets.length > 0);

    it('descobre os alvos focáveis a partir dos templates, sem catálogo fixo', () => {
        expect(inventory.length).toBeGreaterThan(20);
        expect(new Set(inventory.map(({ file }) => file)).size).toBe(inventory.length);
    });

    it('associa cada alvo focável ao seletor de foco canônico ou à delegação verificável ao InputBase', () => {
        const unresolved = inventory
            .flatMap(({ file, source, targets }) => targets
                .filter((target) => !hasPolicyAssociatedToTarget(source, target) && !/<InputBase\b/.test(templateOf(source)))
                .map((target) => `${file} <${target.tag}${target.classes.length ? `.${target.classes.join('.')}` : ''}>`));

        expect(unresolved, 'Todo alvo alcançável por Tab deve ter seu próprio seletor de foco ou delegar ao InputBase.').toEqual([]);
    });

    it('garante que a delegação usada pelo inventário tem indicador canônico no owner', () => {
        const inputBase = fs.readFileSync(path.join(componentsDir, 'InputBase.vue'), 'utf8');
        expect(hasCanonicalFocusPolicy(inputBase)).toBe(true);
    });

    it('mantém uma política global vinculada aos elementos focáveis para os componentes sem mixin local', () => {
        expect(globalFocusSource).toMatch(/:where\([\s\S]*\):focus-visible\s*\{/);
        expect(globalFocusSource).toMatch(/outline:\s*var\(--max-focus-outline\)/);
        expect(globalFocusSource).toMatch(/box-shadow:\s*var\(--max-focus-ring\)/);
    });

    it('inventaria toda exceção remanescente de background-650 e proíbe seu uso em conteúdo habilitado', () => {
        const remaining = vueFiles(componentsDir)
            .filter((file) => fs.readFileSync(file, 'utf8').includes('--background-650'))
            .map((file) => path.basename(file));
        const documented = ['MaxAccordionItem.vue', 'MaxInputOTP.vue', 'MaxSideMenuMobile.vue'];

        expect(remaining.sort()).toEqual(documented.sort());
        for (const file of documented) expect(background650Inventory).toContain(file);
        expect(background650Inventory).toContain('themes/params.scss');
        expect(background650Inventory).toContain('themes/tokens.scss');
        expect(background650Inventory).toContain('themes/colors.scss');
    });

    it('não permite outline removido em um alvo sem política local ou owner verificável', () => {
        const violations = inventory
            .filter(({ source }) => /outline:\s*(?:none|0)(?:\s*!important)?/i.test(styleOf(source)))
            .filter(({ source }) => !hasCanonicalFocusPolicy(source) && !/<InputBase\b/.test(templateOf(source)))
            .map(({ file }) => file);

        expect(violations).toEqual([]);
    });
});
