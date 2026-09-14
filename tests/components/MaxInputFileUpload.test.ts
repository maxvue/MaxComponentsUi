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
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        wrapper.vm.onUploadHandler({ xhr: { response: 'invalid json' } });
        expect(errorSpy).toHaveBeenCalled();
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

    it('mantém exibição de erro persistente sem auto-destruição e permite descartar ou tentar novamente', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: { url: '/api/upload' },
            global: {
                stubs: { Icon: true, MaxIcon: true, MaxButton: true, MaxIconButton: true },
                directives: { tooltip: () => {} }
            }
        });

        wrapper.vm.showError = true;
        wrapper.vm.errorMessage = 'Falha no upload';
        wrapper.vm.uploading = false;

        await wrapper.vm.$nextTick();

        // Garante que o erro persiste sem desaparecer por timer
        expect(wrapper.vm.showError).toBe(true);
        expect(wrapper.find('.upload-error-state').exists()).toBe(true);
        expect(wrapper.find('.error-text').text()).toBe('Falha no upload');

        // Testar dismissError
        wrapper.vm.dismissError();
        expect(wrapper.vm.showError).toBe(false);
        expect(wrapper.vm.errorMessage).toBeNull();

        // Testar retryUpload
        const xhrOpenSpy = vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => {});
        const xhrSendSpy = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {});
        wrapper.vm.showError = true;
        wrapper.vm.files = [new File(['hello'], 'test.pdf', { type: 'application/pdf' })];
        wrapper.vm.retryUpload();
        expect(xhrOpenSpy).toHaveBeenCalledWith('POST', '/api/upload', true);
        expect(wrapper.vm.showError).toBe(false);
        xhrOpenSpy.mockRestore();
        xhrSendSpy.mockRestore();
    });

    it('renderiza indicador de carregamento com classe semântica upload-loading-state e barra de progresso', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { Icon: true, MaxIcon: true, MaxButton: true, MaxIconButton: true },
                directives: { tooltip: () => {} }
            }
        });

        wrapper.vm.uploading = true;
        wrapper.vm.uploadProgress = 45;
        await wrapper.vm.$nextTick();

        const loadingDiv = wrapper.find('.upload-loading-state');
        expect(loadingDiv.exists()).toBe(true);
        expect(loadingDiv.classes()).not.toContain('flex');
        expect(loadingDiv.find('.upload-progress-text').text()).toBe('Enviando... 45%');
        const progressBar = loadingDiv.find('.progress-bar-fill');
        expect(progressBar.attributes('aria-valuenow')).toBe('45');
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
        expect(removeButtons[0].attributes('aria-label')).toBe('Remover arquivo relatorio.pdf');

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

    it('transiciona corretamente os estados da máquina de upload: idle -> selected -> uploading -> error -> retry', async () => {
        let createdXhr: any = null;
        vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(function (this: any) {
            createdXhr = this;
        });
        vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {});

        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: { url: '/api/upload', auto: false },
            global: {
                stubs: { Icon: true, MaxIcon: true, MaxButton: true, MaxIconButton: true },
                directives: { tooltip: () => {} }
            }
        });

        expect(wrapper.vm.uploadStatus).toBe('idle');

        const testFile = new File(['conteudo'], 'doc.pdf', { type: 'application/pdf' });
        wrapper.vm.onSelectHandler({ files: [testFile] });
        expect(wrapper.vm.uploadStatus).toBe('selected');
        expect(wrapper.vm.files).toHaveLength(1);

        // Start upload
        wrapper.vm.startUpload(wrapper.vm.files);
        expect(wrapper.vm.uploadStatus).toBe('uploading');
        expect(wrapper.vm.uploading).toBe(true);

        // Simula erro HTTP
        Object.defineProperty(createdXhr, 'status', { value: 500, writable: true, configurable: true });
        Object.defineProperty(createdXhr, 'statusText', { value: 'Internal Server Error', writable: true, configurable: true });
        createdXhr.onload();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.uploadStatus).toBe('error');
        expect(wrapper.vm.showError).toBe(true);
        // Arquivos originais permanecem intactos para retry
        expect(wrapper.vm.files).toHaveLength(1);
        expect(wrapper.vm.files[0].name).toBe('doc.pdf');

        // Retry dispara nova requisição com os mesmos arquivos
        wrapper.vm.retryUpload();
        expect(wrapper.vm.uploadStatus).toBe('uploading');
        expect(wrapper.vm.showError).toBe(false);

        // Simula sucesso no retry
        Object.defineProperty(createdXhr, 'status', { value: 200, writable: true, configurable: true });
        Object.defineProperty(createdXhr, 'response', { value: JSON.stringify({ file: { id: 10, name: 'doc.pdf' } }), writable: true, configurable: true });
        createdXhr.onload();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.uploadStatus).toBe('success');
        expect(wrapper.vm.uploadProgress).toBe(100);

        vi.restoreAllMocks();
    });

    it('aborta XHR ativo ao desmontar o componente ou ao reiniciar o upload', () => {
        const abortSpy = vi.fn();
        vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => {});
        vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function (this: any) {
            this.abort = abortSpy;
        });

        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: { url: '/api/upload' },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        const testFile = new File(['data'], 'teste.pdf', { type: 'application/pdf' });
        wrapper.vm.startUpload([testFile]);

        // Novo startUpload aborta o anterior
        wrapper.vm.startUpload([testFile]);
        expect(abortSpy).toHaveBeenCalledTimes(1);

        // Unmount aborta o atual
        wrapper.unmount();
        expect(abortSpy).toHaveBeenCalledTimes(2);

        vi.restoreAllMocks();
    });

    it('emite evento progress com loaded, total e percentual calculado', () => {
        let createdXhr: any = null;
        vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(function (this: any) {
            createdXhr = this;
        });
        vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {});

        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: { url: '/api/upload' },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        const testFile = new File(['data'], 'teste.pdf', { type: 'application/pdf' });
        wrapper.vm.startUpload([testFile]);

        // Simula evento onprogress com lengthComputable = true
        const progressEvent = { lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent;
        createdXhr.upload.onprogress(progressEvent);

        expect(wrapper.emitted('progress')).toBeTruthy();
        expect(wrapper.emitted('progress')?.[0]?.[0]).toMatchObject({
            progress: 50,
            loaded: 50,
            total: 100
        });
        expect(wrapper.vm.uploadProgress).toBe(50);

        vi.restoreAllMocks();
    });

    it('lida com progresso indeterminado e atualiza anúncios na região live acessível', async () => {
        let createdXhr: any = null;
        vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(function (this: any) {
            createdXhr = this;
        });
        vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {});

        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            attrs: { url: '/api/upload' },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        const testFile = new File(['data'], 'teste.pdf', { type: 'application/pdf' });
        wrapper.vm.startUpload([testFile]);
        await wrapper.vm.$nextTick();

        const liveRegion = wrapper.find('[role="status"]');
        expect(liveRegion.exists()).toBe(true);
        expect(liveRegion.text()).toContain('Iniciando upload');

        // Simula progresso com lengthComputable = false
        createdXhr.upload.onprogress({ lengthComputable: false });
        await wrapper.vm.$nextTick();

        const progressBar = wrapper.find('.progress-bar-fill');
        expect(progressBar.classes()).toContain('is-indeterminate');
        expect(progressBar.attributes('aria-valuenow')).toBeUndefined();

        vi.restoreAllMocks();
    });
});
