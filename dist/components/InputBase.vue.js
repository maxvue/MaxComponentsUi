const attrs = useAttrs();
const props = withDefaults(defineProps(), {
    value: '',
    textCenter: false
});
const isError = computed(() => {
    return (typeof props.error === 'string' && hasContent(props.error)) || props.error === true || props.done === false;
});
const displayMessage = computed(() => {
    const mainMsg = props.message ?? props.msg;
    if (hasContent(mainMsg))
        return mainMsg;
    if (typeof props.error === 'string' && hasContent(props.error))
        return props.error;
    if (typeof props.caution === 'string' && hasContent(props.caution))
        return props.caution;
    return false;
});
const __VLS_defaults = {
    value: '',
    textCenter: false
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
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.FloatLabel | typeof __VLS_components.FloatLabel} */
FloatLabel;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    variant: "on",
    ...{ class: "max-input" },
    ...{ class: ({ float: __VLS_ctx.attrs.float !== undefined, done: __VLS_ctx.done, caution: __VLS_ctx.caution || __VLS_ctx.done === false, 'text-center': __VLS_ctx.textCenter }) },
}));
const __VLS_2 = __VLS_1({
    variant: "on",
    ...{ class: "max-input" },
    ...{ class: ({ float: __VLS_ctx.attrs.float !== undefined, done: __VLS_ctx.done, caution: __VLS_ctx.caution || __VLS_ctx.done === false, 'text-center': __VLS_ctx.textCenter }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['max-input']} */ ;
/** @type {__VLS_StyleScopedClasses['float']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['caution']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.IconField | typeof __VLS_components.IconField} */
IconField;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
if (__VLS_ctx.icon ?? __VLS_ctx.iconLeft ?? __VLS_ctx.i) {
    let __VLS_13;
    /** @ts-ignore @type { | typeof __VLS_components.InputIcon | typeof __VLS_components.InputIcon} */
    InputIcon;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
    const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
    const { default: __VLS_18 } = __VLS_16.slots;
    let __VLS_19;
    /** @ts-ignore @type { | typeof __VLS_components.MaxIcon} */
    MaxIcon;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        icon: (__VLS_ctx.icon ?? __VLS_ctx.iconLeft ?? __VLS_ctx.i),
        size: (1.2),
    }));
    const __VLS_21 = __VLS_20({
        icon: (__VLS_ctx.icon ?? __VLS_ctx.iconLeft ?? __VLS_ctx.i),
        size: (1.2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    // @ts-ignore
    [attrs, done, done, caution, textCenter, icon, icon, iconLeft, iconLeft, i, i,];
    var __VLS_16;
}
var __VLS_24 = {};
if (__VLS_ctx.iconRight) {
    let __VLS_26;
    /** @ts-ignore @type { | typeof __VLS_components.InputIcon | typeof __VLS_components.InputIcon} */
    InputIcon;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
    const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
    const { default: __VLS_31 } = __VLS_29.slots;
    let __VLS_32;
    /** @ts-ignore @type { | typeof __VLS_components.MaxIcon} */
    MaxIcon;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        icon: (__VLS_ctx.iconRight),
        size: (1.2),
    }));
    const __VLS_34 = __VLS_33({
        icon: (__VLS_ctx.iconRight),
        size: (1.2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    // @ts-ignore
    [iconRight, iconRight,];
    var __VLS_29;
}
// @ts-ignore
[];
var __VLS_10;
if (__VLS_ctx.label) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "in_label",
        ...{ class: "max-input-label active" },
    });
    /** @type {__VLS_StyleScopedClasses['max-input-label']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    (__VLS_ctx.label);
}
if (__VLS_ctx.displayMessage) {
    let __VLS_37;
    /** @ts-ignore @type { | typeof __VLS_components.Message | typeof __VLS_components.Message} */
    Message;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
        size: "small",
        ...{ class: (`input-message ${__VLS_ctx.isError ? 'error' : ''}`) },
        variant: "simple",
    }));
    const __VLS_39 = __VLS_38({
        size: "small",
        ...{ class: (`input-message ${__VLS_ctx.isError ? 'error' : ''}`) },
        variant: "simple",
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    const { default: __VLS_42 } = __VLS_40.slots;
    {
        const { icon: __VLS_43 } = __VLS_40.slots;
        if (__VLS_ctx.iconMessage) {
            let __VLS_44;
            /** @ts-ignore @type { | typeof __VLS_components.MaxIcon} */
            MaxIcon;
            // @ts-ignore
            const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
                icon: (__VLS_ctx.iconMessage),
                size: (0.9),
            }));
            const __VLS_46 = __VLS_45({
                icon: (__VLS_ctx.iconMessage),
                size: (0.9),
            }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        }
        // @ts-ignore
        [label, label, displayMessage, isError, iconMessage, iconMessage,];
    }
    (__VLS_ctx.displayMessage);
    // @ts-ignore
    [displayMessage,];
    var __VLS_40;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "message-spacer" },
    });
    /** @type {__VLS_StyleScopedClasses['message-spacer']} */ ;
}
if (__VLS_ctx.done) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "is-done" },
    });
    /** @type {__VLS_StyleScopedClasses['is-done']} */ ;
    let __VLS_49;
    /** @ts-ignore @type { | typeof __VLS_components.MaxIcon} */
    MaxIcon;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        icon: "lets-icons:check-fill",
        size: (0.9),
    }));
    const __VLS_51 = __VLS_50({
        icon: "lets-icons:check-fill",
        size: (0.9),
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
}
else if (__VLS_ctx.required) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "required" },
    });
    /** @type {__VLS_StyleScopedClasses['required']} */ ;
}
// @ts-ignore
[done, required,];
var __VLS_3;
// @ts-ignore
var __VLS_25 = __VLS_24;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
