const props = withDefaults(defineProps(), {
    noErrors: false,
    obrigatorio: false
});
const __VLS_defaults = {
    noErrors: false,
    obrigatorio: false
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['botao-input']} */ ;
if (!__VLS_ctx.noErrors) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (__VLS_ctx.typeSelect) },
        ...{ class: "labels text-xs pt-1 subpixel-antialiased" },
    });
    /** @type {__VLS_StyleScopedClasses['labels']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['subpixel-antialiased']} */ ;
    if (__VLS_ctx.obrigatorio) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "obrigatorio" },
        });
        /** @type {__VLS_StyleScopedClasses['obrigatorio']} */ ;
    }
    if (__VLS_ctx.msgError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "erro" },
        });
        /** @type {__VLS_StyleScopedClasses['erro']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "fill" },
        });
        /** @type {__VLS_StyleScopedClasses['fill']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "div_msg" },
        });
        /** @type {__VLS_StyleScopedClasses['div_msg']} */ ;
        (__VLS_ctx.msgError);
    }
    else if (__VLS_ctx.msg) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "div_mensagem" },
        });
        /** @type {__VLS_StyleScopedClasses['div_mensagem']} */ ;
        (__VLS_ctx.msg);
    }
}
// @ts-ignore
[noErrors, typeSelect, obrigatorio, msgError, msgError, msg, msg,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
    props: {},
});
export default {};
