import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import TransitionFade from '../../src/components/TransitionFade.vue';

describe('TransitionFade', () => {
    it('renderiza o conteúdo do slot default', () => {
        const wrapper = mount(TransitionFade, {
            slots: {
                default: '<div class="fade-text">Texto com Fade</div>'
            }
        });

        expect(wrapper.find('.fade-text').exists()).toBe(true);
        expect(wrapper.text()).toContain('Texto com Fade');
    });

    it('alterna o nó renderizado quando condicionado reativamente', async () => {
        const HostComponent = {
            components: { TransitionFade },
            setup() {
                const isShown = ref(true);
                return { isShown };
            },
            template: `
                <TransitionFade>
                    <div v-if="isShown" class="box-fade">Caixa Fade</div>
                </TransitionFade>
            `
        };

        const wrapper = mount(HostComponent);
        expect(wrapper.find('.box-fade').exists()).toBe(true);

        wrapper.vm.isShown = false;
        await nextTick();

        expect(wrapper.find('.box-fade').exists()).toBe(false);
    });
});
