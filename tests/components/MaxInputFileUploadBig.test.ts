import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxInputFileUploadBig from '../../src/components/MaxInputFileUploadBig.vue';

// O componente usa useFileDialog/useDropZone (re-exports de @vueuse/core via @maxvue/max-use)
// diretamente — não delega para MaxInputFileUpload. Mockamos os composables para controlar
// os callbacks onChange/onDrop e simular a seleção/arraste de arquivos.
let fileDialogOnChangeCb: ((fileList: FileList | null) => void) | null = null;
let dropZoneOnDropCb: ((files: File[] | null) => void) | null = null;
const openMock = vi.fn();
const resetMock = vi.fn();

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        useFileDialog: (_opts: any) => {
            return {
                open: openMock,
                reset: resetMock,
                onChange: (cb: (fileList: FileList | null) => void) => {
                    fileDialogOnChangeCb = cb;
                }
            };
        },
        useDropZone: (_target: any, opts: any) => {
            dropZoneOnDropCb = opts.onDrop;
            return { isOverDropZone: ref(false) };
        }
    };
});

function makeFileList(files: File[]): FileList {
    return {
        length: files.length,
        item: (i: number) => files[i] ?? null,
        [Symbol.iterator]: function* () {
            for (const f of files) yield f;
        },
        ...files
    } as unknown as FileList;
}

describe('MaxInputFileUploadBig', () => {
    it('deve renderizar o componente de upload grande corretamente', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.input-upload-file-big-main-div').exists()).toBe(true);
        expect(wrapper.find('.upload-area').exists()).toBe(true);
    });

    it('escapa o label impedindo injecao de HTML (XSS)', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            props: {
                label: '<img src="x" onerror="alert(1)"><b>Upload</b>'
            },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const area = wrapper.find('.upload-area');
        expect(area.find('img').exists()).toBe(false);
        expect(area.find('b').exists()).toBe(false);
        expect(area.text()).toContain('<b>Upload</b>');
    });

    it('renderiza o conteúdo do slot default quando fornecido', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            slots: {
                default: '<div class="custom-default-slot">Arraste aqui</div>'
            },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        expect(wrapper.find('.custom-default-slot').exists()).toBe(true);
        expect(wrapper.find('.custom-default-slot').text()).toBe('Arraste aqui');
    });

    it('renderiza o conteúdo do slot uploading quando uploading=true', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            props: { uploading: true },
            slots: {
                uploading: '<div class="custom-uploading-slot">Enviando...</div>'
            },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        expect(wrapper.find('.custom-uploading-slot').exists()).toBe(true);
        expect(wrapper.find('.custom-uploading-slot').text()).toBe('Enviando...');
        expect(wrapper.find('.upload-area').exists()).toBe(false);
    });

    it('renderiza o conteúdo do slot error quando o estado de erro está ativo', async () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            slots: {
                error: '<div class="custom-error-slot">Falhou</div>'
            },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        (wrapper.vm as any).showError = true;
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.custom-error-slot').exists()).toBe(true);
        expect(wrapper.find('.custom-error-slot').text()).toBe('Falhou');
    });

    it('chama onSelect com os arquivos corretos quando o file dialog seleciona arquivos', () => {
        const onSelect = vi.fn();
        mount(MaxInputFileUploadBig, {
            props: { onSelect },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const file1 = new File(['a'], 'a.pdf');
        const file2 = new File(['b'], 'b.png');
        expect(fileDialogOnChangeCb).not.toBeNull();
        fileDialogOnChangeCb?.(makeFileList([file1, file2]));

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ files: [file1, file2] });
        expect(resetMock).toHaveBeenCalled();
    });

    it('não chama onSelect quando o file dialog retorna lista vazia', () => {
        const onSelect = vi.fn();
        mount(MaxInputFileUploadBig, {
            props: { onSelect },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        fileDialogOnChangeCb?.(makeFileList([]));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('chama onSelect com os arquivos arrastados via drop zone', () => {
        const onSelect = vi.fn();
        mount(MaxInputFileUploadBig, {
            props: { onSelect },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const file = new File(['a'], 'dropped.pdf');
        expect(dropZoneOnDropCb).not.toBeNull();
        dropZoneOnDropCb?.([file]);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ files: [file] });
    });

    it('ignora arquivos arrastados quando disabled=true', () => {
        const onSelect = vi.fn();
        mount(MaxInputFileUploadBig, {
            props: { disabled: true, onSelect },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const file = new File(['a'], 'dropped.pdf');
        dropZoneOnDropCb?.([file]);

        expect(onSelect).not.toHaveBeenCalled();
    });

    it('abre o file dialog ao clicar na área quando não está desabilitado', async () => {
        openMock.mockClear();
        const wrapper = mount(MaxInputFileUploadBig, {
            props: { disabled: false },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        await wrapper.find('.input-upload-file-big-main-div').trigger('click');
        expect(openMock).toHaveBeenCalledTimes(1);
    });

    it('não abre o file dialog ao clicar na área quando disabled=true', async () => {
        openMock.mockClear();
        const wrapper = mount(MaxInputFileUploadBig, {
            props: { disabled: true },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        await wrapper.find('.input-upload-file-big-main-div').trigger('click');
        expect(openMock).not.toHaveBeenCalled();
    });
});
