import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxImage from '../../src/components/MaxImage.vue';
import { calculateTargetCropDimensions } from '../../src/helpers/imageCrop';

const mountedWrappers: any[] = [];

function mountImage(props: Record<string, any> = {}, options: Record<string, any> = {}) {
    const wrapper = mount(MaxImage, {
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
        },
        ...options
    });
    mountedWrappers.push(wrapper);
    return wrapper;
}

describe('MaxImage', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        document.body.innerHTML = '';
        document.body.style.overflow = '';
    });

    afterEach(() => {
        while (mountedWrappers.length > 0) {
            const w = mountedWrappers.pop();
            try { w.unmount(); } catch {}
        }
        document.body.innerHTML = '';
        document.body.style.overflow = '';
    });

    it('renderiza corretamente a imagem inline', () => {
        const wrapper = mountImage();
        const img = wrapper.find('.max-image__preview-trigger');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://picsum.photos/400/300');
        expect(img.attributes('alt')).toBe('Imagem de teste');
        expect(wrapper.find('.max-image-modal').exists()).toBe(false);
    });

    it('abre o modal em tela cheia ao clicar na imagem quando preview é true', async () => {
        const wrapper = mountImage({ preview: true });
        const img = wrapper.find('.max-image__preview-trigger');
        await img.trigger('click');

        const modal = wrapper.find('.max-image-modal');
        expect(modal.exists()).toBe(true);
        expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('não abre o modal ao clicar na imagem quando preview é false', async () => {
        const wrapper = mountImage({ preview: false });
        const img = wrapper.find('.max-image__preview-trigger');
        await img.trigger('click');

        expect(wrapper.find('.max-image-modal').exists()).toBe(false);
        expect(wrapper.emitted('show')).toBeFalsy();
    });

    it('fecha o modal ao clicar no background rgba(0,0,0,0.5)', async () => {
        const wrapper = mountImage();
        await wrapper.find('.max-image__preview-trigger').trigger('click');
        expect(wrapper.find('.max-image-modal').exists()).toBe(true);

        const modal = wrapper.find('.max-image-modal');
        await modal.trigger('click');

        expect(wrapper.find('.max-image-modal').exists()).toBe(false);
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('fecha o modal ao clicar no botão Sair da barra de ferramentas', async () => {
        const wrapper = mountImage();
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const closeBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('aria-label') === 'Sair' || btn.attributes('title') === 'Sair');
        expect(closeBtn?.exists()).toBe(true);

        await closeBtn!.trigger('click');
        expect(wrapper.find('.max-image-modal').exists()).toBe(false);
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('fecha o modal ao pressionar a tecla Escape', async () => {
        const wrapper = mountImage();
        await wrapper.find('.max-image__preview-trigger').trigger('click');
        expect(wrapper.find('.max-image-modal').exists()).toBe(true);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-image-modal').exists()).toBe(false);
    });

    it('oculta o botão Editar por padrão quando allowEdit for false', async () => {
        const wrapper = mountImage({ allowEdit: false });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem' || btn.attributes('aria-label') === 'Recortar imagem');
        expect(editBtn).toBeUndefined();
    });

    it('exibe o botão Editar quando allowEdit for true', async () => {
        const wrapper = mountImage({ allowEdit: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem' || btn.attributes('aria-label') === 'Recortar imagem');
        expect(editBtn?.exists()).toBe(true);
    });

    it('aumenta e diminui o zoom visual da imagem pelos botões da barra de ferramentas', async () => {
        const wrapper = mountImage();
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const zoomInBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Aumentar Zoom');
        const zoomOutBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Diminuir Zoom');

        expect(zoomInBtn?.exists()).toBe(true);
        expect(zoomOutBtn?.exists()).toBe(true);

        const modalImg = wrapper.find('.max-image-modal__img');
        expect(modalImg.attributes('style')).toContain('scale(1)');

        await zoomInBtn!.trigger('click');
        expect(modalImg.attributes('style')).toContain('scale(1.25)');

        await zoomOutBtn!.trigger('click');
        expect(modalImg.attributes('style')).toContain('scale(1)');
    });

    it('inicia o modo de recorte ao clicar em Editar', async () => {
        const wrapper = mountImage({ allowEdit: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        expect(wrapper.find('.max-image-crop-stage').exists()).toBe(true);
        expect(wrapper.find('.max-image-modal__toolbar').find('button[title="Confirmar Recorte"]').exists()).toBe(true);
        expect(wrapper.find('.max-image-modal__toolbar').find('button[title="Cancelar Recorte"]').exists()).toBe(true);
    });

    it('cancela o modo de recorte ao clicar no botão Cancelar', async () => {
        const wrapper = mountImage({ allowEdit: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');
        expect(wrapper.find('.max-image-crop-stage').exists()).toBe(true);

        const cancelBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Cancelar Recorte');
        await cancelBtn!.trigger('click');

        expect(wrapper.find('.max-image-crop-stage').exists()).toBe(false);
        expect(wrapper.find('.max-image-modal__image-wrapper').exists()).toBe(true);
    });

    it('executa a função onEdit e emite os eventos update:src e edit ao concluir recorte', async () => {
        const onEditMock = vi.fn();
        const wrapper = mountImage({
            allowEdit: true,
            onEdit: onEditMock
        });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        // Simula método confirmCrop do componente
        const fakePayload = {
            dataUrl: 'data:image/png;base64,fakeCroppedData',
            blob: new Blob(['fake']),
            file: new File(['fake'], 'cropped.png', { type: 'image/png' }),
            width: 200,
            height: 150,
            mimeType: 'image/png'
        };

        await (wrapper.vm as any).applyCropPayload(fakePayload);

        expect(wrapper.emitted('update:src')?.[0]).toEqual(['data:image/png;base64,fakeCroppedData']);
        expect(wrapper.emitted('edit')?.[0]).toEqual([fakePayload]);
        expect(wrapper.emitted('crop')?.[0]).toEqual([fakePayload]);
        expect(onEditMock).toHaveBeenCalledWith(fakePayload);
        expect((wrapper.vm as any).isCropping).toBe(false);
    });

    it('não registra listener keydown no window ao montar com isOpen=false', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        mountImage();

        const keydownCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === 'keydown');
        expect(keydownCalls.length).toBe(0);

        addEventListenerSpy.mockRestore();
    });

    it('registra listener keydown no window ao abrir preview e remove ao fechar', async () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const wrapper = mountImage({ preview: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        await wrapper.find('.max-image-modal').trigger('click');
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    it('remove listeners de ponteiro no window ao desmontar componente durante arraste de crop', async () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const wrapper = mountImage({ preview: true, allowEdit: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        // Simula carregamento da imagem de crop
        const cropImg = wrapper.find('.max-image-crop-stage__img');
        Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
        await cropImg.trigger('load');

        // Inicia arraste da crop box
        const cropBoxEl = wrapper.find('.max-image-crop-box');
        expect(cropBoxEl.exists()).toBe(true);
        await cropBoxEl.trigger('pointerdown', { clientX: 100, clientY: 100 });

        removeEventListenerSpy.mockClear();

        // Desmonta o componente durante o arraste
        wrapper.unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    it('remove listeners de ponteiro no window ao cancelar recorte durante arraste de alça', async () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const wrapper = mountImage({ preview: true, allowEdit: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        const cropImg = wrapper.find('.max-image-crop-stage__img');
        Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
        await cropImg.trigger('load');

        // Inicia arraste da alça tl
        const handleTl = wrapper.find('.max-image-crop-handle--tl');
        expect(handleTl.exists()).toBe(true);
        await handleTl.trigger('pointerdown', { clientX: 50, clientY: 50 });

        removeEventListenerSpy.mockClear();

        const cancelBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Cancelar Recorte');
        await cancelBtn!.trigger('click');

        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    it('aplica atributos de acessibilidade e papel dialog ao abrir o preview', async () => {
        const wrapper = mountImage({ preview: true, alt: 'Foto da paisagem' });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const modal = wrapper.find('.max-image-modal');
        expect(modal.exists()).toBe(true);
        expect(modal.attributes('role')).toBe('dialog');
        expect(modal.attributes('aria-modal')).toBe('true');
        expect(modal.attributes('aria-label')).toBe('Foto da paisagem');
        expect(modal.attributes('tabindex')).toBe('-1');
    });

    it('calcula corretamente as dimensões de recorte respeitando limites e proporção sem upscale', () => {
        // Imagem pequena: nunca ampliada
        const small = calculateTargetCropDimensions(500, 400, 2000, 2000, 4000000);
        expect(small).toEqual({ width: 500, height: 400 });

        // Imagem larga excedendo maxWidth
        const wide = calculateTargetCropDimensions(8000, 4000, 4000, 4000, 32000000);
        expect(wide.width).toBe(4000);
        expect(wide.height).toBe(2000);

        // Imagem 48 MP excedendo maxPixels
        const photo48mp = calculateTargetCropDimensions(8000, 6000, 10000, 10000, 12000000);
        expect(photo48mp.width * photo48mp.height).toBeLessThanOrEqual(12000000);
        // Proporção 4:3 mantida
        expect(photo48mp.width / photo48mp.height).toBeCloseTo(8000 / 6000, 1);
    });

    it('permite acionamento do preview via teclado (Enter e Espaço) com atributos de botão', async () => {
        const wrapper = mountImage({ preview: true, alt: 'Imagem acessível' });
        const trigger = wrapper.find('.max-image__preview-trigger');

        expect(trigger.attributes('role')).toBe('button');
        expect(trigger.attributes('tabindex')).toBe('0');
        expect(trigger.attributes('aria-label')).toBe('Visualizar imagem: Imagem acessível');

        // Enter abre o modal
        await trigger.trigger('keydown.enter');
        expect(wrapper.find('.max-image-modal').exists()).toBe(true);
        expect(wrapper.emitted('show')).toHaveLength(1);

        // Fecha e testa com Espaço
        await wrapper.find('.max-image-modal').trigger('click');
        expect(wrapper.find('.max-image-modal').exists()).toBe(false);

        await trigger.trigger('keydown.space');
        expect(wrapper.find('.max-image-modal').exists()).toBe(true);
        expect(wrapper.emitted('show')).toHaveLength(2);
    });

    it('permite mover e redimensionar a crop box via teclado no modo de recorte', async () => {
        const wrapper = mountImage({ preview: true, allowEdit: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        const cropImg = wrapper.find('.max-image-crop-stage__img');
        Object.defineProperty(cropImg.element, 'clientWidth', { value: 400, configurable: true });
        Object.defineProperty(cropImg.element, 'clientHeight', { value: 300, configurable: true });
        await cropImg.trigger('load');

        const cropBoxEl = wrapper.find('.max-image-crop-box');
        expect(cropBoxEl.exists()).toBe(true);
        expect(cropBoxEl.attributes('role')).toBe('region');
        expect(cropBoxEl.attributes('tabindex')).toBe('0');

        const initialX = (wrapper.vm as any).cropBox.x;
        const initialY = (wrapper.vm as any).cropBox.y;
        const initialW = (wrapper.vm as any).cropBox.width;

        // Seta para a direita: move x
        await cropBoxEl.trigger('keydown', { key: 'ArrowRight', shiftKey: false });
        expect((wrapper.vm as any).cropBox.x).toBe(initialX + 5);

        // Seta para baixo: move y
        await cropBoxEl.trigger('keydown', { key: 'ArrowDown', shiftKey: false });
        expect((wrapper.vm as any).cropBox.y).toBe(initialY + 5);

        // Shift + Seta para a direita: redimensiona largura
        await cropBoxEl.trigger('keydown', { key: 'ArrowRight', shiftKey: true });
        expect((wrapper.vm as any).cropBox.width).toBe(initialW + 10);
    });

    it('gerencia e revoga Object URLs criadas após recorte ao alterar src ou desmontar', async () => {
        const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/cropped-uuid');
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const wrapper = mountImage({ preview: true, allowEdit: true });

        const fakeBlob = new Blob(['teste'], { type: 'image/png' });
        const fakePayload = {
            dataUrl: 'data:image/png;base64,xxx',
            blob: fakeBlob,
            file: new File([fakeBlob], 'crop.png', { type: 'image/png' }),
            width: 100,
            height: 100,
            mimeType: 'image/png'
        };

        await (wrapper.vm as any).applyCropPayload(fakePayload);

        expect(createSpy).toHaveBeenCalledWith(fakeBlob);
        expect((wrapper.vm as any).currentSrc).toBe('blob:http://localhost/cropped-uuid');

        // Desmontar revoga a Object URL ativa
        wrapper.unmount();
        expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/cropped-uuid');

        createSpy.mockRestore();
        revokeSpy.mockRestore();
    });

    it('utiliza Blob como payload canônico padrão e omite dataUrl quando includeDataUrl for false', async () => {
        const fakeBlob = new Blob(['mock-binary-data'], { type: 'image/png' });
        const drawImageSpy = vi.fn();
        const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage: drawImageSpy
        } as unknown as CanvasRenderingContext2D);
        const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
            callback(fakeBlob);
        });
        const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');

        const wrapper = mountImage({ preview: true, allowEdit: true, includeDataUrl: false });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        const cropImg = wrapper.find('.max-image-crop-stage__img');
        Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
        Object.defineProperty(cropImg.element, 'naturalWidth', { value: 600, configurable: true });
        Object.defineProperty(cropImg.element, 'naturalHeight', { value: 400, configurable: true });
        await cropImg.trigger('load');

        const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
        expect(confirmBtn?.exists()).toBe(true);
        await confirmBtn!.trigger('click');

        // Aguarda execução assíncrona do crop
        await flushPromises();

        const emittedCrop = wrapper.emitted('crop');
        expect(emittedCrop).toBeTruthy();
        expect(emittedCrop?.length).toBe(1);

        const payload = emittedCrop![0][0] as any;
        expect(payload.blob).toBe(fakeBlob);
        expect(payload.dataUrl).toBeUndefined();
        expect(payload.file).toBeInstanceOf(File);
        expect(payload.width).toBe(480);
        expect(payload.height).toBe(320);

        // canvas.toDataURL não deve ser acionado para duplicação em base64
        expect(toDataUrlSpy).not.toHaveBeenCalled();

        // Editor deve ser fechado com sucesso
        expect((wrapper.vm as any).isCropping).toBe(false);
        expect(wrapper.find('.max-image-crop-stage').exists()).toBe(false);

        getContextSpy.mockRestore();
        toBlobSpy.mockRestore();
        toDataUrlSpy.mockRestore();
    });

    it('gera dataUrl no payload apenas quando includeDataUrl for explicitamente true', async () => {
        const fakeBlob = new Blob(['mock-binary-data'], { type: 'image/png' });
        const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage: vi.fn()
        } as unknown as CanvasRenderingContext2D);
        const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
            callback(fakeBlob);
        });

        const wrapper = mountImage({ preview: true, allowEdit: true, includeDataUrl: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        const cropImg = wrapper.find('.max-image-crop-stage__img');
        Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
        Object.defineProperty(cropImg.element, 'naturalWidth', { value: 600, configurable: true });
        Object.defineProperty(cropImg.element, 'naturalHeight', { value: 400, configurable: true });
        await cropImg.trigger('load');

        const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
        await confirmBtn!.trigger('click');
        await flushPromises();
        if (!wrapper.emitted('crop')) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            await flushPromises();
        }

        const emittedCrop = wrapper.emitted('crop');
        expect(emittedCrop).toBeTruthy();
        const payload = emittedCrop![0][0] as any;
        expect(payload.blob).toBe(fakeBlob);
        expect(typeof payload.dataUrl).toBe('string');
        expect(payload.dataUrl.length).toBeGreaterThan(0);

        getContextSpy.mockRestore();
        toBlobSpy.mockRestore();
    });

    it('mantém editor aberto e exibe erro recuperável com zero emissões quando toBlob retorna null', async () => {
        const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage: vi.fn()
        } as unknown as CanvasRenderingContext2D);
        const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
            callback(null);
        });

        const wrapper = mountImage({ preview: true, allowEdit: true });
        await wrapper.find('.max-image__preview-trigger').trigger('click');

        const editBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Recortar imagem');
        await editBtn!.trigger('click');

        const cropImg = wrapper.find('.max-image-crop-stage__img');
        Object.defineProperty(cropImg.element, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(cropImg.element, 'clientHeight', { value: 200, configurable: true });
        Object.defineProperty(cropImg.element, 'naturalWidth', { value: 600, configurable: true });
        Object.defineProperty(cropImg.element, 'naturalHeight', { value: 400, configurable: true });
        await cropImg.trigger('load');

        const confirmBtn = wrapper.findAllComponents({ name: 'MaxIconButton' })
            .find((btn) => btn.attributes('title') === 'Confirmar Recorte');
        await confirmBtn!.trigger('click');
        await flushPromises();

        // Zero eventos de crop/edit/update:src emitidos
        expect(wrapper.emitted('crop')).toBeUndefined();
        expect(wrapper.emitted('edit')).toBeUndefined();
        expect(wrapper.emitted('update:src')).toBeUndefined();

        // Editor permanece aberto
        expect((wrapper.vm as any).isCropping).toBe(true);
        expect(wrapper.find('.max-image-crop-stage').exists()).toBe(true);

        // Erro visível para o usuário com role="alert"
        const errorAlert = wrapper.find('.max-image-crop-error');
        expect(errorAlert.exists()).toBe(true);
        expect(errorAlert.attributes('role')).toBe('alert');
        expect(errorAlert.text()).toContain('Falha ao codificar imagem recortada (blob nulo)');

        getContextSpy.mockRestore();
        toBlobSpy.mockRestore();
    });

    it('mantém editor aberto e exibe erro quando ocorre exceção durante desenho no canvas', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
            throw new Error('Falha simulada de contexto 2D');
        });

        const wrapper = mountImage({ preview: true, allowEdit: true });
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
        expect((wrapper.vm as any).isCropping).toBe(true);

        const errorAlert = wrapper.find('.max-image-crop-error');
        expect(errorAlert.exists()).toBe(true);
        expect(errorAlert.text()).toContain('Falha ao processar imagem para recorte.');

        getContextSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });
});

