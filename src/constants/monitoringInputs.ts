import type { DomainSelectOption } from '../types/domainInputs';
import type {
    MonitoringAuthTypeValue,
    MonitoringCredentialFlowValue
} from '../types/specializedInputs';

export const MONITORING_AUTH_TYPE_OPTIONS: readonly DomainSelectOption<MonitoringAuthTypeValue>[] = Object.freeze([
    { value: 'global_api_keys', label: 'Chaves de API globais', name: 'Chaves de API globais' },
    { value: 'user_api_keys', label: 'Chaves de API do usuário', name: 'Chaves de API do usuário' },
    { value: 'python_automation', label: 'Automação Python', name: 'Automação Python' },
    { value: 'oauth2_redirect', label: 'Redirecionamento OAuth2', name: 'Redirecionamento OAuth2' }
]);

export const MONITORING_CREDENTIAL_FLOW_OPTIONS: readonly DomainSelectOption<MonitoringCredentialFlowValue>[] = Object.freeze([
    { value: 'assisted_key_generation', label: 'Geração assistida de chaves', name: 'Geração assistida de chaves' },
    { value: 'direct', label: 'Direto', name: 'Direto' },
    { value: 'oauth_flow', label: 'Fluxo OAuth', name: 'Fluxo OAuth' }
]);
