const attrs = useAttrs();
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
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
        ...{ class: "loader-main-div-ai" },
    });
    /** @type {__VLS_StyleScopedClasses['loader-main-div-ai']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "items" },
    });
    /** @type {__VLS_StyleScopedClasses['items']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.DotLottieVue} */
    DotLottieVue;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ style: {} },
        autoplay: true,
        loop: true,
        src: "https://lottie.host/c6ad8a06-43b7-4f0e-876e-634d1f4bb58d/o6vjcixeiy.lottie",
    }));
    const __VLS_2 = __VLS_1({
        ...{ style: {} },
        autoplay: true,
        loop: true,
        src: "https://lottie.host/c6ad8a06-43b7-4f0e-876e-634d1f4bb58d/o6vjcixeiy.lottie",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    if (__VLS_ctx.attrs.label) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "item-label" },
        });
        /** @type {__VLS_StyleScopedClasses['item-label']} */ ;
        (__VLS_ctx.attrs.label);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "background-ai" },
    });
    /** @type {__VLS_StyleScopedClasses['background-ai']} */ ;
}
// @ts-ignore
[attrs, attrs, attrs, attrs, attrs,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
