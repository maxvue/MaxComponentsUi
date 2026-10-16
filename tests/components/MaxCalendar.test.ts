import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxCalendar from '../../src/components/MaxCalendar.vue';

describe('MaxCalendar.vue', () => {
    it('deve emitir range-change com início e fim exclusivo do mês ao montar', () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 }
            }
        });

        expect(wrapper.emitted('range-change')).toHaveLength(1);
        expect(wrapper.emitted('range-change')?.[0]).toEqual([{
            start: '2026-10-01',
            endExclusive: '2026-11-01'
        }]);
    });

    it('deve renderizar dias do mês e emitir update:selectedDate ao clicar em dia do mês atual', async () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 },
                selectedDate: null
            }
        });

        const currentMonthCells = wrapper.findAll('.max-calendar__cell.is-current-month');
        expect(currentMonthCells.length).toBe(31);

        // Clicar no dia 15
        const day15 = currentMonthCells.find((c) => c.text().includes('15'));
        expect(day15).toBeDefined();

        await day15!.trigger('click');
        expect(wrapper.emitted('update:selectedDate')).toHaveLength(1);
        expect(wrapper.emitted('update:selectedDate')?.[0]).toEqual(['2026-10-15']);
    });

    it('não deve emitir update:selectedDate ao clicar em dia de outro mês', async () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 }
            }
        });

        const otherMonthCell = wrapper.find('.max-calendar__cell.is-other-month');
        expect(otherMonthCell.exists()).toBe(true);

        await otherMonthCell.trigger('click');
        expect(wrapper.emitted('update:selectedDate')).toBeUndefined();
    });

    it('deve renderizar eventos e emitir event-click sem acionar seleção do dia', async () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 },
                events: [
                    { id: 'ev-1', date: '2026-10-15', label: 'Reunião do Conselho', severity: 'warning' }
                ]
            }
        });

        const eventEl = wrapper.find('.max-calendar__event');
        expect(eventEl.exists()).toBe(true);
        expect(eventEl.text()).toContain('Reunião do Conselho');

        await eventEl.trigger('click');

        expect(wrapper.emitted('event-click')).toHaveLength(1);
        expect(wrapper.emitted('event-click')?.[0]).toEqual(['ev-1']);
        expect(wrapper.emitted('update:selectedDate')).toBeUndefined();
    });

    it('deve respeitar minDate e maxDate bloqueando seleção fora do intervalo', async () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 },
                minDate: '2026-10-10',
                maxDate: '2026-10-20'
            }
        });

        const currentMonthCells = wrapper.findAll('.max-calendar__cell.is-current-month');
        const day5 = currentMonthCells.find((c) => c.text().includes('5'));
        expect(day5?.classes()).toContain('is-disabled');

        await day5!.trigger('click');
        expect(wrapper.emitted('update:selectedDate')).toBeUndefined();
    });

    it('deve suportar navegação por teclado (setas, Home, End, Enter, Space)', async () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 },
                selectedDate: '2026-10-15',
                today: '2026-10-15'
            }
        });

        const currentMonthCells = wrapper.findAll('.max-calendar__cell.is-current-month');
        const day15 = currentMonthCells.find((c) => c.text().includes('15'))!;

        await day15.trigger('keydown', { key: 'ArrowRight' });
        await day15.trigger('keydown', { key: 'ArrowLeft' });
        await day15.trigger('keydown', { key: 'ArrowDown' });
        await day15.trigger('keydown', { key: 'ArrowUp' });
        await day15.trigger('keydown', { key: 'Home' });
        await day15.trigger('keydown', { key: 'End' });

        // Enter seleciona o dia
        await day15.trigger('keydown', { key: 'Enter' });
        expect(wrapper.emitted('update:selectedDate')).toContainEqual(['2026-10-15']);

        // Space seleciona o dia
        await day15.trigger('keydown', { key: ' ' });
        expect(wrapper.emitted('update:selectedDate')?.length).toBe(2);
    });

    it('deve emitir update:period e range-change ao interagir com o navegador de período', async () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 }
            }
        });

        // Localiza o botão próximo mês no PeriodNavigator interno
        const nextBtn = wrapper.find('.max-period-navigator__btn--next');
        expect(nextBtn.exists()).toBe(true);

        await nextBtn.trigger('click');
        expect(wrapper.emitted('update:period')).toHaveLength(1);
        expect(wrapper.emitted('update:period')?.[0]).toEqual([{ year: 2026, month: 11 }]);
    });

    it('deve renderizar slots customizados header, day, event e footer', () => {
        const wrapper = mount(MaxCalendar, {
            props: {
                period: { year: 2026, month: 10 },
                events: [{ id: 'ev-1', date: '2026-10-10', label: 'Evento Especial' }]
            },
            slots: {
                header: '<div class="custom-header">Cabeçalho Customizado</div>',
                day: '<div class="custom-day">Dia Custom</div>',
                footer: '<div class="custom-footer">Rodapé Custom</div>'
            }
        });

        expect(wrapper.find('.custom-header').exists()).toBe(true);
        expect(wrapper.find('.custom-day').exists()).toBe(true);
        expect(wrapper.find('.custom-footer').exists()).toBe(true);
    });
});
