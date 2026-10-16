import { describe, it, expectTypeOf } from 'vitest';
import type {
    MaxAlertProps,
    MaxQueryStateProps,
    MaxQueryStateStatus,
    MaxValidationIssue,
    MaxFormValidationSummaryProps,
    MaxSegmentOption,
    MaxSegmentedControlProps,
    MaxMonthPeriod,
    MaxPeriodNavigatorProps,
    MaxProgressBarProps,
    MaxFilterBarProps,
    MaxPreviewFile,
    MaxPreviewFileLocal,
    MaxPreviewFileRemote,
    MaxFilePreviewProps,
    MaxMarkdownViewerProps,
    MaxMarkdownImageClickPayload,
    MaxCalendarProps,
    MaxCalendarEvent,
    MaxCalendarRange,
    MaxLocalDate
} from '../../src/types';

describe('Reusable Components Types Contract', () => {
    it('verifica os tipos de feedback (MaxAlert e MaxQueryState)', () => {
        expectTypeOf<MaxAlertProps>().toBeObject();
        expectTypeOf<MaxQueryStateProps>().toBeObject();
        expectTypeOf<MaxQueryStateStatus>().toEqualTypeOf<'loading' | 'stale' | 'ready-empty' | 'ready-with-data' | 'error'>();
    });

    it('verifica os tipos de validação (MaxFormValidationSummary)', () => {
        expectTypeOf<MaxValidationIssue>().toMatchTypeOf<{
            key: string;
            label: string;
            message: string;
            inputId?: string;
        }>();
        expectTypeOf<MaxFormValidationSummaryProps>().toBeObject();
    });

    it('verifica os tipos de seleção (MaxSegmentedControl)', () => {
        expectTypeOf<MaxSegmentOption>().toMatchTypeOf<{
            value: string | number | null;
            label: string;
            icon?: string;
            disabled?: boolean;
        }>();
        expectTypeOf<MaxSegmentedControlProps>().toBeObject();
    });

    it('verifica os tipos de período (MaxPeriodNavigator)', () => {
        expectTypeOf<MaxMonthPeriod>().toMatchTypeOf<{
            year: number;
            month: number;
        }>();
        expectTypeOf<MaxPeriodNavigatorProps>().toBeObject();
    });

    it('verifica os tipos de progresso (MaxProgressBar)', () => {
        expectTypeOf<MaxProgressBarProps>().toMatchTypeOf<{
            value: number | null;
            ariaLabel: string;
        }>();
    });

    it('verifica os tipos de filtros (MaxFilterBar)', () => {
        expectTypeOf<MaxFilterBarProps>().toBeObject();
    });

    it('verifica os tipos de prévia de arquivo (MaxFilePreview)', () => {
        expectTypeOf<MaxPreviewFile>().not.toBeAny();
        expectTypeOf<MaxPreviewFileLocal>().toMatchTypeOf<{

            kind: 'local';
            id: string;
            file: File;
        }>();
        expectTypeOf<MaxPreviewFileRemote>().toMatchTypeOf<{
            kind: 'remote';
            id: string;
            name: string;
        }>();
        expectTypeOf<MaxFilePreviewProps>().toBeObject();
    });

    it('verifica os tipos do leitor de Markdown (MaxMarkdownViewer)', () => {
        expectTypeOf<MaxMarkdownViewerProps>().toMatchTypeOf<{
            renderMarkdown: (source: string) => string;
        }>();
        expectTypeOf<MaxMarkdownImageClickPayload>().toMatchTypeOf<{
            src: string;
            alt: string;
        }>();
    });

    it('verifica os tipos de calendário (MaxCalendar)', () => {
        expectTypeOf<MaxLocalDate>().toBeString();
        expectTypeOf<MaxCalendarEvent>().toMatchTypeOf<{
            id: string;
            date: string;
            label: string;
        }>();
        expectTypeOf<MaxCalendarRange>().toMatchTypeOf<{
            start: string;
            endExclusive: string;
        }>();
        expectTypeOf<MaxCalendarProps>().toBeObject();
    });

    it('testa helpers de data civil em calendar.ts', async () => {
        const {
            isValidLocalDate,
            getDaysInCivilMonth,
            formatCivilDate,
            getCivilDayOfWeek
        } = await import('../../src/types/calendar');

        // isValidLocalDate
        expect(isValidLocalDate('2026-10-16')).toBe(true);
        expect(isValidLocalDate('2024-02-29')).toBe(true); // ano bissexto
        expect(isValidLocalDate('2026-02-29')).toBe(false); // ano não bissexto
        expect(isValidLocalDate('2026-04-30')).toBe(true);
        expect(isValidLocalDate('2026-04-31')).toBe(false);
        expect(isValidLocalDate('invalid')).toBe(false);
        expect(isValidLocalDate(123)).toBe(false);
        expect(isValidLocalDate(null)).toBe(false);
        expect(isValidLocalDate('2026-00-10')).toBe(false);
        expect(isValidLocalDate('2026-13-10')).toBe(false);
        expect(isValidLocalDate('2026-10-00')).toBe(false);
        expect(isValidLocalDate('2026-10-32')).toBe(false);

        // getDaysInCivilMonth
        expect(getDaysInCivilMonth(2024, 2)).toBe(29);
        expect(getDaysInCivilMonth(2000, 2)).toBe(29); // divisível por 400
        expect(getDaysInCivilMonth(1900, 2)).toBe(28); // divisível por 100, mas não 400
        expect(getDaysInCivilMonth(2026, 2)).toBe(28);
        expect(getDaysInCivilMonth(2026, 4)).toBe(30);
        expect(getDaysInCivilMonth(2026, 6)).toBe(30);
        expect(getDaysInCivilMonth(2026, 9)).toBe(30);
        expect(getDaysInCivilMonth(2026, 11)).toBe(30);
        expect(getDaysInCivilMonth(2026, 1)).toBe(31);
        expect(getDaysInCivilMonth(2026, 3)).toBe(31);

        // formatCivilDate
        expect(formatCivilDate(2026, 5, 4)).toBe('2026-05-04');
        expect(formatCivilDate(2026, 12, 31)).toBe('2026-12-31');

        // getCivilDayOfWeek
        expect(getCivilDayOfWeek(2026, 1, 1)).toBe(4); // Quinta-feira
        expect(getCivilDayOfWeek(2026, 2, 1)).toBe(0); // Domingo
        expect(getCivilDayOfWeek(2026, 10, 18)).toBe(0); // Domingo
    });
});
