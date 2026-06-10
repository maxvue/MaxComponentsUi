import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';

describe('MaxInputFileUpload', () => {
    it('deve renderizar o componente corretamente com a label', () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { label: 'Fazer Upload', modelValue: [] },
            global: {
                stubs: { FileUpload: true, Icon: true, ProgressSpinner: true },
                directives: { tooltip: () => {} }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('deve emitir evento de erro no upload', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: { FileUpload: true, Icon: true, ProgressSpinner: true },
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
                stubs: { FileUpload: true, Icon: true, ProgressSpinner: true },
                directives: { tooltip: () => {} }
            }
        });
        const mockEvent = { xhr: { response: JSON.stringify({ file: { id: 1, name: 'documento.pdf' } }) } };
        await wrapper.vm.onUploadHandler(mockEvent);
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();

        // branch catch JSON
        wrapper.vm.onUploadHandler({ xhr: { response: 'invalid json' } });
    });

    it('covers all slots and functions', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: {
                    FileUpload: {
                        template: `<div>
                            <slot name="content" :files="[{name: 'file1', size: 100}]" />
                            <slot name="empty" />
                            <slot name="chooseicon" />
                            <slot name="uploadicon" />
                            <slot name="cancelicon" />
                        </div>`
                    },
                    Icon: true,
                    ProgressSpinner: true
                },
                directives: { tooltip: () => {} }
            }
        });
        
        // trigger file select
        wrapper.vm.onSelectHandler({ files: [{name: 'test.pdf', size: 100}] });
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
        const fileUploadStub = wrapper.findComponent({ name: 'FileUpload' });
        if (fileUploadStub) {
            wrapper.vm.triggerChoose();
        }
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
            global: { stubs: { FileUpload: true, Icon: true, ProgressSpinner: true }, directives: { tooltip: () => {} } }
        });

        wrapper.vm.onSelectHandler({});
        expect(onSelectMock).toHaveBeenCalled();

        wrapper.vm.onUploadHandler({});
        expect(onUploadMock).toHaveBeenCalled();
        
    });

    it('covers showError true branches and timeout', async () => {
        vi.useFakeTimers();
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [] },
            global: {
                stubs: {
                    FileUpload: {
                        template: `<div>
                            <slot name="content" :files="[{name: 'file1', size: 100}]" />
                            <slot name="empty" />
                        </div>`
                    },
                    Icon: true,
                    ProgressSpinner: true
                },
                directives: { tooltip: () => {} }
            }
        });

        // Set variables to ensure both #content and #empty evaluate the error slots
        wrapper.vm.showError = true;
        wrapper.vm.uploading = false;
        
        // This will cover the fallback content of <slot name="error"> on lines 34 and 44
        await wrapper.vm.$nextTick();

        // Run the timer to cover the setTimeout inside watch(showError)
        vi.runAllTimers();
        expect(wrapper.vm.showError).toBe(false);

        vi.useRealTimers();
    });
});
