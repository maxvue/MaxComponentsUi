import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import MaxAnimateFade from '../../src/components/MaxAnimateFade.vue';

describe('MaxAnimateFade', () => {
    it('renderiza o slot default por padrão quando show não é informado', () => {
        const wrapper = mount(MaxAnimateFade, {
            slots: {
                default: '<div class="test-content">Conteúdo Visível</div>'
            }
        });

        expect(wrapper.find('.test-content').exists()).toBe(true);
        expect(wrapper.text()).toContain('Conteúdo Visível');
    });

    it('renderiza o slot quando show=true', () => {
        const wrapper = mount(MaxAnimateFade, {
            props: {
                show: true
            },
            slots: {
                default: '<div class="test-content">Exibido</div>'
            }
        });

        expect(wrapper.find('.test-content').exists()).toBe(true);
    });

    it('não renderiza o slot quando show=false', () => {
        const wrapper = mount(MaxAnimateFade, {
            props: {
                show: false
            },
            slots: {
                default: '<div class="test-content">Oculto</div>'
            }
        });

        expect(wrapper.find('.test-content').exists()).toBe(false);
    });

    it('reage à mudança dinâmica da prop show', async () => {
        const wrapper = mount(MaxAnimateFade, {
            props: {
                show: true
            },
            slots: {
                default: '<div class="test-content">Alternando</div>'
            }
        });

        expect(wrapper.find('.test-content').exists()).toBe(true);

        await wrapper.setProps({ show: false });
        await nextTick();

        expect(wrapper.find('.test-content').exists()).toBe(false);

        await wrapper.setProps({ show: true });
        await nextTick();

        expect(wrapper.find('.test-content').exists()).toBe(true);
    });

    it('suporta modo out-in e appear', () => {
        const wrapper = mount(MaxAnimateFade, {
            props: {
                mode: 'out-in',
                appear: true,
                duration: 0.5
            },
            slots: {
                default: '<div class="test-content">Animado</div>'
            }
        });

        expect(wrapper.find('.test-content').exists()).toBe(true);
    });

    it('funciona com slot interno controlado por v-if quando show é undefined', async () => {
        const TestWrapper = {
            components: { MaxAnimateFade },
            setup() {
                const isVisible = ref(true);
                return { isVisible };
            },
            template: `
                <MaxAnimateFade duration="300ms">
                    <div v-if="isVisible" class="inner-box">Caixa</div>
                </MaxAnimateFade>
            `
        };

        const wrapper = mount(TestWrapper);
        expect(wrapper.find('.inner-box').exists()).toBe(true);

        wrapper.vm.isVisible = false;
        await nextTick();

        expect(wrapper.find('.inner-box').exists()).toBe(false);
    });
});
