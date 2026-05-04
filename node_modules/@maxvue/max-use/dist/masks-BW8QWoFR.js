import { t as require_dist } from "./dist-NYeC31V0.js";
import { t as isBlank } from "./isBlank-Bufr2VEO.js";
import { toValue } from "vue";
//#region src/Helpers/Strings/masks.ts
var import_dist = require_dist();
/**
* Aplica a máscara de CEP brasileiro em uma string.
*
* @param value A string com o CEP.
* @returns O CEP formatado ou a string original se não for possível.
*/
function formatCep(value) {
	const data = toValue(value);
	if (isBlank(data)) return "";
	const cep = String(data).replace(/\D/g, "");
	if (cep.length === 8) return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
	return String(data);
}
/**
* Aplica a máscara de CPF em uma string.
*
* @param value A string com o CPF.
* @returns O CPF formatado.
*/
function formatCpf(value) {
	const data = toValue(value);
	if (isBlank(data)) return "";
	return import_dist.maskBr.cpf(data);
}
/**
* Aplica a máscara de CNPJ em uma string.
*
* @param value A string com o CNPJ.
* @returns O CNPJ formatado.
*/
function formatCnpj(value) {
	const data = toValue(value);
	if (isBlank(data)) return "";
	return import_dist.maskBr.cnpj(data);
}
/**
* Aplica a máscara de CPF ou CNPJ dependendo do tamanho da string.
*
* @param value A string com o CPF ou CNPJ.
* @returns O documento formatado.
*/
function formatCpfCnpj(value) {
	const data = toValue(value);
	if (isBlank(data)) return "";
	return import_dist.maskBr.cpfcnpj(data);
}
/**
* Aplica a máscara de telefone brasileiro em uma string.
*
* @param phone_number O número de telefone.
* @returns O telefone formatado.
*/
function formatPhone(phone_number) {
	const data = toValue(phone_number);
	if (!data || isBlank(data)) return "";
	const only_numbers = String(data).replace(/\D/g, "");
	if (only_numbers.startsWith("0800")) return only_numbers.replace(/^0800(\d{3})(\d{4})$/, "0800 $1 $2");
	if (only_numbers.length === 10) return only_numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
	if (only_numbers.length === 11) return only_numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
	if (only_numbers.length === 12) return only_numbers.replace(/^55(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
	if (only_numbers.length === 13) return only_numbers.replace(/^55(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
	return String(data);
}
/**
* Ofusca parte de uma informação sensível.
* Privacidade (LGPD) ao exibir dados do usuário em telas de confirmação ou perfis públicos.
*
* @param value A informação a ser ofuscada.
* @param type O tipo de informação ('email', 'card' ou 'text').
*/
function maskSensitive(value, type = "text") {
	const data = toValue(value);
	if (isBlank(data)) return "";
	const str = String(data).trim();
	if (type === "email") {
		const [user, domain] = str.split("@");
		if (!domain) return str;
		const mask = (s) => {
			if (s.length <= 3) return s.charAt(0) + "***";
			return s.slice(0, 3) + "***";
		};
		const [domainName, domainSuffix] = domain.split(".");
		if (!domainSuffix) return `${mask(user)}@${mask(domain)}`;
		return `${mask(user)}@${mask(domainName)}.${domainSuffix}`;
	}
	if (type === "card") return `**** **** **** ${str.replace(/\D/g, "").slice(-4)}`;
	if (str.length <= 4) return "****";
	return str.slice(0, 2) + "***" + str.slice(-2);
}
//#endregion
export { formatPhone as a, formatCpfCnpj as i, formatCnpj as n, maskSensitive as o, formatCpf as r, formatCep as t };

//# sourceMappingURL=masks-BW8QWoFR.js.map