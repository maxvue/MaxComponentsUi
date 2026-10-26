export type PhaseValue = 1 | 2 | 3;
export type WireSizeValue = 0.5 | 0.75 | 1 | 1.5 | 2.5 | 4 | 6 | 10 | 16 | 25 | 35 | 50 | 70 | 95 | 120 | 150 | 185 | 240 | 300 | 400 | 500 | 630 | 800 | 1000;
export type WireTypeValue = 'copper-70' | 'copper-90' | 'aluminum-70' | 'aluminum-90';
export type AiExecutionTypeValue = 'cloud' | 'local';
export type AiBillingModeValue = 'dollar' | 'bonus' | 'free' | 'local';
export type AiBillingUnitValue = 'm_tokens' | 'tokens' | 'unity' | 'characters' | 'second' | 'minute' | 'hour';
export type PaymentMethodValue = 'pix' | 'credit_card';
export type ScheduleTypeValue = 'specific_dates' | 'weekly' | 'monthly_days' | 'monthly_nth_weekday';
export type MonthOccurrenceValue = 1 | 2 | 3 | 4 | 5;
export type ContentTypeValue = 'image' | 'pdf' | 'audio' | 'text' | 'url';
export interface DomainSelectOption<T = string | number> {
    value: T;
    label: string;
    name: string;
}
export interface BaseDomainInputProps<T = string | number> {
    modelValue?: T | '' | null;
    label?: string;
    placeholder?: string;
    filter?: boolean;
    disabled?: boolean;
    required?: boolean;
    clearable?: boolean;
    showClear?: boolean;
    done?: boolean;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    noMessage?: boolean;
}
export type MaxInputPhaseProps = BaseDomainInputProps<PhaseValue>;
export type MaxInputWireSizeProps = BaseDomainInputProps<WireSizeValue>;
export type MaxInputWireTypeProps = BaseDomainInputProps<WireTypeValue>;
export type MaxInputAiExecutionTypeProps = BaseDomainInputProps<AiExecutionTypeValue>;
export type MaxInputAiBillingModeProps = BaseDomainInputProps<AiBillingModeValue>;
export type MaxInputAiBillingUnitProps = BaseDomainInputProps<AiBillingUnitValue>;
export type MaxInputPaymentMethodProps = BaseDomainInputProps<PaymentMethodValue>;
export type MaxInputScheduleTypeProps = BaseDomainInputProps<ScheduleTypeValue>;
export type MaxInputMonthOccurrenceProps = BaseDomainInputProps<MonthOccurrenceValue>;
export type MaxInputContentTypeProps = BaseDomainInputProps<ContentTypeValue>;
//# sourceMappingURL=domainInputs.d.ts.map