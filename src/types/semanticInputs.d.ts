/**
 * Tipos e contratos dos inputs semânticos da biblioteca:
 * - Seis seletores canônicos: MaxInputEntity, MaxInputGender, MaxInputWeekday, MaxInputMonth, MaxInputTime, MaxInputYear
 * - Quatro textuais canônicos: MaxInputEmail, MaxInputUrl, MaxInputPassword, MaxInputSlug
 * - Sete especializações numéricas: MaxInputPercent, MaxInputPower, MaxInputCurrent, MaxInputVoltage, MaxInputDistance, MaxInputDuration, MaxInputTokenLimit
 * - Três seletores/listas especializadas: MaxInputMonthDays, MaxInputWeekInterval, MaxInputSocialPlatform
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
    /** Habilita as sugestões de preenchimento automático do navegador */
    suggestions?: boolean;
}
export interface SemanticTextInputExpose {
    focus: (options?: FocusOptions) => void;
    setFocus: () => void;
}
export interface MaxInputEntityProps extends SemanticSelectBaseProps<MaxInputEntityValue> {
}
export interface MaxInputGenderProps extends SemanticSelectBaseProps<MaxInputGenderValue> {
}
export interface MaxInputWeekdayProps extends SemanticSelectBaseProps<MaxInputWeekdayValue> {
}
export interface MaxInputMonthProps extends SemanticSelectBaseProps<MaxInputMonthValue> {
}
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
export type PowerUnit = 'W' | 'kW' | 'kWp' | string;
export type DistanceUnit = 'mm' | 'cm' | 'm' | 'km' | string;
export interface VoltageOption {
    name: string;
    value: number;
}
export interface WeekIntervalOption {
    name: string;
    value: number;
}
export interface SocialPlatformOption {
    name: string;
    value: string;
}
export interface BaseQuantityProps {
    modelValue?: number | null;
    id?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    done?: boolean | string | null;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    message?: string;
    msg?: string;
    iconMessage?: string;
    noMessage?: boolean;
    icon?: string;
    i?: string;
    float?: boolean;
    textCenter?: boolean;
    textRight?: boolean;
    inLine?: boolean;
    min?: number;
    max?: number;
    step?: number;
    minFractionDigits?: number;
    maxFractionDigits?: number;
    integer?: boolean;
    prefix?: string;
    suffix?: string;
    unit?: string;
    invalidMessage?: string;
    requiredMessage?: string;
    targetValue?: string | number;
    /** Habilita as sugestões de preenchimento automático do navegador */
    suggestions?: boolean;
}
export interface MaxInputPercentProps extends Omit<BaseQuantityProps, 'unit'> {
}
export interface MaxInputPowerProps extends Omit<BaseQuantityProps, 'suffix'> {
    unit?: PowerUnit;
}
export interface MaxInputCurrentProps extends Omit<BaseQuantityProps, 'unit' | 'suffix'> {
}
export interface MaxInputVoltageProps extends Omit<BaseQuantityProps, 'unit' | 'suffix'> {
    options?: VoltageOption[];
}
export interface MaxInputDistanceProps extends Omit<BaseQuantityProps, 'suffix'> {
    unit?: DistanceUnit;
}
export interface MaxInputDurationProps extends Omit<BaseQuantityProps, 'unit' | 'suffix' | 'integer' | 'minFractionDigits' | 'maxFractionDigits'> {
}
export interface MaxInputTokenLimitProps extends Omit<BaseQuantityProps, 'unit' | 'suffix' | 'integer' | 'minFractionDigits' | 'maxFractionDigits'> {
}
export interface MaxInputMonthDaysProps {
    modelValue?: number[];
    id?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    done?: boolean | string | null;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    message?: string;
    msg?: string;
    iconMessage?: string;
    noMessage?: boolean;
    icon?: string;
    i?: string;
    float?: boolean;
    invalidMessage?: string;
    requiredMessage?: string;
    /** Habilita as sugestões de preenchimento automático do navegador */
    suggestions?: boolean;
}
export interface MaxInputWeekIntervalProps {
    modelValue?: number | null;
    id?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    done?: boolean | string | null;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    message?: string;
    msg?: string;
    iconMessage?: string;
    noMessage?: boolean;
    icon?: string;
    i?: string;
    float?: boolean;
    options?: WeekIntervalOption[];
    clearable?: boolean;
    invalidMessage?: string;
    requiredMessage?: string;
}
export interface MaxInputSocialPlatformProps {
    modelValue?: string | null;
    id?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    done?: boolean | string | null;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    message?: string;
    msg?: string;
    iconMessage?: string;
    noMessage?: boolean;
    icon?: string;
    i?: string;
    float?: boolean;
    options?: SocialPlatformOption[];
    clearable?: boolean;
    invalidMessage?: string;
    requiredMessage?: string;
}
//# sourceMappingURL=semanticInputs.d.ts.map