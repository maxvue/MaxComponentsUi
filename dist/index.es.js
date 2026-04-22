import { Transition as e, computed as t, createBlock as n, createCommentVNode as r, createElementBlock as i, createElementVNode as a, createTextVNode as o, createVNode as s, defineComponent as c, getCurrentInstance as l, mergeProps as u, nextTick as d, normalizeClass as f, normalizeStyle as p, onMounted as m, openBlock as h, reactive as g, readonly as ee, ref as _, renderSlot as v, resolveComponent as y, resolveDirective as b, resolveDynamicComponent as x, toDisplayString as S, unref as C, useAttrs as w, useId as T, watch as E, withCtx as D, withDirectives as O } from "vue";
//#region node_modules/@primeuix/utils/dist/object/index.mjs
var te = Object.defineProperty, k = Object.getOwnPropertySymbols, ne = Object.prototype.hasOwnProperty, re = Object.prototype.propertyIsEnumerable, ie = (e, t, n) => t in e ? te(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, ae = (e, t) => {
	for (var n in t ||= {}) ne.call(t, n) && ie(e, n, t[n]);
	if (k) for (var n of k(t)) re.call(t, n) && ie(e, n, t[n]);
	return e;
};
function A(e) {
	return e == null || e === "" || Array.isArray(e) && e.length === 0 || !(e instanceof Date) && typeof e == "object" && Object.keys(e).length === 0;
}
function oe(e) {
	return typeof e == "function" && "call" in e && "apply" in e;
}
function j(e) {
	return !A(e);
}
function M(e, t = !0) {
	return e instanceof Object && e.constructor === Object && (t || Object.keys(e).length !== 0);
}
function se(e = {}, t = {}) {
	let n = ae({}, e);
	return Object.keys(t).forEach((r) => {
		let i = r;
		M(t[i]) && i in e && M(e[i]) ? n[i] = se(e[i], t[i]) : n[i] = t[i];
	}), n;
}
function ce(...e) {
	return e.reduce((e, t, n) => n === 0 ? t : se(e, t), {});
}
function N(e, ...t) {
	return oe(e) ? e(...t) : e;
}
function P(e, t = !0) {
	return typeof e == "string" && (t || e !== "");
}
function F(e) {
	return P(e) ? e.replace(/(-|_)/g, "").toLowerCase() : e;
}
function le(e, t = "", n = {}) {
	let r = F(t).split("."), i = r.shift();
	return i ? M(e) ? le(N(e[Object.keys(e).find((e) => F(e) === i) || ""], n), r.join("."), n) : void 0 : N(e, n);
}
function ue(e, t = !0) {
	return Array.isArray(e) && (t || e.length !== 0);
}
function de(e) {
	return j(e) && !isNaN(e);
}
function I(e, t) {
	if (t) {
		let n = t.test(e);
		return t.lastIndex = 0, n;
	}
	return !1;
}
function fe(...e) {
	return ce(...e);
}
function pe(e) {
	return e && e.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "").replace(/ {2,}/g, " ").replace(/ ([{:}]) /g, "$1").replace(/([;,]) /g, "$1").replace(/ !/g, "!").replace(/: /g, ":").trim();
}
function me(e) {
	return P(e, !1) ? e[0].toUpperCase() + e.slice(1) : e;
}
function he(e) {
	return P(e) ? e.replace(/(_)/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() : e;
}
//#endregion
//#region node_modules/@primeuix/utils/dist/eventbus/index.mjs
function ge() {
	let e = /* @__PURE__ */ new Map();
	return {
		on(t, n) {
			let r = e.get(t);
			return r ? r.push(n) : r = [n], e.set(t, r), this;
		},
		off(t, n) {
			let r = e.get(t);
			return r && r.splice(r.indexOf(n) >>> 0, 1), this;
		},
		emit(t, n) {
			let r = e.get(t);
			r && r.forEach((e) => {
				e(n);
			});
		},
		clear() {
			e.clear();
		}
	};
}
//#endregion
//#region node_modules/@primeuix/utils/dist/classnames/index.mjs
function L(...e) {
	if (e) {
		let t = [];
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			if (!r) continue;
			let i = typeof r;
			if (i === "string" || i === "number") t.push(r);
			else if (i === "object") {
				let e = Array.isArray(r) ? [L(...r)] : Object.entries(r).map(([e, t]) => t ? e : void 0);
				t = e.length ? t.concat(e.filter((e) => !!e)) : t;
			}
		}
		return t.join(" ").trim();
	}
}
//#endregion
//#region node_modules/@primeuix/utils/dist/dom/index.mjs
function _e(e, t) {
	return e ? e.classList ? e.classList.contains(t) : RegExp("(^| )" + t + "( |$)", "gi").test(e.className) : !1;
}
function ve(e, t) {
	if (e && t) {
		let n = (t) => {
			_e(e, t) || (e.classList ? e.classList.add(t) : e.className += " " + t);
		};
		[t].flat().filter(Boolean).forEach((e) => e.split(" ").forEach(n));
	}
}
function ye(e, t) {
	if (e && t) {
		let n = (t) => {
			e.classList ? e.classList.remove(t) : e.className = e.className.replace(RegExp("(^|\\b)" + t.split(" ").join("|") + "(\\b|$)", "gi"), " ");
		};
		[t].flat().filter(Boolean).forEach((e) => e.split(" ").forEach(n));
	}
}
function be(e) {
	return e ? Math.abs(e.scrollLeft) : 0;
}
function xe(e, t) {
	if (e instanceof HTMLElement) {
		let n = e.offsetWidth;
		if (t) {
			let t = getComputedStyle(e);
			n += parseFloat(t.marginLeft) + parseFloat(t.marginRight);
		}
		return n;
	}
	return 0;
}
function Se(e) {
	if (e) {
		let t = e.parentNode;
		return t && t instanceof ShadowRoot && t.host && (t = t.host), t;
	}
	return null;
}
function Ce(e) {
	return !!(e != null && e.nodeName && Se(e));
}
function we(e) {
	return typeof Element < "u" ? e instanceof Element : typeof e == "object" && !!e && e.nodeType === 1 && typeof e.nodeName == "string";
}
function Te(e, t = {}) {
	if (we(e)) {
		let n = (t, r) => {
			var i;
			let a = (i = e?.$attrs) != null && i[t] ? [e?.$attrs?.[t]] : [];
			return [r].flat().reduce((e, r) => {
				if (r != null) {
					let i = typeof r;
					if (i === "string" || i === "number") e.push(r);
					else if (i === "object") {
						let i = Array.isArray(r) ? n(t, r) : Object.entries(r).map(([e, n]) => t === "style" && (n || n === 0) ? `${e.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}:${n}` : n ? e : void 0);
						e = i.length ? e.concat(i.filter((e) => !!e)) : e;
					}
				}
				return e;
			}, a);
		};
		Object.entries(t).forEach(([t, r]) => {
			if (r != null) {
				let i = t.match(/^on(.+)/);
				i ? e.addEventListener(i[1].toLowerCase(), r) : t === "p-bind" || t === "pBind" ? Te(e, r) : (r = t === "class" ? [...new Set(n("class", r))].join(" ").trim() : t === "style" ? n("style", r).join(";").trim() : r, (e.$attrs = e.$attrs || {}) && (e.$attrs[t] = r), e.setAttribute(t, r));
			}
		});
	}
}
function Ee(e, t = {}, ...n) {
	if (e) {
		let r = document.createElement(e);
		return Te(r, t), r.append(...n), r;
	}
}
function De(e, t) {
	return we(e) ? e.matches(t) ? e : e.querySelector(t) : null;
}
function Oe(e, t) {
	if (we(e)) {
		let n = e.getAttribute(t);
		return isNaN(n) ? n === "true" || n === "false" ? n === "true" : n : +n;
	}
}
function ke(e) {
	if (e) {
		let t = e.offsetHeight, n = getComputedStyle(e);
		return t -= parseFloat(n.paddingTop) + parseFloat(n.paddingBottom) + parseFloat(n.borderTopWidth) + parseFloat(n.borderBottomWidth), t;
	}
	return 0;
}
function Ae(e) {
	if (e) {
		let t = e.getBoundingClientRect();
		return {
			top: t.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
			left: t.left + (window.pageXOffset || be(document.documentElement) || be(document.body) || 0)
		};
	}
	return {
		top: "auto",
		left: "auto"
	};
}
function je(e, t) {
	if (e) {
		let n = e.offsetHeight;
		if (t) {
			let t = getComputedStyle(e);
			n += parseFloat(t.marginTop) + parseFloat(t.marginBottom);
		}
		return n;
	}
	return 0;
}
function Me(e) {
	if (e) {
		let t = e.offsetWidth, n = getComputedStyle(e);
		return t -= parseFloat(n.paddingLeft) + parseFloat(n.paddingRight) + parseFloat(n.borderLeftWidth) + parseFloat(n.borderRightWidth), t;
	}
	return 0;
}
function Ne() {
	return !!(typeof window < "u" && window.document && window.document.createElement);
}
function Pe(e, t = "", n) {
	we(e) && n != null && e.setAttribute(t, n);
}
//#endregion
//#region node_modules/@primeuix/utils/dist/uuid/index.mjs
var Fe = {};
function Ie(e = "pui_id_") {
	return Object.hasOwn(Fe, e) || (Fe[e] = 0), Fe[e]++, `${e}${Fe[e]}`;
}
//#endregion
//#region node_modules/@primeuix/styled/dist/index.mjs
var Le = Object.defineProperty, Re = Object.defineProperties, ze = Object.getOwnPropertyDescriptors, Be = Object.getOwnPropertySymbols, Ve = Object.prototype.hasOwnProperty, He = Object.prototype.propertyIsEnumerable, Ue = (e, t, n) => t in e ? Le(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, R = (e, t) => {
	for (var n in t ||= {}) Ve.call(t, n) && Ue(e, n, t[n]);
	if (Be) for (var n of Be(t)) He.call(t, n) && Ue(e, n, t[n]);
	return e;
}, We = (e, t) => Re(e, ze(t)), z = (e, t) => {
	var n = {};
	for (var r in e) Ve.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && Be) for (var r of Be(e)) t.indexOf(r) < 0 && He.call(e, r) && (n[r] = e[r]);
	return n;
};
function Ge(...e) {
	return ce(...e);
}
var B = ge(), Ke = /{([^}]*)}/g, qe = /(\d+\s+[\+\-\*\/]\s+\d+)/g, Je = /var\([^)]+\)/g;
function Ye(e) {
	return P(e) ? e.replace(/[A-Z]/g, (e, t) => t === 0 ? e : "." + e.toLowerCase()).toLowerCase() : e;
}
function Xe(e) {
	return M(e) && e.hasOwnProperty("$value") && e.hasOwnProperty("$type") ? e.$value : e;
}
function Ze(e) {
	return e.replaceAll(/ /g, "").replace(/[^\w]/g, "-");
}
function Qe(e = "", t = "") {
	return Ze(`${P(e, !1) && P(t, !1) ? `${e}-` : e}${t}`);
}
function $e(e = "", t = "") {
	return `--${Qe(e, t)}`;
}
function et(e = "") {
	return ((e.match(/{/g) || []).length + (e.match(/}/g) || []).length) % 2 != 0;
}
function tt(e, t = "", n = "", r = [], i) {
	if (P(e)) {
		let t = e.trim();
		if (et(t)) return;
		if (I(t, Ke)) {
			let e = t.replaceAll(Ke, (e) => `var(${$e(n, he(e.replace(/{|}/g, "").split(".").filter((e) => !r.some((t) => I(e, t))).join("-")))}${j(i) ? `, ${i}` : ""})`);
			return I(e.replace(Je, "0"), qe) ? `calc(${e})` : e;
		}
		return t;
	} else if (de(e)) return e;
}
function nt(e, t, n) {
	P(t, !1) && e.push(`${t}:${n};`);
}
function rt(e, t) {
	return e ? `${e}{${t}}` : "";
}
function it(e, t) {
	if (e.indexOf("dt(") === -1) return e;
	function n(e, t) {
		let n = [], i = 0, a = "", o = null, s = 0;
		for (; i <= e.length;) {
			let c = e[i];
			if ((c === "\"" || c === "'" || c === "`") && e[i - 1] !== "\\" && (o = o === c ? null : c), !o && (c === "(" && s++, c === ")" && s--, (c === "," || i === e.length) && s === 0)) {
				let e = a.trim();
				e.startsWith("dt(") ? n.push(it(e, t)) : n.push(r(e)), a = "", i++;
				continue;
			}
			c !== void 0 && (a += c), i++;
		}
		return n;
	}
	function r(e) {
		let t = e[0];
		if ((t === "\"" || t === "'" || t === "`") && e[e.length - 1] === t) return e.slice(1, -1);
		let n = Number(e);
		return isNaN(n) ? e : n;
	}
	let i = [], a = [];
	for (let t = 0; t < e.length; t++) if (e[t] === "d" && e.slice(t, t + 3) === "dt(") a.push(t), t += 2;
	else if (e[t] === ")" && a.length > 0) {
		let e = a.pop();
		a.length === 0 && i.push([e, t]);
	}
	if (!i.length) return e;
	for (let r = i.length - 1; r >= 0; r--) {
		let [a, o] = i[r], s = t(...n(e.slice(a + 3, o), t));
		e = e.slice(0, a) + s + e.slice(o + 1);
	}
	return e;
}
var V = (...e) => at(U.getTheme(), ...e), at = (e = {}, t, n, r) => {
	if (t) {
		let { variable: i, options: a } = U.defaults || {}, { prefix: o, transform: s } = e?.options || a || {}, c = I(t, Ke) ? t : `{${t}}`;
		return r === "value" || A(r) && s === "strict" ? U.getTokenValue(t) : tt(c, void 0, o, [i.excludedKeyRegex], n);
	}
	return "";
};
function ot(e, ...t) {
	return e instanceof Array ? it(e.reduce((e, n, r) => e + n + (N(t[r], { dt: V }) ?? ""), ""), V) : N(e, { dt: V });
}
function st(e, t = {}) {
	let n = U.defaults.variable, { prefix: r = n.prefix, selector: i = n.selector, excludedKeyRegex: a = n.excludedKeyRegex } = t, o = [], s = [], c = [{
		node: e,
		path: r
	}];
	for (; c.length;) {
		let { node: e, path: t } = c.pop();
		for (let n in e) {
			let i = e[n], l = Xe(i), u = I(n, a) ? Qe(t) : Qe(t, he(n));
			if (M(l)) c.push({
				node: l,
				path: u
			});
			else {
				nt(s, $e(u), tt(l, u, r, [a]));
				let e = u;
				r && e.startsWith(r + "-") && (e = e.slice(r.length + 1)), o.push(e.replace(/-/g, "."));
			}
		}
	}
	let l = s.join("");
	return {
		value: s,
		tokens: o,
		declarations: l,
		css: rt(i, l)
	};
}
var H = {
	regex: {
		rules: {
			class: {
				pattern: /^\.([a-zA-Z][\w-]*)$/,
				resolve(e) {
					return {
						type: "class",
						selector: e,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			attr: {
				pattern: /^\[(.*)\]$/,
				resolve(e) {
					return {
						type: "attr",
						selector: `:root${e},:host${e}`,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			media: {
				pattern: /^@media (.*)$/,
				resolve(e) {
					return {
						type: "media",
						selector: e,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			system: {
				pattern: /^system$/,
				resolve(e) {
					return {
						type: "system",
						selector: "@media (prefers-color-scheme: dark)",
						matched: this.pattern.test(e.trim())
					};
				}
			},
			custom: { resolve(e) {
				return {
					type: "custom",
					selector: e,
					matched: !0
				};
			} }
		},
		resolve(e) {
			let t = Object.keys(this.rules).filter((e) => e !== "custom").map((e) => this.rules[e]);
			return [e].flat().map((e) => t.map((t) => t.resolve(e)).find((e) => e.matched) ?? this.rules.custom.resolve(e));
		}
	},
	_toVariables(e, t) {
		return st(e, { prefix: t?.prefix });
	},
	getCommon({ name: e = "", theme: t = {}, params: n, set: r, defaults: i }) {
		let { preset: a, options: o } = t, s, c, l, u, d, f, p;
		if (j(a) && o.transform !== "strict") {
			let { primitive: t, semantic: n, extend: m } = a, h = n || {}, { colorScheme: g } = h, ee = z(h, ["colorScheme"]), _ = m || {}, { colorScheme: v } = _, y = z(_, ["colorScheme"]), b = g || {}, { dark: x } = b, S = z(b, ["dark"]), C = v || {}, { dark: w } = C, T = z(C, ["dark"]), E = j(t) ? this._toVariables({ primitive: t }, o) : {}, D = j(ee) ? this._toVariables({ semantic: ee }, o) : {}, O = j(S) ? this._toVariables({ light: S }, o) : {}, te = j(x) ? this._toVariables({ dark: x }, o) : {}, k = j(y) ? this._toVariables({ semantic: y }, o) : {}, ne = j(T) ? this._toVariables({ light: T }, o) : {}, re = j(w) ? this._toVariables({ dark: w }, o) : {}, [ie, ae] = [E.declarations ?? "", E.tokens], [A, oe] = [D.declarations ?? "", D.tokens || []], [M, se] = [O.declarations ?? "", O.tokens || []], [ce, P] = [te.declarations ?? "", te.tokens || []], [F, le] = [k.declarations ?? "", k.tokens || []], [ue, de] = [ne.declarations ?? "", ne.tokens || []], [I, fe] = [re.declarations ?? "", re.tokens || []];
			s = this.transformCSS(e, ie, "light", "variable", o, r, i), c = ae, l = `${this.transformCSS(e, `${A}${M}`, "light", "variable", o, r, i)}${this.transformCSS(e, `${ce}`, "dark", "variable", o, r, i)}`, u = [...new Set([
				...oe,
				...se,
				...P
			])], d = `${this.transformCSS(e, `${F}${ue}color-scheme:light`, "light", "variable", o, r, i)}${this.transformCSS(e, `${I}color-scheme:dark`, "dark", "variable", o, r, i)}`, f = [...new Set([
				...le,
				...de,
				...fe
			])], p = N(a.css, { dt: V });
		}
		return {
			primitive: {
				css: s,
				tokens: c
			},
			semantic: {
				css: l,
				tokens: u
			},
			global: {
				css: d,
				tokens: f
			},
			style: p
		};
	},
	getPreset({ name: e = "", preset: t = {}, options: n, params: r, set: i, defaults: a, selector: o }) {
		let s, c, l;
		if (j(t) && n.transform !== "strict") {
			let r = e.replace("-directive", ""), u = t, { colorScheme: d, extend: f, css: p } = u, m = z(u, [
				"colorScheme",
				"extend",
				"css"
			]), h = f || {}, { colorScheme: g } = h, ee = z(h, ["colorScheme"]), _ = d || {}, { dark: v } = _, y = z(_, ["dark"]), b = g || {}, { dark: x } = b, S = z(b, ["dark"]), C = j(m) ? this._toVariables({ [r]: R(R({}, m), ee) }, n) : {}, w = j(y) ? this._toVariables({ [r]: R(R({}, y), S) }, n) : {}, T = j(v) ? this._toVariables({ [r]: R(R({}, v), x) }, n) : {}, [E, D] = [C.declarations ?? "", C.tokens || []], [O, te] = [w.declarations ?? "", w.tokens || []], [k, ne] = [T.declarations ?? "", T.tokens || []];
			s = `${this.transformCSS(r, `${E}${O}`, "light", "variable", n, i, a, o)}${this.transformCSS(r, k, "dark", "variable", n, i, a, o)}`, c = [...new Set([
				...D,
				...te,
				...ne
			])], l = N(p, { dt: V });
		}
		return {
			css: s,
			tokens: c,
			style: l
		};
	},
	getPresetC({ name: e = "", theme: t = {}, params: n, set: r, defaults: i }) {
		let { preset: a, options: o } = t, s = a?.components?.[e];
		return this.getPreset({
			name: e,
			preset: s,
			options: o,
			params: n,
			set: r,
			defaults: i
		});
	},
	getPresetD({ name: e = "", theme: t = {}, params: n, set: r, defaults: i }) {
		let a = e.replace("-directive", ""), { preset: o, options: s } = t, c = o?.components?.[a] || o?.directives?.[a];
		return this.getPreset({
			name: a,
			preset: c,
			options: s,
			params: n,
			set: r,
			defaults: i
		});
	},
	applyDarkColorScheme(e) {
		return !(e.darkModeSelector === "none" || e.darkModeSelector === !1);
	},
	getColorSchemeOption(e, t) {
		return this.applyDarkColorScheme(e) ? this.regex.resolve(e.darkModeSelector === !0 ? t.options.darkModeSelector : e.darkModeSelector ?? t.options.darkModeSelector) : [];
	},
	getLayerOrder(e, t = {}, n, r) {
		let { cssLayer: i } = t;
		return i ? `@layer ${N(i.order || i.name || "primeui", n)}` : "";
	},
	getCommonStyleSheet({ name: e = "", theme: t = {}, params: n, props: r = {}, set: i, defaults: a }) {
		let o = this.getCommon({
			name: e,
			theme: t,
			params: n,
			set: i,
			defaults: a
		}), s = Object.entries(r).reduce((e, [t, n]) => e.push(`${t}="${n}"`) && e, []).join(" ");
		return Object.entries(o || {}).reduce((e, [t, n]) => {
			if (M(n) && Object.hasOwn(n, "css")) {
				let r = pe(n.css), i = `${t}-variables`;
				e.push(`<style type="text/css" data-primevue-style-id="${i}" ${s}>${r}</style>`);
			}
			return e;
		}, []).join("");
	},
	getStyleSheet({ name: e = "", theme: t = {}, params: n, props: r = {}, set: i, defaults: a }) {
		let o = {
			name: e,
			theme: t,
			params: n,
			set: i,
			defaults: a
		}, s = (e.includes("-directive") ? this.getPresetD(o) : this.getPresetC(o))?.css, c = Object.entries(r).reduce((e, [t, n]) => e.push(`${t}="${n}"`) && e, []).join(" ");
		return s ? `<style type="text/css" data-primevue-style-id="${e}-variables" ${c}>${pe(s)}</style>` : "";
	},
	createTokens(e = {}, t, n = "", r = "", i = {}) {
		let a = function(e, t = {}, n = []) {
			if (n.includes(this.path)) return console.warn(`Circular reference detected at ${this.path}`), {
				colorScheme: e,
				path: this.path,
				paths: t,
				value: void 0
			};
			n.push(this.path), t.name = this.path, t.binding ||= {};
			let r = this.value;
			if (typeof this.value == "string" && Ke.test(this.value)) {
				let i = this.value.trim().replace(Ke, (r) => {
					let i = r.slice(1, -1), a = this.tokens[i];
					if (!a) return console.warn(`Token not found for path: ${i}`), "__UNRESOLVED__";
					let o = a.computed(e, t, n);
					return Array.isArray(o) && o.length === 2 ? `light-dark(${o[0].value},${o[1].value})` : o?.value ?? "__UNRESOLVED__";
				});
				r = qe.test(i.replace(Je, "0")) ? `calc(${i})` : i;
			}
			return A(t.binding) && delete t.binding, n.pop(), {
				colorScheme: e,
				path: this.path,
				paths: t,
				value: r.includes("__UNRESOLVED__") ? void 0 : r
			};
		}, o = (e, n, r) => {
			Object.entries(e).forEach(([e, s]) => {
				let c = I(e, t.variable.excludedKeyRegex) ? n : n ? `${n}.${Ye(e)}` : Ye(e), l = r ? `${r}.${e}` : e;
				M(s) ? o(s, c, l) : (i[c] || (i[c] = {
					paths: [],
					computed: (e, t = {}, n = []) => {
						if (i[c].paths.length === 1) return i[c].paths[0].computed(i[c].paths[0].scheme, t.binding, n);
						if (e && e !== "none") for (let r = 0; r < i[c].paths.length; r++) {
							let a = i[c].paths[r];
							if (a.scheme === e) return a.computed(e, t.binding, n);
						}
						return i[c].paths.map((e) => e.computed(e.scheme, t[e.scheme], n));
					}
				}), i[c].paths.push({
					path: l,
					value: s,
					scheme: l.includes("colorScheme.light") ? "light" : l.includes("colorScheme.dark") ? "dark" : "none",
					computed: a,
					tokens: i
				}));
			});
		};
		return o(e, n, r), i;
	},
	getTokenValue(e, t, n) {
		let r = ((e) => e.split(".").filter((e) => !I(e.toLowerCase(), n.variable.excludedKeyRegex)).join("."))(t), i = t.includes("colorScheme.light") ? "light" : t.includes("colorScheme.dark") ? "dark" : void 0, a = [e[r]?.computed(i)].flat().filter((e) => e);
		return a.length === 1 ? a[0].value : a.reduce((e = {}, t) => {
			let n = t, { colorScheme: r } = n;
			return e[r] = z(n, ["colorScheme"]), e;
		}, void 0);
	},
	getSelectorRule(e, t, n, r) {
		return n === "class" || n === "attr" ? rt(j(t) ? `${e}${t},${e} ${t}` : e, r) : rt(e, rt(t ?? ":root,:host", r));
	},
	transformCSS(e, t, n, r, i = {}, a, o, s) {
		if (j(t)) {
			let { cssLayer: c } = i;
			if (r !== "style") {
				let e = this.getColorSchemeOption(i, o);
				t = n === "dark" ? e.reduce((e, { type: n, selector: r }) => (j(r) && (e += r.includes("[CSS]") ? r.replace("[CSS]", t) : this.getSelectorRule(r, s, n, t)), e), "") : rt(s ?? ":root,:host", t);
			}
			if (c) {
				let n = {
					name: "primeui",
					order: "primeui"
				};
				M(c) && (n.name = N(c.name, {
					name: e,
					type: r
				})), j(n.name) && (t = rt(`@layer ${n.name}`, t), a?.layerNames(n.name));
			}
			return t;
		}
		return "";
	}
}, U = {
	defaults: {
		variable: {
			prefix: "p",
			selector: ":root,:host",
			excludedKeyRegex: /^(primitive|semantic|components|directives|variables|colorscheme|light|dark|common|root|states|extend|css)$/gi
		},
		options: {
			prefix: "p",
			darkModeSelector: "system",
			cssLayer: !1
		}
	},
	_theme: void 0,
	_layerNames: /* @__PURE__ */ new Set(),
	_loadedStyleNames: /* @__PURE__ */ new Set(),
	_loadingStyles: /* @__PURE__ */ new Set(),
	_tokens: {},
	update(e = {}) {
		let { theme: t } = e;
		t && (this._theme = We(R({}, t), { options: R(R({}, this.defaults.options), t.options) }), this._tokens = H.createTokens(this.preset, this.defaults), this.clearLoadedStyleNames());
	},
	get theme() {
		return this._theme;
	},
	get preset() {
		return this.theme?.preset || {};
	},
	get options() {
		return this.theme?.options || {};
	},
	get tokens() {
		return this._tokens;
	},
	getTheme() {
		return this.theme;
	},
	setTheme(e) {
		this.update({ theme: e }), B.emit("theme:change", e);
	},
	getPreset() {
		return this.preset;
	},
	setPreset(e) {
		this._theme = We(R({}, this.theme), { preset: e }), this._tokens = H.createTokens(e, this.defaults), this.clearLoadedStyleNames(), B.emit("preset:change", e), B.emit("theme:change", this.theme);
	},
	getOptions() {
		return this.options;
	},
	setOptions(e) {
		this._theme = We(R({}, this.theme), { options: e }), this.clearLoadedStyleNames(), B.emit("options:change", e), B.emit("theme:change", this.theme);
	},
	getLayerNames() {
		return [...this._layerNames];
	},
	setLayerNames(e) {
		this._layerNames.add(e);
	},
	getLoadedStyleNames() {
		return this._loadedStyleNames;
	},
	isStyleNameLoaded(e) {
		return this._loadedStyleNames.has(e);
	},
	setLoadedStyleName(e) {
		this._loadedStyleNames.add(e);
	},
	deleteLoadedStyleName(e) {
		this._loadedStyleNames.delete(e);
	},
	clearLoadedStyleNames() {
		this._loadedStyleNames.clear();
	},
	getTokenValue(e) {
		return H.getTokenValue(this.tokens, e, this.defaults);
	},
	getCommon(e = "", t) {
		return H.getCommon({
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	getComponent(e = "", t) {
		let n = {
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return H.getPresetC(n);
	},
	getDirective(e = "", t) {
		let n = {
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return H.getPresetD(n);
	},
	getCustomPreset(e = "", t, n, r) {
		let i = {
			name: e,
			preset: t,
			options: this.options,
			selector: n,
			params: r,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return H.getPreset(i);
	},
	getLayerOrderCSS(e = "") {
		return H.getLayerOrder(e, this.options, { names: this.getLayerNames() }, this.defaults);
	},
	transformCSS(e = "", t, n = "style", r) {
		return H.transformCSS(e, t, r, n, this.options, { layerNames: this.setLayerNames.bind(this) }, this.defaults);
	},
	getCommonStyleSheet(e = "", t, n = {}) {
		return H.getCommonStyleSheet({
			name: e,
			theme: this.theme,
			params: t,
			props: n,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	getStyleSheet(e, t, n = {}) {
		return H.getStyleSheet({
			name: e,
			theme: this.theme,
			params: t,
			props: n,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	onStyleMounted(e) {
		this._loadingStyles.add(e);
	},
	onStyleUpdated(e) {
		this._loadingStyles.add(e);
	},
	onStyleLoaded(e, { name: t }) {
		this._loadingStyles.size && (this._loadingStyles.delete(t), B.emit(`theme:${t}:load`, e), !this._loadingStyles.size && B.emit("theme:load"));
	}
}, W = {
	STARTS_WITH: "startsWith",
	CONTAINS: "contains",
	NOT_CONTAINS: "notContains",
	ENDS_WITH: "endsWith",
	EQUALS: "equals",
	NOT_EQUALS: "notEquals",
	IN: "in",
	LESS_THAN: "lt",
	LESS_THAN_OR_EQUAL_TO: "lte",
	GREATER_THAN: "gt",
	GREATER_THAN_OR_EQUAL_TO: "gte",
	BETWEEN: "between",
	DATE_IS: "dateIs",
	DATE_IS_NOT: "dateIsNot",
	DATE_BEFORE: "dateBefore",
	DATE_AFTER: "dateAfter"
}, ct = "\n    *,\n    ::before,\n    ::after {\n        box-sizing: border-box;\n    }\n\n    .p-collapsible-enter-active {\n        animation: p-animate-collapsible-expand 0.2s ease-out;\n        overflow: hidden;\n    }\n\n    .p-collapsible-leave-active {\n        animation: p-animate-collapsible-collapse 0.2s ease-out;\n        overflow: hidden;\n    }\n\n    @keyframes p-animate-collapsible-expand {\n        from {\n            grid-template-rows: 0fr;\n        }\n        to {\n            grid-template-rows: 1fr;\n        }\n    }\n\n    @keyframes p-animate-collapsible-collapse {\n        from {\n            grid-template-rows: 1fr;\n        }\n        to {\n            grid-template-rows: 0fr;\n        }\n    }\n\n    .p-disabled,\n    .p-disabled * {\n        cursor: default;\n        pointer-events: none;\n        user-select: none;\n    }\n\n    .p-disabled,\n    .p-component:disabled {\n        opacity: dt('disabled.opacity');\n    }\n\n    .pi {\n        font-size: dt('icon.size');\n    }\n\n    .p-icon {\n        width: dt('icon.size');\n        height: dt('icon.size');\n    }\n\n    .p-overlay-mask {\n        background: var(--px-mask-background, dt('mask.background'));\n        color: dt('mask.color');\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n    }\n\n    .p-overlay-mask-enter-active {\n        animation: p-animate-overlay-mask-enter dt('mask.transition.duration') forwards;\n    }\n\n    .p-overlay-mask-leave-active {\n        animation: p-animate-overlay-mask-leave dt('mask.transition.duration') forwards;\n    }\n\n    @keyframes p-animate-overlay-mask-enter {\n        from {\n            background: transparent;\n        }\n        to {\n            background: var(--px-mask-background, dt('mask.background'));\n        }\n    }\n    @keyframes p-animate-overlay-mask-leave {\n        from {\n            background: var(--px-mask-background, dt('mask.background'));\n        }\n        to {\n            background: transparent;\n        }\n    }\n\n    .p-anchored-overlay-enter-active {\n        animation: p-animate-anchored-overlay-enter 300ms cubic-bezier(.19,1,.22,1);\n    }\n\n    .p-anchored-overlay-leave-active {\n        animation: p-animate-anchored-overlay-leave 300ms cubic-bezier(.19,1,.22,1);\n    }\n\n    @keyframes p-animate-anchored-overlay-enter {\n        from {\n            opacity: 0;\n            transform: scale(0.93);\n        }\n    }\n\n    @keyframes p-animate-anchored-overlay-leave {\n        to {\n            opacity: 0;\n            transform: scale(0.93);\n        }\n    }\n";
//#endregion
//#region node_modules/@primevue/core/usestyle/index.mjs
function lt(e) {
	"@babel/helpers - typeof";
	return lt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, lt(e);
}
function ut(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function dt(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? ut(Object(n), !0).forEach(function(t) {
			ft(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ut(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function ft(e, t, n) {
	return (t = pt(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function pt(e) {
	var t = mt(e, "string");
	return lt(t) == "symbol" ? t : t + "";
}
function mt(e, t) {
	if (lt(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (lt(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function ht(e) {
	var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
	l() && l().components ? m(e) : t ? e() : d(e);
}
var gt = 0;
function _t(e) {
	var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = _(!1), r = _(e), i = _(null), a = Ne() ? window.document : void 0, o = t.document, s = o === void 0 ? a : o, c = t.immediate, l = c === void 0 ? !0 : c, u = t.manual, d = u === void 0 ? !1 : u, f = t.name, p = f === void 0 ? `style_${++gt}` : f, m = t.id, h = m === void 0 ? void 0 : m, g = t.media, v = g === void 0 ? void 0 : g, y = t.nonce, b = y === void 0 ? void 0 : y, x = t.first, S = x === void 0 ? !1 : x, C = t.onMounted, w = C === void 0 ? void 0 : C, T = t.onUpdated, D = T === void 0 ? void 0 : T, O = t.onLoad, te = O === void 0 ? void 0 : O, k = t.props, ne = k === void 0 ? {} : k, re = function() {}, ie = function(t) {
		var a = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		if (s) {
			var o = dt(dt({}, ne), a), c = o.name || p, l = o.id || h, u = o.nonce || b;
			i.value = s.querySelector(`style[data-primevue-style-id="${c}"]`) || s.getElementById(l) || s.createElement("style"), i.value.isConnected || (r.value = t || e, Te(i.value, {
				type: "text/css",
				id: l,
				media: v,
				nonce: u
			}), S ? s.head.prepend(i.value) : s.head.appendChild(i.value), Pe(i.value, "data-primevue-style-id", c), Te(i.value, o), i.value.onload = function(e) {
				return te?.(e, { name: c });
			}, w?.(c)), !n.value && (re = E(r, function(e) {
				i.value.textContent = e, D?.(c);
			}, { immediate: !0 }), n.value = !0);
		}
	};
	return l && !d && ht(ie), {
		id: h,
		name: p,
		el: i,
		css: r,
		unload: function() {
			!s || !n.value || (re(), Ce(i.value) && s.head.removeChild(i.value), n.value = !1, i.value = null);
		},
		load: ie,
		isLoaded: ee(n)
	};
}
//#endregion
//#region node_modules/@primevue/core/base/style/index.mjs
function vt(e) {
	"@babel/helpers - typeof";
	return vt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, vt(e);
}
var yt, bt, xt, St;
function Ct(e, t) {
	return Ot(e) || Dt(e, t) || Tt(e, t) || wt();
}
function wt() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Tt(e, t) {
	if (e) {
		if (typeof e == "string") return Et(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Et(e, t) : void 0;
	}
}
function Et(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Dt(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t !== 0) for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function Ot(e) {
	if (Array.isArray(e)) return e;
}
function kt(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function At(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? kt(Object(n), !0).forEach(function(t) {
			jt(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : kt(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function jt(e, t, n) {
	return (t = Mt(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Mt(e) {
	var t = Nt(e, "string");
	return vt(t) == "symbol" ? t : t + "";
}
function Nt(e, t) {
	if (vt(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (vt(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Pt(e, t) {
	return t ||= e.slice(0), Object.freeze(Object.defineProperties(e, { raw: { value: Object.freeze(t) } }));
}
var G = {
	name: "base",
	css: function(e) {
		var t = e.dt;
		return `
.p-hidden-accessible {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    opacity: 0;
    overflow: hidden;
    padding: 0;
    pointer-events: none;
    position: absolute;
    white-space: nowrap;
    width: 1px;
}

.p-overflow-hidden {
    overflow: hidden;
    padding-right: ${t("scrollbar.width")};
}
`;
	},
	style: ct,
	classes: {},
	inlineStyles: {},
	load: function(e) {
		var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = (arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : function(e) {
			return e;
		})(ot(yt ||= Pt(["", ""]), e));
		return j(n) ? _t(pe(n), At({ name: this.name }, t)) : {};
	},
	loadCSS: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		return this.load(this.css, e);
	},
	loadStyle: function() {
		var e = this, t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
		return this.load(this.style, t, function() {
			var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
			return U.transformCSS(t.name || e.name, `${r}${ot(bt ||= Pt(["", ""]), n)}`);
		});
	},
	getCommonTheme: function(e) {
		return U.getCommon(this.name, e);
	},
	getComponentTheme: function(e) {
		return U.getComponent(this.name, e);
	},
	getDirectiveTheme: function(e) {
		return U.getDirective(this.name, e);
	},
	getPresetTheme: function(e, t, n) {
		return U.getCustomPreset(this.name, e, t, n);
	},
	getLayerOrderThemeCSS: function() {
		return U.getLayerOrderCSS(this.name);
	},
	getStyleSheet: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		if (this.css) {
			var n = N(this.css, { dt: V }) || "", r = pe(ot(xt ||= Pt([
				"",
				"",
				""
			]), n, e)), i = Object.entries(t).reduce(function(e, t) {
				var n = Ct(t, 2), r = n[0], i = n[1];
				return e.push(`${r}="${i}"`) && e;
			}, []).join(" ");
			return j(r) ? `<style type="text/css" data-primevue-style-id="${this.name}" ${i}>${r}</style>` : "";
		}
		return "";
	},
	getCommonThemeStyleSheet: function(e) {
		var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		return U.getCommonStyleSheet(this.name, e, t);
	},
	getThemeStyleSheet: function(e) {
		var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = [U.getStyleSheet(this.name, e, t)];
		if (this.style) {
			var r = this.name === "base" ? "global-style" : `${this.name}-style`, i = ot(St ||= Pt(["", ""]), N(this.style, { dt: V })), a = pe(U.transformCSS(r, i)), o = Object.entries(t).reduce(function(e, t) {
				var n = Ct(t, 2), r = n[0], i = n[1];
				return e.push(`${r}="${i}"`) && e;
			}, []).join(" ");
			j(a) && n.push(`<style type="text/css" data-primevue-style-id="${r}" ${o}>${a}</style>`);
		}
		return n.join("");
	},
	extend: function(e) {
		return At(At({}, this), {}, {
			css: void 0,
			style: void 0
		}, e);
	}
}, K = ge();
//#endregion
//#region node_modules/@primevue/core/config/index.mjs
function Ft(e) {
	"@babel/helpers - typeof";
	return Ft = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Ft(e);
}
function It(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Lt(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? It(Object(n), !0).forEach(function(t) {
			Rt(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : It(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Rt(e, t, n) {
	return (t = zt(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function zt(e) {
	var t = Bt(e, "string");
	return Ft(t) == "symbol" ? t : t + "";
}
function Bt(e, t) {
	if (Ft(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (Ft(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Vt = {
	ripple: !1,
	inputStyle: null,
	inputVariant: null,
	locale: {
		startsWith: "Starts with",
		contains: "Contains",
		notContains: "Not contains",
		endsWith: "Ends with",
		equals: "Equals",
		notEquals: "Not equals",
		noFilter: "No Filter",
		lt: "Less than",
		lte: "Less than or equal to",
		gt: "Greater than",
		gte: "Greater than or equal to",
		dateIs: "Date is",
		dateIsNot: "Date is not",
		dateBefore: "Date is before",
		dateAfter: "Date is after",
		clear: "Clear",
		apply: "Apply",
		matchAll: "Match All",
		matchAny: "Match Any",
		addRule: "Add Rule",
		removeRule: "Remove Rule",
		accept: "Yes",
		reject: "No",
		choose: "Choose",
		upload: "Upload",
		cancel: "Cancel",
		completed: "Completed",
		pending: "Pending",
		fileSizeTypes: [
			"B",
			"KB",
			"MB",
			"GB",
			"TB",
			"PB",
			"EB",
			"ZB",
			"YB"
		],
		dayNames: [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday"
		],
		dayNamesShort: [
			"Sun",
			"Mon",
			"Tue",
			"Wed",
			"Thu",
			"Fri",
			"Sat"
		],
		dayNamesMin: [
			"Su",
			"Mo",
			"Tu",
			"We",
			"Th",
			"Fr",
			"Sa"
		],
		monthNames: [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December"
		],
		monthNamesShort: [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		],
		chooseYear: "Choose Year",
		chooseMonth: "Choose Month",
		chooseDate: "Choose Date",
		prevDecade: "Previous Decade",
		nextDecade: "Next Decade",
		prevYear: "Previous Year",
		nextYear: "Next Year",
		prevMonth: "Previous Month",
		nextMonth: "Next Month",
		prevHour: "Previous Hour",
		nextHour: "Next Hour",
		prevMinute: "Previous Minute",
		nextMinute: "Next Minute",
		prevSecond: "Previous Second",
		nextSecond: "Next Second",
		am: "am",
		pm: "pm",
		today: "Today",
		weekHeader: "Wk",
		firstDayOfWeek: 0,
		showMonthAfterYear: !1,
		dateFormat: "mm/dd/yy",
		weak: "Weak",
		medium: "Medium",
		strong: "Strong",
		passwordPrompt: "Enter a password",
		emptyFilterMessage: "No results found",
		searchMessage: "{0} results are available",
		selectionMessage: "{0} items selected",
		emptySelectionMessage: "No selected item",
		emptySearchMessage: "No results found",
		fileChosenMessage: "{0} files",
		noFileChosenMessage: "No file chosen",
		emptyMessage: "No available options",
		aria: {
			trueLabel: "True",
			falseLabel: "False",
			nullLabel: "Not Selected",
			star: "1 star",
			stars: "{star} stars",
			selectAll: "All items selected",
			unselectAll: "All items unselected",
			close: "Close",
			previous: "Previous",
			next: "Next",
			navigation: "Navigation",
			scrollTop: "Scroll Top",
			moveTop: "Move Top",
			moveUp: "Move Up",
			moveDown: "Move Down",
			moveBottom: "Move Bottom",
			moveToTarget: "Move to Target",
			moveToSource: "Move to Source",
			moveAllToTarget: "Move All to Target",
			moveAllToSource: "Move All to Source",
			pageLabel: "Page {page}",
			firstPageLabel: "First Page",
			lastPageLabel: "Last Page",
			nextPageLabel: "Next Page",
			prevPageLabel: "Previous Page",
			rowsPerPageLabel: "Rows per page",
			jumpToPageDropdownLabel: "Jump to Page Dropdown",
			jumpToPageInputLabel: "Jump to Page Input",
			selectRow: "Row Selected",
			unselectRow: "Row Unselected",
			expandRow: "Row Expanded",
			collapseRow: "Row Collapsed",
			showFilterMenu: "Show Filter Menu",
			hideFilterMenu: "Hide Filter Menu",
			filterOperator: "Filter Operator",
			filterConstraint: "Filter Constraint",
			editRow: "Row Edit",
			saveEdit: "Save Edit",
			cancelEdit: "Cancel Edit",
			listView: "List View",
			gridView: "Grid View",
			slide: "Slide",
			slideNumber: "{slideNumber}",
			zoomImage: "Zoom Image",
			zoomIn: "Zoom In",
			zoomOut: "Zoom Out",
			rotateRight: "Rotate Right",
			rotateLeft: "Rotate Left",
			listLabel: "Option List"
		}
	},
	filterMatchModeOptions: {
		text: [
			W.STARTS_WITH,
			W.CONTAINS,
			W.NOT_CONTAINS,
			W.ENDS_WITH,
			W.EQUALS,
			W.NOT_EQUALS
		],
		numeric: [
			W.EQUALS,
			W.NOT_EQUALS,
			W.LESS_THAN,
			W.LESS_THAN_OR_EQUAL_TO,
			W.GREATER_THAN,
			W.GREATER_THAN_OR_EQUAL_TO
		],
		date: [
			W.DATE_IS,
			W.DATE_IS_NOT,
			W.DATE_BEFORE,
			W.DATE_AFTER
		]
	},
	zIndex: {
		modal: 1100,
		overlay: 1e3,
		menu: 1e3,
		tooltip: 1100
	},
	theme: void 0,
	unstyled: !1,
	pt: void 0,
	ptOptions: {
		mergeSections: !0,
		mergeProps: !1
	},
	csp: { nonce: void 0 }
}, Ht = Symbol();
function Ut(e, t) {
	var n = { config: g(t) };
	return e.config.globalProperties.$primevue = n, e.provide(Ht, n), Gt(), Kt(e, n), n;
}
var Wt = [];
function Gt() {
	B.clear(), Wt.forEach(function(e) {
		return e?.();
	}), Wt = [];
}
function Kt(e, t) {
	var n = _(!1), r = function() {
		if (t.config?.theme !== "none" && !U.isStyleNameLoaded("common")) {
			var e, n = G.getCommonTheme?.call(G) || {}, r = n.primitive, i = n.semantic, a = n.global, o = n.style, s = { nonce: (e = t.config) == null || (e = e.csp) == null ? void 0 : e.nonce };
			G.load(r?.css, Lt({ name: "primitive-variables" }, s)), G.load(i?.css, Lt({ name: "semantic-variables" }, s)), G.load(a?.css, Lt({ name: "global-variables" }, s)), G.loadStyle(Lt({ name: "global-style" }, s), o), U.setLoadedStyleName("common");
		}
	};
	B.on("theme:change", function(t) {
		n.value ||= (e.config.globalProperties.$primevue.config.theme = t, !0);
	});
	var i = E(t.config, function(e, t) {
		K.emit("config:change", {
			newValue: e,
			oldValue: t
		});
	}, {
		immediate: !0,
		deep: !0
	}), a = E(function() {
		return t.config.ripple;
	}, function(e, t) {
		K.emit("config:ripple:change", {
			newValue: e,
			oldValue: t
		});
	}, {
		immediate: !0,
		deep: !0
	}), o = E(function() {
		return t.config.theme;
	}, function(e, i) {
		n.value || U.setTheme(e), t.config.unstyled || r(), n.value = !1, K.emit("config:theme:change", {
			newValue: e,
			oldValue: i
		});
	}, {
		immediate: !0,
		deep: !1
	}), s = E(function() {
		return t.config.unstyled;
	}, function(e, n) {
		!e && t.config.theme && r(), K.emit("config:unstyled:change", {
			newValue: e,
			oldValue: n
		});
	}, {
		immediate: !0,
		deep: !0
	});
	Wt.push(i), Wt.push(a), Wt.push(o), Wt.push(s);
}
var qt = { install: function(e, t) {
	Ut(e, fe(Vt, t));
} }, Jt = {
	root: { transitionDuration: "{transition.duration}" },
	panel: {
		borderWidth: "0 0 1px 0",
		borderColor: "{content.border.color}"
	},
	header: {
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		activeColor: "{text.color}",
		activeHoverColor: "{text.color}",
		padding: "1.125rem",
		fontWeight: "600",
		borderRadius: "0",
		borderWidth: "0",
		borderColor: "{content.border.color}",
		background: "{content.background}",
		hoverBackground: "{content.background}",
		activeBackground: "{content.background}",
		activeHoverBackground: "{content.background}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		},
		toggleIcon: {
			color: "{text.muted.color}",
			hoverColor: "{text.color}",
			activeColor: "{text.color}",
			activeHoverColor: "{text.color}"
		},
		first: {
			topBorderRadius: "{content.border.radius}",
			borderWidth: "0"
		},
		last: {
			bottomBorderRadius: "{content.border.radius}",
			activeBottomBorderRadius: "0"
		}
	},
	content: {
		borderWidth: "0",
		borderColor: "{content.border.color}",
		background: "{content.background}",
		color: "{text.color}",
		padding: "0 1.125rem 1.125rem 1.125rem"
	}
}, Yt = {
	root: {
		background: "{form.field.background}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		filledHoverBackground: "{form.field.filled.hover.background}",
		filledFocusBackground: "{form.field.filled.focus.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.focus.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		color: "{form.field.color}",
		disabledColor: "{form.field.disabled.color}",
		placeholderColor: "{form.field.placeholder.color}",
		invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
		shadow: "{form.field.shadow}",
		paddingX: "{form.field.padding.x}",
		paddingY: "{form.field.padding.y}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{form.field.focus.ring.width}",
			style: "{form.field.focus.ring.style}",
			color: "{form.field.focus.ring.color}",
			offset: "{form.field.focus.ring.offset}",
			shadow: "{form.field.focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}"
	},
	overlay: {
		background: "{overlay.select.background}",
		borderColor: "{overlay.select.border.color}",
		borderRadius: "{overlay.select.border.radius}",
		color: "{overlay.select.color}",
		shadow: "{overlay.select.shadow}"
	},
	list: {
		padding: "{list.padding}",
		gap: "{list.gap}"
	},
	option: {
		focusBackground: "{list.option.focus.background}",
		selectedBackground: "{list.option.selected.background}",
		selectedFocusBackground: "{list.option.selected.focus.background}",
		color: "{list.option.color}",
		focusColor: "{list.option.focus.color}",
		selectedColor: "{list.option.selected.color}",
		selectedFocusColor: "{list.option.selected.focus.color}",
		padding: "{list.option.padding}",
		borderRadius: "{list.option.border.radius}"
	},
	optionGroup: {
		background: "{list.option.group.background}",
		color: "{list.option.group.color}",
		fontWeight: "{list.option.group.font.weight}",
		padding: "{list.option.group.padding}"
	},
	dropdown: {
		width: "2.5rem",
		sm: { width: "2rem" },
		lg: { width: "3rem" },
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.border.color}",
		activeBorderColor: "{form.field.border.color}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	chip: { borderRadius: "{border.radius.sm}" },
	emptyMessage: { padding: "{list.option.padding}" },
	colorScheme: {
		light: {
			chip: {
				focusBackground: "{surface.200}",
				focusColor: "{surface.800}"
			},
			dropdown: {
				background: "{surface.100}",
				hoverBackground: "{surface.200}",
				activeBackground: "{surface.300}",
				color: "{surface.600}",
				hoverColor: "{surface.700}",
				activeColor: "{surface.800}"
			}
		},
		dark: {
			chip: {
				focusBackground: "{surface.700}",
				focusColor: "{surface.0}"
			},
			dropdown: {
				background: "{surface.800}",
				hoverBackground: "{surface.700}",
				activeBackground: "{surface.600}",
				color: "{surface.300}",
				hoverColor: "{surface.200}",
				activeColor: "{surface.100}"
			}
		}
	}
}, Xt = {
	root: {
		width: "2rem",
		height: "2rem",
		fontSize: "1rem",
		background: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}"
	},
	icon: { size: "1rem" },
	group: {
		borderColor: "{content.background}",
		offset: "-0.75rem"
	},
	lg: {
		width: "3rem",
		height: "3rem",
		fontSize: "1.5rem",
		icon: { size: "1.5rem" },
		group: { offset: "-1rem" }
	},
	xl: {
		width: "4rem",
		height: "4rem",
		fontSize: "2rem",
		icon: { size: "2rem" },
		group: { offset: "-1.5rem" }
	}
}, Zt = {
	root: {
		borderRadius: "{border.radius.md}",
		padding: "0 0.5rem",
		fontSize: "0.75rem",
		fontWeight: "700",
		minWidth: "1.5rem",
		height: "1.5rem"
	},
	dot: { size: "0.5rem" },
	sm: {
		fontSize: "0.625rem",
		minWidth: "1.25rem",
		height: "1.25rem"
	},
	lg: {
		fontSize: "0.875rem",
		minWidth: "1.75rem",
		height: "1.75rem"
	},
	xl: {
		fontSize: "1rem",
		minWidth: "2rem",
		height: "2rem"
	},
	colorScheme: {
		light: {
			primary: {
				background: "{primary.color}",
				color: "{primary.contrast.color}"
			},
			secondary: {
				background: "{surface.100}",
				color: "{surface.600}"
			},
			success: {
				background: "{green.500}",
				color: "{surface.0}"
			},
			info: {
				background: "{sky.500}",
				color: "{surface.0}"
			},
			warn: {
				background: "{orange.500}",
				color: "{surface.0}"
			},
			danger: {
				background: "{red.500}",
				color: "{surface.0}"
			},
			contrast: {
				background: "{surface.950}",
				color: "{surface.0}"
			}
		},
		dark: {
			primary: {
				background: "{primary.color}",
				color: "{primary.contrast.color}"
			},
			secondary: {
				background: "{surface.800}",
				color: "{surface.300}"
			},
			success: {
				background: "{green.400}",
				color: "{green.950}"
			},
			info: {
				background: "{sky.400}",
				color: "{sky.950}"
			},
			warn: {
				background: "{orange.400}",
				color: "{orange.950}"
			},
			danger: {
				background: "{red.400}",
				color: "{red.950}"
			},
			contrast: {
				background: "{surface.0}",
				color: "{surface.950}"
			}
		}
	}
}, Qt = {
	primitive: {
		borderRadius: {
			none: "0",
			xs: "2px",
			sm: "4px",
			md: "6px",
			lg: "8px",
			xl: "12px"
		},
		emerald: {
			50: "#ecfdf5",
			100: "#d1fae5",
			200: "#a7f3d0",
			300: "#6ee7b7",
			400: "#34d399",
			500: "#10b981",
			600: "#059669",
			700: "#047857",
			800: "#065f46",
			900: "#064e3b",
			950: "#022c22"
		},
		green: {
			50: "#f0fdf4",
			100: "#dcfce7",
			200: "#bbf7d0",
			300: "#86efac",
			400: "#4ade80",
			500: "#22c55e",
			600: "#16a34a",
			700: "#15803d",
			800: "#166534",
			900: "#14532d",
			950: "#052e16"
		},
		lime: {
			50: "#f7fee7",
			100: "#ecfccb",
			200: "#d9f99d",
			300: "#bef264",
			400: "#a3e635",
			500: "#84cc16",
			600: "#65a30d",
			700: "#4d7c0f",
			800: "#3f6212",
			900: "#365314",
			950: "#1a2e05"
		},
		red: {
			50: "#fef2f2",
			100: "#fee2e2",
			200: "#fecaca",
			300: "#fca5a5",
			400: "#f87171",
			500: "#ef4444",
			600: "#dc2626",
			700: "#b91c1c",
			800: "#991b1b",
			900: "#7f1d1d",
			950: "#450a0a"
		},
		orange: {
			50: "#fff7ed",
			100: "#ffedd5",
			200: "#fed7aa",
			300: "#fdba74",
			400: "#fb923c",
			500: "#f97316",
			600: "#ea580c",
			700: "#c2410c",
			800: "#9a3412",
			900: "#7c2d12",
			950: "#431407"
		},
		amber: {
			50: "#fffbeb",
			100: "#fef3c7",
			200: "#fde68a",
			300: "#fcd34d",
			400: "#fbbf24",
			500: "#f59e0b",
			600: "#d97706",
			700: "#b45309",
			800: "#92400e",
			900: "#78350f",
			950: "#451a03"
		},
		yellow: {
			50: "#fefce8",
			100: "#fef9c3",
			200: "#fef08a",
			300: "#fde047",
			400: "#facc15",
			500: "#eab308",
			600: "#ca8a04",
			700: "#a16207",
			800: "#854d0e",
			900: "#713f12",
			950: "#422006"
		},
		teal: {
			50: "#f0fdfa",
			100: "#ccfbf1",
			200: "#99f6e4",
			300: "#5eead4",
			400: "#2dd4bf",
			500: "#14b8a6",
			600: "#0d9488",
			700: "#0f766e",
			800: "#115e59",
			900: "#134e4a",
			950: "#042f2e"
		},
		cyan: {
			50: "#ecfeff",
			100: "#cffafe",
			200: "#a5f3fc",
			300: "#67e8f9",
			400: "#22d3ee",
			500: "#06b6d4",
			600: "#0891b2",
			700: "#0e7490",
			800: "#155e75",
			900: "#164e63",
			950: "#083344"
		},
		sky: {
			50: "#f0f9ff",
			100: "#e0f2fe",
			200: "#bae6fd",
			300: "#7dd3fc",
			400: "#38bdf8",
			500: "#0ea5e9",
			600: "#0284c7",
			700: "#0369a1",
			800: "#075985",
			900: "#0c4a6e",
			950: "#082f49"
		},
		blue: {
			50: "#eff6ff",
			100: "#dbeafe",
			200: "#bfdbfe",
			300: "#93c5fd",
			400: "#60a5fa",
			500: "#3b82f6",
			600: "#2563eb",
			700: "#1d4ed8",
			800: "#1e40af",
			900: "#1e3a8a",
			950: "#172554"
		},
		indigo: {
			50: "#eef2ff",
			100: "#e0e7ff",
			200: "#c7d2fe",
			300: "#a5b4fc",
			400: "#818cf8",
			500: "#6366f1",
			600: "#4f46e5",
			700: "#4338ca",
			800: "#3730a3",
			900: "#312e81",
			950: "#1e1b4b"
		},
		violet: {
			50: "#f5f3ff",
			100: "#ede9fe",
			200: "#ddd6fe",
			300: "#c4b5fd",
			400: "#a78bfa",
			500: "#8b5cf6",
			600: "#7c3aed",
			700: "#6d28d9",
			800: "#5b21b6",
			900: "#4c1d95",
			950: "#2e1065"
		},
		purple: {
			50: "#faf5ff",
			100: "#f3e8ff",
			200: "#e9d5ff",
			300: "#d8b4fe",
			400: "#c084fc",
			500: "#a855f7",
			600: "#9333ea",
			700: "#7e22ce",
			800: "#6b21a8",
			900: "#581c87",
			950: "#3b0764"
		},
		fuchsia: {
			50: "#fdf4ff",
			100: "#fae8ff",
			200: "#f5d0fe",
			300: "#f0abfc",
			400: "#e879f9",
			500: "#d946ef",
			600: "#c026d3",
			700: "#a21caf",
			800: "#86198f",
			900: "#701a75",
			950: "#4a044e"
		},
		pink: {
			50: "#fdf2f8",
			100: "#fce7f3",
			200: "#fbcfe8",
			300: "#f9a8d4",
			400: "#f472b6",
			500: "#ec4899",
			600: "#db2777",
			700: "#be185d",
			800: "#9d174d",
			900: "#831843",
			950: "#500724"
		},
		rose: {
			50: "#fff1f2",
			100: "#ffe4e6",
			200: "#fecdd3",
			300: "#fda4af",
			400: "#fb7185",
			500: "#f43f5e",
			600: "#e11d48",
			700: "#be123c",
			800: "#9f1239",
			900: "#881337",
			950: "#4c0519"
		},
		slate: {
			50: "#f8fafc",
			100: "#f1f5f9",
			200: "#e2e8f0",
			300: "#cbd5e1",
			400: "#94a3b8",
			500: "#64748b",
			600: "#475569",
			700: "#334155",
			800: "#1e293b",
			900: "#0f172a",
			950: "#020617"
		},
		gray: {
			50: "#f9fafb",
			100: "#f3f4f6",
			200: "#e5e7eb",
			300: "#d1d5db",
			400: "#9ca3af",
			500: "#6b7280",
			600: "#4b5563",
			700: "#374151",
			800: "#1f2937",
			900: "#111827",
			950: "#030712"
		},
		zinc: {
			50: "#fafafa",
			100: "#f4f4f5",
			200: "#e4e4e7",
			300: "#d4d4d8",
			400: "#a1a1aa",
			500: "#71717a",
			600: "#52525b",
			700: "#3f3f46",
			800: "#27272a",
			900: "#18181b",
			950: "#09090b"
		},
		neutral: {
			50: "#fafafa",
			100: "#f5f5f5",
			200: "#e5e5e5",
			300: "#d4d4d4",
			400: "#a3a3a3",
			500: "#737373",
			600: "#525252",
			700: "#404040",
			800: "#262626",
			900: "#171717",
			950: "#0a0a0a"
		},
		stone: {
			50: "#fafaf9",
			100: "#f5f5f4",
			200: "#e7e5e4",
			300: "#d6d3d1",
			400: "#a8a29e",
			500: "#78716c",
			600: "#57534e",
			700: "#44403c",
			800: "#292524",
			900: "#1c1917",
			950: "#0c0a09"
		}
	},
	semantic: {
		transitionDuration: "0.2s",
		focusRing: {
			width: "1px",
			style: "solid",
			color: "{primary.color}",
			offset: "2px",
			shadow: "none"
		},
		disabledOpacity: "0.6",
		iconSize: "1rem",
		anchorGutter: "2px",
		primary: {
			50: "{emerald.50}",
			100: "{emerald.100}",
			200: "{emerald.200}",
			300: "{emerald.300}",
			400: "{emerald.400}",
			500: "{emerald.500}",
			600: "{emerald.600}",
			700: "{emerald.700}",
			800: "{emerald.800}",
			900: "{emerald.900}",
			950: "{emerald.950}"
		},
		formField: {
			paddingX: "0.75rem",
			paddingY: "0.5rem",
			sm: {
				fontSize: "0.875rem",
				paddingX: "0.625rem",
				paddingY: "0.375rem"
			},
			lg: {
				fontSize: "1.125rem",
				paddingX: "0.875rem",
				paddingY: "0.625rem"
			},
			borderRadius: "{border.radius.md}",
			focusRing: {
				width: "0",
				style: "none",
				color: "transparent",
				offset: "0",
				shadow: "none"
			},
			transitionDuration: "{transition.duration}"
		},
		list: {
			padding: "0.25rem 0.25rem",
			gap: "2px",
			header: { padding: "0.5rem 1rem 0.25rem 1rem" },
			option: {
				padding: "0.5rem 0.75rem",
				borderRadius: "{border.radius.sm}"
			},
			optionGroup: {
				padding: "0.5rem 0.75rem",
				fontWeight: "600"
			}
		},
		content: { borderRadius: "{border.radius.md}" },
		mask: { transitionDuration: "0.3s" },
		navigation: {
			list: {
				padding: "0.25rem 0.25rem",
				gap: "2px"
			},
			item: {
				padding: "0.5rem 0.75rem",
				borderRadius: "{border.radius.sm}",
				gap: "0.5rem"
			},
			submenuLabel: {
				padding: "0.5rem 0.75rem",
				fontWeight: "600"
			},
			submenuIcon: { size: "0.875rem" }
		},
		overlay: {
			select: {
				borderRadius: "{border.radius.md}",
				shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
			},
			popover: {
				borderRadius: "{border.radius.md}",
				padding: "0.75rem",
				shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
			},
			modal: {
				borderRadius: "{border.radius.xl}",
				padding: "1.25rem",
				shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
			},
			navigation: { shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)" }
		},
		colorScheme: {
			light: {
				surface: {
					0: "#ffffff",
					50: "{slate.50}",
					100: "{slate.100}",
					200: "{slate.200}",
					300: "{slate.300}",
					400: "{slate.400}",
					500: "{slate.500}",
					600: "{slate.600}",
					700: "{slate.700}",
					800: "{slate.800}",
					900: "{slate.900}",
					950: "{slate.950}"
				},
				primary: {
					color: "{primary.500}",
					contrastColor: "#ffffff",
					hoverColor: "{primary.600}",
					activeColor: "{primary.700}"
				},
				highlight: {
					background: "{primary.50}",
					focusBackground: "{primary.100}",
					color: "{primary.700}",
					focusColor: "{primary.800}"
				},
				mask: {
					background: "rgba(0,0,0,0.4)",
					color: "{surface.200}"
				},
				formField: {
					background: "{surface.0}",
					disabledBackground: "{surface.200}",
					filledBackground: "{surface.50}",
					filledHoverBackground: "{surface.50}",
					filledFocusBackground: "{surface.50}",
					borderColor: "{surface.300}",
					hoverBorderColor: "{surface.400}",
					focusBorderColor: "{primary.color}",
					invalidBorderColor: "{red.400}",
					color: "{surface.700}",
					disabledColor: "{surface.500}",
					placeholderColor: "{surface.500}",
					invalidPlaceholderColor: "{red.600}",
					floatLabelColor: "{surface.500}",
					floatLabelFocusColor: "{primary.600}",
					floatLabelActiveColor: "{surface.500}",
					floatLabelInvalidColor: "{form.field.invalid.placeholder.color}",
					iconColor: "{surface.400}",
					shadow: "0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05)"
				},
				text: {
					color: "{surface.700}",
					hoverColor: "{surface.800}",
					mutedColor: "{surface.500}",
					hoverMutedColor: "{surface.600}"
				},
				content: {
					background: "{surface.0}",
					hoverBackground: "{surface.100}",
					borderColor: "{surface.200}",
					color: "{text.color}",
					hoverColor: "{text.hover.color}"
				},
				overlay: {
					select: {
						background: "{surface.0}",
						borderColor: "{surface.200}",
						color: "{text.color}"
					},
					popover: {
						background: "{surface.0}",
						borderColor: "{surface.200}",
						color: "{text.color}"
					},
					modal: {
						background: "{surface.0}",
						borderColor: "{surface.200}",
						color: "{text.color}"
					}
				},
				list: {
					option: {
						focusBackground: "{surface.100}",
						selectedBackground: "{highlight.background}",
						selectedFocusBackground: "{highlight.focus.background}",
						color: "{text.color}",
						focusColor: "{text.hover.color}",
						selectedColor: "{highlight.color}",
						selectedFocusColor: "{highlight.focus.color}",
						icon: {
							color: "{surface.400}",
							focusColor: "{surface.500}"
						}
					},
					optionGroup: {
						background: "transparent",
						color: "{text.muted.color}"
					}
				},
				navigation: {
					item: {
						focusBackground: "{surface.100}",
						activeBackground: "{surface.100}",
						color: "{text.color}",
						focusColor: "{text.hover.color}",
						activeColor: "{text.hover.color}",
						icon: {
							color: "{surface.400}",
							focusColor: "{surface.500}",
							activeColor: "{surface.500}"
						}
					},
					submenuLabel: {
						background: "transparent",
						color: "{text.muted.color}"
					},
					submenuIcon: {
						color: "{surface.400}",
						focusColor: "{surface.500}",
						activeColor: "{surface.500}"
					}
				}
			},
			dark: {
				surface: {
					0: "#ffffff",
					50: "{zinc.50}",
					100: "{zinc.100}",
					200: "{zinc.200}",
					300: "{zinc.300}",
					400: "{zinc.400}",
					500: "{zinc.500}",
					600: "{zinc.600}",
					700: "{zinc.700}",
					800: "{zinc.800}",
					900: "{zinc.900}",
					950: "{zinc.950}"
				},
				primary: {
					color: "{primary.400}",
					contrastColor: "{surface.900}",
					hoverColor: "{primary.300}",
					activeColor: "{primary.200}"
				},
				highlight: {
					background: "color-mix(in srgb, {primary.400}, transparent 84%)",
					focusBackground: "color-mix(in srgb, {primary.400}, transparent 76%)",
					color: "rgba(255,255,255,.87)",
					focusColor: "rgba(255,255,255,.87)"
				},
				mask: {
					background: "rgba(0,0,0,0.6)",
					color: "{surface.200}"
				},
				formField: {
					background: "{surface.950}",
					disabledBackground: "{surface.700}",
					filledBackground: "{surface.800}",
					filledHoverBackground: "{surface.800}",
					filledFocusBackground: "{surface.800}",
					borderColor: "{surface.600}",
					hoverBorderColor: "{surface.500}",
					focusBorderColor: "{primary.color}",
					invalidBorderColor: "{red.300}",
					color: "{surface.0}",
					disabledColor: "{surface.400}",
					placeholderColor: "{surface.400}",
					invalidPlaceholderColor: "{red.400}",
					floatLabelColor: "{surface.400}",
					floatLabelFocusColor: "{primary.color}",
					floatLabelActiveColor: "{surface.400}",
					floatLabelInvalidColor: "{form.field.invalid.placeholder.color}",
					iconColor: "{surface.400}",
					shadow: "0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05)"
				},
				text: {
					color: "{surface.0}",
					hoverColor: "{surface.0}",
					mutedColor: "{surface.400}",
					hoverMutedColor: "{surface.300}"
				},
				content: {
					background: "{surface.900}",
					hoverBackground: "{surface.800}",
					borderColor: "{surface.700}",
					color: "{text.color}",
					hoverColor: "{text.hover.color}"
				},
				overlay: {
					select: {
						background: "{surface.900}",
						borderColor: "{surface.700}",
						color: "{text.color}"
					},
					popover: {
						background: "{surface.900}",
						borderColor: "{surface.700}",
						color: "{text.color}"
					},
					modal: {
						background: "{surface.900}",
						borderColor: "{surface.700}",
						color: "{text.color}"
					}
				},
				list: {
					option: {
						focusBackground: "{surface.800}",
						selectedBackground: "{highlight.background}",
						selectedFocusBackground: "{highlight.focus.background}",
						color: "{text.color}",
						focusColor: "{text.hover.color}",
						selectedColor: "{highlight.color}",
						selectedFocusColor: "{highlight.focus.color}",
						icon: {
							color: "{surface.500}",
							focusColor: "{surface.400}"
						}
					},
					optionGroup: {
						background: "transparent",
						color: "{text.muted.color}"
					}
				},
				navigation: {
					item: {
						focusBackground: "{surface.800}",
						activeBackground: "{surface.800}",
						color: "{text.color}",
						focusColor: "{text.hover.color}",
						activeColor: "{text.hover.color}",
						icon: {
							color: "{surface.500}",
							focusColor: "{surface.400}",
							activeColor: "{surface.400}"
						}
					},
					submenuLabel: {
						background: "transparent",
						color: "{text.muted.color}"
					},
					submenuIcon: {
						color: "{surface.500}",
						focusColor: "{surface.400}",
						activeColor: "{surface.400}"
					}
				}
			}
		}
	}
}, $t = { root: { borderRadius: "{content.border.radius}" } }, en = {
	root: {
		padding: "1rem",
		background: "{content.background}",
		gap: "0.5rem",
		transitionDuration: "{transition.duration}"
	},
	item: {
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		borderRadius: "{content.border.radius}",
		gap: "{navigation.item.gap}",
		icon: {
			color: "{navigation.item.icon.color}",
			hoverColor: "{navigation.item.icon.focus.color}"
		},
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	separator: { color: "{navigation.item.icon.color}" }
}, tn = {
	root: {
		borderRadius: "{form.field.border.radius}",
		roundedBorderRadius: "2rem",
		gap: "0.5rem",
		paddingX: "{form.field.padding.x}",
		paddingY: "{form.field.padding.y}",
		iconOnlyWidth: "2.5rem",
		sm: {
			fontSize: "{form.field.sm.font.size}",
			paddingX: "{form.field.sm.padding.x}",
			paddingY: "{form.field.sm.padding.y}",
			iconOnlyWidth: "2rem"
		},
		lg: {
			fontSize: "{form.field.lg.font.size}",
			paddingX: "{form.field.lg.padding.x}",
			paddingY: "{form.field.lg.padding.y}",
			iconOnlyWidth: "3rem"
		},
		label: { fontWeight: "500" },
		raisedShadow: "0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			offset: "{focus.ring.offset}"
		},
		badgeSize: "1rem",
		transitionDuration: "{form.field.transition.duration}"
	},
	colorScheme: {
		light: {
			root: {
				primary: {
					background: "{primary.color}",
					hoverBackground: "{primary.hover.color}",
					activeBackground: "{primary.active.color}",
					borderColor: "{primary.color}",
					hoverBorderColor: "{primary.hover.color}",
					activeBorderColor: "{primary.active.color}",
					color: "{primary.contrast.color}",
					hoverColor: "{primary.contrast.color}",
					activeColor: "{primary.contrast.color}",
					focusRing: {
						color: "{primary.color}",
						shadow: "none"
					}
				},
				secondary: {
					background: "{surface.100}",
					hoverBackground: "{surface.200}",
					activeBackground: "{surface.300}",
					borderColor: "{surface.100}",
					hoverBorderColor: "{surface.200}",
					activeBorderColor: "{surface.300}",
					color: "{surface.600}",
					hoverColor: "{surface.700}",
					activeColor: "{surface.800}",
					focusRing: {
						color: "{surface.600}",
						shadow: "none"
					}
				},
				info: {
					background: "{sky.500}",
					hoverBackground: "{sky.600}",
					activeBackground: "{sky.700}",
					borderColor: "{sky.500}",
					hoverBorderColor: "{sky.600}",
					activeBorderColor: "{sky.700}",
					color: "#ffffff",
					hoverColor: "#ffffff",
					activeColor: "#ffffff",
					focusRing: {
						color: "{sky.500}",
						shadow: "none"
					}
				},
				success: {
					background: "{green.500}",
					hoverBackground: "{green.600}",
					activeBackground: "{green.700}",
					borderColor: "{green.500}",
					hoverBorderColor: "{green.600}",
					activeBorderColor: "{green.700}",
					color: "#ffffff",
					hoverColor: "#ffffff",
					activeColor: "#ffffff",
					focusRing: {
						color: "{green.500}",
						shadow: "none"
					}
				},
				warn: {
					background: "{orange.500}",
					hoverBackground: "{orange.600}",
					activeBackground: "{orange.700}",
					borderColor: "{orange.500}",
					hoverBorderColor: "{orange.600}",
					activeBorderColor: "{orange.700}",
					color: "#ffffff",
					hoverColor: "#ffffff",
					activeColor: "#ffffff",
					focusRing: {
						color: "{orange.500}",
						shadow: "none"
					}
				},
				help: {
					background: "{purple.500}",
					hoverBackground: "{purple.600}",
					activeBackground: "{purple.700}",
					borderColor: "{purple.500}",
					hoverBorderColor: "{purple.600}",
					activeBorderColor: "{purple.700}",
					color: "#ffffff",
					hoverColor: "#ffffff",
					activeColor: "#ffffff",
					focusRing: {
						color: "{purple.500}",
						shadow: "none"
					}
				},
				danger: {
					background: "{red.500}",
					hoverBackground: "{red.600}",
					activeBackground: "{red.700}",
					borderColor: "{red.500}",
					hoverBorderColor: "{red.600}",
					activeBorderColor: "{red.700}",
					color: "#ffffff",
					hoverColor: "#ffffff",
					activeColor: "#ffffff",
					focusRing: {
						color: "{red.500}",
						shadow: "none"
					}
				},
				contrast: {
					background: "{surface.950}",
					hoverBackground: "{surface.900}",
					activeBackground: "{surface.800}",
					borderColor: "{surface.950}",
					hoverBorderColor: "{surface.900}",
					activeBorderColor: "{surface.800}",
					color: "{surface.0}",
					hoverColor: "{surface.0}",
					activeColor: "{surface.0}",
					focusRing: {
						color: "{surface.950}",
						shadow: "none"
					}
				}
			},
			outlined: {
				primary: {
					hoverBackground: "{primary.50}",
					activeBackground: "{primary.100}",
					borderColor: "{primary.200}",
					color: "{primary.color}"
				},
				secondary: {
					hoverBackground: "{surface.50}",
					activeBackground: "{surface.100}",
					borderColor: "{surface.200}",
					color: "{surface.500}"
				},
				success: {
					hoverBackground: "{green.50}",
					activeBackground: "{green.100}",
					borderColor: "{green.200}",
					color: "{green.500}"
				},
				info: {
					hoverBackground: "{sky.50}",
					activeBackground: "{sky.100}",
					borderColor: "{sky.200}",
					color: "{sky.500}"
				},
				warn: {
					hoverBackground: "{orange.50}",
					activeBackground: "{orange.100}",
					borderColor: "{orange.200}",
					color: "{orange.500}"
				},
				help: {
					hoverBackground: "{purple.50}",
					activeBackground: "{purple.100}",
					borderColor: "{purple.200}",
					color: "{purple.500}"
				},
				danger: {
					hoverBackground: "{red.50}",
					activeBackground: "{red.100}",
					borderColor: "{red.200}",
					color: "{red.500}"
				},
				contrast: {
					hoverBackground: "{surface.50}",
					activeBackground: "{surface.100}",
					borderColor: "{surface.700}",
					color: "{surface.950}"
				},
				plain: {
					hoverBackground: "{surface.50}",
					activeBackground: "{surface.100}",
					borderColor: "{surface.200}",
					color: "{surface.700}"
				}
			},
			text: {
				primary: {
					hoverBackground: "{primary.50}",
					activeBackground: "{primary.100}",
					color: "{primary.color}"
				},
				secondary: {
					hoverBackground: "{surface.50}",
					activeBackground: "{surface.100}",
					color: "{surface.500}"
				},
				success: {
					hoverBackground: "{green.50}",
					activeBackground: "{green.100}",
					color: "{green.500}"
				},
				info: {
					hoverBackground: "{sky.50}",
					activeBackground: "{sky.100}",
					color: "{sky.500}"
				},
				warn: {
					hoverBackground: "{orange.50}",
					activeBackground: "{orange.100}",
					color: "{orange.500}"
				},
				help: {
					hoverBackground: "{purple.50}",
					activeBackground: "{purple.100}",
					color: "{purple.500}"
				},
				danger: {
					hoverBackground: "{red.50}",
					activeBackground: "{red.100}",
					color: "{red.500}"
				},
				contrast: {
					hoverBackground: "{surface.50}",
					activeBackground: "{surface.100}",
					color: "{surface.950}"
				},
				plain: {
					hoverBackground: "{surface.50}",
					activeBackground: "{surface.100}",
					color: "{surface.700}"
				}
			},
			link: {
				color: "{primary.color}",
				hoverColor: "{primary.color}",
				activeColor: "{primary.color}"
			}
		},
		dark: {
			root: {
				primary: {
					background: "{primary.color}",
					hoverBackground: "{primary.hover.color}",
					activeBackground: "{primary.active.color}",
					borderColor: "{primary.color}",
					hoverBorderColor: "{primary.hover.color}",
					activeBorderColor: "{primary.active.color}",
					color: "{primary.contrast.color}",
					hoverColor: "{primary.contrast.color}",
					activeColor: "{primary.contrast.color}",
					focusRing: {
						color: "{primary.color}",
						shadow: "none"
					}
				},
				secondary: {
					background: "{surface.800}",
					hoverBackground: "{surface.700}",
					activeBackground: "{surface.600}",
					borderColor: "{surface.800}",
					hoverBorderColor: "{surface.700}",
					activeBorderColor: "{surface.600}",
					color: "{surface.300}",
					hoverColor: "{surface.200}",
					activeColor: "{surface.100}",
					focusRing: {
						color: "{surface.300}",
						shadow: "none"
					}
				},
				info: {
					background: "{sky.400}",
					hoverBackground: "{sky.300}",
					activeBackground: "{sky.200}",
					borderColor: "{sky.400}",
					hoverBorderColor: "{sky.300}",
					activeBorderColor: "{sky.200}",
					color: "{sky.950}",
					hoverColor: "{sky.950}",
					activeColor: "{sky.950}",
					focusRing: {
						color: "{sky.400}",
						shadow: "none"
					}
				},
				success: {
					background: "{green.400}",
					hoverBackground: "{green.300}",
					activeBackground: "{green.200}",
					borderColor: "{green.400}",
					hoverBorderColor: "{green.300}",
					activeBorderColor: "{green.200}",
					color: "{green.950}",
					hoverColor: "{green.950}",
					activeColor: "{green.950}",
					focusRing: {
						color: "{green.400}",
						shadow: "none"
					}
				},
				warn: {
					background: "{orange.400}",
					hoverBackground: "{orange.300}",
					activeBackground: "{orange.200}",
					borderColor: "{orange.400}",
					hoverBorderColor: "{orange.300}",
					activeBorderColor: "{orange.200}",
					color: "{orange.950}",
					hoverColor: "{orange.950}",
					activeColor: "{orange.950}",
					focusRing: {
						color: "{orange.400}",
						shadow: "none"
					}
				},
				help: {
					background: "{purple.400}",
					hoverBackground: "{purple.300}",
					activeBackground: "{purple.200}",
					borderColor: "{purple.400}",
					hoverBorderColor: "{purple.300}",
					activeBorderColor: "{purple.200}",
					color: "{purple.950}",
					hoverColor: "{purple.950}",
					activeColor: "{purple.950}",
					focusRing: {
						color: "{purple.400}",
						shadow: "none"
					}
				},
				danger: {
					background: "{red.400}",
					hoverBackground: "{red.300}",
					activeBackground: "{red.200}",
					borderColor: "{red.400}",
					hoverBorderColor: "{red.300}",
					activeBorderColor: "{red.200}",
					color: "{red.950}",
					hoverColor: "{red.950}",
					activeColor: "{red.950}",
					focusRing: {
						color: "{red.400}",
						shadow: "none"
					}
				},
				contrast: {
					background: "{surface.0}",
					hoverBackground: "{surface.100}",
					activeBackground: "{surface.200}",
					borderColor: "{surface.0}",
					hoverBorderColor: "{surface.100}",
					activeBorderColor: "{surface.200}",
					color: "{surface.950}",
					hoverColor: "{surface.950}",
					activeColor: "{surface.950}",
					focusRing: {
						color: "{surface.0}",
						shadow: "none"
					}
				}
			},
			outlined: {
				primary: {
					hoverBackground: "color-mix(in srgb, {primary.color}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {primary.color}, transparent 84%)",
					borderColor: "{primary.700}",
					color: "{primary.color}"
				},
				secondary: {
					hoverBackground: "rgba(255,255,255,0.04)",
					activeBackground: "rgba(255,255,255,0.16)",
					borderColor: "{surface.700}",
					color: "{surface.400}"
				},
				success: {
					hoverBackground: "color-mix(in srgb, {green.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {green.400}, transparent 84%)",
					borderColor: "{green.700}",
					color: "{green.400}"
				},
				info: {
					hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)",
					borderColor: "{sky.700}",
					color: "{sky.400}"
				},
				warn: {
					hoverBackground: "color-mix(in srgb, {orange.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {orange.400}, transparent 84%)",
					borderColor: "{orange.700}",
					color: "{orange.400}"
				},
				help: {
					hoverBackground: "color-mix(in srgb, {purple.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {purple.400}, transparent 84%)",
					borderColor: "{purple.700}",
					color: "{purple.400}"
				},
				danger: {
					hoverBackground: "color-mix(in srgb, {red.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {red.400}, transparent 84%)",
					borderColor: "{red.700}",
					color: "{red.400}"
				},
				contrast: {
					hoverBackground: "{surface.800}",
					activeBackground: "{surface.700}",
					borderColor: "{surface.500}",
					color: "{surface.0}"
				},
				plain: {
					hoverBackground: "{surface.800}",
					activeBackground: "{surface.700}",
					borderColor: "{surface.600}",
					color: "{surface.0}"
				}
			},
			text: {
				primary: {
					hoverBackground: "color-mix(in srgb, {primary.color}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {primary.color}, transparent 84%)",
					color: "{primary.color}"
				},
				secondary: {
					hoverBackground: "{surface.800}",
					activeBackground: "{surface.700}",
					color: "{surface.400}"
				},
				success: {
					hoverBackground: "color-mix(in srgb, {green.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {green.400}, transparent 84%)",
					color: "{green.400}"
				},
				info: {
					hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)",
					color: "{sky.400}"
				},
				warn: {
					hoverBackground: "color-mix(in srgb, {orange.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {orange.400}, transparent 84%)",
					color: "{orange.400}"
				},
				help: {
					hoverBackground: "color-mix(in srgb, {purple.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {purple.400}, transparent 84%)",
					color: "{purple.400}"
				},
				danger: {
					hoverBackground: "color-mix(in srgb, {red.400}, transparent 96%)",
					activeBackground: "color-mix(in srgb, {red.400}, transparent 84%)",
					color: "{red.400}"
				},
				contrast: {
					hoverBackground: "{surface.800}",
					activeBackground: "{surface.700}",
					color: "{surface.0}"
				},
				plain: {
					hoverBackground: "{surface.800}",
					activeBackground: "{surface.700}",
					color: "{surface.0}"
				}
			},
			link: {
				color: "{primary.color}",
				hoverColor: "{primary.color}",
				activeColor: "{primary.color}"
			}
		}
	}
}, nn = {
	root: {
		background: "{content.background}",
		borderRadius: "{border.radius.xl}",
		color: "{content.color}",
		shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
	},
	body: {
		padding: "1.25rem",
		gap: "0.5rem"
	},
	caption: { gap: "0.5rem" },
	title: {
		fontSize: "1.25rem",
		fontWeight: "500"
	},
	subtitle: { color: "{text.muted.color}" }
}, rn = {
	root: { transitionDuration: "{transition.duration}" },
	content: { gap: "0.25rem" },
	indicatorList: {
		padding: "1rem",
		gap: "0.5rem"
	},
	indicator: {
		width: "2rem",
		height: "0.5rem",
		borderRadius: "{content.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	colorScheme: {
		light: { indicator: {
			background: "{surface.200}",
			hoverBackground: "{surface.300}",
			activeBackground: "{primary.color}"
		} },
		dark: { indicator: {
			background: "{surface.700}",
			hoverBackground: "{surface.600}",
			activeBackground: "{primary.color}"
		} }
	}
}, an = {
	root: {
		background: "{form.field.background}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		filledHoverBackground: "{form.field.filled.hover.background}",
		filledFocusBackground: "{form.field.filled.focus.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.focus.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		color: "{form.field.color}",
		disabledColor: "{form.field.disabled.color}",
		placeholderColor: "{form.field.placeholder.color}",
		invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
		shadow: "{form.field.shadow}",
		paddingX: "{form.field.padding.x}",
		paddingY: "{form.field.padding.y}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{form.field.focus.ring.width}",
			style: "{form.field.focus.ring.style}",
			color: "{form.field.focus.ring.color}",
			offset: "{form.field.focus.ring.offset}",
			shadow: "{form.field.focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}",
		sm: {
			fontSize: "{form.field.sm.font.size}",
			paddingX: "{form.field.sm.padding.x}",
			paddingY: "{form.field.sm.padding.y}"
		},
		lg: {
			fontSize: "{form.field.lg.font.size}",
			paddingX: "{form.field.lg.padding.x}",
			paddingY: "{form.field.lg.padding.y}"
		}
	},
	dropdown: {
		width: "2.5rem",
		color: "{form.field.icon.color}"
	},
	overlay: {
		background: "{overlay.select.background}",
		borderColor: "{overlay.select.border.color}",
		borderRadius: "{overlay.select.border.radius}",
		color: "{overlay.select.color}",
		shadow: "{overlay.select.shadow}"
	},
	list: {
		padding: "{list.padding}",
		gap: "{list.gap}",
		mobileIndent: "1rem"
	},
	option: {
		focusBackground: "{list.option.focus.background}",
		selectedBackground: "{list.option.selected.background}",
		selectedFocusBackground: "{list.option.selected.focus.background}",
		color: "{list.option.color}",
		focusColor: "{list.option.focus.color}",
		selectedColor: "{list.option.selected.color}",
		selectedFocusColor: "{list.option.selected.focus.color}",
		padding: "{list.option.padding}",
		borderRadius: "{list.option.border.radius}",
		icon: {
			color: "{list.option.icon.color}",
			focusColor: "{list.option.icon.focus.color}",
			size: "0.875rem"
		}
	},
	clearIcon: { color: "{form.field.icon.color}" }
}, on = {
	root: {
		borderRadius: "{border.radius.sm}",
		width: "1.25rem",
		height: "1.25rem",
		background: "{form.field.background}",
		checkedBackground: "{primary.color}",
		checkedHoverBackground: "{primary.hover.color}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.border.color}",
		checkedBorderColor: "{primary.color}",
		checkedHoverBorderColor: "{primary.hover.color}",
		checkedFocusBorderColor: "{primary.color}",
		checkedDisabledBorderColor: "{form.field.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		shadow: "{form.field.shadow}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}",
		sm: {
			width: "1rem",
			height: "1rem"
		},
		lg: {
			width: "1.5rem",
			height: "1.5rem"
		}
	},
	icon: {
		size: "0.875rem",
		color: "{form.field.color}",
		checkedColor: "{primary.contrast.color}",
		checkedHoverColor: "{primary.contrast.color}",
		disabledColor: "{form.field.disabled.color}",
		sm: { size: "0.75rem" },
		lg: { size: "1rem" }
	}
}, sn = {
	root: {
		borderRadius: "16px",
		paddingX: "0.75rem",
		paddingY: "0.5rem",
		gap: "0.5rem",
		transitionDuration: "{transition.duration}"
	},
	image: {
		width: "2rem",
		height: "2rem"
	},
	icon: { size: "1rem" },
	removeIcon: {
		size: "1rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{form.field.focus.ring.shadow}"
		}
	},
	colorScheme: {
		light: {
			root: {
				background: "{surface.100}",
				color: "{surface.800}"
			},
			icon: { color: "{surface.800}" },
			removeIcon: { color: "{surface.800}" }
		},
		dark: {
			root: {
				background: "{surface.800}",
				color: "{surface.0}"
			},
			icon: { color: "{surface.0}" },
			removeIcon: { color: "{surface.0}" }
		}
	}
}, cn = {
	root: { transitionDuration: "{transition.duration}" },
	preview: {
		width: "1.5rem",
		height: "1.5rem",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	panel: {
		shadow: "{overlay.popover.shadow}",
		borderRadius: "{overlay.popover.borderRadius}"
	},
	colorScheme: {
		light: {
			panel: {
				background: "{surface.800}",
				borderColor: "{surface.900}"
			},
			handle: { color: "{surface.0}" }
		},
		dark: {
			panel: {
				background: "{surface.900}",
				borderColor: "{surface.700}"
			},
			handle: { color: "{surface.0}" }
		}
	}
}, ln = {
	icon: {
		size: "2rem",
		color: "{overlay.modal.color}"
	},
	content: { gap: "1rem" }
}, un = {
	root: {
		background: "{overlay.popover.background}",
		borderColor: "{overlay.popover.border.color}",
		color: "{overlay.popover.color}",
		borderRadius: "{overlay.popover.border.radius}",
		shadow: "{overlay.popover.shadow}",
		gutter: "10px",
		arrowOffset: "1.25rem"
	},
	content: {
		padding: "{overlay.popover.padding}",
		gap: "1rem"
	},
	icon: {
		size: "1.5rem",
		color: "{overlay.popover.color}"
	},
	footer: {
		gap: "0.5rem",
		padding: "0 {overlay.popover.padding} {overlay.popover.padding} {overlay.popover.padding}"
	}
}, dn = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}",
		shadow: "{overlay.navigation.shadow}",
		transitionDuration: "{transition.duration}"
	},
	list: {
		padding: "{navigation.list.padding}",
		gap: "{navigation.list.gap}"
	},
	item: {
		focusBackground: "{navigation.item.focus.background}",
		activeBackground: "{navigation.item.active.background}",
		color: "{navigation.item.color}",
		focusColor: "{navigation.item.focus.color}",
		activeColor: "{navigation.item.active.color}",
		padding: "{navigation.item.padding}",
		borderRadius: "{navigation.item.border.radius}",
		gap: "{navigation.item.gap}",
		icon: {
			color: "{navigation.item.icon.color}",
			focusColor: "{navigation.item.icon.focus.color}",
			activeColor: "{navigation.item.icon.active.color}"
		}
	},
	submenu: { mobileIndent: "1rem" },
	submenuIcon: {
		size: "{navigation.submenu.icon.size}",
		color: "{navigation.submenu.icon.color}",
		focusColor: "{navigation.submenu.icon.focus.color}",
		activeColor: "{navigation.submenu.icon.active.color}"
	},
	separator: { borderColor: "{content.border.color}" }
}, fn = "\n    li.p-autocomplete-option,\n    div.p-cascadeselect-option-content,\n    li.p-listbox-option,\n    li.p-multiselect-option,\n    li.p-select-option,\n    li.p-listbox-option,\n    div.p-tree-node-content,\n    li.p-datatable-filter-constraint,\n    .p-datatable .p-datatable-tbody > tr,\n    .p-treetable .p-treetable-tbody > tr,\n    div.p-menu-item-content,\n    div.p-tieredmenu-item-content,\n    div.p-contextmenu-item-content,\n    div.p-menubar-item-content,\n    div.p-megamenu-item-content,\n    div.p-panelmenu-header-content,\n    div.p-panelmenu-item-content,\n    th.p-datatable-header-cell,\n    th.p-treetable-header-cell,\n    thead.p-datatable-thead > tr > th,\n    .p-treetable thead.p-treetable-thead>tr>th {\n        transition: none;\n    }\n", pn = {
	root: { transitionDuration: "{transition.duration}" },
	header: {
		background: "{content.background}",
		borderColor: "{datatable.border.color}",
		color: "{content.color}",
		borderWidth: "0 0 1px 0",
		padding: "0.75rem 1rem",
		sm: { padding: "0.375rem 0.5rem" },
		lg: { padding: "1rem 1.25rem" }
	},
	headerCell: {
		background: "{content.background}",
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{highlight.background}",
		borderColor: "{datatable.border.color}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		selectedColor: "{highlight.color}",
		gap: "0.5rem",
		padding: "0.75rem 1rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		},
		sm: { padding: "0.375rem 0.5rem" },
		lg: { padding: "1rem 1.25rem" }
	},
	columnTitle: { fontWeight: "600" },
	row: {
		background: "{content.background}",
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{highlight.background}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		selectedColor: "{highlight.color}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		}
	},
	bodyCell: {
		borderColor: "{datatable.border.color}",
		padding: "0.75rem 1rem",
		sm: { padding: "0.375rem 0.5rem" },
		lg: { padding: "1rem 1.25rem" }
	},
	footerCell: {
		background: "{content.background}",
		borderColor: "{datatable.border.color}",
		color: "{content.color}",
		padding: "0.75rem 1rem",
		sm: { padding: "0.375rem 0.5rem" },
		lg: { padding: "1rem 1.25rem" }
	},
	columnFooter: { fontWeight: "600" },
	footer: {
		background: "{content.background}",
		borderColor: "{datatable.border.color}",
		color: "{content.color}",
		borderWidth: "0 0 1px 0",
		padding: "0.75rem 1rem",
		sm: { padding: "0.375rem 0.5rem" },
		lg: { padding: "1rem 1.25rem" }
	},
	dropPoint: { color: "{primary.color}" },
	columnResizer: { width: "0.5rem" },
	resizeIndicator: {
		width: "1px",
		color: "{primary.color}"
	},
	sortIcon: {
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}",
		size: "0.875rem"
	},
	loadingIcon: { size: "2rem" },
	rowToggleButton: {
		hoverBackground: "{content.hover.background}",
		selectedHoverBackground: "{content.background}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		selectedHoverColor: "{primary.color}",
		size: "1.75rem",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	filter: {
		inlineGap: "0.5rem",
		overlaySelect: {
			background: "{overlay.select.background}",
			borderColor: "{overlay.select.border.color}",
			borderRadius: "{overlay.select.border.radius}",
			color: "{overlay.select.color}",
			shadow: "{overlay.select.shadow}"
		},
		overlayPopover: {
			background: "{overlay.popover.background}",
			borderColor: "{overlay.popover.border.color}",
			borderRadius: "{overlay.popover.border.radius}",
			color: "{overlay.popover.color}",
			shadow: "{overlay.popover.shadow}",
			padding: "{overlay.popover.padding}",
			gap: "0.5rem"
		},
		rule: { borderColor: "{content.border.color}" },
		constraintList: {
			padding: "{list.padding}",
			gap: "{list.gap}"
		},
		constraint: {
			focusBackground: "{list.option.focus.background}",
			selectedBackground: "{list.option.selected.background}",
			selectedFocusBackground: "{list.option.selected.focus.background}",
			color: "{list.option.color}",
			focusColor: "{list.option.focus.color}",
			selectedColor: "{list.option.selected.color}",
			selectedFocusColor: "{list.option.selected.focus.color}",
			separator: { borderColor: "{content.border.color}" },
			padding: "{list.option.padding}",
			borderRadius: "{list.option.border.radius}"
		}
	},
	paginatorTop: {
		borderColor: "{datatable.border.color}",
		borderWidth: "0 0 1px 0"
	},
	paginatorBottom: {
		borderColor: "{datatable.border.color}",
		borderWidth: "0 0 1px 0"
	},
	colorScheme: {
		light: {
			root: { borderColor: "{content.border.color}" },
			row: { stripedBackground: "{surface.50}" },
			bodyCell: { selectedBorderColor: "{primary.100}" }
		},
		dark: {
			root: { borderColor: "{surface.800}" },
			row: { stripedBackground: "{surface.950}" },
			bodyCell: { selectedBorderColor: "{primary.900}" }
		}
	},
	css: "\n    .p-datatable-mask.p-overlay-mask {\n        --px-mask-background: light-dark(rgba(255,255,255,0.5),rgba(0,0,0,0.3));\n    }\n"
}, mn = {
	root: {
		borderColor: "transparent",
		borderWidth: "0",
		borderRadius: "0",
		padding: "0"
	},
	header: {
		background: "{content.background}",
		color: "{content.color}",
		borderColor: "{content.border.color}",
		borderWidth: "0 0 1px 0",
		padding: "0.75rem 1rem",
		borderRadius: "0"
	},
	content: {
		background: "{content.background}",
		color: "{content.color}",
		borderColor: "transparent",
		borderWidth: "0",
		padding: "0",
		borderRadius: "0"
	},
	footer: {
		background: "{content.background}",
		color: "{content.color}",
		borderColor: "{content.border.color}",
		borderWidth: "1px 0 0 0",
		padding: "0.75rem 1rem",
		borderRadius: "0"
	},
	paginatorTop: {
		borderColor: "{content.border.color}",
		borderWidth: "0 0 1px 0"
	},
	paginatorBottom: {
		borderColor: "{content.border.color}",
		borderWidth: "1px 0 0 0"
	}
}, hn = {
	root: { transitionDuration: "{transition.duration}" },
	panel: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}",
		shadow: "{overlay.popover.shadow}",
		padding: "{overlay.popover.padding}"
	},
	header: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		padding: "0 0 0.5rem 0"
	},
	title: {
		gap: "0.5rem",
		fontWeight: "500"
	},
	dropdown: {
		width: "2.5rem",
		sm: { width: "2rem" },
		lg: { width: "3rem" },
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.border.color}",
		activeBorderColor: "{form.field.border.color}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	inputIcon: { color: "{form.field.icon.color}" },
	selectMonth: {
		hoverBackground: "{content.hover.background}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		padding: "0.25rem 0.5rem",
		borderRadius: "{content.border.radius}"
	},
	selectYear: {
		hoverBackground: "{content.hover.background}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		padding: "0.25rem 0.5rem",
		borderRadius: "{content.border.radius}"
	},
	group: {
		borderColor: "{content.border.color}",
		gap: "{overlay.popover.padding}"
	},
	dayView: { margin: "0.5rem 0 0 0" },
	weekDay: {
		padding: "0.25rem",
		fontWeight: "500",
		color: "{content.color}"
	},
	date: {
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{primary.color}",
		rangeSelectedBackground: "{highlight.background}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		selectedColor: "{primary.contrast.color}",
		rangeSelectedColor: "{highlight.color}",
		width: "2rem",
		height: "2rem",
		borderRadius: "50%",
		padding: "0.25rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	monthView: { margin: "0.5rem 0 0 0" },
	month: {
		padding: "0.375rem",
		borderRadius: "{content.border.radius}"
	},
	yearView: { margin: "0.5rem 0 0 0" },
	year: {
		padding: "0.375rem",
		borderRadius: "{content.border.radius}"
	},
	buttonbar: {
		padding: "0.5rem 0 0 0",
		borderColor: "{content.border.color}"
	},
	timePicker: {
		padding: "0.5rem 0 0 0",
		borderColor: "{content.border.color}",
		gap: "0.5rem",
		buttonGap: "0.25rem"
	},
	colorScheme: {
		light: {
			dropdown: {
				background: "{surface.100}",
				hoverBackground: "{surface.200}",
				activeBackground: "{surface.300}",
				color: "{surface.600}",
				hoverColor: "{surface.700}",
				activeColor: "{surface.800}"
			},
			today: {
				background: "{surface.200}",
				color: "{surface.900}"
			}
		},
		dark: {
			dropdown: {
				background: "{surface.800}",
				hoverBackground: "{surface.700}",
				activeBackground: "{surface.600}",
				color: "{surface.300}",
				hoverColor: "{surface.200}",
				activeColor: "{surface.100}"
			},
			today: {
				background: "{surface.700}",
				color: "{surface.0}"
			}
		}
	}
}, gn = {
	root: {
		background: "{overlay.modal.background}",
		borderColor: "{overlay.modal.border.color}",
		color: "{overlay.modal.color}",
		borderRadius: "{overlay.modal.border.radius}",
		shadow: "{overlay.modal.shadow}"
	},
	header: {
		padding: "{overlay.modal.padding}",
		gap: "0.5rem"
	},
	title: {
		fontSize: "1.25rem",
		fontWeight: "600"
	},
	content: { padding: "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}" },
	footer: {
		padding: "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}",
		gap: "0.5rem"
	}
}, _n = {
	root: { borderColor: "{content.border.color}" },
	content: {
		background: "{content.background}",
		color: "{text.color}"
	},
	horizontal: {
		margin: "1rem 0",
		padding: "0 1rem",
		content: { padding: "0 0.5rem" }
	},
	vertical: {
		margin: "0 1rem",
		padding: "0.5rem 0",
		content: { padding: "0.5rem 0" }
	}
}, vn = {
	root: {
		background: "rgba(255, 255, 255, 0.1)",
		borderColor: "rgba(255, 255, 255, 0.2)",
		padding: "0.5rem",
		borderRadius: "{border.radius.xl}"
	},
	item: {
		borderRadius: "{content.border.radius}",
		padding: "0.5rem",
		size: "3rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	}
}, yn = {
	root: {
		background: "{overlay.modal.background}",
		borderColor: "{overlay.modal.border.color}",
		color: "{overlay.modal.color}",
		shadow: "{overlay.modal.shadow}"
	},
	header: { padding: "{overlay.modal.padding}" },
	title: {
		fontSize: "1.5rem",
		fontWeight: "600"
	},
	content: { padding: "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}" },
	footer: { padding: "{overlay.modal.padding}" }
}, bn = {
	toolbar: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		borderRadius: "{content.border.radius}"
	},
	toolbarItem: {
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		activeColor: "{primary.color}"
	},
	overlay: {
		background: "{overlay.select.background}",
		borderColor: "{overlay.select.border.color}",
		borderRadius: "{overlay.select.border.radius}",
		color: "{overlay.select.color}",
		shadow: "{overlay.select.shadow}",
		padding: "{list.padding}"
	},
	overlayOption: {
		focusBackground: "{list.option.focus.background}",
		color: "{list.option.color}",
		focusColor: "{list.option.focus.color}",
		padding: "{list.option.padding}",
		borderRadius: "{list.option.border.radius}"
	},
	content: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}"
	}
}, xn = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		color: "{content.color}",
		padding: "0 1.125rem 1.125rem 1.125rem",
		transitionDuration: "{transition.duration}"
	},
	legend: {
		background: "{content.background}",
		hoverBackground: "{content.hover.background}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		borderRadius: "{content.border.radius}",
		borderWidth: "1px",
		borderColor: "transparent",
		padding: "0.5rem 0.75rem",
		gap: "0.5rem",
		fontWeight: "600",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	toggleIcon: {
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}"
	},
	content: { padding: "0" }
}, Sn = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}",
		transitionDuration: "{transition.duration}"
	},
	header: {
		background: "transparent",
		color: "{text.color}",
		padding: "1.125rem",
		borderColor: "unset",
		borderWidth: "0",
		borderRadius: "0",
		gap: "0.5rem"
	},
	content: {
		highlightBorderColor: "{primary.color}",
		padding: "0 1.125rem 1.125rem 1.125rem",
		gap: "1rem"
	},
	file: {
		padding: "1rem",
		gap: "1rem",
		borderColor: "{content.border.color}",
		info: { gap: "0.5rem" }
	},
	fileList: { gap: "0.5rem" },
	progressbar: { height: "0.25rem" },
	basic: { gap: "0.5rem" }
}, Cn = {
	root: {
		color: "{form.field.float.label.color}",
		focusColor: "{form.field.float.label.focus.color}",
		activeColor: "{form.field.float.label.active.color}",
		invalidColor: "{form.field.float.label.invalid.color}",
		transitionDuration: "0.2s",
		positionX: "{form.field.padding.x}",
		positionY: "{form.field.padding.y}",
		fontWeight: "500",
		active: {
			fontSize: "0.75rem",
			fontWeight: "400"
		}
	},
	over: { active: { top: "-1.25rem" } },
	in: {
		input: {
			paddingTop: "1.5rem",
			paddingBottom: "{form.field.padding.y}"
		},
		active: { top: "{form.field.padding.y}" }
	},
	on: {
		borderRadius: "{border.radius.xs}",
		active: {
			background: "{form.field.background}",
			padding: "0 0.125rem"
		}
	}
}, wn = {
	root: {
		borderWidth: "1px",
		borderColor: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		transitionDuration: "{transition.duration}"
	},
	navButton: {
		background: "rgba(255, 255, 255, 0.1)",
		hoverBackground: "rgba(255, 255, 255, 0.2)",
		color: "{surface.100}",
		hoverColor: "{surface.0}",
		size: "3rem",
		gutter: "0.5rem",
		prev: { borderRadius: "50%" },
		next: { borderRadius: "50%" },
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	navIcon: { size: "1.5rem" },
	thumbnailsContent: {
		background: "{content.background}",
		padding: "1rem 0.25rem"
	},
	thumbnailNavButton: {
		size: "2rem",
		borderRadius: "{content.border.radius}",
		gutter: "0.5rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	thumbnailNavButtonIcon: { size: "1rem" },
	caption: {
		background: "rgba(0, 0, 0, 0.5)",
		color: "{surface.100}",
		padding: "1rem"
	},
	indicatorList: {
		gap: "0.5rem",
		padding: "1rem"
	},
	indicatorButton: {
		width: "1rem",
		height: "1rem",
		activeBackground: "{primary.color}",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	insetIndicatorList: { background: "rgba(0, 0, 0, 0.5)" },
	insetIndicatorButton: {
		background: "rgba(255, 255, 255, 0.4)",
		hoverBackground: "rgba(255, 255, 255, 0.6)",
		activeBackground: "rgba(255, 255, 255, 0.9)"
	},
	closeButton: {
		size: "3rem",
		gutter: "0.5rem",
		background: "rgba(255, 255, 255, 0.1)",
		hoverBackground: "rgba(255, 255, 255, 0.2)",
		color: "{surface.50}",
		hoverColor: "{surface.0}",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	closeButtonIcon: { size: "1.5rem" },
	colorScheme: {
		light: {
			thumbnailNavButton: {
				hoverBackground: "{surface.100}",
				color: "{surface.600}",
				hoverColor: "{surface.700}"
			},
			indicatorButton: {
				background: "{surface.200}",
				hoverBackground: "{surface.300}"
			}
		},
		dark: {
			thumbnailNavButton: {
				hoverBackground: "{surface.700}",
				color: "{surface.400}",
				hoverColor: "{surface.0}"
			},
			indicatorButton: {
				background: "{surface.700}",
				hoverBackground: "{surface.600}"
			}
		}
	}
}, Tn = { icon: { color: "{form.field.icon.color}" } }, En = {
	root: {
		color: "{form.field.float.label.color}",
		focusColor: "{form.field.float.label.focus.color}",
		invalidColor: "{form.field.float.label.invalid.color}",
		transitionDuration: "0.2s",
		positionX: "{form.field.padding.x}",
		top: "{form.field.padding.y}",
		fontSize: "0.75rem",
		fontWeight: "400"
	},
	input: {
		paddingTop: "1.5rem",
		paddingBottom: "{form.field.padding.y}"
	}
}, Dn = {
	root: { transitionDuration: "{transition.duration}" },
	preview: {
		icon: { size: "1.5rem" },
		mask: {
			background: "{mask.background}",
			color: "{mask.color}"
		}
	},
	toolbar: {
		position: {
			left: "auto",
			right: "1rem",
			top: "1rem",
			bottom: "auto"
		},
		blur: "8px",
		background: "rgba(255,255,255,0.1)",
		borderColor: "rgba(255,255,255,0.2)",
		borderWidth: "1px",
		borderRadius: "30px",
		padding: ".5rem",
		gap: "0.5rem"
	},
	action: {
		hoverBackground: "rgba(255,255,255,0.1)",
		color: "{surface.50}",
		hoverColor: "{surface.0}",
		size: "3rem",
		iconSize: "1.5rem",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	}
}, On = { handle: {
	size: "15px",
	hoverSize: "30px",
	background: "rgba(255,255,255,0.3)",
	hoverBackground: "rgba(255,255,255,0.3)",
	borderColor: "unset",
	hoverBorderColor: "unset",
	borderWidth: "0",
	borderRadius: "50%",
	transitionDuration: "{transition.duration}",
	focusRing: {
		width: "{focus.ring.width}",
		style: "{focus.ring.style}",
		color: "rgba(255,255,255,0.3)",
		offset: "{focus.ring.offset}",
		shadow: "{focus.ring.shadow}"
	}
} }, kn = {
	root: {
		padding: "{form.field.padding.y} {form.field.padding.x}",
		borderRadius: "{content.border.radius}",
		gap: "0.5rem"
	},
	text: { fontWeight: "500" },
	icon: { size: "1rem" },
	colorScheme: {
		light: {
			info: {
				background: "color-mix(in srgb, {blue.50}, transparent 5%)",
				borderColor: "{blue.200}",
				color: "{blue.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)"
			},
			success: {
				background: "color-mix(in srgb, {green.50}, transparent 5%)",
				borderColor: "{green.200}",
				color: "{green.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)"
			},
			warn: {
				background: "color-mix(in srgb,{yellow.50}, transparent 5%)",
				borderColor: "{yellow.200}",
				color: "{yellow.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)"
			},
			error: {
				background: "color-mix(in srgb, {red.50}, transparent 5%)",
				borderColor: "{red.200}",
				color: "{red.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)"
			},
			secondary: {
				background: "{surface.100}",
				borderColor: "{surface.200}",
				color: "{surface.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)"
			},
			contrast: {
				background: "{surface.900}",
				borderColor: "{surface.950}",
				color: "{surface.50}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)"
			}
		},
		dark: {
			info: {
				background: "color-mix(in srgb, {blue.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {blue.700}, transparent 64%)",
				color: "{blue.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)"
			},
			success: {
				background: "color-mix(in srgb, {green.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {green.700}, transparent 64%)",
				color: "{green.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)"
			},
			warn: {
				background: "color-mix(in srgb, {yellow.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {yellow.700}, transparent 64%)",
				color: "{yellow.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)"
			},
			error: {
				background: "color-mix(in srgb, {red.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {red.700}, transparent 64%)",
				color: "{red.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)"
			},
			secondary: {
				background: "{surface.800}",
				borderColor: "{surface.700}",
				color: "{surface.300}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)"
			},
			contrast: {
				background: "{surface.0}",
				borderColor: "{surface.100}",
				color: "{surface.950}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)"
			}
		}
	}
}, An = {
	root: {
		padding: "{form.field.padding.y} {form.field.padding.x}",
		borderRadius: "{content.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		},
		transitionDuration: "{transition.duration}"
	},
	display: {
		hoverBackground: "{content.hover.background}",
		hoverColor: "{content.hover.color}"
	}
}, jn = {
	root: {
		background: "{form.field.background}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		filledFocusBackground: "{form.field.filled.focus.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.focus.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		color: "{form.field.color}",
		disabledColor: "{form.field.disabled.color}",
		placeholderColor: "{form.field.placeholder.color}",
		shadow: "{form.field.shadow}",
		paddingX: "{form.field.padding.x}",
		paddingY: "{form.field.padding.y}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{form.field.focus.ring.width}",
			style: "{form.field.focus.ring.style}",
			color: "{form.field.focus.ring.color}",
			offset: "{form.field.focus.ring.offset}",
			shadow: "{form.field.focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}"
	},
	chip: { borderRadius: "{border.radius.sm}" },
	colorScheme: {
		light: { chip: {
			focusBackground: "{surface.200}",
			color: "{surface.800}"
		} },
		dark: { chip: {
			focusBackground: "{surface.700}",
			color: "{surface.0}"
		} }
	}
}, Mn = { addon: {
	background: "{form.field.background}",
	borderColor: "{form.field.border.color}",
	color: "{form.field.icon.color}",
	borderRadius: "{form.field.border.radius}",
	padding: "0.5rem",
	minWidth: "2.5rem"
} }, Nn = {
	root: { transitionDuration: "{transition.duration}" },
	button: {
		width: "2.5rem",
		borderRadius: "{form.field.border.radius}",
		verticalPadding: "{form.field.padding.y}"
	},
	colorScheme: {
		light: { button: {
			background: "transparent",
			hoverBackground: "{surface.100}",
			activeBackground: "{surface.200}",
			borderColor: "{form.field.border.color}",
			hoverBorderColor: "{form.field.border.color}",
			activeBorderColor: "{form.field.border.color}",
			color: "{surface.400}",
			hoverColor: "{surface.500}",
			activeColor: "{surface.600}"
		} },
		dark: { button: {
			background: "transparent",
			hoverBackground: "{surface.800}",
			activeBackground: "{surface.700}",
			borderColor: "{form.field.border.color}",
			hoverBorderColor: "{form.field.border.color}",
			activeBorderColor: "{form.field.border.color}",
			color: "{surface.400}",
			hoverColor: "{surface.300}",
			activeColor: "{surface.200}"
		} }
	}
}, Pn = {
	root: { gap: "0.5rem" },
	input: {
		width: "2.5rem",
		sm: { width: "2rem" },
		lg: { width: "3rem" }
	}
}, Fn = { root: {
	background: "{form.field.background}",
	disabledBackground: "{form.field.disabled.background}",
	filledBackground: "{form.field.filled.background}",
	filledHoverBackground: "{form.field.filled.hover.background}",
	filledFocusBackground: "{form.field.filled.focus.background}",
	borderColor: "{form.field.border.color}",
	hoverBorderColor: "{form.field.hover.border.color}",
	focusBorderColor: "{form.field.focus.border.color}",
	invalidBorderColor: "{form.field.invalid.border.color}",
	color: "{form.field.color}",
	disabledColor: "{form.field.disabled.color}",
	placeholderColor: "{form.field.placeholder.color}",
	invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
	shadow: "{form.field.shadow}",
	paddingX: "{form.field.padding.x}",
	paddingY: "{form.field.padding.y}",
	borderRadius: "{form.field.border.radius}",
	focusRing: {
		width: "{form.field.focus.ring.width}",
		style: "{form.field.focus.ring.style}",
		color: "{form.field.focus.ring.color}",
		offset: "{form.field.focus.ring.offset}",
		shadow: "{form.field.focus.ring.shadow}"
	},
	transitionDuration: "{form.field.transition.duration}",
	sm: {
		fontSize: "{form.field.sm.font.size}",
		paddingX: "{form.field.sm.padding.x}",
		paddingY: "{form.field.sm.padding.y}"
	},
	lg: {
		fontSize: "{form.field.lg.font.size}",
		paddingX: "{form.field.lg.padding.x}",
		paddingY: "{form.field.lg.padding.y}"
	}
} }, In = {
	root: {
		transitionDuration: "{transition.duration}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	value: { background: "{primary.color}" },
	range: { background: "{content.border.color}" },
	text: { color: "{text.muted.color}" }
}, Ln = {
	root: {
		background: "{form.field.background}",
		disabledBackground: "{form.field.disabled.background}",
		borderColor: "{form.field.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		color: "{form.field.color}",
		disabledColor: "{form.field.disabled.color}",
		shadow: "{form.field.shadow}",
		borderRadius: "{form.field.border.radius}",
		transitionDuration: "{form.field.transition.duration}"
	},
	list: {
		padding: "{list.padding}",
		gap: "{list.gap}",
		header: { padding: "{list.header.padding}" }
	},
	option: {
		focusBackground: "{list.option.focus.background}",
		selectedBackground: "{list.option.selected.background}",
		selectedFocusBackground: "{list.option.selected.focus.background}",
		color: "{list.option.color}",
		focusColor: "{list.option.focus.color}",
		selectedColor: "{list.option.selected.color}",
		selectedFocusColor: "{list.option.selected.focus.color}",
		padding: "{list.option.padding}",
		borderRadius: "{list.option.border.radius}"
	},
	optionGroup: {
		background: "{list.option.group.background}",
		color: "{list.option.group.color}",
		fontWeight: "{list.option.group.font.weight}",
		padding: "{list.option.group.padding}"
	},
	checkmark: {
		color: "{list.option.color}",
		gutterStart: "-0.375rem",
		gutterEnd: "0.375rem"
	},
	emptyMessage: { padding: "{list.option.padding}" },
	colorScheme: {
		light: { option: { stripedBackground: "{surface.50}" } },
		dark: { option: { stripedBackground: "{surface.900}" } }
	}
}, Rn = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		color: "{content.color}",
		gap: "0.5rem",
		verticalOrientation: {
			padding: "{navigation.list.padding}",
			gap: "{navigation.list.gap}"
		},
		horizontalOrientation: {
			padding: "0.5rem 0.75rem",
			gap: "0.5rem"
		},
		transitionDuration: "{transition.duration}"
	},
	baseItem: {
		borderRadius: "{content.border.radius}",
		padding: "{navigation.item.padding}"
	},
	item: {
		focusBackground: "{navigation.item.focus.background}",
		activeBackground: "{navigation.item.active.background}",
		color: "{navigation.item.color}",
		focusColor: "{navigation.item.focus.color}",
		activeColor: "{navigation.item.active.color}",
		padding: "{navigation.item.padding}",
		borderRadius: "{navigation.item.border.radius}",
		gap: "{navigation.item.gap}",
		icon: {
			color: "{navigation.item.icon.color}",
			focusColor: "{navigation.item.icon.focus.color}",
			activeColor: "{navigation.item.icon.active.color}"
		}
	},
	overlay: {
		padding: "0",
		background: "{content.background}",
		borderColor: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		color: "{content.color}",
		shadow: "{overlay.navigation.shadow}",
		gap: "0.5rem"
	},
	submenu: {
		padding: "{navigation.list.padding}",
		gap: "{navigation.list.gap}"
	},
	submenuLabel: {
		padding: "{navigation.submenu.label.padding}",
		fontWeight: "{navigation.submenu.label.font.weight}",
		background: "{navigation.submenu.label.background}",
		color: "{navigation.submenu.label.color}"
	},
	submenuIcon: {
		size: "{navigation.submenu.icon.size}",
		color: "{navigation.submenu.icon.color}",
		focusColor: "{navigation.submenu.icon.focus.color}",
		activeColor: "{navigation.submenu.icon.active.color}"
	},
	separator: { borderColor: "{content.border.color}" },
	mobileButton: {
		borderRadius: "50%",
		size: "1.75rem",
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}",
		hoverBackground: "{content.hover.background}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	}
}, zn = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}",
		shadow: "{overlay.navigation.shadow}",
		transitionDuration: "{transition.duration}"
	},
	list: {
		padding: "{navigation.list.padding}",
		gap: "{navigation.list.gap}"
	},
	item: {
		focusBackground: "{navigation.item.focus.background}",
		color: "{navigation.item.color}",
		focusColor: "{navigation.item.focus.color}",
		padding: "{navigation.item.padding}",
		borderRadius: "{navigation.item.border.radius}",
		gap: "{navigation.item.gap}",
		icon: {
			color: "{navigation.item.icon.color}",
			focusColor: "{navigation.item.icon.focus.color}"
		}
	},
	submenuLabel: {
		padding: "{navigation.submenu.label.padding}",
		fontWeight: "{navigation.submenu.label.font.weight}",
		background: "{navigation.submenu.label.background}",
		color: "{navigation.submenu.label.color}"
	},
	separator: { borderColor: "{content.border.color}" }
}, Bn = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		color: "{content.color}",
		gap: "0.5rem",
		padding: "0.5rem 0.75rem",
		transitionDuration: "{transition.duration}"
	},
	baseItem: {
		borderRadius: "{content.border.radius}",
		padding: "{navigation.item.padding}"
	},
	item: {
		focusBackground: "{navigation.item.focus.background}",
		activeBackground: "{navigation.item.active.background}",
		color: "{navigation.item.color}",
		focusColor: "{navigation.item.focus.color}",
		activeColor: "{navigation.item.active.color}",
		padding: "{navigation.item.padding}",
		borderRadius: "{navigation.item.border.radius}",
		gap: "{navigation.item.gap}",
		icon: {
			color: "{navigation.item.icon.color}",
			focusColor: "{navigation.item.icon.focus.color}",
			activeColor: "{navigation.item.icon.active.color}"
		}
	},
	submenu: {
		padding: "{navigation.list.padding}",
		gap: "{navigation.list.gap}",
		background: "{content.background}",
		borderColor: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		shadow: "{overlay.navigation.shadow}",
		mobileIndent: "1rem",
		icon: {
			size: "{navigation.submenu.icon.size}",
			color: "{navigation.submenu.icon.color}",
			focusColor: "{navigation.submenu.icon.focus.color}",
			activeColor: "{navigation.submenu.icon.active.color}"
		}
	},
	separator: { borderColor: "{content.border.color}" },
	mobileButton: {
		borderRadius: "50%",
		size: "1.75rem",
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}",
		hoverBackground: "{content.hover.background}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	}
}, Vn = {
	root: {
		borderRadius: "{content.border.radius}",
		borderWidth: "1px",
		transitionDuration: "{transition.duration}"
	},
	content: {
		padding: "0.5rem 0.75rem",
		gap: "0.5rem",
		sm: { padding: "0.375rem 0.625rem" },
		lg: { padding: "0.625rem 0.875rem" }
	},
	text: {
		fontSize: "1rem",
		fontWeight: "500",
		sm: { fontSize: "0.875rem" },
		lg: { fontSize: "1.125rem" }
	},
	icon: {
		size: "1.125rem",
		sm: { size: "1rem" },
		lg: { size: "1.25rem" }
	},
	closeButton: {
		width: "1.75rem",
		height: "1.75rem",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			offset: "{focus.ring.offset}"
		}
	},
	closeIcon: {
		size: "1rem",
		sm: { size: "0.875rem" },
		lg: { size: "1.125rem" }
	},
	outlined: { root: { borderWidth: "1px" } },
	simple: { content: { padding: "0" } },
	colorScheme: {
		light: {
			info: {
				background: "color-mix(in srgb, {blue.50}, transparent 5%)",
				borderColor: "{blue.200}",
				color: "{blue.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{blue.100}",
					focusRing: {
						color: "{blue.600}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{blue.600}",
					borderColor: "{blue.600}"
				},
				simple: { color: "{blue.600}" }
			},
			success: {
				background: "color-mix(in srgb, {green.50}, transparent 5%)",
				borderColor: "{green.200}",
				color: "{green.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{green.100}",
					focusRing: {
						color: "{green.600}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{green.600}",
					borderColor: "{green.600}"
				},
				simple: { color: "{green.600}" }
			},
			warn: {
				background: "color-mix(in srgb,{yellow.50}, transparent 5%)",
				borderColor: "{yellow.200}",
				color: "{yellow.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{yellow.100}",
					focusRing: {
						color: "{yellow.600}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{yellow.600}",
					borderColor: "{yellow.600}"
				},
				simple: { color: "{yellow.600}" }
			},
			error: {
				background: "color-mix(in srgb, {red.50}, transparent 5%)",
				borderColor: "{red.200}",
				color: "{red.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{red.100}",
					focusRing: {
						color: "{red.600}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{red.600}",
					borderColor: "{red.600}"
				},
				simple: { color: "{red.600}" }
			},
			secondary: {
				background: "{surface.100}",
				borderColor: "{surface.200}",
				color: "{surface.600}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.200}",
					focusRing: {
						color: "{surface.600}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{surface.500}",
					borderColor: "{surface.500}"
				},
				simple: { color: "{surface.500}" }
			},
			contrast: {
				background: "{surface.900}",
				borderColor: "{surface.950}",
				color: "{surface.50}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.800}",
					focusRing: {
						color: "{surface.50}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{surface.950}",
					borderColor: "{surface.950}"
				},
				simple: { color: "{surface.950}" }
			}
		},
		dark: {
			info: {
				background: "color-mix(in srgb, {blue.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {blue.700}, transparent 64%)",
				color: "{blue.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{blue.500}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{blue.500}",
					borderColor: "{blue.500}"
				},
				simple: { color: "{blue.500}" }
			},
			success: {
				background: "color-mix(in srgb, {green.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {green.700}, transparent 64%)",
				color: "{green.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{green.500}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{green.500}",
					borderColor: "{green.500}"
				},
				simple: { color: "{green.500}" }
			},
			warn: {
				background: "color-mix(in srgb, {yellow.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {yellow.700}, transparent 64%)",
				color: "{yellow.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{yellow.500}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{yellow.500}",
					borderColor: "{yellow.500}"
				},
				simple: { color: "{yellow.500}" }
			},
			error: {
				background: "color-mix(in srgb, {red.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {red.700}, transparent 64%)",
				color: "{red.500}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{red.500}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{red.500}",
					borderColor: "{red.500}"
				},
				simple: { color: "{red.500}" }
			},
			secondary: {
				background: "{surface.800}",
				borderColor: "{surface.700}",
				color: "{surface.300}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.700}",
					focusRing: {
						color: "{surface.300}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{surface.400}",
					borderColor: "{surface.400}"
				},
				simple: { color: "{surface.400}" }
			},
			contrast: {
				background: "{surface.0}",
				borderColor: "{surface.100}",
				color: "{surface.950}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.100}",
					focusRing: {
						color: "{surface.950}",
						shadow: "none"
					}
				},
				outlined: {
					color: "{surface.0}",
					borderColor: "{surface.0}"
				},
				simple: { color: "{surface.0}" }
			}
		}
	}
}, Hn = {
	root: {
		borderRadius: "{content.border.radius}",
		gap: "1rem"
	},
	meters: {
		background: "{content.border.color}",
		size: "0.5rem"
	},
	label: { gap: "0.5rem" },
	labelMarker: { size: "0.5rem" },
	labelIcon: { size: "1rem" },
	labelList: {
		verticalGap: "0.5rem",
		horizontalGap: "1rem"
	}
}, Un = {
	root: {
		background: "{form.field.background}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		filledHoverBackground: "{form.field.filled.hover.background}",
		filledFocusBackground: "{form.field.filled.focus.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.focus.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		color: "{form.field.color}",
		disabledColor: "{form.field.disabled.color}",
		placeholderColor: "{form.field.placeholder.color}",
		invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
		shadow: "{form.field.shadow}",
		paddingX: "{form.field.padding.x}",
		paddingY: "{form.field.padding.y}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{form.field.focus.ring.width}",
			style: "{form.field.focus.ring.style}",
			color: "{form.field.focus.ring.color}",
			offset: "{form.field.focus.ring.offset}",
			shadow: "{form.field.focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}",
		sm: {
			fontSize: "{form.field.sm.font.size}",
			paddingX: "{form.field.sm.padding.x}",
			paddingY: "{form.field.sm.padding.y}"
		},
		lg: {
			fontSize: "{form.field.lg.font.size}",
			paddingX: "{form.field.lg.padding.x}",
			paddingY: "{form.field.lg.padding.y}"
		}
	},
	dropdown: {
		width: "2.5rem",
		color: "{form.field.icon.color}"
	},
	overlay: {
		background: "{overlay.select.background}",
		borderColor: "{overlay.select.border.color}",
		borderRadius: "{overlay.select.border.radius}",
		color: "{overlay.select.color}",
		shadow: "{overlay.select.shadow}"
	},
	list: {
		padding: "{list.padding}",
		gap: "{list.gap}",
		header: { padding: "{list.header.padding}" }
	},
	option: {
		focusBackground: "{list.option.focus.background}",
		selectedBackground: "{list.option.selected.background}",
		selectedFocusBackground: "{list.option.selected.focus.background}",
		color: "{list.option.color}",
		focusColor: "{list.option.focus.color}",
		selectedColor: "{list.option.selected.color}",
		selectedFocusColor: "{list.option.selected.focus.color}",
		padding: "{list.option.padding}",
		borderRadius: "{list.option.border.radius}",
		gap: "0.5rem"
	},
	optionGroup: {
		background: "{list.option.group.background}",
		color: "{list.option.group.color}",
		fontWeight: "{list.option.group.font.weight}",
		padding: "{list.option.group.padding}"
	},
	chip: { borderRadius: "{border.radius.sm}" },
	clearIcon: { color: "{form.field.icon.color}" },
	emptyMessage: { padding: "{list.option.padding}" }
}, Wn = {
	root: { gap: "1.125rem" },
	controls: { gap: "0.5rem" }
}, Gn = {
	root: {
		gutter: "0.75rem",
		transitionDuration: "{transition.duration}"
	},
	node: {
		background: "{content.background}",
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{highlight.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		selectedColor: "{highlight.color}",
		hoverColor: "{content.hover.color}",
		padding: "0.75rem 1rem",
		toggleablePadding: "0.75rem 1rem 1.25rem 1rem",
		borderRadius: "{content.border.radius}"
	},
	nodeToggleButton: {
		background: "{content.background}",
		hoverBackground: "{content.hover.background}",
		borderColor: "{content.border.color}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		size: "1.5rem",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	connector: {
		color: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		height: "24px"
	}
}, Kn = { root: { outline: {
	width: "2px",
	color: "{content.background}"
} } }, qn = {
	root: {
		padding: "0.5rem 1rem",
		gap: "0.25rem",
		borderRadius: "{content.border.radius}",
		background: "{content.background}",
		color: "{content.color}",
		transitionDuration: "{transition.duration}"
	},
	navButton: {
		background: "transparent",
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{highlight.background}",
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}",
		selectedColor: "{highlight.color}",
		width: "2.5rem",
		height: "2.5rem",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	currentPageReport: { color: "{text.muted.color}" },
	jumpToPageInput: { maxWidth: "2.5rem" }
}, Jn = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}"
	},
	header: {
		background: "transparent",
		color: "{text.color}",
		padding: "1.125rem",
		borderColor: "{content.border.color}",
		borderWidth: "0",
		borderRadius: "0"
	},
	toggleableHeader: { padding: "0.375rem 1.125rem" },
	title: { fontWeight: "600" },
	content: { padding: "0 1.125rem 1.125rem 1.125rem" },
	footer: { padding: "0 1.125rem 1.125rem 1.125rem" }
}, Yn = {
	root: {
		gap: "0.5rem",
		transitionDuration: "{transition.duration}"
	},
	panel: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		borderWidth: "1px",
		color: "{content.color}",
		padding: "0.25rem 0.25rem",
		borderRadius: "{content.border.radius}",
		first: {
			borderWidth: "1px",
			topBorderRadius: "{content.border.radius}"
		},
		last: {
			borderWidth: "1px",
			bottomBorderRadius: "{content.border.radius}"
		}
	},
	item: {
		focusBackground: "{navigation.item.focus.background}",
		color: "{navigation.item.color}",
		focusColor: "{navigation.item.focus.color}",
		gap: "0.5rem",
		padding: "{navigation.item.padding}",
		borderRadius: "{content.border.radius}",
		icon: {
			color: "{navigation.item.icon.color}",
			focusColor: "{navigation.item.icon.focus.color}"
		}
	},
	submenu: { indent: "1rem" },
	submenuIcon: {
		color: "{navigation.submenu.icon.color}",
		focusColor: "{navigation.submenu.icon.focus.color}"
	}
}, Xn = {
	meter: {
		background: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		height: ".75rem"
	},
	icon: { color: "{form.field.icon.color}" },
	overlay: {
		background: "{overlay.popover.background}",
		borderColor: "{overlay.popover.border.color}",
		borderRadius: "{overlay.popover.border.radius}",
		color: "{overlay.popover.color}",
		padding: "{overlay.popover.padding}",
		shadow: "{overlay.popover.shadow}"
	},
	content: { gap: "0.5rem" },
	colorScheme: {
		light: { strength: {
			weakBackground: "{red.500}",
			mediumBackground: "{amber.500}",
			strongBackground: "{green.500}"
		} },
		dark: { strength: {
			weakBackground: "{red.400}",
			mediumBackground: "{amber.400}",
			strongBackground: "{green.400}"
		} }
	}
}, Zn = {
	root: { gap: "1.125rem" },
	controls: { gap: "0.5rem" }
}, Qn = {
	root: {
		background: "{overlay.popover.background}",
		borderColor: "{overlay.popover.border.color}",
		color: "{overlay.popover.color}",
		borderRadius: "{overlay.popover.border.radius}",
		shadow: "{overlay.popover.shadow}",
		gutter: "10px",
		arrowOffset: "1.25rem"
	},
	content: { padding: "{overlay.popover.padding}" }
}, $n = {
	root: {
		background: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		height: "1.25rem"
	},
	value: { background: "{primary.color}" },
	label: {
		color: "{primary.contrast.color}",
		fontSize: "0.75rem",
		fontWeight: "600"
	}
}, er = { colorScheme: {
	light: { root: {
		colorOne: "{red.500}",
		colorTwo: "{blue.500}",
		colorThree: "{green.500}",
		colorFour: "{yellow.500}"
	} },
	dark: { root: {
		colorOne: "{red.400}",
		colorTwo: "{blue.400}",
		colorThree: "{green.400}",
		colorFour: "{yellow.400}"
	} }
} }, tr = {
	root: {
		width: "1.25rem",
		height: "1.25rem",
		background: "{form.field.background}",
		checkedBackground: "{primary.color}",
		checkedHoverBackground: "{primary.hover.color}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.border.color}",
		checkedBorderColor: "{primary.color}",
		checkedHoverBorderColor: "{primary.hover.color}",
		checkedFocusBorderColor: "{primary.color}",
		checkedDisabledBorderColor: "{form.field.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		shadow: "{form.field.shadow}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}",
		sm: {
			width: "1rem",
			height: "1rem"
		},
		lg: {
			width: "1.5rem",
			height: "1.5rem"
		}
	},
	icon: {
		size: "0.75rem",
		checkedColor: "{primary.contrast.color}",
		checkedHoverColor: "{primary.contrast.color}",
		disabledColor: "{form.field.disabled.color}",
		sm: { size: "0.5rem" },
		lg: { size: "1rem" }
	}
}, nr = {
	root: {
		gap: "0.25rem",
		transitionDuration: "{transition.duration}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	icon: {
		size: "1rem",
		color: "{text.muted.color}",
		hoverColor: "{primary.color}",
		activeColor: "{primary.color}"
	}
}, rr = { colorScheme: {
	light: { root: { background: "rgba(0,0,0,0.1)" } },
	dark: { root: { background: "rgba(255,255,255,0.3)" } }
} }, ir = {
	root: { transitionDuration: "{transition.duration}" },
	bar: {
		size: "9px",
		borderRadius: "{border.radius.sm}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	colorScheme: {
		light: { bar: { background: "{surface.100}" } },
		dark: { bar: { background: "{surface.800}" } }
	}
}, ar = {
	root: {
		background: "{form.field.background}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		filledHoverBackground: "{form.field.filled.hover.background}",
		filledFocusBackground: "{form.field.filled.focus.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.focus.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		color: "{form.field.color}",
		disabledColor: "{form.field.disabled.color}",
		placeholderColor: "{form.field.placeholder.color}",
		invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
		shadow: "{form.field.shadow}",
		paddingX: "{form.field.padding.x}",
		paddingY: "{form.field.padding.y}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{form.field.focus.ring.width}",
			style: "{form.field.focus.ring.style}",
			color: "{form.field.focus.ring.color}",
			offset: "{form.field.focus.ring.offset}",
			shadow: "{form.field.focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}",
		sm: {
			fontSize: "{form.field.sm.font.size}",
			paddingX: "{form.field.sm.padding.x}",
			paddingY: "{form.field.sm.padding.y}"
		},
		lg: {
			fontSize: "{form.field.lg.font.size}",
			paddingX: "{form.field.lg.padding.x}",
			paddingY: "{form.field.lg.padding.y}"
		}
	},
	dropdown: {
		width: "2.5rem",
		color: "{form.field.icon.color}"
	},
	overlay: {
		background: "{overlay.select.background}",
		borderColor: "{overlay.select.border.color}",
		borderRadius: "{overlay.select.border.radius}",
		color: "{overlay.select.color}",
		shadow: "{overlay.select.shadow}"
	},
	list: {
		padding: "{list.padding}",
		gap: "{list.gap}",
		header: { padding: "{list.header.padding}" }
	},
	option: {
		focusBackground: "{list.option.focus.background}",
		selectedBackground: "{list.option.selected.background}",
		selectedFocusBackground: "{list.option.selected.focus.background}",
		color: "{list.option.color}",
		focusColor: "{list.option.focus.color}",
		selectedColor: "{list.option.selected.color}",
		selectedFocusColor: "{list.option.selected.focus.color}",
		padding: "{list.option.padding}",
		borderRadius: "{list.option.border.radius}"
	},
	optionGroup: {
		background: "{list.option.group.background}",
		color: "{list.option.group.color}",
		fontWeight: "{list.option.group.font.weight}",
		padding: "{list.option.group.padding}"
	},
	clearIcon: { color: "{form.field.icon.color}" },
	checkmark: {
		color: "{list.option.color}",
		gutterStart: "-0.375rem",
		gutterEnd: "0.375rem"
	},
	emptyMessage: { padding: "{list.option.padding}" }
}, or = {
	root: { borderRadius: "{form.field.border.radius}" },
	colorScheme: {
		light: { root: { invalidBorderColor: "{form.field.invalid.border.color}" } },
		dark: { root: { invalidBorderColor: "{form.field.invalid.border.color}" } }
	}
}, sr = {
	root: { borderRadius: "{content.border.radius}" },
	colorScheme: {
		light: { root: {
			background: "{surface.200}",
			animationBackground: "rgba(255,255,255,0.4)"
		} },
		dark: { root: {
			background: "rgba(255, 255, 255, 0.06)",
			animationBackground: "rgba(255, 255, 255, 0.04)"
		} }
	}
}, cr = {
	root: { transitionDuration: "{transition.duration}" },
	track: {
		background: "{content.border.color}",
		borderRadius: "{content.border.radius}",
		size: "3px"
	},
	range: { background: "{primary.color}" },
	handle: {
		width: "20px",
		height: "20px",
		borderRadius: "50%",
		background: "{content.border.color}",
		hoverBackground: "{content.border.color}",
		content: {
			borderRadius: "50%",
			hoverBackground: "{content.background}",
			width: "16px",
			height: "16px",
			shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.08), 0px 1px 1px 0px rgba(0, 0, 0, 0.14)"
		},
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	colorScheme: {
		light: { handle: { content: { background: "{surface.0}" } } },
		dark: { handle: { content: { background: "{surface.950}" } } }
	}
}, lr = { root: {
	gap: "0.5rem",
	transitionDuration: "{transition.duration}"
} }, ur = { root: {
	borderRadius: "{form.field.border.radius}",
	roundedBorderRadius: "2rem",
	raisedShadow: "0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)"
} }, dr = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		transitionDuration: "{transition.duration}"
	},
	gutter: { background: "{content.border.color}" },
	handle: {
		size: "24px",
		background: "transparent",
		borderRadius: "{content.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	}
}, fr = {
	root: { transitionDuration: "{transition.duration}" },
	separator: {
		background: "{content.border.color}",
		activeBackground: "{primary.color}",
		margin: "0 0 0 1.625rem",
		size: "2px"
	},
	step: {
		padding: "0.5rem",
		gap: "1rem"
	},
	stepHeader: {
		padding: "0",
		borderRadius: "{content.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		},
		gap: "0.5rem"
	},
	stepTitle: {
		color: "{text.muted.color}",
		activeColor: "{primary.color}",
		fontWeight: "500"
	},
	stepNumber: {
		background: "{content.background}",
		activeBackground: "{content.background}",
		borderColor: "{content.border.color}",
		activeBorderColor: "{content.border.color}",
		color: "{text.muted.color}",
		activeColor: "{primary.color}",
		size: "2rem",
		fontSize: "1.143rem",
		fontWeight: "500",
		borderRadius: "50%",
		shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)"
	},
	steppanels: { padding: "0.875rem 0.5rem 1.125rem 0.5rem" },
	steppanel: {
		background: "{content.background}",
		color: "{content.color}",
		padding: "0",
		indent: "1rem"
	}
}, pr = {
	root: { transitionDuration: "{transition.duration}" },
	separator: { background: "{content.border.color}" },
	itemLink: {
		borderRadius: "{content.border.radius}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		},
		gap: "0.5rem"
	},
	itemLabel: {
		color: "{text.muted.color}",
		activeColor: "{primary.color}",
		fontWeight: "500"
	},
	itemNumber: {
		background: "{content.background}",
		activeBackground: "{content.background}",
		borderColor: "{content.border.color}",
		activeBorderColor: "{content.border.color}",
		color: "{text.muted.color}",
		activeColor: "{primary.color}",
		size: "2rem",
		fontSize: "1.143rem",
		fontWeight: "500",
		borderRadius: "50%",
		shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)"
	}
}, mr = {
	root: { transitionDuration: "{transition.duration}" },
	tablist: {
		borderWidth: "0 0 1px 0",
		background: "{content.background}",
		borderColor: "{content.border.color}"
	},
	item: {
		background: "transparent",
		hoverBackground: "transparent",
		activeBackground: "transparent",
		borderWidth: "0 0 1px 0",
		borderColor: "{content.border.color}",
		hoverBorderColor: "{content.border.color}",
		activeBorderColor: "{primary.color}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		activeColor: "{primary.color}",
		padding: "1rem 1.125rem",
		fontWeight: "600",
		margin: "0 0 -1px 0",
		gap: "0.5rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	itemIcon: {
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		activeColor: "{primary.color}"
	},
	activeBar: {
		height: "1px",
		bottom: "-1px",
		background: "{primary.color}"
	}
}, hr = {
	root: { transitionDuration: "{transition.duration}" },
	tablist: {
		borderWidth: "0 0 1px 0",
		background: "{content.background}",
		borderColor: "{content.border.color}"
	},
	tab: {
		background: "transparent",
		hoverBackground: "transparent",
		activeBackground: "transparent",
		borderWidth: "0 0 1px 0",
		borderColor: "{content.border.color}",
		hoverBorderColor: "{content.border.color}",
		activeBorderColor: "{primary.color}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		activeColor: "{primary.color}",
		padding: "1rem 1.125rem",
		fontWeight: "600",
		margin: "0 0 -1px 0",
		gap: "0.5rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		}
	},
	tabpanel: {
		background: "{content.background}",
		color: "{content.color}",
		padding: "0.875rem 1.125rem 1.125rem 1.125rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "inset {focus.ring.shadow}"
		}
	},
	navButton: {
		background: "{content.background}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		width: "2.5rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		}
	},
	activeBar: {
		height: "1px",
		bottom: "-1px",
		background: "{primary.color}"
	},
	colorScheme: {
		light: { navButton: { shadow: "0px 0px 10px 50px rgba(255, 255, 255, 0.6)" } },
		dark: { navButton: { shadow: "0px 0px 10px 50px color-mix(in srgb, {content.background}, transparent 50%)" } }
	}
}, gr = {
	root: { transitionDuration: "{transition.duration}" },
	tabList: {
		background: "{content.background}",
		borderColor: "{content.border.color}"
	},
	tab: {
		borderColor: "{content.border.color}",
		activeBorderColor: "{primary.color}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		activeColor: "{primary.color}"
	},
	tabPanel: {
		background: "{content.background}",
		color: "{content.color}"
	},
	navButton: {
		background: "{content.background}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}"
	},
	colorScheme: {
		light: { navButton: { shadow: "0px 0px 10px 50px rgba(255, 255, 255, 0.6)" } },
		dark: { navButton: { shadow: "0px 0px 10px 50px color-mix(in srgb, {content.background}, transparent 50%)" } }
	}
}, _r = {
	root: {
		fontSize: "0.875rem",
		fontWeight: "700",
		padding: "0.25rem 0.5rem",
		gap: "0.25rem",
		borderRadius: "{content.border.radius}",
		roundedBorderRadius: "{border.radius.xl}"
	},
	icon: { size: "0.75rem" },
	colorScheme: {
		light: {
			primary: {
				background: "{primary.100}",
				color: "{primary.700}"
			},
			secondary: {
				background: "{surface.100}",
				color: "{surface.600}"
			},
			success: {
				background: "{green.100}",
				color: "{green.700}"
			},
			info: {
				background: "{sky.100}",
				color: "{sky.700}"
			},
			warn: {
				background: "{orange.100}",
				color: "{orange.700}"
			},
			danger: {
				background: "{red.100}",
				color: "{red.700}"
			},
			contrast: {
				background: "{surface.950}",
				color: "{surface.0}"
			}
		},
		dark: {
			primary: {
				background: "color-mix(in srgb, {primary.500}, transparent 84%)",
				color: "{primary.300}"
			},
			secondary: {
				background: "{surface.800}",
				color: "{surface.300}"
			},
			success: {
				background: "color-mix(in srgb, {green.500}, transparent 84%)",
				color: "{green.300}"
			},
			info: {
				background: "color-mix(in srgb, {sky.500}, transparent 84%)",
				color: "{sky.300}"
			},
			warn: {
				background: "color-mix(in srgb, {orange.500}, transparent 84%)",
				color: "{orange.300}"
			},
			danger: {
				background: "color-mix(in srgb, {red.500}, transparent 84%)",
				color: "{red.300}"
			},
			contrast: {
				background: "{surface.0}",
				color: "{surface.950}"
			}
		}
	}
}, vr = {
	root: {
		background: "{form.field.background}",
		borderColor: "{form.field.border.color}",
		color: "{form.field.color}",
		height: "18rem",
		padding: "{form.field.padding.y} {form.field.padding.x}",
		borderRadius: "{form.field.border.radius}"
	},
	prompt: { gap: "0.25rem" },
	commandResponse: { margin: "2px 0" }
}, yr = { root: {
	background: "{form.field.background}",
	disabledBackground: "{form.field.disabled.background}",
	filledBackground: "{form.field.filled.background}",
	filledHoverBackground: "{form.field.filled.hover.background}",
	filledFocusBackground: "{form.field.filled.focus.background}",
	borderColor: "{form.field.border.color}",
	hoverBorderColor: "{form.field.hover.border.color}",
	focusBorderColor: "{form.field.focus.border.color}",
	invalidBorderColor: "{form.field.invalid.border.color}",
	color: "{form.field.color}",
	disabledColor: "{form.field.disabled.color}",
	placeholderColor: "{form.field.placeholder.color}",
	invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
	shadow: "{form.field.shadow}",
	paddingX: "{form.field.padding.x}",
	paddingY: "{form.field.padding.y}",
	borderRadius: "{form.field.border.radius}",
	focusRing: {
		width: "{form.field.focus.ring.width}",
		style: "{form.field.focus.ring.style}",
		color: "{form.field.focus.ring.color}",
		offset: "{form.field.focus.ring.offset}",
		shadow: "{form.field.focus.ring.shadow}"
	},
	transitionDuration: "{form.field.transition.duration}",
	sm: {
		fontSize: "{form.field.sm.font.size}",
		paddingX: "{form.field.sm.padding.x}",
		paddingY: "{form.field.sm.padding.y}"
	},
	lg: {
		fontSize: "{form.field.lg.font.size}",
		paddingX: "{form.field.lg.padding.x}",
		paddingY: "{form.field.lg.padding.y}"
	}
} }, br = {
	root: {
		background: "{content.background}",
		borderColor: "{content.border.color}",
		color: "{content.color}",
		borderRadius: "{content.border.radius}",
		shadow: "{overlay.navigation.shadow}",
		transitionDuration: "{transition.duration}"
	},
	list: {
		padding: "{navigation.list.padding}",
		gap: "{navigation.list.gap}"
	},
	item: {
		focusBackground: "{navigation.item.focus.background}",
		activeBackground: "{navigation.item.active.background}",
		color: "{navigation.item.color}",
		focusColor: "{navigation.item.focus.color}",
		activeColor: "{navigation.item.active.color}",
		padding: "{navigation.item.padding}",
		borderRadius: "{navigation.item.border.radius}",
		gap: "{navigation.item.gap}",
		icon: {
			color: "{navigation.item.icon.color}",
			focusColor: "{navigation.item.icon.focus.color}",
			activeColor: "{navigation.item.icon.active.color}"
		}
	},
	submenu: { mobileIndent: "1rem" },
	submenuIcon: {
		size: "{navigation.submenu.icon.size}",
		color: "{navigation.submenu.icon.color}",
		focusColor: "{navigation.submenu.icon.focus.color}",
		activeColor: "{navigation.submenu.icon.active.color}"
	},
	separator: { borderColor: "{content.border.color}" }
}, xr = {
	event: { minHeight: "5rem" },
	horizontal: { eventContent: { padding: "1rem 0" } },
	vertical: { eventContent: { padding: "0 1rem" } },
	eventMarker: {
		size: "1.125rem",
		borderRadius: "50%",
		borderWidth: "2px",
		background: "{content.background}",
		borderColor: "{content.border.color}",
		content: {
			borderRadius: "50%",
			size: "0.375rem",
			background: "{primary.color}",
			insetShadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)"
		}
	},
	eventConnector: {
		color: "{content.border.color}",
		size: "2px"
	}
}, Sr = {
	root: {
		width: "25rem",
		borderRadius: "{content.border.radius}",
		borderWidth: "1px",
		transitionDuration: "{transition.duration}"
	},
	icon: { size: "1.125rem" },
	content: {
		padding: "{overlay.popover.padding}",
		gap: "0.5rem"
	},
	text: { gap: "0.5rem" },
	summary: {
		fontWeight: "500",
		fontSize: "1rem"
	},
	detail: {
		fontWeight: "500",
		fontSize: "0.875rem"
	},
	closeButton: {
		width: "1.75rem",
		height: "1.75rem",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			offset: "{focus.ring.offset}"
		}
	},
	closeIcon: { size: "1rem" },
	colorScheme: {
		light: {
			root: { blur: "1.5px" },
			info: {
				background: "color-mix(in srgb, {blue.50}, transparent 5%)",
				borderColor: "{blue.200}",
				color: "{blue.600}",
				detailColor: "{surface.700}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{blue.100}",
					focusRing: {
						color: "{blue.600}",
						shadow: "none"
					}
				}
			},
			success: {
				background: "color-mix(in srgb, {green.50}, transparent 5%)",
				borderColor: "{green.200}",
				color: "{green.600}",
				detailColor: "{surface.700}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{green.100}",
					focusRing: {
						color: "{green.600}",
						shadow: "none"
					}
				}
			},
			warn: {
				background: "color-mix(in srgb,{yellow.50}, transparent 5%)",
				borderColor: "{yellow.200}",
				color: "{yellow.600}",
				detailColor: "{surface.700}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{yellow.100}",
					focusRing: {
						color: "{yellow.600}",
						shadow: "none"
					}
				}
			},
			error: {
				background: "color-mix(in srgb, {red.50}, transparent 5%)",
				borderColor: "{red.200}",
				color: "{red.600}",
				detailColor: "{surface.700}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{red.100}",
					focusRing: {
						color: "{red.600}",
						shadow: "none"
					}
				}
			},
			secondary: {
				background: "{surface.100}",
				borderColor: "{surface.200}",
				color: "{surface.600}",
				detailColor: "{surface.700}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.200}",
					focusRing: {
						color: "{surface.600}",
						shadow: "none"
					}
				}
			},
			contrast: {
				background: "{surface.900}",
				borderColor: "{surface.950}",
				color: "{surface.50}",
				detailColor: "{surface.0}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.800}",
					focusRing: {
						color: "{surface.50}",
						shadow: "none"
					}
				}
			}
		},
		dark: {
			root: { blur: "10px" },
			info: {
				background: "color-mix(in srgb, {blue.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {blue.700}, transparent 64%)",
				color: "{blue.500}",
				detailColor: "{surface.0}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{blue.500}",
						shadow: "none"
					}
				}
			},
			success: {
				background: "color-mix(in srgb, {green.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {green.700}, transparent 64%)",
				color: "{green.500}",
				detailColor: "{surface.0}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{green.500}",
						shadow: "none"
					}
				}
			},
			warn: {
				background: "color-mix(in srgb, {yellow.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {yellow.700}, transparent 64%)",
				color: "{yellow.500}",
				detailColor: "{surface.0}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{yellow.500}",
						shadow: "none"
					}
				}
			},
			error: {
				background: "color-mix(in srgb, {red.500}, transparent 84%)",
				borderColor: "color-mix(in srgb, {red.700}, transparent 64%)",
				color: "{red.500}",
				detailColor: "{surface.0}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "rgba(255, 255, 255, 0.05)",
					focusRing: {
						color: "{red.500}",
						shadow: "none"
					}
				}
			},
			secondary: {
				background: "{surface.800}",
				borderColor: "{surface.700}",
				color: "{surface.300}",
				detailColor: "{surface.0}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.700}",
					focusRing: {
						color: "{surface.300}",
						shadow: "none"
					}
				}
			},
			contrast: {
				background: "{surface.0}",
				borderColor: "{surface.100}",
				color: "{surface.950}",
				detailColor: "{surface.950}",
				shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)",
				closeButton: {
					hoverBackground: "{surface.100}",
					focusRing: {
						color: "{surface.950}",
						shadow: "none"
					}
				}
			}
		}
	}
}, Cr = {
	root: {
		padding: "0.25rem",
		borderRadius: "{content.border.radius}",
		gap: "0.5rem",
		fontWeight: "500",
		disabledBackground: "{form.field.disabled.background}",
		disabledBorderColor: "{form.field.disabled.background}",
		disabledColor: "{form.field.disabled.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}",
		sm: {
			fontSize: "{form.field.sm.font.size}",
			padding: "0.25rem"
		},
		lg: {
			fontSize: "{form.field.lg.font.size}",
			padding: "0.25rem"
		}
	},
	icon: { disabledColor: "{form.field.disabled.color}" },
	content: {
		padding: "0.25rem 0.75rem",
		borderRadius: "{content.border.radius}",
		checkedShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.02), 0px 1px 2px 0px rgba(0, 0, 0, 0.04)",
		sm: { padding: "0.25rem 0.75rem" },
		lg: { padding: "0.25rem 0.75rem" }
	},
	colorScheme: {
		light: {
			root: {
				background: "{surface.100}",
				checkedBackground: "{surface.100}",
				hoverBackground: "{surface.100}",
				borderColor: "{surface.100}",
				color: "{surface.500}",
				hoverColor: "{surface.700}",
				checkedColor: "{surface.900}",
				checkedBorderColor: "{surface.100}"
			},
			content: { checkedBackground: "{surface.0}" },
			icon: {
				color: "{surface.500}",
				hoverColor: "{surface.700}",
				checkedColor: "{surface.900}"
			}
		},
		dark: {
			root: {
				background: "{surface.950}",
				checkedBackground: "{surface.950}",
				hoverBackground: "{surface.950}",
				borderColor: "{surface.950}",
				color: "{surface.400}",
				hoverColor: "{surface.300}",
				checkedColor: "{surface.0}",
				checkedBorderColor: "{surface.950}"
			},
			content: { checkedBackground: "{surface.800}" },
			icon: {
				color: "{surface.400}",
				hoverColor: "{surface.300}",
				checkedColor: "{surface.0}"
			}
		}
	}
}, wr = {
	root: {
		width: "2.5rem",
		height: "1.5rem",
		borderRadius: "30px",
		gap: "0.25rem",
		shadow: "{form.field.shadow}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		},
		borderWidth: "1px",
		borderColor: "transparent",
		hoverBorderColor: "transparent",
		checkedBorderColor: "transparent",
		checkedHoverBorderColor: "transparent",
		invalidBorderColor: "{form.field.invalid.border.color}",
		transitionDuration: "{form.field.transition.duration}",
		slideDuration: "0.2s"
	},
	handle: {
		borderRadius: "50%",
		size: "1rem"
	},
	colorScheme: {
		light: {
			root: {
				background: "{surface.300}",
				disabledBackground: "{form.field.disabled.background}",
				hoverBackground: "{surface.400}",
				checkedBackground: "{primary.color}",
				checkedHoverBackground: "{primary.hover.color}"
			},
			handle: {
				background: "{surface.0}",
				disabledBackground: "{form.field.disabled.color}",
				hoverBackground: "{surface.0}",
				checkedBackground: "{surface.0}",
				checkedHoverBackground: "{surface.0}",
				color: "{text.muted.color}",
				hoverColor: "{text.color}",
				checkedColor: "{primary.color}",
				checkedHoverColor: "{primary.hover.color}"
			}
		},
		dark: {
			root: {
				background: "{surface.700}",
				disabledBackground: "{surface.600}",
				hoverBackground: "{surface.600}",
				checkedBackground: "{primary.color}",
				checkedHoverBackground: "{primary.hover.color}"
			},
			handle: {
				background: "{surface.400}",
				disabledBackground: "{surface.900}",
				hoverBackground: "{surface.300}",
				checkedBackground: "{surface.900}",
				checkedHoverBackground: "{surface.900}",
				color: "{surface.900}",
				hoverColor: "{surface.800}",
				checkedColor: "{primary.color}",
				checkedHoverColor: "{primary.hover.color}"
			}
		}
	}
}, Tr = { root: {
	background: "{content.background}",
	borderColor: "{content.border.color}",
	borderRadius: "{content.border.radius}",
	color: "{content.color}",
	gap: "0.5rem",
	padding: "0.75rem"
} }, Er = {
	root: {
		maxWidth: "12.5rem",
		gutter: "0.25rem",
		shadow: "{overlay.popover.shadow}",
		padding: "0.5rem 0.75rem",
		borderRadius: "{overlay.popover.border.radius}"
	},
	colorScheme: {
		light: { root: {
			background: "{surface.700}",
			color: "{surface.0}"
		} },
		dark: { root: {
			background: "{surface.700}",
			color: "{surface.0}"
		} }
	}
}, Dr = {
	root: {
		background: "{content.background}",
		color: "{content.color}",
		padding: "1rem",
		gap: "2px",
		indent: "1rem",
		transitionDuration: "{transition.duration}"
	},
	node: {
		padding: "0.25rem 0.5rem",
		borderRadius: "{content.border.radius}",
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{highlight.background}",
		color: "{text.color}",
		hoverColor: "{text.hover.color}",
		selectedColor: "{highlight.color}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		},
		gap: "0.25rem"
	},
	nodeIcon: {
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}",
		selectedColor: "{highlight.color}"
	},
	nodeToggleButton: {
		borderRadius: "50%",
		size: "1.75rem",
		hoverBackground: "{content.hover.background}",
		selectedHoverBackground: "{content.background}",
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}",
		selectedHoverColor: "{primary.color}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	loadingIcon: { size: "2rem" },
	filter: { margin: "0 0 0.5rem 0" },
	css: "\n    .p-tree-mask.p-overlay-mask {\n        --px-mask-background: light-dark(rgba(255,255,255,0.5),rgba(0,0,0,0.3));\n    }\n"
}, Or = {
	root: {
		background: "{form.field.background}",
		disabledBackground: "{form.field.disabled.background}",
		filledBackground: "{form.field.filled.background}",
		filledHoverBackground: "{form.field.filled.hover.background}",
		filledFocusBackground: "{form.field.filled.focus.background}",
		borderColor: "{form.field.border.color}",
		hoverBorderColor: "{form.field.hover.border.color}",
		focusBorderColor: "{form.field.focus.border.color}",
		invalidBorderColor: "{form.field.invalid.border.color}",
		color: "{form.field.color}",
		disabledColor: "{form.field.disabled.color}",
		placeholderColor: "{form.field.placeholder.color}",
		invalidPlaceholderColor: "{form.field.invalid.placeholder.color}",
		shadow: "{form.field.shadow}",
		paddingX: "{form.field.padding.x}",
		paddingY: "{form.field.padding.y}",
		borderRadius: "{form.field.border.radius}",
		focusRing: {
			width: "{form.field.focus.ring.width}",
			style: "{form.field.focus.ring.style}",
			color: "{form.field.focus.ring.color}",
			offset: "{form.field.focus.ring.offset}",
			shadow: "{form.field.focus.ring.shadow}"
		},
		transitionDuration: "{form.field.transition.duration}",
		sm: {
			fontSize: "{form.field.sm.font.size}",
			paddingX: "{form.field.sm.padding.x}",
			paddingY: "{form.field.sm.padding.y}"
		},
		lg: {
			fontSize: "{form.field.lg.font.size}",
			paddingX: "{form.field.lg.padding.x}",
			paddingY: "{form.field.lg.padding.y}"
		}
	},
	dropdown: {
		width: "2.5rem",
		color: "{form.field.icon.color}"
	},
	overlay: {
		background: "{overlay.select.background}",
		borderColor: "{overlay.select.border.color}",
		borderRadius: "{overlay.select.border.radius}",
		color: "{overlay.select.color}",
		shadow: "{overlay.select.shadow}"
	},
	tree: { padding: "{list.padding}" },
	emptyMessage: { padding: "{list.option.padding}" },
	chip: { borderRadius: "{border.radius.sm}" },
	clearIcon: { color: "{form.field.icon.color}" }
}, kr = {
	root: { transitionDuration: "{transition.duration}" },
	header: {
		background: "{content.background}",
		borderColor: "{treetable.border.color}",
		color: "{content.color}",
		borderWidth: "0 0 1px 0",
		padding: "0.75rem 1rem"
	},
	headerCell: {
		background: "{content.background}",
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{highlight.background}",
		borderColor: "{treetable.border.color}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		selectedColor: "{highlight.color}",
		gap: "0.5rem",
		padding: "0.75rem 1rem",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		}
	},
	columnTitle: { fontWeight: "600" },
	row: {
		background: "{content.background}",
		hoverBackground: "{content.hover.background}",
		selectedBackground: "{highlight.background}",
		color: "{content.color}",
		hoverColor: "{content.hover.color}",
		selectedColor: "{highlight.color}",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "-1px",
			shadow: "{focus.ring.shadow}"
		}
	},
	bodyCell: {
		borderColor: "{treetable.border.color}",
		padding: "0.75rem 1rem",
		gap: "0.5rem"
	},
	footerCell: {
		background: "{content.background}",
		borderColor: "{treetable.border.color}",
		color: "{content.color}",
		padding: "0.75rem 1rem"
	},
	columnFooter: { fontWeight: "600" },
	footer: {
		background: "{content.background}",
		borderColor: "{treetable.border.color}",
		color: "{content.color}",
		borderWidth: "0 0 1px 0",
		padding: "0.75rem 1rem"
	},
	columnResizer: { width: "0.5rem" },
	resizeIndicator: {
		width: "1px",
		color: "{primary.color}"
	},
	sortIcon: {
		color: "{text.muted.color}",
		hoverColor: "{text.hover.muted.color}",
		size: "0.875rem"
	},
	loadingIcon: { size: "2rem" },
	nodeToggleButton: {
		hoverBackground: "{content.hover.background}",
		selectedHoverBackground: "{content.background}",
		color: "{text.muted.color}",
		hoverColor: "{text.color}",
		selectedHoverColor: "{primary.color}",
		size: "1.75rem",
		borderRadius: "50%",
		focusRing: {
			width: "{focus.ring.width}",
			style: "{focus.ring.style}",
			color: "{focus.ring.color}",
			offset: "{focus.ring.offset}",
			shadow: "{focus.ring.shadow}"
		}
	},
	paginatorTop: {
		borderColor: "{content.border.color}",
		borderWidth: "0 0 1px 0"
	},
	paginatorBottom: {
		borderColor: "{content.border.color}",
		borderWidth: "0 0 1px 0"
	},
	colorScheme: {
		light: {
			root: { borderColor: "{content.border.color}" },
			bodyCell: { selectedBorderColor: "{primary.100}" }
		},
		dark: {
			root: { borderColor: "{surface.800}" },
			bodyCell: { selectedBorderColor: "{primary.900}" }
		}
	},
	css: "\n    .p-treetable-mask.p-overlay-mask {\n        --px-mask-background: light-dark(rgba(255,255,255,0.5),rgba(0,0,0,0.3));\n    }\n"
}, Ar = { loader: {
	mask: {
		background: "{content.background}",
		color: "{text.muted.color}"
	},
	icon: { size: "2rem" }
} }, jr = Object.defineProperty, Mr = Object.defineProperties, Nr = Object.getOwnPropertyDescriptors, Pr = Object.getOwnPropertySymbols, Fr = Object.prototype.hasOwnProperty, Ir = Object.prototype.propertyIsEnumerable, Lr = (e, t, n) => t in e ? jr(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Rr, zr = ((...e) => Ge(...e))((Rr = ((e, t) => {
	for (var n in t ||= {}) Fr.call(t, n) && Lr(e, n, t[n]);
	if (Pr) for (var n of Pr(t)) Ir.call(t, n) && Lr(e, n, t[n]);
	return e;
})({}, Qt), Mr(Rr, Nr({
	components: {
		accordion: Jt,
		autocomplete: Yt,
		avatar: Xt,
		badge: Zt,
		blockui: $t,
		breadcrumb: en,
		button: tn,
		card: nn,
		carousel: rn,
		cascadeselect: an,
		checkbox: on,
		chip: sn,
		colorpicker: cn,
		confirmdialog: ln,
		confirmpopup: un,
		contextmenu: dn,
		datatable: pn,
		dataview: mn,
		datepicker: hn,
		dialog: gn,
		divider: _n,
		dock: vn,
		drawer: yn,
		editor: bn,
		fieldset: xn,
		fileupload: Sn,
		floatlabel: Cn,
		galleria: wn,
		iconfield: Tn,
		iftalabel: En,
		image: Dn,
		imagecompare: On,
		inlinemessage: kn,
		inplace: An,
		inputchips: jn,
		inputgroup: Mn,
		inputnumber: Nn,
		inputotp: Pn,
		inputtext: Fn,
		knob: In,
		listbox: Ln,
		megamenu: Rn,
		menu: zn,
		menubar: Bn,
		message: Vn,
		metergroup: Hn,
		multiselect: Un,
		orderlist: Wn,
		organizationchart: Gn,
		overlaybadge: Kn,
		paginator: qn,
		panel: Jn,
		panelmenu: Yn,
		password: Xn,
		picklist: Zn,
		popover: Qn,
		progressbar: $n,
		progressspinner: er,
		radiobutton: tr,
		rating: nr,
		ripple: rr,
		scrollpanel: ir,
		select: ar,
		selectbutton: or,
		skeleton: sr,
		slider: cr,
		speeddial: lr,
		splitbutton: ur,
		splitter: dr,
		stepper: fr,
		steps: pr,
		tabmenu: mr,
		tabs: hr,
		tabview: gr,
		tag: _r,
		terminal: vr,
		textarea: yr,
		tieredmenu: br,
		timeline: xr,
		toast: Sr,
		togglebutton: Cr,
		toggleswitch: wr,
		toolbar: Tr,
		tooltip: Er,
		tree: Dr,
		treeselect: Or,
		treetable: kr,
		virtualscroller: Ar
	},
	css: fn
}))), { semantic: { primary: {
	50: "#67C8DB",
	100: "#56C2D7",
	200: "#46BCD4",
	300: "#2EA4BC",
	400: "#178DA5",
	500: "#00768E",
	600: "#005F77",
	700: "#004860",
	800: "#003048",
	900: "#001931"
} } }), Br = {
	accept: "Aceitar",
	reject: "Cancelar",
	dayNames: [
		"Domingo",
		"Segunda",
		"Terça",
		"Quarta",
		"Quinta",
		"Sexta",
		"Sábado"
	],
	dayNamesShort: [
		"Dom",
		"Seg",
		"Ter",
		"Qua",
		"Qui",
		"Sex",
		"Sáb"
	],
	dayNamesMin: [
		"D",
		"S",
		"T",
		"Q",
		"Q",
		"S",
		"S"
	],
	monthNames: [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro"
	],
	monthNamesShort: [
		"Jan",
		"Fev",
		"Mar",
		"Abr",
		"Mai",
		"Jun",
		"Jul",
		"Ago",
		"Set",
		"Out",
		"Nov",
		"Dez"
	],
	firstDayOfWeek: 0,
	dateFormat: "dd/mm/yy",
	today: "Hoje",
	clear: "Limpar",
	weekHeader: "Sem",
	year: "Ano",
	month: "Mês",
	week: "Semana",
	day: "Dia",
	fileSizeTypes: [
		"B",
		"KB",
		"MB",
		"GB",
		"TB",
		"PB",
		"EB",
		"ZB",
		"YB"
	]
}, q = {
	_loadedStyleNames: /* @__PURE__ */ new Set(),
	getLoadedStyleNames: function() {
		return this._loadedStyleNames;
	},
	isStyleNameLoaded: function(e) {
		return this._loadedStyleNames.has(e);
	},
	setLoadedStyleName: function(e) {
		this._loadedStyleNames.add(e);
	},
	deleteLoadedStyleName: function(e) {
		this._loadedStyleNames.delete(e);
	},
	clearLoadedStyleNames: function() {
		this._loadedStyleNames.clear();
	}
};
//#endregion
//#region node_modules/@primevue/core/useattrselector/index.mjs
function Vr() {
	return `${arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "pc"}${T().replace("v-", "").replaceAll("-", "_")}`;
}
//#endregion
//#region node_modules/@primevue/core/basecomponent/index.mjs
var Hr = G.extend({ name: "common" });
function Ur(e) {
	"@babel/helpers - typeof";
	return Ur = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Ur(e);
}
function Wr(e) {
	return Zr(e) || Gr(e) || Jr(e) || qr();
}
function Gr(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Kr(e, t) {
	return Zr(e) || Xr(e, t) || Jr(e, t) || qr();
}
function qr() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Jr(e, t) {
	if (e) {
		if (typeof e == "string") return Yr(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Yr(e, t) : void 0;
	}
}
function Yr(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Xr(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t === 0) {
				if (Object(n) !== n) return;
				c = !1;
			} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function Zr(e) {
	if (Array.isArray(e)) return e;
}
function Qr(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function J(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Qr(Object(n), !0).forEach(function(t) {
			$r(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Qr(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function $r(e, t, n) {
	return (t = ei(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function ei(e) {
	var t = ti(e, "string");
	return Ur(t) == "symbol" ? t : t + "";
}
function ti(e, t) {
	if (Ur(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (Ur(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Y = {
	name: "BaseComponent",
	props: {
		pt: {
			type: Object,
			default: void 0
		},
		ptOptions: {
			type: Object,
			default: void 0
		},
		unstyled: {
			type: Boolean,
			default: void 0
		},
		dt: {
			type: Object,
			default: void 0
		}
	},
	inject: { $parentInstance: { default: void 0 } },
	watch: {
		isUnstyled: {
			immediate: !0,
			handler: function(e) {
				B.off("theme:change", this._loadCoreStyles), e || (this._loadCoreStyles(), this._themeChangeListener(this._loadCoreStyles));
			}
		},
		dt: {
			immediate: !0,
			handler: function(e, t) {
				var n = this;
				B.off("theme:change", this._themeScopedListener), e ? (this._loadScopedThemeStyles(e), this._themeScopedListener = function() {
					return n._loadScopedThemeStyles(e);
				}, this._themeChangeListener(this._themeScopedListener)) : this._unloadScopedThemeStyles();
			}
		}
	},
	scopedStyleEl: void 0,
	rootEl: void 0,
	uid: void 0,
	$attrSelector: void 0,
	beforeCreate: function() {
		var e, t, n, r, i, a, o, s, c, l, u = this.pt?._usept, d = u ? (e = this.pt) == null || (e = e.originalValue) == null ? void 0 : e[this.$.type.name] : void 0;
		(n = (u ? (t = this.pt) == null || (t = t.value) == null ? void 0 : t[this.$.type.name] : this.pt) || d) == null || (n = n.hooks) == null || (r = n.onBeforeCreate) == null || r.call(n);
		var f = (i = this.$primevueConfig) == null || (i = i.pt) == null ? void 0 : i._usept, p = f ? (a = this.$primevue) == null || (a = a.config) == null || (a = a.pt) == null ? void 0 : a.originalValue : void 0;
		(c = (f ? (o = this.$primevue) == null || (o = o.config) == null || (o = o.pt) == null ? void 0 : o.value : (s = this.$primevue) == null || (s = s.config) == null ? void 0 : s.pt) || p) == null || (c = c[this.$.type.name]) == null || (c = c.hooks) == null || (l = c.onBeforeCreate) == null || l.call(c), this.$attrSelector = Vr(), this.uid = this.$attrs.id || this.$attrSelector.replace("pc", "pv_id_");
	},
	created: function() {
		this._hook("onCreated");
	},
	beforeMount: function() {
		this.rootEl = De(we(this.$el) ? this.$el : this.$el?.parentElement, `[${this.$attrSelector}]`), this.rootEl && (this.rootEl.$pc = J({
			name: this.$.type.name,
			attrSelector: this.$attrSelector
		}, this.$params)), this._loadStyles(), this._hook("onBeforeMount");
	},
	mounted: function() {
		this._hook("onMounted");
	},
	beforeUpdate: function() {
		this._hook("onBeforeUpdate");
	},
	updated: function() {
		this._hook("onUpdated");
	},
	beforeUnmount: function() {
		this._hook("onBeforeUnmount");
	},
	unmounted: function() {
		this._removeThemeListeners(), this._unloadScopedThemeStyles(), this._hook("onUnmounted");
	},
	methods: {
		_hook: function(e) {
			if (!this.$options.hostName) {
				var t = this._usePT(this._getPT(this.pt, this.$.type.name), this._getOptionValue, `hooks.${e}`), n = this._useDefaultPT(this._getOptionValue, `hooks.${e}`);
				t?.(), n?.();
			}
		},
		_mergeProps: function(e) {
			var t = [...arguments].slice(1);
			return oe(e) ? e.apply(void 0, t) : u.apply(void 0, t);
		},
		_load: function() {
			q.isStyleNameLoaded("base") || (G.loadCSS(this.$styleOptions), this._loadGlobalStyles(), q.setLoadedStyleName("base")), this._loadThemeStyles();
		},
		_loadStyles: function() {
			this._load(), this._themeChangeListener(this._load);
		},
		_loadCoreStyles: function() {
			var e;
			!q.isStyleNameLoaded(this.$style?.name) && (e = this.$style) != null && e.name && (Hr.loadCSS(this.$styleOptions), this.$options.style && this.$style.loadCSS(this.$styleOptions), q.setLoadedStyleName(this.$style.name));
		},
		_loadGlobalStyles: function() {
			var e = this._useGlobalPT(this._getOptionValue, "global.css", this.$params);
			j(e) && G.load(e, J({ name: "global" }, this.$styleOptions));
		},
		_loadThemeStyles: function() {
			var e;
			if (!(this.isUnstyled || this.$theme === "none")) {
				if (!U.isStyleNameLoaded("common")) {
					var t, n, r = ((t = this.$style) == null || (n = t.getCommonTheme) == null ? void 0 : n.call(t)) || {}, i = r.primitive, a = r.semantic, o = r.global, s = r.style;
					G.load(i?.css, J({ name: "primitive-variables" }, this.$styleOptions)), G.load(a?.css, J({ name: "semantic-variables" }, this.$styleOptions)), G.load(o?.css, J({ name: "global-variables" }, this.$styleOptions)), G.loadStyle(J({ name: "global-style" }, this.$styleOptions), s), U.setLoadedStyleName("common");
				}
				if (!U.isStyleNameLoaded(this.$style?.name) && (e = this.$style) != null && e.name) {
					var c, l, u, d, f = ((c = this.$style) == null || (l = c.getComponentTheme) == null ? void 0 : l.call(c)) || {}, p = f.css, m = f.style;
					(u = this.$style) == null || u.load(p, J({ name: `${this.$style.name}-variables` }, this.$styleOptions)), (d = this.$style) == null || d.loadStyle(J({ name: `${this.$style.name}-style` }, this.$styleOptions), m), U.setLoadedStyleName(this.$style.name);
				}
				if (!U.isStyleNameLoaded("layer-order")) {
					var h, g, ee = (h = this.$style) == null || (g = h.getLayerOrderThemeCSS) == null ? void 0 : g.call(h);
					G.load(ee, J({
						name: "layer-order",
						first: !0
					}, this.$styleOptions)), U.setLoadedStyleName("layer-order");
				}
			}
		},
		_loadScopedThemeStyles: function(e) {
			var t, n, r = (((t = this.$style) == null || (n = t.getPresetTheme) == null ? void 0 : n.call(t, e, `[${this.$attrSelector}]`)) || {}).css, i = this.$style?.load(r, J({ name: `${this.$attrSelector}-${this.$style.name}` }, this.$styleOptions));
			this.scopedStyleEl = i.el;
		},
		_unloadScopedThemeStyles: function() {
			var e;
			(e = this.scopedStyleEl) == null || (e = e.value) == null || e.remove();
		},
		_themeChangeListener: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : function() {};
			q.clearLoadedStyleNames(), B.on("theme:change", e);
		},
		_removeThemeListeners: function() {
			B.off("theme:change", this._loadCoreStyles), B.off("theme:change", this._load), B.off("theme:change", this._themeScopedListener);
		},
		_getHostInstance: function(e) {
			return e ? this.$options.hostName ? e.$.type.name === this.$options.hostName ? e : this._getHostInstance(e.$parentInstance) : e.$parentInstance : void 0;
		},
		_getPropValue: function(e) {
			return this[e] || this._getHostInstance(this)?.[e];
		},
		_getOptionValue: function(e) {
			return le(e, arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {});
		},
		_getPTValue: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !0, i = /./g.test(t) && !!n[t.split(".")[0]], a = this._getPropValue("ptOptions") || this.$primevueConfig?.ptOptions || {}, o = a.mergeSections, s = o === void 0 ? !0 : o, c = a.mergeProps, l = c === void 0 ? !1 : c, u = r ? i ? this._useGlobalPT(this._getPTClassValue, t, n) : this._useDefaultPT(this._getPTClassValue, t, n) : void 0, d = i ? void 0 : this._getPTSelf(e, this._getPTClassValue, t, J(J({}, n), {}, { global: u || {} })), f = this._getPTDatasets(t);
			return s || !s && d ? l ? this._mergeProps(l, u, d, f) : J(J(J({}, u), d), f) : J(J({}, d), f);
		},
		_getPTSelf: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = [...arguments].slice(1);
			return u(this._usePT.apply(this, [this._getPT(e, this.$name)].concat(t)), this._usePT.apply(this, [this.$_attrsPT].concat(t)));
		},
		_getPTDatasets: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t = "data-pc-", n = e === "root" && j(this.pt?.["data-pc-section"]);
			return e !== "transition" && J(J({}, e === "root" && J(J($r({}, `${t}name`, F(n ? this.pt?.["data-pc-section"] : this.$.type.name)), n && $r({}, `${t}extend`, F(this.$.type.name))), {}, $r({}, `${this.$attrSelector}`, ""))), {}, $r({}, `${t}section`, F(e)));
		},
		_getPTClassValue: function() {
			var e = this._getOptionValue.apply(this, arguments);
			return P(e) || ue(e) ? { class: e } : e;
		},
		_getPT: function(e) {
			var t = this, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", r = arguments.length > 2 ? arguments[2] : void 0, i = function(e) {
				var i = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1, a = r ? r(e) : e, o = F(n), s = F(t.$name);
				return (i && o === s ? void 0 : a?.[o]) ?? a;
			};
			return e != null && e.hasOwnProperty("_usept") ? {
				_usept: e._usept,
				originalValue: i(e.originalValue),
				value: i(e.value)
			} : i(e, !0);
		},
		_usePT: function(e, t, n, r) {
			var i = function(e) {
				return t(e, n, r);
			};
			if (e != null && e.hasOwnProperty("_usept")) {
				var a = e._usept || this.$primevueConfig?.ptOptions || {}, o = a.mergeSections, s = o === void 0 ? !0 : o, c = a.mergeProps, l = c === void 0 ? !1 : c, u = i(e.originalValue), d = i(e.value);
				return u === void 0 && d === void 0 ? void 0 : P(d) ? d : P(u) ? u : s || !s && d ? l ? this._mergeProps(l, u, d) : J(J({}, u), d) : d;
			}
			return i(e);
		},
		_useGlobalPT: function(e, t, n) {
			return this._usePT(this.globalPT, e, t, n);
		},
		_useDefaultPT: function(e, t, n) {
			return this._usePT(this.defaultPT, e, t, n);
		},
		ptm: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
			return this._getPTValue(this.pt, e, J(J({}, this.$params), t));
		},
		ptmi: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = u(this.$_attrsWithoutPT, this.ptm(e, t));
			return n != null && n.hasOwnProperty("id") && (n.id ??= this.$id), n;
		},
		ptmo: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
			return this._getPTValue(e, t, J({ instance: this }, n), !1);
		},
		cx: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
			return this.isUnstyled ? void 0 : this._getOptionValue(this.$style.classes, e, J(J({}, this.$params), t));
		},
		sx: function() {
			var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
			if (t) {
				var r = this._getOptionValue(this.$style.inlineStyles, e, J(J({}, this.$params), n));
				return [this._getOptionValue(Hr.inlineStyles, e, J(J({}, this.$params), n)), r];
			}
		}
	},
	computed: {
		globalPT: function() {
			var e = this;
			return this._getPT(this.$primevueConfig?.pt, void 0, function(t) {
				return N(t, { instance: e });
			});
		},
		defaultPT: function() {
			var e = this;
			return this._getPT(this.$primevueConfig?.pt, void 0, function(t) {
				return e._getOptionValue(t, e.$name, J({}, e.$params)) || N(t, J({}, e.$params));
			});
		},
		isUnstyled: function() {
			return this.unstyled === void 0 ? this.$primevueConfig?.unstyled : this.unstyled;
		},
		$id: function() {
			return this.$attrs.id || this.uid;
		},
		$inProps: function() {
			var e = Object.keys(this.$.vnode?.props || {});
			return Object.fromEntries(Object.entries(this.$props).filter(function(t) {
				var n = Kr(t, 1)[0];
				return e?.includes(n);
			}));
		},
		$theme: function() {
			return this.$primevueConfig?.theme;
		},
		$style: function() {
			return J(J({
				classes: void 0,
				inlineStyles: void 0,
				load: function() {},
				loadCSS: function() {},
				loadStyle: function() {}
			}, (this._getHostInstance(this) || {}).$style), this.$options.style);
		},
		$styleOptions: function() {
			var e;
			return { nonce: (e = this.$primevueConfig) == null || (e = e.csp) == null ? void 0 : e.nonce };
		},
		$primevueConfig: function() {
			return this.$primevue?.config;
		},
		$name: function() {
			return this.$options.hostName || this.$.type.name;
		},
		$params: function() {
			var e = this._getHostInstance(this) || this.$parent;
			return {
				instance: this,
				props: this.$props,
				state: this.$data,
				attrs: this.$attrs,
				parent: {
					instance: e,
					props: e?.$props,
					state: e?.$data,
					attrs: e?.$attrs
				}
			};
		},
		$_attrsPT: function() {
			return Object.entries(this.$attrs || {}).filter(function(e) {
				return Kr(e, 1)[0]?.startsWith("pt:");
			}).reduce(function(e, t) {
				var n = Kr(t, 2), r = n[0], i = n[1];
				return Yr(Wr(r.split(":"))).slice(1)?.reduce(function(e, t, n, r) {
					return !e[t] && (e[t] = n === r.length - 1 ? i : {}), e[t];
				}, e), e;
			}, {});
		},
		$_attrsWithoutPT: function() {
			return Object.entries(this.$attrs || {}).filter(function(e) {
				var t = Kr(e, 1)[0];
				return !(t != null && t.startsWith("pt:"));
			}).reduce(function(e, t) {
				var n = Kr(t, 2), r = n[0];
				return e[r] = n[1], e;
			}, {});
		}
	}
}, ni = G.extend({
	name: "baseicon",
	css: "\n.p-icon {\n    display: inline-block;\n    vertical-align: baseline;\n    flex-shrink: 0;\n}\n\n.p-icon-spin {\n    -webkit-animation: p-icon-spin 2s infinite linear;\n    animation: p-icon-spin 2s infinite linear;\n}\n\n@-webkit-keyframes p-icon-spin {\n    0% {\n        -webkit-transform: rotate(0deg);\n        transform: rotate(0deg);\n    }\n    100% {\n        -webkit-transform: rotate(359deg);\n        transform: rotate(359deg);\n    }\n}\n\n@keyframes p-icon-spin {\n    0% {\n        -webkit-transform: rotate(0deg);\n        transform: rotate(0deg);\n    }\n    100% {\n        -webkit-transform: rotate(359deg);\n        transform: rotate(359deg);\n    }\n}\n"
});
//#endregion
//#region node_modules/@primevue/icons/baseicon/index.mjs
function ri(e) {
	"@babel/helpers - typeof";
	return ri = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, ri(e);
}
function ii(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function ai(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? ii(Object(n), !0).forEach(function(t) {
			oi(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ii(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function oi(e, t, n) {
	return (t = si(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function si(e) {
	var t = ci(e, "string");
	return ri(t) == "symbol" ? t : t + "";
}
function ci(e, t) {
	if (ri(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (ri(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var li = {
	name: "BaseIcon",
	extends: Y,
	props: {
		label: {
			type: String,
			default: void 0
		},
		spin: {
			type: Boolean,
			default: !1
		}
	},
	style: ni,
	provide: function() {
		return {
			$pcIcon: this,
			$parentInstance: this
		};
	},
	methods: { pti: function() {
		var e = A(this.label);
		return ai(ai({}, !this.isUnstyled && { class: ["p-icon", { "p-icon-spin": this.spin }] }), {}, {
			role: e ? void 0 : "img",
			"aria-label": e ? void 0 : this.label,
			"aria-hidden": e
		});
	} }
}, ui = {
	name: "SpinnerIcon",
	extends: li
};
function di(e) {
	return hi(e) || mi(e) || pi(e) || fi();
}
function fi() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function pi(e, t) {
	if (e) {
		if (typeof e == "string") return gi(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? gi(e, t) : void 0;
	}
}
function mi(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function hi(e) {
	if (Array.isArray(e)) return gi(e);
}
function gi(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function _i(e, t, n, r, o, s) {
	return h(), i("svg", u({
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg"
	}, e.pti()), di(t[0] ||= [a("path", {
		d: "M6.99701 14C5.85441 13.999 4.72939 13.7186 3.72012 13.1832C2.71084 12.6478 1.84795 11.8737 1.20673 10.9284C0.565504 9.98305 0.165424 8.89526 0.041387 7.75989C-0.0826496 6.62453 0.073125 5.47607 0.495122 4.4147C0.917119 3.35333 1.59252 2.4113 2.46241 1.67077C3.33229 0.930247 4.37024 0.413729 5.4857 0.166275C6.60117 -0.0811796 7.76026 -0.0520535 8.86188 0.251112C9.9635 0.554278 10.9742 1.12227 11.8057 1.90555C11.915 2.01493 11.9764 2.16319 11.9764 2.31778C11.9764 2.47236 11.915 2.62062 11.8057 2.73C11.7521 2.78503 11.688 2.82877 11.6171 2.85864C11.5463 2.8885 11.4702 2.90389 11.3933 2.90389C11.3165 2.90389 11.2404 2.8885 11.1695 2.85864C11.0987 2.82877 11.0346 2.78503 10.9809 2.73C9.9998 1.81273 8.73246 1.26138 7.39226 1.16876C6.05206 1.07615 4.72086 1.44794 3.62279 2.22152C2.52471 2.99511 1.72683 4.12325 1.36345 5.41602C1.00008 6.70879 1.09342 8.08723 1.62775 9.31926C2.16209 10.5513 3.10478 11.5617 4.29713 12.1803C5.48947 12.7989 6.85865 12.988 8.17414 12.7157C9.48963 12.4435 10.6711 11.7264 11.5196 10.6854C12.3681 9.64432 12.8319 8.34282 12.8328 7C12.8328 6.84529 12.8943 6.69692 13.0038 6.58752C13.1132 6.47812 13.2616 6.41667 13.4164 6.41667C13.5712 6.41667 13.7196 6.47812 13.8291 6.58752C13.9385 6.69692 14 6.84529 14 7C14 8.85651 13.2622 10.637 11.9489 11.9497C10.6356 13.2625 8.85432 14 6.99701 14Z",
		fill: "currentColor"
	}, null, -1)]), 16);
}
ui.render = _i;
//#endregion
//#region node_modules/primevue/badge/style/index.mjs
var vi = G.extend({
	name: "badge",
	style: "\n    .p-badge {\n        display: inline-flex;\n        border-radius: dt('badge.border.radius');\n        align-items: center;\n        justify-content: center;\n        padding: dt('badge.padding');\n        background: dt('badge.primary.background');\n        color: dt('badge.primary.color');\n        font-size: dt('badge.font.size');\n        font-weight: dt('badge.font.weight');\n        min-width: dt('badge.min.width');\n        height: dt('badge.height');\n    }\n\n    .p-badge-dot {\n        width: dt('badge.dot.size');\n        min-width: dt('badge.dot.size');\n        height: dt('badge.dot.size');\n        border-radius: 50%;\n        padding: 0;\n    }\n\n    .p-badge-circle {\n        padding: 0;\n        border-radius: 50%;\n    }\n\n    .p-badge-secondary {\n        background: dt('badge.secondary.background');\n        color: dt('badge.secondary.color');\n    }\n\n    .p-badge-success {\n        background: dt('badge.success.background');\n        color: dt('badge.success.color');\n    }\n\n    .p-badge-info {\n        background: dt('badge.info.background');\n        color: dt('badge.info.color');\n    }\n\n    .p-badge-warn {\n        background: dt('badge.warn.background');\n        color: dt('badge.warn.color');\n    }\n\n    .p-badge-danger {\n        background: dt('badge.danger.background');\n        color: dt('badge.danger.color');\n    }\n\n    .p-badge-contrast {\n        background: dt('badge.contrast.background');\n        color: dt('badge.contrast.color');\n    }\n\n    .p-badge-sm {\n        font-size: dt('badge.sm.font.size');\n        min-width: dt('badge.sm.min.width');\n        height: dt('badge.sm.height');\n    }\n\n    .p-badge-lg {\n        font-size: dt('badge.lg.font.size');\n        min-width: dt('badge.lg.min.width');\n        height: dt('badge.lg.height');\n    }\n\n    .p-badge-xl {\n        font-size: dt('badge.xl.font.size');\n        min-width: dt('badge.xl.min.width');\n        height: dt('badge.xl.height');\n    }\n",
	classes: { root: function(e) {
		var t = e.props, n = e.instance;
		return ["p-badge p-component", {
			"p-badge-circle": j(t.value) && String(t.value).length === 1,
			"p-badge-dot": A(t.value) && !n.$slots.default,
			"p-badge-sm": t.size === "small",
			"p-badge-lg": t.size === "large",
			"p-badge-xl": t.size === "xlarge",
			"p-badge-info": t.severity === "info",
			"p-badge-success": t.severity === "success",
			"p-badge-warn": t.severity === "warn",
			"p-badge-danger": t.severity === "danger",
			"p-badge-secondary": t.severity === "secondary",
			"p-badge-contrast": t.severity === "contrast"
		}];
	} }
}), yi = {
	name: "BaseBadge",
	extends: Y,
	props: {
		value: {
			type: [String, Number],
			default: null
		},
		severity: {
			type: String,
			default: null
		},
		size: {
			type: String,
			default: null
		}
	},
	style: vi,
	provide: function() {
		return {
			$pcBadge: this,
			$parentInstance: this
		};
	}
};
function bi(e) {
	"@babel/helpers - typeof";
	return bi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, bi(e);
}
function xi(e, t, n) {
	return (t = Si(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Si(e) {
	var t = Ci(e, "string");
	return bi(t) == "symbol" ? t : t + "";
}
function Ci(e, t) {
	if (bi(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (bi(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var wi = {
	name: "Badge",
	extends: yi,
	inheritAttrs: !1,
	computed: { dataP: function() {
		return L(xi(xi({
			circle: this.value != null && String(this.value).length === 1,
			empty: this.value == null && !this.$slots.default
		}, this.severity, this.severity), this.size, this.size));
	} }
}, Ti = ["data-p"];
function Ei(e, t, n, r, a, s) {
	return h(), i("span", u({
		class: e.cx("root"),
		"data-p": s.dataP
	}, e.ptmi("root")), [v(e.$slots, "default", {}, function() {
		return [o(S(e.value), 1)];
	})], 16, Ti);
}
wi.render = Ei;
//#endregion
//#region node_modules/@primevue/core/basedirective/index.mjs
function Di(e) {
	"@babel/helpers - typeof";
	return Di = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Di(e);
}
function Oi(e, t) {
	return Ni(e) || Mi(e, t) || Ai(e, t) || ki();
}
function ki() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Ai(e, t) {
	if (e) {
		if (typeof e == "string") return ji(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ji(e, t) : void 0;
	}
}
function ji(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Mi(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t !== 0) for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function Ni(e) {
	if (Array.isArray(e)) return e;
}
function Pi(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function X(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Pi(Object(n), !0).forEach(function(t) {
			Fi(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Pi(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Fi(e, t, n) {
	return (t = Ii(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Ii(e) {
	var t = Li(e, "string");
	return Di(t) == "symbol" ? t : t + "";
}
function Li(e, t) {
	if (Di(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (Di(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Z = {
	_getMeta: function() {
		return [M(arguments.length <= 0 ? void 0 : arguments[0]) || arguments.length <= 0 ? void 0 : arguments[0], N(M(arguments.length <= 0 ? void 0 : arguments[0]) ? arguments.length <= 0 ? void 0 : arguments[0] : arguments.length <= 1 ? void 0 : arguments[1])];
	},
	_getConfig: function(e, t) {
		var n, r;
		return ((e == null || (n = e.instance) == null ? void 0 : n.$primevue) || (t == null || (r = t.ctx) == null || (r = r.appContext) == null || (r = r.config) == null || (r = r.globalProperties) == null ? void 0 : r.$primevue))?.config;
	},
	_getOptionValue: le,
	_getPTValue: function() {
		var e, t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "", i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}, a = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !0, o = function() {
			var e = Z._getOptionValue.apply(Z, arguments);
			return P(e) || ue(e) ? { class: e } : e;
		}, s = ((e = t.binding) == null || (e = e.value) == null ? void 0 : e.ptOptions) || t.$primevueConfig?.ptOptions || {}, c = s.mergeSections, l = c === void 0 ? !0 : c, u = s.mergeProps, d = u === void 0 ? !1 : u, f = a ? Z._useDefaultPT(t, t.defaultPT(), o, r, i) : void 0, p = Z._usePT(t, Z._getPT(n, t.$name), o, r, X(X({}, i), {}, { global: f || {} })), m = Z._getPTDatasets(t, r);
		return l || !l && p ? d ? Z._mergeProps(t, d, f, p, m) : X(X(X({}, f), p), m) : X(X({}, p), m);
	},
	_getPTDatasets: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n = "data-pc-";
		return X(X({}, t === "root" && Fi({}, `${n}name`, F(e.$name))), {}, Fi({}, `${n}section`, F(t)));
	},
	_getPT: function(e) {
		var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", n = arguments.length > 2 ? arguments[2] : void 0, r = function(e) {
			var r = n ? n(e) : e, i = F(t);
			return r?.[i] ?? r;
		};
		return e && Object.hasOwn(e, "_usept") ? {
			_usept: e._usept,
			originalValue: r(e.originalValue),
			value: r(e.value)
		} : r(e);
	},
	_usePT: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = arguments.length > 1 ? arguments[1] : void 0, n = arguments.length > 2 ? arguments[2] : void 0, r = arguments.length > 3 ? arguments[3] : void 0, i = arguments.length > 4 ? arguments[4] : void 0, a = function(e) {
			return n(e, r, i);
		};
		if (t && Object.hasOwn(t, "_usept")) {
			var o = t._usept || e.$primevueConfig?.ptOptions || {}, s = o.mergeSections, c = s === void 0 ? !0 : s, l = o.mergeProps, u = l === void 0 ? !1 : l, d = a(t.originalValue), f = a(t.value);
			return d === void 0 && f === void 0 ? void 0 : P(f) ? f : P(d) ? d : c || !c && f ? u ? Z._mergeProps(e, u, d, f) : X(X({}, d), f) : f;
		}
		return a(t);
	},
	_useDefaultPT: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = arguments.length > 2 ? arguments[2] : void 0, r = arguments.length > 3 ? arguments[3] : void 0, i = arguments.length > 4 ? arguments[4] : void 0;
		return Z._usePT(e, t, n, r, i);
	},
	_loadStyles: function() {
		var e, t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 ? arguments[1] : void 0, r = arguments.length > 2 ? arguments[2] : void 0, i = Z._getConfig(n, r), a = { nonce: i == null || (e = i.csp) == null ? void 0 : e.nonce };
		Z._loadCoreStyles(t, a), Z._loadThemeStyles(t, a), Z._loadScopedThemeStyles(t, a), Z._removeThemeListeners(t), t.$loadStyles = function() {
			return Z._loadThemeStyles(t, a);
		}, Z._themeChangeListener(t.$loadStyles);
	},
	_loadCoreStyles: function() {
		var e, t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 ? arguments[1] : void 0;
		if (!q.isStyleNameLoaded(t.$style?.name) && (e = t.$style) != null && e.name) {
			var r;
			G.loadCSS(n), (r = t.$style) == null || r.loadCSS(n), q.setLoadedStyleName(t.$style.name);
		}
	},
	_loadThemeStyles: function() {
		var e, t, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, r = arguments.length > 1 ? arguments[1] : void 0;
		if (!(n != null && n.isUnstyled() || (n == null || (e = n.theme) == null ? void 0 : e.call(n)) === "none")) {
			if (!U.isStyleNameLoaded("common")) {
				var i, a, o = ((i = n.$style) == null || (a = i.getCommonTheme) == null ? void 0 : a.call(i)) || {}, s = o.primitive, c = o.semantic, l = o.global, u = o.style;
				G.load(s?.css, X({ name: "primitive-variables" }, r)), G.load(c?.css, X({ name: "semantic-variables" }, r)), G.load(l?.css, X({ name: "global-variables" }, r)), G.loadStyle(X({ name: "global-style" }, r), u), U.setLoadedStyleName("common");
			}
			if (!U.isStyleNameLoaded(n.$style?.name) && (t = n.$style) != null && t.name) {
				var d, f, p, m, h = ((d = n.$style) == null || (f = d.getDirectiveTheme) == null ? void 0 : f.call(d)) || {}, g = h.css, ee = h.style;
				(p = n.$style) == null || p.load(g, X({ name: `${n.$style.name}-variables` }, r)), (m = n.$style) == null || m.loadStyle(X({ name: `${n.$style.name}-style` }, r), ee), U.setLoadedStyleName(n.$style.name);
			}
			if (!U.isStyleNameLoaded("layer-order")) {
				var _, v, y = (_ = n.$style) == null || (v = _.getLayerOrderThemeCSS) == null ? void 0 : v.call(_);
				G.load(y, X({
					name: "layer-order",
					first: !0
				}, r)), U.setLoadedStyleName("layer-order");
			}
		}
	},
	_loadScopedThemeStyles: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = arguments.length > 1 ? arguments[1] : void 0, n = e.preset();
		if (n && e.$attrSelector) {
			var r, i, a = (((r = e.$style) == null || (i = r.getPresetTheme) == null ? void 0 : i.call(r, n, `[${e.$attrSelector}]`)) || {}).css;
			e.scopedStyleEl = (e.$style?.load(a, X({ name: `${e.$attrSelector}-${e.$style.name}` }, t))).el;
		}
	},
	_themeChangeListener: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : function() {};
		q.clearLoadedStyleNames(), B.on("theme:change", e);
	},
	_removeThemeListeners: function() {
		var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		B.off("theme:change", e.$loadStyles), e.$loadStyles = void 0;
	},
	_hook: function(e, t, n, r, i, a) {
		var o, s, c = `on${me(t)}`, l = Z._getConfig(r, i), u = n?.$instance, d = Z._usePT(u, Z._getPT(r == null || (o = r.value) == null ? void 0 : o.pt, e), Z._getOptionValue, `hooks.${c}`), f = Z._useDefaultPT(u, l == null || (s = l.pt) == null || (s = s.directives) == null ? void 0 : s[e], Z._getOptionValue, `hooks.${c}`), p = {
			el: n,
			binding: r,
			vnode: i,
			prevVnode: a
		};
		d?.(u, p), f?.(u, p);
	},
	_mergeProps: function() {
		var e = arguments.length > 1 ? arguments[1] : void 0, t = [...arguments].slice(2);
		return oe(e) ? e.apply(void 0, t) : u.apply(void 0, t);
	},
	_extend: function(e) {
		var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = function(n, r, i, a, o) {
			var s, c, l;
			r._$instances = r._$instances || {};
			var u = Z._getConfig(i, a), d = r._$instances[e] || {}, f = A(d) ? X(X({}, t), t?.methods) : {};
			r._$instances[e] = X(X({}, d), {}, {
				$name: e,
				$host: r,
				$binding: i,
				$modifiers: i?.modifiers,
				$value: i?.value,
				$el: d.$el || r || void 0,
				$style: X({
					classes: void 0,
					inlineStyles: void 0,
					load: function() {},
					loadCSS: function() {},
					loadStyle: function() {}
				}, t?.style),
				$primevueConfig: u,
				$attrSelector: (s = r.$pd) == null || (s = s[e]) == null ? void 0 : s.attrSelector,
				defaultPT: function() {
					return Z._getPT(u?.pt, void 0, function(t) {
						var n;
						return t == null || (n = t.directives) == null ? void 0 : n[e];
					});
				},
				isUnstyled: function() {
					var t, n;
					return ((t = r._$instances[e]) == null || (t = t.$binding) == null || (t = t.value) == null ? void 0 : t.unstyled) === void 0 ? u?.unstyled : (n = r._$instances[e]) == null || (n = n.$binding) == null || (n = n.value) == null ? void 0 : n.unstyled;
				},
				theme: function() {
					var t;
					return (t = r._$instances[e]) == null || (t = t.$primevueConfig) == null ? void 0 : t.theme;
				},
				preset: function() {
					var t;
					return (t = r._$instances[e]) == null || (t = t.$binding) == null || (t = t.value) == null ? void 0 : t.dt;
				},
				ptm: function() {
					var t, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", i = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
					return Z._getPTValue(r._$instances[e], (t = r._$instances[e]) == null || (t = t.$binding) == null || (t = t.value) == null ? void 0 : t.pt, n, X({}, i));
				},
				ptmo: function() {
					var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
					return Z._getPTValue(r._$instances[e], t, n, i, !1);
				},
				cx: function() {
					var t, n, i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", a = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
					return (t = r._$instances[e]) != null && t.isUnstyled() ? void 0 : Z._getOptionValue((n = r._$instances[e]) == null || (n = n.$style) == null ? void 0 : n.classes, i, X({}, a));
				},
				sx: function() {
					var t, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", i = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
					return i ? Z._getOptionValue((t = r._$instances[e]) == null || (t = t.$style) == null ? void 0 : t.inlineStyles, n, X({}, a)) : void 0;
				}
			}, f), r.$instance = r._$instances[e], (c = (l = r.$instance)[n]) == null || c.call(l, r, i, a, o), r[`\$${e}`] = r.$instance, Z._hook(e, n, r, i, a, o), r.$pd ||= {}, r.$pd[e] = X(X({}, r.$pd?.[e]), {}, {
				name: e,
				instance: r._$instances[e]
			});
		}, r = function(t) {
			var n, r, i, a = t._$instances[e], o = a?.watch, s = function(e) {
				var t, n = e.newValue, r = e.oldValue;
				return o == null || (t = o.config) == null ? void 0 : t.call(a, n, r);
			}, c = function(e) {
				var t, n = e.newValue, r = e.oldValue;
				return o == null || (t = o["config.ripple"]) == null ? void 0 : t.call(a, n, r);
			};
			a.$watchersCallback = {
				config: s,
				"config.ripple": c
			}, o == null || (n = o.config) == null || n.call(a, a?.$primevueConfig), K.on("config:change", s), o == null || (r = o["config.ripple"]) == null || r.call(a, a == null || (i = a.$primevueConfig) == null ? void 0 : i.ripple), K.on("config:ripple:change", c);
		}, i = function(t) {
			var n = t._$instances[e].$watchersCallback;
			n && (K.off("config:change", n.config), K.off("config:ripple:change", n["config.ripple"]), t._$instances[e].$watchersCallback = void 0);
		};
		return {
			created: function(t, r, i, a) {
				t.$pd ||= {}, t.$pd[e] = {
					name: e,
					attrSelector: Ie("pd")
				}, n("created", t, r, i, a);
			},
			beforeMount: function(t, i, a, o) {
				Z._loadStyles(t.$pd[e]?.instance, i, a), n("beforeMount", t, i, a, o), r(t);
			},
			mounted: function(t, r, i, a) {
				Z._loadStyles(t.$pd[e]?.instance, r, i), n("mounted", t, r, i, a);
			},
			beforeUpdate: function(e, t, r, i) {
				n("beforeUpdate", e, t, r, i);
			},
			updated: function(t, r, i, a) {
				Z._loadStyles(t.$pd[e]?.instance, r, i), n("updated", t, r, i, a);
			},
			beforeUnmount: function(t, r, a, o) {
				i(t), Z._removeThemeListeners(t.$pd[e]?.instance), n("beforeUnmount", t, r, a, o);
			},
			unmounted: function(t, r, i, a) {
				var o;
				(o = t.$pd[e]) == null || (o = o.instance) == null || (o = o.scopedStyleEl) == null || (o = o.value) == null || o.remove(), n("unmounted", t, r, i, a);
			}
		};
	},
	extend: function() {
		var e = Oi(Z._getMeta.apply(Z, arguments), 2), t = e[0], n = e[1];
		return X({ extend: function() {
			var e = Oi(Z._getMeta.apply(Z, arguments), 2), t = e[0], r = e[1];
			return Z.extend(t, X(X(X({}, n), n?.methods), r));
		} }, Z._extend(t, n));
	}
}, Ri = G.extend({
	name: "ripple-directive",
	style: "\n    .p-ink {\n        display: block;\n        position: absolute;\n        background: dt('ripple.background');\n        border-radius: 100%;\n        transform: scale(0);\n        pointer-events: none;\n    }\n\n    .p-ink-active {\n        animation: ripple 0.4s linear;\n    }\n\n    @keyframes ripple {\n        100% {\n            opacity: 0;\n            transform: scale(2.5);\n        }\n    }\n",
	classes: { root: "p-ink" }
}), zi = Z.extend({ style: Ri });
function Bi(e) {
	"@babel/helpers - typeof";
	return Bi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Bi(e);
}
function Vi(e) {
	return Gi(e) || Wi(e) || Ui(e) || Hi();
}
function Hi() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Ui(e, t) {
	if (e) {
		if (typeof e == "string") return Ki(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ki(e, t) : void 0;
	}
}
function Wi(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Gi(e) {
	if (Array.isArray(e)) return Ki(e);
}
function Ki(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function qi(e, t, n) {
	return (t = Ji(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Ji(e) {
	var t = Yi(e, "string");
	return Bi(t) == "symbol" ? t : t + "";
}
function Yi(e, t) {
	if (Bi(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (Bi(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Xi = zi.extend("ripple", {
	watch: { "config.ripple": function(e) {
		e ? (this.createRipple(this.$host), this.bindEvents(this.$host), this.$host.setAttribute("data-pd-ripple", !0), this.$host.style.overflow = "hidden", this.$host.style.position = "relative") : (this.remove(this.$host), this.$host.removeAttribute("data-pd-ripple"));
	} },
	unmounted: function(e) {
		this.remove(e);
	},
	timeout: void 0,
	methods: {
		bindEvents: function(e) {
			e.addEventListener("mousedown", this.onMouseDown.bind(this));
		},
		unbindEvents: function(e) {
			e.removeEventListener("mousedown", this.onMouseDown.bind(this));
		},
		createRipple: function(e) {
			var t = this.getInk(e);
			t || (t = Ee("span", qi(qi({
				role: "presentation",
				"aria-hidden": !0,
				"data-p-ink": !0,
				"data-p-ink-active": !1,
				class: !this.isUnstyled() && this.cx("root"),
				onAnimationEnd: this.onAnimationEnd.bind(this)
			}, this.$attrSelector, ""), "p-bind", this.ptm("root"))), e.appendChild(t), this.$el = t);
		},
		remove: function(e) {
			var t = this.getInk(e);
			t && (this.$host.style.overflow = "", this.$host.style.position = "", this.unbindEvents(e), t.removeEventListener("animationend", this.onAnimationEnd), t.remove());
		},
		onMouseDown: function(e) {
			var t = this, n = e.currentTarget, r = this.getInk(n);
			if (!(!r || getComputedStyle(r, null).display === "none")) {
				if (!this.isUnstyled() && ye(r, "p-ink-active"), r.setAttribute("data-p-ink-active", "false"), !ke(r) && !Me(r)) {
					var i = Math.max(xe(n), je(n));
					r.style.height = i + "px", r.style.width = i + "px";
				}
				var a = Ae(n), o = e.pageX - a.left + document.body.scrollTop - Me(r) / 2, s = e.pageY - a.top + document.body.scrollLeft - ke(r) / 2;
				r.style.top = s + "px", r.style.left = o + "px", !this.isUnstyled() && ve(r, "p-ink-active"), r.setAttribute("data-p-ink-active", "true"), this.timeout = setTimeout(function() {
					r && (!t.isUnstyled() && ye(r, "p-ink-active"), r.setAttribute("data-p-ink-active", "false"));
				}, 401);
			}
		},
		onAnimationEnd: function(e) {
			this.timeout && clearTimeout(this.timeout), !this.isUnstyled() && ye(e.currentTarget, "p-ink-active"), e.currentTarget.setAttribute("data-p-ink-active", "false");
		},
		getInk: function(e) {
			return e && e.children ? Vi(e.children).find(function(e) {
				return Oe(e, "data-pc-name") === "ripple";
			}) : void 0;
		}
	}
}), Zi = "\n    .p-button {\n        display: inline-flex;\n        cursor: pointer;\n        user-select: none;\n        align-items: center;\n        justify-content: center;\n        overflow: hidden;\n        position: relative;\n        color: dt('button.primary.color');\n        background: dt('button.primary.background');\n        border: 1px solid dt('button.primary.border.color');\n        padding: dt('button.padding.y') dt('button.padding.x');\n        font-size: 1rem;\n        font-family: inherit;\n        font-feature-settings: inherit;\n        transition:\n            background dt('button.transition.duration'),\n            color dt('button.transition.duration'),\n            border-color dt('button.transition.duration'),\n            outline-color dt('button.transition.duration'),\n            box-shadow dt('button.transition.duration');\n        border-radius: dt('button.border.radius');\n        outline-color: transparent;\n        gap: dt('button.gap');\n    }\n\n    .p-button:disabled {\n        cursor: default;\n    }\n\n    .p-button-icon-right {\n        order: 1;\n    }\n\n    .p-button-icon-right:dir(rtl) {\n        order: -1;\n    }\n\n    .p-button:not(.p-button-vertical) .p-button-icon:not(.p-button-icon-right):dir(rtl) {\n        order: 1;\n    }\n\n    .p-button-icon-bottom {\n        order: 2;\n    }\n\n    .p-button-icon-only {\n        width: dt('button.icon.only.width');\n        padding-inline-start: 0;\n        padding-inline-end: 0;\n        gap: 0;\n    }\n\n    .p-button-icon-only.p-button-rounded {\n        border-radius: 50%;\n        height: dt('button.icon.only.width');\n    }\n\n    .p-button-icon-only .p-button-label {\n        visibility: hidden;\n        width: 0;\n    }\n\n    .p-button-icon-only::after {\n        content: \"\xA0\";\n        visibility: hidden;\n        width: 0;\n    }\n\n    .p-button-sm {\n        font-size: dt('button.sm.font.size');\n        padding: dt('button.sm.padding.y') dt('button.sm.padding.x');\n    }\n\n    .p-button-sm .p-button-icon {\n        font-size: dt('button.sm.font.size');\n    }\n\n    .p-button-sm.p-button-icon-only {\n        width: dt('button.sm.icon.only.width');\n    }\n\n    .p-button-sm.p-button-icon-only.p-button-rounded {\n        height: dt('button.sm.icon.only.width');\n    }\n\n    .p-button-lg {\n        font-size: dt('button.lg.font.size');\n        padding: dt('button.lg.padding.y') dt('button.lg.padding.x');\n    }\n\n    .p-button-lg .p-button-icon {\n        font-size: dt('button.lg.font.size');\n    }\n\n    .p-button-lg.p-button-icon-only {\n        width: dt('button.lg.icon.only.width');\n    }\n\n    .p-button-lg.p-button-icon-only.p-button-rounded {\n        height: dt('button.lg.icon.only.width');\n    }\n\n    .p-button-vertical {\n        flex-direction: column;\n    }\n\n    .p-button-label {\n        font-weight: dt('button.label.font.weight');\n    }\n\n    .p-button-fluid {\n        width: 100%;\n    }\n\n    .p-button-fluid.p-button-icon-only {\n        width: dt('button.icon.only.width');\n    }\n\n    .p-button:not(:disabled):hover {\n        background: dt('button.primary.hover.background');\n        border: 1px solid dt('button.primary.hover.border.color');\n        color: dt('button.primary.hover.color');\n    }\n\n    .p-button:not(:disabled):active {\n        background: dt('button.primary.active.background');\n        border: 1px solid dt('button.primary.active.border.color');\n        color: dt('button.primary.active.color');\n    }\n\n    .p-button:focus-visible {\n        box-shadow: dt('button.primary.focus.ring.shadow');\n        outline: dt('button.focus.ring.width') dt('button.focus.ring.style') dt('button.primary.focus.ring.color');\n        outline-offset: dt('button.focus.ring.offset');\n    }\n\n    .p-button .p-badge {\n        min-width: dt('button.badge.size');\n        height: dt('button.badge.size');\n        line-height: dt('button.badge.size');\n    }\n\n    .p-button-raised {\n        box-shadow: dt('button.raised.shadow');\n    }\n\n    .p-button-rounded {\n        border-radius: dt('button.rounded.border.radius');\n    }\n\n    .p-button-secondary {\n        background: dt('button.secondary.background');\n        border: 1px solid dt('button.secondary.border.color');\n        color: dt('button.secondary.color');\n    }\n\n    .p-button-secondary:not(:disabled):hover {\n        background: dt('button.secondary.hover.background');\n        border: 1px solid dt('button.secondary.hover.border.color');\n        color: dt('button.secondary.hover.color');\n    }\n\n    .p-button-secondary:not(:disabled):active {\n        background: dt('button.secondary.active.background');\n        border: 1px solid dt('button.secondary.active.border.color');\n        color: dt('button.secondary.active.color');\n    }\n\n    .p-button-secondary:focus-visible {\n        outline-color: dt('button.secondary.focus.ring.color');\n        box-shadow: dt('button.secondary.focus.ring.shadow');\n    }\n\n    .p-button-success {\n        background: dt('button.success.background');\n        border: 1px solid dt('button.success.border.color');\n        color: dt('button.success.color');\n    }\n\n    .p-button-success:not(:disabled):hover {\n        background: dt('button.success.hover.background');\n        border: 1px solid dt('button.success.hover.border.color');\n        color: dt('button.success.hover.color');\n    }\n\n    .p-button-success:not(:disabled):active {\n        background: dt('button.success.active.background');\n        border: 1px solid dt('button.success.active.border.color');\n        color: dt('button.success.active.color');\n    }\n\n    .p-button-success:focus-visible {\n        outline-color: dt('button.success.focus.ring.color');\n        box-shadow: dt('button.success.focus.ring.shadow');\n    }\n\n    .p-button-info {\n        background: dt('button.info.background');\n        border: 1px solid dt('button.info.border.color');\n        color: dt('button.info.color');\n    }\n\n    .p-button-info:not(:disabled):hover {\n        background: dt('button.info.hover.background');\n        border: 1px solid dt('button.info.hover.border.color');\n        color: dt('button.info.hover.color');\n    }\n\n    .p-button-info:not(:disabled):active {\n        background: dt('button.info.active.background');\n        border: 1px solid dt('button.info.active.border.color');\n        color: dt('button.info.active.color');\n    }\n\n    .p-button-info:focus-visible {\n        outline-color: dt('button.info.focus.ring.color');\n        box-shadow: dt('button.info.focus.ring.shadow');\n    }\n\n    .p-button-warn {\n        background: dt('button.warn.background');\n        border: 1px solid dt('button.warn.border.color');\n        color: dt('button.warn.color');\n    }\n\n    .p-button-warn:not(:disabled):hover {\n        background: dt('button.warn.hover.background');\n        border: 1px solid dt('button.warn.hover.border.color');\n        color: dt('button.warn.hover.color');\n    }\n\n    .p-button-warn:not(:disabled):active {\n        background: dt('button.warn.active.background');\n        border: 1px solid dt('button.warn.active.border.color');\n        color: dt('button.warn.active.color');\n    }\n\n    .p-button-warn:focus-visible {\n        outline-color: dt('button.warn.focus.ring.color');\n        box-shadow: dt('button.warn.focus.ring.shadow');\n    }\n\n    .p-button-help {\n        background: dt('button.help.background');\n        border: 1px solid dt('button.help.border.color');\n        color: dt('button.help.color');\n    }\n\n    .p-button-help:not(:disabled):hover {\n        background: dt('button.help.hover.background');\n        border: 1px solid dt('button.help.hover.border.color');\n        color: dt('button.help.hover.color');\n    }\n\n    .p-button-help:not(:disabled):active {\n        background: dt('button.help.active.background');\n        border: 1px solid dt('button.help.active.border.color');\n        color: dt('button.help.active.color');\n    }\n\n    .p-button-help:focus-visible {\n        outline-color: dt('button.help.focus.ring.color');\n        box-shadow: dt('button.help.focus.ring.shadow');\n    }\n\n    .p-button-danger {\n        background: dt('button.danger.background');\n        border: 1px solid dt('button.danger.border.color');\n        color: dt('button.danger.color');\n    }\n\n    .p-button-danger:not(:disabled):hover {\n        background: dt('button.danger.hover.background');\n        border: 1px solid dt('button.danger.hover.border.color');\n        color: dt('button.danger.hover.color');\n    }\n\n    .p-button-danger:not(:disabled):active {\n        background: dt('button.danger.active.background');\n        border: 1px solid dt('button.danger.active.border.color');\n        color: dt('button.danger.active.color');\n    }\n\n    .p-button-danger:focus-visible {\n        outline-color: dt('button.danger.focus.ring.color');\n        box-shadow: dt('button.danger.focus.ring.shadow');\n    }\n\n    .p-button-contrast {\n        background: dt('button.contrast.background');\n        border: 1px solid dt('button.contrast.border.color');\n        color: dt('button.contrast.color');\n    }\n\n    .p-button-contrast:not(:disabled):hover {\n        background: dt('button.contrast.hover.background');\n        border: 1px solid dt('button.contrast.hover.border.color');\n        color: dt('button.contrast.hover.color');\n    }\n\n    .p-button-contrast:not(:disabled):active {\n        background: dt('button.contrast.active.background');\n        border: 1px solid dt('button.contrast.active.border.color');\n        color: dt('button.contrast.active.color');\n    }\n\n    .p-button-contrast:focus-visible {\n        outline-color: dt('button.contrast.focus.ring.color');\n        box-shadow: dt('button.contrast.focus.ring.shadow');\n    }\n\n    .p-button-outlined {\n        background: transparent;\n        border-color: dt('button.outlined.primary.border.color');\n        color: dt('button.outlined.primary.color');\n    }\n\n    .p-button-outlined:not(:disabled):hover {\n        background: dt('button.outlined.primary.hover.background');\n        border-color: dt('button.outlined.primary.border.color');\n        color: dt('button.outlined.primary.color');\n    }\n\n    .p-button-outlined:not(:disabled):active {\n        background: dt('button.outlined.primary.active.background');\n        border-color: dt('button.outlined.primary.border.color');\n        color: dt('button.outlined.primary.color');\n    }\n\n    .p-button-outlined.p-button-secondary {\n        border-color: dt('button.outlined.secondary.border.color');\n        color: dt('button.outlined.secondary.color');\n    }\n\n    .p-button-outlined.p-button-secondary:not(:disabled):hover {\n        background: dt('button.outlined.secondary.hover.background');\n        border-color: dt('button.outlined.secondary.border.color');\n        color: dt('button.outlined.secondary.color');\n    }\n\n    .p-button-outlined.p-button-secondary:not(:disabled):active {\n        background: dt('button.outlined.secondary.active.background');\n        border-color: dt('button.outlined.secondary.border.color');\n        color: dt('button.outlined.secondary.color');\n    }\n\n    .p-button-outlined.p-button-success {\n        border-color: dt('button.outlined.success.border.color');\n        color: dt('button.outlined.success.color');\n    }\n\n    .p-button-outlined.p-button-success:not(:disabled):hover {\n        background: dt('button.outlined.success.hover.background');\n        border-color: dt('button.outlined.success.border.color');\n        color: dt('button.outlined.success.color');\n    }\n\n    .p-button-outlined.p-button-success:not(:disabled):active {\n        background: dt('button.outlined.success.active.background');\n        border-color: dt('button.outlined.success.border.color');\n        color: dt('button.outlined.success.color');\n    }\n\n    .p-button-outlined.p-button-info {\n        border-color: dt('button.outlined.info.border.color');\n        color: dt('button.outlined.info.color');\n    }\n\n    .p-button-outlined.p-button-info:not(:disabled):hover {\n        background: dt('button.outlined.info.hover.background');\n        border-color: dt('button.outlined.info.border.color');\n        color: dt('button.outlined.info.color');\n    }\n\n    .p-button-outlined.p-button-info:not(:disabled):active {\n        background: dt('button.outlined.info.active.background');\n        border-color: dt('button.outlined.info.border.color');\n        color: dt('button.outlined.info.color');\n    }\n\n    .p-button-outlined.p-button-warn {\n        border-color: dt('button.outlined.warn.border.color');\n        color: dt('button.outlined.warn.color');\n    }\n\n    .p-button-outlined.p-button-warn:not(:disabled):hover {\n        background: dt('button.outlined.warn.hover.background');\n        border-color: dt('button.outlined.warn.border.color');\n        color: dt('button.outlined.warn.color');\n    }\n\n    .p-button-outlined.p-button-warn:not(:disabled):active {\n        background: dt('button.outlined.warn.active.background');\n        border-color: dt('button.outlined.warn.border.color');\n        color: dt('button.outlined.warn.color');\n    }\n\n    .p-button-outlined.p-button-help {\n        border-color: dt('button.outlined.help.border.color');\n        color: dt('button.outlined.help.color');\n    }\n\n    .p-button-outlined.p-button-help:not(:disabled):hover {\n        background: dt('button.outlined.help.hover.background');\n        border-color: dt('button.outlined.help.border.color');\n        color: dt('button.outlined.help.color');\n    }\n\n    .p-button-outlined.p-button-help:not(:disabled):active {\n        background: dt('button.outlined.help.active.background');\n        border-color: dt('button.outlined.help.border.color');\n        color: dt('button.outlined.help.color');\n    }\n\n    .p-button-outlined.p-button-danger {\n        border-color: dt('button.outlined.danger.border.color');\n        color: dt('button.outlined.danger.color');\n    }\n\n    .p-button-outlined.p-button-danger:not(:disabled):hover {\n        background: dt('button.outlined.danger.hover.background');\n        border-color: dt('button.outlined.danger.border.color');\n        color: dt('button.outlined.danger.color');\n    }\n\n    .p-button-outlined.p-button-danger:not(:disabled):active {\n        background: dt('button.outlined.danger.active.background');\n        border-color: dt('button.outlined.danger.border.color');\n        color: dt('button.outlined.danger.color');\n    }\n\n    .p-button-outlined.p-button-contrast {\n        border-color: dt('button.outlined.contrast.border.color');\n        color: dt('button.outlined.contrast.color');\n    }\n\n    .p-button-outlined.p-button-contrast:not(:disabled):hover {\n        background: dt('button.outlined.contrast.hover.background');\n        border-color: dt('button.outlined.contrast.border.color');\n        color: dt('button.outlined.contrast.color');\n    }\n\n    .p-button-outlined.p-button-contrast:not(:disabled):active {\n        background: dt('button.outlined.contrast.active.background');\n        border-color: dt('button.outlined.contrast.border.color');\n        color: dt('button.outlined.contrast.color');\n    }\n\n    .p-button-outlined.p-button-plain {\n        border-color: dt('button.outlined.plain.border.color');\n        color: dt('button.outlined.plain.color');\n    }\n\n    .p-button-outlined.p-button-plain:not(:disabled):hover {\n        background: dt('button.outlined.plain.hover.background');\n        border-color: dt('button.outlined.plain.border.color');\n        color: dt('button.outlined.plain.color');\n    }\n\n    .p-button-outlined.p-button-plain:not(:disabled):active {\n        background: dt('button.outlined.plain.active.background');\n        border-color: dt('button.outlined.plain.border.color');\n        color: dt('button.outlined.plain.color');\n    }\n\n    .p-button-text {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.primary.color');\n    }\n\n    .p-button-text:not(:disabled):hover {\n        background: dt('button.text.primary.hover.background');\n        border-color: transparent;\n        color: dt('button.text.primary.color');\n    }\n\n    .p-button-text:not(:disabled):active {\n        background: dt('button.text.primary.active.background');\n        border-color: transparent;\n        color: dt('button.text.primary.color');\n    }\n\n    .p-button-text.p-button-secondary {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.secondary.color');\n    }\n\n    .p-button-text.p-button-secondary:not(:disabled):hover {\n        background: dt('button.text.secondary.hover.background');\n        border-color: transparent;\n        color: dt('button.text.secondary.color');\n    }\n\n    .p-button-text.p-button-secondary:not(:disabled):active {\n        background: dt('button.text.secondary.active.background');\n        border-color: transparent;\n        color: dt('button.text.secondary.color');\n    }\n\n    .p-button-text.p-button-success {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.success.color');\n    }\n\n    .p-button-text.p-button-success:not(:disabled):hover {\n        background: dt('button.text.success.hover.background');\n        border-color: transparent;\n        color: dt('button.text.success.color');\n    }\n\n    .p-button-text.p-button-success:not(:disabled):active {\n        background: dt('button.text.success.active.background');\n        border-color: transparent;\n        color: dt('button.text.success.color');\n    }\n\n    .p-button-text.p-button-info {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.info.color');\n    }\n\n    .p-button-text.p-button-info:not(:disabled):hover {\n        background: dt('button.text.info.hover.background');\n        border-color: transparent;\n        color: dt('button.text.info.color');\n    }\n\n    .p-button-text.p-button-info:not(:disabled):active {\n        background: dt('button.text.info.active.background');\n        border-color: transparent;\n        color: dt('button.text.info.color');\n    }\n\n    .p-button-text.p-button-warn {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.warn.color');\n    }\n\n    .p-button-text.p-button-warn:not(:disabled):hover {\n        background: dt('button.text.warn.hover.background');\n        border-color: transparent;\n        color: dt('button.text.warn.color');\n    }\n\n    .p-button-text.p-button-warn:not(:disabled):active {\n        background: dt('button.text.warn.active.background');\n        border-color: transparent;\n        color: dt('button.text.warn.color');\n    }\n\n    .p-button-text.p-button-help {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.help.color');\n    }\n\n    .p-button-text.p-button-help:not(:disabled):hover {\n        background: dt('button.text.help.hover.background');\n        border-color: transparent;\n        color: dt('button.text.help.color');\n    }\n\n    .p-button-text.p-button-help:not(:disabled):active {\n        background: dt('button.text.help.active.background');\n        border-color: transparent;\n        color: dt('button.text.help.color');\n    }\n\n    .p-button-text.p-button-danger {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.danger.color');\n    }\n\n    .p-button-text.p-button-danger:not(:disabled):hover {\n        background: dt('button.text.danger.hover.background');\n        border-color: transparent;\n        color: dt('button.text.danger.color');\n    }\n\n    .p-button-text.p-button-danger:not(:disabled):active {\n        background: dt('button.text.danger.active.background');\n        border-color: transparent;\n        color: dt('button.text.danger.color');\n    }\n\n    .p-button-text.p-button-contrast {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.contrast.color');\n    }\n\n    .p-button-text.p-button-contrast:not(:disabled):hover {\n        background: dt('button.text.contrast.hover.background');\n        border-color: transparent;\n        color: dt('button.text.contrast.color');\n    }\n\n    .p-button-text.p-button-contrast:not(:disabled):active {\n        background: dt('button.text.contrast.active.background');\n        border-color: transparent;\n        color: dt('button.text.contrast.color');\n    }\n\n    .p-button-text.p-button-plain {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.plain.color');\n    }\n\n    .p-button-text.p-button-plain:not(:disabled):hover {\n        background: dt('button.text.plain.hover.background');\n        border-color: transparent;\n        color: dt('button.text.plain.color');\n    }\n\n    .p-button-text.p-button-plain:not(:disabled):active {\n        background: dt('button.text.plain.active.background');\n        border-color: transparent;\n        color: dt('button.text.plain.color');\n    }\n\n    .p-button-link {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.link.color');\n    }\n\n    .p-button-link:not(:disabled):hover {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.link.hover.color');\n    }\n\n    .p-button-link:not(:disabled):hover .p-button-label {\n        text-decoration: underline;\n    }\n\n    .p-button-link:not(:disabled):active {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.link.active.color');\n    }\n";
//#endregion
//#region node_modules/primevue/button/style/index.mjs
function Qi(e) {
	"@babel/helpers - typeof";
	return Qi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Qi(e);
}
function Q(e, t, n) {
	return (t = $i(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function $i(e) {
	var t = ea(e, "string");
	return Qi(t) == "symbol" ? t : t + "";
}
function ea(e, t) {
	if (Qi(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (Qi(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var ta = G.extend({
	name: "button",
	style: Zi,
	classes: {
		root: function(e) {
			var t = e.instance, n = e.props;
			return ["p-button p-component", Q(Q(Q(Q(Q(Q(Q(Q(Q({
				"p-button-icon-only": t.hasIcon && !n.label && !n.badge,
				"p-button-vertical": (n.iconPos === "top" || n.iconPos === "bottom") && n.label,
				"p-button-loading": n.loading,
				"p-button-link": n.link || n.variant === "link"
			}, `p-button-${n.severity}`, n.severity), "p-button-raised", n.raised), "p-button-rounded", n.rounded), "p-button-text", n.text || n.variant === "text"), "p-button-outlined", n.outlined || n.variant === "outlined"), "p-button-sm", n.size === "small"), "p-button-lg", n.size === "large"), "p-button-plain", n.plain), "p-button-fluid", t.hasFluid)];
		},
		loadingIcon: "p-button-loading-icon",
		icon: function(e) {
			var t = e.props;
			return ["p-button-icon", Q({}, `p-button-icon-${t.iconPos}`, t.label)];
		},
		label: "p-button-label"
	}
}), na = {
	name: "BaseButton",
	extends: Y,
	props: {
		label: {
			type: String,
			default: null
		},
		icon: {
			type: String,
			default: null
		},
		iconPos: {
			type: String,
			default: "left"
		},
		iconClass: {
			type: [String, Object],
			default: null
		},
		badge: {
			type: String,
			default: null
		},
		badgeClass: {
			type: [String, Object],
			default: null
		},
		badgeSeverity: {
			type: String,
			default: "secondary"
		},
		loading: {
			type: Boolean,
			default: !1
		},
		loadingIcon: {
			type: String,
			default: void 0
		},
		as: {
			type: [String, Object],
			default: "BUTTON"
		},
		asChild: {
			type: Boolean,
			default: !1
		},
		link: {
			type: Boolean,
			default: !1
		},
		severity: {
			type: String,
			default: null
		},
		raised: {
			type: Boolean,
			default: !1
		},
		rounded: {
			type: Boolean,
			default: !1
		},
		text: {
			type: Boolean,
			default: !1
		},
		outlined: {
			type: Boolean,
			default: !1
		},
		size: {
			type: String,
			default: null
		},
		variant: {
			type: String,
			default: null
		},
		plain: {
			type: Boolean,
			default: !1
		},
		fluid: {
			type: Boolean,
			default: null
		}
	},
	style: ta,
	provide: function() {
		return {
			$pcButton: this,
			$parentInstance: this
		};
	}
};
function ra(e) {
	"@babel/helpers - typeof";
	return ra = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, ra(e);
}
function $(e, t, n) {
	return (t = ia(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function ia(e) {
	var t = aa(e, "string");
	return ra(t) == "symbol" ? t : t + "";
}
function aa(e, t) {
	if (ra(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (ra(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var oa = {
	name: "Button",
	extends: na,
	inheritAttrs: !1,
	inject: { $pcFluid: { default: null } },
	methods: { getPTOptions: function(e) {
		return (e === "root" ? this.ptmi : this.ptm)(e, { context: { disabled: this.disabled } });
	} },
	computed: {
		disabled: function() {
			return this.$attrs.disabled || this.$attrs.disabled === "" || this.loading;
		},
		defaultAriaLabel: function() {
			return this.label ? this.label + (this.badge ? " " + this.badge : "") : this.$attrs.ariaLabel;
		},
		hasIcon: function() {
			return this.icon || this.$slots.icon;
		},
		attrs: function() {
			return u(this.asAttrs, this.a11yAttrs, this.getPTOptions("root"));
		},
		asAttrs: function() {
			return this.as === "BUTTON" ? {
				type: "button",
				disabled: this.disabled
			} : void 0;
		},
		a11yAttrs: function() {
			return {
				"aria-label": this.defaultAriaLabel,
				"data-pc-name": "button",
				"data-p-disabled": this.disabled,
				"data-p-severity": this.severity
			};
		},
		hasFluid: function() {
			return A(this.fluid) ? !!this.$pcFluid : this.fluid;
		},
		dataP: function() {
			return L($($($($($($($($($($({}, this.size, this.size), "icon-only", this.hasIcon && !this.label && !this.badge), "loading", this.loading), "fluid", this.hasFluid), "rounded", this.rounded), "raised", this.raised), "outlined", this.outlined || this.variant === "outlined"), "text", this.text || this.variant === "text"), "link", this.link || this.variant === "link"), "vertical", (this.iconPos === "top" || this.iconPos === "bottom") && this.label));
		},
		dataIconP: function() {
			return L($($({}, this.iconPos, this.iconPos), this.size, this.size));
		},
		dataLabelP: function() {
			return L($($({}, this.size, this.size), "icon-only", this.hasIcon && !this.label && !this.badge));
		}
	},
	components: {
		SpinnerIcon: ui,
		Badge: wi
	},
	directives: { ripple: Xi }
}, sa = ["data-p"], ca = ["data-p"];
function la(e, t, a, o, s, c) {
	var l = y("SpinnerIcon"), d = y("Badge"), p = b("ripple");
	return e.asChild ? v(e.$slots, "default", {
		key: 1,
		class: f(e.cx("root")),
		a11yAttrs: c.a11yAttrs
	}) : O((h(), n(x(e.as), u({
		key: 0,
		class: e.cx("root"),
		"data-p": c.dataP
	}, c.attrs), {
		default: D(function() {
			return [v(e.$slots, "default", {}, function() {
				return [
					e.loading ? v(e.$slots, "loadingicon", u({
						key: 0,
						class: [e.cx("loadingIcon"), e.cx("icon")]
					}, e.ptm("loadingIcon")), function() {
						return [e.loadingIcon ? (h(), i("span", u({
							key: 0,
							class: [
								e.cx("loadingIcon"),
								e.cx("icon"),
								e.loadingIcon
							]
						}, e.ptm("loadingIcon")), null, 16)) : (h(), n(l, u({
							key: 1,
							class: [e.cx("loadingIcon"), e.cx("icon")],
							spin: ""
						}, e.ptm("loadingIcon")), null, 16, ["class"]))];
					}) : v(e.$slots, "icon", u({
						key: 1,
						class: [e.cx("icon")]
					}, e.ptm("icon")), function() {
						return [e.icon ? (h(), i("span", u({
							key: 0,
							class: [
								e.cx("icon"),
								e.icon,
								e.iconClass
							],
							"data-p": c.dataIconP
						}, e.ptm("icon")), null, 16, sa)) : r("", !0)];
					}),
					e.label ? (h(), i("span", u({
						key: 2,
						class: e.cx("label")
					}, e.ptm("label"), { "data-p": c.dataLabelP }), S(e.label), 17, ca)) : r("", !0),
					e.badge ? (h(), n(d, {
						key: 3,
						value: e.badge,
						class: f(e.badgeClass),
						severity: e.badgeSeverity,
						unstyled: e.unstyled,
						pt: e.ptm("pcBadge")
					}, null, 8, [
						"value",
						"class",
						"severity",
						"unstyled",
						"pt"
					])) : r("", !0)
				];
			})];
		}),
		_: 3
	}, 16, ["class", "data-p"])), [[p]]);
}
oa.render = la;
//#endregion
//#region src/helpers/getCached.ts
function ua(e) {
	if (!e) return null;
	let t = localStorage.getItem(e);
	return t ? JSON.parse(t).data : null;
}
//#endregion
//#region src/helpers/setCached.ts
function da(e, t) {
	if (!e) return;
	let n = JSON.stringify({
		key: e,
		data: t
	});
	localStorage.setItem(e, n);
}
//#endregion
//#region src/components/MaxIcon.vue?vue&type=script&setup=true&lang.ts
var fa = ["innerHTML"], pa = /* @__PURE__ */ c({
	__name: "MaxIcon",
	props: {
		icon: {},
		i: {},
		rotate: {},
		flip: {},
		size: {},
		scale: {},
		width: {},
		height: {}
	},
	setup(e) {
		let n = e, r = t(() => n.icon || n.i || ""), a = t(() => "max-icon-" + r.value), o = _("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"18\" d=\"M12 3c4.97 0 9 4.03 9 9\"><animate fill=\"freeze\" attributeName=\"stroke-dashoffset\" dur=\"0.3s\" values=\"18;0\"/><animateTransform attributeName=\"transform\" dur=\"1.5s\" repeatCount=\"indefinite\" type=\"rotate\" values=\"0 12 12;360 12 12\"/></path><path stroke-dasharray=\"60\" d=\"M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z\" opacity=\"0.3\"><animate fill=\"freeze\" attributeName=\"stroke-dashoffset\" dur=\"1.2s\" values=\"60;0\"/></path></g></svg>"), s = t(() => {
			let e = n.width ?? n.height ?? null, t = n.size ?? n.scale ?? null, r = e ?? t;
			return r ? typeof t == "number" ? `${16 * t}px` : typeof r == "number" || /^[0-9.]+$/.test(r) ? `${r}px` : r : "16px";
		});
		return E(a, () => {
			let e = ua(a.value);
			if (e) {
				o.value = e;
				return;
			}
			let t = r.value.split(":")[0], n = r.value.split(":")[1];
			fetch("https://api.iconify.design/" + t + "/" + n + ".svg", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}).then((e) => {
				e.ok && e.text().then((e) => {
					console.log(e), o.value = e, da(a.value, e);
				});
			}).catch((e) => {
				console.error(e);
			});
		}, { immediate: !0 }), (e, t) => (h(), i("div", {
			class: "max-icon-div",
			innerHTML: o.value,
			style: p({
				width: s.value,
				height: s.value
			})
		}, null, 12, fa));
	}
}), ma = { class: "max-button__icon" }, ha = { class: "max-button__icon-loading" }, ga = /* @__PURE__ */ c({
	__name: "MaxButton",
	props: {
		label: {},
		icon: {},
		i: {},
		severity: { default: "primary" },
		size: { default: void 0 },
		disabled: {
			type: Boolean,
			default: !1
		},
		loading: {
			type: Boolean,
			default: !1
		},
		variant: {},
		iconPos: { default: "left" }
	},
	emits: ["click"],
	setup(e, { emit: i }) {
		let o = e, c = i, l = t(() => ({
			"max-button": !0,
			[`max-button--${o.variant}`]: o.variant,
			[`max-button--${o.severity}`]: o.severity,
			[`max-button--${o.size}`]: o.size
		})), u = (e) => {
			c("click", e);
		};
		return (t, i) => (h(), n(C(oa), {
			class: f(`max-button ${"icon-pos-" + e.iconPos} ${l.value}`),
			label: e.label,
			icon: e.icon,
			severity: e.severity,
			size: e.size,
			disabled: e.disabled,
			loading: e.loading,
			onClick: u,
			iconPos: e.iconPos
		}, {
			icon: D(() => [v(t.$slots, "icon", {}, () => [a("div", ma, [e.icon || e.i ? (h(), n(pa, {
				key: 0,
				icon: e.icon ?? e.i
			}, null, 8, ["icon"])) : r("", !0)])])]),
			loadingicon: D(() => [v(t.$slots, "icon", {}, () => [a("div", ha, [s(pa, { icon: "eos-icons:loading" })])])]),
			_: 3
		}, 8, [
			"class",
			"label",
			"icon",
			"severity",
			"size",
			"disabled",
			"loading",
			"iconPos"
		]));
	}
}), _a = G.extend({
	name: "floatlabel",
	style: "\n    .p-floatlabel {\n        display: block;\n        position: relative;\n    }\n\n    .p-floatlabel label {\n        position: absolute;\n        pointer-events: none;\n        top: 50%;\n        transform: translateY(-50%);\n        transition-property: all;\n        transition-timing-function: ease;\n        line-height: 1;\n        font-weight: dt('floatlabel.font.weight');\n        inset-inline-start: dt('floatlabel.position.x');\n        color: dt('floatlabel.color');\n        transition-duration: dt('floatlabel.transition.duration');\n    }\n\n    .p-floatlabel:has(.p-textarea) label {\n        top: dt('floatlabel.position.y');\n        transform: translateY(0);\n    }\n\n    .p-floatlabel:has(.p-inputicon:first-child) label {\n        inset-inline-start: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));\n    }\n\n    .p-floatlabel:has(input:focus) label,\n    .p-floatlabel:has(input.p-filled) label,\n    .p-floatlabel:has(input:-webkit-autofill) label,\n    .p-floatlabel:has(textarea:focus) label,\n    .p-floatlabel:has(textarea.p-filled) label,\n    .p-floatlabel:has(.p-inputwrapper-focus) label,\n    .p-floatlabel:has(.p-inputwrapper-filled) label,\n    .p-floatlabel:has(input[placeholder]) label,\n    .p-floatlabel:has(textarea[placeholder]) label {\n        top: dt('floatlabel.over.active.top');\n        transform: translateY(0);\n        font-size: dt('floatlabel.active.font.size');\n        font-weight: dt('floatlabel.active.font.weight');\n    }\n\n    .p-floatlabel:has(input.p-filled) label,\n    .p-floatlabel:has(textarea.p-filled) label,\n    .p-floatlabel:has(.p-inputwrapper-filled) label {\n        color: dt('floatlabel.active.color');\n    }\n\n    .p-floatlabel:has(input:focus) label,\n    .p-floatlabel:has(input:-webkit-autofill) label,\n    .p-floatlabel:has(textarea:focus) label,\n    .p-floatlabel:has(.p-inputwrapper-focus) label {\n        color: dt('floatlabel.focus.color');\n    }\n\n    .p-floatlabel-in .p-inputtext,\n    .p-floatlabel-in .p-textarea,\n    .p-floatlabel-in .p-select-label,\n    .p-floatlabel-in .p-multiselect-label,\n    .p-floatlabel-in .p-multiselect-label:has(.p-chip),\n    .p-floatlabel-in .p-autocomplete-input-multiple,\n    .p-floatlabel-in .p-cascadeselect-label,\n    .p-floatlabel-in .p-treeselect-label {\n        padding-block-start: dt('floatlabel.in.input.padding.top');\n        padding-block-end: dt('floatlabel.in.input.padding.bottom');\n    }\n\n    .p-floatlabel-in:has(input:focus) label,\n    .p-floatlabel-in:has(input.p-filled) label,\n    .p-floatlabel-in:has(input:-webkit-autofill) label,\n    .p-floatlabel-in:has(textarea:focus) label,\n    .p-floatlabel-in:has(textarea.p-filled) label,\n    .p-floatlabel-in:has(.p-inputwrapper-focus) label,\n    .p-floatlabel-in:has(.p-inputwrapper-filled) label,\n    .p-floatlabel-in:has(input[placeholder]) label,\n    .p-floatlabel-in:has(textarea[placeholder]) label {\n        top: dt('floatlabel.in.active.top');\n    }\n\n    .p-floatlabel-on:has(input:focus) label,\n    .p-floatlabel-on:has(input.p-filled) label,\n    .p-floatlabel-on:has(input:-webkit-autofill) label,\n    .p-floatlabel-on:has(textarea:focus) label,\n    .p-floatlabel-on:has(textarea.p-filled) label,\n    .p-floatlabel-on:has(.p-inputwrapper-focus) label,\n    .p-floatlabel-on:has(.p-inputwrapper-filled) label,\n    .p-floatlabel-on:has(input[placeholder]) label,\n    .p-floatlabel-on:has(textarea[placeholder]) label {\n        top: 0;\n        transform: translateY(-50%);\n        border-radius: dt('floatlabel.on.border.radius');\n        background: dt('floatlabel.on.active.background');\n        padding: dt('floatlabel.on.active.padding');\n    }\n\n    .p-floatlabel:has([class^='p-'][class$='-fluid']) {\n        width: 100%;\n    }\n\n    .p-floatlabel:has(.p-invalid) label {\n        color: dt('floatlabel.invalid.color');\n    }\n",
	classes: { root: function(e) {
		var t = e.props;
		return ["p-floatlabel", {
			"p-floatlabel-over": t.variant === "over",
			"p-floatlabel-on": t.variant === "on",
			"p-floatlabel-in": t.variant === "in"
		}];
	} }
}), va = {
	name: "FloatLabel",
	extends: {
		name: "BaseFloatLabel",
		extends: Y,
		props: { variant: {
			type: String,
			default: "over"
		} },
		style: _a,
		provide: function() {
			return {
				$pcFloatLabel: this,
				$parentInstance: this
			};
		}
	},
	inheritAttrs: !1
};
function ya(e, t, n, r, a, o) {
	return h(), i("span", u({ class: e.cx("root") }, e.ptmi("root")), [v(e.$slots, "default")], 16);
}
va.render = ya;
//#endregion
//#region node_modules/@primevue/icons/times/index.mjs
var ba = {
	name: "TimesIcon",
	extends: li
};
function xa(e) {
	return Ta(e) || wa(e) || Ca(e) || Sa();
}
function Sa() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Ca(e, t) {
	if (e) {
		if (typeof e == "string") return Ea(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ea(e, t) : void 0;
	}
}
function wa(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Ta(e) {
	if (Array.isArray(e)) return Ea(e);
}
function Ea(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Da(e, t, n, r, o, s) {
	return h(), i("svg", u({
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg"
	}, e.pti()), xa(t[0] ||= [a("path", {
		d: "M8.01186 7.00933L12.27 2.75116C12.341 2.68501 12.398 2.60524 12.4375 2.51661C12.4769 2.42798 12.4982 2.3323 12.4999 2.23529C12.5016 2.13827 12.4838 2.0419 12.4474 1.95194C12.4111 1.86197 12.357 1.78024 12.2884 1.71163C12.2198 1.64302 12.138 1.58893 12.0481 1.55259C11.9581 1.51625 11.8617 1.4984 11.7647 1.50011C11.6677 1.50182 11.572 1.52306 11.4834 1.56255C11.3948 1.60204 11.315 1.65898 11.2488 1.72997L6.99067 5.98814L2.7325 1.72997C2.59553 1.60234 2.41437 1.53286 2.22718 1.53616C2.03999 1.53946 1.8614 1.61529 1.72901 1.74767C1.59663 1.88006 1.5208 2.05865 1.5175 2.24584C1.5142 2.43303 1.58368 2.61419 1.71131 2.75116L5.96948 7.00933L1.71131 11.2675C1.576 11.403 1.5 11.5866 1.5 11.7781C1.5 11.9696 1.576 12.1532 1.71131 12.2887C1.84679 12.424 2.03043 12.5 2.2219 12.5C2.41338 12.5 2.59702 12.424 2.7325 12.2887L6.99067 8.03052L11.2488 12.2887C11.3843 12.424 11.568 12.5 11.7594 12.5C11.9509 12.5 12.1346 12.424 12.27 12.2887C12.4053 12.1532 12.4813 11.9696 12.4813 11.7781C12.4813 11.5866 12.4053 11.403 12.27 11.2675L8.01186 7.00933Z",
		fill: "currentColor"
	}, null, -1)]), 16);
}
ba.render = Da;
//#endregion
//#region node_modules/primevue/message/style/index.mjs
var Oa = G.extend({
	name: "message",
	style: "\n    .p-message {\n        display: grid;\n        grid-template-rows: 1fr;\n        border-radius: dt('message.border.radius');\n        outline-width: dt('message.border.width');\n        outline-style: solid;\n    }\n\n    .p-message-content-wrapper {\n        min-height: 0;\n    }\n\n    .p-message-content {\n        display: flex;\n        align-items: center;\n        padding: dt('message.content.padding');\n        gap: dt('message.content.gap');\n    }\n\n    .p-message-icon {\n        flex-shrink: 0;\n    }\n\n    .p-message-close-button {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-shrink: 0;\n        margin-inline-start: auto;\n        overflow: hidden;\n        position: relative;\n        width: dt('message.close.button.width');\n        height: dt('message.close.button.height');\n        border-radius: dt('message.close.button.border.radius');\n        background: transparent;\n        transition:\n            background dt('message.transition.duration'),\n            color dt('message.transition.duration'),\n            outline-color dt('message.transition.duration'),\n            box-shadow dt('message.transition.duration'),\n            opacity 0.3s;\n        outline-color: transparent;\n        color: inherit;\n        padding: 0;\n        border: none;\n        cursor: pointer;\n        user-select: none;\n    }\n\n    .p-message-close-icon {\n        font-size: dt('message.close.icon.size');\n        width: dt('message.close.icon.size');\n        height: dt('message.close.icon.size');\n    }\n\n    .p-message-close-button:focus-visible {\n        outline-width: dt('message.close.button.focus.ring.width');\n        outline-style: dt('message.close.button.focus.ring.style');\n        outline-offset: dt('message.close.button.focus.ring.offset');\n    }\n\n    .p-message-info {\n        background: dt('message.info.background');\n        outline-color: dt('message.info.border.color');\n        color: dt('message.info.color');\n        box-shadow: dt('message.info.shadow');\n    }\n\n    .p-message-info .p-message-close-button:focus-visible {\n        outline-color: dt('message.info.close.button.focus.ring.color');\n        box-shadow: dt('message.info.close.button.focus.ring.shadow');\n    }\n\n    .p-message-info .p-message-close-button:hover {\n        background: dt('message.info.close.button.hover.background');\n    }\n\n    .p-message-info.p-message-outlined {\n        color: dt('message.info.outlined.color');\n        outline-color: dt('message.info.outlined.border.color');\n    }\n\n    .p-message-info.p-message-simple {\n        color: dt('message.info.simple.color');\n    }\n\n    .p-message-success {\n        background: dt('message.success.background');\n        outline-color: dt('message.success.border.color');\n        color: dt('message.success.color');\n        box-shadow: dt('message.success.shadow');\n    }\n\n    .p-message-success .p-message-close-button:focus-visible {\n        outline-color: dt('message.success.close.button.focus.ring.color');\n        box-shadow: dt('message.success.close.button.focus.ring.shadow');\n    }\n\n    .p-message-success .p-message-close-button:hover {\n        background: dt('message.success.close.button.hover.background');\n    }\n\n    .p-message-success.p-message-outlined {\n        color: dt('message.success.outlined.color');\n        outline-color: dt('message.success.outlined.border.color');\n    }\n\n    .p-message-success.p-message-simple {\n        color: dt('message.success.simple.color');\n    }\n\n    .p-message-warn {\n        background: dt('message.warn.background');\n        outline-color: dt('message.warn.border.color');\n        color: dt('message.warn.color');\n        box-shadow: dt('message.warn.shadow');\n    }\n\n    .p-message-warn .p-message-close-button:focus-visible {\n        outline-color: dt('message.warn.close.button.focus.ring.color');\n        box-shadow: dt('message.warn.close.button.focus.ring.shadow');\n    }\n\n    .p-message-warn .p-message-close-button:hover {\n        background: dt('message.warn.close.button.hover.background');\n    }\n\n    .p-message-warn.p-message-outlined {\n        color: dt('message.warn.outlined.color');\n        outline-color: dt('message.warn.outlined.border.color');\n    }\n\n    .p-message-warn.p-message-simple {\n        color: dt('message.warn.simple.color');\n    }\n\n    .p-message-error {\n        background: dt('message.error.background');\n        outline-color: dt('message.error.border.color');\n        color: dt('message.error.color');\n        box-shadow: dt('message.error.shadow');\n    }\n\n    .p-message-error .p-message-close-button:focus-visible {\n        outline-color: dt('message.error.close.button.focus.ring.color');\n        box-shadow: dt('message.error.close.button.focus.ring.shadow');\n    }\n\n    .p-message-error .p-message-close-button:hover {\n        background: dt('message.error.close.button.hover.background');\n    }\n\n    .p-message-error.p-message-outlined {\n        color: dt('message.error.outlined.color');\n        outline-color: dt('message.error.outlined.border.color');\n    }\n\n    .p-message-error.p-message-simple {\n        color: dt('message.error.simple.color');\n    }\n\n    .p-message-secondary {\n        background: dt('message.secondary.background');\n        outline-color: dt('message.secondary.border.color');\n        color: dt('message.secondary.color');\n        box-shadow: dt('message.secondary.shadow');\n    }\n\n    .p-message-secondary .p-message-close-button:focus-visible {\n        outline-color: dt('message.secondary.close.button.focus.ring.color');\n        box-shadow: dt('message.secondary.close.button.focus.ring.shadow');\n    }\n\n    .p-message-secondary .p-message-close-button:hover {\n        background: dt('message.secondary.close.button.hover.background');\n    }\n\n    .p-message-secondary.p-message-outlined {\n        color: dt('message.secondary.outlined.color');\n        outline-color: dt('message.secondary.outlined.border.color');\n    }\n\n    .p-message-secondary.p-message-simple {\n        color: dt('message.secondary.simple.color');\n    }\n\n    .p-message-contrast {\n        background: dt('message.contrast.background');\n        outline-color: dt('message.contrast.border.color');\n        color: dt('message.contrast.color');\n        box-shadow: dt('message.contrast.shadow');\n    }\n\n    .p-message-contrast .p-message-close-button:focus-visible {\n        outline-color: dt('message.contrast.close.button.focus.ring.color');\n        box-shadow: dt('message.contrast.close.button.focus.ring.shadow');\n    }\n\n    .p-message-contrast .p-message-close-button:hover {\n        background: dt('message.contrast.close.button.hover.background');\n    }\n\n    .p-message-contrast.p-message-outlined {\n        color: dt('message.contrast.outlined.color');\n        outline-color: dt('message.contrast.outlined.border.color');\n    }\n\n    .p-message-contrast.p-message-simple {\n        color: dt('message.contrast.simple.color');\n    }\n\n    .p-message-text {\n        font-size: dt('message.text.font.size');\n        font-weight: dt('message.text.font.weight');\n    }\n\n    .p-message-icon {\n        font-size: dt('message.icon.size');\n        width: dt('message.icon.size');\n        height: dt('message.icon.size');\n    }\n\n    .p-message-sm .p-message-content {\n        padding: dt('message.content.sm.padding');\n    }\n\n    .p-message-sm .p-message-text {\n        font-size: dt('message.text.sm.font.size');\n    }\n\n    .p-message-sm .p-message-icon {\n        font-size: dt('message.icon.sm.size');\n        width: dt('message.icon.sm.size');\n        height: dt('message.icon.sm.size');\n    }\n\n    .p-message-sm .p-message-close-icon {\n        font-size: dt('message.close.icon.sm.size');\n        width: dt('message.close.icon.sm.size');\n        height: dt('message.close.icon.sm.size');\n    }\n\n    .p-message-lg .p-message-content {\n        padding: dt('message.content.lg.padding');\n    }\n\n    .p-message-lg .p-message-text {\n        font-size: dt('message.text.lg.font.size');\n    }\n\n    .p-message-lg .p-message-icon {\n        font-size: dt('message.icon.lg.size');\n        width: dt('message.icon.lg.size');\n        height: dt('message.icon.lg.size');\n    }\n\n    .p-message-lg .p-message-close-icon {\n        font-size: dt('message.close.icon.lg.size');\n        width: dt('message.close.icon.lg.size');\n        height: dt('message.close.icon.lg.size');\n    }\n\n    .p-message-outlined {\n        background: transparent;\n        outline-width: dt('message.outlined.border.width');\n    }\n\n    .p-message-simple {\n        background: transparent;\n        outline-color: transparent;\n        box-shadow: none;\n    }\n\n    .p-message-simple .p-message-content {\n        padding: dt('message.simple.content.padding');\n    }\n\n    .p-message-outlined .p-message-close-button:hover,\n    .p-message-simple .p-message-close-button:hover {\n        background: transparent;\n    }\n\n    .p-message-enter-active {\n        animation: p-animate-message-enter 0.3s ease-out forwards;\n        overflow: hidden;\n    }\n\n    .p-message-leave-active {\n        animation: p-animate-message-leave 0.15s ease-in forwards;\n        overflow: hidden;\n    }\n\n    @keyframes p-animate-message-enter {\n        from {\n            opacity: 0;\n            grid-template-rows: 0fr;\n        }\n        to {\n            opacity: 1;\n            grid-template-rows: 1fr;\n        }\n    }\n\n    @keyframes p-animate-message-leave {\n        from {\n            opacity: 1;\n            grid-template-rows: 1fr;\n        }\n        to {\n            opacity: 0;\n            margin: 0;\n            grid-template-rows: 0fr;\n        }\n    }\n",
	classes: {
		root: function(e) {
			var t = e.props;
			return ["p-message p-component p-message-" + t.severity, {
				"p-message-outlined": t.variant === "outlined",
				"p-message-simple": t.variant === "simple",
				"p-message-sm": t.size === "small",
				"p-message-lg": t.size === "large"
			}];
		},
		contentWrapper: "p-message-content-wrapper",
		content: "p-message-content",
		icon: "p-message-icon",
		text: "p-message-text",
		closeButton: "p-message-close-button",
		closeIcon: "p-message-close-icon"
	}
}), ka = {
	name: "BaseMessage",
	extends: Y,
	props: {
		severity: {
			type: String,
			default: "info"
		},
		closable: {
			type: Boolean,
			default: !1
		},
		life: {
			type: Number,
			default: null
		},
		icon: {
			type: String,
			default: void 0
		},
		closeIcon: {
			type: String,
			default: void 0
		},
		closeButtonProps: {
			type: null,
			default: null
		},
		size: {
			type: String,
			default: null
		},
		variant: {
			type: String,
			default: null
		}
	},
	style: Oa,
	provide: function() {
		return {
			$pcMessage: this,
			$parentInstance: this
		};
	}
};
function Aa(e) {
	"@babel/helpers - typeof";
	return Aa = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Aa(e);
}
function ja(e, t, n) {
	return (t = Ma(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Ma(e) {
	var t = Na(e, "string");
	return Aa(t) == "symbol" ? t : t + "";
}
function Na(e, t) {
	if (Aa(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (Aa(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Pa = {
	name: "Message",
	extends: ka,
	inheritAttrs: !1,
	emits: ["close", "life-end"],
	timeout: null,
	data: function() {
		return { visible: !0 };
	},
	mounted: function() {
		var e = this;
		this.life && setTimeout(function() {
			e.visible = !1, e.$emit("life-end");
		}, this.life);
	},
	methods: { close: function(e) {
		this.visible = !1, this.$emit("close", e);
	} },
	computed: {
		closeAriaLabel: function() {
			return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.close : void 0;
		},
		dataP: function() {
			return L(ja(ja({
				outlined: this.variant === "outlined",
				simple: this.variant === "simple"
			}, this.severity, this.severity), this.size, this.size));
		}
	},
	directives: { ripple: Xi },
	components: { TimesIcon: ba }
};
function Fa(e) {
	"@babel/helpers - typeof";
	return Fa = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Fa(e);
}
function Ia(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function La(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Ia(Object(n), !0).forEach(function(t) {
			Ra(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ia(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Ra(e, t, n) {
	return (t = za(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function za(e) {
	var t = Ba(e, "string");
	return Fa(t) == "symbol" ? t : t + "";
}
function Ba(e, t) {
	if (Fa(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (Fa(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Va = ["data-p"], Ha = ["data-p"], Ua = ["data-p"], Wa = ["aria-label", "data-p"], Ga = ["data-p"];
function Ka(t, o, s, c, l, d) {
	var p = y("TimesIcon"), m = b("ripple");
	return h(), n(e, u({
		name: "p-message",
		appear: ""
	}, t.ptmi("transition")), {
		default: D(function() {
			return [l.visible ? (h(), i("div", u({
				key: 0,
				class: t.cx("root"),
				role: "alert",
				"aria-live": "assertive",
				"aria-atomic": "true",
				"data-p": d.dataP
			}, t.ptm("root")), [a("div", u({ class: t.cx("contentWrapper") }, t.ptm("contentWrapper")), [t.$slots.container ? v(t.$slots, "container", {
				key: 0,
				closeCallback: d.close
			}) : (h(), i("div", u({
				key: 1,
				class: t.cx("content"),
				"data-p": d.dataP
			}, t.ptm("content")), [
				v(t.$slots, "icon", { class: f(t.cx("icon")) }, function() {
					return [(h(), n(x(t.icon ? "span" : null), u({
						class: [t.cx("icon"), t.icon],
						"data-p": d.dataP
					}, t.ptm("icon")), null, 16, ["class", "data-p"]))];
				}),
				t.$slots.default ? (h(), i("div", u({
					key: 0,
					class: t.cx("text"),
					"data-p": d.dataP
				}, t.ptm("text")), [v(t.$slots, "default")], 16, Ua)) : r("", !0),
				t.closable ? O((h(), i("button", u({
					key: 1,
					class: t.cx("closeButton"),
					"aria-label": d.closeAriaLabel,
					type: "button",
					onClick: o[0] ||= function(e) {
						return d.close(e);
					},
					"data-p": d.dataP
				}, La(La({}, t.closeButtonProps), t.ptm("closeButton"))), [v(t.$slots, "closeicon", {}, function() {
					return [t.closeIcon ? (h(), i("i", u({
						key: 0,
						class: [t.cx("closeIcon"), t.closeIcon],
						"data-p": d.dataP
					}, t.ptm("closeIcon")), null, 16, Ga)) : (h(), n(p, u({
						key: 1,
						class: [t.cx("closeIcon"), t.closeIcon],
						"data-p": d.dataP
					}, t.ptm("closeIcon")), null, 16, ["class", "data-p"]))];
				})], 16, Wa)), [[m]]) : r("", !0)
			], 16, Ha))], 16)], 16, Va)) : r("", !0)];
		}),
		_: 3
	}, 16);
}
Pa.render = Ka;
//#endregion
//#region node_modules/primevue/iconfield/index.mjs
var qa = {
	name: "IconField",
	extends: {
		name: "BaseIconField",
		extends: Y,
		style: G.extend({
			name: "iconfield",
			style: "\n    .p-iconfield {\n        position: relative;\n        display: block;\n    }\n\n    .p-inputicon {\n        position: absolute;\n        top: 50%;\n        margin-top: calc(-1 * (dt('icon.size') / 2));\n        color: dt('iconfield.icon.color');\n        line-height: 1;\n        z-index: 1;\n    }\n\n    .p-iconfield .p-inputicon:first-child {\n        inset-inline-start: dt('form.field.padding.x');\n    }\n\n    .p-iconfield .p-inputicon:last-child {\n        inset-inline-end: dt('form.field.padding.x');\n    }\n\n    .p-iconfield .p-inputtext:not(:first-child),\n    .p-iconfield .p-inputwrapper:not(:first-child) .p-inputtext {\n        padding-inline-start: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));\n    }\n\n    .p-iconfield .p-inputtext:not(:last-child) {\n        padding-inline-end: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));\n    }\n\n    .p-iconfield:has(.p-inputfield-sm) .p-inputicon {\n        font-size: dt('form.field.sm.font.size');\n        width: dt('form.field.sm.font.size');\n        height: dt('form.field.sm.font.size');\n        margin-top: calc(-1 * (dt('form.field.sm.font.size') / 2));\n    }\n\n    .p-iconfield:has(.p-inputfield-lg) .p-inputicon {\n        font-size: dt('form.field.lg.font.size');\n        width: dt('form.field.lg.font.size');\n        height: dt('form.field.lg.font.size');\n        margin-top: calc(-1 * (dt('form.field.lg.font.size') / 2));\n    }\n",
			classes: { root: "p-iconfield" }
		}),
		provide: function() {
			return {
				$pcIconField: this,
				$parentInstance: this
			};
		}
	},
	inheritAttrs: !1
};
function Ja(e, t, n, r, a, o) {
	return h(), i("div", u({ class: e.cx("root") }, e.ptmi("root")), [v(e.$slots, "default")], 16);
}
qa.render = Ja;
//#endregion
//#region node_modules/primevue/inputicon/index.mjs
var Ya = {
	name: "InputIcon",
	extends: {
		name: "BaseInputIcon",
		extends: Y,
		style: G.extend({
			name: "inputicon",
			classes: { root: "p-inputicon" }
		}),
		props: { class: null },
		provide: function() {
			return {
				$pcInputIcon: this,
				$parentInstance: this
			};
		}
	},
	inheritAttrs: !1,
	computed: { containerClass: function() {
		return [this.cx("root"), this.class];
	} }
};
function Xa(e, t, n, r, a, o) {
	return h(), i("span", u({ class: o.containerClass }, e.ptmi("root"), { "aria-hidden": "true" }), [v(e.$slots, "default")], 16);
}
Ya.render = Xa;
//#endregion
//#region src/helpers/hasContent.ts
function Za(e, t = !1) {
	let n = C(e);
	return !n || n === "null" || n === "undefined" ? !1 : typeof n == "number" ? n === 0 ? t : !0 : typeof n == "string" ? n.trim().length > 0 : Array.isArray(n) ? n.length > 0 : String(n) === "[object Object]" ? n instanceof Map || n instanceof Set ? n.size > 0 : typeof n == "object" ? Object.keys(n).length > 0 : n.length > 0 : String(n).length > 0;
}
//#endregion
//#region src/components/InputBase.vue?vue&type=script&setup=true&lang.ts
var Qa = {
	key: 0,
	for: "in_label",
	class: "max-input-label active"
}, $a = {
	key: 2,
	style: {
		height: "16px",
		width: "100%"
	}
}, eo = {
	key: 3,
	class: "is-done"
}, to = {
	key: 4,
	class: "required"
}, no = /* @__PURE__ */ c({
	__name: "InputBase",
	props: {
		value: { default: "" },
		modelValue: {},
		icon: {},
		iconLeft: {},
		iconRight: {},
		i: {},
		disabled: { type: Boolean },
		float: { type: Boolean },
		msg: {},
		message: {},
		iconMessage: {},
		label: {},
		done: { type: Boolean },
		error: { type: [String, Boolean] },
		caution: { type: [String, Boolean] },
		required: { type: Boolean }
	},
	setup(e) {
		let a = w(), c = e, l = t(() => Za(c.message ?? c.msg) ? c.message ?? c.msg : typeof c.error == "string" && Za(c.error) ? c.error : typeof c.caution == "string" && Za(c.caution) ? c.caution : !1);
		return (t, c) => (h(), n(C(va), {
			variant: "on",
			class: f(["max-input-base", {
				float: C(a).float !== void 0,
				done: e.done,
				caution: e.caution || e.done === !1
			}])
		}, {
			default: D(() => [
				s(C(qa), null, {
					default: D(() => [
						e.icon ?? e.iconLeft ?? e.i ? (h(), n(C(Ya), { key: 0 }, {
							default: D(() => [s(pa, { icon: e.icon ?? e.iconLeft ?? e.i }, null, 8, ["icon"])]),
							_: 1
						})) : r("", !0),
						v(t.$slots, "default"),
						e.iconRight ? (h(), n(C(Ya), { key: 1 }, {
							default: D(() => [s(pa, { icon: e.iconRight }, null, 8, ["icon"])]),
							_: 1
						})) : r("", !0)
					]),
					_: 3
				}),
				e.label ? (h(), i("label", Qa, S(e.label), 1)) : r("", !0),
				l.value ? (h(), n(C(Pa), {
					key: 1,
					size: "small",
					class: f(`input-message ${e.done === !1 ? "error" : ""}`),
					variant: "simple"
				}, {
					icon: D(() => [e.iconMessage ? (h(), n(pa, {
						key: 0,
						icon: e.iconMessage,
						size: .9
					}, null, 8, ["icon"])) : r("", !0)]),
					default: D(() => [o(" " + S(l.value), 1)]),
					_: 1
				}, 8, ["class"])) : (h(), i("div", $a)),
				e.done ? (h(), i("div", eo, [s(pa, {
					icon: "lets-icons:check-fill",
					size: .9
				})])) : e.required ? (h(), i("div", to, "**a")) : r("", !0)
			]),
			_: 3
		}, 8, ["class"]));
	}
}), ro = {
	name: "BaseInputText",
	extends: {
		name: "BaseInput",
		extends: {
			name: "BaseEditableHolder",
			extends: Y,
			emits: ["update:modelValue", "value-change"],
			props: {
				modelValue: {
					type: null,
					default: void 0
				},
				defaultValue: {
					type: null,
					default: void 0
				},
				name: {
					type: String,
					default: void 0
				},
				invalid: {
					type: Boolean,
					default: void 0
				},
				disabled: {
					type: Boolean,
					default: !1
				},
				formControl: {
					type: Object,
					default: void 0
				}
			},
			inject: {
				$parentInstance: { default: void 0 },
				$pcForm: { default: void 0 },
				$pcFormField: { default: void 0 }
			},
			data: function() {
				return { d_value: this.defaultValue === void 0 ? this.modelValue : this.defaultValue };
			},
			watch: {
				modelValue: {
					deep: !0,
					handler: function(e) {
						this.d_value = e;
					}
				},
				defaultValue: function(e) {
					this.d_value = e;
				},
				$formName: {
					immediate: !0,
					handler: function(e) {
						var t, n;
						this.formField = ((t = this.$pcForm) == null || (n = t.register) == null ? void 0 : n.call(t, e, this.$formControl)) || {};
					}
				},
				$formControl: {
					immediate: !0,
					handler: function(e) {
						var t, n;
						this.formField = ((t = this.$pcForm) == null || (n = t.register) == null ? void 0 : n.call(t, this.$formName, e)) || {};
					}
				},
				$formDefaultValue: {
					immediate: !0,
					handler: function(e) {
						this.d_value !== e && (this.d_value = e);
					}
				},
				$formValue: {
					immediate: !1,
					handler: function(e) {
						var t;
						(t = this.$pcForm) != null && t.getFieldState(this.$formName) && e !== this.d_value && (this.d_value = e);
					}
				}
			},
			formField: {},
			methods: {
				writeValue: function(e, t) {
					var n, r;
					this.controlled && (this.d_value = e, this.$emit("update:modelValue", e)), this.$emit("value-change", e), (n = (r = this.formField).onChange) == null || n.call(r, {
						originalEvent: t,
						value: e
					});
				},
				findNonEmpty: function() {
					return [...arguments].find(j);
				}
			},
			computed: {
				$filled: function() {
					return j(this.d_value);
				},
				$invalid: function() {
					var e, t;
					return !this.$formNovalidate && this.findNonEmpty(this.invalid, (e = this.$pcFormField) == null || (e = e.$field) == null ? void 0 : e.invalid, (t = this.$pcForm) == null || (t = t.getFieldState(this.$formName)) == null ? void 0 : t.invalid);
				},
				$formName: function() {
					return this.$formNovalidate ? void 0 : this.name || this.$formControl?.name;
				},
				$formControl: function() {
					return this.formControl || this.$pcFormField?.formControl;
				},
				$formNovalidate: function() {
					return this.$formControl?.novalidate;
				},
				$formDefaultValue: function() {
					var e;
					return this.findNonEmpty(this.d_value, this.$pcFormField?.initialValue, (e = this.$pcForm) == null || (e = e.initialValues) == null ? void 0 : e[this.$formName]);
				},
				$formValue: function() {
					var e, t;
					return this.findNonEmpty((e = this.$pcFormField) == null || (e = e.$field) == null ? void 0 : e.value, (t = this.$pcForm) == null || (t = t.getFieldState(this.$formName)) == null ? void 0 : t.value);
				},
				controlled: function() {
					return this.$inProps.hasOwnProperty("modelValue") || !this.$inProps.hasOwnProperty("modelValue") && !this.$inProps.hasOwnProperty("defaultValue");
				},
				filled: function() {
					return this.$filled;
				}
			}
		},
		props: {
			size: {
				type: String,
				default: null
			},
			fluid: {
				type: Boolean,
				default: null
			},
			variant: {
				type: String,
				default: null
			}
		},
		inject: {
			$parentInstance: { default: void 0 },
			$pcFluid: { default: void 0 }
		},
		computed: {
			$variant: function() {
				return this.variant ?? (this.$primevue.config.inputStyle || this.$primevue.config.inputVariant);
			},
			$fluid: function() {
				return this.fluid ?? !!this.$pcFluid;
			},
			hasFluid: function() {
				return this.$fluid;
			}
		}
	},
	style: G.extend({
		name: "inputtext",
		style: "\n    .p-inputtext {\n        font-family: inherit;\n        font-feature-settings: inherit;\n        font-size: 1rem;\n        color: dt('inputtext.color');\n        background: dt('inputtext.background');\n        padding-block: dt('inputtext.padding.y');\n        padding-inline: dt('inputtext.padding.x');\n        border: 1px solid dt('inputtext.border.color');\n        transition:\n            background dt('inputtext.transition.duration'),\n            color dt('inputtext.transition.duration'),\n            border-color dt('inputtext.transition.duration'),\n            outline-color dt('inputtext.transition.duration'),\n            box-shadow dt('inputtext.transition.duration');\n        appearance: none;\n        border-radius: dt('inputtext.border.radius');\n        outline-color: transparent;\n        box-shadow: dt('inputtext.shadow');\n    }\n\n    .p-inputtext:enabled:hover {\n        border-color: dt('inputtext.hover.border.color');\n    }\n\n    .p-inputtext:enabled:focus {\n        border-color: dt('inputtext.focus.border.color');\n        box-shadow: dt('inputtext.focus.ring.shadow');\n        outline: dt('inputtext.focus.ring.width') dt('inputtext.focus.ring.style') dt('inputtext.focus.ring.color');\n        outline-offset: dt('inputtext.focus.ring.offset');\n    }\n\n    .p-inputtext.p-invalid {\n        border-color: dt('inputtext.invalid.border.color');\n    }\n\n    .p-inputtext.p-variant-filled {\n        background: dt('inputtext.filled.background');\n    }\n\n    .p-inputtext.p-variant-filled:enabled:hover {\n        background: dt('inputtext.filled.hover.background');\n    }\n\n    .p-inputtext.p-variant-filled:enabled:focus {\n        background: dt('inputtext.filled.focus.background');\n    }\n\n    .p-inputtext:disabled {\n        opacity: 1;\n        background: dt('inputtext.disabled.background');\n        color: dt('inputtext.disabled.color');\n    }\n\n    .p-inputtext::placeholder {\n        color: dt('inputtext.placeholder.color');\n    }\n\n    .p-inputtext.p-invalid::placeholder {\n        color: dt('inputtext.invalid.placeholder.color');\n    }\n\n    .p-inputtext-sm {\n        font-size: dt('inputtext.sm.font.size');\n        padding-block: dt('inputtext.sm.padding.y');\n        padding-inline: dt('inputtext.sm.padding.x');\n    }\n\n    .p-inputtext-lg {\n        font-size: dt('inputtext.lg.font.size');\n        padding-block: dt('inputtext.lg.padding.y');\n        padding-inline: dt('inputtext.lg.padding.x');\n    }\n\n    .p-inputtext-fluid {\n        width: 100%;\n    }\n",
		classes: { root: function(e) {
			var t = e.instance, n = e.props;
			return ["p-inputtext p-component", {
				"p-filled": t.$filled,
				"p-inputtext-sm p-inputfield-sm": n.size === "small",
				"p-inputtext-lg p-inputfield-lg": n.size === "large",
				"p-invalid": t.$invalid,
				"p-variant-filled": t.$variant === "filled",
				"p-inputtext-fluid": t.$fluid
			}];
		} }
	}),
	provide: function() {
		return {
			$pcInputText: this,
			$parentInstance: this
		};
	}
};
function io(e) {
	"@babel/helpers - typeof";
	return io = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, io(e);
}
function ao(e, t, n) {
	return (t = oo(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function oo(e) {
	var t = so(e, "string");
	return io(t) == "symbol" ? t : t + "";
}
function so(e, t) {
	if (io(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t);
		if (io(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var co = {
	name: "InputText",
	extends: ro,
	inheritAttrs: !1,
	methods: { onInput: function(e) {
		this.writeValue(e.target.value, e);
	} },
	computed: {
		attrs: function() {
			return u(this.ptmi("root", { context: {
				filled: this.$filled,
				disabled: this.disabled
			} }), this.formField);
		},
		dataP: function() {
			return L(ao({
				invalid: this.$invalid,
				fluid: this.$fluid,
				filled: this.$variant === "filled"
			}, this.size, this.size));
		}
	}
}, lo = [
	"value",
	"name",
	"disabled",
	"aria-invalid",
	"data-p"
];
function uo(e, t, n, r, a, o) {
	return h(), i("input", u({
		type: "text",
		class: e.cx("root"),
		value: e.d_value,
		name: e.name,
		disabled: e.disabled,
		"aria-invalid": e.$invalid || void 0,
		"data-p": o.dataP,
		onInput: t[0] ||= function() {
			return o.onInput && o.onInput.apply(o, arguments);
		}
	}, o.attrs), null, 16, lo);
}
co.render = uo;
//#endregion
//#region src/helpers/normalizeToSearch.ts
function fo(e) {
	return e ? e.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").replace(/\s+/g, "").toLowerCase() : "";
}
//#endregion
//#region src/components/MaxInputText.vue
var po = /* @__PURE__ */ c({
	__name: "MaxInputText",
	props: {
		modelValue: { default: "" },
		icon: {},
		i: {},
		disabled: { type: Boolean },
		float: { type: Boolean },
		msg: {},
		message: {},
		iconMessage: {},
		label: {},
		done: {
			type: Boolean,
			default: void 0
		},
		error: { type: [String, Boolean] },
		targetValue: {},
		caution: {
			type: [String, Boolean],
			default: void 0
		},
		required: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["update:modelValue"],
	setup(e, { emit: r }) {
		let i = w(), a = e, o = _(a.modelValue), c = _(a.done ?? null), l = t(() => typeof a.targetValue == "string" && Za(a.targetValue) ? fo(a.targetValue) === fo(o.value) : null), d = t(() => a.required ? Za(o.value) : null), f = () => a.done === void 0 ? l.value === null ? d.value === null ? a.caution === void 0 ? null : !a.caution : d.value : l.value : a.done, p = t(() => (a.caution === void 0 || a.caution) && c.value === !1), m = t(() => {
			if (!p.value) return null;
			let e = i.errMsg ?? i.error_message ?? i.error_msg ?? null;
			return l.value === !1 ? e ?? "Valor esperado: " + (i.target_value ?? i.targetValue ?? i["target-value"]) : d.value === !1 ? e ?? "Campo obrigatório" : e ?? "Valor inválido";
		}), g = r;
		return E(o, () => {
			c.value = f(), g("update:modelValue", o.value);
		}), E(() => a.modelValue, () => o.value = a.modelValue), (e, t) => (h(), n(no, u(a, {
			value: o.value,
			done: c.value,
			error: m.value,
			caution: p.value
		}), {
			default: D(() => [s(C(co), {
				type: "text",
				modelValue: o.value,
				"onUpdate:modelValue": t[0] ||= (e) => o.value = e,
				fluid: "",
				onBlur: t[1] ||= (e) => c.value = f()
			}, null, 8, ["modelValue"])]),
			_: 1
		}, 16, [
			"value",
			"done",
			"error",
			"caution"
		]));
	}
}), mo = /* @__PURE__ */ c({
	__name: "Grid",
	setup(e) {
		let t = w();
		return (e, n) => (h(), i("div", null, [a("div", u({ class: "max-grid-cols" }, C(t), {
			"col-gap-8": "",
			"row-gap-18": "",
			pt14: ""
		}), [v(e.$slots, "default")], 16)]));
	}
});
//#endregion
//#region src/index.ts
function ho(e) {
	e.use(qt, {
		locale: Br,
		theme: {
			preset: zr,
			options: {
				darkModeSelector: ".dark",
				prefix: "max"
			}
		},
		ripple: !0
	});
}
//#endregion
export { ga as Button, ga as MaxButton, mo as Grid, po as InputText, po as MaxInputText, pa as MaxIcon, ho as default };

//# sourceMappingURL=index.es.js.map