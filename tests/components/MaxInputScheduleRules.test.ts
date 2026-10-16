import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputScheduleRules from '../../src/components/MaxInputScheduleRules.vue';
import MaxButton from '../../src/components/MaxButton.vue';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import type { ScheduleRule } from '../../src/types/specializedInputs';

function mountScheduleRules(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputScheduleRules, {
        props: { modelValue: [], ...props },
        attrs
    });
}

describe('MaxInputScheduleRules (I15)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza com lista vazia e rótulo padrão Agendamento', () => {
        const wrapper = mountScheduleRules();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('Agendamento');
        expect(wrapper.findAll('.rule-card').length).toBe(0);
    });

    it('renderiza regra do tipo specific_dates corretamente', () => {
        const rules: ScheduleRule[] = [
            { type: 'specific_dates', dates: ['2026-10-25'], time: '10:00' }
        ];
        const wrapper = mountScheduleRules({ modelValue: rules });
        expect(wrapper.findAll('.rule-card').length).toBe(1);
    });

    it('renderiza regra do tipo weekly com dias da semana e intervalo', () => {
        const rules: ScheduleRule[] = [
            { type: 'weekly', weekdays: ['monday', 'friday'], interval_weeks: 2, time: '14:30' }
        ];
        const wrapper = mountScheduleRules({ modelValue: rules });
        expect(wrapper.findAll('.rule-card').length).toBe(1);
        const selectedDays = wrapper.findAll('.weekday-toggle-btn.is-selected');
        expect(selectedDays.length).toBe(2);
    });

    it('renderiza regra do tipo monthly_days e monthly_nth_weekday', () => {
        const rules: ScheduleRule[] = [
            { type: 'monthly_days', days: [5, 20], time: '08:00' },
            { type: 'monthly_nth_weekday', nth: 2, weekday: 'tuesday', time: '16:00' }
        ];
        const wrapper = mountScheduleRules({ modelValue: rules });
        expect(wrapper.findAll('.rule-card').length).toBe(2);
    });

    it('adiciona rascunho de nova regra sem emitir imediatamente enquanto incompleta', async () => {
        const wrapper = mountScheduleRules({ modelValue: [] });
        const addBtn = wrapper.findComponent(MaxButton);

        await addBtn.trigger('click');

        expect(wrapper.findAll('.rule-card').length).toBe(1);
        // dates está vazio, então não deve ter emitido update:modelValue ainda
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('remove regra e emite coleção restante imutavelmente', async () => {
        const rules: ScheduleRule[] = [
            { type: 'specific_dates', dates: ['2026-10-20'], time: '09:00' },
            { type: 'monthly_days', days: [1], time: '10:00' }
        ];
        const wrapper = mountScheduleRules({ modelValue: rules });
        const removeButtons = wrapper.findAllComponents(MaxIconButton);
        expect(removeButtons.length).toBe(2);

        await removeButtons[0].trigger('click');

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted).toBeDefined();
        const nextList = emitted[0][0] as ScheduleRule[];
        expect(nextList.length).toBe(1);
        expect(nextList[0].type).toBe('monthly_days');
    });

    it('duas instâncias funcionam de forma independente', async () => {
        const wrapper1 = mountScheduleRules({ modelValue: [] });
        const wrapper2 = mountScheduleRules({ modelValue: [] });

        const addBtn1 = wrapper1.findComponent(MaxButton);
        await addBtn1.trigger('click');

        expect(wrapper1.findAll('.rule-card').length).toBe(1);
        expect(wrapper2.findAll('.rule-card').length).toBe(0);
    });
});
