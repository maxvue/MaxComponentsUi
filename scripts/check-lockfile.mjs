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
    const npmrcPath = path.join(dir, '.npmrc');
    const errors = [];

    // 0. Rejeição estrita de diretiva permissiva legacy-peer-deps em .npmrc
    if (fs.existsSync(npmrcPath)) {
        const npmrcContent = fs.readFileSync(npmrcPath, 'utf-8');
        const lines = npmrcContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
            if (/legacy-peer-deps/i.test(trimmed)) {
                if (!/legacy-peer-deps\s*=\s*(false|0|off)\b/i.test(trimmed)) {
                    errors.push('O arquivo .npmrc contém diretiva ativa "legacy-peer-deps", o que é proibido.');
                    break;
                }
            }
        }
    }

    if (!fs.existsSync(pkgPath)) {
        return { valid: false, errors: ['package.json não encontrado'] };
    }
    if (!fs.existsSync(lockPath)) {
        return { valid: false, errors: ['package-lock.json não encontrado'] };
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

    const packages = lock.packages || {};

    // Padrões proibidos para caminhos locais, symlinks e caminhos de máquina
    const forbiddenPatterns = [
        /^\//,                                       // Caminho absoluto POSIX (/home/, /Users/, /tmp/, /root/, /opt/, etc.)
        /^[a-zA-Z]:[\\/]/,                           // Caminho absoluto Windows (C:\, D:/, etc.)
        /^\\\\/,                                     // Caminho UNC Windows (\\server\share)
        /^\.\.?([\\/]|$)/,                           // Caminho relativo (. ou .. ou ./... ou ../...)
        /\/\.\.\//,                                  // Traversal relativo embutido (/../)
        /^(file|link|portal|workspace|git\+file):/i, // Protocolos locais ou workspace
        /\.max-code-worktrees/i,
        /\.worktrees[\\/]/i
    ];

    // 1. Validação em package.json: nenhum tipo de dependência pode ter especificação de versão local proibida
    const manifestSections = [
        { name: 'dependencies', data: pkg.dependencies || {} },
        { name: 'devDependencies', data: pkg.devDependencies || {} },
        { name: 'peerDependencies', data: pkg.peerDependencies || {} },
        { name: 'optionalDependencies', data: pkg.optionalDependencies || {} }
    ];

    for (const section of manifestSections) {
        for (const [dep, version] of Object.entries(section.data)) {
            if (typeof version !== 'string') continue;
            for (const pattern of forbiddenPatterns) {
                if (pattern.test(version)) {
                    errors.push(`Dependência "${dep}" em package.json (${section.name}) possui especificação de versão local proibida: "${version}"`);
                    break;
                }
            }
        }
    }

    // 2. Rejeição em package-lock.json:
    // 2a. Toda chave de packages DEVE ser a raiz ("") ou começar com "node_modules/"
    for (const key of Object.keys(packages)) {
        if (key !== '' && !key.startsWith('node_modules/')) {
            errors.push(`Chave de pacote "${key}" no lockfile não é canônica (deve começar com "node_modules/"). Caminhos locais ou worktrees órfãos são proibidos.`);
        }

        if (key !== '') {
            for (const pattern of forbiddenPatterns) {
                if (pattern.test(key)) {
                    errors.push(`Chave de pacote contém caminho de máquina, relativo ou local proibido: "${key}"`);
                    break;
                }
            }
        }

        const pkgEntry = packages[key];
        if (pkgEntry?.link || pkgEntry?.symlink) {
            errors.push(`Pacote "${key}" é um link simbólico local (link/symlink: true), proibido para distribuição limpa.`);
        }
        if (pkgEntry?.resolved) {
            for (const pattern of forbiddenPatterns) {
                if (pattern.test(pkgEntry.resolved)) {
                    errors.push(`Campo 'resolved' do pacote "${key}" contém caminho proibido: "${pkgEntry.resolved}"`);
                    break;
                }
            }
        }
        if (pkgEntry?.version && typeof pkgEntry.version === 'string') {
            for (const pattern of forbiddenPatterns) {
                if (pattern.test(pkgEntry.version)) {
                    errors.push(`Campo 'version' do pacote "${key}" contém caminho proibido: "${pkgEntry.version}"`);
                    break;
                }
            }
        }
    }

    // 2b. Se existir formato legado lock.dependencies (lockfile v1/v2), validar recursivamente
    function checkLegacyDeps(deps, prefix = '') {
        if (!deps || typeof deps !== 'object') return;
        for (const [depName, depData] of Object.entries(deps)) {
            const fullName = prefix ? `${prefix} > ${depName}` : depName;
            if (depData.version && typeof depData.version === 'string') {
                for (const pattern of forbiddenPatterns) {
                    if (pattern.test(depData.version)) {
                        errors.push(`Dependência legada "${fullName}" contém versão com caminho proibido: "${depData.version}"`);
                        break;
                    }
                }
            }
            if (depData.resolved && typeof depData.resolved === 'string') {
                for (const pattern of forbiddenPatterns) {
                    if (pattern.test(depData.resolved)) {
                        errors.push(`Dependência legada "${fullName}" contém resolved com caminho proibido: "${depData.resolved}"`);
                        break;
                    }
                }
            }
            if (depData.dependencies) {
                checkLegacyDeps(depData.dependencies, fullName);
            }
        }
    }
    if (lock.dependencies) {
        checkLegacyDeps(lock.dependencies);
    }

    // 3. Validação bidirecional rigorosa entre package.json e bloco raiz de package-lock.json
    const rootLockPkg = packages[''] || {};

    // Helper genérico para comparação bidirecional de blocos de dependências
    function validateBidirectional(sectionName, pkgMap = {}, lockMap = {}) {
        // pkg -> lock
        for (const [dep, version] of Object.entries(pkgMap)) {
            if (!lockMap[dep]) {
                errors.push(`${sectionName} "${dep}" declarada em package.json ausente no bloco raiz de package-lock.json`);
            } else if (lockMap[dep] !== version) {
                errors.push(`Versão de ${sectionName} "${dep}" diverge: package.json declara "${version}", lockfile tem "${lockMap[dep]}"`);
            }
        }
        // lock -> pkg
        for (const dep of Object.keys(lockMap)) {
            if (!pkgMap[dep]) {
                errors.push(`${sectionName} "${dep}" presente no bloco raiz de package-lock.json não está declarada em package.json`);
            }
        }
    }

    // 3a. dependencies
    validateBidirectional('Dependência direta', pkg.dependencies, rootLockPkg.dependencies);

    // 3b. devDependencies
    validateBidirectional('DevDependência', pkg.devDependencies, rootLockPkg.devDependencies);

    // 3c. peerDependencies
    validateBidirectional('PeerDependência', pkg.peerDependencies, rootLockPkg.peerDependencies);

    // 3d. optionalDependencies
    validateBidirectional('OptionalDependência', pkg.optionalDependencies, rootLockPkg.optionalDependencies);

    // 3e. peerDependenciesMeta (bidirecional e propriedade por propriedade)
    const pkgPeerDepsMeta = pkg.peerDependenciesMeta || {};
    const rootLockPeerDepsMeta = rootLockPkg.peerDependenciesMeta || {};

    // pkg -> lock
    for (const [dep, meta] of Object.entries(pkgPeerDepsMeta)) {
        if (!rootLockPeerDepsMeta[dep]) {
            errors.push(`peerDependenciesMeta para "${dep}" declarada em package.json ausente no bloco raiz de package-lock.json`);
        } else {
            const lockMeta = rootLockPeerDepsMeta[dep] || {};
            for (const [prop, val] of Object.entries(meta || {})) {
                if (lockMeta[prop] !== val) {
                    errors.push(`peerDependenciesMeta para "${dep}.${prop}" diverge: package.json declara "${val}", lockfile tem "${lockMeta[prop]}"`);
                }
            }
            for (const prop of Object.keys(lockMeta)) {
                if (!(prop in (meta || {}))) {
                    errors.push(`Propriedade "${prop}" em peerDependenciesMeta para "${dep}" no lockfile não declarada em package.json`);
                }
            }
        }
    }

    // lock -> pkg
    for (const dep of Object.keys(rootLockPeerDepsMeta)) {
        if (!pkgPeerDepsMeta[dep]) {
            errors.push(`peerDependenciesMeta para "${dep}" presente no bloco raiz de package-lock.json não está declarada em package.json`);
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
