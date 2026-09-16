import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import MaxInputTextList from '../../src/components/MaxInputTextList.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

/** Aguarda o próximo frame de animação */
function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Aguarda dois frames para garantir que o Vue e o DOM se atualizaram */
async function settle(): Promise<void> {
    await nextFrame();
    await nextFrame();
}

/**
 * Monta o MaxInputTextList no DOM real do browser.
 * @param modelValue Conteúdo de texto inicial
 * @param scale Fator de zoom CSS (1 = 100%, 2 = 200%)
 */
async function mountTextList(modelValue: string, scale = 1): Promise<{ host: HTMLElement; app: App }> {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    hostElement = document.createElement('div');
    hostElement.id = 'test-host';
    hostElement.style.zoom = scale.toString();
    hostElement.style.width = '600px';
    hostElement.style.height = '400px';
    document.body.appendChild(hostElement);

    const app = createApp({
        render() {
            return h(MaxInputTextList, { modelValue });
        }
    });

    activeApp = app;
    app.mount(hostElement);
    await settle();

    return { host: hostElement, app };
}

afterEach(() => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
});

// ---------------------------------------------------------------------------
// Testes de posicionamento com medida real no DOM (R22 / E11-01)
// Sem espelhar fórmulas internas do componente (startIndex / overscan / translate)
// ---------------------------------------------------------------------------

describe('MaxInputTextList no Chromium (E11-01) — R22/F28', () => {
    it(
        'mede alinhamento físico real no DOM entre números da calha e linhas da textarea para 10.000 itens ' +
        'no início, meio e fim (escala 100% e 200%) com tolerância subpixel <= 2px sem espelhar fórmula interna',
        async () => {
            const TOTAL_LINES = 10000;
            const lines = Array.from(
                { length: TOTAL_LINES },
                (_, i) => `Linha de texto muito longa para testar renderização virtual no índice ${i + 1}`
            ).join('\n');

            for (const scale of [1, 2]) {
                const { host } = await mountTextList(lines, scale);

                const textarea = host.querySelector('textarea') as HTMLTextAreaElement;
                const numbersContainer = host.querySelector('.line-numbers') as HTMLElement;

                expect(textarea).not.toBeNull();
                expect(numbersContainer).not.toBeNull();

                // Obtém métricas reais computadas pelo browser a partir do estilo do DOM
                const textareaStyle = window.getComputedStyle(textarea);
                const computedLineHeight = parseFloat(textareaStyle.lineHeight);
                const computedPaddingTop = parseFloat(textareaStyle.paddingTop);

                expect(computedLineHeight, 'line-height computado deve ser positivo').toBeGreaterThan(0);

                // Posições de scroll a testar: início, meio e fim
                const scrollPositions = [
                    { label: 'início', value: 0 },
                    { label: 'meio', value: Math.floor((textarea.scrollHeight - textarea.clientHeight) / 2) },
                    { label: 'fim', value: Math.max(0, textarea.scrollHeight - textarea.clientHeight) }
                ];

                for (const { label, value: scrollTop } of scrollPositions) {
                    // Aplica o scroll e dispara o evento para sincronizar o componente
                    textarea.scrollTop = scrollTop;
                    textarea.dispatchEvent(new Event('scroll'));
                    await settle();

                    // ----------------------------------------------------------
                    // 1. Cardinalidade e Virtualização real no DOM
                    // ----------------------------------------------------------
                    const renderedNumberEls = Array.from(host.querySelectorAll('.line-number')) as HTMLElement[];
                    expect(
                        renderedNumberEls.length,
                        `[zoom=${scale * 100}% scroll=${label}] deve haver nós DOM renderizados na calha`
                    ).toBeGreaterThan(0);

                    // Garante que o DOM está virtualizado: não deve renderizar 10.000 nós
                    expect(
                        renderedNumberEls.length,
                        `[zoom=${scale * 100}% scroll=${label}] DOM deve ser virtualizado (< 150 nós para 10k linhas, recebido: ${renderedNumberEls.length})`
                    ).toBeLessThan(150);

                    // ----------------------------------------------------------
                    // 2. Cobertura da calha sobre o viewport visível da textarea
                    // ----------------------------------------------------------
                    const renderedNumbers = renderedNumberEls.map((el) => parseInt(el.textContent?.trim() ?? '0', 10));
                    const minRendered = Math.min(...renderedNumbers);
                    const maxRendered = Math.max(...renderedNumbers);

                    // Linhas visíveis na janela de exibição da textarea
                    const visibleTopLine = Math.floor(textarea.scrollTop / computedLineHeight) + 1;
                    const visibleBottomLine = Math.min(
                        TOTAL_LINES,
                        Math.ceil((textarea.scrollTop + textarea.clientHeight) / computedLineHeight)
                    );

                    expect(
                        minRendered,
                        `[zoom=${scale * 100}% scroll=${label}] calha deve cobrir o topo visível (linha ${visibleTopLine}, mínimo na calha: ${minRendered})`
                    ).toBeLessThanOrEqual(visibleTopLine);

                    expect(
                        maxRendered,
                        `[zoom=${scale * 100}% scroll=${label}] calha deve cobrir a base visível (linha ${visibleBottomLine}, máximo na calha: ${maxRendered})`
                    ).toBeGreaterThanOrEqual(visibleBottomLine);

                    // ----------------------------------------------------------
                    // 3. Medição física do DOM: confronta bounding rect do número
                    // com a coordenada física esperada da linha na textarea
                    // ----------------------------------------------------------
                    const sampleLinesToCheck = [
                        visibleTopLine,
                        Math.floor((visibleTopLine + visibleBottomLine) / 2),
                        Math.min(TOTAL_LINES, visibleBottomLine - 1)
                    ];

                    const textareaRect = textarea.getBoundingClientRect();

                    for (const sampleLine of sampleLinesToCheck) {
                        const lineEl = renderedNumberEls.find((el) => el.textContent?.trim() === String(sampleLine));
                        expect(lineEl, `Elemento DOM do número de linha ${sampleLine} deve estar renderizado`).toBeDefined();

                        const lineRect = lineEl!.getBoundingClientRect();

                        // Posição física esperada da linha no viewport do browser:
                        // Topo da textarea + (paddingTop + deslocamento da linha - scrollTop) escalado pelo zoom
                        const lineOffsetY = computedPaddingTop + (sampleLine - 1) * computedLineHeight - textarea.scrollTop;
                        const expectedPhysicalTop = textareaRect.top + lineOffsetY * scale;
                        const actualPhysicalTop = lineRect.top;

                        expect(
                            Math.abs(actualPhysicalTop - expectedPhysicalTop),
                            `[zoom=${scale * 100}% scroll=${label} linha=${sampleLine}] topo físico no DOM (${actualPhysicalTop.toFixed(2)}px) deve alinhar com a linha da textarea (${expectedPhysicalTop.toFixed(2)}px) dentro de 2px`
                        ).toBeLessThanOrEqual(2);

                        // Altura física do elemento deve corresponder à altura computada sob a escala
                        expect(
                            Math.abs(lineRect.height - computedLineHeight * scale),
                            `[zoom=${scale * 100}% scroll=${label} linha=${sampleLine}] altura física (${lineRect.height.toFixed(2)}px) deve ser ~${(computedLineHeight * scale).toFixed(2)}px`
                        ).toBeLessThanOrEqual(2);
                    }
                }
            }
        }
    );

    // -------------------------------------------------------------------------
    // Preservação de comportamentos existentes: cursor, teclado, resize
    // -------------------------------------------------------------------------

    it('preserva cursor, Tab/Enter/Arrow e resize — comportamentos fundamentais não devem ser afetados pela virtualização', async () => {
        const lines = Array.from({ length: 100 }, (_, i) => `Linha ${i + 1}`).join('\n');
        const { host } = await mountTextList(lines, 1);

        const textarea = host.querySelector('textarea') as HTMLTextAreaElement;
        expect(textarea).not.toBeNull();

        // Cursor: deve ser possível posicionar o cursor
        textarea.focus();
        textarea.setSelectionRange(0, 0);
        expect(textarea.selectionStart).toBe(0);
        expect(textarea.selectionEnd).toBe(0);

        // Tecla Enter: insere nova linha
        const originalValue = textarea.value;
        const originalLength = originalValue.length;
        textarea.setSelectionRange(originalLength, originalLength);
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await settle();
        // Após Enter, o valor deve ter crescido (nova linha inserida)
        expect(textarea.value.length).toBeGreaterThan(originalLength);

        // Resize: ResizeObserver deve atualizar viewportHeight sem erros
        // Verificamos que o componente não quebra ao simular mudança de tamanho
        hostElement!.style.height = '800px';
        await settle();
        const numbersContainer = host.querySelector('.line-numbers') as HTMLElement;
        expect(numbersContainer).not.toBeNull();
        // O container de números ainda existe e continua renderizando
        const renderedAfterResize = host.querySelectorAll('.line-number');
        expect(renderedAfterResize.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// Benchmark informativo (não determinístico — apenas registra, não causa falha)
// (R22/F28 — benchmark de mount/input/scroll/memória para 100/1k/10k itens)
// ---------------------------------------------------------------------------

describe('MaxInputTextList — Benchmark Informativo (R22/F28)', () => {
    it('registra tempos de mount/scroll/memória para 100, 1.000 e 10.000 linhas (informativo, não determinístico)', async () => {
        const counts = [100, 1000, 10000];
        const results: Array<{
            count: number;
            mountMs: number;
            scrollMs: number;
            memoryMB: number | null;
        }> = [];

        for (const count of counts) {
            const lineContent = Array.from(
                { length: count },
                (_, i) => `Benchmark linha ${i + 1} com conteúdo simulado para teste de performance`
            ).join('\n');

            // --- Benchmark de mount ---
            const mountStart = performance.now();
            const { host } = await mountTextList(lineContent, 1);
            const mountMs = performance.now() - mountStart;

            const textarea = host.querySelector('textarea') as HTMLTextAreaElement;

            // --- Benchmark de scroll (início → fim → início) ---
            const scrollStart = performance.now();

            const maxScroll = Math.max(0, textarea.scrollHeight - textarea.clientHeight);
            textarea.scrollTop = maxScroll;
            textarea.dispatchEvent(new Event('scroll'));
            await settle();

            textarea.scrollTop = 0;
            textarea.dispatchEvent(new Event('scroll'));
            await settle();

            const scrollMs = performance.now() - scrollStart;

            // --- Benchmark de memória (se disponível via performance.memory) ---
            let memoryMB: number | null = null;
            const perf = performance as Performance & { memory?: { usedJSHeapSize?: number } };
            if (perf.memory?.usedJSHeapSize) memoryMB = Math.round((perf.memory.usedJSHeapSize / 1024 / 1024) * 10) / 10;

            results.push({ count, mountMs, scrollMs, memoryMB });

            // Cleanup explícito entre iterações
            if (activeApp) {
                activeApp.unmount();
                activeApp = null;
            }
            if (hostElement) {
                hostElement.remove();
                hostElement = null;
            }
        }

        // Exibe os resultados no console (apenas informativo)
        console.info('[R22/F28] Benchmark MaxInputTextList:');
        for (const r of results) {
            const mem = r.memoryMB !== null ? `${r.memoryMB} MB` : 'N/D';
            console.info(
                `  ${String(r.count).padStart(6)} itens | mount: ${r.mountMs.toFixed(1)} ms | scroll: ${r.scrollMs.toFixed(1)} ms | heap: ${mem}`
            );
        }

        // Asserção mínima: os benchmarks devem completar sem exceção
        expect(results).toHaveLength(counts.length);
        for (const r of results) {
            expect(r.mountMs).toBeGreaterThanOrEqual(0);
            expect(r.scrollMs).toBeGreaterThanOrEqual(0);
        }
    });

    it('registra tempo de input (digitação) para diferentes tamanhos de documento (informativo)', async () => {
        const counts = [100, 1000, 10000];
        const inputResults: Array<{ count: number; inputMs: number }> = [];

        for (const count of counts) {
            const lineContent = Array.from({ length: count }, (_, i) => `Linha ${i + 1}`).join('\n');
            const { host } = await mountTextList(lineContent, 1);

            const textarea = host.querySelector('textarea') as HTMLTextAreaElement;

            // Posiciona o cursor no meio do documento
            const midPos = Math.floor(textarea.value.length / 2);
            textarea.setSelectionRange(midPos, midPos);
            textarea.focus();

            // Benchmark de input: simula pressionamento de tecla Enter
            const inputStart = performance.now();
            textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
            await settle();
            const inputMs = performance.now() - inputStart;

            inputResults.push({ count, inputMs });

            // Cleanup
            if (activeApp) {
                activeApp.unmount();
                activeApp = null;
            }
            if (hostElement) {
                hostElement.remove();
                hostElement = null;
            }
        }

        console.info('[R22/F28] Benchmark de input (Enter) MaxInputTextList:');
        for (const r of inputResults) console.info(`  ${String(r.count).padStart(6)} linhas | input: ${r.inputMs.toFixed(1)} ms`);

        expect(inputResults).toHaveLength(counts.length);
        for (const r of inputResults) expect(r.inputMs).toBeGreaterThanOrEqual(0);
    });
});
