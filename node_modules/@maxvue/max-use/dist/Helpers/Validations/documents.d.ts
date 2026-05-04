import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Valida se uma string é um CPF válido.
 */
export declare function isCpf(value: RefString): any;
/**
 * Valida se uma string é um CNPJ válido.
 */
export declare function isCnpj(value: RefString): any;
/**
 * Valida se uma string é um CPF ou CNPJ válido.
 */
export declare function isCpfCnpj(value: RefString): any;
export {};
//# sourceMappingURL=documents.d.ts.map