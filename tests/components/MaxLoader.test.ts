import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxLoader from '../../src/components/MaxLoader.vue';
import MaxLoaderIcon from '../../src/components/MaxLoaderIcon.vue';

describe('MaxLoader', () => {
    it('renderiza o loader por padrão quando show não é informado (show=undefined)', () => {
        const wrapper = mount(MaxLoader);
        expect(wrapper.find('.max-loader-main-div').exists()).toBe(true);
        expect(wrapper.findComponent(MaxLoaderIcon).exists()).toBe(true);
    });

    it('renderiza label customizado via prop label', () => {
        const wrapper = mount(MaxLoader, {
            props: {
                label: 'Processando solicitação...'
            }
        });

        const labelEl = wrapper.find('.item-label');
        expect(labelEl.exists()).toBe(true);
        expect(labelEl.text()).toBe('Processando solicitação...');
    });

    it('não renderiza elemento de label quando a prop label for omitida', () => {
        const wrapper = mount(MaxLoader);
        expect(wrapper.find('.item-label').exists()).toBe(false);
    });

    it('oculta o loader quando show=false booleano', () => {
        const wrapper = mount(MaxLoader, {
            props: {
                show: false
            }
        });

        expect(wrapper.find('.max-loader-main-div').exists()).toBe(false);
    });

    it('oculta o loader quando show="false" como string (coerção segura)', () => {
        const wrapper = mount(MaxLoader, {
            props: {
                show: 'false' as unknown as boolean
            }
        });

        expect(wrapper.find('.max-loader-main-div').exists()).toBe(false);
    });

    it('exibe o loader quando show=true e show="true"', () => {
        const wrapperBool = mount(MaxLoader, {
            props: {
                show: true
            }
        });
        expect(wrapperBool.find('.max-loader-main-div').exists()).toBe(true);

        const wrapperStr = mount(MaxLoader, {
            props: {
                show: 'true' as unknown as boolean
            }
        });
        expect(wrapperStr.find('.max-loader-main-div').exists()).toBe(true);
    });

    it('reage reativamente à mudança na prop show', async () => {
        const wrapper = mount(MaxLoader, {
            props: {
                show: true
            }
        });

        expect(wrapper.find('.max-loader-main-div').exists()).toBe(true);

        await wrapper.setProps({ show: false });
        expect(wrapper.find('.max-loader-main-div').exists()).toBe(false);

        await wrapper.setProps({ show: true });
        expect(wrapper.find('.max-loader-main-div').exists()).toBe(true);
    });
});
