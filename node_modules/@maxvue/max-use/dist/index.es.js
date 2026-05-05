import { c as dist_exports } from "./dist-B3dS6Ldn.js";
import { n as getColorFromVar, r as isTouchDevice, t as Browser_exports } from "./Browser-Ch4-GjXZ.js";
import { _ as isInDateInterval, a as diffInMonths, c as isWeekend, d as isPast, f as hasPassedDays, g as inDateInterval, h as isSameDay, i as diffInMinutes, l as addTime, m as hasPassedHours, n as diffInDays, o as diffInSeconds, p as hasPassedMinutes, r as diffInHours, s as diffInYears, t as Dates_exports, u as isFuture, v as isDate, y as now } from "./Dates-COwx89N3.js";
import { C as countBy, S as filter, _ as orderBy, a as findLast, b as filterByNot, c as shuffle, d as valuesInKey, f as uniq, g as orderByWithKey, h as sortBy, i as sortByMulti, l as sample, m as sum, n as last, o as uniqueBy, p as sumBy, r as first, s as chunk, t as Iterables_exports, u as size, v as keyBy, x as filterBy, y as groupBy } from "./Iterables-DNWNdfC4.js";
import { a as average, i as roundUp, n as median, r as roundDown, t as Math_exports } from "./Math-DWwrCqVa.js";
import { a as mapValues, c as renameKeys, d as unset, f as get, i as set, l as deepMerge, n as Objects_exports, o as omit, p as deepClone, r as diff, s as pick, t as Obj, u as isEqual } from "./Objects-B-8OTGVB.js";
import { n as isObject, t as isArray } from "./isArray-BS_zMfXk.js";
import { n as hasContent, t as isBlank } from "./isBlank-CcaeMWGO.js";
import { a as formatPhone, i as formatCpfCnpj, n as formatCnpj, o as maskSensitive, r as formatCpf, t as formatCep } from "./masks-B8vfV8Bo.js";
import { Random, Str, StrCase, StrFilter, camelCase, capitalize, initials, intervalRandom, kebabCase, noHtml as stripHtml, normalizeToSearch, onlyLetters, onlyLettersAndNumbers, onlyNumbers, onlySymbols, readingTime, removeSpaces, slugify, snakeCase, t as Strings_exports, toNumber, toSearchableString, truncate, ulid } from "./strings.es.js";
import { a as isNumeric, i as isNumber, n as canIterate, o as numeric, r as isIterable, t as Types_exports } from "./Types-CMDjL1Db.js";
import { cepIsValid, isCnpj, isCpf, isCpfCnpj, isEmail, isValid, t as Validations_exports, validate } from "./validations.es.js";
import { electric, electrical, t as Electrical_exports, wireSize } from "./electrical.es.js";
import { format, formatBytes, formatCurrency, t as Format_exports } from "./format.es.js";
import { a as useInCache, i as useRefCached, n as useTimeAgo, o as useDefaultReset, r as useRefStorage, t as Composables_exports } from "./Composables-DaSynK8N.js";
import { t as apiGetRoute } from "./apiGetRoute-BIhGzyFK.js";
import { apiDeleteRoute, apiPostRoute, apiPutRoute, apiUploadRoute, getRoute, getRouteByName, t as Routes_exports } from "./routes.es.js";
import { assert, bypassFilter, camelize, clamp, cloneFnJSON, computedAsync, computedInject, computedWithControl, containsProp, createEventHook, createFetch, createFilterWrapper, createGlobalState, createInjectionState, createRef, createReusableTemplate, createSharedComposable, createSingletonPromise, createTemplatePromise, createUnrefFn, debounceFilter, extendRef, formatDate, formatTimeAgo, formatTimeAgoIntl, formatTimeAgoIntlParts, getLifeCycleTarget, getSSRHandler, hasOwn, hyphenate, identity, increaseWithUnit, injectLocal, invoke, isDef, isDefined, makeDestructurable, mapGamepadToXbox360Controller, noop, normalizeDate, notNullish, objectEntries, objectOmit, objectPick, onClickOutside, onElementRemoval, onKeyDown, onKeyPressed, onKeyStroke, onKeyUp, onLongPress, onStartTyping, pausableFilter, promiseTimeout, provideLocal, provideSSRWidth, pxValue, rand, reactify, reactifyObject, reactiveComputed, reactiveOmit, reactivePick, refAutoReset, refDebounced, refDefault, refManualReset, refThrottled, refWithControl, setSSRHandler, syncRef, syncRefs, t as VueUse_exports, throttleFilter, timestamp, toArray, toReactive, transition, tryOnBeforeMount, tryOnBeforeUnmount, tryOnMounted, tryOnScopeDispose, tryOnUnmounted, unrefElement, until, useActiveElement, useAnimate, useArrayDifference, useArrayEvery, useArrayFilter, useArrayFind, useArrayFindIndex, useArrayFindLast, useArrayIncludes, useArrayJoin, useArrayMap, useArrayReduce, useArraySome, useArrayUnique, useAsyncQueue, useAsyncState, useBase64, useBattery, useBluetooth, useBreakpoints, useBroadcastChannel, useBrowserLocation, useCached, useClipboard, useClipboardItems, useCloned, useColorMode, useConfirmDialog, useCountdown, useCounter, useCssSupports, useCssVar, useCurrentElement, useCycleList, useDark, useDateFormat, useDebounceFn, useDebouncedRefHistory, useDeviceMotion, useDeviceOrientation, useDevicePixelRatio, useDevicesList, useDisplayMedia, useDocumentVisibility, useDraggable, useDropZone, useElementBounding, useElementByPoint, useElementHover, useElementSize, useElementVisibility, useEventBus, useEventListener, useEventSource, useEyeDropper, useFavicon, useFetch, useFileDialog, useFileSystemAccess, useFocus, useFocusWithin, useFps, useFullscreen, useGamepad, useGeolocation, useIdle, useImage, useInfiniteScroll, useIntersectionObserver, useInterval, useIntervalFn, useKeyModifier, useLastChanged, useLocalStorage, useMagicKeys, useManualRefHistory, useMediaControls, useMediaQuery, useMemoize, useMemory, useMounted, useMouse, useMouseInElement, useMousePressed, useMutationObserver, useNavigatorLanguage, useNetwork, useNow, useObjectUrl, useOffsetPagination, useOnline, usePageLeave, useParallax, useParentElement, usePerformanceObserver, usePermission, usePointer, usePointerLock, usePointerSwipe, usePreferredColorScheme, usePreferredContrast, usePreferredDark, usePreferredLanguages, usePreferredReducedMotion, usePreferredReducedTransparency, usePrevious, useRafFn, useRefHistory, useResizeObserver, useSSRWidth, useScreenOrientation, useScreenSafeArea, useScriptTag, useScroll, useScrollLock, useSessionStorage, useShare, useSorted, useSpeechRecognition, useSpeechSynthesis, useStepper, useStorage, useStorageAsync, useStyleTag, useSupported, useSwipe, useTemplateRefsList, useTextDirection, useTextSelection, useTextareaAutosize, useThrottleFn, useThrottledRefHistory, useTimeAgoIntl, useTimeout, useTimeoutFn, useTimeoutPoll, useTimestamp, useTitle, useToNumber, useToString, useToggle, useTransition, useUrlSearchParams, useUserMedia, useVModel, useVModels, useVibrate, useVirtualList, useWakeLock, useWebNotification, useWebSocket, useWebWorker, useWebWorkerFn, useWindowFocus, useWindowScroll, useWindowSize, watchArray, watchAtMost, watchDebounced, watchDeep, watchIgnorable, watchImmediate, watchOnce, watchThrottled, watchTriggerable, watchWithFilter, whenever } from "./vueuse.es.js";
//#region src/Helpers/maxUseItems.ts
/**
* Retorna a lista de todos os nomes de exports disponíveis na biblioteca MaxUse.
* Gera a lista dinamicamente a partir dos módulos fonte, sem depender do dist.
*/
var maxUseItems = () => {
	const allKeys = /* @__PURE__ */ new Set();
	const modules = [
		Composables_exports,
		Routes_exports,
		Browser_exports,
		Dates_exports,
		Iterables_exports,
		Math_exports,
		Objects_exports,
		Strings_exports,
		Types_exports,
		Validations_exports,
		Electrical_exports,
		Format_exports,
		VueUse_exports
	];
	for (const mod of modules) for (const key of Object.keys(mod)) {
		if (key === "vueUse") continue;
		allKeys.add(key);
	}
	return Array.from(allKeys).sort();
};
var autoImport = () => {
	return { "@maxvue/max-use": [
		...maxUseItems(),
		"_",
		"vueUse"
	] };
};
var maxUseAutoImport = autoImport();
//#endregion
//#region src/index.ts
/**
* Exporta um objeto contendo todos os itens do VueUse sem exceção.
*/
var vueUse = dist_exports;
/**
* Helpers Próprios da MaxUse.
*/
var ownHelpers = {
	...Composables_exports,
	...Routes_exports,
	...Browser_exports,
	...Dates_exports,
	...Iterables_exports,
	...Math_exports,
	...Objects_exports,
	...Strings_exports,
	...Types_exports,
	...Validations_exports,
	...Electrical_exports,
	...Format_exports
};
/**
* Helpers do VueUse (filtrados para evitar duplicatas com os próprios).
*/
var filteredVueUse = {};
var vueUseKeys = Object.keys(dist_exports).filter((key) => key !== "vueUse");
for (const key of vueUseKeys) if (!(key in ownHelpers)) filteredVueUse[key] = dist_exports[key];
/**
* Objeto centralizado de helpers, semelhante ao Lodash (_).
* Contém os helpers próprios e os do VueUse (sem duplicatas).
*/
var _ = {
	...ownHelpers,
	...filteredVueUse
};
//#endregion
export { Obj, Random, Str, StrCase, StrFilter, _, addTime, apiDeleteRoute, apiGetRoute, apiPostRoute, apiPutRoute, apiUploadRoute, assert, average, bypassFilter, camelCase, camelize, canIterate, capitalize, cepIsValid, chunk, clamp, deepClone as cloneDeep, deepClone, cloneFnJSON, computedAsync, computedInject, computedWithControl, containsProp, countBy, createEventHook, createFetch, createFilterWrapper, createGlobalState, createInjectionState, createRef, createReusableTemplate, createSharedComposable, createSingletonPromise, createTemplatePromise, createUnrefFn, debounceFilter, deepMerge, diff, diffInDays, diffInHours, diffInMinutes, diffInMonths, diffInSeconds, diffInYears, electric, electrical, extendRef, filter, filterBy, filterByNot, findLast, first, format, formatBytes, formatCep, formatCnpj, formatCpf, formatCpfCnpj, formatCurrency, formatDate, formatPhone, formatTimeAgo, formatTimeAgoIntl, formatTimeAgoIntlParts, get, getColorFromVar, getLifeCycleTarget, getRoute, getRouteByName, getSSRHandler, groupBy, hasContent, hasOwn, hasPassedDays, hasPassedHours, hasPassedMinutes, hyphenate, identity, inDateInterval, increaseWithUnit, initials, injectLocal, intervalRandom, invoke, isArray, isBlank, isCnpj, isCpf, isCpfCnpj, isDate, isDef, isDefined, isEmail, isEqual, isFuture, isInDateInterval, isIterable, isNumber, isNumeric, isObject, isPast, isSameDay, isTouchDevice, isValid, isWeekend, kebabCase, keyBy, last, makeDestructurable, mapGamepadToXbox360Controller, mapValues, maskSensitive, maxUseAutoImport, maxUseItems, median, stripHtml as noHtml, stripHtml, noop, normalizeDate, normalizeToSearch, notNullish, now, numeric, objectEntries, objectOmit, objectPick, omit, onClickOutside, onElementRemoval, onKeyDown, onKeyPressed, onKeyStroke, onKeyUp, onLongPress, onStartTyping, onlyLetters, onlyLettersAndNumbers, onlyNumbers, onlySymbols, orderBy, orderByWithKey, pausableFilter, pick, promiseTimeout, provideLocal, provideSSRWidth, pxValue, rand, reactify, reactifyObject, reactiveComputed, reactiveOmit, reactivePick, readingTime, refAutoReset, refDebounced, refDefault, refManualReset, refThrottled, refWithControl, removeSpaces, renameKeys, roundDown, roundUp, sample, set, setSSRHandler, shuffle, size, slugify, snakeCase, sortBy, sortByMulti, sum, sumBy, syncRef, syncRefs, throttleFilter, timestamp, toArray, toNumber, toReactive, toSearchableString, transition, truncate, tryOnBeforeMount, tryOnBeforeUnmount, tryOnMounted, tryOnScopeDispose, tryOnUnmounted, ulid, uniq, uniqueBy, unrefElement, unset, until, useActiveElement, useAnimate, useArrayDifference, useArrayEvery, useArrayFilter, useArrayFind, useArrayFindIndex, useArrayFindLast, useArrayIncludes, useArrayJoin, useArrayMap, useArrayReduce, useArraySome, useArrayUnique, useAsyncQueue, useAsyncState, useBase64, useBattery, useBluetooth, useBreakpoints, useBroadcastChannel, useBrowserLocation, useCached, useClipboard, useClipboardItems, useCloned, useColorMode, useConfirmDialog, useCountdown, useCounter, useCssSupports, useCssVar, useCurrentElement, useCycleList, useDark, useDateFormat, useDebounceFn, useDebouncedRefHistory, useDefaultReset, useDeviceMotion, useDeviceOrientation, useDevicePixelRatio, useDevicesList, useDisplayMedia, useDocumentVisibility, useDraggable, useDropZone, useElementBounding, useElementByPoint, useElementHover, useElementSize, useElementVisibility, useEventBus, useEventListener, useEventSource, useEyeDropper, useFavicon, useFetch, useFileDialog, useFileSystemAccess, useFocus, useFocusWithin, useFps, useFullscreen, useGamepad, useGeolocation, useIdle, useImage, useInCache, useInfiniteScroll, useIntersectionObserver, useInterval, useIntervalFn, useKeyModifier, useLastChanged, useLocalStorage, useMagicKeys, useManualRefHistory, useMediaControls, useMediaQuery, useMemoize, useMemory, useMounted, useMouse, useMouseInElement, useMousePressed, useMutationObserver, useNavigatorLanguage, useNetwork, useNow, useObjectUrl, useOffsetPagination, useOnline, usePageLeave, useParallax, useParentElement, usePerformanceObserver, usePermission, usePointer, usePointerLock, usePointerSwipe, usePreferredColorScheme, usePreferredContrast, usePreferredDark, usePreferredLanguages, usePreferredReducedMotion, usePreferredReducedTransparency, usePrevious, useRafFn, useRefCached, useRefHistory, useRefStorage, useResizeObserver, useSSRWidth, useScreenOrientation, useScreenSafeArea, useScriptTag, useScroll, useScrollLock, useSessionStorage, useShare, useSorted, useSpeechRecognition, useSpeechSynthesis, useStepper, useStorage, useStorageAsync, useStyleTag, useSupported, useSwipe, useTemplateRefsList, useTextDirection, useTextSelection, useTextareaAutosize, useThrottleFn, useThrottledRefHistory, useTimeAgo, useTimeAgoIntl, useTimeout, useTimeoutFn, useTimeoutPoll, useTimestamp, useTitle, useToNumber, useToString, useToggle, useTransition, useUrlSearchParams, useUserMedia, useVModel, useVModels, useVibrate, useVirtualList, useWakeLock, useWebNotification, useWebSocket, useWebWorker, useWebWorkerFn, useWindowFocus, useWindowScroll, useWindowSize, validate, valuesInKey, vueUse, watchArray, watchAtMost, watchDebounced, watchDeep, watchIgnorable, watchImmediate, watchOnce, watchThrottled, watchTriggerable, watchWithFilter, whenever, wireSize };

//# sourceMappingURL=index.es.js.map