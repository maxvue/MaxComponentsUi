import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Arquitetura: Autocomplete em nós operáveis nativos (spec §5)', () => {
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

    interface Violation {
        file: string;
        tag: string;
        line: number;
    }

    it('todo input/textarea de texto possui inputAttrs em v-bind ou atributo autocomplete explícito', () => {
        const componentsDir = path.resolve(__dirname, '../../src/components');
        const vueFiles = getVueFiles(componentsDir);

        const violations: Violation[] = [];
        const ignoredTypes = new Set(['checkbox', 'radio', 'file', 'color', 'range', 'hidden']);

        for (const file of vueFiles) {
            const relativePath = path.relative(componentsDir, file);
            const content = fs.readFileSync(file, 'utf-8');

            // Extrai somente o bloco <template>
            const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/i);
            if (!templateMatch) continue;

            const templateContent = templateMatch[1];
            // Remove comentários HTML
            const sanitizedTemplate = templateContent.replace(/<!--[\s\S]*?-->/g, '');

            // Procura todas as tags de abertura <input e <textarea considerando expressões com parênteses e strings
            const tagStartRegex = /<(input|textarea)\b/gi;
            let startMatch: RegExpExecArray | null;

            while ((startMatch = tagStartRegex.exec(sanitizedTemplate)) !== null) {
                const tagName = startMatch[1].toLowerCase();
                const startIndex = startMatch.index + startMatch[0].length;

                let inQuote: string | null = null;
                let parenDepth = 0;
                let endIndex = -1;

                for (let i = startIndex; i < sanitizedTemplate.length; i++) {
                    const char = sanitizedTemplate[i];
                    if (inQuote) {
                        if (char === inQuote) inQuote = null;
                    } else if (char === '"' || char === '\'') inQuote = char;
                    else if (char === '(') parenDepth++;
                    else if (char === ')') {
                        if (parenDepth > 0) parenDepth--;
                    } else if (char === '>' && parenDepth === 0) {
                        endIndex = i;
                        break;
                    }
                }

                if (endIndex === -1) continue;

                const rawAttrs = sanitizedTemplate.slice(startIndex, endIndex);

                // Extrai type se for input
                if (tagName === 'input') {
                    const typeMatch = rawAttrs.match(/\btype=(["'])(.*?)\1/i);
                    const inputType = typeMatch ? typeMatch[2].toLowerCase() : 'text';
                    if (ignoredTypes.has(inputType)) continue;
                }

                // Verifica conformidade: deve ter inputAttrs ou autocomplete/:autocomplete
                const hasInputAttrs = /inputAttrs/.test(rawAttrs);
                const hasAutocomplete = /\b:?autocomplete\s*=/i.test(rawAttrs);

                if (!hasInputAttrs && !hasAutocomplete) {
                    const prefix = sanitizedTemplate.slice(0, startMatch.index);
                    const lineNumber = prefix.split('\n').length;

                    violations.push({
                        file: relativePath,
                        tag: `<${tagName} ${rawAttrs.trim().replace(/\s+/g, ' ')}>`,
                        line: lineNumber
                    });
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
