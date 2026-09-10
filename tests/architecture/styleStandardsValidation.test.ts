import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getVueFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...getVueFiles(fullPath));
        else if (entry.isFile() && entry.name.endsWith('.vue')) results.push(fullPath);

    }

    return results;
}

const COMPONENTS_DIR = path.resolve(__dirname, '../../src/components');
const vueFiles = getVueFiles(COMPONENTS_DIR);

describe('Auditoria Arquitetural: Estilização Front-End e Regras Estritas', () => {
    it('todos os blocos <style> em componentes Vue devem ter lang="scss" e scoped', () => {
        const unscopedOrNonScss: { file: string; tags: string[] }[] = [];

        for (const file of vueFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const styleTagRegex = /<style\b([^>]*)>/gi;
            let match;
            const invalidTags: string[] = [];

            while ((match = styleTagRegex.exec(content)) !== null) {
                const attrs = match[1] ?? '';
                const hasScoped = /\bscoped\b/i.test(attrs);
                const hasScss = /\blang=["']scss["']/i.test(attrs);

                if (!hasScoped || !hasScss) invalidTags.push(match[0]);

            }

            if (invalidTags.length > 0) unscopedOrNonScss.push({
                file: path.relative(COMPONENTS_DIR, file),
                tags: invalidTags
            });

        }

        expect(unscopedOrNonScss).toEqual([]);
    });

    it('templates não devem conter classes utilitárias inline nem atributos attributify', () => {
        const prohibitedPatterns = [
            /\bclass=["'][^"']*\b(p-\d+|m-\d+|pt-\d+|pb-\d+|pl-\d+|pr-\d+|mt-\d+|mb-\d+|ml-\d+|mr-\d+)\b[^"']*["']/i,
            /\bclass=["'][^"']*\b(text-xs|text-sm|text-base|text-lg|text-xl)\b[^"']*["']/i,
            /\bclass=["'][^"']*\b(w-full|h-full|min-w-|min-h-)\b[^"']*["']/i,
            /\b(s100|w-full|h-full)\b(?=[^>]*>)/i,
            /\b(color-(?:green|red|blue)-b-\d+)\b/i
        ];

        const violations: { file: string; pattern: string; snippet: string }[] = [];

        for (const file of vueFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const templateMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i);
            if (!templateMatch) continue;

            const templateContent = templateMatch[1];

            for (const pattern of prohibitedPatterns) {
                const match = templateContent.match(pattern);
                if (match) violations.push({
                    file: path.relative(COMPONENTS_DIR, file),
                    pattern: pattern.toString(),
                    snippet: match[0]
                });

            }
        }

        expect(violations).toEqual([]);
    });

    it('ordem dos blocos nos arquivos SFC deve ser: 1º template, 2º script, 3º style', () => {
        const disordered: { file: string; order: string[] }[] = [];

        for (const file of vueFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const blockMatches: { name: string; index: number }[] = [];

            const templateIndex = content.indexOf('<template');
            const scriptIndex = content.indexOf('<script');
            const styleIndex = content.indexOf('<style');

            if (templateIndex !== -1) blockMatches.push({ name: 'template', index: templateIndex });
            if (scriptIndex !== -1) blockMatches.push({ name: 'script', index: scriptIndex });
            if (styleIndex !== -1) blockMatches.push({ name: 'style', index: styleIndex });

            blockMatches.sort((a, b) => a.index - b.index);
            const actualOrder = blockMatches.map((b) => b.name);

            // Se tem template e script, template deve vir antes de script
            if (templateIndex !== -1 && scriptIndex !== -1 && templateIndex > scriptIndex) disordered.push({ file: path.relative(COMPONENTS_DIR, file), order: actualOrder });

            // Se tem script e style, script deve vir antes de style
            if (scriptIndex !== -1 && styleIndex !== -1 && scriptIndex > styleIndex) disordered.push({ file: path.relative(COMPONENTS_DIR, file), order: actualOrder });

            // Se tem template e style, template deve vir antes de style
            if (templateIndex !== -1 && styleIndex !== -1 && templateIndex > styleIndex) disordered.push({ file: path.relative(COMPONENTS_DIR, file), order: actualOrder });

        }

        expect(disordered).toEqual([]);
    });
});
