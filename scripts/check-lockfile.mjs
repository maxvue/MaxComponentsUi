import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Valida o package-lock.json para garantir que não contém chaves de caminho de máquina,
 * referências corrompidas de worktree ou divergências nos requisitos diretos.
 *
 * @param {string} [dir=process.cwd()]
 * @returns {{ valid: boolean; errors: string[] }}
 */
export function validateLockfile(dir = process.cwd()) {
    const pkgPath = path.join(dir, 'package.json');
    const lockPath = path.join(dir, 'package-lock.json');
    const errors = [];

    if (!fs.existsSync(pkgPath)) {
        return { valid: false, errors: ['package.json não encontrado'] };
    }
    if (!fs.existsSync(lockPath)) {
        return { valid: false, errors: ['package-lock.json não encontrado'] };
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

    const packages = lock.packages || {};

    // 1. Rejeita caminhos absolutos de máquina e worktrees em qualquer chave de packages
    const forbiddenPatterns = [
        /^\/home\//,
        /^[a-zA-Z]:\\/,
        /\.max-code-worktrees/,
        /\.worktrees\//,
        /\.\.\/\.\.\/\.\.\/\.\.\//
    ];

    for (const key of Object.keys(packages)) {
        for (const pattern of forbiddenPatterns) {
            if (pattern.test(key)) {
                errors.push(`Chave de pacote contém caminho de máquina ou relativo proibido: "${key}"`);
                break;
            }
        }

        const pkgEntry = packages[key];
        if (pkgEntry?.resolved) {
            for (const pattern of forbiddenPatterns) {
                if (pattern.test(pkgEntry.resolved)) {
                    errors.push(`Campo 'resolved' do pacote "${key}" contém caminho proibido: "${pkgEntry.resolved}"`);
                    break;
                }
            }
        }
    }

    // 2. Valida sincronização dos requisitos diretos da raiz do lock com o package.json
    const rootLockPkg = packages[''] || {};
    const rootLockDeps = rootLockPkg.dependencies || {};
    const pkgDeps = pkg.dependencies || {};

    for (const dep of Object.keys(pkgDeps)) {
        if (!rootLockDeps[dep]) {
            // Nota de aviso/erro se faltar dependência direta no bloco raiz do lock
            errors.push(`Dependência direta "${dep}" declarada em package.json ausente no bloco raiz de package-lock.json`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Execução direta
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
    const result = validateLockfile();
    if (!result.valid) {
        console.error('❌ [check-lockfile] Falhas de validação encontradas no package-lock.json:');
        for (const err of result.errors.slice(0, 20)) {
            console.error(`  - ${err}`);
        }
        if (result.errors.length > 20) {
            console.error(`  ... e mais ${result.errors.length - 20} erros.`);
        }
        process.exit(1);
    }

    console.log('✅ [check-lockfile] package-lock.json validado com sucesso.');
    process.exit(0);
}
