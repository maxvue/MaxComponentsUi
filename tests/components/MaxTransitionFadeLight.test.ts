import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import MaxTransitionFadeLight from '../../src/components/MaxTransitionFadeLight.vue';

describe('MaxTransitionFadeLight', () => {
    it('renderiza o conteúdo do slot default', () => {
        const wrapper = mount(MaxTransitionFadeLight, {
            slots: {
                default: '<div class="content-fade-light">Texto Fade Light</div>'
            }
        });

        expect(wrapper.find('.content-fade-light').exists()).toBe(true);
        expect(wrapper.text()).toContain('Texto Fade Light');
    });

    it('alterna o nó renderizado quando condicionado reativamente', async () => {
        const HostComponent = {
            components: { MaxTransitionFadeLight },
            setup() {
                const isShown = ref(true);
                return { isShown };
            },
            template: `
                <MaxTransitionFadeLight>
                    <div v-if="isShown" class="box">Conteúdo da Caixa</div>
                </MaxTransitionFadeLight>
            `
        };

        const wrapper = mount(HostComponent);
        expect(wrapper.find('.box').exists()).toBe(true);

        wrapper.vm.isShown = false;
        await nextTick();

        expect(wrapper.find('.box').exists()).toBe(false);
    });
});
