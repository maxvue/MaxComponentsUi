import { describe, it, expect } from 'vitest';
import {
    changeRuleType,
    createDefaultScheduleRule,
    isValidDateString,
    isValidScheduleRule,
    isValidTimeString
} from '../../src/helpers/scheduleRules';

describe('scheduleRules helper', () => {
    describe('isValidDateString', () => {
        it('aceita datas gregorianas válidas', () => {
            expect(isValidDateString('2026-10-16')).toBe(true);
            expect(isValidDateString('2026-01-31')).toBe(true);
        });

        it('aceita 29 de fevereiro em anos bissextos e rejeita em não-bissextos', () => {
            expect(isValidDateString('2028-02-29')).toBe(true);
            expect(isValidDateString('2024-02-29')).toBe(true);
            expect(isValidDateString('2026-02-29')).toBe(false);
            expect(isValidDateString('2025-02-29')).toBe(false);
        });

        it('rejeita dias inexistentes no calendário', () => {
            expect(isValidDateString('2026-02-30')).toBe(false);
            expect(isValidDateString('2026-04-31')).toBe(false);
            expect(isValidDateString('2026-06-31')).toBe(false);
            expect(isValidDateString('2026-11-31')).toBe(false);
            expect(isValidDateString('invalido')).toBe(false);
        });
    });

    describe('isValidTimeString', () => {
        it('aceita horários válidos no formato HH:mm', () => {
            expect(isValidTimeString('00:00')).toBe(true);
            expect(isValidTimeString('09:30')).toBe(true);
            expect(isValidTimeString('23:59')).toBe(true);
        });

        it('rejeita 24:00 e formatos inválidos', () => {
            expect(isValidTimeString('24:00')).toBe(false);
            expect(isValidTimeString('12:60')).toBe(false);
            expect(isValidTimeString('9:30')).toBe(false);
            expect(isValidTimeString('invalid')).toBe(false);
        });
    });

    describe('isValidScheduleRule', () => {
        it('valida regra specific_dates', () => {
            expect(isValidScheduleRule({
                type: 'specific_dates',
                dates: ['2026-10-20'],
                time: '14:00'
            })).toBe(true);

            expect(isValidScheduleRule({
                type: 'specific_dates',
                dates: [],
                time: '14:00'
            })).toBe(false);

            expect(isValidScheduleRule({
                type: 'specific_dates',
                dates: ['2026-02-30'],
                time: '14:00'
            })).toBe(false);
        });

        it('valida regra weekly e intervalo entre 1 e 52', () => {
            expect(isValidScheduleRule({
                type: 'weekly',
                weekdays: ['monday', 'friday'],
                interval_weeks: 1,
                time: '10:00'
            })).toBe(true);

            expect(isValidScheduleRule({
                type: 'weekly',
                weekdays: ['monday'],
                interval_weeks: 52,
                time: '10:00'
            })).toBe(true);

            expect(isValidScheduleRule({
                type: 'weekly',
                weekdays: ['monday'],
                interval_weeks: 0,
                time: '10:00'
            })).toBe(false);

            expect(isValidScheduleRule({
                type: 'weekly',
                weekdays: ['monday'],
                interval_weeks: 53,
                time: '10:00'
            })).toBe(false);
        });

        it('valida regra monthly_days com dias entre 1 e 31', () => {
            expect(isValidScheduleRule({
                type: 'monthly_days',
                days: [1, 15, 31],
                time: '12:00'
            })).toBe(true);

            expect(isValidScheduleRule({
                type: 'monthly_days',
                days: [0, 15],
                time: '12:00'
            })).toBe(false);

            expect(isValidScheduleRule({
                type: 'monthly_days',
                days: [32],
                time: '12:00'
            })).toBe(false);
        });

        it('valida regra monthly_nth_weekday com nth de 1 a 5', () => {
            expect(isValidScheduleRule({
                type: 'monthly_nth_weekday',
                nth: 5,
                weekday: 'thursday',
                time: '18:00'
            })).toBe(true);

            expect(isValidScheduleRule({
                type: 'monthly_nth_weekday',
                nth: 6 as any,
                weekday: 'thursday',
                time: '18:00'
            })).toBe(false);
        });
    });

    describe('changeRuleType', () => {
        it('preserva somente o time ao trocar o tipo de regra descartando campos incompatíveis', () => {
            const rule = createDefaultScheduleRule('weekly', '15:30');
            const changed = changeRuleType(rule, 'monthly_days');

            expect(changed.type).toBe('monthly_days');
            expect(changed.time).toBe('15:30');
            expect((changed as any).weekdays).toBeUndefined();
            expect((changed as any).interval_weeks).toBeUndefined();
        });
    });
});
