import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MaxImage from '../../src/components/MaxImage.vue';
import { calculateTargetCropDimensions } from '../../src/helpers/imageCrop';

function mountImage(props: Record<string, any> = {}) {
    return mount(MaxImage, {
        props: {
            src: 'https://picsum.photos/400/300',
            alt: 'Imagem de teste',
            ...props
        },
        global: {
            stubs: {
                MaxIconButton: {
                    name: 'MaxIconButton',
                    template: '<button class="max-icon-button" :data-icon="icon" :aria-label="$attrs[\'aria-label\']" :title="$attrs.title" @click="$emit(\'click\', $event)"><slot /></button>',
                    props: ['icon', 'i', 'size', 'light', 'dark', 'color'],
                    emits: ['click', 'action']
                },
                Teleport: true
            }
        }
    });
}

describe('REV-F18: Auditoria e Refutação Adversarial do Bloco F18', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.restoreAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('1. Estresse Matemático em calculateTargetCropDimensions', () => {
        it('nunca faz upscale de imagens menores que os limites máximos', () => {
            const dims = [
                { w: 10, h: 10 },
                { w: 50, h: 80 },
                { w: 100, h: 200 },
                { w: 800, h: 600 },
                { w: 1920, h: 1080 }
            ];

            for (const d of dims) {
                const result = calculateTargetCropDimensions(d.w, d.h, 4096, 4096, 16777216);
                expect(result.width).toBe(d.w);
                expect(result.height).toBe(d.h);
            }
        });

        it('mantém estritamente width * height <= maxPixels em condições limítrofes e arredondamentos desfavoráveis', () => {
            const testCases = [
                { w: 8001, h: 6001, maxP: 10000000, maxW: 10000, maxH: 10000 },
                { w: 12000, h: 9000, maxP: 16777216, maxW: 4096, maxH: 4096 },
                { w: 100000, h: 100000, maxP: 2000000, maxW: 4096, maxH: 4096 },
                { w: 5000, h: 5000, maxP: 1000000, maxW: 2000, maxH: 2000 },
                { w: 7777, h: 3333, maxP: 5000000, maxW: 4000, maxH: 4000 },
                { w: 100000, h: 2, maxP: 50000, maxW: 10000, maxH: 10000 },
                { w: 3, h: 100000, maxP: 50000, maxW: 10000, maxH: 10000 },
                { w: 1000, h: 1000, maxP: 10, maxW: 100, maxH: 100 },
                { w: 1000, h: 1000, maxP: 1, maxW: 100, maxH: 100 }
            ];

            for (const tc of testCases) {
                const res = calculateTargetCropDimensions(tc.w, tc.h, tc.maxW, tc.maxH, tc.maxP);
                expect(res.width * res.height).toBeLessThanOrEqual(tc.maxP);
                expect(res.width).toBeLessThanOrEqual(tc.maxW);
                expect(res.height).toBeLessThanOrEqual(tc.maxH);
                expect(res.width).toBeGreaterThanOrEqual(1);
                expect(res.height).toBeGreaterThanOrEqual(1);
            }
        });

        it('rejeita com segurança entradas bizarras, não numéricas ou degeneradas', () => {
            const invalidEntries = [
                [0, 100],
                [100, 0],
                [0, 0],
                [-50, 100],
                [100, -50],
                [-100, -100],
                [NaN, 100],
                [100, NaN],
                [Infinity, 100],
                [100, Infinity],
                [-Infinity, 100],
                [100, -Infinity]
            ];

            for (const [w, h] of invalidEntries) expect(calculateTargetCropDimensions(w, h)).toEqual({ width: 0, height: 0 });

        });
    });

    describe('2. Ciclo de Vida de Object URLs e Prevenção de Memory Leaks', () => {
        it('revoga a Object URL anterior quando múltiplos recortes sucessivos são realizados', async () => {
            const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
            let createdCount = 0;
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
                createdCount++;
                return `blob:mock-url-${createdCount}`;
            });

            const fakeBlob = new Blob(['mock-binary'], { type: 'image/png' });
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
                drawImage: vi.fn()
            } as unknown as CanvasRenderingContext2D);
            vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(fakeBlob));

            const wrapper = mountImage({
                src: 'https://example.com/initial.jpg',
                preview: true,
                allowEdit: true
            });

            // 1º Recorte
            await wrapper.find('.max-image__preview-trigger').trigger('click');
            const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Recortar imagem');
            await editBtn!.trigger('click');

            let cropImg = wrapper.find('.max-image-crop-stage__img');
            Object.defineProperty(cropImg.element, 'clientWidth', { value: 200, configurable: true });
            Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
            Object.defineProperty(cropImg.element, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(cropImg.element, 'naturalHeight', { value: 400, configurable: true });
            await cropImg.trigger('load');

            let confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
            await confirmBtn!.trigger('click');
            await flushPromises();

            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            expect(revokeSpy).not.toHaveBeenCalled();

            // 2º Recorte sobre o resultado anterior
            const editBtn2 = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Recortar imagem');
            await editBtn2!.trigger('click');
            cropImg = wrapper.find('.max-image-crop-stage__img');
            Object.defineProperty(cropImg.element, 'clientWidth', { value: 200, configurable: true });
            Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
            Object.defineProperty(cropImg.element, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(cropImg.element, 'naturalHeight', { value: 400, configurable: true });
            await cropImg.trigger('load');

            confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
            await confirmBtn!.trigger('click');
            await flushPromises();

            expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
            expect(revokeSpy).toHaveBeenCalledTimes(1);
            expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url-1');

            // 3º Recorte
            const editBtn3 = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Recortar imagem');
            await editBtn3!.trigger('click');
            cropImg = wrapper.find('.max-image-crop-stage__img');
            Object.defineProperty(cropImg.element, 'clientWidth', { value: 200, configurable: true });
            Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
            Object.defineProperty(cropImg.element, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(cropImg.element, 'naturalHeight', { value: 400, configurable: true });
            await cropImg.trigger('load');

            confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
            await confirmBtn!.trigger('click');
            await flushPromises();

            expect(createObjectURLSpy).toHaveBeenCalledTimes(3);
            expect(revokeSpy).toHaveBeenCalledTimes(2);
            expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url-2');

            // Desmontagem do componente deve revogar a última URL ativa
            wrapper.unmount();
            expect(revokeSpy).toHaveBeenCalledTimes(3);
            expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url-3');
        });

        it('revoga a Object URL quando a prop src é alterada externamente', async () => {
            const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
            vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url-test');

            const fakeBlob = new Blob(['mock-binary'], { type: 'image/png' });
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
                drawImage: vi.fn()
            } as unknown as CanvasRenderingContext2D);
            vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(fakeBlob));

            const wrapper = mountImage({
                src: 'https://example.com/photo.jpg',
                preview: true,
                allowEdit: true
            });

            await wrapper.find('.max-image__preview-trigger').trigger('click');
            const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Recortar imagem');
            await editBtn!.trigger('click');

            const cropImg = wrapper.find('.max-image-crop-stage__img');
            Object.defineProperty(cropImg.element, 'clientWidth', { value: 200, configurable: true });
            Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
            await cropImg.trigger('load');

            const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
            await confirmBtn!.trigger('click');
            await flushPromises();

            expect((wrapper.vm as any).currentSrc).toBe('blob:mock-url-test');

            // Mudança externa da prop src
            await wrapper.setProps({ src: 'https://example.com/new-photo.jpg' });
            expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url-test');
            expect((wrapper.vm as any).currentSrc).toBe('https://example.com/new-photo.jpg');
        });
    });

    describe('3. Falha Recuperável e Tratamento Adversarial de Exceções', () => {
        it('trata toBlob que lança exceção síncrona mantendo editor aberto com role="alert" e zero emissões', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
                drawImage: vi.fn()
            } as unknown as CanvasRenderingContext2D);
            vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(() => {
                throw new Error('Canvas security error or browser out of memory');
            });

            const wrapper = mountImage({
                src: 'https://example.com/test.png',
                preview: true,
                allowEdit: true
            });

            await wrapper.find('.max-image__preview-trigger').trigger('click');
            const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Recortar imagem');
            await editBtn!.trigger('click');

            const cropImg = wrapper.find('.max-image-crop-stage__img');
            Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
            Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
            await cropImg.trigger('load');

            const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
            await confirmBtn!.trigger('click');
            await flushPromises();

            expect(wrapper.emitted('crop')).toBeUndefined();
            expect(wrapper.emitted('edit')).toBeUndefined();
            expect(wrapper.emitted('update:src')).toBeUndefined();

            expect((wrapper.vm as any).isCropping).toBe(true);

            const errorAlert = wrapper.find('.max-image-crop-error');
            expect(errorAlert.exists()).toBe(true);
            expect(errorAlert.attributes('role')).toBe('alert');
            expect(errorAlert.attributes('aria-live')).toBe('assertive');
            expect(errorAlert.text()).toContain('Erro ao codificar imagem recortada.');

            consoleErrorSpy.mockRestore();
        });

        it('não quebra a emissão quando includeDataUrl=true mas o FileReader falha', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const fakeBlob = new Blob(['mock-binary'], { type: 'image/png' });
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
                drawImage: vi.fn()
            } as unknown as CanvasRenderingContext2D);
            vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(fakeBlob));

            const originalFileReader = globalThis.FileReader;
            class MockFailingFileReader {
                onloadend: any = null;
                onerror: any = null;
                result = null;
                readAsDataURL() {
                    if (this.onerror) this.onerror(new ProgressEvent('error'));
                    if (this.onloadend) this.onloadend(new ProgressEvent('loadend'));
                }
            }
            (globalThis as any).FileReader = MockFailingFileReader;

            const wrapper = mountImage({
                src: 'https://example.com/test.png',
                preview: true,
                allowEdit: true,
                includeDataUrl: true
            });

            await wrapper.find('.max-image__preview-trigger').trigger('click');
            const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Recortar imagem');
            await editBtn!.trigger('click');

            const cropImg = wrapper.find('.max-image-crop-stage__img');
            Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
            Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
            await cropImg.trigger('load');

            const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
            await confirmBtn!.trigger('click');
            await flushPromises();

            expect(wrapper.emitted('crop')).toBeDefined();
            const payload = wrapper.emitted('crop')![0][0] as any;
            expect(payload.blob).toBe(fakeBlob);
            expect(payload.file).toBeInstanceOf(File);

            (globalThis as any).FileReader = originalFileReader;
            consoleWarnSpy.mockRestore();
        });

        it('impede processamento silencioso quando clientWidth ou clientHeight da imagem são 0', async () => {
            const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');

            const wrapper = mountImage({
                src: 'https://example.com/test.png',
                preview: true,
                allowEdit: true
            });

            await wrapper.find('.max-image__preview-trigger').trigger('click');
            const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Recortar imagem');
            await editBtn!.trigger('click');

            const cropImg = wrapper.find('.max-image-crop-stage__img');
            Object.defineProperty(cropImg.element, 'clientWidth', { value: 0, configurable: true });
            Object.defineProperty(cropImg.element, 'clientHeight', { value: 0, configurable: true });

            const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
            await confirmBtn!.trigger('click');
            await flushPromises();

            expect(toBlobSpy).not.toHaveBeenCalled();
            expect(wrapper.emitted('crop')).toBeUndefined();
            expect((wrapper.vm as any).isCropping).toBe(true);
        });
    });

    describe('4. Isolamento Estrito: ZERO toDataURL', () => {
        it('comprova ausência total de chamada a toDataURL sob qualquer combinação de props', async () => {
            const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
            const fakeBlob = new Blob(['binary'], { type: 'image/jpeg' });
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
                drawImage: vi.fn()
            } as unknown as CanvasRenderingContext2D);
            vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(fakeBlob));

            for (const includeDataUrl of [false, true]) {
                const wrapper = mountImage({
                    src: 'https://example.com/photo.jpeg',
                    preview: true,
                    allowEdit: true,
                    includeDataUrl,
                    cropMimeType: 'image/jpeg',
                    cropQuality: 0.8
                });

                await wrapper.find('.max-image__preview-trigger').trigger('click');
                const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                    .find((btn) => btn.attributes('title') === 'Recortar imagem');
                await editBtn!.trigger('click');

                const cropImg = wrapper.find('.max-image-crop-stage__img');
                Object.defineProperty(cropImg.element, 'clientWidth', { value: 400, configurable: true });
                Object.defineProperty(cropImg.element, 'clientHeight', { value: 300, configurable: true });
                await cropImg.trigger('load');

                const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
                    .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
                await confirmBtn!.trigger('click');
                await flushPromises();

                expect(toDataUrlSpy).not.toHaveBeenCalled();
                wrapper.unmount();
            }
        });
    });
});
