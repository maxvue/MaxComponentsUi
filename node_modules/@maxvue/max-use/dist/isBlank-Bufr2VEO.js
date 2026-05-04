import { toValue } from "vue";
//#region src/Helpers/Types/hasContent.ts
/**
* Verifica se um valor possui algum conteúdo, não sendo vazio, nulo, indefinido ou um array/objeto sem chaves.
*
* @param value O valor a ser verificado.
* @param if_zero Define se o número 0 é considerado como tendo conteúdo (padrão é false).
* @returns Retorna verdadeiro se o valor contiver dados.
*/
function hasContent(value, if_zero = false) {
	const data = toValue(value);
	if (!data && data !== 0 || String(data) === "null" || String(data) === "NULL" || String(data) === "undefined" || String(data) === "UNDEFINED") return false;
	if (typeof data === "number") return data === 0 ? if_zero : true;
	if (typeof data === "string") return data.trim().length > 0;
	if (Array.isArray(data)) return data.length > 0;
	if (String(data) !== "[object Object]") return String(data).length > 0;
	if (data instanceof Map || data instanceof Set) return data.size > 0;
	if (typeof data === "object") return Object.keys(data).length > 0;
	return data.length > 0;
}
//#endregion
//#region src/Helpers/Types/isBlank.ts
/**
* Verifica se um valor está "em branco".
* 
* @param value O valor a ser verificado.
* @param if_zero Se true, considera o número 0 como NÃO estando em branco.
* @returns Retorna true se estiver em branco.
*/
function isBlank(value, if_zero = false) {
	return !hasContent(value, if_zero);
}
//#endregion
export { hasContent as n, isBlank as t };

//# sourceMappingURL=isBlank-Bufr2VEO.js.map