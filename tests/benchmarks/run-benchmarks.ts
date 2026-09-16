/**
 * Runner de Benchmarks Temporais — MaxBaseVirtualScroller
 *
 * Execução:
 *   npm run test:benchmark
 *   node tests/benchmarks/run-benchmarks.ts
 *
 * Produz: tests/benchmarks/benchmark-results.json (ignorado no git)
 *
 * Este runner é INDEPENDENTE da suíte determinística:
 * - Suporta arquivos SFC (.vue) via pipeline Vitest + @vitejs/plugin-vue
 * - Elimina dependência do loader quebrado tsx
 * - Gera artefato de performance sem sujar arquivos rastreados no Git
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startVitest } from 'vitest/node';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '../..');
const configPath = resolve(rootDir, 'vitest.benchmark.config.ts');

async function main(): Promise<void> {
    console.log('🏃  Iniciando runner funcional de benchmarks temporais via Vitest...\n');

    const vitest = await startVitest('test', ['tests/benchmarks'], {
        config: configPath,
        run: true,
        watch: false
    });

    if (!vitest) {
        console.error('❌  Falha ao iniciar o runner do Vitest para benchmarks.');
        process.exit(1);
    }

    await vitest.close();
}

main().catch((err) => {
    console.error('❌  Benchmark falhou:', err);
    process.exit(1);
});
