import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Valida o package-lock.json para garantir que não contém chaves de caminho de máquina,
 * referências corrompidas de worktree, links locais ou divergências nos requisitos diretos.
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

    // 1. Rejeita caminhos absolutos de máquina, worktrees, file:, link: e relatives em packages
    const forbiddenPatterns = [
        /^\/home\//,
        /^[a-zA-Z]:\\/,
        /\.max-code-worktrees/,
        /\.worktrees\//,
        /\.\.\//,
        /^file:/,
        /^link:/
    ];

    for (const key of Object.keys(packages)) {
        for (const pattern of forbiddenPatterns) {
            if (pattern.test(key)) {
                errors.push(`Chave de pacote contém caminho de máquina, relativo ou local proibido: "${key}"`);
                break;
            }
        }

        const pkgEntry = packages[key];
        if (pkgEntry?.link) {
            errors.push(`Pacote "${key}" é um link simbólico local (link: true), proibido para distribuição limpa.`);
        }
        if (pkgEntry?.resolved) {
            for (const pattern of forbiddenPatterns) {
                if (pattern.test(pkgEntry.resolved)) {
                    errors.push(`Campo 'resolved' do pacote "${key}" contém caminho proibido: "${pkgEntry.resolved}"`);
                    break;
                }
            }
        }
    }

    // 2. Validação bidirecional rigorosa entre package.json e bloco raiz de package-lock.json
    const rootLockPkg = packages[''] || {};
    const rootLockDeps = rootLockPkg.dependencies || {};
    const rootLockDevDeps = rootLockPkg.devDependencies || {};
    const pkgDeps = pkg.dependencies || {};
    const pkgDevDeps = pkg.devDependencies || {};

    // 2a. Dependências diretas: package.json -> lockfile
    for (const [dep, version] of Object.entries(pkgDeps)) {
        if (!rootLockDeps[dep]) {
            errors.push(`Dependência direta "${dep}" declarada em package.json ausente no bloco raiz de package-lock.json`);
        } else if (rootLockDeps[dep] !== version) {
            errors.push(`Versão da dependência "${dep}" diverge: package.json declara "${version}", lockfile tem "${rootLockDeps[dep]}"`);
        }
    }

    // 2b. Dependências diretas: lockfile -> package.json
    for (const dep of Object.keys(rootLockDeps)) {
        if (!pkgDeps[dep]) {
            errors.push(`Dependência "${dep}" presente no bloco raiz de package-lock.json não está declarada em package.json`);
        }
    }

    // 2c. DevDependencies: package.json -> lockfile
    for (const [dep, version] of Object.entries(pkgDevDeps)) {
        if (!rootLockDevDeps[dep]) {
            errors.push(`DevDependência "${dep}" declarada em package.json ausente no bloco raiz de package-lock.json`);
        } else if (rootLockDevDeps[dep] !== version) {
            errors.push(`Versão da devDependência "${dep}" diverge: package.json declara "${version}", lockfile tem "${rootLockDevDeps[dep]}"`);
        }
    }

    // 2d. DevDependencies: lockfile -> package.json
    for (const dep of Object.keys(rootLockDevDeps)) {
        if (!pkgDevDeps[dep]) {
            errors.push(`DevDependência "${dep}" presente no bloco raiz de package-lock.json não está declarada em package.json`);
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
