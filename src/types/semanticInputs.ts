/**
 * Tipos e contratos dos dez inputs semânticos da biblioteca:
 * - Seis seletores: MaxInputEntity, MaxInputGender, MaxInputWeekday, MaxInputMonth, MaxInputTime, MaxInputYear
 * - Quatro textuais: MaxInputEmail, MaxInputUrl, MaxInputPassword, MaxInputSlug
 */

export type MaxInputEntityValue = 'PF' | 'PJ';

export type MaxInputGenderValue = 'M' | 'F';

export type MaxInputWeekdayValue = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type MaxInputMonthValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface SemanticSelectOption<T> {
    label: string;
    name: string;
    value: T;
}

export interface SemanticSelectBaseProps<T> {
    modelValue?: T | null;
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    done?: boolean;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    noMessage?: boolean;
    noStatus?: boolean;
    icon?: string;
    iconLeft?: string;
    iconRight?: string;
    msg?: string;
    message?: string;
    ariaDescribedby?: string;
    clearable?: boolean;
    filter?: boolean;
}

export interface SemanticTextBaseProps {
    modelValue?: string | null;
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    done?: boolean;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    noMessage?: boolean;
    noStatus?: boolean;
    icon?: string;
    iconLeft?: string;
    iconRight?: string;
    msg?: string;
    message?: string;
    ariaDescribedby?: string;
}

export interface SemanticTextInputExpose {
    focus: (options?: FocusOptions) => void;
    setFocus: () => void;
}

export interface MaxInputEntityProps extends SemanticSelectBaseProps<MaxInputEntityValue> {}

export interface MaxInputGenderProps extends SemanticSelectBaseProps<MaxInputGenderValue> {}

export interface MaxInputWeekdayProps extends SemanticSelectBaseProps<MaxInputWeekdayValue> {}

export interface MaxInputMonthProps extends SemanticSelectBaseProps<MaxInputMonthValue> {}

export interface MaxInputTimeProps extends SemanticSelectBaseProps<string> {
    minTime?: string;
    maxTime?: string;
    stepMinutes?: number;
}

export interface MaxInputYearProps extends SemanticSelectBaseProps<number> {
    minYear?: number;
    maxYear?: number;
}

export interface MaxInputEmailProps extends SemanticTextBaseProps {
    autocomplete?: string;
}

export interface MaxInputUrlProps extends SemanticTextBaseProps {
    autocomplete?: string;
}

export interface MaxInputPasswordProps extends SemanticTextBaseProps {
    toggleVisibility?: boolean;
    autocomplete?: string;
    minLength?: number;
    targetValue?: string;
}

export interface MaxInputSlugProps extends SemanticTextBaseProps {
    normalizeOnBlur?: boolean;
    autocomplete?: string;
}
