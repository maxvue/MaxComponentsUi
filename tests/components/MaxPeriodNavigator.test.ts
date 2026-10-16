import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxPeriodNavigator from '../../src/components/MaxPeriodNavigator.vue';

describe('MaxPeriodNavigator.vue', () => {
    it('deve exibir o mês formatado em português do Brasil', () => {
        const wrapper = mount(MaxPeriodNavigator, {
            props: {
                modelValue: { year: 2026, month: 10 }
            }
        });
        expect(wrapper.text()).toContain('Outubro de 2026');
    });

    it('deve navegar para o mês anterior e cruzar a virada de ano para trás', async () => {
        const wrapper = mount(MaxPeriodNavigator, {
            props: {
                modelValue: { year: 2026, month: 1 }
            }
        });

        const prevBtn = wrapper.find('.max-period-navigator__btn--prev');
        await prevBtn.trigger('click');

        expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ year: 2025, month: 12 }]);
    });

    it('deve navegar para o próximo mês e cruzar a virada de ano para frente', async () => {
        const wrapper = mount(MaxPeriodNavigator, {
            props: {
                modelValue: { year: 2026, month: 12 }
            }
        });

        const nextBtn = wrapper.find('.max-period-navigator__btn--next');
        await nextBtn.trigger('click');

        expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ year: 2027, month: 1 }]);
    });

    it('deve desabilitar botões nos limites minPeriod e maxPeriod', () => {
        const wrapper = mount(MaxPeriodNavigator, {
            props: {
                modelValue: { year: 2026, month: 5 },
                minPeriod: { year: 2026, month: 5 },
                maxPeriod: { year: 2026, month: 5 }
            }
        });

        const prevBtn = wrapper.find('.max-period-navigator__btn--prev');
        const nextBtn = wrapper.find('.max-period-navigator__btn--next');
        expect(prevBtn.attributes('disabled')).toBeDefined();
        expect(nextBtn.attributes('disabled')).toBeDefined();
    });

    it('deve exibir e habilitar botão de mês atual quando fornecido currentPeriod diferente do selecionado', async () => {
        const wrapper = mount(MaxPeriodNavigator, {
            props: {
                modelValue: { year: 2026, month: 1 },
                currentPeriod: { year: 2026, month: 10 }
            }
        });

        const currentBtn = wrapper.find('.max-period-navigator__btn--current');
        expect(currentBtn.exists()).toBe(true);
        expect(currentBtn.attributes('disabled')).toBeUndefined();

        await currentBtn.trigger('click');
        expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ year: 2026, month: 10 }]);
    });

    it('deve desabilitar botão de mês atual quando já estiver no período atual', () => {
        const wrapper = mount(MaxPeriodNavigator, {
            props: {
                modelValue: { year: 2026, month: 10 },
                currentPeriod: { year: 2026, month: 10 }
            }
        });

        const currentBtn = wrapper.find('.max-period-navigator__btn--current');
        expect(currentBtn.attributes('disabled')).toBeDefined();
    });
});
