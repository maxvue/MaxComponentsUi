import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputStatusGroup from '../../src/components/MaxInputStatusGroup.vue';

const sampleStatusOptions = [
    { label: 'Pendente', value: 'pending', color: '#F59E0B' },
    { label: 'Aprovado', value: 'approved', color: '#10B981' },
    { label: 'Cancelado', value: 'cancelled', color: '#EF4444' }
];

describe('MaxInputStatusGroup', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza todos os status como botões pills com atributos acessíveis', () => {
        const wrapper = mount(MaxInputStatusGroup, {
            props: {
                options: sampleStatusOptions,
                modelValue: ['pending']
            }
        });
        const pills = wrapper.findAll('.max-status-pill');
        expect(pills.length).toBe(3);
        expect(pills[0].classes()).toContain('is-selected');
        expect(pills[0].attributes('aria-checked')).toBe('true');
        expect(pills[1].attributes('aria-checked')).toBe('false');
    });

    it('alterna seleção múltipla ao clicar nos pills', async () => {
        const wrapper = mount(MaxInputStatusGroup, {
            props: {
                options: sampleStatusOptions,
                modelValue: ['pending'],
                multiple: true
            }
        });
        const pills = wrapper.findAll('.max-status-pill');
        await pills[1].trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual(['pending', 'approved']);
    });

    it('suporta modo de seleção única quando multiple é false', async () => {
        const wrapper = mount(MaxInputStatusGroup, {
            props: {
                options: sampleStatusOptions,
                modelValue: 'pending',
                multiple: false
            }
        });
        const pills = wrapper.findAll('.max-status-pill');
        await pills[1].trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('approved');
    });

    it('permite limpar todas as seleções quando clearable está habilitado', async () => {
        const wrapper = mount(MaxInputStatusGroup, {
            props: {
                options: sampleStatusOptions,
                modelValue: ['pending', 'approved'],
                clearable: true
            }
        });
        const clearBtn = wrapper.find('.max-status-clear-btn');
        expect(clearBtn.exists()).toBe(true);

        await clearBtn.trigger('click');
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual([]);
    });
});
