import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { compileStyle, parse, type ElementNode, type Node, type RootNode } from '@vue/compiler-sfc';
import postcss from 'postcss';
import * as sass from 'sass';

const componentsDir = path.resolve(__dirname, '../../src/components');
const themesDir = path.resolve(__dirname, '../../src/themes');
const background650Inventory = fs.readFileSync(path.resolve(__dirname, '../../docs/optimize-new/execution-fix5/R16-background-650-inventory.md'), 'utf8');
const globalCss = sass.compile(path.join(themesDir, 'all.scss')).css;

type FocusTarget = { tag: string; classes: string[]; role?: string; tabindex?: string; source: string };

function vueFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) return vueFiles(file);
        return entry.isFile() && file.endsWith('.vue') ? [file] : [];
    });
}

function attribute(node: ElementNode, name: string) {
    const prop = node.props.find((candidate) => candidate.type === 6 && candidate.name === name);
    return prop?.value?.content;
}

function targetOf(node: ElementNode): FocusTarget | undefined {
    if (node.tagType !== 0) return undefined;
    const tag = node.tag.toLowerCase();
    const role = attribute(node, 'role');
    const tabindex = attribute(node, 'tabindex');
    const disabled = node.props.some((prop) => prop.type === 6 && prop.name === 'disabled');
    const native = ['button', 'input', 'select', 'textarea', 'summary', 'iframe', 'audio', 'video'].includes(tag);
    const aria = ['button', 'link', 'menuitem', 'option', 'tab', 'checkbox', 'switch', 'slider', 'combobox', 'listbox'].includes(role ?? '') && tabindex !== undefined;
    const tabbed = tabindex !== undefined && tabindex !== '-1';
    if (disabled || (!native && !aria && !tabbed)) return undefined;
    return { tag, classes: (attribute(node, 'class') ?? '').split(/\s+/).filter(Boolean), role, tabindex, source: node.loc.source };
}

function targetsFromAst(root: RootNode) {
    const targets: FocusTarget[] = [];
    const visit = (node: Node) => {
        if (node.type === 1) {
            const target = targetOf(node);
            if (target) targets.push(target);
            node.children.forEach(visit);
        } else if ('children' in node && Array.isArray(node.children)) node.children.forEach(visit);
    };
    root.children.forEach(visit);
    return targets;
}

function compiledSelectors(source: string, filename: string) {
    const styles = filename.endsWith('.vue')
        ? parse(source, { filename }).descriptor.styles
        : [{ content: source, lang: filename.endsWith('.scss') ? 'scss' : undefined }];
    return styles.flatMap((style) => {
        const css = style.lang === 'scss'
            ? sass.compileString(style.content, { loadPaths: [path.dirname(filename), componentsDir, themesDir] }).css
            : style.content;
        const result = compileStyle({ source: css, filename, id: 'r16-inventory' });
        if (result.errors.length) throw new Error(`${filename}: ${result.errors.join('\n')}`);
        return postcss.parse(result.code).nodes.flatMap((node) => node.type === 'rule' ? node.selectors ?? [] : []);
    });
}

const globalSelectors = compiledSelectors(fs.readFileSync(path.join(themesDir, 'all.scss'), 'utf8'), path.join(themesDir, 'all.scss'));

function selectorMatchesTarget(selector: string, target: FocusTarget) {
    if (!selector.includes(':focus-visible')) return false;
    if (selector.includes(target.tag)) return true;
    if (target.classes.some((className) => selector.includes(`.${className}`))) return true;
    if (target.role && (selector.includes(`[role='${target.role}']`) || selector.includes(`[role=${target.role}]`))) return true;
    return target.tabindex !== undefined && selector.includes('[tabindex]');
}

describe('R16/F23 — inventário AST de foco e associação com CSS compilado', () => {
    const inventory = vueFiles(componentsDir).map((file) => {
        const source = fs.readFileSync(file, 'utf8');
        const descriptor = parse(source, { filename: file }).descriptor;
        return { file, targets: descriptor.template ? targetsFromAst(descriptor.template.ast) : [], selectors: compiledSelectors(source, file) };
    }).filter(({ targets }) => targets.length > 0);

    it('deriva alvos do AST de cada template, sem regex nem catálogo manual', () => {
        expect(inventory.length).toBeGreaterThan(20);
        expect(inventory.flatMap(({ targets }) => targets).length).toBeGreaterThan(50);
    });

    it('correlaciona SFC → alvo DOM → estado focus-visible → seletor CSS aplicável', () => {
        const unresolved = inventory.flatMap(({ file, targets, selectors }) => targets
            .filter((target) => ![...selectors, ...globalSelectors].some((selector) => selectorMatchesTarget(selector, target)))
            .map((target) => `${path.relative(componentsDir, file)} :: ${target.source}`));
        expect(unresolved, 'Cada alvo do AST deve possuir seletor :focus-visible local ou canônico global aplicável ao próprio DOM.').toEqual([]);
    });

    it('mantém a política global compilada para famílias focáveis sem estilo local', () => {
        expect(globalSelectors.some((selector) => selector.includes(':focus-visible'))).toBe(true);
        expect(globalCss).toContain('outline: var(--max-focus-outline)');
        expect(globalCss).toContain('box-shadow: var(--max-focus-ring)');
    });

    it('inventaria toda exceção remanescente de background-650 e proíbe seu uso em conteúdo habilitado', () => {
        const remaining = vueFiles(componentsDir).filter((file) => fs.readFileSync(file, 'utf8').includes('--background-650')).map((file) => path.basename(file));
        const documented = ['MaxAccordionItem.vue', 'MaxInputOTP.vue', 'MaxSideMenuMobile.vue'];
        expect(remaining.sort()).toEqual(documented.sort());
        for (const file of documented) expect(background650Inventory).toContain(file);
        expect(background650Inventory).toContain('themes/params.scss');
        expect(background650Inventory).toContain('themes/tokens.scss');
        expect(background650Inventory).toContain('themes/colors.scss');
    });
});
