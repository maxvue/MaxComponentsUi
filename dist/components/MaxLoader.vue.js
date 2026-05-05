const __VLS_export = ((__VLS_props, __VLS_ctx, __VLS_exposed, __VLS_setup = (async () => {
    const attrs = useAttrs();
    const __VLS_ctx = {
        ...{},
        ...{},
    };
    let __VLS_components;
    let __VLS_intrinsics;
    let __VLS_directives;
    if (__VLS_ctx.attrs.show !== undefined ? __VLS_ctx.attrs.show : true) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...(__VLS_ctx.attrs),
            ...{ class: "loader-main-div" },
        });
        /** @type {__VLS_StyleScopedClasses['loader-main-div']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "items" },
        });
        /** @type {__VLS_StyleScopedClasses['items']} */ ;
        let __VLS_0;
        /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
        LoaderIcon;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
        const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
        if (__VLS_ctx.attrs.label) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "item-label" },
            });
            /** @type {__VLS_StyleScopedClasses['item-label']} */ ;
            (__VLS_ctx.attrs.label);
        }
    }
    // @ts-ignore
    [attrs, attrs, attrs, attrs, attrs,];
    return {};
})()) => ({}));
export default {};
