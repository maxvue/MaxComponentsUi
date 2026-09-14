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
        expect(hiddenInput.classes()).toContain('max-input-file-hidden');

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

    it('captura arquivos colados via paste no container e não sequestra o evento global no window', async () => {
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

        // Disparo global no window não deve capturar arquivos
        window.dispatchEvent(pasteEvent);
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();

        // Disparo no elemento container do componente captura os arquivos
        wrapper.find('.input-file-main-div').element.dispatchEvent(pasteEvent);
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const files = (emitted?.[0]?.[0] ?? []) as File[];
        expect(files.length).toBe(1);
        expect(files[0]?.type).toBe('image/png');

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

    describe('E07-01: Reconciliação de URLs e isolamento multi-instância', () => {
        it('revoga Object URLs de arquivos removidos externamente via modelValue', async () => {
            const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
            const img1 = new File(['img1'], 'foto1.png', { type: 'image/png' });
            const img2 = new File(['img2'], 'foto2.png', { type: 'image/png' });

            const wrapper = mount(MaxInputFile, {
                props: { modelValue: [img1, img2] }
            });

            // Ambos renderizam previews
            const images = wrapper.findAll('.files-list-preview-content img');
            expect(images.length).toBe(2);

            // Remove img1 externamente
            await wrapper.setProps({ modelValue: [img2] });
            expect(revokeSpy).toHaveBeenCalledTimes(1);

            // Remove img2 externamente
            await wrapper.setProps({ modelValue: [] });
            expect(revokeSpy).toHaveBeenCalledTimes(2);

            wrapper.unmount();
        });

        it('isola paste entre duas instâncias ativas', async () => {
            const wrapper1 = mount(MaxInputFile);
            const wrapper2 = mount(MaxInputFile);
            const pastedFile = new File(['data'], 'test.png', { type: 'image/png' });

            const pasteEvent = Object.assign(new Event('paste', { bubbles: true, cancelable: true }), {
                clipboardData: {
                    items: [
                        {
                            kind: 'file',
                            type: 'image/png',
                            getAsFile: () => pastedFile
                        }
                    ],
                    files: [pastedFile]
                }
            });

            // Dispara na instância 1
            wrapper1.find('.input-file-main-div').element.dispatchEvent(pasteEvent);
            await wrapper1.vm.$nextTick();
            await wrapper2.vm.$nextTick();

            expect(wrapper1.emitted('update:modelValue')).toBeTruthy();
            expect(wrapper2.emitted('update:modelValue')).toBeFalsy();

            wrapper1.unmount();
            wrapper2.unmount();
        });
    });

    describe('E07-04: Operabilidade por teclado e acessibilidade', () => {
        it('botão de remoção utiliza elemento button nativo com aria-label nomeado', () => {
            const file = new File(['text'], 'relatorio.pdf', { type: 'application/pdf' });
            const wrapper = mount(MaxInputFile, {
                props: { modelValue: [file] }
            });

            const removeBtn = wrapper.find('button.trash-icon-remove-clipboard');
            expect(removeBtn.exists()).toBe(true);
            expect(removeBtn.element.tagName.toLowerCase()).toBe('button');
            expect(removeBtn.attributes('aria-label')).toBe('Remover relatorio.pdf');
        });

        it('respeita prop disabled desabilitando container, input e botão de remoção', async () => {
            const file = new File(['text'], 'documento.pdf', { type: 'application/pdf' });
            const wrapper = mount(MaxInputFile, {
                props: { modelValue: [file], disabled: true }
            });

            const mainDiv = wrapper.find('.input-file-main-div');
            expect(mainDiv.classes()).toContain('is-disabled');
            expect(mainDiv.attributes('tabindex')).toBe('-1');
            expect(mainDiv.attributes('aria-disabled')).toBe('true');

            const hiddenInput = wrapper.find<HTMLInputElement>('input.max-input-file-hidden');
            expect(hiddenInput.attributes('disabled')).toBeDefined();

            const removeBtn = wrapper.find('button.trash-icon-remove-clipboard');
            expect(removeBtn.attributes('disabled')).toBeDefined();

            // Clique na lixeira desabilitada não remove arquivo
            await removeBtn.trigger('click');
            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        });

        it('anuncia atualizações da lista em live region acessível', async () => {
            const wrapper = mount(MaxInputFile);
            const liveRegion = wrapper.find('[role="status"][aria-live="polite"]');
            expect(liveRegion.exists()).toBe(true);

            const file = new File(['test'], 'exemplo.txt', { type: 'text/plain' });
            await wrapper.setProps({ modelValue: [file] });

            expect(liveRegion.text()).toContain('1 arquivo selecionado');
        });

        it('ativa seleção de arquivo via teclado no container (Enter e Espaço) (F19 / E07-04)', async () => {
            const wrapper = mount(MaxInputFile);
            const hiddenInput = wrapper.find<HTMLInputElement>('input.max-input-file-hidden');
            const clickSpy = vi.spyOn(hiddenInput.element, 'click');

            const container = wrapper.find('.input-file-main-div');

            // Ativação via tecla Enter
            await container.trigger('keydown.enter');
            expect(clickSpy).toHaveBeenCalledTimes(1);

            // Ativação via tecla Espaço
            await container.trigger('keydown.space');
            expect(clickSpy).toHaveBeenCalledTimes(2);

            wrapper.unmount();
        });

        it('remove arquivo através da ativação nativa por clique do botão (F19 / E07-04)', async () => {
            const file1 = new File(['1'], 'doc1.pdf', { type: 'application/pdf' });
            const file2 = new File(['2'], 'doc2.pdf', { type: 'application/pdf' });
            const wrapper = mount(MaxInputFile, {
                props: { modelValue: [file1, file2] }
            });

            const removeBtn = wrapper.find('button.trash-icon-remove-clipboard');
            expect(removeBtn.exists()).toBe(true);
            expect(removeBtn.element.tagName.toLowerCase()).toBe('button');

            // Botão HTML nativo recebe Enter/Espaço e despacha evento click nativo
            await removeBtn.trigger('click');
            await wrapper.vm.$nextTick();

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted).toBeTruthy();
            expect(emitted?.length).toBe(1);
            expect(emitted?.[0][0]).toEqual([file2]);

            wrapper.unmount();
        });

        it('gerencia foco visível no container e remove listeners adequadamente (F19 / E07-04)', async () => {
            const wrapper = mount(MaxInputFile);
            const container = wrapper.find('.input-file-main-div');

            expect(container.attributes('tabindex')).toBe('0');

            await container.trigger('focus');
            expect((wrapper.vm as any).isFocused).toBe(true);

            await container.trigger('blur');
            expect((wrapper.vm as any).isFocused).toBe(false);

            wrapper.unmount();
        });

        it('quando desabilitado, impede ativação por teclado no container (F19 / E07-04)', async () => {
            const wrapper = mount(MaxInputFile, {
                props: { disabled: true }
            });
            const hiddenInput = wrapper.find<HTMLInputElement>('input.max-input-file-hidden');
            const clickSpy = vi.spyOn(hiddenInput.element, 'click');

            const container = wrapper.find('.input-file-main-div');
            expect(container.attributes('tabindex')).toBe('-1');
            expect(container.attributes('aria-disabled')).toBe('true');

            await container.trigger('keydown.enter');
            await container.trigger('keydown.space');
            await container.trigger('click');

            expect(clickSpy).not.toHaveBeenCalled();
            wrapper.unmount();
        });

        it('emite update:modelValue exatamente uma vez com múltiplos arquivos selecionados simultaneamente (F19 / E07-05)', async () => {
            const wrapper = mount(MaxInputFile);
            const hiddenInput = wrapper.find<HTMLInputElement>('input.max-input-file-hidden');

            const f1 = new File(['a'], 'a.txt', { type: 'text/plain' });
            const f2 = new File(['b'], 'b.txt', { type: 'text/plain' });
            const f3 = new File(['c'], 'c.txt', { type: 'text/plain' });

            Object.defineProperty(hiddenInput.element, 'files', {
                value: [f1, f2, f3],
                writable: true
            });

            await hiddenInput.trigger('change');
            await wrapper.vm.$nextTick();

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted).toBeTruthy();
            expect(emitted?.length).toBe(1);
            expect(emitted?.[0][0]).toEqual([f1, f2, f3]);

            wrapper.unmount();
        });
    });
});
