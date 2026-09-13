import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Valida lista de nomes de arquivos para evitar segmentos hostis:
 * - Segmentos de caminho iniciados por '-' (ex.: '-l')
 * - Caracteres de controle ASCII (0x00 a 0x1F, 0x7F)
 *
 * @param {string[]} filenames
 * @param {string[]} [exceptions=[]]
 * @returns {{ valid: boolean; errors: Array<{ file: string; reason: string }> }}
 */
export function validateFilenames(filenames, exceptions = []) {
    const errors = [];
    const exceptionSet = new Set(exceptions);

    // Expressão para caracteres de controle ASCII (0-31 e 127)
    const controlCharRegex = /[\u0000-\u001F\u007F]/;

    for (const file of filenames) {
        if (!file || exceptionSet.has(file)) {
            continue;
        }

        // Verifica caracteres de controle ASCII
        if (controlCharRegex.test(file)) {
            errors.push({
                file: JSON.stringify(file),
                reason: 'Contém caracteres de controle ASCII não imprimíveis'
            });
            continue;
        }

        // Divide o caminho em segmentos para checar cada parte
        const segments = file.split('/');
        for (const segment of segments) {
            if (segment.startsWith('-')) {
                errors.push({
                    file,
                    reason: `Segmento de caminho "${segment}" inicia com hífen (-), passível de interpretação como flag UNIX`
                });
                break;
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Obtém os arquivos rastreados via git ls-files -z
 * @param {string} [cwd]
 * @returns {string[]}
 */
export function getTrackedFiles(cwd = process.cwd()) {
    const rawOutput = execSync('git ls-files -z', {
        cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
    });

    return rawOutput.split('\0').filter(Boolean);
}

// Execução direta via CLI
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
    try {
        const files = getTrackedFiles();
        const result = validateFilenames(files);

        if (!result.valid) {
            console.error('❌ [check-tracked-filenames] Foram encontrados arquivos rastreados com nomes hostis:');
            for (const err of result.errors) {
                console.error(`  - ${err.file}: ${err.reason}`);
            }
            process.exit(1);
        }

        console.log(`✅ [check-tracked-filenames] Todos os ${files.length} arquivos rastreados possuem nomes válidos.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ [check-tracked-filenames] Erro ao verificar arquivos rastreados:', error.message);
        process.exit(1);
    }
}
