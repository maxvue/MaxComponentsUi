import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileUploadButton from '../../src/components/MaxInputFileUploadButton.vue';

describe('MaxInputFileUploadButton', () => {
    it('deve renderizar o componente de botão de upload', () => {
        const wrapper = mount(MaxInputFileUploadButton, {
            attrs: {
                label: 'Enviar',
                modelValue: []
            },
            global: {
                stubs: {
                    MaxInputFileUpload: { template: '<div><slot /></div>' },
                    Icon: true
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.input-file-button-label').exists()).toBe(true);
        expect(wrapper.find('.input-file-button-label').html()).toContain('Enviar');
    });

    it('deve emitir o evento upload com os arquivos recebidos', async () => {
        const wrapper = mount(MaxInputFileUploadButton, {
            global: {
                stubs: {
                    MaxInputFileUpload: { template: '<div><slot /></div>' },
                    Icon: true
                }
            }
        });

        const mockFiles = [{ name: 'arquivo1.pdf' }, { name: 'arquivo2.jpg' }];
        wrapper.vm.onUpload(mockFiles);
        expect(wrapper.emitted('upload')).toBeTruthy();
        expect(wrapper.emitted('upload')?.[0]).toEqual([mockFiles]);
    });
});
