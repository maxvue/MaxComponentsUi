import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import MaxInputTextList from '../../src/components/MaxInputTextList.vue';
import { installBrowserTestApp } from './bootstrap';

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
    installBrowserTestApp(app);

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

/**
 * Cria uma régua DOM independente das fórmulas do componente. Cada span é a
 * linha correspondente do textarea, com tipografia/padding copiados do DOM
 * computado. Assim o teste compara retângulos reais de cada número renderizado
 * com a sua linha, em vez de repetir translateY/startIndex da implementação.
 */
function createLineReference(textarea: HTMLTextAreaElement, totalLines: number): HTMLElement {
    const editor = textarea.parentElement as HTMLElement;
    const textareaStyle = getComputedStyle(textarea);
    const editorStyle = getComputedStyle(editor);
    const reference = document.createElement('div');
    const content = document.createElement('div');

    reference.className = 'text-list-dom-reference';
    reference.setAttribute('aria-hidden', 'true');
    Object.assign(reference.style, {
        position: 'absolute',
        top: `${textarea.offsetTop}px`,
        left: `${textarea.offsetLeft}px`,
        width: `${textarea.offsetWidth}px`,
        height: `${textarea.offsetHeight}px`,
        overflow: 'hidden',
        boxSizing: 'border-box',
        paddingTop: textareaStyle.paddingTop,
        paddingRight: textareaStyle.paddingRight,
        paddingBottom: textareaStyle.paddingBottom,
        paddingLeft: textareaStyle.paddingLeft,
        fontFamily: textareaStyle.fontFamily,
        fontSize: textareaStyle.fontSize,
        lineHeight: textareaStyle.lineHeight,
        whiteSpace: 'pre',
        visibility: 'hidden',
        pointerEvents: 'none'
    });
    content.className = 'text-list-dom-reference-content';
    reference.appendChild(content);

    for (let line = 1; line <= totalLines; line++) {
        const row = document.createElement('span');
        row.dataset.line = String(line);
        row.textContent = 'M';
        Object.assign(row.style, {
            display: 'block',
            height: textareaStyle.lineHeight,
            lineHeight: textareaStyle.lineHeight
        });
        content.appendChild(row);
    }

    // O editor não possui posicionamento próprio; torná-lo containing block
    // somente no fixture mantém a régua no mesmo sistema de coordenadas, mesmo
    // sob CSS zoom.
    if (editorStyle.position === 'static') editor.style.position = 'relative';
    editor.appendChild(reference);
    return reference;
}

function syncLineReference(reference: HTMLElement, scrollTop: number): void {
    const content = reference.querySelector<HTMLElement>('.text-list-dom-reference-content');
    if (content) content.style.transform = `translateY(${-scrollTop}px)`;
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

                expect(textarea).not.toBeNull();
                expect(numbersContainer).not.toBeNull();
                const reference = createLineReference(textarea, TOTAL_LINES);

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
                    syncLineReference(reference, scrollTop);
                    await settle();

                    const renderedNumbers = host.querySelectorAll('.line-number');
                    expect(renderedNumbers.length, `[zoom=${scale * 100}% scroll=${label}] deve haver números de linha renderizados`).toBeGreaterThan(0);

                    // Cada número visível é confrontado com a linha DOM de mesmo
                    // número na régua independente. Não há cálculo de offset,
                    // altura ou índice que replique a implementação.
                    for (const numberElement of renderedNumbers) {
                        const line = Number(numberElement.textContent);
                        const referenceLine = reference.querySelector<HTMLElement>(`[data-line="${line}"]`);
                        expect(referenceLine, `[zoom=${scale * 100}% scroll=${label}] linha DOM ${line} deve existir`).not.toBeNull();

                        const numberRect = (numberElement as HTMLElement).getBoundingClientRect();
                        const lineRect = referenceLine!.getBoundingClientRect();
                        expect(
                            Math.abs(numberRect.top - lineRect.top),
                            `[zoom=${scale * 100}% scroll=${label}] número ${line} deve alinhar à linha DOM correspondente`
                        ).toBeLessThanOrEqual(1);
                        expect(
                            Math.abs(numberRect.height - lineRect.height),
                            `[zoom=${scale * 100}% scroll=${label}] número ${line} deve ter a altura da linha DOM correspondente`
                        ).toBeLessThanOrEqual(1);
                    }
                }

                reference.remove();
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

        // Tab continua a indentar e reposiciona o cursor; setas não são
        // interceptadas pelo editor e permanecem disponíveis nativamente.
        const beforeTab = textarea.selectionStart;
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
        await settle();
        expect(textarea.selectionStart).toBe(beforeTab + 4);
        expect(textarea.selectionEnd).toBe(beforeTab + 4);
        const arrow = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
        expect(textarea.dispatchEvent(arrow)).toBe(true);
        expect(arrow.defaultPrevented).toBe(false);

        // ResizeObserver deve manter a viewport da calha igual à do textarea.
        textarea.style.height = '120px';
        await settle();
        const numbersContainer = host.querySelector('.line-numbers') as HTMLElement;
        expect(numbersContainer).not.toBeNull();
        expect(numbersContainer.clientHeight).toBe(textarea.clientHeight);
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
