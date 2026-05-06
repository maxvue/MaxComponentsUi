const attrs = useAttrs();
const center = computed(() => (attrs.center !== undefined ? 'center' : ''));
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (`e-t1 ${__VLS_ctx.center}`) },
    ...(__VLS_ctx.attrs),
});
if (__VLS_ctx.attrs.h1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-lg font-medium uppercase t1-main-text" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    /** @type {__VLS_StyleScopedClasses['t1-main-text']} */ ;
    (__VLS_ctx.attrs.h1);
}
if (__VLS_ctx.attrs.h2) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm t2-main-text" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['t2-main-text']} */ ;
    (__VLS_ctx.attrs.h2);
}
// @ts-ignore
[center, attrs, attrs, attrs, attrs, attrs,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
