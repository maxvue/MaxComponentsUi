import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxImage from '../../src/components/MaxImage.vue';

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
});
