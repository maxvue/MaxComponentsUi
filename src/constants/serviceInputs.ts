import type { DomainSelectOption } from '../types/domainInputs';
import type { ServiceAudienceValue, ServicePricingUnitValue } from '../types/specializedInputs';

export const SERVICE_PRICING_UNIT_OPTIONS: readonly DomainSelectOption<ServicePricingUnitValue>[] = Object.freeze([
    { value: 'kwp', label: 'kWp', name: 'kWp' },
    { value: 'modulo', label: 'Módulo', name: 'Módulo' },
    { value: 'km', label: 'km', name: 'km' },
    { value: 'unidade', label: 'Unidade', name: 'Unidade' }
]);

export const SERVICE_AUDIENCE_OPTIONS: readonly DomainSelectOption<ServiceAudienceValue>[] = Object.freeze([
    { value: 'final_consumer', label: 'Consumidor final', name: 'Consumidor final' },
    { value: 'other_integrators', label: 'Outros integradores', name: 'Outros integradores' },
    { value: 'both', label: 'Ambos', name: 'Ambos' },
    { value: 'nobody', label: 'Ninguém', name: 'Ninguém' }
]);
