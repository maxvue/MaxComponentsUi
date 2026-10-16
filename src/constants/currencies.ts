export interface CurrencyOption {
    code: string;
    symbol: string;
    name: string;
    label?: string;
}

export const DEFAULT_CURRENCIES: CurrencyOption[] = [
    { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
    { code: 'USD', symbol: '$', name: 'Dólar Americano' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'Libra Esterlina' },
    { code: 'JPY', symbol: '¥', name: 'Iene Japonês' },
    { code: 'CAD', symbol: 'C$', name: 'Dólar Canadense' },
    { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano' },
    { code: 'CHF', symbol: 'CHF', name: 'Franco Suíço' },
    { code: 'CNY', symbol: '¥', name: 'Yuan Chinês' },
    { code: 'ARS', symbol: '$', name: 'Peso Argentino' }
];
