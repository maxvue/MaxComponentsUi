import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileProject from '../../src/components/MaxInputFileProject.vue';
import type { DBFile } from '../../src/types';
import axios from 'axios';

vi.mock('axios', () => ({
    default: { post: vi.fn().mockResolvedValue({}) }
}));

let onChangeCallback: ((files: any) => void) | undefined;
let onDropCallback: ((files: any) => void) | undefined;
const openMock = vi.fn();
const resetMock = vi.fn();

let ulidCounter = 0;

vi.mock('@maxvue/max-use', () => ({
    getRoute: vi.fn(),
    useDropZone: (_target: any, opts: any) => {
        onDropCallback = opts?.onDrop;
        return { isOverDropZone: { value: false } };
    },
    useFileDialog: () => ({
        open: openMock,
        reset: resetMock,
        onChange: vi.fn((cb) => { onChangeCallback = cb; })
    }),
    ulid: vi.fn(() => (ulidCounter === 0 ? (++ulidCounter, '12345') : `id_${++ulidCounter}`)),
    size: vi.fn((arr) => arr?.length || 0),
    isBlank: vi.fn((val) => !val)
}));

describe('MaxInputFileProject', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ulidCounter = 0;
        onChangeCallback = undefined;
        onDropCallback = undefined;
        // @ts-ignore
        axios.post.mockReset();
        // @ts-ignore
        axios.post.mockResolvedValue({ data: { success: true } });
    });

    it('deve renderizar o componente e exibir as instruções de upload', async () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], buttons: [{ action: vi.fn() }] },
            global: { stubs: { MaxIconButton: { name: 'MaxIconButton', template: '<div @click="$emit(\'click\')"><slot /></div>' }, MaxIcon: true, MaxLoaderIcon: true, MaxButton: true } }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.instruction').text()).toContain('Insira fotos dos documentos');

        // cover click on open files button
        await wrapper.findComponent({ name: 'MaxIconButton' }).vm.$emit('click', { stopPropagation: vi.fn() });
        expect(openMock).toHaveBeenCalled();
    });

    it('deve atualizar a lista de arquivos quando a propriedade files mudar', async () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [] },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        // Add files to trigger getFileType and fileIcon edge cases
        await wrapper.setProps({ files: [
            { id: '1', name: 'teste.pdf', file_name: 'teste.pdf' } as unknown as DBFile,
            { id: '2', name: 'unknown.xyz', file_name: 'unknown.xyz' } as unknown as DBFile // to cover getFileType = null and fileIcon = mdi:file
        ] });
        expect(wrapper.vm.temp_files.length).toBe(2);
    });

    it('renderiza um MaxButton acionável para cada botão configurado', async () => {
        const actionMock = vi.fn();
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], buttons: [{ action: actionMock, data: { b: 2 } }] },
            global: {
                stubs: {
                    MaxIconButton: true,
                    MaxIcon: true,
                    MaxLoaderIcon: true,
                    MaxButton: {
                        name: 'MaxButton',
                        props: ['action', 'data'],
                        template: '<button class="max-button-stub" @click="action({ event: {}, data })">btn</button>'
                    }
                }
            }
        });

        const button = wrapper.find('.max-button-stub');
        expect(button.exists()).toBe(true);

        await button.trigger('click');
        expect(actionMock).toHaveBeenCalled();
    });

    it('atualiza temp_files e chama reset() ao selecionar arquivos via useFileDialog onChange', async () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        expect(onChangeCallback).toBeDefined();

        const mockFile = { name: 'documento_novo.png', type: 'image/png' };
        onChangeCallback!([mockFile]);
        await wrapper.vm.$nextTick();

        expect(resetMock).toHaveBeenCalledTimes(1);
        expect(wrapper.vm.temp_files).toHaveLength(1);
        expect(wrapper.vm.temp_files[0]).toMatchObject({
            id: '12345',
            name: 'documento_novo.png',
            extension: 'png',
            message_type: 'image',
            in_server: false,
            to_request_ai: true
        });
    });

    it('não altera temp_files nem chama reset() quando onChange recebe lista vazia ou nula', async () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        expect(onChangeCallback).toBeDefined();

        onChangeCallback!([]);
        onChangeCallback!(null as any);
        await wrapper.vm.$nextTick();

        expect(resetMock).not.toHaveBeenCalled();
        expect(wrapper.vm.temp_files).toHaveLength(0);
    });

    it('monta FormData com uploadData serializado e arquivos ao executar sendFile', async () => {
        // @ts-ignore
        axios.post.mockResolvedValue({ data: { success: true } });

        const wrapper = mount(MaxInputFileProject, {
            props: {
                files: [],
                url: '/api/upload',
                uploadData: { category: 'docs', meta: { folderId: 42 } },
                auto: false
            },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        const file = new File(['conteudo'], 'recibo.pdf', { type: 'application/pdf' });
        wrapper.vm.sendFile([file]);
        await new Promise((r) => setTimeout(r, 10));

        expect(axios.post).toHaveBeenCalledTimes(1);
        const [targetUrl, formDataArg, configArg] = (axios.post as any).mock.calls[0];

        expect(targetUrl).toBe('/api/upload');
        expect(formDataArg).toBeInstanceOf(FormData);
        expect(formDataArg.get('category')).toBe('docs');
        expect(formDataArg.get('meta')).toBe(JSON.stringify({ folderId: 42 }));
        expect(configArg.withCredentials).toBe(true);
    });

    it('captura erro do axios e exibe no console.error ao falhar envio em sendFile', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const networkError = new Error('Falha de conexão');
        // @ts-ignore
        axios.post.mockRejectedValue(networkError);

        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], url: '/api/upload', auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        const file = new File(['teste'], 'falha.png', { type: 'image/png' });
        await expect(wrapper.vm.sendFile([file])).rejects.toThrow('Falha de conexão');

        expect(consoleSpy).toHaveBeenCalledWith('Erro ao enviar arquivo. ', networkError);
        consoleSpy.mockRestore();
    });

    it('desmontar MaxInputFileProject revoga todas as Object URLs criadas', async () => {
        const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-1');
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const file = new File(['conteudo'], 'teste.pdf', { type: 'application/pdf' });
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [file as any] },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        expect(createSpy).toHaveBeenCalled();

        wrapper.unmount();

        expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/test-1');

        createSpy.mockRestore();
        revokeSpy.mockRestore();
    });

    it('remover um arquivo da lista revoga sua Object URL', async () => {
        let counter = 0;
        const createSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:http://localhost/url-${++counter}`);
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const file1 = new File(['1'], 'doc1.pdf', { type: 'application/pdf' });
        const file2 = new File(['2'], 'doc2.pdf', { type: 'application/pdf' });

        const wrapper = mount(MaxInputFileProject, {
            props: { files: [file1 as any, file2 as any] },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        // Atualiza a lista removendo o segundo arquivo
        await wrapper.setProps({ files: [file1 as any] });

        expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/url-2');

        createSpy.mockRestore();
        revokeSpy.mockRestore();
    });

    it('anexa arquivos a temp_files e emite files-selected ao soltar arquivos via useDropZone onDrop', async () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        expect(onDropCallback).toBeDefined();
        const droppedFile = new File(['test'], 'projeto.pdf', { type: 'application/pdf' });
        onDropCallback!([droppedFile]);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('files-selected')).toBeTruthy();
        expect(wrapper.emitted('files-selected')![0][0]).toEqual([droppedFile]);
        expect(wrapper.vm.temp_files).toHaveLength(1);
    });

    it('permite reexecutar uploads com falha via retry()', async () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], url: '/api/upload', auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        const file = new File(['teste'], 'falha.png', { type: 'image/png' });
        // Ingest file through drop
        onDropCallback!([file]);
        await wrapper.vm.$nextTick();

        const fileId = wrapper.vm.temp_files[0].id;
        expect(wrapper.vm.fileStatusMap.get(fileId)).toBe('queued');

        // First call fails
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // @ts-ignore
        axios.post.mockRejectedValueOnce(new Error('Network error'));
        await expect(wrapper.vm.sendFile()).rejects.toThrow('Network error');
        expect(wrapper.vm.fileStatusMap.get(fileId)).toBe('failed');
        expect(consoleSpy).toHaveBeenCalled();

        // Retry succeeds
        // @ts-ignore
        axios.post.mockResolvedValueOnce({ data: { ok: true } });
        await wrapper.vm.retry([fileId]);
        expect(wrapper.vm.fileStatusMap.get(fileId)).toBe('succeeded');
    });

    it('aborta requisições ativas ao desmontar o componente', async () => {
        let capturedSignal: AbortSignal | undefined;
        // @ts-ignore
        axios.post.mockImplementation((_url: string, _data: any, config: any) => {
            capturedSignal = config.signal;
            return new Promise(() => {}); // never resolves
        });

        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], url: '/api/upload', auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        const file = new File(['teste'], 'upload.png', { type: 'image/png' });
        wrapper.vm.sendFile([file]);
        await wrapper.vm.$nextTick();

        expect(capturedSignal).toBeDefined();
        expect(capturedSignal?.aborted).toBe(false);

        wrapper.unmount();
        expect(capturedSignal?.aborted).toBe(true);
    });

    it('não muta diretamente o arquivo original ao normalizar arquivos', async () => {
        const originalFile: any = new File(['dados'], 'contrato.pdf', { type: 'application/pdf' });
        Object.freeze(originalFile);

        const wrapper = mount(MaxInputFileProject, {
            props: { files: [originalFile], auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        expect(wrapper.vm.temp_files).toHaveLength(1);
        expect(wrapper.vm.temp_files[0].name).toBe('contrato.pdf');
        expect(wrapper.vm.temp_files[0]).not.toBe(originalFile);
    });

    it('ao adicionar A e em seguida B antes de A resolver, envia requisições distintas e não duplica A no POST de B', async () => {
        let resolveA: (val: any) => void;
        const promiseA = new Promise((resolve) => { resolveA = resolve; });
        // @ts-ignore
        axios.post.mockImplementationOnce(() => promiseA);
        // @ts-ignore
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], url: '/api/upload', auto: true },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        // Adiciona arquivo A
        const fileA = new File(['conteudo A'], 'docA.pdf', { type: 'application/pdf' });
        onDropCallback!([fileA]);
        await wrapper.vm.$nextTick();

        expect(axios.post).toHaveBeenCalledTimes(1);
        const formA = (axios.post as any).mock.calls[0][1] as FormData;
        expect(formA.get('files[0]')).toBeDefined();

        // Adiciona arquivo B enquanto A ainda está pendente
        const fileB = new File(['conteudo B'], 'docB.pdf', { type: 'application/pdf' });
        onDropCallback!([fileB]);
        await wrapper.vm.$nextTick();

        expect(axios.post).toHaveBeenCalledTimes(2);
        const formB = (axios.post as any).mock.calls[1][1] as FormData;
        // O segundo envio deve conter apenas B
        expect(formB.get('files[0]')).toBeDefined();
        // Não deve haver files[1] em formB
        expect(formB.get('files[1]')).toBeNull();

        // Resolve A
        resolveA!({ data: { success: true } });
        await wrapper.vm.$nextTick();
    });

    it('não tenta enviar upload se endpoint não estiver configurado', async () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], auto: true },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        const file = new File(['conteudo'], 'doc.pdf', { type: 'application/pdf' });
        onDropCallback!([file]);
        await wrapper.vm.$nextTick();

        expect(axios.post).not.toHaveBeenCalled();
        const res = await wrapper.vm.sendFile();
        expect(res).toBeUndefined();
    });

    it('desmontar com requisição pendente cancela e não emite upload-success nem upload-error tardios', async () => {
        let resolveRequest: (val: any) => void;
        let _rejectRequest: (err: any) => void;
        // @ts-ignore
        axios.post.mockImplementationOnce(() => new Promise((resolve, reject) => {
            resolveRequest = resolve;
            _rejectRequest = reject;
        }));

        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], url: '/api/upload', auto: false },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        const file = new File(['conteudo'], 'doc.pdf', { type: 'application/pdf' });
        onDropCallback!([file]);
        await wrapper.vm.$nextTick();

        wrapper.vm.sendFile();
        await wrapper.vm.$nextTick();

        wrapper.unmount();

        // Tenta resolver após unmount
        resolveRequest!({ data: { ok: true } });
        await new Promise((r) => setTimeout(r, 10));

        expect(wrapper.emitted('upload-success')).toBeUndefined();
        expect(wrapper.emitted('upload-error')).toBeUndefined();
    });

    describe('Reconciliação e Resiliência de Upload (F17 / E07-02)', () => {
        it('preserva arquivos locais queued/uploading quando o parent atualiza props.files', async () => {
            let resolveUpload: (val: any) => void;
            // @ts-ignore
            axios.post.mockImplementationOnce(() => new Promise((res) => { resolveUpload = res; }));

            const initialFiles = [
                { id: 'srv-1', name: 'servidor_1.pdf', in_server: true } as unknown as DBFile
            ];

            const wrapper = mount(MaxInputFileProject, {
                props: { files: initialFiles, url: '/api/upload', auto: true },
                global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
            });

            expect(wrapper.vm.temp_files).toHaveLength(1);
            expect(wrapper.vm.temp_files[0].id).toBe('srv-1');

            // Ingestão de arquivo local: inicia upload em background
            const localFile = new File(['local'], 'local_doc.pdf', { type: 'application/pdf' });
            onDropCallback!([localFile]);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.temp_files).toHaveLength(2);
            const localEntry = wrapper.vm.temp_files.find((f: any) => f.name === 'local_doc.pdf');
            expect(localEntry).toBeDefined();
            expect(wrapper.vm.fileStatusMap.get(localEntry!.id)).toBe('uploading');

            // O parent atualiza props.files com novo arquivo do servidor durante o upload local
            const updatedParentFiles = [
                { id: 'srv-1', name: 'servidor_1.pdf', in_server: true } as unknown as DBFile,
                { id: 'srv-2', name: 'servidor_2.pdf', in_server: true } as unknown as DBFile
            ];
            await wrapper.setProps({ files: updatedParentFiles });
            await wrapper.vm.$nextTick();

            // O arquivo local NÃO pode ter sido apagado pela reconciliação
            expect(wrapper.vm.temp_files).toHaveLength(3);
            expect(wrapper.vm.temp_files.map((f: any) => f.id)).toContain('srv-1');
            expect(wrapper.vm.temp_files.map((f: any) => f.id)).toContain('srv-2');
            expect(wrapper.vm.temp_files.map((f: any) => f.id)).toContain(localEntry!.id);

            // Finaliza o upload
            resolveUpload!({ data: { success: true } });
            await wrapper.vm.$nextTick();
            await new Promise((r) => setTimeout(r, 10));

            expect(wrapper.vm.fileStatusMap.get(localEntry!.id)).toBe('succeeded');
        });

        it('captura falha de auto-upload sem gerar unhandledRejection no processo', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            // @ts-ignore
            axios.post.mockRejectedValueOnce(new Error('Falha de conexão no auto-upload'));

            const wrapper = mount(MaxInputFileProject, {
                props: { files: [], url: '/api/upload', auto: true },
                global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
            });

            const file = new File(['dados'], 'auto_falha.pdf', { type: 'application/pdf' });
            onDropCallback!([file]);
            await wrapper.vm.$nextTick();

            // Aguarda microtasks/tick do sendFile
            await new Promise((r) => setTimeout(r, 20));

            expect(wrapper.emitted('upload-error')).toBeTruthy();
            const fileId = wrapper.vm.temp_files[0].id;
            expect(wrapper.vm.fileStatusMap.get(fileId)).toBe('failed');

            consoleSpy.mockRestore();
        });

        it('retry único: chamadas repetidas enquanto retry está em andamento não duplicam requisição', async () => {
            let resolveRetry: (val: any) => void;
            const retryPromise = new Promise((res) => { resolveRetry = res; });
            // @ts-ignore
            axios.post.mockImplementationOnce(() => retryPromise);

            const wrapper = mount(MaxInputFileProject, {
                props: { files: [], url: '/api/upload', auto: false },
                global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
            });

            const file = new File(['conteudo'], 'doc_retry.pdf', { type: 'application/pdf' });
            onDropCallback!([file]);
            await wrapper.vm.$nextTick();

            const fileId = wrapper.vm.temp_files[0].id;
            wrapper.vm.fileStatusMap.set(fileId, 'failed');

            // Primeiro retry
            const p1 = wrapper.vm.retry([fileId]);
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(wrapper.vm.fileStatusMap.get(fileId)).toBe('uploading');

            // Segundo retry concorrente antes do primeiro resolver
            const p2 = wrapper.vm.retry([fileId]);
            expect(axios.post).toHaveBeenCalledTimes(1); // NÃO chamou de novo!

            resolveRetry!({ data: { success: true } });
            await Promise.all([p1, p2]);
            expect(wrapper.vm.fileStatusMap.get(fileId)).toBe('succeeded');
        });
    });
});
