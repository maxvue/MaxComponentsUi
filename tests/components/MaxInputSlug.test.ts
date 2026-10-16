import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSlug from '../../src/components/MaxInputSlug.vue';
import InputBase from '../../src/components/InputBase.vue';

describe('MaxInputSlug', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com label Identificador', () => {
        const wrapper = mount(MaxInputSlug, {
            props: { modelValue: '' }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Identificador');
    });

    it('aceita slugs válidos em formato kebab-case estrito', async () => {
        const validSlugs = ['meu-projeto', 'slug123', 'a-b-c-d', 'projeto-ano-2026'];
        for (const slug of validSlugs) {
            const wrapper = mount(MaxInputSlug, {
                props: { modelValue: slug }
            });
            await wrapper.find('input').trigger('blur');
            expect(wrapper.findComponent(InputBase).props('error')).toBeFalsy();
        }
    });

    it('rejeita slugs com maiúsculas, espaços, hífens repetidos, pontuação ou hífen nas pontas', async () => {
        const invalidSlugs = [
            'Meu-Slug', // maiúscula
            'meu slug', // espaço
            'slug_com_underscore', // underscore
            '-inicia-hifen', // hífen inicial
            'termina-hifen-', // hífen final
            'hifen--duplo', // hífen repetido
            'slug.com.ponto' // ponto
        ];

        for (const slug of invalidSlugs) {
            const wrapper = mount(MaxInputSlug, {
                props: { modelValue: slug }
            });
            await wrapper.find('input').trigger('blur');
            expect(wrapper.findComponent(InputBase).props('error')).toBe('Identificador inválido');
        }
    });

    it('não normaliza automaticamente por padrão (normalizeOnBlur = false)', async () => {
        const wrapper = mount(MaxInputSlug, {
            props: { modelValue: 'Meu Projeto Invalido' }
        });
        await wrapper.find('input').trigger('blur');

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        expect(wrapper.findComponent(InputBase).props('error')).toBe('Identificador inválido');
    });

    it('normaliza o valor no blur quando normalizeOnBlur for true', async () => {
        const wrapper = mount(MaxInputSlug, {
            props: {
                modelValue: 'Meu Novo Projeto 2026!',
                normalizeOnBlur: true
            }
        });
        await wrapper.find('input').trigger('blur');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['meu-novo-projeto-2026']);
    });

    it('expõe métodos focus e setFocus', () => {
        const wrapper = mount(MaxInputSlug);
        expect(typeof wrapper.vm.focus).toBe('function');
        expect(typeof wrapper.vm.setFocus).toBe('function');
    });
});
