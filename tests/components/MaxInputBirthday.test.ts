import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import MaxInputBirthday from '../../src/components/MaxInputBirthday.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountBirthday(props: Record<string, any> = {}) {
    return mount(MaxInputBirthday, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputBirthday', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('renderiza os 3 segmentos e os separadores fixos "de"', () => {
        const wrapper = mountBirthday();
        expect(wrapper.exists()).toBe(true);

        const separators = wrapper.findAll('.max-birthday-separator');
        expect(separators.length).toBe(2);
        expect(separators[0].text()).toBe('de');
        expect(separators[1].text()).toBe('de');

        const dayBtn = wrapper.find('.max-birthday-segment--day');
        const monthBtn = wrapper.find('.max-birthday-segment--month');
        const yearBtn = wrapper.find('.max-birthday-segment--year');

        expect(dayBtn.exists()).toBe(true);
        expect(monthBtn.exists()).toBe(true);
        expect(yearBtn.exists()).toBe(true);

        expect(dayBtn.text()).toBe('Dia');
        expect(monthBtn.text()).toBe('Mês');
        expect(yearBtn.text()).toBe('Ano');
    });

    it('faz parse correto de modelValue inicial no padrão ISO YYYY-MM-DD', async () => {
        const wrapper = mountBirthday({ modelValue: '2024-05-09' });
        await nextTick();

        const dayBtn = wrapper.find('.max-birthday-segment--day');
        const monthBtn = wrapper.find('.max-birthday-segment--month');
        const yearBtn = wrapper.find('.max-birthday-segment--year');

        expect(dayBtn.text()).toBe('09');
        expect(monthBtn.text()).toBe('Maio');
        expect(yearBtn.text()).toBe('2024');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('abre o overlay do dia ao clicar no gatilho de dia', async () => {
        const wrapper = mountBirthday();
        const dayBtn = wrapper.find('.max-birthday-segment--day');

        await dayBtn.trigger('click');
        await nextTick();

        const daysPanel = document.body.querySelector('.max-birthday-days-panel');
        expect(daysPanel).not.toBeNull();
    });

    it('seleciona o dia e avança automaticamente para o mês com autoAdvance=true', async () => {
        const wrapper = mountBirthday({ autoAdvance: true });
        const dayBtn = wrapper.find('.max-birthday-segment--day');

        await dayBtn.trigger('click');
        await nextTick();

        const dayOptions = document.body.querySelectorAll('.max-birthday-day-btn');
        expect(dayOptions.length).toBeGreaterThan(0);

        // Clica no dia 15
        (dayOptions[14] as HTMLElement).click();
        await nextTick();

        expect(wrapper.find('.max-birthday-segment--day').text()).toBe('15');

        // Com autoAdvance, deve abrir o painel de mês
        const monthPanel = document.body.querySelector('.max-birthday-months-panel');
        expect(monthPanel).not.toBeNull();
    });

    it('completa a data (Dia -> Mês -> Ano) e emite update:modelValue no formato ISO', async () => {
        const wrapper = mountBirthday({ autoAdvance: true });

        // 1. Clica no Dia
        await wrapper.find('.max-birthday-segment--day').trigger('click');
        await nextTick();
        const dayOptions = document.body.querySelectorAll('.max-birthday-day-btn');
        (dayOptions[0] as HTMLElement).click(); // Dia 01
        await nextTick();

        // 2. Clica no Mês (Janeiro = index 0)
        const monthOptions = document.body.querySelectorAll('.max-birthday-month-btn');
        (monthOptions[0] as HTMLElement).click(); // Janeiro
        await nextTick();

        // 3. Clica no Ano (primeiro da lista = ano atual)
        const yearOptions = document.body.querySelectorAll('.max-birthday-year-btn');
        const firstYearText = yearOptions[0].textContent?.trim();
        (yearOptions[0] as HTMLElement).click();
        await nextTick();

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeDefined();
        const lastValue = emitted![emitted!.length - 1][0];
        expect(lastValue).toBe(`${firstYearText}-01-01`);
    });

    it('ajusta dinamicamente o dia quando o mês selecionado tiver menos dias (ex: 31 -> 30 em Abril)', async () => {
        const wrapper = mountBirthday({ modelValue: '2024-01-31' });
        await nextTick();

        expect(wrapper.find('.max-birthday-segment--day').text()).toBe('31');

        // Abre o seletor de mês e clica em Abril (mês 4, 30 dias)
        await wrapper.find('.max-birthday-segment--month').trigger('click');
        await nextTick();

        const monthOptions = document.body.querySelectorAll('.max-birthday-month-btn');
        (monthOptions[3] as HTMLElement).click(); // Abril
        await nextTick();

        // O dia deve ter sido ajustado para 30
        expect(wrapper.find('.max-birthday-segment--day').text()).toBe('30');
        expect(wrapper.find('.max-birthday-segment--month').text()).toBe('Abril');
    });

    it('calcula ano bissexto para Fevereiro (29 dias em 2024, 28 dias em 2023)', async () => {
        const wrapper = mountBirthday({ modelValue: '2024-02-29' });
        await nextTick();

        expect(wrapper.find('.max-birthday-segment--day').text()).toBe('29');

        // Muda o ano para 2023 (não bissexto)
        await wrapper.find('.max-birthday-segment--year').trigger('click');
        await nextTick();

        const yearButtons = Array.from(document.body.querySelectorAll('.max-birthday-year-btn'));
        const btn2023 = yearButtons.find((btn) => btn.textContent?.trim() === '2023');
        expect(btn2023).toBeDefined();
        (btn2023 as HTMLElement).click();
        await nextTick();

        // O dia deve ter sido ajustado para 28
        expect(wrapper.find('.max-birthday-segment--day').text()).toBe('28');
    });

    it('limpa o valor ao clicar no botão limpar', async () => {
        const wrapper = mountBirthday({ modelValue: '2020-10-12', clearable: true });
        await nextTick();

        const clearBtn = wrapper.find('.max-birthday-clear-btn');
        expect(clearBtn.exists()).toBe(true);

        await clearBtn.trigger('click');
        await nextTick();

        expect(wrapper.find('.max-birthday-segment--day').text()).toBe('Dia');
        expect(wrapper.find('.max-birthday-segment--month').text()).toBe('Mês');
        expect(wrapper.find('.max-birthday-segment--year').text()).toBe('Ano');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeDefined();
        expect(emitted![emitted!.length - 1][0]).toBeNull();
        expect(wrapper.emitted('clear')).toBeDefined();
    });

    it('não permite interação quando disabled=true', async () => {
        const wrapper = mountBirthday({ disabled: true });
        const dayBtn = wrapper.find('.max-birthday-segment--day');

        expect((dayBtn.element as HTMLButtonElement).disabled).toBe(true);

        await dayBtn.trigger('click');
        await nextTick();

        const daysPanel = document.body.querySelector('.max-birthday-days-panel');
        expect(daysPanel).toBeNull();
    });
});
