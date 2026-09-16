/**
 * Runner de Benchmarks Temporais — MaxBaseVirtualScroller
 *
 * Execução:
 *   npx tsx tests/benchmarks/run-benchmarks.ts
 *   node --import tsx/esm tests/benchmarks/run-benchmarks.ts
 *
 * Produz: tests/benchmarks/benchmark-results.json
 *
 * Este script é INDEPENDENTE da suíte Vitest determinística:
 * - Não bloqueia a CI principal
 * - Gera artefato comparável entre execuções (baseline vs. PR)
 * - Aceita variação natural sem falhar o build
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BenchmarkResult } from './MaxBaseVirtualScroller.benchmark';

// ---------------------------------------------------------------------------
// Bootstrap mínimo de ambiente DOM (happy-dom) para execução fora do Vitest
// ---------------------------------------------------------------------------
async function bootstrapDom(): Promise<void> {
    const { Window } = await import('happy-dom');
    const win = new Window({ url: 'about:blank' });

    // Copia construtores e propriedades do window do happy-dom para globalThis
    const winObj = win as unknown as Record<string, unknown>;
    for (const key of Object.getOwnPropertyNames(winObj)) {
        if (key in globalThis) continue;
        try {
            const desc = Object.getOwnPropertyDescriptor(winObj, key);
            if (desc) Object.defineProperty(globalThis, key, desc);
        } catch {
            // ignora propriedades restritas
        }
    }

    const globals: Record<string, unknown> = {
        window: win,
        document: win.document,
        navigator: win.navigator,
        performance: win.performance,
        Event: win.Event,
        Node: win.Node,
        Element: win.Element,
        HTMLElement: win.HTMLElement,
        SVGElement: win.SVGElement,
        customElements: win.customElements
    };

    for (const [key, value] of Object.entries(globals)) try {
        Object.defineProperty(globalThis, key, {
            value,
            writable: true,
            configurable: true
        });
    } catch {
        (globalThis as Record<string, unknown>)[key] = value;
    }

}

// ---------------------------------------------------------------------------
// Utilitários de saída
// ---------------------------------------------------------------------------

function formatarTabela(resultado: BenchmarkResult): void {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  Benchmark: ${resultado.component}`);
    console.log(`  Horário:   ${resultado.timestamp}`);
    console.log(`  Node:      ${resultado.nodeVersion}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Cardinalidade │ Fase     │ Média (ms) │ Última (ms)');
    console.log('  ─────────────┼──────────┼────────────┼────────────');

    for (const m of resultado.metrics) {
        const card = String(m.cardinality).padStart(12, ' ');
        const fase = m.phase.padEnd(8, ' ');
        const media = String(m.avgMs).padStart(11, ' ');
        const duracao = String(m.durationMs.toFixed(3)).padStart(11, ' ');
        console.log(`  ${card} │ ${fase} │ ${media} │ ${duracao}`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
}

function salvarArtefato(resultado: BenchmarkResult, caminhoSaida: string): void {
    mkdirSync(dirname(caminhoSaida), { recursive: true });
    writeFileSync(caminhoSaida, JSON.stringify(resultado, null, 4), 'utf-8');
    console.log(`✅  Artefato salvo em: ${caminhoSaida}`);
}

// ---------------------------------------------------------------------------
// Ponto de entrada
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    console.log('🏃  Iniciando benchmarks temporais de MaxBaseVirtualScroller...\n');

    await bootstrapDom();

    const { createPinia, setActivePinia } = await import('pinia');
    setActivePinia(createPinia());

    const { executarBenchmarks } = await import('./MaxBaseVirtualScroller.benchmark');
    const resultado = await executarBenchmarks();

    formatarTabela(resultado);

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const caminhoSaida = join(__dirname, 'benchmark-results.json');
    salvarArtefato(resultado, caminhoSaida);
}

main().catch((err) => {
    console.error('❌  Benchmark falhou:', err);
    process.exit(1);
});
