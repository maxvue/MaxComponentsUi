import { ref as Et, readonly as nn, getCurrentInstance as Xt, onMounted as on, nextTick as rn, watch as an, useId as ln, mergeProps as L, openBlock as R, createElementBlock as pt, createElementVNode as sn, renderSlot as dt, createTextVNode as un, toDisplayString as $e, resolveComponent as Yt, resolveDirective as dn, withDirectives as cn, createBlock as Lt, resolveDynamicComponent as pn, withCtx as bn, createCommentVNode as It, normalizeClass as zt, defineComponent as fn, computed as mn, unref as hn } from "vue";
function bt(...t) {
  if (t) {
    let e = [];
    for (let n = 0; n < t.length; n++) {
      let o = t[n];
      if (!o) continue;
      let r = typeof o;
      if (r === "string" || r === "number") e.push(o);
      else if (r === "object") {
        let s = Array.isArray(o) ? [bt(...o)] : Object.entries(o).map(([l, i]) => i ? l : void 0);
        e = s.length ? e.concat(s.filter((l) => !!l)) : e;
      }
    }
    return e.join(" ").trim();
  }
}
function gn(t, e) {
  return t ? t.classList ? t.classList.contains(e) : new RegExp("(^| )" + e + "( |$)", "gi").test(t.className) : !1;
}
function vn(t, e) {
  if (t && e) {
    let n = (o) => {
      gn(t, o) || (t.classList ? t.classList.add(o) : t.className += " " + o);
    };
    [e].flat().filter(Boolean).forEach((o) => o.split(" ").forEach(n));
  }
}
function Vt(t, e) {
  if (t && e) {
    let n = (o) => {
      t.classList ? t.classList.remove(o) : t.className = t.className.replace(new RegExp("(^|\\b)" + o.split(" ").join("|") + "(\\b|$)", "gi"), " ");
    };
    [e].flat().filter(Boolean).forEach((o) => o.split(" ").forEach(n));
  }
}
function Qt(t) {
  return t ? Math.abs(t.scrollLeft) : 0;
}
function yn(t, e) {
  return t instanceof HTMLElement ? t.offsetWidth : 0;
}
function Sn(t) {
  if (t) {
    let e = t.parentNode;
    return e && e instanceof ShadowRoot && e.host && (e = e.host), e;
  }
  return null;
}
function $n(t) {
  return !!(t !== null && typeof t < "u" && t.nodeName && Sn(t));
}
function Pt(t) {
  return typeof Element < "u" ? t instanceof Element : t !== null && typeof t == "object" && t.nodeType === 1 && typeof t.nodeName == "string";
}
function At(t, e = {}) {
  if (Pt(t)) {
    let n = (o, r) => {
      var s, l;
      let i = (s = t == null ? void 0 : t.$attrs) != null && s[o] ? [(l = t == null ? void 0 : t.$attrs) == null ? void 0 : l[o]] : [];
      return [r].flat().reduce((a, u) => {
        if (u != null) {
          let d = typeof u;
          if (d === "string" || d === "number") a.push(u);
          else if (d === "object") {
            let c = Array.isArray(u) ? n(o, u) : Object.entries(u).map(([p, b]) => o === "style" && (b || b === 0) ? `${p.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}:${b}` : b ? p : void 0);
            a = c.length ? a.concat(c.filter((p) => !!p)) : a;
          }
        }
        return a;
      }, i);
    };
    Object.entries(e).forEach(([o, r]) => {
      if (r != null) {
        let s = o.match(/^on(.+)/);
        s ? t.addEventListener(s[1].toLowerCase(), r) : o === "p-bind" || o === "pBind" ? At(t, r) : (r = o === "class" ? [...new Set(n("class", r))].join(" ").trim() : o === "style" ? n("style", r).join(";").trim() : r, (t.$attrs = t.$attrs || {}) && (t.$attrs[o] = r), t.setAttribute(o, r));
      }
    });
  }
}
function _n(t, e = {}, ...n) {
  {
    let o = document.createElement(t);
    return At(o, e), o.append(...n), o;
  }
}
function kn(t, e) {
  return Pt(t) ? t.matches(e) ? t : t.querySelector(e) : null;
}
function wn(t, e) {
  if (Pt(t)) {
    let n = t.getAttribute(e);
    return isNaN(n) ? n === "true" || n === "false" ? n === "true" : n : +n;
  }
}
function Jt(t) {
  if (t) {
    let e = t.offsetHeight, n = getComputedStyle(t);
    return e -= parseFloat(n.paddingTop) + parseFloat(n.paddingBottom) + parseFloat(n.borderTopWidth) + parseFloat(n.borderBottomWidth), e;
  }
  return 0;
}
function Pn(t) {
  if (t) {
    let e = t.getBoundingClientRect();
    return { top: e.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0), left: e.left + (window.pageXOffset || Qt(document.documentElement) || Qt(document.body) || 0) };
  }
  return { top: "auto", left: "auto" };
}
function On(t, e) {
  return t ? t.offsetHeight : 0;
}
function te(t) {
  if (t) {
    let e = t.offsetWidth, n = getComputedStyle(t);
    return e -= parseFloat(n.paddingLeft) + parseFloat(n.paddingRight) + parseFloat(n.borderLeftWidth) + parseFloat(n.borderRightWidth), e;
  }
  return 0;
}
function xn() {
  return !!(typeof window < "u" && window.document && window.document.createElement);
}
function Cn(t, e = "", n) {
  Pt(t) && n !== null && n !== void 0 && t.setAttribute(e, n);
}
function _e() {
  let t = /* @__PURE__ */ new Map();
  return { on(e, n) {
    let o = t.get(e);
    return o ? o.push(n) : o = [n], t.set(e, o), this;
  }, off(e, n) {
    let o = t.get(e);
    return o && o.splice(o.indexOf(n) >>> 0, 1), this;
  }, emit(e, n) {
    let o = t.get(e);
    o && o.forEach((r) => {
      r(n);
    });
  }, clear() {
    t.clear();
  } };
}
function ot(t) {
  return t == null || t === "" || Array.isArray(t) && t.length === 0 || !(t instanceof Date) && typeof t == "object" && Object.keys(t).length === 0;
}
function Ht(t) {
  return typeof t == "function" && "call" in t && "apply" in t;
}
function O(t) {
  return !ot(t);
}
function Z(t, e = !0) {
  return t instanceof Object && t.constructor === Object && (e || Object.keys(t).length !== 0);
}
function N(t, ...e) {
  return Ht(t) ? t(...e) : t;
}
function A(t, e = !0) {
  return typeof t == "string" && (e || t !== "");
}
function z(t) {
  return A(t) ? t.replace(/(-|_)/g, "").toLowerCase() : t;
}
function Ft(t, e = "", n = {}) {
  let o = z(e).split("."), r = o.shift();
  if (r) {
    if (Z(t)) {
      let s = Object.keys(t).find((l) => z(l) === r) || "";
      return Ft(N(t[s], n), o.join("."), n);
    }
    return;
  }
  return N(t, n);
}
function ke(t, e = !0) {
  return Array.isArray(t) && (e || t.length !== 0);
}
function Tn(t) {
  return O(t) && !isNaN(t);
}
function et(t, e) {
  if (e) {
    let n = e.test(t);
    return e.lastIndex = 0, n;
  }
  return !1;
}
function ft(t) {
  return t && t.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "").replace(/ {2,}/g, " ").replace(/ ([{:}]) /g, "$1").replace(/([;,]) /g, "$1").replace(/ !/g, "!").replace(/: /g, ":").trim();
}
function jn(t) {
  return A(t, !1) ? t[0].toUpperCase() + t.slice(1) : t;
}
function we(t) {
  return A(t) ? t.replace(/(_)/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() : t;
}
var xt = {};
function Ln(t = "pui_id_") {
  return Object.hasOwn(xt, t) || (xt[t] = 0), xt[t]++, `${t}${xt[t]}`;
}
var An = Object.defineProperty, Nn = Object.defineProperties, En = Object.getOwnPropertyDescriptors, Nt = Object.getOwnPropertySymbols, Pe = Object.prototype.hasOwnProperty, Oe = Object.prototype.propertyIsEnumerable, ee = (t, e, n) => e in t ? An(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n, V = (t, e) => {
  for (var n in e || (e = {})) Pe.call(e, n) && ee(t, n, e[n]);
  if (Nt) for (var n of Nt(e)) Oe.call(e, n) && ee(t, n, e[n]);
  return t;
}, Bt = (t, e) => Nn(t, En(e)), U = (t, e) => {
  var n = {};
  for (var o in t) Pe.call(t, o) && e.indexOf(o) < 0 && (n[o] = t[o]);
  if (t != null && Nt) for (var o of Nt(t)) e.indexOf(o) < 0 && Oe.call(t, o) && (n[o] = t[o]);
  return n;
}, In = _e(), T = In, mt = /{([^}]*)}/g, xe = /(\d+\s+[\+\-\*\/]\s+\d+)/g, Ce = /var\([^)]+\)/g;
function ne(t) {
  return A(t) ? t.replace(/[A-Z]/g, (e, n) => n === 0 ? e : "." + e.toLowerCase()).toLowerCase() : t;
}
function Vn(t) {
  return Z(t) && t.hasOwnProperty("$value") && t.hasOwnProperty("$type") ? t.$value : t;
}
function Bn(t) {
  return t.replaceAll(/ /g, "").replace(/[^\w]/g, "-");
}
function Mt(t = "", e = "") {
  return Bn(`${A(t, !1) && A(e, !1) ? `${t}-` : t}${e}`);
}
function Te(t = "", e = "") {
  return `--${Mt(t, e)}`;
}
function Dn(t = "") {
  let e = (t.match(/{/g) || []).length, n = (t.match(/}/g) || []).length;
  return (e + n) % 2 !== 0;
}
function je(t, e = "", n = "", o = [], r) {
  if (A(t)) {
    let s = t.trim();
    if (Dn(s)) return;
    if (et(s, mt)) {
      let l = s.replaceAll(mt, (i) => {
        let a = i.replace(/{|}/g, "").split(".").filter((u) => !o.some((d) => et(u, d)));
        return `var(${Te(n, we(a.join("-")))}${O(r) ? `, ${r}` : ""})`;
      });
      return et(l.replace(Ce, "0"), xe) ? `calc(${l})` : l;
    }
    return s;
  } else if (Tn(t)) return t;
}
function zn(t, e, n) {
  A(e, !1) && t.push(`${e}:${n};`);
}
function st(t, e) {
  return t ? `${t}{${e}}` : "";
}
function Le(t, e) {
  if (t.indexOf("dt(") === -1) return t;
  function n(l, i) {
    let a = [], u = 0, d = "", c = null, p = 0;
    for (; u <= l.length; ) {
      let b = l[u];
      if ((b === '"' || b === "'" || b === "`") && l[u - 1] !== "\\" && (c = c === b ? null : b), !c && (b === "(" && p++, b === ")" && p--, (b === "," || u === l.length) && p === 0)) {
        let m = d.trim();
        m.startsWith("dt(") ? a.push(Le(m, i)) : a.push(o(m)), d = "", u++;
        continue;
      }
      b !== void 0 && (d += b), u++;
    }
    return a;
  }
  function o(l) {
    let i = l[0];
    if ((i === '"' || i === "'" || i === "`") && l[l.length - 1] === i) return l.slice(1, -1);
    let a = Number(l);
    return isNaN(a) ? l : a;
  }
  let r = [], s = [];
  for (let l = 0; l < t.length; l++) if (t[l] === "d" && t.slice(l, l + 3) === "dt(") s.push(l), l += 2;
  else if (t[l] === ")" && s.length > 0) {
    let i = s.pop();
    s.length === 0 && r.push([i, l]);
  }
  if (!r.length) return t;
  for (let l = r.length - 1; l >= 0; l--) {
    let [i, a] = r[l], u = t.slice(i + 3, a), d = n(u, e), c = e(...d);
    t = t.slice(0, i) + c + t.slice(a + 1);
  }
  return t;
}
var nt = (...t) => Mn(P.getTheme(), ...t), Mn = (t = {}, e, n, o) => {
  if (e) {
    let { variable: r, options: s } = P.defaults || {}, { prefix: l, transform: i } = (t == null ? void 0 : t.options) || s || {}, a = et(e, mt) ? e : `{${e}}`;
    return o === "value" || ot(o) && i === "strict" ? P.getTokenValue(e) : je(a, void 0, l, [r.excludedKeyRegex], n);
  }
  return "";
};
function Ct(t, ...e) {
  if (t instanceof Array) {
    let n = t.reduce((o, r, s) => {
      var l;
      return o + r + ((l = N(e[s], { dt: nt })) != null ? l : "");
    }, "");
    return Le(n, nt);
  }
  return N(t, { dt: nt });
}
function Un(t, e = {}) {
  let n = P.defaults.variable, { prefix: o = n.prefix, selector: r = n.selector, excludedKeyRegex: s = n.excludedKeyRegex } = e, l = [], i = [], a = [{ node: t, path: o }];
  for (; a.length; ) {
    let { node: d, path: c } = a.pop();
    for (let p in d) {
      let b = d[p], m = Vn(b), g = et(p, s) ? Mt(c) : Mt(c, we(p));
      if (Z(m)) a.push({ node: m, path: g });
      else {
        let h = Te(g), y = je(m, g, o, [s]);
        zn(i, h, y);
        let _ = g;
        o && _.startsWith(o + "-") && (_ = _.slice(o.length + 1)), l.push(_.replace(/-/g, "."));
      }
    }
  }
  let u = i.join("");
  return { value: i, tokens: l, declarations: u, css: st(r, u) };
}
var I = { regex: { rules: { class: { pattern: /^\.([a-zA-Z][\w-]*)$/, resolve(t) {
  return { type: "class", selector: t, matched: this.pattern.test(t.trim()) };
} }, attr: { pattern: /^\[(.*)\]$/, resolve(t) {
  return { type: "attr", selector: `:root${t},:host${t}`, matched: this.pattern.test(t.trim()) };
} }, media: { pattern: /^@media (.*)$/, resolve(t) {
  return { type: "media", selector: t, matched: this.pattern.test(t.trim()) };
} }, system: { pattern: /^system$/, resolve(t) {
  return { type: "system", selector: "@media (prefers-color-scheme: dark)", matched: this.pattern.test(t.trim()) };
} }, custom: { resolve(t) {
  return { type: "custom", selector: t, matched: !0 };
} } }, resolve(t) {
  let e = Object.keys(this.rules).filter((n) => n !== "custom").map((n) => this.rules[n]);
  return [t].flat().map((n) => {
    var o;
    return (o = e.map((r) => r.resolve(n)).find((r) => r.matched)) != null ? o : this.rules.custom.resolve(n);
  });
} }, _toVariables(t, e) {
  return Un(t, { prefix: e == null ? void 0 : e.prefix });
}, getCommon({ name: t = "", theme: e = {}, params: n, set: o, defaults: r }) {
  var s, l, i, a, u, d, c;
  let { preset: p, options: b } = e, m, g, h, y, _, w, f;
  if (O(p) && b.transform !== "strict") {
    let { primitive: S, semantic: C, extend: E } = p, W = C || {}, { colorScheme: K } = W, q = U(W, ["colorScheme"]), H = E || {}, { colorScheme: X } = H, Y = U(H, ["colorScheme"]), F = K || {}, { dark: Q } = F, rt = U(F, ["dark"]), J = X || {}, { dark: at } = J, it = U(J, ["dark"]), M = O(S) ? this._toVariables({ primitive: S }, b) : {}, B = O(q) ? this._toVariables({ semantic: q }, b) : {}, tt = O(rt) ? this._toVariables({ light: rt }, b) : {}, Ot = O(Q) ? this._toVariables({ dark: Q }, b) : {}, lt = O(Y) ? this._toVariables({ semantic: Y }, b) : {}, Zt = O(it) ? this._toVariables({ light: it }, b) : {}, qt = O(at) ? this._toVariables({ dark: at }, b) : {}, [De, ze] = [(s = M.declarations) != null ? s : "", M.tokens], [Me, Ue] = [(l = B.declarations) != null ? l : "", B.tokens || []], [Re, We] = [(i = tt.declarations) != null ? i : "", tt.tokens || []], [Ke, He] = [(a = Ot.declarations) != null ? a : "", Ot.tokens || []], [Fe, Ge] = [(u = lt.declarations) != null ? u : "", lt.tokens || []], [Ze, qe] = [(d = Zt.declarations) != null ? d : "", Zt.tokens || []], [Xe, Ye] = [(c = qt.declarations) != null ? c : "", qt.tokens || []];
    m = this.transformCSS(t, De, "light", "variable", b, o, r), g = ze;
    let Qe = this.transformCSS(t, `${Me}${Re}`, "light", "variable", b, o, r), Je = this.transformCSS(t, `${Ke}`, "dark", "variable", b, o, r);
    h = `${Qe}${Je}`, y = [.../* @__PURE__ */ new Set([...Ue, ...We, ...He])];
    let tn = this.transformCSS(t, `${Fe}${Ze}color-scheme:light`, "light", "variable", b, o, r), en = this.transformCSS(t, `${Xe}color-scheme:dark`, "dark", "variable", b, o, r);
    _ = `${tn}${en}`, w = [.../* @__PURE__ */ new Set([...Ge, ...qe, ...Ye])], f = N(p.css, { dt: nt });
  }
  return { primitive: { css: m, tokens: g }, semantic: { css: h, tokens: y }, global: { css: _, tokens: w }, style: f };
}, getPreset({ name: t = "", preset: e = {}, options: n, params: o, set: r, defaults: s, selector: l }) {
  var i, a, u;
  let d, c, p;
  if (O(e) && n.transform !== "strict") {
    let b = t.replace("-directive", ""), m = e, { colorScheme: g, extend: h, css: y } = m, _ = U(m, ["colorScheme", "extend", "css"]), w = h || {}, { colorScheme: f } = w, S = U(w, ["colorScheme"]), C = g || {}, { dark: E } = C, W = U(C, ["dark"]), K = f || {}, { dark: q } = K, H = U(K, ["dark"]), X = O(_) ? this._toVariables({ [b]: V(V({}, _), S) }, n) : {}, Y = O(W) ? this._toVariables({ [b]: V(V({}, W), H) }, n) : {}, F = O(E) ? this._toVariables({ [b]: V(V({}, E), q) }, n) : {}, [Q, rt] = [(i = X.declarations) != null ? i : "", X.tokens || []], [J, at] = [(a = Y.declarations) != null ? a : "", Y.tokens || []], [it, M] = [(u = F.declarations) != null ? u : "", F.tokens || []], B = this.transformCSS(b, `${Q}${J}`, "light", "variable", n, r, s, l), tt = this.transformCSS(b, it, "dark", "variable", n, r, s, l);
    d = `${B}${tt}`, c = [.../* @__PURE__ */ new Set([...rt, ...at, ...M])], p = N(y, { dt: nt });
  }
  return { css: d, tokens: c, style: p };
}, getPresetC({ name: t = "", theme: e = {}, params: n, set: o, defaults: r }) {
  var s;
  let { preset: l, options: i } = e, a = (s = l == null ? void 0 : l.components) == null ? void 0 : s[t];
  return this.getPreset({ name: t, preset: a, options: i, params: n, set: o, defaults: r });
}, getPresetD({ name: t = "", theme: e = {}, params: n, set: o, defaults: r }) {
  var s, l;
  let i = t.replace("-directive", ""), { preset: a, options: u } = e, d = ((s = a == null ? void 0 : a.components) == null ? void 0 : s[i]) || ((l = a == null ? void 0 : a.directives) == null ? void 0 : l[i]);
  return this.getPreset({ name: i, preset: d, options: u, params: n, set: o, defaults: r });
}, applyDarkColorScheme(t) {
  return !(t.darkModeSelector === "none" || t.darkModeSelector === !1);
}, getColorSchemeOption(t, e) {
  var n;
  return this.applyDarkColorScheme(t) ? this.regex.resolve(t.darkModeSelector === !0 ? e.options.darkModeSelector : (n = t.darkModeSelector) != null ? n : e.options.darkModeSelector) : [];
}, getLayerOrder(t, e = {}, n, o) {
  let { cssLayer: r } = e;
  return r ? `@layer ${N(r.order || r.name || "primeui", n)}` : "";
}, getCommonStyleSheet({ name: t = "", theme: e = {}, params: n, props: o = {}, set: r, defaults: s }) {
  let l = this.getCommon({ name: t, theme: e, params: n, set: r, defaults: s }), i = Object.entries(o).reduce((a, [u, d]) => a.push(`${u}="${d}"`) && a, []).join(" ");
  return Object.entries(l || {}).reduce((a, [u, d]) => {
    if (Z(d) && Object.hasOwn(d, "css")) {
      let c = ft(d.css), p = `${u}-variables`;
      a.push(`<style type="text/css" data-primevue-style-id="${p}" ${i}>${c}</style>`);
    }
    return a;
  }, []).join("");
}, getStyleSheet({ name: t = "", theme: e = {}, params: n, props: o = {}, set: r, defaults: s }) {
  var l;
  let i = { name: t, theme: e, params: n, set: r, defaults: s }, a = (l = t.includes("-directive") ? this.getPresetD(i) : this.getPresetC(i)) == null ? void 0 : l.css, u = Object.entries(o).reduce((d, [c, p]) => d.push(`${c}="${p}"`) && d, []).join(" ");
  return a ? `<style type="text/css" data-primevue-style-id="${t}-variables" ${u}>${ft(a)}</style>` : "";
}, createTokens(t = {}, e, n = "", o = "", r = {}) {
  let s = function(i, a = {}, u = []) {
    if (u.includes(this.path)) return console.warn(`Circular reference detected at ${this.path}`), { colorScheme: i, path: this.path, paths: a, value: void 0 };
    u.push(this.path), a.name = this.path, a.binding || (a.binding = {});
    let d = this.value;
    if (typeof this.value == "string" && mt.test(this.value)) {
      let c = this.value.trim().replace(mt, (p) => {
        var b;
        let m = p.slice(1, -1), g = this.tokens[m];
        if (!g) return console.warn(`Token not found for path: ${m}`), "__UNRESOLVED__";
        let h = g.computed(i, a, u);
        return Array.isArray(h) && h.length === 2 ? `light-dark(${h[0].value},${h[1].value})` : (b = h == null ? void 0 : h.value) != null ? b : "__UNRESOLVED__";
      });
      d = xe.test(c.replace(Ce, "0")) ? `calc(${c})` : c;
    }
    return ot(a.binding) && delete a.binding, u.pop(), { colorScheme: i, path: this.path, paths: a, value: d.includes("__UNRESOLVED__") ? void 0 : d };
  }, l = (i, a, u) => {
    Object.entries(i).forEach(([d, c]) => {
      let p = et(d, e.variable.excludedKeyRegex) ? a : a ? `${a}.${ne(d)}` : ne(d), b = u ? `${u}.${d}` : d;
      Z(c) ? l(c, p, b) : (r[p] || (r[p] = { paths: [], computed: (m, g = {}, h = []) => {
        if (r[p].paths.length === 1) return r[p].paths[0].computed(r[p].paths[0].scheme, g.binding, h);
        if (m && m !== "none") for (let y = 0; y < r[p].paths.length; y++) {
          let _ = r[p].paths[y];
          if (_.scheme === m) return _.computed(m, g.binding, h);
        }
        return r[p].paths.map((y) => y.computed(y.scheme, g[y.scheme], h));
      } }), r[p].paths.push({ path: b, value: c, scheme: b.includes("colorScheme.light") ? "light" : b.includes("colorScheme.dark") ? "dark" : "none", computed: s, tokens: r }));
    });
  };
  return l(t, n, o), r;
}, getTokenValue(t, e, n) {
  var o;
  let r = ((i) => i.split(".").filter((a) => !et(a.toLowerCase(), n.variable.excludedKeyRegex)).join("."))(e), s = e.includes("colorScheme.light") ? "light" : e.includes("colorScheme.dark") ? "dark" : void 0, l = [(o = t[r]) == null ? void 0 : o.computed(s)].flat().filter((i) => i);
  return l.length === 1 ? l[0].value : l.reduce((i = {}, a) => {
    let u = a, { colorScheme: d } = u, c = U(u, ["colorScheme"]);
    return i[d] = c, i;
  }, void 0);
}, getSelectorRule(t, e, n, o) {
  return n === "class" || n === "attr" ? st(O(e) ? `${t}${e},${t} ${e}` : t, o) : st(t, st(e ?? ":root,:host", o));
}, transformCSS(t, e, n, o, r = {}, s, l, i) {
  if (O(e)) {
    let { cssLayer: a } = r;
    if (o !== "style") {
      let u = this.getColorSchemeOption(r, l);
      e = n === "dark" ? u.reduce((d, { type: c, selector: p }) => (O(p) && (d += p.includes("[CSS]") ? p.replace("[CSS]", e) : this.getSelectorRule(p, i, c, e)), d), "") : st(i ?? ":root,:host", e);
    }
    if (a) {
      let u = { name: "primeui" };
      Z(a) && (u.name = N(a.name, { name: t, type: o })), O(u.name) && (e = st(`@layer ${u.name}`, e), s == null || s.layerNames(u.name));
    }
    return e;
  }
  return "";
} }, P = { defaults: { variable: { prefix: "p", selector: ":root,:host", excludedKeyRegex: /^(primitive|semantic|components|directives|variables|colorscheme|light|dark|common|root|states|extend|css)$/gi }, options: { prefix: "p", darkModeSelector: "system", cssLayer: !1 } }, _theme: void 0, _layerNames: /* @__PURE__ */ new Set(), _loadedStyleNames: /* @__PURE__ */ new Set(), _loadingStyles: /* @__PURE__ */ new Set(), _tokens: {}, update(t = {}) {
  let { theme: e } = t;
  e && (this._theme = Bt(V({}, e), { options: V(V({}, this.defaults.options), e.options) }), this._tokens = I.createTokens(this.preset, this.defaults), this.clearLoadedStyleNames());
}, get theme() {
  return this._theme;
}, get preset() {
  var t;
  return ((t = this.theme) == null ? void 0 : t.preset) || {};
}, get options() {
  var t;
  return ((t = this.theme) == null ? void 0 : t.options) || {};
}, get tokens() {
  return this._tokens;
}, getTheme() {
  return this.theme;
}, setTheme(t) {
  this.update({ theme: t }), T.emit("theme:change", t);
}, getPreset() {
  return this.preset;
}, setPreset(t) {
  this._theme = Bt(V({}, this.theme), { preset: t }), this._tokens = I.createTokens(t, this.defaults), this.clearLoadedStyleNames(), T.emit("preset:change", t), T.emit("theme:change", this.theme);
}, getOptions() {
  return this.options;
}, setOptions(t) {
  this._theme = Bt(V({}, this.theme), { options: t }), this.clearLoadedStyleNames(), T.emit("options:change", t), T.emit("theme:change", this.theme);
}, getLayerNames() {
  return [...this._layerNames];
}, setLayerNames(t) {
  this._layerNames.add(t);
}, getLoadedStyleNames() {
  return this._loadedStyleNames;
}, isStyleNameLoaded(t) {
  return this._loadedStyleNames.has(t);
}, setLoadedStyleName(t) {
  this._loadedStyleNames.add(t);
}, deleteLoadedStyleName(t) {
  this._loadedStyleNames.delete(t);
}, clearLoadedStyleNames() {
  this._loadedStyleNames.clear();
}, getTokenValue(t) {
  return I.getTokenValue(this.tokens, t, this.defaults);
}, getCommon(t = "", e) {
  return I.getCommon({ name: t, theme: this.theme, params: e, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, getComponent(t = "", e) {
  let n = { name: t, theme: this.theme, params: e, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return I.getPresetC(n);
}, getDirective(t = "", e) {
  let n = { name: t, theme: this.theme, params: e, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return I.getPresetD(n);
}, getCustomPreset(t = "", e, n, o) {
  let r = { name: t, preset: e, options: this.options, selector: n, params: o, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return I.getPreset(r);
}, getLayerOrderCSS(t = "") {
  return I.getLayerOrder(t, this.options, { names: this.getLayerNames() }, this.defaults);
}, transformCSS(t = "", e, n = "style", o) {
  return I.transformCSS(t, e, o, n, this.options, { layerNames: this.setLayerNames.bind(this) }, this.defaults);
}, getCommonStyleSheet(t = "", e, n = {}) {
  return I.getCommonStyleSheet({ name: t, theme: this.theme, params: e, props: n, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, getStyleSheet(t, e, n = {}) {
  return I.getStyleSheet({ name: t, theme: this.theme, params: e, props: n, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, onStyleMounted(t) {
  this._loadingStyles.add(t);
}, onStyleUpdated(t) {
  this._loadingStyles.add(t);
}, onStyleLoaded(t, { name: e }) {
  this._loadingStyles.size && (this._loadingStyles.delete(e), T.emit(`theme:${e}:load`, t), !this._loadingStyles.size && T.emit("theme:load"));
} }, G = {
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
}, Rn = `
    *,
    ::before,
    ::after {
        box-sizing: border-box;
    }

    .p-collapsible-enter-active {
        animation: p-animate-collapsible-expand 0.2s ease-out;
        overflow: hidden;
    }

    .p-collapsible-leave-active {
        animation: p-animate-collapsible-collapse 0.2s ease-out;
        overflow: hidden;
    }

    @keyframes p-animate-collapsible-expand {
        from {
            grid-template-rows: 0fr;
        }
        to {
            grid-template-rows: 1fr;
        }
    }

    @keyframes p-animate-collapsible-collapse {
        from {
            grid-template-rows: 1fr;
        }
        to {
            grid-template-rows: 0fr;
        }
    }

    .p-disabled,
    .p-disabled * {
        cursor: default;
        pointer-events: none;
        user-select: none;
    }

    .p-disabled,
    .p-component:disabled {
        opacity: dt('disabled.opacity');
    }

    .pi {
        font-size: dt('icon.size');
    }

    .p-icon {
        width: dt('icon.size');
        height: dt('icon.size');
    }

    .p-overlay-mask {
        background: var(--px-mask-background, dt('mask.background'));
        color: dt('mask.color');
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .p-overlay-mask-enter-active {
        animation: p-animate-overlay-mask-enter dt('mask.transition.duration') forwards;
    }

    .p-overlay-mask-leave-active {
        animation: p-animate-overlay-mask-leave dt('mask.transition.duration') forwards;
    }

    @keyframes p-animate-overlay-mask-enter {
        from {
            background: transparent;
        }
        to {
            background: var(--px-mask-background, dt('mask.background'));
        }
    }
    @keyframes p-animate-overlay-mask-leave {
        from {
            background: var(--px-mask-background, dt('mask.background'));
        }
        to {
            background: transparent;
        }
    }

    .p-anchored-overlay-enter-active {
        animation: p-animate-anchored-overlay-enter 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-anchored-overlay-leave-active {
        animation: p-animate-anchored-overlay-leave 300ms cubic-bezier(.19,1,.22,1);
    }

    @keyframes p-animate-anchored-overlay-enter {
        from {
            opacity: 0;
            transform: scale(0.93);
        }
    }

    @keyframes p-animate-anchored-overlay-leave {
        to {
            opacity: 0;
            transform: scale(0.93);
        }
    }
`;
function ht(t) {
  "@babel/helpers - typeof";
  return ht = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, ht(t);
}
function oe(t, e) {
  var n = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(t);
    e && (o = o.filter(function(r) {
      return Object.getOwnPropertyDescriptor(t, r).enumerable;
    })), n.push.apply(n, o);
  }
  return n;
}
function re(t) {
  for (var e = 1; e < arguments.length; e++) {
    var n = arguments[e] != null ? arguments[e] : {};
    e % 2 ? oe(Object(n), !0).forEach(function(o) {
      Wn(t, o, n[o]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : oe(Object(n)).forEach(function(o) {
      Object.defineProperty(t, o, Object.getOwnPropertyDescriptor(n, o));
    });
  }
  return t;
}
function Wn(t, e, n) {
  return (e = Kn(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function Kn(t) {
  var e = Hn(t, "string");
  return ht(e) == "symbol" ? e : e + "";
}
function Hn(t, e) {
  if (ht(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (ht(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function Fn(t) {
  var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  Xt() && Xt().components ? on(t) : e ? t() : rn(t);
}
var Gn = 0;
function Zn(t) {
  var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = Et(!1), o = Et(t), r = Et(null), s = xn() ? window.document : void 0, l = e.document, i = l === void 0 ? s : l, a = e.immediate, u = a === void 0 ? !0 : a, d = e.manual, c = d === void 0 ? !1 : d, p = e.name, b = p === void 0 ? "style_".concat(++Gn) : p, m = e.id, g = m === void 0 ? void 0 : m, h = e.media, y = h === void 0 ? void 0 : h, _ = e.nonce, w = _ === void 0 ? void 0 : _, f = e.first, S = f === void 0 ? !1 : f, C = e.onMounted, E = C === void 0 ? void 0 : C, W = e.onUpdated, K = W === void 0 ? void 0 : W, q = e.onLoad, H = q === void 0 ? void 0 : q, X = e.props, Y = X === void 0 ? {} : X, F = function() {
  }, Q = function(at) {
    var it = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (i) {
      var M = re(re({}, Y), it), B = M.name || b, tt = M.id || g, Ot = M.nonce || w;
      r.value = i.querySelector('style[data-primevue-style-id="'.concat(B, '"]')) || i.getElementById(tt) || i.createElement("style"), r.value.isConnected || (o.value = at || t, At(r.value, {
        type: "text/css",
        id: tt,
        media: y,
        nonce: Ot
      }), S ? i.head.prepend(r.value) : i.head.appendChild(r.value), Cn(r.value, "data-primevue-style-id", B), At(r.value, M), r.value.onload = function(lt) {
        return H == null ? void 0 : H(lt, {
          name: B
        });
      }, E == null || E(B)), !n.value && (F = an(o, function(lt) {
        r.value.textContent = lt, K == null || K(B);
      }, {
        immediate: !0
      }), n.value = !0);
    }
  }, rt = function() {
    !i || !n.value || (F(), $n(r.value) && i.head.removeChild(r.value), n.value = !1, r.value = null);
  };
  return u && !c && Fn(Q), {
    id: g,
    name: b,
    el: r,
    css: o,
    unload: rt,
    load: Q,
    isLoaded: nn(n)
  };
}
function gt(t) {
  "@babel/helpers - typeof";
  return gt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, gt(t);
}
var ae, ie, le, se;
function ue(t, e) {
  return Qn(t) || Yn(t, e) || Xn(t, e) || qn();
}
function qn() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Xn(t, e) {
  if (t) {
    if (typeof t == "string") return de(t, e);
    var n = {}.toString.call(t).slice(8, -1);
    return n === "Object" && t.constructor && (n = t.constructor.name), n === "Map" || n === "Set" ? Array.from(t) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? de(t, e) : void 0;
  }
}
function de(t, e) {
  (e == null || e > t.length) && (e = t.length);
  for (var n = 0, o = Array(e); n < e; n++) o[n] = t[n];
  return o;
}
function Yn(t, e) {
  var n = t == null ? null : typeof Symbol < "u" && t[Symbol.iterator] || t["@@iterator"];
  if (n != null) {
    var o, r, s, l, i = [], a = !0, u = !1;
    try {
      if (s = (n = n.call(t)).next, e !== 0) for (; !(a = (o = s.call(n)).done) && (i.push(o.value), i.length !== e); a = !0) ;
    } catch (d) {
      u = !0, r = d;
    } finally {
      try {
        if (!a && n.return != null && (l = n.return(), Object(l) !== l)) return;
      } finally {
        if (u) throw r;
      }
    }
    return i;
  }
}
function Qn(t) {
  if (Array.isArray(t)) return t;
}
function ce(t, e) {
  var n = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(t);
    e && (o = o.filter(function(r) {
      return Object.getOwnPropertyDescriptor(t, r).enumerable;
    })), n.push.apply(n, o);
  }
  return n;
}
function Dt(t) {
  for (var e = 1; e < arguments.length; e++) {
    var n = arguments[e] != null ? arguments[e] : {};
    e % 2 ? ce(Object(n), !0).forEach(function(o) {
      Jn(t, o, n[o]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : ce(Object(n)).forEach(function(o) {
      Object.defineProperty(t, o, Object.getOwnPropertyDescriptor(n, o));
    });
  }
  return t;
}
function Jn(t, e, n) {
  return (e = to(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function to(t) {
  var e = eo(t, "string");
  return gt(e) == "symbol" ? e : e + "";
}
function eo(t, e) {
  if (gt(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (gt(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function Tt(t, e) {
  return e || (e = t.slice(0)), Object.freeze(Object.defineProperties(t, { raw: { value: Object.freeze(e) } }));
}
var no = function(e) {
  var n = e.dt;
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
    padding-right: `.concat(n("scrollbar.width"), `;
}
`);
}, oo = {}, ro = {}, x = {
  name: "base",
  css: no,
  style: Rn,
  classes: oo,
  inlineStyles: ro,
  load: function(e) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : function(s) {
      return s;
    }, r = o(Ct(ae || (ae = Tt(["", ""])), e));
    return O(r) ? Zn(ft(r), Dt({
      name: this.name
    }, n)) : {};
  },
  loadCSS: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return this.load(this.css, e);
  },
  loadStyle: function() {
    var e = this, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    return this.load(this.style, n, function() {
      var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
      return P.transformCSS(n.name || e.name, "".concat(r).concat(Ct(ie || (ie = Tt(["", ""])), o)));
    });
  },
  getCommonTheme: function(e) {
    return P.getCommon(this.name, e);
  },
  getComponentTheme: function(e) {
    return P.getComponent(this.name, e);
  },
  getDirectiveTheme: function(e) {
    return P.getDirective(this.name, e);
  },
  getPresetTheme: function(e, n, o) {
    return P.getCustomPreset(this.name, e, n, o);
  },
  getLayerOrderThemeCSS: function() {
    return P.getLayerOrderCSS(this.name);
  },
  getStyleSheet: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (this.css) {
      var o = N(this.css, {
        dt: nt
      }) || "", r = ft(Ct(le || (le = Tt(["", "", ""])), o, e)), s = Object.entries(n).reduce(function(l, i) {
        var a = ue(i, 2), u = a[0], d = a[1];
        return l.push("".concat(u, '="').concat(d, '"')) && l;
      }, []).join(" ");
      return O(r) ? '<style type="text/css" data-primevue-style-id="'.concat(this.name, '" ').concat(s, ">").concat(r, "</style>") : "";
    }
    return "";
  },
  getCommonThemeStyleSheet: function(e) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return P.getCommonStyleSheet(this.name, e, n);
  },
  getThemeStyleSheet: function(e) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, o = [P.getStyleSheet(this.name, e, n)];
    if (this.style) {
      var r = this.name === "base" ? "global-style" : "".concat(this.name, "-style"), s = Ct(se || (se = Tt(["", ""])), N(this.style, {
        dt: nt
      })), l = ft(P.transformCSS(r, s)), i = Object.entries(n).reduce(function(a, u) {
        var d = ue(u, 2), c = d[0], p = d[1];
        return a.push("".concat(c, '="').concat(p, '"')) && a;
      }, []).join(" ");
      O(l) && o.push('<style type="text/css" data-primevue-style-id="'.concat(r, '" ').concat(i, ">").concat(l, "</style>"));
    }
    return o.join("");
  },
  extend: function(e) {
    return Dt(Dt({}, this), {}, {
      css: void 0,
      style: void 0
    }, e);
  }
};
function ao() {
  var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "pc", e = ln();
  return "".concat(t).concat(e.replace("v-", "").replaceAll("-", "_"));
}
var pe = x.extend({
  name: "common"
});
function vt(t) {
  "@babel/helpers - typeof";
  return vt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, vt(t);
}
function io(t) {
  return Ee(t) || lo(t) || Ne(t) || Ae();
}
function lo(t) {
  if (typeof Symbol < "u" && t[Symbol.iterator] != null || t["@@iterator"] != null) return Array.from(t);
}
function ut(t, e) {
  return Ee(t) || so(t, e) || Ne(t, e) || Ae();
}
function Ae() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Ne(t, e) {
  if (t) {
    if (typeof t == "string") return Ut(t, e);
    var n = {}.toString.call(t).slice(8, -1);
    return n === "Object" && t.constructor && (n = t.constructor.name), n === "Map" || n === "Set" ? Array.from(t) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ut(t, e) : void 0;
  }
}
function Ut(t, e) {
  (e == null || e > t.length) && (e = t.length);
  for (var n = 0, o = Array(e); n < e; n++) o[n] = t[n];
  return o;
}
function so(t, e) {
  var n = t == null ? null : typeof Symbol < "u" && t[Symbol.iterator] || t["@@iterator"];
  if (n != null) {
    var o, r, s, l, i = [], a = !0, u = !1;
    try {
      if (s = (n = n.call(t)).next, e === 0) {
        if (Object(n) !== n) return;
        a = !1;
      } else for (; !(a = (o = s.call(n)).done) && (i.push(o.value), i.length !== e); a = !0) ;
    } catch (d) {
      u = !0, r = d;
    } finally {
      try {
        if (!a && n.return != null && (l = n.return(), Object(l) !== l)) return;
      } finally {
        if (u) throw r;
      }
    }
    return i;
  }
}
function Ee(t) {
  if (Array.isArray(t)) return t;
}
function be(t, e) {
  var n = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(t);
    e && (o = o.filter(function(r) {
      return Object.getOwnPropertyDescriptor(t, r).enumerable;
    })), n.push.apply(n, o);
  }
  return n;
}
function $(t) {
  for (var e = 1; e < arguments.length; e++) {
    var n = arguments[e] != null ? arguments[e] : {};
    e % 2 ? be(Object(n), !0).forEach(function(o) {
      ct(t, o, n[o]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : be(Object(n)).forEach(function(o) {
      Object.defineProperty(t, o, Object.getOwnPropertyDescriptor(n, o));
    });
  }
  return t;
}
function ct(t, e, n) {
  return (e = uo(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function uo(t) {
  var e = co(t, "string");
  return vt(e) == "symbol" ? e : e + "";
}
function co(t, e) {
  if (vt(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (vt(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
var Gt = {
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
  inject: {
    $parentInstance: {
      default: void 0
    }
  },
  watch: {
    isUnstyled: {
      immediate: !0,
      handler: function(e) {
        T.off("theme:change", this._loadCoreStyles), e || (this._loadCoreStyles(), this._themeChangeListener(this._loadCoreStyles));
      }
    },
    dt: {
      immediate: !0,
      handler: function(e, n) {
        var o = this;
        T.off("theme:change", this._themeScopedListener), e ? (this._loadScopedThemeStyles(e), this._themeScopedListener = function() {
          return o._loadScopedThemeStyles(e);
        }, this._themeChangeListener(this._themeScopedListener)) : this._unloadScopedThemeStyles();
      }
    }
  },
  scopedStyleEl: void 0,
  rootEl: void 0,
  uid: void 0,
  $attrSelector: void 0,
  beforeCreate: function() {
    var e, n, o, r, s, l, i, a, u, d, c, p = (e = this.pt) === null || e === void 0 ? void 0 : e._usept, b = p ? (n = this.pt) === null || n === void 0 || (n = n.originalValue) === null || n === void 0 ? void 0 : n[this.$.type.name] : void 0, m = p ? (o = this.pt) === null || o === void 0 || (o = o.value) === null || o === void 0 ? void 0 : o[this.$.type.name] : this.pt;
    (r = m || b) === null || r === void 0 || (r = r.hooks) === null || r === void 0 || (s = r.onBeforeCreate) === null || s === void 0 || s.call(r);
    var g = (l = this.$primevueConfig) === null || l === void 0 || (l = l.pt) === null || l === void 0 ? void 0 : l._usept, h = g ? (i = this.$primevue) === null || i === void 0 || (i = i.config) === null || i === void 0 || (i = i.pt) === null || i === void 0 ? void 0 : i.originalValue : void 0, y = g ? (a = this.$primevue) === null || a === void 0 || (a = a.config) === null || a === void 0 || (a = a.pt) === null || a === void 0 ? void 0 : a.value : (u = this.$primevue) === null || u === void 0 || (u = u.config) === null || u === void 0 ? void 0 : u.pt;
    (d = y || h) === null || d === void 0 || (d = d[this.$.type.name]) === null || d === void 0 || (d = d.hooks) === null || d === void 0 || (c = d.onBeforeCreate) === null || c === void 0 || c.call(d), this.$attrSelector = ao(), this.uid = this.$attrs.id || this.$attrSelector.replace("pc", "pv_id_");
  },
  created: function() {
    this._hook("onCreated");
  },
  beforeMount: function() {
    var e;
    this.rootEl = kn(Pt(this.$el) ? this.$el : (e = this.$el) === null || e === void 0 ? void 0 : e.parentElement, "[".concat(this.$attrSelector, "]")), this.rootEl && (this.rootEl.$pc = $({
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
        var n = this._usePT(this._getPT(this.pt, this.$.type.name), this._getOptionValue, "hooks.".concat(e)), o = this._useDefaultPT(this._getOptionValue, "hooks.".concat(e));
        n == null || n(), o == null || o();
      }
    },
    _mergeProps: function(e) {
      for (var n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), r = 1; r < n; r++)
        o[r - 1] = arguments[r];
      return Ht(e) ? e.apply(void 0, o) : L.apply(void 0, o);
    },
    _load: function() {
      G.isStyleNameLoaded("base") || (x.loadCSS(this.$styleOptions), this._loadGlobalStyles(), G.setLoadedStyleName("base")), this._loadThemeStyles();
    },
    _loadStyles: function() {
      this._load(), this._themeChangeListener(this._load);
    },
    _loadCoreStyles: function() {
      var e, n;
      !G.isStyleNameLoaded((e = this.$style) === null || e === void 0 ? void 0 : e.name) && (n = this.$style) !== null && n !== void 0 && n.name && (pe.loadCSS(this.$styleOptions), this.$options.style && this.$style.loadCSS(this.$styleOptions), G.setLoadedStyleName(this.$style.name));
    },
    _loadGlobalStyles: function() {
      var e = this._useGlobalPT(this._getOptionValue, "global.css", this.$params);
      O(e) && x.load(e, $({
        name: "global"
      }, this.$styleOptions));
    },
    _loadThemeStyles: function() {
      var e, n;
      if (!(this.isUnstyled || this.$theme === "none")) {
        if (!P.isStyleNameLoaded("common")) {
          var o, r, s = ((o = this.$style) === null || o === void 0 || (r = o.getCommonTheme) === null || r === void 0 ? void 0 : r.call(o)) || {}, l = s.primitive, i = s.semantic, a = s.global, u = s.style;
          x.load(l == null ? void 0 : l.css, $({
            name: "primitive-variables"
          }, this.$styleOptions)), x.load(i == null ? void 0 : i.css, $({
            name: "semantic-variables"
          }, this.$styleOptions)), x.load(a == null ? void 0 : a.css, $({
            name: "global-variables"
          }, this.$styleOptions)), x.loadStyle($({
            name: "global-style"
          }, this.$styleOptions), u), P.setLoadedStyleName("common");
        }
        if (!P.isStyleNameLoaded((e = this.$style) === null || e === void 0 ? void 0 : e.name) && (n = this.$style) !== null && n !== void 0 && n.name) {
          var d, c, p, b, m = ((d = this.$style) === null || d === void 0 || (c = d.getComponentTheme) === null || c === void 0 ? void 0 : c.call(d)) || {}, g = m.css, h = m.style;
          (p = this.$style) === null || p === void 0 || p.load(g, $({
            name: "".concat(this.$style.name, "-variables")
          }, this.$styleOptions)), (b = this.$style) === null || b === void 0 || b.loadStyle($({
            name: "".concat(this.$style.name, "-style")
          }, this.$styleOptions), h), P.setLoadedStyleName(this.$style.name);
        }
        if (!P.isStyleNameLoaded("layer-order")) {
          var y, _, w = (y = this.$style) === null || y === void 0 || (_ = y.getLayerOrderThemeCSS) === null || _ === void 0 ? void 0 : _.call(y);
          x.load(w, $({
            name: "layer-order",
            first: !0
          }, this.$styleOptions)), P.setLoadedStyleName("layer-order");
        }
      }
    },
    _loadScopedThemeStyles: function(e) {
      var n, o, r, s = ((n = this.$style) === null || n === void 0 || (o = n.getPresetTheme) === null || o === void 0 ? void 0 : o.call(n, e, "[".concat(this.$attrSelector, "]"))) || {}, l = s.css, i = (r = this.$style) === null || r === void 0 ? void 0 : r.load(l, $({
        name: "".concat(this.$attrSelector, "-").concat(this.$style.name)
      }, this.$styleOptions));
      this.scopedStyleEl = i.el;
    },
    _unloadScopedThemeStyles: function() {
      var e;
      (e = this.scopedStyleEl) === null || e === void 0 || (e = e.value) === null || e === void 0 || e.remove();
    },
    _themeChangeListener: function() {
      var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : function() {
      };
      G.clearLoadedStyleNames(), T.on("theme:change", e);
    },
    _removeThemeListeners: function() {
      T.off("theme:change", this._loadCoreStyles), T.off("theme:change", this._load), T.off("theme:change", this._themeScopedListener);
    },
    _getHostInstance: function(e) {
      return e ? this.$options.hostName ? e.$.type.name === this.$options.hostName ? e : this._getHostInstance(e.$parentInstance) : e.$parentInstance : void 0;
    },
    _getPropValue: function(e) {
      var n;
      return this[e] || ((n = this._getHostInstance(this)) === null || n === void 0 ? void 0 : n[e]);
    },
    _getOptionValue: function(e) {
      var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      return Ft(e, n, o);
    },
    _getPTValue: function() {
      var e, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, s = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !0, l = /./g.test(o) && !!r[o.split(".")[0]], i = this._getPropValue("ptOptions") || ((e = this.$primevueConfig) === null || e === void 0 ? void 0 : e.ptOptions) || {}, a = i.mergeSections, u = a === void 0 ? !0 : a, d = i.mergeProps, c = d === void 0 ? !1 : d, p = s ? l ? this._useGlobalPT(this._getPTClassValue, o, r) : this._useDefaultPT(this._getPTClassValue, o, r) : void 0, b = l ? void 0 : this._getPTSelf(n, this._getPTClassValue, o, $($({}, r), {}, {
        global: p || {}
      })), m = this._getPTDatasets(o);
      return u || !u && b ? c ? this._mergeProps(c, p, b, m) : $($($({}, p), b), m) : $($({}, b), m);
    },
    _getPTSelf: function() {
      for (var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), r = 1; r < n; r++)
        o[r - 1] = arguments[r];
      return L(
        this._usePT.apply(this, [this._getPT(e, this.$name)].concat(o)),
        // Exp; <component :pt="{}"
        this._usePT.apply(this, [this.$_attrsPT].concat(o))
        // Exp; <component :pt:[passthrough_key]:[attribute]="{value}" or <component :pt:[passthrough_key]="() =>{value}"
      );
    },
    _getPTDatasets: function() {
      var e, n, o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", r = "data-pc-", s = o === "root" && O((e = this.pt) === null || e === void 0 ? void 0 : e["data-pc-section"]);
      return o !== "transition" && $($({}, o === "root" && $($(ct({}, "".concat(r, "name"), z(s ? (n = this.pt) === null || n === void 0 ? void 0 : n["data-pc-section"] : this.$.type.name)), s && ct({}, "".concat(r, "extend"), z(this.$.type.name))), {}, ct({}, "".concat(this.$attrSelector), ""))), {}, ct({}, "".concat(r, "section"), z(o)));
    },
    _getPTClassValue: function() {
      var e = this._getOptionValue.apply(this, arguments);
      return A(e) || ke(e) ? {
        class: e
      } : e;
    },
    _getPT: function(e) {
      var n = this, o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", r = arguments.length > 2 ? arguments[2] : void 0, s = function(i) {
        var a, u = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1, d = r ? r(i) : i, c = z(o), p = z(n.$name);
        return (a = u ? c !== p ? d == null ? void 0 : d[c] : void 0 : d == null ? void 0 : d[c]) !== null && a !== void 0 ? a : d;
      };
      return e != null && e.hasOwnProperty("_usept") ? {
        _usept: e._usept,
        originalValue: s(e.originalValue),
        value: s(e.value)
      } : s(e, !0);
    },
    _usePT: function(e, n, o, r) {
      var s = function(g) {
        return n(g, o, r);
      };
      if (e != null && e.hasOwnProperty("_usept")) {
        var l, i = e._usept || ((l = this.$primevueConfig) === null || l === void 0 ? void 0 : l.ptOptions) || {}, a = i.mergeSections, u = a === void 0 ? !0 : a, d = i.mergeProps, c = d === void 0 ? !1 : d, p = s(e.originalValue), b = s(e.value);
        return p === void 0 && b === void 0 ? void 0 : A(b) ? b : A(p) ? p : u || !u && b ? c ? this._mergeProps(c, p, b) : $($({}, p), b) : b;
      }
      return s(e);
    },
    _useGlobalPT: function(e, n, o) {
      return this._usePT(this.globalPT, e, n, o);
    },
    _useDefaultPT: function(e, n, o) {
      return this._usePT(this.defaultPT, e, n, o);
    },
    ptm: function() {
      var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      return this._getPTValue(this.pt, e, $($({}, this.$params), n));
    },
    ptmi: function() {
      var e, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, r = L(this.$_attrsWithoutPT, this.ptm(n, o));
      return r != null && r.hasOwnProperty("id") && ((e = r.id) !== null && e !== void 0 || (r.id = this.$id)), r;
    },
    ptmo: function() {
      var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      return this._getPTValue(e, n, $({
        instance: this
      }, o), !1);
    },
    cx: function() {
      var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      return this.isUnstyled ? void 0 : this._getOptionValue(this.$style.classes, e, $($({}, this.$params), n));
    },
    sx: function() {
      var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      if (n) {
        var r = this._getOptionValue(this.$style.inlineStyles, e, $($({}, this.$params), o)), s = this._getOptionValue(pe.inlineStyles, e, $($({}, this.$params), o));
        return [s, r];
      }
    }
  },
  computed: {
    globalPT: function() {
      var e, n = this;
      return this._getPT((e = this.$primevueConfig) === null || e === void 0 ? void 0 : e.pt, void 0, function(o) {
        return N(o, {
          instance: n
        });
      });
    },
    defaultPT: function() {
      var e, n = this;
      return this._getPT((e = this.$primevueConfig) === null || e === void 0 ? void 0 : e.pt, void 0, function(o) {
        return n._getOptionValue(o, n.$name, $({}, n.$params)) || N(o, $({}, n.$params));
      });
    },
    isUnstyled: function() {
      var e;
      return this.unstyled !== void 0 ? this.unstyled : (e = this.$primevueConfig) === null || e === void 0 ? void 0 : e.unstyled;
    },
    $id: function() {
      return this.$attrs.id || this.uid;
    },
    $inProps: function() {
      var e, n = Object.keys(((e = this.$.vnode) === null || e === void 0 ? void 0 : e.props) || {});
      return Object.fromEntries(Object.entries(this.$props).filter(function(o) {
        var r = ut(o, 1), s = r[0];
        return n == null ? void 0 : n.includes(s);
      }));
    },
    $theme: function() {
      var e;
      return (e = this.$primevueConfig) === null || e === void 0 ? void 0 : e.theme;
    },
    $style: function() {
      return $($({
        classes: void 0,
        inlineStyles: void 0,
        load: function() {
        },
        loadCSS: function() {
        },
        loadStyle: function() {
        }
      }, (this._getHostInstance(this) || {}).$style), this.$options.style);
    },
    $styleOptions: function() {
      var e;
      return {
        nonce: (e = this.$primevueConfig) === null || e === void 0 || (e = e.csp) === null || e === void 0 ? void 0 : e.nonce
      };
    },
    $primevueConfig: function() {
      var e;
      return (e = this.$primevue) === null || e === void 0 ? void 0 : e.config;
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
          props: e == null ? void 0 : e.$props,
          state: e == null ? void 0 : e.$data,
          attrs: e == null ? void 0 : e.$attrs
        }
      };
    },
    $_attrsPT: function() {
      return Object.entries(this.$attrs || {}).filter(function(e) {
        var n = ut(e, 1), o = n[0];
        return o == null ? void 0 : o.startsWith("pt:");
      }).reduce(function(e, n) {
        var o = ut(n, 2), r = o[0], s = o[1], l = r.split(":"), i = io(l), a = Ut(i).slice(1);
        return a == null || a.reduce(function(u, d, c, p) {
          return !u[d] && (u[d] = c === p.length - 1 ? s : {}), u[d];
        }, e), e;
      }, {});
    },
    $_attrsWithoutPT: function() {
      return Object.entries(this.$attrs || {}).filter(function(e) {
        var n = ut(e, 1), o = n[0];
        return !(o != null && o.startsWith("pt:"));
      }).reduce(function(e, n) {
        var o = ut(n, 2), r = o[0], s = o[1];
        return e[r] = s, e;
      }, {});
    }
  }
}, po = `
.p-icon {
    display: inline-block;
    vertical-align: baseline;
    flex-shrink: 0;
}

.p-icon-spin {
    -webkit-animation: p-icon-spin 2s infinite linear;
    animation: p-icon-spin 2s infinite linear;
}

@-webkit-keyframes p-icon-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}

@keyframes p-icon-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}
`, bo = x.extend({
  name: "baseicon",
  css: po
});
function yt(t) {
  "@babel/helpers - typeof";
  return yt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, yt(t);
}
function fe(t, e) {
  var n = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(t);
    e && (o = o.filter(function(r) {
      return Object.getOwnPropertyDescriptor(t, r).enumerable;
    })), n.push.apply(n, o);
  }
  return n;
}
function me(t) {
  for (var e = 1; e < arguments.length; e++) {
    var n = arguments[e] != null ? arguments[e] : {};
    e % 2 ? fe(Object(n), !0).forEach(function(o) {
      fo(t, o, n[o]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : fe(Object(n)).forEach(function(o) {
      Object.defineProperty(t, o, Object.getOwnPropertyDescriptor(n, o));
    });
  }
  return t;
}
function fo(t, e, n) {
  return (e = mo(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function mo(t) {
  var e = ho(t, "string");
  return yt(e) == "symbol" ? e : e + "";
}
function ho(t, e) {
  if (yt(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (yt(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
var go = {
  name: "BaseIcon",
  extends: Gt,
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
  style: bo,
  provide: function() {
    return {
      $pcIcon: this,
      $parentInstance: this
    };
  },
  methods: {
    pti: function() {
      var e = ot(this.label);
      return me(me({}, !this.isUnstyled && {
        class: ["p-icon", {
          "p-icon-spin": this.spin
        }]
      }), {}, {
        role: e ? void 0 : "img",
        "aria-label": e ? void 0 : this.label,
        "aria-hidden": e
      });
    }
  }
}, Ie = {
  name: "SpinnerIcon",
  extends: go
};
function vo(t) {
  return _o(t) || $o(t) || So(t) || yo();
}
function yo() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function So(t, e) {
  if (t) {
    if (typeof t == "string") return Rt(t, e);
    var n = {}.toString.call(t).slice(8, -1);
    return n === "Object" && t.constructor && (n = t.constructor.name), n === "Map" || n === "Set" ? Array.from(t) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Rt(t, e) : void 0;
  }
}
function $o(t) {
  if (typeof Symbol < "u" && t[Symbol.iterator] != null || t["@@iterator"] != null) return Array.from(t);
}
function _o(t) {
  if (Array.isArray(t)) return Rt(t);
}
function Rt(t, e) {
  (e == null || e > t.length) && (e = t.length);
  for (var n = 0, o = Array(e); n < e; n++) o[n] = t[n];
  return o;
}
function ko(t, e, n, o, r, s) {
  return R(), pt("svg", L({
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, t.pti()), vo(e[0] || (e[0] = [sn("path", {
    d: "M6.99701 14C5.85441 13.999 4.72939 13.7186 3.72012 13.1832C2.71084 12.6478 1.84795 11.8737 1.20673 10.9284C0.565504 9.98305 0.165424 8.89526 0.041387 7.75989C-0.0826496 6.62453 0.073125 5.47607 0.495122 4.4147C0.917119 3.35333 1.59252 2.4113 2.46241 1.67077C3.33229 0.930247 4.37024 0.413729 5.4857 0.166275C6.60117 -0.0811796 7.76026 -0.0520535 8.86188 0.251112C9.9635 0.554278 10.9742 1.12227 11.8057 1.90555C11.915 2.01493 11.9764 2.16319 11.9764 2.31778C11.9764 2.47236 11.915 2.62062 11.8057 2.73C11.7521 2.78503 11.688 2.82877 11.6171 2.85864C11.5463 2.8885 11.4702 2.90389 11.3933 2.90389C11.3165 2.90389 11.2404 2.8885 11.1695 2.85864C11.0987 2.82877 11.0346 2.78503 10.9809 2.73C9.9998 1.81273 8.73246 1.26138 7.39226 1.16876C6.05206 1.07615 4.72086 1.44794 3.62279 2.22152C2.52471 2.99511 1.72683 4.12325 1.36345 5.41602C1.00008 6.70879 1.09342 8.08723 1.62775 9.31926C2.16209 10.5513 3.10478 11.5617 4.29713 12.1803C5.48947 12.7989 6.85865 12.988 8.17414 12.7157C9.48963 12.4435 10.6711 11.7264 11.5196 10.6854C12.3681 9.64432 12.8319 8.34282 12.8328 7C12.8328 6.84529 12.8943 6.69692 13.0038 6.58752C13.1132 6.47812 13.2616 6.41667 13.4164 6.41667C13.5712 6.41667 13.7196 6.47812 13.8291 6.58752C13.9385 6.69692 14 6.84529 14 7C14 8.85651 13.2622 10.637 11.9489 11.9497C10.6356 13.2625 8.85432 14 6.99701 14Z",
    fill: "currentColor"
  }, null, -1)])), 16);
}
Ie.render = ko;
var wo = `
    .p-badge {
        display: inline-flex;
        border-radius: dt('badge.border.radius');
        align-items: center;
        justify-content: center;
        padding: dt('badge.padding');
        background: dt('badge.primary.background');
        color: dt('badge.primary.color');
        font-size: dt('badge.font.size');
        font-weight: dt('badge.font.weight');
        min-width: dt('badge.min.width');
        height: dt('badge.height');
    }

    .p-badge-dot {
        width: dt('badge.dot.size');
        min-width: dt('badge.dot.size');
        height: dt('badge.dot.size');
        border-radius: 50%;
        padding: 0;
    }

    .p-badge-circle {
        padding: 0;
        border-radius: 50%;
    }

    .p-badge-secondary {
        background: dt('badge.secondary.background');
        color: dt('badge.secondary.color');
    }

    .p-badge-success {
        background: dt('badge.success.background');
        color: dt('badge.success.color');
    }

    .p-badge-info {
        background: dt('badge.info.background');
        color: dt('badge.info.color');
    }

    .p-badge-warn {
        background: dt('badge.warn.background');
        color: dt('badge.warn.color');
    }

    .p-badge-danger {
        background: dt('badge.danger.background');
        color: dt('badge.danger.color');
    }

    .p-badge-contrast {
        background: dt('badge.contrast.background');
        color: dt('badge.contrast.color');
    }

    .p-badge-sm {
        font-size: dt('badge.sm.font.size');
        min-width: dt('badge.sm.min.width');
        height: dt('badge.sm.height');
    }

    .p-badge-lg {
        font-size: dt('badge.lg.font.size');
        min-width: dt('badge.lg.min.width');
        height: dt('badge.lg.height');
    }

    .p-badge-xl {
        font-size: dt('badge.xl.font.size');
        min-width: dt('badge.xl.min.width');
        height: dt('badge.xl.height');
    }
`, Po = {
  root: function(e) {
    var n = e.props, o = e.instance;
    return ["p-badge p-component", {
      "p-badge-circle": O(n.value) && String(n.value).length === 1,
      "p-badge-dot": ot(n.value) && !o.$slots.default,
      "p-badge-sm": n.size === "small",
      "p-badge-lg": n.size === "large",
      "p-badge-xl": n.size === "xlarge",
      "p-badge-info": n.severity === "info",
      "p-badge-success": n.severity === "success",
      "p-badge-warn": n.severity === "warn",
      "p-badge-danger": n.severity === "danger",
      "p-badge-secondary": n.severity === "secondary",
      "p-badge-contrast": n.severity === "contrast"
    }];
  }
}, Oo = x.extend({
  name: "badge",
  style: wo,
  classes: Po
}), xo = {
  name: "BaseBadge",
  extends: Gt,
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
  style: Oo,
  provide: function() {
    return {
      $pcBadge: this,
      $parentInstance: this
    };
  }
};
function St(t) {
  "@babel/helpers - typeof";
  return St = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, St(t);
}
function he(t, e, n) {
  return (e = Co(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function Co(t) {
  var e = To(t, "string");
  return St(e) == "symbol" ? e : e + "";
}
function To(t, e) {
  if (St(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (St(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
var Ve = {
  name: "Badge",
  extends: xo,
  inheritAttrs: !1,
  computed: {
    dataP: function() {
      return bt(he(he({
        circle: this.value != null && String(this.value).length === 1,
        empty: this.value == null && !this.$slots.default
      }, this.severity, this.severity), this.size, this.size));
    }
  }
}, jo = ["data-p"];
function Lo(t, e, n, o, r, s) {
  return R(), pt("span", L({
    class: t.cx("root"),
    "data-p": s.dataP
  }, t.ptmi("root")), [dt(t.$slots, "default", {}, function() {
    return [un($e(t.value), 1)];
  })], 16, jo);
}
Ve.render = Lo;
var jt = _e();
function $t(t) {
  "@babel/helpers - typeof";
  return $t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, $t(t);
}
function ge(t, e) {
  return Io(t) || Eo(t, e) || No(t, e) || Ao();
}
function Ao() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function No(t, e) {
  if (t) {
    if (typeof t == "string") return ve(t, e);
    var n = {}.toString.call(t).slice(8, -1);
    return n === "Object" && t.constructor && (n = t.constructor.name), n === "Map" || n === "Set" ? Array.from(t) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ve(t, e) : void 0;
  }
}
function ve(t, e) {
  (e == null || e > t.length) && (e = t.length);
  for (var n = 0, o = Array(e); n < e; n++) o[n] = t[n];
  return o;
}
function Eo(t, e) {
  var n = t == null ? null : typeof Symbol < "u" && t[Symbol.iterator] || t["@@iterator"];
  if (n != null) {
    var o, r, s, l, i = [], a = !0, u = !1;
    try {
      if (s = (n = n.call(t)).next, e !== 0) for (; !(a = (o = s.call(n)).done) && (i.push(o.value), i.length !== e); a = !0) ;
    } catch (d) {
      u = !0, r = d;
    } finally {
      try {
        if (!a && n.return != null && (l = n.return(), Object(l) !== l)) return;
      } finally {
        if (u) throw r;
      }
    }
    return i;
  }
}
function Io(t) {
  if (Array.isArray(t)) return t;
}
function ye(t, e) {
  var n = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(t);
    e && (o = o.filter(function(r) {
      return Object.getOwnPropertyDescriptor(t, r).enumerable;
    })), n.push.apply(n, o);
  }
  return n;
}
function k(t) {
  for (var e = 1; e < arguments.length; e++) {
    var n = arguments[e] != null ? arguments[e] : {};
    e % 2 ? ye(Object(n), !0).forEach(function(o) {
      Wt(t, o, n[o]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : ye(Object(n)).forEach(function(o) {
      Object.defineProperty(t, o, Object.getOwnPropertyDescriptor(n, o));
    });
  }
  return t;
}
function Wt(t, e, n) {
  return (e = Vo(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function Vo(t) {
  var e = Bo(t, "string");
  return $t(e) == "symbol" ? e : e + "";
}
function Bo(t, e) {
  if ($t(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if ($t(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
var v = {
  _getMeta: function() {
    return [Z(arguments.length <= 0 ? void 0 : arguments[0]) || arguments.length <= 0 ? void 0 : arguments[0], N(Z(arguments.length <= 0 ? void 0 : arguments[0]) ? arguments.length <= 0 ? void 0 : arguments[0] : arguments.length <= 1 ? void 0 : arguments[1])];
  },
  _getConfig: function(e, n) {
    var o, r, s;
    return (o = (e == null || (r = e.instance) === null || r === void 0 ? void 0 : r.$primevue) || (n == null || (s = n.ctx) === null || s === void 0 || (s = s.appContext) === null || s === void 0 || (s = s.config) === null || s === void 0 || (s = s.globalProperties) === null || s === void 0 ? void 0 : s.$primevue)) === null || o === void 0 ? void 0 : o.config;
  },
  _getOptionValue: Ft,
  _getPTValue: function() {
    var e, n, o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "", l = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}, i = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !0, a = function() {
      var _ = v._getOptionValue.apply(v, arguments);
      return A(_) || ke(_) ? {
        class: _
      } : _;
    }, u = ((e = o.binding) === null || e === void 0 || (e = e.value) === null || e === void 0 ? void 0 : e.ptOptions) || ((n = o.$primevueConfig) === null || n === void 0 ? void 0 : n.ptOptions) || {}, d = u.mergeSections, c = d === void 0 ? !0 : d, p = u.mergeProps, b = p === void 0 ? !1 : p, m = i ? v._useDefaultPT(o, o.defaultPT(), a, s, l) : void 0, g = v._usePT(o, v._getPT(r, o.$name), a, s, k(k({}, l), {}, {
      global: m || {}
    })), h = v._getPTDatasets(o, s);
    return c || !c && g ? b ? v._mergeProps(o, b, m, g, h) : k(k(k({}, m), g), h) : k(k({}, g), h);
  },
  _getPTDatasets: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", o = "data-pc-";
    return k(k({}, n === "root" && Wt({}, "".concat(o, "name"), z(e.$name))), {}, Wt({}, "".concat(o, "section"), z(n)));
  },
  _getPT: function(e) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", o = arguments.length > 2 ? arguments[2] : void 0, r = function(l) {
      var i, a = o ? o(l) : l, u = z(n);
      return (i = a == null ? void 0 : a[u]) !== null && i !== void 0 ? i : a;
    };
    return e && Object.hasOwn(e, "_usept") ? {
      _usept: e._usept,
      originalValue: r(e.originalValue),
      value: r(e.value)
    } : r(e);
  },
  _usePT: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 ? arguments[1] : void 0, o = arguments.length > 2 ? arguments[2] : void 0, r = arguments.length > 3 ? arguments[3] : void 0, s = arguments.length > 4 ? arguments[4] : void 0, l = function(h) {
      return o(h, r, s);
    };
    if (n && Object.hasOwn(n, "_usept")) {
      var i, a = n._usept || ((i = e.$primevueConfig) === null || i === void 0 ? void 0 : i.ptOptions) || {}, u = a.mergeSections, d = u === void 0 ? !0 : u, c = a.mergeProps, p = c === void 0 ? !1 : c, b = l(n.originalValue), m = l(n.value);
      return b === void 0 && m === void 0 ? void 0 : A(m) ? m : A(b) ? b : d || !d && m ? p ? v._mergeProps(e, p, b, m) : k(k({}, b), m) : m;
    }
    return l(n);
  },
  _useDefaultPT: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, o = arguments.length > 2 ? arguments[2] : void 0, r = arguments.length > 3 ? arguments[3] : void 0, s = arguments.length > 4 ? arguments[4] : void 0;
    return v._usePT(e, n, o, r, s);
  },
  _loadStyles: function() {
    var e, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, o = arguments.length > 1 ? arguments[1] : void 0, r = arguments.length > 2 ? arguments[2] : void 0, s = v._getConfig(o, r), l = {
      nonce: s == null || (e = s.csp) === null || e === void 0 ? void 0 : e.nonce
    };
    v._loadCoreStyles(n, l), v._loadThemeStyles(n, l), v._loadScopedThemeStyles(n, l), v._removeThemeListeners(n), n.$loadStyles = function() {
      return v._loadThemeStyles(n, l);
    }, v._themeChangeListener(n.$loadStyles);
  },
  _loadCoreStyles: function() {
    var e, n, o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, r = arguments.length > 1 ? arguments[1] : void 0;
    if (!G.isStyleNameLoaded((e = o.$style) === null || e === void 0 ? void 0 : e.name) && (n = o.$style) !== null && n !== void 0 && n.name) {
      var s;
      x.loadCSS(r), (s = o.$style) === null || s === void 0 || s.loadCSS(r), G.setLoadedStyleName(o.$style.name);
    }
  },
  _loadThemeStyles: function() {
    var e, n, o, r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, s = arguments.length > 1 ? arguments[1] : void 0;
    if (!(r != null && r.isUnstyled() || (r == null || (e = r.theme) === null || e === void 0 ? void 0 : e.call(r)) === "none")) {
      if (!P.isStyleNameLoaded("common")) {
        var l, i, a = ((l = r.$style) === null || l === void 0 || (i = l.getCommonTheme) === null || i === void 0 ? void 0 : i.call(l)) || {}, u = a.primitive, d = a.semantic, c = a.global, p = a.style;
        x.load(u == null ? void 0 : u.css, k({
          name: "primitive-variables"
        }, s)), x.load(d == null ? void 0 : d.css, k({
          name: "semantic-variables"
        }, s)), x.load(c == null ? void 0 : c.css, k({
          name: "global-variables"
        }, s)), x.loadStyle(k({
          name: "global-style"
        }, s), p), P.setLoadedStyleName("common");
      }
      if (!P.isStyleNameLoaded((n = r.$style) === null || n === void 0 ? void 0 : n.name) && (o = r.$style) !== null && o !== void 0 && o.name) {
        var b, m, g, h, y = ((b = r.$style) === null || b === void 0 || (m = b.getDirectiveTheme) === null || m === void 0 ? void 0 : m.call(b)) || {}, _ = y.css, w = y.style;
        (g = r.$style) === null || g === void 0 || g.load(_, k({
          name: "".concat(r.$style.name, "-variables")
        }, s)), (h = r.$style) === null || h === void 0 || h.loadStyle(k({
          name: "".concat(r.$style.name, "-style")
        }, s), w), P.setLoadedStyleName(r.$style.name);
      }
      if (!P.isStyleNameLoaded("layer-order")) {
        var f, S, C = (f = r.$style) === null || f === void 0 || (S = f.getLayerOrderThemeCSS) === null || S === void 0 ? void 0 : S.call(f);
        x.load(C, k({
          name: "layer-order",
          first: !0
        }, s)), P.setLoadedStyleName("layer-order");
      }
    }
  },
  _loadScopedThemeStyles: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = arguments.length > 1 ? arguments[1] : void 0, o = e.preset();
    if (o && e.$attrSelector) {
      var r, s, l, i = ((r = e.$style) === null || r === void 0 || (s = r.getPresetTheme) === null || s === void 0 ? void 0 : s.call(r, o, "[".concat(e.$attrSelector, "]"))) || {}, a = i.css, u = (l = e.$style) === null || l === void 0 ? void 0 : l.load(a, k({
        name: "".concat(e.$attrSelector, "-").concat(e.$style.name)
      }, n));
      e.scopedStyleEl = u.el;
    }
  },
  _themeChangeListener: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : function() {
    };
    G.clearLoadedStyleNames(), T.on("theme:change", e);
  },
  _removeThemeListeners: function() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    T.off("theme:change", e.$loadStyles), e.$loadStyles = void 0;
  },
  _hook: function(e, n, o, r, s, l) {
    var i, a, u = "on".concat(jn(n)), d = v._getConfig(r, s), c = o == null ? void 0 : o.$instance, p = v._usePT(c, v._getPT(r == null || (i = r.value) === null || i === void 0 ? void 0 : i.pt, e), v._getOptionValue, "hooks.".concat(u)), b = v._useDefaultPT(c, d == null || (a = d.pt) === null || a === void 0 || (a = a.directives) === null || a === void 0 ? void 0 : a[e], v._getOptionValue, "hooks.".concat(u)), m = {
      el: o,
      binding: r,
      vnode: s,
      prevVnode: l
    };
    p == null || p(c, m), b == null || b(c, m);
  },
  /* eslint-disable-next-line no-unused-vars */
  _mergeProps: function() {
    for (var e = arguments.length > 1 ? arguments[1] : void 0, n = arguments.length, o = new Array(n > 2 ? n - 2 : 0), r = 2; r < n; r++)
      o[r - 2] = arguments[r];
    return Ht(e) ? e.apply(void 0, o) : L.apply(void 0, o);
  },
  _extend: function(e) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, o = function(i, a, u, d, c) {
      var p, b, m, g;
      a._$instances = a._$instances || {};
      var h = v._getConfig(u, d), y = a._$instances[e] || {}, _ = ot(y) ? k(k({}, n), n == null ? void 0 : n.methods) : {};
      a._$instances[e] = k(k({}, y), {}, {
        /* new instance variables to pass in directive methods */
        $name: e,
        $host: a,
        $binding: u,
        $modifiers: u == null ? void 0 : u.modifiers,
        $value: u == null ? void 0 : u.value,
        $el: y.$el || a || void 0,
        $style: k({
          classes: void 0,
          inlineStyles: void 0,
          load: function() {
          },
          loadCSS: function() {
          },
          loadStyle: function() {
          }
        }, n == null ? void 0 : n.style),
        $primevueConfig: h,
        $attrSelector: (p = a.$pd) === null || p === void 0 || (p = p[e]) === null || p === void 0 ? void 0 : p.attrSelector,
        /* computed instance variables */
        defaultPT: function() {
          return v._getPT(h == null ? void 0 : h.pt, void 0, function(f) {
            var S;
            return f == null || (S = f.directives) === null || S === void 0 ? void 0 : S[e];
          });
        },
        isUnstyled: function() {
          var f, S;
          return ((f = a._$instances[e]) === null || f === void 0 || (f = f.$binding) === null || f === void 0 || (f = f.value) === null || f === void 0 ? void 0 : f.unstyled) !== void 0 ? (S = a._$instances[e]) === null || S === void 0 || (S = S.$binding) === null || S === void 0 || (S = S.value) === null || S === void 0 ? void 0 : S.unstyled : h == null ? void 0 : h.unstyled;
        },
        theme: function() {
          var f;
          return (f = a._$instances[e]) === null || f === void 0 || (f = f.$primevueConfig) === null || f === void 0 ? void 0 : f.theme;
        },
        preset: function() {
          var f;
          return (f = a._$instances[e]) === null || f === void 0 || (f = f.$binding) === null || f === void 0 || (f = f.value) === null || f === void 0 ? void 0 : f.dt;
        },
        /* instance's methods */
        ptm: function() {
          var f, S = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", C = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          return v._getPTValue(a._$instances[e], (f = a._$instances[e]) === null || f === void 0 || (f = f.$binding) === null || f === void 0 || (f = f.value) === null || f === void 0 ? void 0 : f.pt, S, k({}, C));
        },
        ptmo: function() {
          var f = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, S = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", C = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
          return v._getPTValue(a._$instances[e], f, S, C, !1);
        },
        cx: function() {
          var f, S, C = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", E = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          return (f = a._$instances[e]) !== null && f !== void 0 && f.isUnstyled() ? void 0 : v._getOptionValue((S = a._$instances[e]) === null || S === void 0 || (S = S.$style) === null || S === void 0 ? void 0 : S.classes, C, k({}, E));
        },
        sx: function() {
          var f, S = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", C = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, E = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
          return C ? v._getOptionValue((f = a._$instances[e]) === null || f === void 0 || (f = f.$style) === null || f === void 0 ? void 0 : f.inlineStyles, S, k({}, E)) : void 0;
        }
      }, _), a.$instance = a._$instances[e], (b = (m = a.$instance)[i]) === null || b === void 0 || b.call(m, a, u, d, c), a["$".concat(e)] = a.$instance, v._hook(e, i, a, u, d, c), a.$pd || (a.$pd = {}), a.$pd[e] = k(k({}, (g = a.$pd) === null || g === void 0 ? void 0 : g[e]), {}, {
        name: e,
        instance: a._$instances[e]
      });
    }, r = function(i) {
      var a, u, d, c = i._$instances[e], p = c == null ? void 0 : c.watch, b = function(h) {
        var y, _ = h.newValue, w = h.oldValue;
        return p == null || (y = p.config) === null || y === void 0 ? void 0 : y.call(c, _, w);
      }, m = function(h) {
        var y, _ = h.newValue, w = h.oldValue;
        return p == null || (y = p["config.ripple"]) === null || y === void 0 ? void 0 : y.call(c, _, w);
      };
      c.$watchersCallback = {
        config: b,
        "config.ripple": m
      }, p == null || (a = p.config) === null || a === void 0 || a.call(c, c == null ? void 0 : c.$primevueConfig), jt.on("config:change", b), p == null || (u = p["config.ripple"]) === null || u === void 0 || u.call(c, c == null || (d = c.$primevueConfig) === null || d === void 0 ? void 0 : d.ripple), jt.on("config:ripple:change", m);
    }, s = function(i) {
      var a = i._$instances[e].$watchersCallback;
      a && (jt.off("config:change", a.config), jt.off("config:ripple:change", a["config.ripple"]), i._$instances[e].$watchersCallback = void 0);
    };
    return {
      created: function(i, a, u, d) {
        i.$pd || (i.$pd = {}), i.$pd[e] = {
          name: e,
          attrSelector: Ln("pd")
        }, o("created", i, a, u, d);
      },
      beforeMount: function(i, a, u, d) {
        var c;
        v._loadStyles((c = i.$pd[e]) === null || c === void 0 ? void 0 : c.instance, a, u), o("beforeMount", i, a, u, d), r(i);
      },
      mounted: function(i, a, u, d) {
        var c;
        v._loadStyles((c = i.$pd[e]) === null || c === void 0 ? void 0 : c.instance, a, u), o("mounted", i, a, u, d);
      },
      beforeUpdate: function(i, a, u, d) {
        o("beforeUpdate", i, a, u, d);
      },
      updated: function(i, a, u, d) {
        var c;
        v._loadStyles((c = i.$pd[e]) === null || c === void 0 ? void 0 : c.instance, a, u), o("updated", i, a, u, d);
      },
      beforeUnmount: function(i, a, u, d) {
        var c;
        s(i), v._removeThemeListeners((c = i.$pd[e]) === null || c === void 0 ? void 0 : c.instance), o("beforeUnmount", i, a, u, d);
      },
      unmounted: function(i, a, u, d) {
        var c;
        (c = i.$pd[e]) === null || c === void 0 || (c = c.instance) === null || c === void 0 || (c = c.scopedStyleEl) === null || c === void 0 || (c = c.value) === null || c === void 0 || c.remove(), o("unmounted", i, a, u, d);
      }
    };
  },
  extend: function() {
    var e = v._getMeta.apply(v, arguments), n = ge(e, 2), o = n[0], r = n[1];
    return k({
      extend: function() {
        var l = v._getMeta.apply(v, arguments), i = ge(l, 2), a = i[0], u = i[1];
        return v.extend(a, k(k(k({}, r), r == null ? void 0 : r.methods), u));
      }
    }, v._extend(o, r));
  }
}, Do = `
    .p-ink {
        display: block;
        position: absolute;
        background: dt('ripple.background');
        border-radius: 100%;
        transform: scale(0);
        pointer-events: none;
    }

    .p-ink-active {
        animation: ripple 0.4s linear;
    }

    @keyframes ripple {
        100% {
            opacity: 0;
            transform: scale(2.5);
        }
    }
`, zo = {
  root: "p-ink"
}, Mo = x.extend({
  name: "ripple-directive",
  style: Do,
  classes: zo
}), Uo = v.extend({
  style: Mo
});
function _t(t) {
  "@babel/helpers - typeof";
  return _t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, _t(t);
}
function Ro(t) {
  return Fo(t) || Ho(t) || Ko(t) || Wo();
}
function Wo() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Ko(t, e) {
  if (t) {
    if (typeof t == "string") return Kt(t, e);
    var n = {}.toString.call(t).slice(8, -1);
    return n === "Object" && t.constructor && (n = t.constructor.name), n === "Map" || n === "Set" ? Array.from(t) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Kt(t, e) : void 0;
  }
}
function Ho(t) {
  if (typeof Symbol < "u" && t[Symbol.iterator] != null || t["@@iterator"] != null) return Array.from(t);
}
function Fo(t) {
  if (Array.isArray(t)) return Kt(t);
}
function Kt(t, e) {
  (e == null || e > t.length) && (e = t.length);
  for (var n = 0, o = Array(e); n < e; n++) o[n] = t[n];
  return o;
}
function Se(t, e, n) {
  return (e = Go(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function Go(t) {
  var e = Zo(t, "string");
  return _t(e) == "symbol" ? e : e + "";
}
function Zo(t, e) {
  if (_t(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (_t(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
var qo = Uo.extend("ripple", {
  watch: {
    "config.ripple": function(e) {
      e ? (this.createRipple(this.$host), this.bindEvents(this.$host), this.$host.setAttribute("data-pd-ripple", !0), this.$host.style.overflow = "hidden", this.$host.style.position = "relative") : (this.remove(this.$host), this.$host.removeAttribute("data-pd-ripple"));
    }
  },
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
      var n = this.getInk(e);
      n || (n = _n("span", Se(Se({
        role: "presentation",
        "aria-hidden": !0,
        "data-p-ink": !0,
        "data-p-ink-active": !1,
        class: !this.isUnstyled() && this.cx("root"),
        onAnimationEnd: this.onAnimationEnd.bind(this)
      }, this.$attrSelector, ""), "p-bind", this.ptm("root"))), e.appendChild(n), this.$el = n);
    },
    remove: function(e) {
      var n = this.getInk(e);
      n && (this.$host.style.overflow = "", this.$host.style.position = "", this.unbindEvents(e), n.removeEventListener("animationend", this.onAnimationEnd), n.remove());
    },
    onMouseDown: function(e) {
      var n = this, o = e.currentTarget, r = this.getInk(o);
      if (!(!r || getComputedStyle(r, null).display === "none")) {
        if (!this.isUnstyled() && Vt(r, "p-ink-active"), r.setAttribute("data-p-ink-active", "false"), !Jt(r) && !te(r)) {
          var s = Math.max(yn(o), On(o));
          r.style.height = s + "px", r.style.width = s + "px";
        }
        var l = Pn(o), i = e.pageX - l.left + document.body.scrollTop - te(r) / 2, a = e.pageY - l.top + document.body.scrollLeft - Jt(r) / 2;
        r.style.top = a + "px", r.style.left = i + "px", !this.isUnstyled() && vn(r, "p-ink-active"), r.setAttribute("data-p-ink-active", "true"), this.timeout = setTimeout(function() {
          r && (!n.isUnstyled() && Vt(r, "p-ink-active"), r.setAttribute("data-p-ink-active", "false"));
        }, 401);
      }
    },
    onAnimationEnd: function(e) {
      this.timeout && clearTimeout(this.timeout), !this.isUnstyled() && Vt(e.currentTarget, "p-ink-active"), e.currentTarget.setAttribute("data-p-ink-active", "false");
    },
    getInk: function(e) {
      return e && e.children ? Ro(e.children).find(function(n) {
        return wn(n, "data-pc-name") === "ripple";
      }) : void 0;
    }
  }
}), Xo = `
    .p-button {
        display: inline-flex;
        cursor: pointer;
        user-select: none;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        color: dt('button.primary.color');
        background: dt('button.primary.background');
        border: 1px solid dt('button.primary.border.color');
        padding: dt('button.padding.y') dt('button.padding.x');
        font-size: 1rem;
        font-family: inherit;
        font-feature-settings: inherit;
        transition:
            background dt('button.transition.duration'),
            color dt('button.transition.duration'),
            border-color dt('button.transition.duration'),
            outline-color dt('button.transition.duration'),
            box-shadow dt('button.transition.duration');
        border-radius: dt('button.border.radius');
        outline-color: transparent;
        gap: dt('button.gap');
    }

    .p-button:disabled {
        cursor: default;
    }

    .p-button-icon-right {
        order: 1;
    }

    .p-button-icon-right:dir(rtl) {
        order: -1;
    }

    .p-button:not(.p-button-vertical) .p-button-icon:not(.p-button-icon-right):dir(rtl) {
        order: 1;
    }

    .p-button-icon-bottom {
        order: 2;
    }

    .p-button-icon-only {
        width: dt('button.icon.only.width');
        padding-inline-start: 0;
        padding-inline-end: 0;
        gap: 0;
    }

    .p-button-icon-only.p-button-rounded {
        border-radius: 50%;
        height: dt('button.icon.only.width');
    }

    .p-button-icon-only .p-button-label {
        visibility: hidden;
        width: 0;
    }

    .p-button-icon-only::after {
        content: " ";
        visibility: hidden;
        width: 0;
    }

    .p-button-sm {
        font-size: dt('button.sm.font.size');
        padding: dt('button.sm.padding.y') dt('button.sm.padding.x');
    }

    .p-button-sm .p-button-icon {
        font-size: dt('button.sm.font.size');
    }

    .p-button-sm.p-button-icon-only {
        width: dt('button.sm.icon.only.width');
    }

    .p-button-sm.p-button-icon-only.p-button-rounded {
        height: dt('button.sm.icon.only.width');
    }

    .p-button-lg {
        font-size: dt('button.lg.font.size');
        padding: dt('button.lg.padding.y') dt('button.lg.padding.x');
    }

    .p-button-lg .p-button-icon {
        font-size: dt('button.lg.font.size');
    }

    .p-button-lg.p-button-icon-only {
        width: dt('button.lg.icon.only.width');
    }

    .p-button-lg.p-button-icon-only.p-button-rounded {
        height: dt('button.lg.icon.only.width');
    }

    .p-button-vertical {
        flex-direction: column;
    }

    .p-button-label {
        font-weight: dt('button.label.font.weight');
    }

    .p-button-fluid {
        width: 100%;
    }

    .p-button-fluid.p-button-icon-only {
        width: dt('button.icon.only.width');
    }

    .p-button:not(:disabled):hover {
        background: dt('button.primary.hover.background');
        border: 1px solid dt('button.primary.hover.border.color');
        color: dt('button.primary.hover.color');
    }

    .p-button:not(:disabled):active {
        background: dt('button.primary.active.background');
        border: 1px solid dt('button.primary.active.border.color');
        color: dt('button.primary.active.color');
    }

    .p-button:focus-visible {
        box-shadow: dt('button.primary.focus.ring.shadow');
        outline: dt('button.focus.ring.width') dt('button.focus.ring.style') dt('button.primary.focus.ring.color');
        outline-offset: dt('button.focus.ring.offset');
    }

    .p-button .p-badge {
        min-width: dt('button.badge.size');
        height: dt('button.badge.size');
        line-height: dt('button.badge.size');
    }

    .p-button-raised {
        box-shadow: dt('button.raised.shadow');
    }

    .p-button-rounded {
        border-radius: dt('button.rounded.border.radius');
    }

    .p-button-secondary {
        background: dt('button.secondary.background');
        border: 1px solid dt('button.secondary.border.color');
        color: dt('button.secondary.color');
    }

    .p-button-secondary:not(:disabled):hover {
        background: dt('button.secondary.hover.background');
        border: 1px solid dt('button.secondary.hover.border.color');
        color: dt('button.secondary.hover.color');
    }

    .p-button-secondary:not(:disabled):active {
        background: dt('button.secondary.active.background');
        border: 1px solid dt('button.secondary.active.border.color');
        color: dt('button.secondary.active.color');
    }

    .p-button-secondary:focus-visible {
        outline-color: dt('button.secondary.focus.ring.color');
        box-shadow: dt('button.secondary.focus.ring.shadow');
    }

    .p-button-success {
        background: dt('button.success.background');
        border: 1px solid dt('button.success.border.color');
        color: dt('button.success.color');
    }

    .p-button-success:not(:disabled):hover {
        background: dt('button.success.hover.background');
        border: 1px solid dt('button.success.hover.border.color');
        color: dt('button.success.hover.color');
    }

    .p-button-success:not(:disabled):active {
        background: dt('button.success.active.background');
        border: 1px solid dt('button.success.active.border.color');
        color: dt('button.success.active.color');
    }

    .p-button-success:focus-visible {
        outline-color: dt('button.success.focus.ring.color');
        box-shadow: dt('button.success.focus.ring.shadow');
    }

    .p-button-info {
        background: dt('button.info.background');
        border: 1px solid dt('button.info.border.color');
        color: dt('button.info.color');
    }

    .p-button-info:not(:disabled):hover {
        background: dt('button.info.hover.background');
        border: 1px solid dt('button.info.hover.border.color');
        color: dt('button.info.hover.color');
    }

    .p-button-info:not(:disabled):active {
        background: dt('button.info.active.background');
        border: 1px solid dt('button.info.active.border.color');
        color: dt('button.info.active.color');
    }

    .p-button-info:focus-visible {
        outline-color: dt('button.info.focus.ring.color');
        box-shadow: dt('button.info.focus.ring.shadow');
    }

    .p-button-warn {
        background: dt('button.warn.background');
        border: 1px solid dt('button.warn.border.color');
        color: dt('button.warn.color');
    }

    .p-button-warn:not(:disabled):hover {
        background: dt('button.warn.hover.background');
        border: 1px solid dt('button.warn.hover.border.color');
        color: dt('button.warn.hover.color');
    }

    .p-button-warn:not(:disabled):active {
        background: dt('button.warn.active.background');
        border: 1px solid dt('button.warn.active.border.color');
        color: dt('button.warn.active.color');
    }

    .p-button-warn:focus-visible {
        outline-color: dt('button.warn.focus.ring.color');
        box-shadow: dt('button.warn.focus.ring.shadow');
    }

    .p-button-help {
        background: dt('button.help.background');
        border: 1px solid dt('button.help.border.color');
        color: dt('button.help.color');
    }

    .p-button-help:not(:disabled):hover {
        background: dt('button.help.hover.background');
        border: 1px solid dt('button.help.hover.border.color');
        color: dt('button.help.hover.color');
    }

    .p-button-help:not(:disabled):active {
        background: dt('button.help.active.background');
        border: 1px solid dt('button.help.active.border.color');
        color: dt('button.help.active.color');
    }

    .p-button-help:focus-visible {
        outline-color: dt('button.help.focus.ring.color');
        box-shadow: dt('button.help.focus.ring.shadow');
    }

    .p-button-danger {
        background: dt('button.danger.background');
        border: 1px solid dt('button.danger.border.color');
        color: dt('button.danger.color');
    }

    .p-button-danger:not(:disabled):hover {
        background: dt('button.danger.hover.background');
        border: 1px solid dt('button.danger.hover.border.color');
        color: dt('button.danger.hover.color');
    }

    .p-button-danger:not(:disabled):active {
        background: dt('button.danger.active.background');
        border: 1px solid dt('button.danger.active.border.color');
        color: dt('button.danger.active.color');
    }

    .p-button-danger:focus-visible {
        outline-color: dt('button.danger.focus.ring.color');
        box-shadow: dt('button.danger.focus.ring.shadow');
    }

    .p-button-contrast {
        background: dt('button.contrast.background');
        border: 1px solid dt('button.contrast.border.color');
        color: dt('button.contrast.color');
    }

    .p-button-contrast:not(:disabled):hover {
        background: dt('button.contrast.hover.background');
        border: 1px solid dt('button.contrast.hover.border.color');
        color: dt('button.contrast.hover.color');
    }

    .p-button-contrast:not(:disabled):active {
        background: dt('button.contrast.active.background');
        border: 1px solid dt('button.contrast.active.border.color');
        color: dt('button.contrast.active.color');
    }

    .p-button-contrast:focus-visible {
        outline-color: dt('button.contrast.focus.ring.color');
        box-shadow: dt('button.contrast.focus.ring.shadow');
    }

    .p-button-outlined {
        background: transparent;
        border-color: dt('button.outlined.primary.border.color');
        color: dt('button.outlined.primary.color');
    }

    .p-button-outlined:not(:disabled):hover {
        background: dt('button.outlined.primary.hover.background');
        border-color: dt('button.outlined.primary.border.color');
        color: dt('button.outlined.primary.color');
    }

    .p-button-outlined:not(:disabled):active {
        background: dt('button.outlined.primary.active.background');
        border-color: dt('button.outlined.primary.border.color');
        color: dt('button.outlined.primary.color');
    }

    .p-button-outlined.p-button-secondary {
        border-color: dt('button.outlined.secondary.border.color');
        color: dt('button.outlined.secondary.color');
    }

    .p-button-outlined.p-button-secondary:not(:disabled):hover {
        background: dt('button.outlined.secondary.hover.background');
        border-color: dt('button.outlined.secondary.border.color');
        color: dt('button.outlined.secondary.color');
    }

    .p-button-outlined.p-button-secondary:not(:disabled):active {
        background: dt('button.outlined.secondary.active.background');
        border-color: dt('button.outlined.secondary.border.color');
        color: dt('button.outlined.secondary.color');
    }

    .p-button-outlined.p-button-success {
        border-color: dt('button.outlined.success.border.color');
        color: dt('button.outlined.success.color');
    }

    .p-button-outlined.p-button-success:not(:disabled):hover {
        background: dt('button.outlined.success.hover.background');
        border-color: dt('button.outlined.success.border.color');
        color: dt('button.outlined.success.color');
    }

    .p-button-outlined.p-button-success:not(:disabled):active {
        background: dt('button.outlined.success.active.background');
        border-color: dt('button.outlined.success.border.color');
        color: dt('button.outlined.success.color');
    }

    .p-button-outlined.p-button-info {
        border-color: dt('button.outlined.info.border.color');
        color: dt('button.outlined.info.color');
    }

    .p-button-outlined.p-button-info:not(:disabled):hover {
        background: dt('button.outlined.info.hover.background');
        border-color: dt('button.outlined.info.border.color');
        color: dt('button.outlined.info.color');
    }

    .p-button-outlined.p-button-info:not(:disabled):active {
        background: dt('button.outlined.info.active.background');
        border-color: dt('button.outlined.info.border.color');
        color: dt('button.outlined.info.color');
    }

    .p-button-outlined.p-button-warn {
        border-color: dt('button.outlined.warn.border.color');
        color: dt('button.outlined.warn.color');
    }

    .p-button-outlined.p-button-warn:not(:disabled):hover {
        background: dt('button.outlined.warn.hover.background');
        border-color: dt('button.outlined.warn.border.color');
        color: dt('button.outlined.warn.color');
    }

    .p-button-outlined.p-button-warn:not(:disabled):active {
        background: dt('button.outlined.warn.active.background');
        border-color: dt('button.outlined.warn.border.color');
        color: dt('button.outlined.warn.color');
    }

    .p-button-outlined.p-button-help {
        border-color: dt('button.outlined.help.border.color');
        color: dt('button.outlined.help.color');
    }

    .p-button-outlined.p-button-help:not(:disabled):hover {
        background: dt('button.outlined.help.hover.background');
        border-color: dt('button.outlined.help.border.color');
        color: dt('button.outlined.help.color');
    }

    .p-button-outlined.p-button-help:not(:disabled):active {
        background: dt('button.outlined.help.active.background');
        border-color: dt('button.outlined.help.border.color');
        color: dt('button.outlined.help.color');
    }

    .p-button-outlined.p-button-danger {
        border-color: dt('button.outlined.danger.border.color');
        color: dt('button.outlined.danger.color');
    }

    .p-button-outlined.p-button-danger:not(:disabled):hover {
        background: dt('button.outlined.danger.hover.background');
        border-color: dt('button.outlined.danger.border.color');
        color: dt('button.outlined.danger.color');
    }

    .p-button-outlined.p-button-danger:not(:disabled):active {
        background: dt('button.outlined.danger.active.background');
        border-color: dt('button.outlined.danger.border.color');
        color: dt('button.outlined.danger.color');
    }

    .p-button-outlined.p-button-contrast {
        border-color: dt('button.outlined.contrast.border.color');
        color: dt('button.outlined.contrast.color');
    }

    .p-button-outlined.p-button-contrast:not(:disabled):hover {
        background: dt('button.outlined.contrast.hover.background');
        border-color: dt('button.outlined.contrast.border.color');
        color: dt('button.outlined.contrast.color');
    }

    .p-button-outlined.p-button-contrast:not(:disabled):active {
        background: dt('button.outlined.contrast.active.background');
        border-color: dt('button.outlined.contrast.border.color');
        color: dt('button.outlined.contrast.color');
    }

    .p-button-outlined.p-button-plain {
        border-color: dt('button.outlined.plain.border.color');
        color: dt('button.outlined.plain.color');
    }

    .p-button-outlined.p-button-plain:not(:disabled):hover {
        background: dt('button.outlined.plain.hover.background');
        border-color: dt('button.outlined.plain.border.color');
        color: dt('button.outlined.plain.color');
    }

    .p-button-outlined.p-button-plain:not(:disabled):active {
        background: dt('button.outlined.plain.active.background');
        border-color: dt('button.outlined.plain.border.color');
        color: dt('button.outlined.plain.color');
    }

    .p-button-text {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.primary.color');
    }

    .p-button-text:not(:disabled):hover {
        background: dt('button.text.primary.hover.background');
        border-color: transparent;
        color: dt('button.text.primary.color');
    }

    .p-button-text:not(:disabled):active {
        background: dt('button.text.primary.active.background');
        border-color: transparent;
        color: dt('button.text.primary.color');
    }

    .p-button-text.p-button-secondary {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.secondary.color');
    }

    .p-button-text.p-button-secondary:not(:disabled):hover {
        background: dt('button.text.secondary.hover.background');
        border-color: transparent;
        color: dt('button.text.secondary.color');
    }

    .p-button-text.p-button-secondary:not(:disabled):active {
        background: dt('button.text.secondary.active.background');
        border-color: transparent;
        color: dt('button.text.secondary.color');
    }

    .p-button-text.p-button-success {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.success.color');
    }

    .p-button-text.p-button-success:not(:disabled):hover {
        background: dt('button.text.success.hover.background');
        border-color: transparent;
        color: dt('button.text.success.color');
    }

    .p-button-text.p-button-success:not(:disabled):active {
        background: dt('button.text.success.active.background');
        border-color: transparent;
        color: dt('button.text.success.color');
    }

    .p-button-text.p-button-info {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.info.color');
    }

    .p-button-text.p-button-info:not(:disabled):hover {
        background: dt('button.text.info.hover.background');
        border-color: transparent;
        color: dt('button.text.info.color');
    }

    .p-button-text.p-button-info:not(:disabled):active {
        background: dt('button.text.info.active.background');
        border-color: transparent;
        color: dt('button.text.info.color');
    }

    .p-button-text.p-button-warn {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.warn.color');
    }

    .p-button-text.p-button-warn:not(:disabled):hover {
        background: dt('button.text.warn.hover.background');
        border-color: transparent;
        color: dt('button.text.warn.color');
    }

    .p-button-text.p-button-warn:not(:disabled):active {
        background: dt('button.text.warn.active.background');
        border-color: transparent;
        color: dt('button.text.warn.color');
    }

    .p-button-text.p-button-help {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.help.color');
    }

    .p-button-text.p-button-help:not(:disabled):hover {
        background: dt('button.text.help.hover.background');
        border-color: transparent;
        color: dt('button.text.help.color');
    }

    .p-button-text.p-button-help:not(:disabled):active {
        background: dt('button.text.help.active.background');
        border-color: transparent;
        color: dt('button.text.help.color');
    }

    .p-button-text.p-button-danger {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.danger.color');
    }

    .p-button-text.p-button-danger:not(:disabled):hover {
        background: dt('button.text.danger.hover.background');
        border-color: transparent;
        color: dt('button.text.danger.color');
    }

    .p-button-text.p-button-danger:not(:disabled):active {
        background: dt('button.text.danger.active.background');
        border-color: transparent;
        color: dt('button.text.danger.color');
    }

    .p-button-text.p-button-contrast {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.contrast.color');
    }

    .p-button-text.p-button-contrast:not(:disabled):hover {
        background: dt('button.text.contrast.hover.background');
        border-color: transparent;
        color: dt('button.text.contrast.color');
    }

    .p-button-text.p-button-contrast:not(:disabled):active {
        background: dt('button.text.contrast.active.background');
        border-color: transparent;
        color: dt('button.text.contrast.color');
    }

    .p-button-text.p-button-plain {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.plain.color');
    }

    .p-button-text.p-button-plain:not(:disabled):hover {
        background: dt('button.text.plain.hover.background');
        border-color: transparent;
        color: dt('button.text.plain.color');
    }

    .p-button-text.p-button-plain:not(:disabled):active {
        background: dt('button.text.plain.active.background');
        border-color: transparent;
        color: dt('button.text.plain.color');
    }

    .p-button-link {
        background: transparent;
        border-color: transparent;
        color: dt('button.link.color');
    }

    .p-button-link:not(:disabled):hover {
        background: transparent;
        border-color: transparent;
        color: dt('button.link.hover.color');
    }

    .p-button-link:not(:disabled):hover .p-button-label {
        text-decoration: underline;
    }

    .p-button-link:not(:disabled):active {
        background: transparent;
        border-color: transparent;
        color: dt('button.link.active.color');
    }
`;
function kt(t) {
  "@babel/helpers - typeof";
  return kt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, kt(t);
}
function D(t, e, n) {
  return (e = Yo(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function Yo(t) {
  var e = Qo(t, "string");
  return kt(e) == "symbol" ? e : e + "";
}
function Qo(t, e) {
  if (kt(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (kt(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
var Jo = {
  root: function(e) {
    var n = e.instance, o = e.props;
    return ["p-button p-component", D(D(D(D(D(D(D(D(D({
      "p-button-icon-only": n.hasIcon && !o.label && !o.badge,
      "p-button-vertical": (o.iconPos === "top" || o.iconPos === "bottom") && o.label,
      "p-button-loading": o.loading,
      "p-button-link": o.link || o.variant === "link"
    }, "p-button-".concat(o.severity), o.severity), "p-button-raised", o.raised), "p-button-rounded", o.rounded), "p-button-text", o.text || o.variant === "text"), "p-button-outlined", o.outlined || o.variant === "outlined"), "p-button-sm", o.size === "small"), "p-button-lg", o.size === "large"), "p-button-plain", o.plain), "p-button-fluid", n.hasFluid)];
  },
  loadingIcon: "p-button-loading-icon",
  icon: function(e) {
    var n = e.props;
    return ["p-button-icon", D({}, "p-button-icon-".concat(n.iconPos), n.label)];
  },
  label: "p-button-label"
}, tr = x.extend({
  name: "button",
  style: Xo,
  classes: Jo
}), er = {
  name: "BaseButton",
  extends: Gt,
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
  style: tr,
  provide: function() {
    return {
      $pcButton: this,
      $parentInstance: this
    };
  }
};
function wt(t) {
  "@babel/helpers - typeof";
  return wt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, wt(t);
}
function j(t, e, n) {
  return (e = nr(e)) in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = n, t;
}
function nr(t) {
  var e = or(t, "string");
  return wt(e) == "symbol" ? e : e + "";
}
function or(t, e) {
  if (wt(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var o = n.call(t, e);
    if (wt(o) != "object") return o;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
var Be = {
  name: "Button",
  extends: er,
  inheritAttrs: !1,
  inject: {
    $pcFluid: {
      default: null
    }
  },
  methods: {
    getPTOptions: function(e) {
      var n = e === "root" ? this.ptmi : this.ptm;
      return n(e, {
        context: {
          disabled: this.disabled
        }
      });
    }
  },
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
      return L(this.asAttrs, this.a11yAttrs, this.getPTOptions("root"));
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
      return ot(this.fluid) ? !!this.$pcFluid : this.fluid;
    },
    dataP: function() {
      return bt(j(j(j(j(j(j(j(j(j(j({}, this.size, this.size), "icon-only", this.hasIcon && !this.label && !this.badge), "loading", this.loading), "fluid", this.hasFluid), "rounded", this.rounded), "raised", this.raised), "outlined", this.outlined || this.variant === "outlined"), "text", this.text || this.variant === "text"), "link", this.link || this.variant === "link"), "vertical", (this.iconPos === "top" || this.iconPos === "bottom") && this.label));
    },
    dataIconP: function() {
      return bt(j(j({}, this.iconPos, this.iconPos), this.size, this.size));
    },
    dataLabelP: function() {
      return bt(j(j({}, this.size, this.size), "icon-only", this.hasIcon && !this.label && !this.badge));
    }
  },
  components: {
    SpinnerIcon: Ie,
    Badge: Ve
  },
  directives: {
    ripple: qo
  }
}, rr = ["data-p"], ar = ["data-p"];
function ir(t, e, n, o, r, s) {
  var l = Yt("SpinnerIcon"), i = Yt("Badge"), a = dn("ripple");
  return t.asChild ? dt(t.$slots, "default", {
    key: 1,
    class: zt(t.cx("root")),
    a11yAttrs: s.a11yAttrs
  }) : cn((R(), Lt(pn(t.as), L({
    key: 0,
    class: t.cx("root"),
    "data-p": s.dataP
  }, s.attrs), {
    default: bn(function() {
      return [dt(t.$slots, "default", {}, function() {
        return [t.loading ? dt(t.$slots, "loadingicon", L({
          key: 0,
          class: [t.cx("loadingIcon"), t.cx("icon")]
        }, t.ptm("loadingIcon")), function() {
          return [t.loadingIcon ? (R(), pt("span", L({
            key: 0,
            class: [t.cx("loadingIcon"), t.cx("icon"), t.loadingIcon]
          }, t.ptm("loadingIcon")), null, 16)) : (R(), Lt(l, L({
            key: 1,
            class: [t.cx("loadingIcon"), t.cx("icon")],
            spin: ""
          }, t.ptm("loadingIcon")), null, 16, ["class"]))];
        }) : dt(t.$slots, "icon", L({
          key: 1,
          class: [t.cx("icon")]
        }, t.ptm("icon")), function() {
          return [t.icon ? (R(), pt("span", L({
            key: 0,
            class: [t.cx("icon"), t.icon, t.iconClass],
            "data-p": s.dataIconP
          }, t.ptm("icon")), null, 16, rr)) : It("", !0)];
        }), t.label ? (R(), pt("span", L({
          key: 2,
          class: t.cx("label")
        }, t.ptm("label"), {
          "data-p": s.dataLabelP
        }), $e(t.label), 17, ar)) : It("", !0), t.badge ? (R(), Lt(i, {
          key: 3,
          value: t.badge,
          class: zt(t.badgeClass),
          severity: t.badgeSeverity,
          unstyled: t.unstyled,
          pt: t.ptm("pcBadge")
        }, null, 8, ["value", "class", "severity", "unstyled", "pt"])) : It("", !0)];
      })];
    }),
    _: 3
  }, 16, ["class", "data-p"])), [[a]]);
}
Be.render = ir;
const lr = /* @__PURE__ */ fn({
  __name: "MaxButton",
  props: {
    label: {},
    icon: {},
    severity: { default: "primary" },
    size: { default: void 0 },
    disabled: { type: Boolean, default: !1 },
    loading: { type: Boolean, default: !1 },
    variant: {}
  },
  emits: ["click"],
  setup(t, { emit: e }) {
    const n = t, o = e, r = mn(() => ({
      "max-button": !0,
      [`max-button--${n.variant}`]: n.variant,
      [`max-button--${n.severity}`]: n.severity,
      [`max-button--${n.size}`]: n.size
    })), s = (l) => {
      o("click", l);
    };
    return (l, i) => (R(), Lt(hn(Be), {
      label: t.label,
      icon: t.icon,
      severity: t.severity,
      size: t.size,
      disabled: t.disabled,
      loading: t.loading,
      onClick: s,
      class: zt(r.value)
    }, null, 8, ["label", "icon", "severity", "size", "disabled", "loading", "class"]));
  }
}), sr = {
  MaxButton: lr
}, ur = (t, e = {}) => {
  Object.entries(sr).forEach(([n, o]) => {
    t.component(n, o);
  });
}, cr = {
  install: ur
};
export {
  lr as MaxButton,
  cr as default,
  ur as install
};
//# sourceMappingURL=index.es.js.map
