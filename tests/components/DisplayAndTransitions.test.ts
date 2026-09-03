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
    const defaultGlobal = {
        stubs: {
            MaxIcon: { template: '<span class="max-icon" />' }
        }
    };

    it('renderiza corretamente com h1 e h2', () => {
        const wrapper = mount(MaxTitle1, {
            props: { h1: 'Título Principal', h2: 'Subtítulo' },
            global: defaultGlobal
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.classes()).toContain('max-title-1');
        expect(wrapper.classes()).toContain('max-title-2');
        expect(wrapper.find('.t1-main-text').text()).toBe('Título Principal');
        expect(wrapper.find('.t2-main-text').text()).toBe('Subtítulo');
    });

    it('renderiza corretamente com title e subtitle', () => {
        const wrapper = mount(MaxTitle1, {
            props: { title: 'Meu Título', subtitle: 'Meu Subtítulo' },
            global: defaultGlobal
        });
        expect(wrapper.find('.t1-main-text').text()).toBe('Meu Título');
        expect(wrapper.find('.t2-main-text').text()).toBe('Meu Subtítulo');
    });

    it('renderiza corretamente com subTitle (camelCase)', () => {
        const wrapper = mount(MaxTitle1, {
            props: { title: 'Título Teste', subTitle: 'Subtítulo CamelCase' },
            global: defaultGlobal
        });
        expect(wrapper.find('.t1-main-text').text()).toBe('Título Teste');
        expect(wrapper.find('.t2-main-text').text()).toBe('Subtítulo CamelCase');
    });

    it('prioriza title sobre h1 e subtitle sobre h2', () => {
        const wrapper = mount(MaxTitle1, {
            props: {
                title: 'Prioritário Title',
                h1: 'Legado H1',
                subtitle: 'Prioritário Subtitle',
                h2: 'Legado H2'
            },
            global: defaultGlobal
        });
        expect(wrapper.find('.t1-main-text').text()).toBe('Prioritário Title');
        expect(wrapper.find('.t2-main-text').text()).toBe('Prioritário Subtitle');
    });

    it('renderiza com classe center e propriedades condicionais', () => {
        const wrapper = mount(MaxTitle1, {
            props: { center: true },
            global: defaultGlobal
        });
        expect(wrapper.classes()).toContain('center');
        expect(wrapper.find('.t1-main-text').exists()).toBe(false);
        expect(wrapper.find('.t2-main-text').exists()).toBe(false);
    });
});

describe('MaxTitle2', () => {
    const defaultGlobal = {
        stubs: {
            MaxIcon: { template: '<span class="max-icon" />' }
        }
    };

    it('renderiza corretamente com h1 e h2', () => {
        const wrapper = mount(MaxTitle2, {
            props: { h1: 'Título Secundário', h2: 'Subtítulo' },
            global: defaultGlobal
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.text-h1').text()).toBe('Título Secundário');
        expect(wrapper.find('.text-h2').text()).toBe('Subtítulo');
    });

    it('renderiza corretamente com title e subtitle', () => {
        const wrapper = mount(MaxTitle2, {
            props: { title: 'Título Secundário 2', subtitle: 'Subtítulo 2' },
            global: defaultGlobal
        });
        expect(wrapper.find('.text-h1').text()).toBe('Título Secundário 2');
        expect(wrapper.find('.text-h2').text()).toBe('Subtítulo 2');
    });

    it('renderiza com subTitle (camelCase)', () => {
        const wrapper = mount(MaxTitle2, {
            props: { title: 'Título 2', subTitle: 'Subtítulo Camel' },
            global: defaultGlobal
        });
        expect(wrapper.find('.text-h2').text()).toBe('Subtítulo Camel');
    });

    it('prioriza title sobre h1 e subtitle sobre h2', () => {
        const wrapper = mount(MaxTitle2, {
            props: {
                title: 'Prioritário Title 2',
                h1: 'Legado H1',
                subtitle: 'Prioritário Subtitle 2',
                h2: 'Legado H2'
            },
            global: defaultGlobal
        });
        expect(wrapper.find('.text-h1').text()).toBe('Prioritário Title 2');
        expect(wrapper.find('.text-h2').text()).toBe('Prioritário Subtitle 2');
    });

    it('renderiza com classe center e sem h1', () => {
        const wrapper = mount(MaxTitle2, {
            attrs: { class: 'center' },
            global: defaultGlobal
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
