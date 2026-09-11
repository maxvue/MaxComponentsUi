import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import MaxTransitionUp from '../../src/components/MaxTransitionUp.vue';

describe('MaxTransitionUp', () => {
    it('renderiza o conteúdo do slot default', () => {
        const wrapper = mount(MaxTransitionUp, {
            slots: {
                default: '<div class="content-up">Texto Slide Up</div>'
            }
        });

        expect(wrapper.find('.content-up').exists()).toBe(true);
        expect(wrapper.text()).toContain('Texto Slide Up');
    });

    it('alterna o nó renderizado quando condicionado reativamente', async () => {
        const HostComponent = {
            components: { MaxTransitionUp },
            setup() {
                const isShown = ref(true);
                return { isShown };
            },
            template: `
                <MaxTransitionUp>
                    <div v-if="isShown" class="panel">Painel Elevado</div>
                </MaxTransitionUp>
            `
        };

        const wrapper = mount(HostComponent);
        expect(wrapper.find('.panel').exists()).toBe(true);

        wrapper.vm.isShown = false;
        await nextTick();

        expect(wrapper.find('.panel').exists()).toBe(false);
    });
});
