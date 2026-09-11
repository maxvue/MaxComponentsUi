import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';

describe('MaxInputFileUpload', () => {
    it('deve renderizar o componente corretamente com a label', () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { label: 'Fazer Upload', modelValue: [] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('deve emitir evento de erro no upload', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });
        const errorEvent = { message: 'Erro ao enviar' };
        wrapper.vm.onError(errorEvent);
        expect(wrapper.emitted('upload-error')).toBeTruthy();
    });

    it('deve atualizar o modelValue via evento onUploadHandler', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [], responseField: 'file' },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });
        const mockEvent = { xhr: { response: JSON.stringify({ file: { id: 1, name: 'documento.pdf' } }) } };
        await wrapper.vm.onUploadHandler(mockEvent);
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();

        // branch catch JSON
        wrapper.vm.onUploadHandler({ xhr: { response: 'invalid json' } });
    });

    it('covers all slots and functions', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        // trigger file select
        wrapper.vm.onSelectHandler({ files: [{ name: 'test.pdf', size: 100 }] });
        expect(wrapper.vm.files.length).toBe(1);

        // onBeforeUpload
        const mockRequest = {
            xhr: { setRequestHeader: vi.fn() },
            formData: { append: vi.fn() }
        };
        await wrapper.setProps({ token: '123', uploadData: { key1: 'value1' } });
        wrapper.vm.onBeforeUpload(mockRequest);
        expect(mockRequest.xhr.setRequestHeader).toHaveBeenCalledWith('X-CSRF-TOKEN', '123');
        expect(mockRequest.formData.append).toHaveBeenCalledWith('key1', 'value1');
        expect(mockRequest.formData.append).toHaveBeenCalledWith('extension', 'pdf');

        // triggerChoose
        wrapper.vm.triggerChoose();
    });

    it('custom events are called', async () => {
        const onSelectMock = vi.fn();
        const onUploadMock = vi.fn();
        const onErrorMock = vi.fn();

        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: {
                onSelect: onSelectMock,
                onUpload: onUploadMock,
                onError: onErrorMock
            },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        wrapper.vm.onSelectHandler({});
        expect(onSelectMock).toHaveBeenCalled();

        wrapper.vm.onUploadHandler({});
        expect(onUploadMock).toHaveBeenCalled();

        wrapper.vm.onError({});
        expect(onErrorMock).toHaveBeenCalled();
    });

    it('covers showError true branches and timeout', async () => {
        vi.useFakeTimers();
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        wrapper.vm.showError = true;
        wrapper.vm.uploading = false;

        await wrapper.vm.$nextTick();

        // Run the timer to cover the setTimeout inside watch(showError)
        vi.runAllTimers();
        expect(wrapper.vm.showError).toBe(false);

        vi.useRealTimers();
    });

    it('renderiza indicador de carregamento com classe semântica upload-loading-state', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        wrapper.vm.uploading = true;
        await wrapper.vm.$nextTick();

        const loadingDiv = wrapper.find('.upload-loading-state');
        expect(loadingDiv.exists()).toBe(true);
        expect(loadingDiv.classes()).not.toContain('flex');
        expect(loadingDiv.find('.upload-loading-text').text()).toBe('Carregando arquivos');
    });

    it('remove arquivo ao clicar no botão de remoção e emite eventos delete e remove-file', async () => {
        const file1 = { id: 1, name: 'relatorio.pdf', size: 1024 * 50 };
        const file2 = { id: 2, name: 'planilha.xlsx', size: 1024 * 1024 * 2 };
        const wrapper = mount(MaxInputFileUpload, {
            props: {
                modelValue: [file1, file2],
                removable: true
            },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        const removeButtons = wrapper.findAll('.file-remove-btn');
        expect(removeButtons).toHaveLength(2);
        expect(removeButtons[0].attributes('aria-label')).toBe('Remover arquivo');

        await removeButtons[0].trigger('click');

        expect(wrapper.emitted('delete')).toBeTruthy();
        expect(wrapper.emitted('delete')?.[0]).toEqual([{ file: file1, index: 0 }]);
        expect(wrapper.emitted('remove-file')).toBeTruthy();
        expect(wrapper.emitted('remove-file')?.[0]).toEqual([{ file: file1, index: 0 }]);
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[file2]]);
    });

    it('não exibe botão de remoção quando removable=false', () => {
        const file1 = { id: 1, name: 'relatorio.pdf', size: 1024 };
        const wrapper = mount(MaxInputFileUpload, {
            props: {
                modelValue: [file1],
                removable: false
            },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        expect(wrapper.find('.file-remove-btn').exists()).toBe(false);
    });

    it('resolve ícones e metadados para diferentes formatos de arquivos', () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });
        const vm = wrapper.vm as any;

        expect(vm.resolveFileIcon('doc.pdf')).toBe('ph:file-pdf-light');
        expect(vm.resolveFileIcon('foto.jpg')).toBe('ph:file-jpg-light');
        expect(vm.resolveFileIcon('foto.jpeg')).toBe('ph:file-jpg-light');
        expect(vm.resolveFileIcon('imagem.png')).toBe('ph:file-png-light');
        expect(vm.resolveFileIcon('texto.docx')).toBe('ph:file-doc-light');
        expect(vm.resolveFileIcon('tabela.xlsx')).toBe('ph:file-xls-light');
        expect(vm.resolveFileIcon('dados.csv')).toBe('ph:file-xls-light');
        expect(vm.resolveFileIcon('backup.zip')).toBe('ph:file-zip-light');
        expect(vm.resolveFileIcon('backup.7z')).toBe('ph:file-zip-light');
        expect(vm.resolveFileIcon('notas.txt')).toBe('ph:file-text-light');
        expect(vm.resolveFileIcon('README.md')).toBe('ph:file-text-light');
        expect(vm.resolveFileIcon('desconhecido.xyz')).toBe('ph:file-light');

        expect(vm.formatFileSize(500)).toBe('500 B');
        expect(vm.formatFileSize(2048)).toBe('2.0 KB');
        expect(vm.formatFileSize(1024 * 1024 * 3.5)).toBe('3.5 MB');
        expect(vm.formatFileSize(undefined)).toBe('');

        expect(vm.getFileName({ name: 'custom.pdf' })).toBe('custom.pdf');
        expect(vm.getFileName({ file_name: 'custom2.pdf' })).toBe('custom2.pdf');
        expect(vm.getFileName('string_name.pdf')).toBe('string_name.pdf');
    });

    it('possui atributos acessíveis nos botões de escolha e envio', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: { showUploadButton: true },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        const chooseBtn = wrapper.find('.p-fileupload-choose');
        expect(chooseBtn.attributes('aria-label')).toBe('Escolher arquivos para envio');

        wrapper.vm.uploading = true;
        await wrapper.vm.$nextTick();
        expect(chooseBtn.attributes('aria-label')).toBe('Carregando arquivos');

        const uploadBtn = wrapper.findAll('.p-button').find((b) => b.attributes('aria-label') === 'Enviar arquivos selecionados');
        expect(uploadBtn?.exists()).toBe(true);
    });
});
