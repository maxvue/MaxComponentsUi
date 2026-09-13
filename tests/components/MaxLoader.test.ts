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

    it('não vaza props operacionais (show, label) para o DOM mas repassa attrs legítimos', () => {
        const wrapper = mount(MaxLoader, {
            props: {
                show: true,
                label: 'Aguarde'
            },
            attrs: {
                id: 'custom-loader-id',
                'data-testid': 'app-loader',
                'aria-busy': 'true'
            }
        });

        const rootEl = wrapper.find('.max-loader-main-div');
        expect(rootEl.exists()).toBe(true);
        expect(rootEl.attributes('show')).toBeUndefined();
        expect(rootEl.attributes('label')).toBeUndefined();
        expect(rootEl.attributes('id')).toBe('custom-loader-id');
        expect(rootEl.attributes('data-testid')).toBe('app-loader');
        expect(rootEl.attributes('aria-busy')).toBe('true');
    });

    it('renderiza corretamente em ambiente SSR via createSSRApp', async () => {
        const { createSSRApp } = await import('vue');
        const { renderToString } = await import('vue/server-renderer');

        const app = createSSRApp(MaxLoader, {
            show: true,
            label: 'Carregando SSR...'
        });

        const html = await renderToString(app);
        expect(html).toContain('max-loader-main-div');
        expect(html).toContain('Carregando SSR...');
        expect(html).not.toContain('show="true"');
    });
});
