import { useRouter } from 'vue-router';
const router = useRouter();
const attrs = useAttrs();
const execute = () => {
    if (attrs.blank)
        window.open(attrs.blank, '_blank');
    if (attrs.route && typeof attrs.route === 'string' && hasContent(attrs.route)) {
        const route = getRoutByName(attrs.route) ?? attrs.route;
        const data = { name: route };
        if (attrs.data ?? attrs.params)
            data['query'] = attrs.data ?? attrs.params;
        router.push(data);
    }
};
const size = computed(() => 16 * Number(attrs.size ?? 1) + 'px');
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "icon-div ico-btn" },
    ref: "icon_ref",
    icon: (__VLS_ctx.attrs.icon ?? __VLS_ctx.attrs.i),
    ...(__VLS_ctx.attrs),
    ...{ style: ({ width: __VLS_ctx.size, height: __VLS_ctx.size }) },
});
/** @type {__VLS_StyleScopedClasses['icon-div']} */ ;
/** @type {__VLS_StyleScopedClasses['ico-btn']} */ ;
if (__VLS_ctx.attrs.blank || __VLS_ctx.attrs.route) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.MaxIcon} */
    MaxIcon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        ...(__VLS_ctx.attrs),
        pointer: true,
        full: true,
        size: (__VLS_ctx.size),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        ...(__VLS_ctx.attrs),
        pointer: true,
        full: true,
        size: (__VLS_ctx.size),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ click: {} },
        { onClick: (__VLS_ctx.execute) });
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, value: (null) }, null, null);
    var __VLS_3;
    var __VLS_4;
}
else {
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.MaxIcon} */
    MaxIcon;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...(__VLS_ctx.attrs),
        pointer: true,
        full: true,
        size: (__VLS_ctx.size),
    }));
    const __VLS_9 = __VLS_8({
        ...(__VLS_ctx.attrs),
        pointer: true,
        full: true,
        size: (__VLS_ctx.size),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, value: (null) }, null, null);
}
if (__VLS_ctx.attrs.checked === true) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-icon checked" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['checked']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "background-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['background-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        full: true,
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        fill: "currentColor",
        d: "m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22",
    });
}
if (__VLS_ctx.attrs.plus === true) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sub-icon plus" },
    });
    /** @type {__VLS_StyleScopedClasses['sub-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['plus']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "background-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['background-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        width: "11",
        height: "11",
        viewBox: "0 0 448 512",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        fill: "currentColor",
        d: "M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z",
    });
}
// @ts-ignore
[attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, size, size, size, size, execute, vTooltip, vTooltip,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
