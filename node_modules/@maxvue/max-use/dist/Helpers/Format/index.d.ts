import { formatCurrency } from './currency';
import { formatBytes } from './bytes';
import { formatCep, formatCpf, formatCnpj, formatCpfCnpj, formatPhone, maskSensitive } from '../Strings/masks';
export * from './currency';
export * from './bytes';
export { formatCep, formatCpf, formatCnpj, formatCpfCnpj, formatPhone, maskSensitive } from '../Strings/masks';
export declare const format: {
    currency: typeof formatCurrency;
    bytes: typeof formatBytes;
    cep: typeof formatCep;
    cpf: typeof formatCpf;
    cnpj: typeof formatCnpj;
    cpfCnpj: typeof formatCpfCnpj;
    phone: typeof formatPhone;
    sensitive: typeof maskSensitive;
};
//# sourceMappingURL=index.d.ts.map