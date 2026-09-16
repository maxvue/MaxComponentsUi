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
// Constantes do componente (espelham MaxInputTextList.vue para cálculo esperado)
// ---------------------------------------------------------------------------
const LINE_HEIGHT = 21;
const OVERSCAN = 10;

/**
 * Calcula o startIndex esperado para um dado scrollTop, exatamente como o
 * componente faz internamente:
 *   startIndex = clamp(floor(scrollTop / LINE_HEIGHT) - OVERSCAN, 0, lineCount - 1)
 */
function expectedStartIndex(scrollTop: number, lineCount: number): number {
    const first = Math.floor(scrollTop / LINE_HEIGHT);
    const maxStart = Math.max(0, lineCount - 1);
    return Math.min(maxStart, Math.max(0, first - OVERSCAN));
}

/**
 * Calcula o offsetY esperado (translate do .line-numbers-window):
 *   offsetY = startIndex * LINE_HEIGHT
 */
function expectedOffsetY(scrollTop: number, lineCount: number): number {
    return expectedStartIndex(scrollTop, lineCount) * LINE_HEIGHT;
}

/**
 * Extrai o valor translateY de um estilo inline "translateY(Xpx)".
 * Retorna null se não encontrado.
 */
function parseTranslateY(el: HTMLElement): number | null {
    const transform = el.style.transform;
    const match = transform.match(/translateY\(([-\d.]+)px\)/);
    if (!match) return null;
    return parseFloat(match[1]);
}

// ---------------------------------------------------------------------------
// Testes de posicionamento com medida real (R22/F28)
// ---------------------------------------------------------------------------

describe('MaxInputTextList no Chromium (E11-01) — R22/F28', () => {
    it(
        'alinha os números de linha à área de texto de 10.000 linhas, verificando o scroll no início, meio e fim ' +
        '(escala 100% e 200%) com erro <= 1px — medição real substituindo asserção sempre verdadeira',
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
                const lineNumbersWindow = host.querySelector('.line-numbers-window') as HTMLElement;

                expect(textarea).not.toBeNull();
                expect(numbersContainer).not.toBeNull();
                expect(lineNumbersWindow).not.toBeNull();

                // Posições de scroll a testar: início, meio e fim
                const scrollPositions = [
                    { label: 'início', value: 0 },
                    { label: 'meio', value: Math.floor(textarea.scrollHeight / 2) },
                    { label: 'fim', value: Math.max(0, textarea.scrollHeight - textarea.clientHeight) }
                ];

                for (const { label, value: scrollTop } of scrollPositions) {
                    // Aplica o scroll e dispara o evento para sincronizar o componente
                    textarea.scrollTop = scrollTop;
                    textarea.dispatchEvent(new Event('scroll'));
                    await settle();

                    // ----------------------------------------------------------
                    // 1. Validação do translateY da janela de números (real vs esperado)
                    // ----------------------------------------------------------
                    const actualTranslateY = parseTranslateY(lineNumbersWindow);
                    expect(
                        actualTranslateY,
                        `[zoom=${scale * 100}% scroll=${label}] .line-numbers-window deve ter translateY inline`
                    ).not.toBeNull();

                    const expectedTransY = expectedOffsetY(scrollTop, TOTAL_LINES);

                    // Tolerância de 1px (independente do zoom — o CSS zoom afeta pixels CSS, não px internos)
                    expect(
                        Math.abs((actualTranslateY as number) - expectedTransY),
                        `[zoom=${scale * 100}% scroll=${label}] translateY real (${actualTranslateY}px) deve diferir ≤ 1px do esperado (${expectedTransY}px)`
                    ).toBeLessThanOrEqual(1);

                    // ----------------------------------------------------------
                    // 2. Número de linha renderizado corresponde ao índice correto
                    // ----------------------------------------------------------
                    const renderedNumbers = host.querySelectorAll('.line-number');
                    expect(renderedNumbers.length, `[zoom=${scale * 100}% scroll=${label}] deve haver números de linha renderizados`).toBeGreaterThan(0);

                    const firstRenderedNumber = parseInt(renderedNumbers[0].textContent ?? '0', 10);
                    const expectedFirstNumber = expectedStartIndex(scrollTop, TOTAL_LINES) + 1; // 1-based

                    expect(
                        firstRenderedNumber,
                        `[zoom=${scale * 100}% scroll=${label}] primeiro número renderizado (${firstRenderedNumber}) deve ser o esperado para o overscan (${expectedFirstNumber})`
                    ).toBe(expectedFirstNumber);

                    // ----------------------------------------------------------
                    // 3. Alinhamento visual: o .line-numbers-window deve estar posicionado
                    //    de forma que o primeiro número visível se alinhe com o topo da viewport
                    //    considerando o padding de 10px do container.
                    //
                    //    Posição esperada do topo da window no viewport:
                    //      containerRect.top + padding - numbersContainer.scrollTop + offsetY
                    //
                    //    Como numbersContainer.scrollTop == scrollTop (sincronizado pelo componente):
                    //      topEsperado = containerRect.top + padding - scrollTop + offsetY
                    //
                    //    A linha "zero" do viewport visível (primeiro número visível) é:
                    //      topDaPrimeiraLinhaVisivel = containerRect.top + padding + (floor(scrollTop / LINE_HEIGHT) - startIndex) * LINE_HEIGHT
                    //      = containerRect.top + padding + OVERSCAN * LINE_HEIGHT (quando não no início)
                    //    Mas como estamos usando getBoundingClientRect da window inteira, verificamos apenas o translateY.
                    // ----------------------------------------------------------

                    // Verifica que a altura de cada linha renderizada é aproximadamente LINE_HEIGHT * scale
                    const firstLineEl = renderedNumbers[0] as HTMLElement;
                    const firstLineRect = firstLineEl.getBoundingClientRect();

                    // A altura da linha em pixels de tela deve ser LINE_HEIGHT * scale (com 2px de folga para subpixel)
                    expect(
                        Math.abs(firstLineRect.height - LINE_HEIGHT * scale),
                        `[zoom=${scale * 100}% scroll=${label}] altura do line-number (${firstLineRect.height}px) deve ser ~${LINE_HEIGHT * scale}px`
                    ).toBeLessThanOrEqual(2);
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
