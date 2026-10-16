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
}

export interface MaxInputPercentProps extends Omit<BaseQuantityProps, 'unit'> {}

export interface MaxInputPowerProps extends Omit<BaseQuantityProps, 'suffix'> {
    unit?: PowerUnit;
}

export interface MaxInputCurrentProps extends Omit<BaseQuantityProps, 'unit' | 'suffix'> {}

export interface MaxInputVoltageProps extends Omit<BaseQuantityProps, 'unit' | 'suffix'> {
    options?: VoltageOption[];
}

export interface MaxInputDistanceProps extends Omit<BaseQuantityProps, 'suffix'> {
    unit?: DistanceUnit;
}

export interface MaxInputDurationProps extends Omit<BaseQuantityProps, 'unit' | 'suffix' | 'integer' | 'minFractionDigits' | 'maxFractionDigits'> {}

export interface MaxInputTokenLimitProps extends Omit<BaseQuantityProps, 'unit' | 'suffix' | 'integer' | 'minFractionDigits' | 'maxFractionDigits'> {}

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
