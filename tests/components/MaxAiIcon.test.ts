import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAiIcon from '../../src/components/MaxAiIcon.vue';

describe('MaxAiIcon', () => {
    it('renderiza os grupos de svg animados quando não está concluído', () => {
        const wrapper = mount(MaxAiIcon);

        expect(wrapper.find('.img-p-top').exists()).toBe(true);
        expect(wrapper.find('.img-p-bottom').exists()).toBe(true);
        expect(wrapper.find('.img-g-right').exists()).toBe(true);
        expect(wrapper.find('.img-check').exists()).toBe(false);
    });

    it('exibe apenas o ícone de check quando done=true', () => {
        const wrapper = mount(MaxAiIcon, { props: { done: true } });

        expect(wrapper.find('.img-check').exists()).toBe(true);
        expect(wrapper.find('.img-p-top').exists()).toBe(false);
        expect(wrapper.find('.img-p-bottom').exists()).toBe(false);
    });

    it('aplica a classe is-animated por padrão (animate=true, done=false)', () => {
        const wrapper = mount(MaxAiIcon);

        expect(wrapper.classes()).toContain('is-animated');
    });

    it('não aplica is-animated quando noAnimate=true', () => {
        const wrapper = mount(MaxAiIcon, { props: { noAnimate: true } });

        expect(wrapper.classes()).not.toContain('is-animated');
    });

    it('não aplica is-animated quando done=true, mesmo com animate ativo', () => {
        const wrapper = mount(MaxAiIcon, { props: { done: true } });

        expect(wrapper.classes()).not.toContain('is-animated');
    });

    it('calcula o tamanho em rem quando size é numérico', () => {
        const wrapper = mount(MaxAiIcon, { props: { size: 2 } });

        const style = (wrapper.element as HTMLElement).style;
        expect(style.width).toBe('2rem');
        expect(style.height).toBe('2rem');
    });

    it('mantém o size como está quando já possui unidade', () => {
        const wrapper = mount(MaxAiIcon, { props: { size: '32px' } });

        const style = (wrapper.element as HTMLElement).style;
        expect(style.width).toBe('32px');
        expect(style.height).toBe('32px');
    });
});
