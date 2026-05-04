import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Aplica a máscara de CEP brasileiro em uma string.
 *
 * @param value A string com o CEP.
 * @returns O CEP formatado ou a string original se não for possível.
 */
export declare function formatCep(value: RefString): string;
/**
 * Aplica a máscara de CPF em uma string.
 *
 * @param value A string com o CPF.
 * @returns O CPF formatado.
 */
export declare function formatCpf(value: RefString): string;
/**
 * Aplica a máscara de CNPJ em uma string.
 *
 * @param value A string com o CNPJ.
 * @returns O CNPJ formatado.
 */
export declare function formatCnpj(value: RefString): string;
/**
 * Aplica a máscara de CPF ou CNPJ dependendo do tamanho da string.
 *
 * @param value A string com o CPF ou CNPJ.
 * @returns O documento formatado.
 */
export declare function formatCpfCnpj(value: RefString): string;
/**
 * Aplica a máscara de telefone brasileiro em uma string.
 *
 * @param phone_number O número de telefone.
 * @returns O telefone formatado.
 */
export declare function formatPhone(phone_number: RefString): string;
/**
 * Ofusca parte de uma informação sensível.
 * Privacidade (LGPD) ao exibir dados do usuário em telas de confirmação ou perfis públicos.
 *
 * @param value A informação a ser ofuscada.
 * @param type O tipo de informação ('email', 'card' ou 'text').
 */
export declare function maskSensitive(value: RefString, type?: 'email' | 'card' | 'text'): string;
export {};
//# sourceMappingURL=masks.d.ts.map