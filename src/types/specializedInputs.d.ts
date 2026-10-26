import type { BaseDomainInputProps, DomainSelectOption } from './domainInputs';
export type OccupationValue = 'CLT' | 'EMPRESARIO' | 'AUTONOMO' | 'SERVIDOR_PUBLICO' | 'APOSENTADO' | 'PRODUTOR_RURAL' | 'OUTROS';
export interface MaxInputOccupationProps extends BaseDomainInputProps<string> {
    options?: readonly DomainSelectOption<string>[];
}
export type FinancingTermValue = 24 | 36 | 48 | 60 | 72 | 84 | 96 | 120;
export interface MaxInputFinancingTermProps extends BaseDomainInputProps<number> {
    options?: readonly DomainSelectOption<number>[];
}
export type FinancingGracePeriodValue = 30 | 60 | 90 | 120;
export interface MaxInputFinancingGracePeriodProps extends BaseDomainInputProps<number> {
    options?: readonly DomainSelectOption<number>[];
}
export type ServicePricingUnitValue = 'kwp' | 'modulo' | 'km' | 'unidade';
export type MaxInputServicePricingUnitProps = BaseDomainInputProps<ServicePricingUnitValue>;
export type ServiceAudienceValue = 'final_consumer' | 'other_integrators' | 'both' | 'nobody';
export type MaxInputServiceAudienceProps = BaseDomainInputProps<ServiceAudienceValue>;
export type InverterTypeValue = 'String' | 'Micro';
export type MaxInputInverterTypeProps = BaseDomainInputProps<InverterTypeValue>;
export type MonitoringAuthTypeValue = 'global_api_keys' | 'user_api_keys' | 'python_automation' | 'oauth2_redirect';
export type MaxInputMonitoringAuthTypeProps = BaseDomainInputProps<MonitoringAuthTypeValue>;
export type MonitoringCredentialFlowValue = 'assisted_key_generation' | 'direct' | 'oauth_flow';
export type MaxInputMonitoringCredentialFlowProps = BaseDomainInputProps<MonitoringCredentialFlowValue>;
export interface MaxInputConsumerUnitProps extends BaseDomainInputProps<string> {
    maxLength?: number;
}
export type AiModelStatusValue = 'approved' | 'pending' | 'failed';
export type MaxInputAiModelStatusProps = BaseDomainInputProps<AiModelStatusValue>;
export type AiPriceItemTypeValue = 'global' | 'text' | 'embedding' | 'rerank' | 'moderation' | 'ocr' | 'tts' | 'stt' | 'speech_to_speech' | 'live_audio' | 'live_video' | 'document_process' | 'image_process' | 'image_create' | 'image_edit' | 'image_upscale' | 'image_avatar' | 'video_process' | 'video_create' | 'video_edit' | 'video_upscale' | 'video_avatar' | 'video_add_voice' | 'video_dubbing' | 'audio_process' | 'audio_create' | 'sound_effect_create' | 'voice_create' | 'music_create' | 'avatar_create' | 'voice_clone' | 'translate_audio' | 'translate_video' | 'translate_text' | 'lip_sync';
export type MaxInputAiPriceItemTypeProps = BaseDomainInputProps<AiPriceItemTypeValue>;
export type AiCacheOperationValue = 'read' | 'write' | 'storage';
export type MaxInputAiCacheOperationProps = BaseDomainInputProps<AiCacheOperationValue>;
export type RagSourceTypeValue = 'document' | 'url' | 'text' | 'mysql';
export type MaxInputRagSourceTypeProps = BaseDomainInputProps<RagSourceTypeValue>;
export interface ColorPaletteItem {
    color: string;
    details: string;
}
export interface MaxInputColorPaletteProps {
    modelValue?: ColorPaletteItem[];
    id?: string;
    label?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    noMessage?: boolean;
    ariaDescribedby?: string;
}
export type ScheduleWeekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type ScheduleRule = {
    type: 'specific_dates';
    dates: string[];
    time?: string;
} | {
    type: 'weekly';
    weekdays: ScheduleWeekday[];
    interval_weeks: number;
    anchor?: string;
    time?: string;
} | {
    type: 'monthly_days';
    days: number[];
    time?: string;
} | {
    type: 'monthly_nth_weekday';
    nth: 1 | 2 | 3 | 4 | 5;
    weekday: ScheduleWeekday;
    time?: string;
};
export interface MaxInputScheduleRulesProps {
    modelValue?: ScheduleRule[];
    id?: string;
    label?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string | boolean | null;
    caution?: string | boolean | null;
    noMessage?: boolean;
    ariaDescribedby?: string;
}
//# sourceMappingURL=specializedInputs.d.ts.map