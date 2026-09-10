// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFile from '../../src/components/MaxInputFile.vue';

if (typeof window.DragEvent === 'undefined') {
    class DragEventPolyfill extends MouseEvent {}
    window.DragEvent = DragEventPolyfill as unknown as typeof DragEvent;
    globalThis.DragEvent = DragEventPolyfill as unknown as typeof DragEvent;
}

describe('MaxInputFile', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renderiza os elementos estruturais documentados', () => {
        const wrapper = mount(MaxInputFile);

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.input-file-main-div').exists()).toBe(true);

        const hiddenInput = wrapper.find<HTMLInputElement>('input.max-input-file-hidden');
        expect(hiddenInput.exists()).toBe(true);
        expect(hiddenInput.attributes('type')).toBe('file');
        expect(hiddenInput.attributes('multiple')).toBeDefined();
        expect(hiddenInput.element.style.display).toBe('none');

        const labelEl = wrapper.find('.input-file-content-label');
        expect(labelEl.exists()).toBe(true);
        expect(labelEl.html()).toContain('Clique aqui, arraste e solte');
    });

    it('renderiza label customizado informado via prop ou via attr', async () => {
        const wrapperProp = mount(MaxInputFile, {
            props: {
                label: 'Arraste suas fotos aqui'
            }
        });
        expect(wrapperProp.find('.input-file-content-label').text()).toContain('Arraste suas fotos aqui');

        const wrapperAttr = mount(MaxInputFile, {
            attrs: {
                label: 'Upload via atributo'
            }
        });
        expect(wrapperAttr.find('.input-file-content-label').text()).toContain('Upload via atributo');
    });

    it('higieniza conteúdo de label contra XSS', () => {
        const wrapper = mount(MaxInputFile, {
            props: {
                label: 'Upload seguro <img src=x onerror="alert(1)">'
            }
        });
        expect(wrapper.html()).not.toContain('onerror');
        expect(wrapper.find('.input-file-content-label').text()).toContain('Upload seguro');
    });

    it('aciona o clique no input oculto ao clicar no container principal', async () => {
        const wrapper = mount(MaxInputFile);
        const hiddenInput = wrapper.find<HTMLInputElement>('input.max-input-file-hidden');
        const clickSpy = vi.spyOn(hiddenInput.element, 'click');

        await wrapper.find('.input-file-main-div').trigger('click');
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('seleciona arquivos pelo input nativo e emite update:modelValue', async () => {
        const wrapper = mount(MaxInputFile);
        const hiddenInput = wrapper.find<HTMLInputElement>('input.max-input-file-hidden');
        const testFile = new File(['conteudo-teste'], 'documento.pdf', { type: 'application/pdf' });

        Object.defineProperty(hiddenInput.element, 'files', {
            value: [testFile],
            writable: true
        });

        await hiddenInput.trigger('change');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual([testFile]);

        const previewItem = wrapper.find('.files-list-preview-content');
        expect(previewItem.exists()).toBe(true);
        expect(previewItem.text()).toContain('documento.pdf');
        expect(previewItem.text()).toContain('KB');
    });

    it('adiciona arquivos e emite update:modelValue via drop zone', async () => {
        const wrapper = mount(MaxInputFile);
        const dropZone = wrapper.find('.drop-zone-div');
        expect(dropZone.exists()).toBe(true);

        const droppedFile = new File(['dropped-data'], 'planta.pdf', { type: 'application/pdf' });
        const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                files: [droppedFile],
                items: [{ type: droppedFile.type }]
            }
        });

        await wrapper.vm.$nextTick();
        dropZone.element.dispatchEvent(dropEvent);
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual([droppedFile]);
    });

    it('captura arquivos colados via Ctrl+V no window', async () => {
        const wrapper = mount(MaxInputFile);
        const pastedImage = new File(['img-data'], 'captura.png', { type: 'image/png' });

        const pasteEvent = Object.assign(new Event('paste', { bubbles: true, cancelable: true }), {
            clipboardData: {
                items: [
                    {
                        kind: 'file',
                        type: 'image/png',
                        getAsFile: () => pastedImage
                    }
                ],
                files: [pastedImage]
            }
        });

        window.dispatchEvent(pasteEvent);
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0].length).toBe(1);
        expect(emitted![0][0][0].type).toBe('image/png');

        wrapper.unmount();
    });

    it('remove arquivo ao clicar na lixeira e emite lista atualizada', async () => {
        const file1 = new File(['1'], 'arquivo1.txt', { type: 'text/plain' });
        const file2 = new File(['2'], 'arquivo2.txt', { type: 'text/plain' });

        const wrapper = mount(MaxInputFile, {
            props: {
                modelValue: [file1, file2]
            }
        });

        const trashButtons = wrapper.findAll('.trash-icon-remove-clipboard');
        expect(trashButtons.length).toBe(2);

        await trashButtons[0].trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual([file2]);
        expect(wrapper.findAll('.files-list-preview-content').length).toBe(1);
    });

    it('oculta pré-visualização quando atributos no-view ou no-preview são usados', () => {
        const file = new File(['1'], 'arquivo.txt', { type: 'text/plain' });

        const wrapperNoView = mount(MaxInputFile, {
            props: { modelValue: [file] },
            attrs: { 'no-view': '' }
        });
        expect(wrapperNoView.find('.files-list-preview').exists()).toBe(false);

        const wrapperNoPreview = mount(MaxInputFile, {
            props: { modelValue: [file] },
            attrs: { 'no-preview': '' }
        });
        expect(wrapperNoPreview.find('.files-list-preview').exists()).toBe(false);
    });

    it('renderiza modo compacto quando size-files="mini" ou size-preview="mini"', () => {
        const file = new File(['1'], 'arquivo.txt', { type: 'text/plain' });

        const wrapperMini = mount(MaxInputFile, {
            props: { modelValue: [file] },
            attrs: { 'size-files': 'mini' }
        });
        expect(wrapperMini.find('.files-list-mini').exists()).toBe(true);
        expect(wrapperMini.find('.files-list-preview').exists()).toBe(false);

        const wrapperPreviewMini = mount(MaxInputFile, {
            props: { modelValue: [file] },
            attrs: { 'size-preview': 'mini' }
        });
        expect(wrapperPreviewMini.find('.files-list-mini').exists()).toBe(true);
        expect(wrapperPreviewMini.find('.files-list-preview').exists()).toBe(false);
    });

    it('permite customização através dos slots button e filesPreview', () => {
        const file = new File(['1'], 'arquivo.txt', { type: 'text/plain' });

        const wrapper = mount(MaxInputFile, {
            props: { modelValue: [file] },
            slots: {
                button: '<button class="custom-button-slot">Upload Personalizado</button>',
                filesPreview: '<ul class="custom-preview-slot"><li>Item</li></ul>'
            }
        });

        expect(wrapper.find('.custom-button-slot').exists()).toBe(true);
        expect(wrapper.find('.custom-button-slot').text()).toBe('Upload Personalizado');
        expect(wrapper.find('.custom-preview-slot').exists()).toBe(true);
        expect(wrapper.find('.files-list-preview').exists()).toBe(false);
    });

    it('desaloca URLs de objeto ao remover imagem e ao desmontar o componente', async () => {
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
        const imgFile = new File(['bytes'], 'foto.png', { type: 'image/png' });

        const wrapper = mount(MaxInputFile, {
            props: { modelValue: [imgFile] }
        });

        const img = wrapper.find('.files-list-preview-content img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBeTruthy();

        // Exclui a imagem
        await wrapper.find('.trash-icon-remove-clipboard').trigger('click');
        expect(revokeSpy).toHaveBeenCalledTimes(1);

        // Monta outro com imagem e desmonta
        const wrapper2 = mount(MaxInputFile, {
            props: { modelValue: [imgFile] }
        });
        expect(wrapper2.find('.files-list-preview-content img').exists()).toBe(true);

        wrapper2.unmount();
        expect(revokeSpy).toHaveBeenCalledTimes(2);
    });

    it('atualiza temp_value quando a prop modelValue muda externamente', async () => {
        const file1 = new File(['1'], 'doc1.pdf', { type: 'application/pdf' });
        const file2 = new File(['2'], 'doc2.pdf', { type: 'application/pdf' });

        const wrapper = mount(MaxInputFile, {
            props: { modelValue: [file1] }
        });

        expect(wrapper.findAll('.files-list-preview-content').length).toBe(1);

        await wrapper.setProps({ modelValue: [file1, file2] });
        expect(wrapper.findAll('.files-list-preview-content').length).toBe(2);
    });
});
