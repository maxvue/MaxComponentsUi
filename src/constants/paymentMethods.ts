import type { DomainSelectOption, PaymentMethodValue } from '../types/domainInputs';

export const PAYMENT_METHOD_OPTIONS: readonly DomainSelectOption<PaymentMethodValue>[] = Object.freeze([
    { value: 'pix', label: 'PIX', name: 'PIX' },
    { value: 'credit_card', label: 'Cartão de crédito', name: 'Cartão de crédito' }
]);
