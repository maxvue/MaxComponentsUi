import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileUploadBig from '../../src/components/MaxInputFileUploadBig.vue';

describe('MaxInputFileUploadBig', () => {
    it('deve renderizar o componente de upload grande corretamente', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            global: {
                stubs: {
                    MaxInputFileUpload: true,
                    Icon: true,
                    DotLottieVue: true
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('covers slots', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            global: {
                stubs: {
                    MaxInputFileUpload: {
                        template: `<div>
                            <slot />
                            <slot name="uploading" />
                            <slot name="error" />
                        </div>`
                    },
                    Icon: true,
                    DotLottieVue: true
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });
});
