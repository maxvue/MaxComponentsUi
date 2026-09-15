import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { executarEGravarBenchmarks } from './run-benchmarks';

const artefato = join(import.meta.dirname, 'benchmark-results.json');

beforeEach(() => {
    rmSync(artefato, { force: true });
});

describe('runner de benchmark', () => {
    it('gera um artefato JSON comparável usando o transformador Vue do Vitest', async () => {
        await executarEGravarBenchmarks();

        expect(existsSync(artefato)).toBe(true);

        const resultado = JSON.parse(readFileSync(artefato, 'utf-8')) as {
            component: string;
            metrics: unknown[];
        };
        expect(resultado.component).toBe('MaxBaseVirtualScroller');
        expect(resultado.metrics).toHaveLength(12);
    }, 60_000);
});
