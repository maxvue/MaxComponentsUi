import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxFilePreview from '../../src/components/MaxFilePreview.vue';
import type { MaxPreviewFile } from '../../src/types/filePreview';

describe('MaxFilePreview.vue', () => {
    beforeEach(() => {
        if (!globalThis.URL.createObjectURL) globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-uuid');

        if (!globalThis.URL.revokeObjectURL) globalThis.URL.revokeObjectURL = vi.fn();

    });

    it('deve renderizar arquivo remoto exibindo nome, tamanho e extensão', () => {
        const remoteFile: MaxPreviewFile = {
            kind: 'remote',
            id: 'doc-123',
            name: 'contrato.pdf',
            size: 204800,
            url: 'https://example.com/contrato.pdf'
        };

        const wrapper = mount(MaxFilePreview, {
            props: {
                file: remoteFile
            }
        });

        expect(wrapper.text()).toContain('contrato.pdf');
        expect(wrapper.text()).toContain('PDF');
        expect(wrapper.find('.max-file-preview--pdf').exists()).toBe(true);
    });

    it('deve gerar objectURL para arquivo local e revogar ao desmontar', () => {
        const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-blob');
        const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const file = new File(['dados'], 'foto.jpg', { type: 'image/jpeg' });
        const localFile: MaxPreviewFile = {
            kind: 'local',
            id: 'file-1',
            file
        };

        const wrapper = mount(MaxFilePreview, {
            props: {
                file: localFile
            }
        });

        expect(createObjectURLSpy).toHaveBeenCalledWith(file);
        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('blob:http://localhost/mock-blob');

        wrapper.unmount();
        expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/mock-blob');
    });

    it('deve emitir error com reason invalid-url para URL perigosa como javascript:', () => {
        const maliciousFile: MaxPreviewFile = {
            kind: 'remote',
            id: 'bad-1',
            name: 'perigo.png',
            url: 'javascript:alert(1)'
        };

        const wrapper = mount(MaxFilePreview, {
            props: {
                file: maliciousFile
            }
        });

        expect(wrapper.emitted('error')).toHaveLength(1);
        expect(wrapper.emitted('error')?.[0]).toEqual([{ id: 'bad-1', reason: 'invalid-url' }]);
    });

    it('deve emitir open ao clicar no botão de abrir ou na miniatura', async () => {
        const file: MaxPreviewFile = {
            kind: 'remote',
            id: 'f1',
            name: 'projeto.docx',
            url: 'https://example.com/projeto.docx'
        };

        const wrapper = mount(MaxFilePreview, {
            props: {
                file
            }
        });

        const openBtn = wrapper.find('.max-file-preview__btn--open');
        await openBtn.trigger('click');

        expect(wrapper.emitted('open')).toHaveLength(1);
        expect(wrapper.emitted('open')?.[0]).toEqual([file]);
    });
});
