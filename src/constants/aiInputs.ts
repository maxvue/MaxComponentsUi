import type {
    AiBillingModeValue,
    AiBillingUnitValue,
    AiExecutionTypeValue,
    DomainSelectOption
} from '../types/domainInputs';

export const AI_EXECUTION_TYPE_OPTIONS: readonly DomainSelectOption<AiExecutionTypeValue>[] = Object.freeze([
    { value: 'cloud', label: 'Nuvem', name: 'Nuvem' },
    { value: 'local', label: 'Local', name: 'Local' }
]);

export const AI_BILLING_MODE_OPTIONS: readonly DomainSelectOption<AiBillingModeValue>[] = Object.freeze([
    { value: 'dollar', label: 'Dólar (USD)', name: 'Dólar (USD)' },
    { value: 'bonus', label: 'Bônus (créditos)', name: 'Bônus (créditos)' },
    { value: 'free', label: 'Gratuito', name: 'Gratuito' },
    { value: 'local', label: 'Local (custo zero)', name: 'Local (custo zero)' }
]);

export const AI_BILLING_UNIT_OPTIONS: readonly DomainSelectOption<AiBillingUnitValue>[] = Object.freeze([
    { value: 'm_tokens', label: 'Por 1 milhão de tokens', name: 'Por 1 milhão de tokens' },
    { value: 'tokens', label: 'Por token', name: 'Por token' },
    { value: 'unity', label: 'Por unidade/requisição', name: 'Por unidade/requisição' },
    { value: 'characters', label: 'Por caractere', name: 'Por caractere' },
    { value: 'second', label: 'Por segundo', name: 'Por segundo' },
    { value: 'minute', label: 'Por minuto', name: 'Por minuto' },
    { value: 'hour', label: 'Por hora', name: 'Por hora' }
]);
