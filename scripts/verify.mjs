/**
 * Gate canônico: executa todos os checks e só falha após registrar o resultado
 * de cada um. Isso evita que uma falha inicial esconda regressões posteriores.
 */
import { spawnSync } from 'node:child_process';

export const gates = Object.freeze([
    ['arquivos rastreados', ['run', 'check:filenames']],
    ['lockfile bidirecional', ['run', 'check:lockfile']],
    ['build limpo da biblioteca', ['run', 'build:clean']],
    ['type-check da biblioteca', ['run', 'type-check']],
    ['type-check dos testes', ['run', 'type-check:test']],
    ['lint', ['run', 'lint:check']],
    ['testes unitários (incluindo distribuição)', ['run', 'test']],
    ['cobertura', ['run', 'test:coverage']],
    ['browser', ['run', 'test:browser']],
    ['axe-core no Chromium', ['run', 'test:axe']],
    ['playground completo e orçamento', ['run', 'build:playground']],
    ['SVGO', ['run', 'check:svgo']],
    ['benchmarks', ['run', 'test:benchmark']],
    ['orçamentos de distribuição', ['run', 'check:distribution-budgets']],
    ['árvore de dependências', ['ls', '--all']],
    ['auditoria de dependências', ['audit', '--audit-level=high']],
    ['consumidores públicos', ['run', 'verify:consumers']],
    ['consumidores de CSS e temas', ['run', 'verify:package']],
    ['reprodutibilidade de npm ci', ['run', 'verify:reproducibility']]
]);

export function runGates({ execute = defaultExecute } = {}) {
    const failures = [];

    for (const [name, args] of gates) {
        console.log(`\n▶ ${name}`);
        const result = execute(args);
        if (result !== 0) {
            failures.push(name);
            console.error(`✗ ${name} falhou (código ${result}). Continuando para coletar os demais gates.`);
        } else {
            console.log(`✓ ${name}`);
        }
    }

    if (failures.length > 0) {
        throw new Error(`Gate canônico reprovado em ${failures.length} etapa(s): ${failures.join(', ')}.`);
    }
}

function defaultExecute(args) {
    const result = spawnSync('npm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
    return result.status ?? 1;
}

if (import.meta.main) {
    try {
        runGates();
    } catch (error) {
        console.error(`\n❌ ${error.message}`);
        process.exitCode = 1;
    }
}
