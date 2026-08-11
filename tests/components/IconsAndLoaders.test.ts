import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxDoneIcon from '../../src/components/MaxDoneIcon.vue';
import MaxWaitIcon from '../../src/components/MaxWaitIcon.vue';
import MaxErrorIcon from '../../src/components/MaxErrorIcon.vue';
import MaxLoaderIcon from '../../src/components/MaxLoaderIcon.vue';
import MaxLoader from '../../src/components/MaxLoader.vue';

describe('MaxDoneIcon', () => {
    it('renderiza SVG de ícone de conclusão', () => {
        const wrapper = mount(MaxDoneIcon);
        expect(wrapper.find('.icon-done-max').exists()).toBe(true);
        expect(wrapper.find('svg').exists()).toBe(true);
    });
});

describe('MaxWaitIcon', () => {
    it('renderiza SVG de ampulheta animada', () => {
        const wrapper = mount(MaxWaitIcon);
        expect(wrapper.find('.icon-done-max').exists()).toBe(true);
        expect(wrapper.find('svg').exists()).toBe(true);
    });
});

describe('MaxErrorIcon', () => {
    it('renderiza SVG de ícone de erro', () => {
        const wrapper = mount(MaxErrorIcon);
        expect(wrapper.find('svg').exists()).toBe(true);
    });
});

describe('MaxLoaderIcon', () => {
    it('renderiza SVG de loader com animação de rotação', () => {
        const wrapper = mount(MaxLoaderIcon);
        expect(wrapper.find('.max-loader-icon-div').exists()).toBe(true);
        expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('repassa atributos e estilos passados via attrs ao elemento raiz', () => {
        const wrapper = mount(MaxLoaderIcon, {
            attrs: {
                'data-test': 'my-loader',
                style: 'width: 30px;'
            }
        });
        const div = wrapper.find('.max-loader-icon-div');
        expect(div.attributes('data-test')).toBe('my-loader');
        expect(div.attributes('style')).toContain('width: 30px');
    });
});

describe('MaxLoader', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o loader por padrão (show=undefined)', () => {
        const wrapper = mount(MaxLoader);
        expect(wrapper.find('.max-loader-main-div').exists()).toBe(true);
    });

    it('exibe label quando fornecido via attrs', () => {
        const wrapper = mount(MaxLoader, {
            attrs: { label: 'Carregando...' }
        });
        expect(wrapper.text()).toContain('Carregando...');
    });

    it('oculta quando show=false via attrs', () => {
        const wrapper = mount(MaxLoader, {
            attrs: { show: false }
        });
        // v-if="attrs.show !== undefined ? attrs.show : true"
        expect(wrapper.find('.max-loader-main-div').exists()).toBe(false);
    });

    it('exibe quando show=true via attrs', () => {
        const wrapper = mount(MaxLoader, {
            attrs: { show: true },
            global: {
                stubs: {
                    LoaderIcon: { template: '<div class="loader-icon"></div>' }
                }
            }
        });
        expect(wrapper.find('.max-loader-main-div').exists()).toBe(true);
    });
});
