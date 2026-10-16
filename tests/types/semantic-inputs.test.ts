import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
    MaxInputEntityProps,
    MaxInputEntityValue,
    MaxInputGenderProps,
    MaxInputGenderValue,
    MaxInputWeekdayProps,
    MaxInputWeekdayValue,
    MaxInputMonthProps,
    MaxInputMonthValue,
    MaxInputTimeProps,
    MaxInputYearProps,
    MaxInputEmailProps,
    MaxInputUrlProps,
    MaxInputPasswordProps,
    MaxInputSlugProps,
    SemanticTextInputExpose
} from '../../src/types';
import {
    ENTITY_OPTIONS,
    GENDER_OPTIONS,
    WEEKDAY_OPTIONS,
    MONTH_OPTIONS,
    generateTimeOptions,
    generateYearOptions,
    parseTimeToMinutes,
    formatMinutesToTime
} from '../../src/constants/semanticInputOptions';

describe('types — semantic inputs', () => {
    it('verifica os valores e tipos literais de Entity e Gender', () => {
        expectTypeOf<'PF' | 'PJ'>().toEqualTypeOf<MaxInputEntityValue>();
        expectTypeOf<'M' | 'F'>().toEqualTypeOf<MaxInputGenderValue>();

        const entityProps: MaxInputEntityProps = {
            modelValue: 'PF',
            label: 'Entidade',
            clearable: true,
            filter: false
        };
        expect(entityProps.modelValue).toBe('PF');

        const genderProps: MaxInputGenderProps = {
            modelValue: 'M',
            label: 'Gênero'
        };
        expect(genderProps.modelValue).toBe('M');
    });

    it('verifica os tipos de Weekday e Month', () => {
        expectTypeOf<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>().toEqualTypeOf<MaxInputWeekdayValue>();
        expectTypeOf<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>().toEqualTypeOf<MaxInputMonthValue>();

        const weekdayProps: MaxInputWeekdayProps = {
            modelValue: 'wednesday',
            clearable: true
        };
        expect(weekdayProps.modelValue).toBe('wednesday');

        const monthProps: MaxInputMonthProps = {
            modelValue: 12,
            clearable: true
        };
        expect(monthProps.modelValue).toBe(12);
    });

    it('verifica os tipos de Time e Year', () => {
        const timeProps: MaxInputTimeProps = {
            modelValue: '14:30',
            minTime: '08:00',
            maxTime: '18:00',
            stepMinutes: 15
        };
        expect(timeProps.modelValue).toBe('14:30');

        const yearProps: MaxInputYearProps = {
            modelValue: 2026,
            minYear: 2020,
            maxYear: 2030
        };
        expect(yearProps.modelValue).toBe(2026);
    });

    it('verifica os tipos de Email, Url, Password e Slug', () => {
        const emailProps: MaxInputEmailProps = {
            modelValue: 'teste@exemplo.com',
            autocomplete: 'email'
        };
        expect(emailProps.modelValue).toBe('teste@exemplo.com');

        const urlProps: MaxInputUrlProps = {
            modelValue: 'https://exemplo.com',
            autocomplete: 'url'
        };
        expect(urlProps.modelValue).toBe('https://exemplo.com');

        const passProps: MaxInputPasswordProps = {
            modelValue: 'secret123',
            toggleVisibility: true,
            autocomplete: 'current-password',
            minLength: 8,
            targetValue: 'secret123'
        };
        expect(passProps.minLength).toBe(8);

        const slugProps: MaxInputSlugProps = {
            modelValue: 'meu-slug-valido',
            normalizeOnBlur: true
        };
        expect(slugProps.normalizeOnBlur).toBe(true);

        expectTypeOf<SemanticTextInputExpose>().toHaveProperty('focus');
        expectTypeOf<SemanticTextInputExpose>().toHaveProperty('setFocus');
    });

    it('verifica os catálogos estáticos e helpers de opções', () => {
        expect(ENTITY_OPTIONS).toHaveLength(2);
        expect(GENDER_OPTIONS).toHaveLength(2);
        expect(WEEKDAY_OPTIONS).toHaveLength(7);
        expect(MONTH_OPTIONS).toHaveLength(12);

        expect(parseTimeToMinutes('00:00')).toBe(0);
        expect(parseTimeToMinutes('23:59')).toBe(1439);
        expect(parseTimeToMinutes('invalid')).toBeNull();

        expect(formatMinutesToTime(0)).toBe('00:00');
        expect(formatMinutesToTime(90)).toBe('01:30');

        const timeOpts = generateTimeOptions('07:00', '09:00', 60);
        expect(timeOpts.map((o) => o.value)).toEqual(['07:00', '08:00', '09:00']);

        const invalidTimeOpts = generateTimeOptions('10:00', '08:00', 30);
        expect(invalidTimeOpts).toHaveLength(0);

        const yearOpts = generateYearOptions(2025, 2027);
        expect(yearOpts.map((o) => o.value)).toEqual([2025, 2026, 2027]);

        const invalidYearOpts = generateYearOptions(2030, 2020);
        expect(invalidYearOpts).toHaveLength(0);
    });
});
