import { describe, it, expect, afterEach, vi } from 'vitest';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxImage from '../../src/components/MaxImage.vue';
import type { MaxImageEditPayload } from '../../src/types/image';
import '../../src/themes/tokens.scss';
import '../../src/themes/params.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;
const objectUrlsToClean: string[] = [];

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 5): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();
}

/**
 * Cria uma imagem raster real (BMP 1-bit não comprimido) em alta resolução (48 MP = 8000x6000).
 * O browser decodifica nativamente naturalWidth=8000 e naturalHeight=6000 a partir de um bitmap real,
 * não a partir de vetores SVG.
 */
function create48MpImageBlobUrl(): string {
    const width = 8000;
    const height = 6000;
    const rowBytes = Math.ceil(width / 32) * 4;
    const pixelBytes = rowBytes * height;
    const totalSize = 14 + 40 + 8 + pixelBytes;

    const u8 = new Uint8Array(totalSize);
    const view = new DataView(u8.buffer);

    // Cabeçalho de arquivo BMP (14 bytes)
    u8[0] = 0x42; // 'B'
    u8[1] = 0x4D; // 'M'
    view.setUint32(2, totalSize, true); // Tamanho total do arquivo
    view.setUint32(6, 0, true); // Reservado
    view.setUint32(10, 62, true); // Offset para os dados de pixels (14 + 40 + 8)

    // Cabeçalho DIB BITMAPINFOHEADER (40 bytes)
    view.setUint32(14, 40, true); // Tamanho do cabeçalho DIB
    view.setInt32(18, width, true); // Largura: 8000 px
    view.setInt32(22, height, true); // Altura: 6000 px (bottom-up)
    view.setUint16(26, 1, true); // Planos de cor: 1
    view.setUint16(28, 1, true); // Bits por pixel: 1 (monocromático / paleta indexada de 2 cores)
    view.setUint32(30, 0, true); // Compressão: BI_RGB (sem compressão)
    view.setUint32(34, pixelBytes, true); // Tamanho da imagem em bytes
    view.setInt32(38, 2835, true); // Resolução horizontal (72 DPI)
    view.setInt32(42, 2835, true); // Resolução vertical (72 DPI)
    view.setUint32(46, 2, true); // Número de cores na paleta: 2
    view.setUint32(50, 0, true); // Cores importantes: todas

    // Tabela de Cores (Paleta de 2 cores, 4 bytes cada: B, G, R, reservado)
    // Cor 0: #00768E (Teal Max)
    u8[54] = 0x8E; // B
    u8[55] = 0x76; // G
    u8[56] = 0x00; // R
    u8[57] = 0x00;

    // Cor 1: #FFFFFF (Branco)
    u8[58] = 0xFF; // B
    u8[59] = 0xFF; // G
    u8[60] = 0xFF; // R
    u8[61] = 0x00;

    // Dados de pixels do bitmap raster real: preenche padrão gráfico nas linhas centrais
    for (let y = 1500; y < 4500; y++) {
        const rowStart = 62 + y * rowBytes;
        u8.fill(0xFF, rowStart + 250, rowStart + 750);
    }

    const blob = new Blob([u8], { type: 'image/bmp' });
    const url = URL.createObjectURL(blob);
    objectUrlsToClean.push(url);
    return url;
}

interface MountOptions {
    props?: Record<string, unknown>;
    onCrop?: (payload: MaxImageEditPayload) => void;
    onEdit?: (payload: MaxImageEditPayload) => void;
}

async function mountImage(options: MountOptions = {}) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    hostElement = document.createElement('div');
    hostElement.id = 'image-test-host';
    hostElement.style.width = '600px';
    hostElement.style.padding = '20px';
    document.body.appendChild(hostElement);

    const pinia = createPinia();
    const imageRef = ref<any>(null);
    const reactiveProps = ref({
        src: create48MpImageBlobUrl(),
        preview: true,
        allowEdit: true,
        ...options.props
    });

    const app = createApp({
        setup() {
            return { imageRef, reactiveProps };
        },
        render() {
            return h(MaxImage, {
                ref: 'imageRef',
                ...reactiveProps.value,
                onCrop: (payload: MaxImageEditPayload) => {
                    options.onCrop?.(payload);
                },
                onEdit: (payload: MaxImageEditPayload) => {
                    options.onEdit?.(payload);
                }
            });
        }
    });

    app.use(pinia);
    app.directive('tooltip', () => {});
    activeApp = app;
    app.mount(hostElement);

    await waitTicks(5);

    return {
        host: hostElement,
        imageRef,
        props: reactiveProps,
        app
    };
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
    while (objectUrlsToClean.length > 0) {
        const u = objectUrlsToClean.pop();
        if (u) URL.revokeObjectURL(u);
    }
    document.querySelectorAll('.max-image-modal').forEach((el) => el.remove());
});

describe('MaxImage no Chromium Real — Performance de Recorte em Alta Resolução (F18)', () => {
    it('executa 5 amostras de recorte de imagem raster real de 48 MP com canvas real, downscale proporcional, zero toDataURL e orçamentos estritos de tempo, heap e Long Tasks', async () => {
        interface SampleMetric {
            sample: number;
            duration: number;
            initialHeapMiB: number;
            finalHeapMiB: number;
            heapDeltaMiB: number;
            heapDelta: number;
            maxLongTask: number;
            eventLoopTicks: number;
            width: number;
            height: number;
            blobSizeBytes: number;
        }

        const samples: SampleMetric[] = [];
        const TOTAL_SAMPLES = 5;

        for (let s = 1; s <= TOTAL_SAMPLES; s++) {
            let emittedCropPayload: MaxImageEditPayload | null = null;

            const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
            const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');

            // Configuração de observação de Long Tasks (se suportado no Chromium)
            const longTasks: PerformanceEntry[] = [];
            let observer: PerformanceObserver | null = null;
            try {
                if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
                    observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) longTasks.push(entry);
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                }
            } catch {
                // Ambiente sem longtask nativo
            }

            const { host, imageRef } = await mountImage({
                props: {
                    maxCropWidth: 4096,
                    maxCropHeight: 4096,
                    maxCropPixels: 16777216, // 16 MP máximo
                    includeDataUrl: false
                },
                onCrop: (payload) => {
                    emittedCropPayload = payload;
                }
            });

            // 1. Abre o preview da imagem
            const triggerImg = host.querySelector('.max-image__preview-trigger') as HTMLImageElement;
            expect(triggerImg).toBeTruthy();
            triggerImg.click();
            await waitTicks(5);

            const modal = document.querySelector('.max-image-modal') as HTMLElement;
            expect(modal).toBeTruthy();

            // 2. Inicia o modo de recorte
            imageRef.value.startCrop();
            await waitTicks(10);

            const cropImg = modal.querySelector('.max-image-crop-stage__img') as HTMLImageElement;
            expect(cropImg).toBeTruthy();

            // Espera a imagem raster carregar completamente e confirmar dimensões reais de 48 MP
            if (!cropImg.complete) await new Promise((res) => {
                cropImg.onload = res;
            });

            await waitTicks(5);

            // Verifica que o navegador carregou o bitmap raster real de 48 MP (8000x6000)
            expect(cropImg.naturalWidth).toBe(8000);
            expect(cropImg.naturalHeight).toBe(6000);

            // 3. Mede o tempo gasto na operação confirmCrop e variação de heap no Chromium
            toBlobSpy.mockClear();
            toDataUrlSpy.mockClear();

            const initialHeap = (performance as any).memory?.usedJSHeapSize ?? 0;
            // Garante compulsoriamente medição de heap no Chromium (métrica ausente reprova)
            expect(initialHeap).toBeGreaterThan(0);

            const startTime = performance.now();

            // Monitor de responsividade da main thread (prova NÃO TAUTOLÓGICA)
            let eventLoopTicks = 0;
            const freezeTimer = setInterval(() => {
                eventLoopTicks++;
            }, 25);

            await imageRef.value.confirmCrop();
            clearInterval(freezeTimer);

            const duration = performance.now() - startTime;
            const finalHeap = (performance as any).memory?.usedJSHeapSize ?? 0;
            expect(finalHeap).toBeGreaterThan(0);

            const heapDelta = finalHeap > initialHeap ? finalHeap - initialHeap : 0;

            // Desconecta observador de Long Tasks
            if (observer) observer.disconnect();

            // Prova NÃO TAUTOLÓGICA de responsividade:
            // A thread principal não esteve congelada durante o processamento assíncrono
            // O timer de 25ms disparou ao menos 1 vez durante o ciclo
            expect(eventLoopTicks).toBeGreaterThan(0);

            // 4. Orçamentos individuais por amostra
            expect(duration).toBeLessThan(1500);
            expect(heapDelta).toBeLessThan(80 * 1024 * 1024);

            let maxLongTask = 0;
            for (const task of longTasks) {
                if (task.duration > maxLongTask) maxLongTask = task.duration;
                expect(task.duration).toBeLessThan(1200);
            }

            // 5. Verifica que o payload foi emitido e respeita estritamente os limites
            expect(emittedCropPayload).toBeTruthy();
            const payload = emittedCropPayload!;

            // Blob e File válidos e não nulos
            expect(payload.blob).toBeInstanceOf(Blob);
            expect(payload.blob.size).toBeGreaterThan(0);
            expect(payload.file).toBeInstanceOf(File);
            expect(payload.file.size).toBeGreaterThan(0);

            // Dimensões do canvas final: aplicou downscale proporcional
            expect(payload.width).toBeLessThanOrEqual(4096);
            expect(payload.height).toBeLessThanOrEqual(4096);
            expect(payload.width * payload.height).toBeLessThanOrEqual(16777216);

            // Proporção preservada (8000:6000 = 1.3333)
            const originalRatio = 8000 / 6000;
            const resultRatio = payload.width / payload.height;
            expect(Math.abs(resultRatio - originalRatio)).toBeLessThan(0.05);

            // 6. Zero chamadas a toDataURL por padrão e exatamente UMA chamada a toBlob
            expect(toDataUrlSpy).not.toHaveBeenCalled();
            expect(toBlobSpy).toHaveBeenCalledTimes(1);

            // 7. dataUrl é undefined quando includeDataUrl for false
            expect(payload.dataUrl).toBeUndefined();

            samples.push({
                sample: s,
                duration,
                initialHeapMiB: +(initialHeap / 1024 / 1024).toFixed(2),
                finalHeapMiB: +(finalHeap / 1024 / 1024).toFixed(2),
                heapDeltaMiB: +(heapDelta / 1024 / 1024).toFixed(2),
                heapDelta,
                maxLongTask,
                eventLoopTicks,
                width: payload.width,
                height: payload.height,
                blobSizeBytes: payload.blob.size
            });

            toDataUrlSpy.mockRestore();
            toBlobSpy.mockRestore();
        }

        // Estatísticas das 5 amostras
        expect(samples).toHaveLength(TOTAL_SAMPLES);

        const durations = samples.map((s) => s.duration).sort((a, b) => a - b);
        const heapDeltas = samples.map((s) => s.heapDelta).sort((a, b) => a - b);
        const longTasksList = samples.map((s) => s.maxLongTask).sort((a, b) => a - b);

        const medianDuration = durations[Math.floor(durations.length / 2)];
        const worstDuration = durations[durations.length - 1];
        const medianHeapDelta = heapDeltas[Math.floor(heapDeltas.length / 2)];
        const worstHeapDelta = heapDeltas[heapDeltas.length - 1];
        const medianLongTask = longTasksList[Math.floor(longTasksList.length / 2)];
        const worstLongTask = longTasksList[longTasksList.length - 1];

        console.info('\n================================================================================');
        console.info('🏆 F18 / E07-06 — METROLOGIA EM CHROMIUM REAL (5 AMOSTRAS RASTER 48MP)');
        console.info('================================================================================');
        console.info(JSON.stringify({
            samples,
            summary: {
                totalSamples: TOTAL_SAMPLES,
                durationMs: { median: +medianDuration.toFixed(2), worst: +worstDuration.toFixed(2), budgetMax: 1500 },
                heapDeltaMiB: { median: +(medianHeapDelta / 1024 / 1024).toFixed(2), worst: +(worstHeapDelta / 1024 / 1024).toFixed(2), budgetMax: 80 },
                longTaskMs: { median: +medianLongTask.toFixed(2), worst: +worstLongTask.toFixed(2), budgetMax: 1200 }
            }
        }, null, 2));
        console.info('================================================================================\n');

        // Validação dos orçamentos para mediana e pior caso
        expect(worstDuration).toBeLessThan(1500);
        expect(worstLongTask).toBeLessThan(1200);
        expect(worstHeapDelta).toBeLessThan(80 * 1024 * 1024);
    }, 60000);

    it('gera dataUrl via FileReader quando includeDataUrl for true, mantendo ZERO chamadas a canvas.toDataURL', async () => {
        let emittedCropPayload: MaxImageEditPayload | null = null;
        const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');

        const { host, imageRef } = await mountImage({
            props: {
                maxCropWidth: 2000,
                maxCropHeight: 2000,
                maxCropPixels: 4000000,
                includeDataUrl: true
            },
            onCrop: (payload) => {
                emittedCropPayload = payload;
            }
        });

        const triggerImg = host.querySelector('.max-image__preview-trigger') as HTMLImageElement;
        triggerImg.click();
        await waitTicks(5);

        imageRef.value.startCrop();
        await waitTicks(10);

        const cropImg = document.querySelector('.max-image-crop-stage__img') as HTMLImageElement;
        if (!cropImg.complete) await new Promise((res) => {
            cropImg.onload = res;
        });

        await waitTicks(5);

        await imageRef.value.confirmCrop();

        expect(emittedCropPayload).toBeTruthy();
        const payload = emittedCropPayload!;

        // dataUrl deve existir e ser uma string base64 válida
        expect(typeof payload.dataUrl).toBe('string');
        expect(payload.dataUrl?.startsWith('data:image/')).toBe(true);

        // canvas.toDataURL continua com ZERO chamadas (derivado exclusivamente do Blob)
        expect(toDataUrlSpy).not.toHaveBeenCalled();

        toDataUrlSpy.mockRestore();
    });

    it('revoga a Object URL temporária ao alterar a propriedade src', async () => {
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

        const { imageRef, props } = await mountImage({
            props: {
                includeDataUrl: false
            }
        });

        const triggerImg = document.querySelector('.max-image__preview-trigger') as HTMLImageElement;
        triggerImg.click();
        await waitTicks(5);

        imageRef.value.startCrop();
        await waitTicks(10);

        const cropImg = document.querySelector('.max-image-crop-stage__img') as HTMLImageElement;
        if (!cropImg.complete) await new Promise((res) => {
            cropImg.onload = res;
        });

        await waitTicks(5);

        await imageRef.value.confirmCrop();
        await waitTicks(5);

        // A imagem inline agora aponta para a Object URL gerada
        const rawCurrentSrc = imageRef.value.currentSrc;
        const currentSrc = (typeof rawCurrentSrc === 'object' && rawCurrentSrc !== null && 'value' in rawCurrentSrc)
            ? rawCurrentSrc.value
            : rawCurrentSrc;
        expect(currentSrc).toContain('blob:');

        // Altera a propriedade src -> deve revogar a Object URL ativa
        revokeSpy.mockClear();
        props.value.src = 'https://example.com/new-photo.jpg';
        await waitTicks(5);

        expect(revokeSpy).toHaveBeenCalledWith(currentSrc);
        revokeSpy.mockRestore();
    });

    it('revoga a Object URL temporária ao desmontar o componente com imagem recortada ativa', async () => {
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

        const { imageRef, app } = await mountImage({
            props: {
                includeDataUrl: false
            }
        });

        const triggerImg = document.querySelector('.max-image__preview-trigger') as HTMLImageElement;
        triggerImg.click();
        await waitTicks(5);

        imageRef.value.startCrop();
        await waitTicks(10);

        const cropImg = document.querySelector('.max-image-crop-stage__img') as HTMLImageElement;
        if (!cropImg.complete) await new Promise((res) => {
            cropImg.onload = res;
        });

        await waitTicks(5);

        await imageRef.value.confirmCrop();
        await waitTicks(5);

        const rawCurrentSrc = imageRef.value.currentSrc;
        const currentSrc = (typeof rawCurrentSrc === 'object' && rawCurrentSrc !== null && 'value' in rawCurrentSrc)
            ? rawCurrentSrc.value
            : rawCurrentSrc;
        expect(currentSrc).toContain('blob:');

        revokeSpy.mockClear();
        app.unmount();
        activeApp = null;
        await waitTicks(5);

        expect(revokeSpy).toHaveBeenCalledWith(currentSrc);
        revokeSpy.mockRestore();
    });

    it('mantém o editor de recorte aberto e exibe erro recuperável com role="alert" se toBlob falhar', async () => {
        const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
            // Simula falha na codificação do navegador
            callback(null);
        });

        let cropEmitted = false;
        const { host, imageRef } = await mountImage({
            onCrop: () => {
                cropEmitted = true;
            }
        });

        const triggerImg = host.querySelector('.max-image__preview-trigger') as HTMLImageElement;
        triggerImg.click();
        await waitTicks(5);

        imageRef.value.startCrop();
        await waitTicks(10);

        const cropImg = document.querySelector('.max-image-crop-stage__img') as HTMLImageElement;
        if (!cropImg.complete) await new Promise((res) => {
            cropImg.onload = res;
        });

        await waitTicks(5);

        // Confirma recorte que irá falhar no toBlob
        await imageRef.value.confirmCrop();
        await waitTicks(5);

        // Zero eventos de crop emitidos
        expect(cropEmitted).toBe(false);

        // Editor permanece aberto
        expect(imageRef.value.isCropping).toBe(true);

        // Alerta de erro presente e acessível
        const errorEl = document.querySelector('.max-image-crop-error') as HTMLElement;
        expect(errorEl).toBeTruthy();
        expect(errorEl.getAttribute('role')).toBe('alert');
        expect(errorEl.getAttribute('aria-live')).toBe('assertive');
        expect(errorEl.textContent).toContain('Falha ao codificar imagem recortada');

        toBlobSpy.mockRestore();
    });
});
