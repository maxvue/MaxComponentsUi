import { n as __exportAll } from "./chunk-C-Qwzh9l.js";
//#region src/Helpers/Browser/isTouchDevice.ts
/**
* Detecta se o dispositivo atual possui suporte a interações via toque (touch).
*
* @returns true se o dispositivo suportar toque, caso contrário false.
*/
function isTouchDevice() {
	return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}
//#endregion
//#region src/Helpers/Browser/index.ts
var Browser_exports = /* @__PURE__ */ __exportAll({ isTouchDevice: () => isTouchDevice });
//#endregion
export { isTouchDevice as n, Browser_exports as t };

//# sourceMappingURL=Browser-CSRSebVG.js.map