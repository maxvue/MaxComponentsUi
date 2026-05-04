import { n as __exportAll } from "./chunk-C-Qwzh9l.js";
import { n as isObject, t as isArray } from "./isArray-BS_zMfXk.js";
import { n as hasContent, t as isBlank } from "./isBlank-Bufr2VEO.js";
import { toValue } from "vue";
//#region src/Helpers/Types/isNumber.ts
/**
* Verifica se um valor é um número válido.
* 
* @param value O valor a ser verificado.
* @returns Retorna true se for um número.
*/
function isNumber(value) {
	const data = toValue(value);
	if (isBlank(data, true)) return false;
	if (String(data).trim() === "") return false;
	return !Number.isNaN(Number(data));
}
var isNumeric = isNumber;
var numeric = isNumber;
//#endregion
//#region src/Helpers/Types/canIterate.ts
/**
* Verifica se um objeto é iterável.
* 
* @param obj O objeto a ser verificado.
* @returns Retorna true se for iterável.
*/
function canIterate(obj) {
	return typeof toValue(obj)?.[Symbol.iterator] === "function";
}
var isIterable = canIterate;
//#endregion
//#region src/Helpers/Types/index.ts
var Types_exports = /* @__PURE__ */ __exportAll({
	canIterate: () => canIterate,
	hasContent: () => hasContent,
	isArray: () => isArray,
	isBlank: () => isBlank,
	isIterable: () => isIterable,
	isNumber: () => isNumber,
	isNumeric: () => isNumeric,
	isObject: () => isObject,
	numeric: () => numeric
});
//#endregion
export { isNumeric as a, isNumber as i, canIterate as n, numeric as o, isIterable as r, Types_exports as t };

//# sourceMappingURL=Types-BsQd8nHC.js.map