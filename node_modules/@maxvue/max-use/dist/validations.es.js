import { t as __exportAll } from "./chunk-pbuEa-1d.js";
import { toValue } from "vue";
import { validateBr } from "js-brasil";
//#region src/Helpers/Validations/documents.ts
/**
* Valida se uma string é um CPF válido.
*/
function isCpf(value) {
	const data = toValue(value);
	return validateBr.cpf(data);
}
/**
* Valida se uma string é um CNPJ válido.
*/
function isCnpj(value) {
	const data = toValue(value);
	return validateBr.cnpj(data);
}
/**
* Valida se uma string é um CPF ou CNPJ válido.
*/
function isCpfCnpj(value) {
	const data = toValue(value);
	return validateBr.cpfcnpj(data);
}
//#endregion
//#region src/Helpers/Validations/isEmail.ts
/**
* Valida se uma string é um endereço de e-mail com formato válido.
*
* @param value O valor a ser validado (string, Ref ou Getter).
* @returns True se for um e-mail válido, false caso contrário.
*/
function isEmail(value) {
	const data = toValue(value);
	if (!data || typeof data !== "string") return false;
	return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data);
}
//#endregion
//#region src/Helpers/Validations/cepIsValid.ts
/**
* Valida se uma string é um CEP válido.
*
* @param value O valor a ser validado (string, Ref ou Getter).
* @returns True se for um CEP válido, false caso contrário.
*/
function cepIsValid(value) {
	const data = toValue(value);
	return validateBr.cep(data);
}
//#endregion
//#region src/Helpers/Validations/index.ts
var Validations_exports = /* @__PURE__ */ __exportAll({
	cepIsValid: () => cepIsValid,
	isCnpj: () => isCnpj,
	isCpf: () => isCpf,
	isCpfCnpj: () => isCpfCnpj,
	isEmail: () => isEmail,
	isValid: () => isValid,
	validate: () => validate
});
var validate = {
	isCpf,
	cpf: isCpf,
	isCnpj,
	cnpj: isCnpj,
	isCpfCnpj,
	cpfcnpj: isCpfCnpj,
	isEmail,
	email: isEmail,
	cepIsValid,
	cep: cepIsValid
};
var isValid = validate;
//#endregion
export { cepIsValid, isCnpj, isCpf, isCpfCnpj, isEmail, isValid, Validations_exports as t, validate };

//# sourceMappingURL=validations.es.js.map