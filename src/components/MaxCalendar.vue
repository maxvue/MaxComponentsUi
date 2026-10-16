<template>
    <div class="max-calendar" :class="{ 'is-disabled': props.disabled }" role="region" :aria-label="props.ariaLabel">
        <div class="max-calendar__header">
            <slot name="header" :period="props.period" :disabled="props.disabled">
                <MaxPeriodNavigator :model-value="props.period" :disabled="props.disabled" @update:model-value="onPeriodChange" />
            </slot>
        </div>
        <div class="max-calendar__grid" role="grid" :aria-label="gridAriaLabel">
            <div class="max-calendar__weekdays" role="row">
                <div v-for="weekday in WEEKDAY_NAMES" :key="weekday" class="max-calendar__weekday-col" role="columnheader">
                    {{ weekday }}
                </div>
            </div>
            <div v-for="(week, weekIdx) in weeks" :key="weekIdx" class="max-calendar__week" role="row">
                <div v-for="cell in week" :key="cell.date" :ref="(el) => setCellRef(el, cell.date)" class="max-calendar__cell" :class="{ 'is-current-month': cell.isCurrentMonth, 'is-other-month': !cell.isCurrentMonth, 'is-selected': cell.isSelected, 'is-today': cell.isToday, 'is-disabled': cell.isDisabled }" role="gridcell" :tabindex="getCellTabIndex(cell)" :aria-selected="cell.isSelected ? 'true' : 'false'" :aria-disabled="cell.isDisabled ? 'true' : undefined" @click="handleDayClick(cell)" @keydown="handleCellKeyDown($event, cell)">
                    <slot name="day" :date="cell.date" :day-number="cell.dayNumber" :is-current-month="cell.isCurrentMonth" :is-selected="cell.isSelected" :is-today="cell.isToday" :events="cell.events" :disabled="cell.isDisabled">
                        <div class="max-calendar__day-header">
                            <span class="max-calendar__day-number">{{ cell.dayNumber }}</span>
                        </div>
                        <div v-if="cell.events.length > 0" class="max-calendar__events">
                            <div v-for="event in cell.events" :key="event.id" class="max-calendar__event" :class="`max-calendar__event--${event.severity ?? 'info'}`" role="button" tabindex="0" :title="event.label" @click.stop="handleEventClick(event.id)" @keydown.enter.stop.prevent="handleEventClick(event.id)" @keydown.space.stop.prevent="handleEventClick(event.id)">
                                <slot name="event" :event="event">
                                    <span class="max-calendar__event-label">{{ event.label }}</span>
                                </slot>
                            </div>
                        </div>
                    </slot>
                </div>
            </div>
        </div>
        <div v-if="$slots.footer" class="max-calendar__footer">
            <slot name="footer" :period="props.period" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
    import MaxPeriodNavigator from './MaxPeriodNavigator.vue';
    import type { MaxMonthPeriod } from '../types/period';
    import {
        formatCivilDate,
        getCivilDayOfWeek,
        getDaysInCivilMonth,
        type MaxCalendarEvent,
        type MaxCalendarProps,
        type MaxCalendarRange,
        type MaxLocalDate
    } from '../types/calendar';

    const props = withDefaults(defineProps<MaxCalendarProps>(), {
        selectedDate: undefined,
        today: undefined,
        events: () => [],
        minDate: undefined,
        maxDate: undefined,
        disabled: false,
        ariaLabel: 'Calendário'
    });

    const emit = defineEmits<{
        'update:period': [period: MaxMonthPeriod];
        'update:selectedDate': [date: MaxLocalDate];
        'event-click': [id: string];
        'range-change': [range: MaxCalendarRange];
    }>();

    const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const cellRefs = ref<Record<string, HTMLElement>>({});

    const setCellRef = (el: Element | ComponentPublicInstance | null, date: string): void => {
        if (el) cellRefs.value[date] = el as HTMLElement;
        else delete cellRefs.value[date];

    };

    const emitRangeChange = (period: MaxMonthPeriod): void => {
        const start = formatCivilDate(period.year, period.month, 1);
        let endYear = period.year;
        let endMonth = period.month + 1;
        if (endMonth > 12) {
            endYear += 1;
            endMonth = 1;
        }
        const endExclusive = formatCivilDate(endYear, endMonth, 1);
        emit('range-change', { start, endExclusive });
    };

    onMounted(() => {
        emitRangeChange(props.period);
    });

    watch(() => [props.period.year, props.period.month], () => {
        emitRangeChange(props.period);
    });

    const onPeriodChange = (newPeriod: MaxMonthPeriod): void => {
        emit('update:period', newPeriod);
    };

    const gridAriaLabel = computed<string>(() => {
        return `Grade do mês ${props.period.month} de ${props.period.year}`;
    });

    interface CalendarCell {
        date: MaxLocalDate;
        dayNumber: number;
        isCurrentMonth: boolean;
        isSelected: boolean;
        isToday: boolean;
        isDisabled: boolean;
        events: MaxCalendarEvent[];
    }

    const eventsByDate = computed(() => {
        const map = new Map<string, MaxCalendarEvent[]>();
        for (const ev of props.events) {
            const list = map.get(ev.date) || [];
            list.push(ev);
            map.set(ev.date, list);
        }
        return map;
    });

    const weeks = computed<CalendarCell[][]>(() => {
        const year = props.period.year;
        const month = props.period.month;
        const daysInMonth = getDaysInCivilMonth(year, month);

        const firstDayWeekday = getCivilDayOfWeek(year, month, 1);

        // Dias do mês anterior para completar a primeira semana
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth < 1) {
            prevYear -= 1;
            prevMonth = 12;
        }
        const daysInPrevMonth = getDaysInCivilMonth(prevYear, prevMonth);

        const allCells: CalendarCell[] = [];

        // Preenchimento mês anterior
        for (let i = firstDayWeekday - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const dateStr = formatCivilDate(prevYear, prevMonth, d);
            allCells.push({
                date: dateStr,
                dayNumber: d,
                isCurrentMonth: false,
                isSelected: false,
                isToday: props.today === dateStr,
                isDisabled: true,
                events: []
            });
        }

        // Dias do mês atual
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatCivilDate(year, month, d);
            let isDisabled = props.disabled;
            if (props.minDate && dateStr < props.minDate) isDisabled = true;
            if (props.maxDate && dateStr > props.maxDate) isDisabled = true;

            allCells.push({
                date: dateStr,
                dayNumber: d,
                isCurrentMonth: true,
                isSelected: props.selectedDate === dateStr,
                isToday: props.today === dateStr,
                isDisabled,
                events: eventsByDate.value.get(dateStr) || []
            });
        }

        // Preenchimento mês posterior até completar múltiplos de 7
        let nextYear = year;
        let nextMonth = month + 1;
        if (nextMonth > 12) {
            nextYear += 1;
            nextMonth = 1;
        }
        const remainder = allCells.length % 7;
        if (remainder !== 0) {
            const needed = 7 - remainder;
            for (let d = 1; d <= needed; d++) {
                const dateStr = formatCivilDate(nextYear, nextMonth, d);
                allCells.push({
                    date: dateStr,
                    dayNumber: d,
                    isCurrentMonth: false,
                    isSelected: false,
                    isToday: props.today === dateStr,
                    isDisabled: true,
                    events: []
                });
            }
        }

        // Agrupar em semanas de 7 dias
        const result: CalendarCell[][] = [];
        for (let i = 0; i < allCells.length; i += 7) result.push(allCells.slice(i, i + 7));

        return result;
    });

    const activeDateForTab = computed<string>(() => {
        // Se houver dia selecionado e for do mês atual e habilitado
        if (props.selectedDate) {
            const match = weeks.value.flat().find((c) => c.date === props.selectedDate && c.isCurrentMonth && !c.isDisabled);
            if (match) return match.date;
        }
        // Se houver hoje e for do mês atual e habilitado
        if (props.today) {
            const match = weeks.value.flat().find((c) => c.date === props.today && c.isCurrentMonth && !c.isDisabled);
            if (match) return match.date;
        }
        // Primeiro dia habilitado do mês atual
        const first = weeks.value.flat().find((c) => c.isCurrentMonth && !c.isDisabled);
        return first ? first.date : '';
    });

    const getCellTabIndex = (cell: CalendarCell): number => {
        if (!cell.isCurrentMonth || cell.isDisabled) return -1;
        return cell.date === activeDateForTab.value ? 0 : -1;
    };

    const handleDayClick = (cell: CalendarCell): void => {
        if (!cell.isCurrentMonth || cell.isDisabled) return;
        emit('update:selectedDate', cell.date);
    };

    const handleEventClick = (id: string): void => {
        emit('event-click', id);
    };

    const handleCellKeyDown = (event: KeyboardEvent, currentCell: CalendarCell): void => {
        if (!currentCell.isCurrentMonth || currentCell.isDisabled) return;

        const currentMonthCells = weeks.value.flat().filter((c) => c.isCurrentMonth);
        const currentIndex = currentMonthCells.findIndex((c) => c.date === currentCell.date);
        if (currentIndex === -1) return;

        let targetCell: CalendarCell | null = null;

        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                if (currentIndex + 1 < currentMonthCells.length) targetCell = currentMonthCells[currentIndex + 1];

                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (currentIndex - 1 >= 0) targetCell = currentMonthCells[currentIndex - 1];

                break;
            case 'ArrowDown':
                event.preventDefault();
                if (currentIndex + 7 < currentMonthCells.length) targetCell = currentMonthCells[currentIndex + 7];

                break;
            case 'ArrowUp':
                event.preventDefault();
                if (currentIndex - 7 >= 0) targetCell = currentMonthCells[currentIndex - 7];

                break;
            case 'Home':
                event.preventDefault();
                targetCell = currentMonthCells[0];
                break;
            case 'End':
                event.preventDefault();
                targetCell = currentMonthCells[currentMonthCells.length - 1];
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                handleDayClick(currentCell);
                return;
        }

        if (targetCell && !targetCell.isDisabled) {
            const el = cellRefs.value[targetCell.date];
            if (el && typeof el.focus === 'function') el.focus();

        }
    };
</script>

<style lang="scss" scoped>
.max-calendar {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: var(--background-0, #fff);
    border: 1px solid var(--background-200, #e2e8f0);
    border-radius: 8px;
    padding: 16px;
    font-family: Quicksand, sans-serif;
    user-select: none;

    &.is-disabled {
        opacity: 0.6;
        pointer-events: none;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__grid {
        display: flex;
        flex-direction: column;
        width: 100%;
        border-top: 1px solid var(--background-200, #e2e8f0);
        border-left: 1px solid var(--background-200, #e2e8f0);
    }

    &__weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background-color: var(--background-50, #f8fafc);
        border-bottom: 1px solid var(--background-200, #e2e8f0);
    }

    &__weekday-col {
        padding: 8px;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        color: var(--background-600, #475569);
        border-right: 1px solid var(--background-200, #e2e8f0);
    }

    &__week {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--background-200, #e2e8f0);
    }

    &__cell {
        min-height: 80px;
        padding: 6px;
        border-right: 1px solid var(--background-200, #e2e8f0);
        display: flex;
        flex-direction: column;
        gap: 4px;
        background-color: var(--background-0, #fff);
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: -2px;
            z-index: 2;
        }

        &.is-other-month {
            background-color: var(--background-50, #f8fafc);
            opacity: 0.4;
            cursor: default;
        }

        &.is-current-month:hover:not(.is-disabled, .is-selected) {
            background-color: var(--background-100, #f1f5f9);
        }

        &.is-selected {
            background-color: var(--max-primary-50, rgb(0 118 142 / 8%));

            .max-calendar__day-number {
                background-color: var(--max-primary-500, #00768e);
                color: #fff;
                border-radius: 9999px;
            }
        }

        &.is-today:not(.is-selected) .max-calendar__day-number {
            color: var(--max-primary-600, #005F77);
            font-weight: 800;
        }

        &.is-disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
    }

    &__day-header {
        display: flex;
        justify-content: flex-end;
    }

    &__day-number {
        font-size: 12px;
        font-weight: 600;
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    &__events {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        overflow: hidden;
    }

    &__event {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: opacity 0.15s ease;

        &:hover {
            opacity: 0.85;
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 1px;
        }

        &--info {
            background-color: var(--max-info-100, #e0f2fe);
            color: var(--max-info-800, #075985);
        }

        &--success {
            background-color: var(--max-success-100, #d1fae5);
            color: var(--max-success-800, #065f46);
        }

        &--warning {
            background-color: var(--max-warning-100, #fef3c7);
            color: var(--max-warning-800, #92400e);
        }

        &--danger {
            background-color: var(--max-danger-100, #fee2e2);
            color: var(--max-danger-800, #991b1b);
        }
    }

    &__footer {
        border-top: 1px solid var(--background-200, #e2e8f0);
        padding-top: 8px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .max-calendar__day-cell,
    .max-calendar__event {
        transition: none !important;
    }
}
</style>
