import type {
    MaxInputEntityValue,
    MaxInputGenderValue,
    MaxInputMonthValue,
    MaxInputWeekdayValue,
    SemanticSelectOption
} from '../types/semanticInputs';

export const ENTITY_OPTIONS: readonly SemanticSelectOption<MaxInputEntityValue>[] = [
    { value: 'PF', label: 'Pessoa Física', name: 'Pessoa Física' },
    { value: 'PJ', label: 'Pessoa Jurídica', name: 'Pessoa Jurídica' }
] as const;

export const GENDER_OPTIONS: readonly SemanticSelectOption<MaxInputGenderValue>[] = [
    { value: 'M', label: 'Masculino', name: 'Masculino' },
    { value: 'F', label: 'Feminino', name: 'Feminino' }
] as const;

export const WEEKDAY_OPTIONS: readonly SemanticSelectOption<MaxInputWeekdayValue>[] = [
    { value: 'monday', label: 'Segunda-feira', name: 'Segunda-feira' },
    { value: 'tuesday', label: 'Terça-feira', name: 'Terça-feira' },
    { value: 'wednesday', label: 'Quarta-feira', name: 'Quarta-feira' },
    { value: 'thursday', label: 'Quinta-feira', name: 'Quinta-feira' },
    { value: 'friday', label: 'Sexta-feira', name: 'Sexta-feira' },
    { value: 'saturday', label: 'Sábado', name: 'Sábado' },
    { value: 'sunday', label: 'Domingo', name: 'Domingo' }
] as const;

export const MONTH_OPTIONS: readonly SemanticSelectOption<MaxInputMonthValue>[] = [
    { value: 1, label: 'Janeiro', name: 'Janeiro' },
    { value: 2, label: 'Fevereiro', name: 'Fevereiro' },
    { value: 3, label: 'Março', name: 'Março' },
    { value: 4, label: 'Abril', name: 'Abril' },
    { value: 5, label: 'Maio', name: 'Maio' },
    { value: 6, label: 'Junho', name: 'Junho' },
    { value: 7, label: 'Julho', name: 'Julho' },
    { value: 8, label: 'Agosto', name: 'Agosto' },
    { value: 9, label: 'Setembro', name: 'Setembro' },
    { value: 10, label: 'Outubro', name: 'Outubro' },
    { value: 11, label: 'Novembro', name: 'Novembro' },
    { value: 12, label: 'Dezembro', name: 'Dezembro' }
] as const;

const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function parseTimeToMinutes(time: string): number | null {
    if (!TIME_REGEX.test(time)) return null;
    const parts = time.split(':');
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hh = hours < 10 ? `0${hours}` : `${hours}`;
    const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hh}:${mm}`;
}

export function generateTimeOptions(
    minTime = '00:00',
    maxTime = '23:59',
    stepMinutes = 30
): SemanticSelectOption<string>[] {
    const minMin = parseTimeToMinutes(minTime);
    const maxMin = parseTimeToMinutes(maxTime);

    if (minMin === null || maxMin === null) return [];
    if (minMin > maxMin) return [];
    if (!Number.isInteger(stepMinutes) || stepMinutes < 1 || stepMinutes > 1440) return [];

    const options: SemanticSelectOption<string>[] = [];
    for (let current = minMin; current <= maxMin; current += stepMinutes) {
        const timeStr = formatMinutesToTime(current);
        options.push({
            value: timeStr,
            label: timeStr,
            name: timeStr
        });
    }

    return options;
}

export function generateYearOptions(
    minYear?: number,
    maxYear?: number,
    referenceYear = new Date().getFullYear()
): SemanticSelectOption<number>[] {
    const min = minYear ?? referenceYear - 1;
    const max = maxYear ?? referenceYear + 1;

    if (!Number.isInteger(min) || !Number.isInteger(max)) return [];
    if (min < 1 || max > 9999 || min > max) return [];

    const options: SemanticSelectOption<number>[] = [];
    for (let y = min; y <= max; y++) {
        const str = String(y);
        options.push({
            value: y,
            label: str,
            name: str
        });
    }

    return options;
}
