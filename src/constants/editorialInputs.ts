import type {
    ContentTypeValue,
    DomainSelectOption,
    MonthOccurrenceValue,
    ScheduleTypeValue
} from '../types/domainInputs';

export const SCHEDULE_TYPE_OPTIONS: readonly DomainSelectOption<ScheduleTypeValue>[] = Object.freeze([
    { value: 'specific_dates', label: 'Datas específicas', name: 'Datas específicas' },
    { value: 'weekly', label: 'Semanal', name: 'Semanal' },
    { value: 'monthly_days', label: 'Dias do mês', name: 'Dias do mês' },
    { value: 'monthly_nth_weekday', label: 'Enésimo dia da semana', name: 'Enésimo dia da semana' }
]);

export const MONTH_OCCURRENCE_OPTIONS: readonly DomainSelectOption<MonthOccurrenceValue>[] = Object.freeze([
    { value: 1, label: '1ª ocorrência', name: '1ª ocorrência' },
    { value: 2, label: '2ª ocorrência', name: '2ª ocorrência' },
    { value: 3, label: '3ª ocorrência', name: '3ª ocorrência' },
    { value: 4, label: '4ª ocorrência', name: '4ª ocorrência' },
    { value: 5, label: '5ª ocorrência', name: '5ª ocorrência' }
]);

export const CONTENT_TYPE_OPTIONS: readonly DomainSelectOption<ContentTypeValue>[] = Object.freeze([
    { value: 'image', label: 'Imagem', name: 'Imagem' },
    { value: 'pdf', label: 'PDF', name: 'PDF' },
    { value: 'audio', label: 'Áudio', name: 'Áudio' },
    { value: 'text', label: 'Texto', name: 'Texto' },
    { value: 'url', label: 'URL', name: 'URL' }
]);
