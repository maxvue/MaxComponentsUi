//#region node_modules/ulid/dist/browser/index.js
var ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
var ENCODING_LEN = 32;
var RANDOM_LEN = 16;
var TIME_MAX = 0xffffffffffff;
var ULIDErrorCode;
(function(ULIDErrorCode) {
	ULIDErrorCode["Base32IncorrectEncoding"] = "B32_ENC_INVALID";
	ULIDErrorCode["DecodeTimeInvalidCharacter"] = "DEC_TIME_CHAR";
	ULIDErrorCode["DecodeTimeValueMalformed"] = "DEC_TIME_MALFORMED";
	ULIDErrorCode["EncodeTimeNegative"] = "ENC_TIME_NEG";
	ULIDErrorCode["EncodeTimeSizeExceeded"] = "ENC_TIME_SIZE_EXCEED";
	ULIDErrorCode["EncodeTimeValueMalformed"] = "ENC_TIME_MALFORMED";
	ULIDErrorCode["PRNGDetectFailure"] = "PRNG_DETECT";
	ULIDErrorCode["ULIDInvalid"] = "ULID_INVALID";
	ULIDErrorCode["Unexpected"] = "UNEXPECTED";
	ULIDErrorCode["UUIDInvalid"] = "UUID_INVALID";
})(ULIDErrorCode || (ULIDErrorCode = {}));
var ULIDError = class extends Error {
	constructor(errorCode, message) {
		super(`${message} (${errorCode})`);
		this.name = "ULIDError";
		this.code = errorCode;
	}
};
function randomChar(prng) {
	const randomPosition = Math.floor(prng() * ENCODING_LEN) % ENCODING_LEN;
	return ENCODING.charAt(randomPosition);
}
/**
* Detect the best PRNG (pseudo-random number generator)
* @param root The root to check from (global/window)
* @returns The PRNG function
*/
function detectPRNG(root) {
	const rootLookup = detectRoot();
	const globalCrypto = rootLookup && (rootLookup.crypto || rootLookup.msCrypto) || null;
	if (typeof globalCrypto?.getRandomValues === "function") return () => {
		const buffer = new Uint8Array(1);
		globalCrypto.getRandomValues(buffer);
		return buffer[0] / 256;
	};
	else if (typeof globalCrypto?.randomBytes === "function") return () => globalCrypto.randomBytes(1).readUInt8() / 256;
	throw new ULIDError(ULIDErrorCode.PRNGDetectFailure, "Failed to find a reliable PRNG");
}
function detectRoot() {
	if (inWebWorker()) return self;
	if (typeof window !== "undefined") return window;
	if (typeof global !== "undefined") return global;
	if (typeof globalThis !== "undefined") return globalThis;
	return null;
}
function encodeRandom(len, prng) {
	let str = "";
	for (; len > 0; len--) str = randomChar(prng) + str;
	return str;
}
/**
* Encode the time portion of a ULID
* @param now The current timestamp
* @param len Length to generate
* @returns The encoded time
*/
function encodeTime(now, len = 10) {
	if (isNaN(now)) throw new ULIDError(ULIDErrorCode.EncodeTimeValueMalformed, `Time must be a number: ${now}`);
	else if (now > 0xffffffffffff) throw new ULIDError(ULIDErrorCode.EncodeTimeSizeExceeded, `Cannot encode a time larger than ${TIME_MAX}: ${now}`);
	else if (now < 0) throw new ULIDError(ULIDErrorCode.EncodeTimeNegative, `Time must be positive: ${now}`);
	else if (Number.isInteger(now) === false) throw new ULIDError(ULIDErrorCode.EncodeTimeValueMalformed, `Time must be an integer: ${now}`);
	let mod, str = "";
	for (let currentLen = len; currentLen > 0; currentLen--) {
		mod = now % ENCODING_LEN;
		str = ENCODING.charAt(mod) + str;
		now = (now - mod) / ENCODING_LEN;
	}
	return str;
}
function inWebWorker() {
	return typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
}
/**
* Generate a ULID
* @param seedTime Optional time seed
* @param prng Optional PRNG function
* @returns A ULID string
* @example
*  ulid(); // "01HNZXD07M5CEN5XA66EMZSRZW"
*/
function ulid(seedTime, prng) {
	const currentPRNG = prng || detectPRNG();
	return encodeTime(!seedTime || isNaN(seedTime) ? Date.now() : seedTime, 10) + encodeRandom(RANDOM_LEN, currentPRNG);
}
//#endregion
export { ulid as t };

//# sourceMappingURL=browser-D3zs1kBf.js.map