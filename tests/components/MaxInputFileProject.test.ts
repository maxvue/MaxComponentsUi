import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileProject from '../../src/components/MaxInputFileProject.vue';
import axios from 'axios';
import { goToRoute } from '@maxvue/max-use';

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
    isBlank: vi.fn((val) => !val),
    goToRoute: vi.fn()
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

    it('covers onClick com route e action', () => {
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [] },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });
        wrapper.vm.onClick({}, { route: 'home', params: { a: 1 } });
        expect(goToRoute).toHaveBeenCalledWith('home', { a: 1 });

        const actionMock = vi.fn();
        wrapper.vm.onClick({}, { action: actionMock, data: { b: 2 } });
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
