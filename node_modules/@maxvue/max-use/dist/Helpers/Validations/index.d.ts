import { isCpf, isCnpj, isCpfCnpj } from './documents';
import { isEmail } from './isEmail';
import { cepIsValid } from './cepIsValid';
export * from './documents';
export * from './isEmail';
export * from './cepIsValid';
export declare const validate: {
    isCpf: typeof isCpf;
    cpf: typeof isCpf;
    isCnpj: typeof isCnpj;
    cnpj: typeof isCnpj;
    isCpfCnpj: typeof isCpfCnpj;
    cpfcnpj: typeof isCpfCnpj;
    isEmail: typeof isEmail;
    email: typeof isEmail;
    cepIsValid: typeof cepIsValid;
    cep: typeof cepIsValid;
};
export declare const isValid: {
    isCpf: typeof isCpf;
    cpf: typeof isCpf;
    isCnpj: typeof isCnpj;
    cnpj: typeof isCnpj;
    isCpfCnpj: typeof isCpfCnpj;
    cpfcnpj: typeof isCpfCnpj;
    isEmail: typeof isEmail;
    email: typeof isEmail;
    cepIsValid: typeof cepIsValid;
    cep: typeof cepIsValid;
};
//# sourceMappingURL=index.d.ts.map