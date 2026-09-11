// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxEmptyDiv from '../../src/components/MaxEmptyDiv.vue';

describe('MaxEmptyDiv', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    const defaultGlobal = {
        stubs: {
            MaxIcon: {
                template: '<span class="max-icon" :data-icon="icon" :data-size="size"></span>',
                props: ['icon', 'size']
            }
        }
    };

    it('renderiza com label padrão "Sem Registros"', () => {
        const wrapper = mount(MaxEmptyDiv, {
            global: defaultGlobal
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.label').text()).toBe('Sem Registros');
    });

    it('renderiza com label customizado via prop', () => {
        const wrapper = mount(MaxEmptyDiv, {
            props: {
                label: 'Nenhum resultado encontrado'
            },
            global: defaultGlobal
        });

        expect(wrapper.find('.label').text()).toBe('Nenhum resultado encontrado');
    });

    it('sanitiza HTML malicioso no label contra ataques XSS', () => {
        const wrapper = mount(MaxEmptyDiv, {
            props: {
                label: '<script>alert("xss")</script><span onclick="alert(1)">Nenhum item</span> <b>disponível</b>'
            },
            global: defaultGlobal
        });

        const labelEl = wrapper.find('.label');
        expect(labelEl.exists()).toBe(true);
        expect(labelEl.html()).not.toContain('script');
        expect(labelEl.html()).not.toContain('onclick');
        expect(labelEl.html()).toContain('Nenhum item');
        expect(labelEl.html()).toContain('<b>disponível</b>');
    });

    it('não vaza props de controle (label, icon) como atributos no DOM raiz', () => {
        const wrapper = mount(MaxEmptyDiv, {
            props: {
                label: 'Vazio',
                icon: 'ph:check'
            },
            global: defaultGlobal
        });

        const rootEl = wrapper.find('.max-empty-div');
        expect(rootEl.attributes('label')).toBeUndefined();
        expect(rootEl.attributes('icon')).toBeUndefined();
    });

    it('aplica modificadores transparent e nospace corretamente', () => {
        const wrapper = mount(MaxEmptyDiv, {
            props: {
                transparent: true,
                nospace: true
            },
            global: defaultGlobal
        });

        expect(wrapper.classes()).toContain('is-transparent');
        expect(wrapper.classes()).toContain('is-nospace');
        expect(wrapper.attributes('transparent')).toBeDefined();
        expect(wrapper.attributes('nospace')).toBeDefined();
    });

    it('permite sobrescrever slots nomeados icon e label', () => {
        const wrapper = mount(MaxEmptyDiv, {
            slots: {
                icon: '<div class="custom-icon">Meu Icone</div>',
                label: '<div class="custom-label">Meu Label</div>'
            },
            global: defaultGlobal
        });

        expect(wrapper.find('.custom-icon').text()).toBe('Meu Icone');
        expect(wrapper.find('.custom-label').text()).toBe('Meu Label');
    });
});
