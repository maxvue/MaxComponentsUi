import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';

describe('MaxInputFileUpload (Unit & A11y & Deletion)', () => {
    it('renderiza miniaturas com role button e aria-label descritivo', () => {
        const file = { id: 1, name: 'documento.pdf', size: 10240 };
        const wrapper = mount(MaxInputFileUpload, {
            props: {
                modelValue: [file],
                showMetadata: true
            },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        const iconItem = wrapper.find('.file-icon');
        expect(iconItem.exists()).toBe(true);
        expect(iconItem.attributes('role')).toBe('button');
        expect(iconItem.attributes('tabindex')).toBe('0');
        expect(iconItem.attributes('aria-label')).toBe('Visualizar arquivo documento.pdf');
    });

    it('emite evento file-click ao pressionar Enter ou Espaço na miniatura', async () => {
        const file = { id: 1, name: 'documento.pdf' };
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [file] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        const iconItem = wrapper.find('.file-icon');
        await iconItem.trigger('keydown.enter');
        expect(wrapper.emitted('file-click')?.[0]).toEqual([file]);

        await iconItem.trigger('keydown.space');
        expect(wrapper.emitted('file-click')?.[1]).toEqual([file]);
    });

    it('remove arquivo e emite eventos delete e remove-file com payload correto', async () => {
        const fileA = { id: 10, name: 'relatorio.docx', size: 15000 };
        const fileB = { id: 20, name: 'tabela.xlsx', size: 25000 };
        const wrapper = mount(MaxInputFileUpload, {
            props: {
                modelValue: [fileA, fileB],
                removable: true
            },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        const removeBtns = wrapper.findAll('.file-remove-btn');
        expect(removeBtns).toHaveLength(2);

        await removeBtns[1].trigger('click');

        expect(wrapper.emitted('delete')).toBeTruthy();
        expect(wrapper.emitted('delete')?.[0]).toEqual([{ file: fileB, index: 1 }]);
        expect(wrapper.emitted('remove-file')?.[0]).toEqual([{ file: fileB, index: 1 }]);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[fileA]]);
    });

    it('bloqueia remoção quando disabled=true nos attrs', async () => {
        const file = { id: 1, name: 'bloqueado.pdf' };
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [file], removable: true },
            attrs: { disabled: true },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });

        const vm = wrapper.vm as any;
        vm.removeFile(0, file);

        expect(wrapper.emitted('delete')).toBeFalsy();
        expect(wrapper.emitted('remove-file')).toBeFalsy();
    });

    it('resolve corretamente ícones de formatos variados e fallback', () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { Icon: true },
                directives: { tooltip: () => {} }
            }
        });
        const vm = wrapper.vm as any;

        expect(vm.resolveFileIcon('contrato.pdf')).toBe('ph:file-pdf-light');
        expect(vm.resolveFileIcon('foto.jpg')).toBe('ph:file-jpg-light');
        expect(vm.resolveFileIcon('avatar.png')).toBe('ph:file-png-light');
        expect(vm.resolveFileIcon('proposta.doc')).toBe('ph:file-doc-light');
        expect(vm.resolveFileIcon('proposta.docx')).toBe('ph:file-doc-light');
        expect(vm.resolveFileIcon('dados.xls')).toBe('ph:file-xls-light');
        expect(vm.resolveFileIcon('dados.xlsx')).toBe('ph:file-xls-light');
        expect(vm.resolveFileIcon('dados.csv')).toBe('ph:file-xls-light');
        expect(vm.resolveFileIcon('arquivo.zip')).toBe('ph:file-zip-light');
        expect(vm.resolveFileIcon('arquivo.rar')).toBe('ph:file-zip-light');
        expect(vm.resolveFileIcon('arquivo.7z')).toBe('ph:file-zip-light');
        expect(vm.resolveFileIcon('arquivo.tar')).toBe('ph:file-zip-light');
        expect(vm.resolveFileIcon('arquivo.gz')).toBe('ph:file-zip-light');
        expect(vm.resolveFileIcon('notas.txt')).toBe('ph:file-text-light');
        expect(vm.resolveFileIcon('instrucoes.md')).toBe('ph:file-text-light');
        expect(vm.resolveFileIcon('desconhecido.bin')).toBe('ph:file-light');
    });
});
