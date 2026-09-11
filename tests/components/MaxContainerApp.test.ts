import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxContainerApp from '../../src/components/MaxContainerApp.vue';

describe('MaxContainerApp', () => {
    it('renderiza container raiz com slot default e classe BEM', () => {
        const wrapper = mount(MaxContainerApp, {
            slots: { default: '<div class="child">Conteúdo</div>' }
        });

        expect(wrapper.find('.max-container-app').exists()).toBe(true);
        expect(wrapper.find('.child').text()).toBe('Conteúdo');
    });

    it('repassa atributos customizados como screen="mobile"', () => {
        const wrapper = mount(MaxContainerApp, {
            attrs: { screen: 'mobile' }
        });

        expect(wrapper.attributes('screen')).toBe('mobile');
    });
});
