const attrs = useAttrs();
const props = withDefaults(defineProps(), {
    showTooltip: true
});
const __VLS_defaults = {
    showTooltip: true
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (props.imageUrl) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Avatar} */
    Avatar;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        image: (props.imageUrl),
        shape: "circle",
        ...(__VLS_ctx.attrs),
    }));
    const __VLS_2 = __VLS_1({
        image: (props.imageUrl),
        shape: "circle",
        ...(__VLS_ctx.attrs),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, modifiers: { top: true, }, value: (__VLS_ctx.showTooltip ? __VLS_ctx.name : null) }, null, null);
    var __VLS_5 = {};
    var __VLS_3;
}
else {
    let __VLS_6;
    /** @ts-ignore @type { | typeof __VLS_components.Avatar} */
    Avatar;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        label: (__VLS_ctx.name?.substring(0, 2).toUpperCase() ?? ''),
        ...{ style: {} },
        shape: "circle",
        pointer: true,
        ...(__VLS_ctx.attrs),
    }));
    const __VLS_8 = __VLS_7({
        label: (__VLS_ctx.name?.substring(0, 2).toUpperCase() ?? ''),
        ...{ style: {} },
        shape: "circle",
        pointer: true,
        ...(__VLS_ctx.attrs),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, modifiers: { top: true, }, value: (__VLS_ctx.showTooltip ? __VLS_ctx.name : null) }, null, null);
    var __VLS_11 = {};
    var __VLS_9;
}
// @ts-ignore
[attrs, attrs, vTooltip, vTooltip, showTooltip, showTooltip, name, name, name,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
    props: {},
});
export default {};
