import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileProject from '../../src/components/MaxInputFileProject.vue';
import axios from 'axios';

vi.mock('axios', () => ({
    default: { post: vi.fn().mockResolvedValue({}) }
}));

let onChangeCallback: ((files: any) => void) | undefined;
const openMock = vi.fn();
const resetMock = vi.fn();

vi.mock('@maxvue/max-use', () => ({
    getRoute: vi.fn(),
    useDropZone: () => ({ isOverDropZone: { value: false } }),
    useFileDialog: () => ({
        open: openMock,
        reset: resetMock,
        onChange: vi.fn((cb) => { onChangeCallback = cb; })
    }),
    ulid: vi.fn(() => '12345'),
    size: vi.fn((arr) => arr?.length || 0),
    isBlank: vi.fn((val) => !val)
}));

describe('MaxInputFileProject', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        onChangeCallback = undefined;
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
            { id: '1', name: 'teste.pdf', file_name: 'teste.pdf' },
            { id: '2', name: 'unknown.xyz', file_name: 'unknown.xyz' } // to cover getFileType = null and fileIcon = mdi:file
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
        wrapper.vm.sendFile([file]);
        await new Promise((r) => setTimeout(r, 10));

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
});
