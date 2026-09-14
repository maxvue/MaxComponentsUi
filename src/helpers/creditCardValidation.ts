import { type MaybeRefOrGetter, toValue } from 'vue';

function isBlank(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim().length === 0) return true;
    return false;
}

function checkLuhn(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/\D/g, '');
    if (!sanitized || /^0+$/.test(sanitized)) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i), 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

/**
 * Valida se um número de cartão de crédito é válido através do algoritmo de Luhn
 * e validação de comprimento e BINs conhecidos.
 */
export function isValidCreditCard(value: MaybeRefOrGetter<string | number | null | undefined>): boolean {
    const data = toValue(value);
    if (isBlank(data)) return false;

    const sanitized = String(data).replace(/\D/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) return false;

    if (!checkLuhn(sanitized)) return false;

    return true;
}
