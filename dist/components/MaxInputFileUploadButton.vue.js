const attrs = useAttrs();
const emit = defineEmits(['upload']);
const onUpload = (files) => {
    emit('upload', files);
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-upload-file-button-main-div" },
});
/** @type {__VLS_StyleScopedClasses['input-upload-file-button-main-div']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.MaxInputFileUpload | typeof __VLS_components.MaxInputFileUpload} */
MaxInputFileUpload;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(__VLS_ctx.attrs),
    modelValue: __VLS_ctx.attrs.modelValue,
    ...{ class: "no-style" },
    customUpload: true,
    onUpload: (__VLS_ctx.onUpload),
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    modelValue: __VLS_ctx.attrs.modelValue,
    ...{ class: "no-style" },
    customUpload: true,
    onUpload: (__VLS_ctx.onUpload),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['no-style']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
var __VLS_6 = {};
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "slot-main-div" },
});
/** @type {__VLS_StyleScopedClasses['slot-main-div']} */ ;
let __VLS_8;
/** @ts-ignore @type { | typeof __VLS_components.Icon} */
Icon;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    i: (__VLS_ctx.attrs.ico ?? __VLS_ctx.attrs.icon ?? __VLS_ctx.attrs.i ?? 'material-symbols:upload-rounded'),
    size: "1.4",
}));
const __VLS_10 = __VLS_9({
    i: (__VLS_ctx.attrs.ico ?? __VLS_ctx.attrs.icon ?? __VLS_ctx.attrs.i ?? 'material-symbols:upload-rounded'),
    size: "1.4",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
if (__VLS_ctx.attrs.label) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        'pl-10': true,
        ...{ class: "input-file-button-label" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.attrs.label) }, null, null);
    /** @type {__VLS_StyleScopedClasses['input-file-button-label']} */ ;
}
// @ts-ignore
[attrs, attrs, attrs, attrs, attrs, attrs, attrs, onUpload,];
var __VLS_3;
// @ts-ignore
var __VLS_7 = __VLS_6;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    emits: {},
});
const __VLS_export = {};
export default {};
