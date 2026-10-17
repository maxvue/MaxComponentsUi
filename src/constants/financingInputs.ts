import type { DomainSelectOption } from '../types/domainInputs';
import type {
    FinancingGracePeriodValue,
    FinancingTermValue,
    OccupationValue
} from '../types/specializedInputs';

export const OCCUPATION_OPTIONS: readonly DomainSelectOption<OccupationValue>[] = Object.freeze([
    { value: 'CLT', label: 'CLT', name: 'CLT' },
    { value: 'EMPRESARIO', label: 'Empresário', name: 'Empresário' },
    { value: 'AUTONOMO', label: 'Autônomo', name: 'Autônomo' },
    { value: 'SERVIDOR_PUBLICO', label: 'Servidor Público', name: 'Servidor Público' },
    { value: 'APOSENTADO', label: 'Aposentado', name: 'Aposentado' },
    { value: 'PRODUTOR_RURAL', label: 'Produtor Rural', name: 'Produtor Rural' },
    { value: 'OUTROS', label: 'Outros', name: 'Outros' }
]);

export const FINANCING_TERM_OPTIONS: readonly DomainSelectOption<FinancingTermValue>[] = Object.freeze([
    { value: 24, label: '24 meses', name: '24 meses' },
    { value: 36, label: '36 meses', name: '36 meses' },
    { value: 48, label: '48 meses', name: '48 meses' },
    { value: 60, label: '60 meses', name: '60 meses' },
    { value: 72, label: '72 meses', name: '72 meses' },
    { value: 84, label: '84 meses', name: '84 meses' },
    { value: 96, label: '96 meses', name: '96 meses' },
    { value: 120, label: '120 meses', name: '120 meses' }
]);

export const FINANCING_GRACE_PERIOD_OPTIONS: readonly DomainSelectOption<FinancingGracePeriodValue>[] = Object.freeze([
    { value: 30, label: '30 dias', name: '30 dias' },
    { value: 60, label: '60 dias', name: '60 dias' },
    { value: 90, label: '90 dias', name: '90 dias' },
    { value: 120, label: '120 dias', name: '120 dias' }
]);
