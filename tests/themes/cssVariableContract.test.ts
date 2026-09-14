import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

interface TokenUsage {
    token: string;
    file: string;
    line: number;
    hasFallback: boolean;
    fallback?: string;
}

const RUNTIME_PROVIDED_TOKENS = new Set([
    '--stat-bg',
    '--stat-text',
    '--stat-accent',
    '--stat-icon-bg'
]);

function getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    for (const item of readdirSync(dir)) {
        const fullPath = join(dir, item);
        const st = statSync(fullPath);
        if (st.isDirectory()) {
            if (item !== 'node_modules' && item !== 'dist' && item !== '.git') files.push(...getAllFiles(fullPath, extensions));

        } else if (extensions.some((ext) => item.endsWith(ext)) && !item.endsWith('.d.ts')) files.push(fullPath);

    }
    return files;
}

function collectDeclarations(rootDir: string): Set<string> {
    const tokens = new Set<string>();
    const allSrcFiles = getAllFiles(resolve(rootDir, 'src'), ['.vue', '.scss', '.css', '.ts']);

    for (const file of allSrcFiles) {
        const content = readFileSync(file, 'utf-8');
        // Declarações CSS padrão: --token:
        const declRegex = /(--[\w-]+)\s*:/g;
        let m: RegExpExecArray | null;
        while ((m = declRegex.exec(content)) !== null) if (m[1]) tokens.add(m[1]);


        // Inline style bindings em templates Vue: '--token': ou '--token'
        const inlineStyleRegex = /['"](--[\w-]+)['"]\s*:/g;
        while ((m = inlineStyleRegex.exec(content)) !== null) if (m[1]) tokens.add(m[1]);

    }
    return tokens;
}

function parseVarUsages(content: string, filePath: string): TokenUsage[] {
    const usages: TokenUsage[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx]!;
        if (!line.includes('var(')) continue;

        const regex = /var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\)/g;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(line)) !== null) {
            const token = m[1];
            if (!token) continue;
            const fallback = m[2]?.trim();
            usages.push({
                token,
                file: filePath,
                line: lineIdx + 1,
                hasFallback: Boolean(fallback && fallback.length > 0),
                fallback
            });
        }
    }

    return usages;
}

describe('cssVariableContract — inventário global de custom properties', () => {
    const rootDir = resolve(__dirname, '../../');

    it('tokens.scss não publica --max-primary-50 como nível público da rampa', () => {
        const tokensScss = readFileSync(resolve(rootDir, 'src/themes/tokens.scss'), 'utf-8');
        expect(tokensScss).not.toMatch(/--max-primary-50\s*:/);
    });

    it('todas as variáveis CSS consumidas em src/ possuem declaração canônica, fallback válido ou provedor runtime', () => {
        const declarations = collectDeclarations(rootDir);
        const srcFiles = getAllFiles(resolve(rootDir, 'src'), ['.vue', '.scss', '.css', '.ts']);
        const unresolvable: { file: string; line: number; token: string }[] = [];

        for (const file of srcFiles) {
            const content = readFileSync(file, 'utf-8');
            const usages = parseVarUsages(content, file);

            for (const usage of usages) {
                const isDeclared = declarations.has(usage.token);
                const isRuntime = RUNTIME_PROVIDED_TOKENS.has(usage.token);
                const hasFallback = usage.hasFallback;

                if (!isDeclared && !isRuntime && !hasFallback) unresolvable.push({
                    file: file.replace(rootDir, ''),
                    line: usage.line,
                    token: usage.token
                });

            }
        }

        expect(unresolvable).toEqual([]);
    });
});
