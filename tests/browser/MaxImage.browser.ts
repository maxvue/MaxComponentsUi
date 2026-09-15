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
const CROP_PERFORMANCE_BUDGET = {
    durationMs: 1500,
    longTaskMs: 1500,
    heapDeltaBytes: 96 * 1024 * 1024
} as const;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 5): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();
}

let raster48MpBlob: Promise<Blob> | null = null;

/** Cria uma fotografia raster PNG de 48 MP (8000 × 6000), sem SVG. */
async function create48MpImageBlobUrl(): Promise<string> {
    raster48MpBlob ??= new Promise<Blob>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 8000;
        canvas.height = 6000;
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Canvas 2D indisponível para o fixture raster de 48 MP.'));

        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#00768e');
        gradient.addColorStop(0.5, '#f59e0b');
        gradient.addColorStop(1, '#ffffff');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(0, 0, 0, .25)';
        context.fillRect(2000, 1500, 4000, 3000);
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Não foi possível codificar o fixture raster de 48 MP.'));
        }, 'image/png');
    });

    const blob = await raster48MpBlob;
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
        src: await create48MpImageBlobUrl(),
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
    it('executa recorte de imagem de 48 MP com canvas real, downscale proporcional dentro dos limites, zero toDataURL e dentro do orçamento de tempo', async () => {
        let emittedCropPayload: MaxImageEditPayload | null = null;

        const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
        const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');

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

        // Espera a imagem carregar completamente e confirmar dimensões reais de 48 MP
        if (!cropImg.complete) await new Promise((res) => {
            cropImg.onload = res;
        });

        await waitTicks(5);

        // Verifica que o navegador carregou os 48 MP reais
        expect(cropImg.naturalWidth).toBe(8000);
        expect(cropImg.naturalHeight).toBe(6000);

        // 3. Mede o tempo gasto na operação confirmCrop no Chromium com canvas real
        toBlobSpy.mockClear();
        toDataUrlSpy.mockClear();

        expect(PerformanceObserver.supportedEntryTypes).toContain('longtask');
        const longTasks: PerformanceEntry[] = [];
        const observer = new PerformanceObserver((entries) => longTasks.push(...entries.getEntries()));
        observer.observe({ type: 'longtask', buffered: false });
        const memory = performance as Performance & { memory?: { usedJSHeapSize: number } };
        const heapBefore = memory.memory?.usedJSHeapSize;
        expect(heapBefore, 'O runner Chromium deve expor performance.memory para medir o heap.').toBeTypeOf('number');
        const startTime = performance.now();
        await imageRef.value.confirmCrop();
        const duration = performance.now() - startTime;
        const heapAfter = memory.memory?.usedJSHeapSize;
        observer?.disconnect();
        expect(heapAfter, 'O runner Chromium deve manter performance.memory após o crop.').toBeTypeOf('number');

        // 4. Orçamento de tempo e responsividade da UI (não bloquear main thread excessivamente)
        // O processamento e codificação com downscale deve completar dentro de um orçamento seguro (< 1500ms no Chromium)
        expect(duration).toBeLessThan(CROP_PERFORMANCE_BUDGET.durationMs);
        const observedLongTaskMs = longTasks.reduce((total, entry) => total + entry.duration, 0);
        expect(observedLongTaskMs).toBeLessThan(CROP_PERFORMANCE_BUDGET.longTaskMs);
        const heapDelta = heapAfter! - heapBefore!;
        expect(heapDelta).toBeLessThan(CROP_PERFORMANCE_BUDGET.heapDeltaBytes);
        console.info('[IMP5-F18] métricas de crop', {
            durationMs: Number(duration.toFixed(2)),
            longTaskMs: Number(observedLongTaskMs.toFixed(2)),
            heapBefore,
            heapAfter,
            heapDelta
        });

        // 5. Verifica que o payload foi emitido e respeita estritamente os limites
        expect(emittedCropPayload).toBeTruthy();
        const payload = emittedCropPayload!;

        // Blob e File válidos e não nulos
        expect(payload.blob).toBeInstanceOf(Blob);
        expect(payload.blob.size).toBeGreaterThan(0);
        expect(payload.file).toBeInstanceOf(File);
        expect(payload.file.size).toBeGreaterThan(0);

        // Dimensões do canvas final: aplicou downscale proporcional
        // 8000x6000 (proporção 4:3) limitado a maxWidth=4096, maxHeight=4096, maxPixels=16777216
        expect(payload.width).toBeLessThanOrEqual(4096);
        expect(payload.height).toBeLessThanOrEqual(4096);
        expect(payload.width * payload.height).toBeLessThanOrEqual(16777216);

        // Proporção preservada
        const originalRatio = 8000 / 6000;
        const resultRatio = payload.width / payload.height;
        expect(Math.abs(resultRatio - originalRatio)).toBeLessThan(0.05);

        // 6. Zero chamadas a toDataURL por padrão e exatamente UMA chamada a toBlob
        expect(toDataUrlSpy).not.toHaveBeenCalled();
        expect(toBlobSpy).toHaveBeenCalledTimes(1);

        // 7. dataUrl é undefined quando includeDataUrl for false
        expect(payload.dataUrl).toBeUndefined();

        toDataUrlSpy.mockRestore();
        toBlobSpy.mockRestore();
    });

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
