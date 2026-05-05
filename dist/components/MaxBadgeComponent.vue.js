const attrs = useAttrs();
const badgeElem = ref(null);
onMounted(() => {
    if (badgeElem.value) {
        if (attrs['background'] || attrs['background-color'] || attrs['backgroundColor'])
            badgeElem.value.$el.style.backgroundColor = attrs['background'] ?? attrs['background-color'] ?? attrs['backgroundColor'];
        if (attrs['font-color'] || attrs['fontcolor'] || attrs['fontColor'])
            badgeElem.value.$el.style.color = attrs['font-color'] ?? attrs['fontcolor'] ?? attrs['fontColor'];
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (`badge-component-main-div ${__VLS_ctx.attrs.size ?? ''}`) },
});
if (__VLS_ctx.attrs.icon) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        i: (__VLS_ctx.attrs.icon),
        ...{ class: "icon-badge" },
        ...(__VLS_ctx.attrs),
        size: "1.1",
    }));
    const __VLS_2 = __VLS_1({
        i: (__VLS_ctx.attrs.icon),
        ...{ class: "icon-badge" },
        ...(__VLS_ctx.attrs),
        size: "1.1",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['icon-badge']} */ ;
}
if (__VLS_ctx.attrs.overlay === undefined) {
    let __VLS_5;
    /** @ts-ignore @type { | typeof __VLS_components.Badge} */
    Badge;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        ...(__VLS_ctx.attrs),
        value: (__VLS_ctx.attrs.label ?? __VLS_ctx.attrs.msg ?? __VLS_ctx.attrs.value ?? __VLS_ctx.attrs.mensagem ?? __VLS_ctx.attrs.text ?? __VLS_ctx.attrs.txt ?? __VLS_ctx.attrs.number),
        ...{ class: (`${__VLS_ctx.attrs.icon || __VLS_ctx.attrs['icon-color'] || __VLS_ctx.attrs['iconcolor'] || __VLS_ctx.attrs['iconColor'] ? 'with-icon' : ''} ${__VLS_ctx.attrs.iconValue || __VLS_ctx.attrs['icon-value'] || __VLS_ctx.attrs['icon-value'] ? 'with-icon-value' : ''}`) },
        ref: "badgeElem",
    }));
    const __VLS_7 = __VLS_6({
        ...(__VLS_ctx.attrs),
        value: (__VLS_ctx.attrs.label ?? __VLS_ctx.attrs.msg ?? __VLS_ctx.attrs.value ?? __VLS_ctx.attrs.mensagem ?? __VLS_ctx.attrs.text ?? __VLS_ctx.attrs.txt ?? __VLS_ctx.attrs.number),
        ...{ class: (`${__VLS_ctx.attrs.icon || __VLS_ctx.attrs['icon-color'] || __VLS_ctx.attrs['iconcolor'] || __VLS_ctx.attrs['iconColor'] ? 'with-icon' : ''} ${__VLS_ctx.attrs.iconValue || __VLS_ctx.attrs['icon-value'] || __VLS_ctx.attrs['icon-value'] ? 'with-icon-value' : ''}`) },
        ref: "badgeElem",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    var __VLS_10 = {};
    var __VLS_8;
}
else {
    let __VLS_12;
    /** @ts-ignore @type { | typeof __VLS_components.OverlayBadge} */
    OverlayBadge;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        ...(__VLS_ctx.attrs),
        ref: "badge",
    }));
    const __VLS_14 = __VLS_13({
        ...(__VLS_ctx.attrs),
        ref: "badge",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    var __VLS_17 = {};
    var __VLS_15;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "circle-color-badge" },
});
/** @type {__VLS_StyleScopedClasses['circle-color-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ style: ({ background: (__VLS_ctx.attrs['icon-color'] ?? __VLS_ctx.attrs['iconcolor'] ?? __VLS_ctx.attrs['iconColor'] ?? 'none') }) },
    ...{ class: "circle-color-badge-text" },
});
/** @type {__VLS_StyleScopedClasses['circle-color-badge-text']} */ ;
(__VLS_ctx.attrs['icon-value'] ?? '');
// @ts-ignore
var __VLS_11 = __VLS_10, __VLS_18 = __VLS_17;
// @ts-ignore
[attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
