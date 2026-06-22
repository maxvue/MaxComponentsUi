import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileProject from '../../src/components/MaxInputFileProject.vue';
import axios from 'axios';

vi.mock('axios', () => ({
    default: { post: vi.fn().mockResolvedValue({}) }
}));

let onChangeCallback: any;
let openMock = vi.fn();

vi.mock('@maxvue/max-use', () => ({
    getRoute: vi.fn(),
    useDropZone: () => ({ isOverDropZone: { value: false } }),
    useFileDialog: () => ({
        open: openMock,
        reset: vi.fn(),
        onChange: vi.fn((cb) => { onChangeCallback = cb; })
    }),
    ulid: vi.fn(() => '12345'),
    size: vi.fn((arr) => arr?.length || 0),
    isBlank: vi.fn((val) => !val)
}));

describe('MaxInputFileProject', () => {
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

    it('covers axios.catch na onFileUpload e formData uploadData e onChange', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // @ts-ignore
        axios.post.mockRejectedValue(new Error('Network error'));
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [], url: '/upload', uploadData: { a: 1, b: { c: 2 } } },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        // cover onChange callback
        if (onChangeCallback) onChangeCallback([{ name: 'file_test.png' }]);


        const file = new File(['content'], 'test.png', { type: 'image/png' });
        wrapper.vm.sendFile([file]);
        await new Promise((r) => setTimeout(r, 10));
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
