import type { ScheduleRule, ScheduleWeekday } from '../types/specializedInputs';

export const VALID_WEEKDAYS: readonly ScheduleWeekday[] = Object.freeze([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
]);

export function isValidDateString(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const [yStr, mStr, dStr] = dateStr.split('-');
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const d = new Date(Date.UTC(year, month - 1, day));
    return (
        d.getUTCFullYear() === year &&
        d.getUTCMonth() === month - 1 &&
        d.getUTCDate() === day
    );
}

export function isValidTimeString(timeStr: string): boolean {
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

export function isValidScheduleRule(rule: any): boolean {
    if (!rule || typeof rule !== 'object') return false;
    if (rule.time !== undefined && !isValidTimeString(rule.time)) return false;

    if (rule.type === 'specific_dates') {
        if (!Array.isArray(rule.dates) || rule.dates.length === 0) return false;
        return rule.dates.every((date: any) => typeof date === 'string' && isValidDateString(date));
    }

    if (rule.type === 'weekly') {
        if (!Array.isArray(rule.weekdays) || rule.weekdays.length === 0) return false;
        const validDays = rule.weekdays.every((w: any) => VALID_WEEKDAYS.includes(w));
        if (!validDays) return false;
        if (
            typeof rule.interval_weeks !== 'number' ||
            !Number.isSafeInteger(rule.interval_weeks) ||
            rule.interval_weeks < 1 ||
            rule.interval_weeks > 52
        ) return false;

        if (rule.anchor !== undefined && (typeof rule.anchor !== 'string' || !isValidDateString(rule.anchor))) return false;

        return true;
    }

    if (rule.type === 'monthly_days') {
        if (!Array.isArray(rule.days) || rule.days.length === 0) return false;
        return rule.days.every(
            (d: any) => typeof d === 'number' && Number.isSafeInteger(d) && d >= 1 && d <= 31
        );
    }

    if (rule.type === 'monthly_nth_weekday') {
        if (![1, 2, 3, 4, 5].includes(rule.nth)) return false;
        return VALID_WEEKDAYS.includes(rule.weekday);
    }

    return false;
}

export function createDefaultScheduleRule(
    type: ScheduleRule['type'],
    existingTime?: string
): ScheduleRule {
    const time = existingTime ?? '09:00';
    switch (type) {
        case 'specific_dates':
            return { type: 'specific_dates', dates: [], time };
        case 'weekly':
            return { type: 'weekly', weekdays: [], interval_weeks: 1, time };
        case 'monthly_days':
            return { type: 'monthly_days', days: [], time };
        case 'monthly_nth_weekday':
            return { type: 'monthly_nth_weekday', nth: 1, weekday: 'monday', time };
    }
}

export function changeRuleType(
    currentRule: ScheduleRule,
    newType: ScheduleRule['type']
): ScheduleRule {
    return createDefaultScheduleRule(newType, currentRule.time);
}
