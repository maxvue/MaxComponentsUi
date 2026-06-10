import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTitle1 from '../../src/components/MaxTitle1.vue';
import MaxTitle2 from '../../src/components/MaxTitle2.vue';
import MaxEmptyDiv from '../../src/components/MaxEmptyDiv.vue';
import MaxLink from '../../src/components/MaxLink.vue';
import TransitionFade from '../../src/components/TransitionFade.vue';
import MaxTransitionFadeLight from '../../src/components/MaxTransitionFadeLight.vue';
import MaxTransitionUp from '../../src/components/MaxTransitionUp.vue';

describe('MaxTitle1', () => {
    it('renderiza corretamente', () => {
        const wrapper = mount(MaxTitle1, {
            attrs: { h1: 'Título Principal', h2: 'Subtítulo' }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.t1-main-text').exists()).toBe(true);
        expect(wrapper.find('.t2-main-text').exists()).toBe(true);
    });

    it('renderiza com classe center e propriedades condicionais', () => {
        const wrapper = mount(MaxTitle1, {
            attrs: { center: '' }
        });
        expect(wrapper.classes()).toContain('center');
        expect(wrapper.find('.t1-main-text').exists()).toBe(false);
        expect(wrapper.find('.t2-main-text').exists()).toBe(false);
    });
});

describe('MaxTitle2', () => {
    it('renderiza corretamente', () => {
        const wrapper = mount(MaxTitle2, {
            attrs: { h1: 'Título Secundário', h2: 'Subtítulo' }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.text-h1').exists()).toBe(true);
    });

    it('renderiza com classe center e sem h1', () => {
        const wrapper = mount(MaxTitle2, {
            attrs: { center: '', class: 'center' }
        });
        expect(wrapper.classes()).toContain('center');
        expect(wrapper.find('.text-h1').exists()).toBe(false);
    });
});

describe('MaxEmptyDiv', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza com ícone padrão', () => {
        const wrapper = mount(MaxEmptyDiv, {
            global: {
                stubs: {
                    MaxIcon: { template: '<span class="max-icon"></span>', props: ['icon', 'size'] }
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza com label personalizado', () => {
        const wrapper = mount(MaxEmptyDiv, {
            attrs: { label: 'Nenhum dado encontrado' },
            global: {
                stubs: {
                    MaxIcon: { template: '<span class="max-icon"></span>', props: ['icon', 'size'] }
                }
            }
        });
        expect(wrapper.text()).toContain('Nenhum dado encontrado');
    });
});

describe('MaxLink', () => {
    it('renderiza corretamente', () => {
        const wrapper = mount(MaxLink, {
            props: { route: 'home' },
            slots: { default: 'Ir para Home' },
            global: {
                stubs: { RouterLink: { template: '<a class="router-link"><slot /></a>' } }
            }
        });
        expect(wrapper.text()).toContain('Ir para Home');
        expect(wrapper.exists()).toBe(true);
    });

    it('usa route_name se fornecido', () => {
        const wrapper = mount(MaxLink, {
            props: { route_name: 'dashboard' },
            global: {
                stubs: { RouterLink: { name: 'RouterLink', template: '<a class="router-link"><slot /></a>', props: ['to'] } }
            }
        });
        expect(wrapper.findComponent({ name: 'RouterLink' }).props('to')).toEqual({ name: 'dashboard' });
    });
});

describe('Transições', () => {
    it('TransitionFade renderiza conteúdo quando visível', () => {
        const wrapper = mount(TransitionFade, {
            slots: { default: '<div>Conteúdo visível</div>' }
        });
        expect(wrapper.text()).toContain('Conteúdo visível');
    });

    it('MaxTransitionFadeLight renderiza conteúdo', () => {
        const wrapper = mount(MaxTransitionFadeLight, {
            slots: { default: '<div>Conteúdo fade light</div>' }
        });
        expect(wrapper.text()).toContain('Conteúdo fade light');
    });

    it('MaxTransitionUp renderiza conteúdo', () => {
        const wrapper = mount(MaxTransitionUp, {
            slots: { default: '<div>Conteúdo slide up</div>' }
        });
        expect(wrapper.text()).toContain('Conteúdo slide up');
    });
});
