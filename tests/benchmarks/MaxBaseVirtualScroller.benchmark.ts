/**
 * Benchmark Temporal — MaxBaseVirtualScroller
 *
 * Executado separadamente da suíte determinística via:
 *   npx tsx tests/benchmarks/run-benchmarks.ts
 *
 * Produz artefato JSON comparável em:
 *   tests/benchmarks/benchmark-results.json
 *
 * NÃO usa `expect(duration).toBeLessThan(...)` pois medições
 * de tempo têm variação natural e não devem bloquear a CI.
 */

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import MaxBaseVirtualScroller from '../../src/components/base/MaxBaseVirtualScroller.vue';

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function makeItems(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `item-${i}`);
}

function stubViewport(el: HTMLElement, height: number): void {
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
    el.getBoundingClientRect = () => ({
        top: 0, left: 0, right: 0, bottom: height, width: 300, height, x: 0, y: 0,
        toJSON: () => ({})
    } as DOMRect);
}

async function settle(): Promise<void> {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
    await nextTick();
}

// ---------------------------------------------------------------------------
// Tipos do artefato de resultado
// ---------------------------------------------------------------------------

export interface BenchmarkMetric {
    /** Cardinalidade da lista testada */
    cardinality: number;
    /** Fase do ciclo de vida medida */
    phase: 'mount' | 'input' | 'scroll' | 'cleanup';
    /** Tempo em milissegundos */
    durationMs: number;
    /** Número de iterações executadas para calcular a média */
    iterations: number;
    /** Média de tempo por iteração */
    avgMs: number;
}

export interface BenchmarkResult {
    timestamp: string;
    component: string;
    vitestVersion: string;
    nodeVersion: string;
    metrics: BenchmarkMetric[];
}

// ---------------------------------------------------------------------------
// Funções de medição por fase
// ---------------------------------------------------------------------------

/**
 * Mede o tempo de montagem do MaxBaseVirtualScroller com N itens.
 */
async function medirMount(count: number, iterations = 3): Promise<BenchmarkMetric> {
    const tempos: number[] = [];

    for (let i = 0; i < iterations; i++) {
        setActivePinia(createPinia());
        const inicio = performance.now();

        const wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(count), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item">{{ params?.item }}</div>' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        tempos.push(performance.now() - inicio);
        wrapper.unmount();
    }

    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return {
        cardinality: count,
        phase: 'mount',
        durationMs: tempos[tempos.length - 1],
        iterations,
        avgMs: Number(media.toFixed(3))
    };
}

/**
 * Mede o tempo de reatividade ao atualizar `items` (equivalente a "input").
 * Substitui a lista por uma nova lista do mesmo tamanho, forçando re-render.
 */
async function medirInput(count: number, iterations = 3): Promise<BenchmarkMetric> {
    const tempos: number[] = [];

    setActivePinia(createPinia());
    const wrapper = mount(MaxBaseVirtualScroller, {
        props: { items: makeItems(count), itemSize: 40, style: { height: '400px' } },
        slots: { item: '<div class="row-item" />' }
    });
    stubViewport(wrapper.element as HTMLElement, 400);
    await settle();

    for (let i = 0; i < iterations; i++) {
        const inicio = performance.now();

        // Troca a lista completa (simula "input"/atualização de coleção)
        const novosBatch = makeItems(count).map((item) => `novo-${item}`);
        await wrapper.setProps({ items: novosBatch });
        await settle();

        tempos.push(performance.now() - inicio);
    }

    wrapper.unmount();

    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return {
        cardinality: count,
        phase: 'input',
        durationMs: tempos[tempos.length - 1],
        iterations,
        avgMs: Number(media.toFixed(3))
    };
}

/**
 * Mede o tempo de resposta ao evento de scroll (atualização de janela virtual).
 */
async function medirScroll(count: number, iterations = 3): Promise<BenchmarkMetric> {
    const tempos: number[] = [];

    setActivePinia(createPinia());
    const wrapper = mount(MaxBaseVirtualScroller, {
        props: { items: makeItems(count), itemSize: 40, style: { height: '400px' } },
        slots: { item: '<div class="row-item" />' }
    });
    const el = wrapper.element as HTMLElement;
    stubViewport(el, 400);
    await settle();

    const posicoes = [0, 500, 1000, 2000, 4000];
    let posIdx = 0;

    for (let i = 0; i < iterations; i++) {
        const posAlvo = posicoes[posIdx++ % posicoes.length];
        const inicio = performance.now();

        el.scrollTop = posAlvo;
        el.dispatchEvent(new Event('scroll'));
        await settle();

        tempos.push(performance.now() - inicio);
    }

    wrapper.unmount();

    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return {
        cardinality: count,
        phase: 'scroll',
        durationMs: tempos[tempos.length - 1],
        iterations,
        avgMs: Number(media.toFixed(3))
    };
}

/**
 * Mede o tempo de desmontagem e cleanup (incluindo remoção de listeners).
 */
async function medirCleanup(count: number, iterations = 3): Promise<BenchmarkMetric> {
    const tempos: number[] = [];

    for (let i = 0; i < iterations; i++) {
        setActivePinia(createPinia());
        const wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(count), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        const inicio = performance.now();
        wrapper.unmount();
        tempos.push(performance.now() - inicio);
    }

    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return {
        cardinality: count,
        phase: 'cleanup',
        durationMs: tempos[tempos.length - 1],
        iterations,
        avgMs: Number(media.toFixed(3))
    };
}

// ---------------------------------------------------------------------------
// Executor principal — exportado para uso pelo runner
// ---------------------------------------------------------------------------

/** Cardinalidades cobertas pelo benchmark (conforme R22/F28 e R23/F28A) */
export const CARDINALITIES = [100, 1000, 10000] as const;

/**
 * Executa todos os benchmarks de fase × cardinalidade e retorna o resultado
 * estruturado pronto para serialização em JSON.
 */
export async function executarBenchmarks(): Promise<BenchmarkResult> {
    const metricas: BenchmarkMetric[] = [];

    for (const count of CARDINALITIES) {
        metricas.push(await medirMount(count));
        metricas.push(await medirInput(count));
        metricas.push(await medirScroll(count));
        metricas.push(await medirCleanup(count));
    }

    return {
        timestamp: new Date().toISOString(),
        component: 'MaxBaseVirtualScroller',
        vitestVersion: '4.x',
        nodeVersion: process.version,
        metrics: metricas
    };
}

import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('Benchmark Temporal — MaxBaseVirtualScroller (R23 / E11-02)', () => {
    it('executa medição de performance em 100, 1000 e 10000 itens gerando benchmark-results.json', async () => {
        const resultado = await executarBenchmarks();
        expect(resultado.metrics.length).toBe(12);

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const caminhoSaida = join(__dirname, 'benchmark-results.json');
        mkdirSync(dirname(caminhoSaida), { recursive: true });
        writeFileSync(caminhoSaida, JSON.stringify(resultado, null, 2), 'utf-8');

        expect(resultado.component).toBe('MaxBaseVirtualScroller');
    }, 60000);
});
