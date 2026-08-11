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

    it('deve repassar o evento upload disparado pelo MaxInputFileUpload', async () => {
        const wrapper = mount(MaxInputFileUploadButton, {
            global: {
                stubs: {
                    MaxInputFileUpload: {
                        name: 'MaxInputFileUpload',
                        template: '<button @click="$emit(\'upload\', [{ name: \'doc.pdf\' }])"><slot /></button>'
                    },
                    Icon: true
                }
            }
        });

        await wrapper.findComponent({ name: 'MaxInputFileUpload' }).trigger('click');
        expect(wrapper.emitted('upload')).toBeTruthy();
        expect(wrapper.emitted('upload')?.[0][0]).toEqual([{ name: 'doc.pdf' }]);
    });
});
