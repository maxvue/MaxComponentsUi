import Button from 'primevue/button';
/** Atributos capturados via v-bind, incluindo props do PrimeVue Button */
const attrs = useAttrs();
const valueBadge = computed(() => attrs['number'] ?? attrs.badge ?? false);
const icon_left = computed(() => attrs.icon ?? attrs.iconLeft ?? attrs['icon-left'] ?? attrs.icon_left ?? null);
const icon_right = computed(() => attrs.iconRight ?? attrs['icon-right'] ?? attrs.IconRight ?? attrs.icon_right ?? null);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Button | typeof __VLS_components.Button} */
Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(__VLS_ctx.attrs),
    loading: (__VLS_ctx.attrs.loading),
    pointer: true,
    danger: (__VLS_ctx.attrs.severity === 'danger' || __VLS_ctx.attrs.danger !== undefined),
    success: (__VLS_ctx.attrs.severity === 'success' || __VLS_ctx.attrs.success !== undefined),
    confirm: (__VLS_ctx.attrs.severity === 'success' || __VLS_ctx.attrs.confirm !== undefined),
    cancel: (__VLS_ctx.attrs.cancel !== undefined),
    info: (__VLS_ctx.attrs.severity === 'info' || __VLS_ctx.attrs.info !== undefined),
    warn: (__VLS_ctx.attrs.severity === 'warn' || __VLS_ctx.attrs.warn !== undefined),
    help: (__VLS_ctx.attrs.severity === 'help' || __VLS_ctx.attrs.help !== undefined),
    secondary: (__VLS_ctx.attrs.severity === 'secondary' || __VLS_ctx.attrs.secondary !== undefined),
    contrast: (__VLS_ctx.attrs.severity === 'contrast' || __VLS_ctx.attrs.contrast !== undefined),
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    loading: (__VLS_ctx.attrs.loading),
    pointer: true,
    danger: (__VLS_ctx.attrs.severity === 'danger' || __VLS_ctx.attrs.danger !== undefined),
    success: (__VLS_ctx.attrs.severity === 'success' || __VLS_ctx.attrs.success !== undefined),
    confirm: (__VLS_ctx.attrs.severity === 'success' || __VLS_ctx.attrs.confirm !== undefined),
    cancel: (__VLS_ctx.attrs.cancel !== undefined),
    info: (__VLS_ctx.attrs.severity === 'info' || __VLS_ctx.attrs.info !== undefined),
    warn: (__VLS_ctx.attrs.severity === 'warn' || __VLS_ctx.attrs.warn !== undefined),
    help: (__VLS_ctx.attrs.severity === 'help' || __VLS_ctx.attrs.help !== undefined),
    secondary: (__VLS_ctx.attrs.severity === 'secondary' || __VLS_ctx.attrs.secondary !== undefined),
    contrast: (__VLS_ctx.attrs.severity === 'contrast' || __VLS_ctx.attrs.contrast !== undefined),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
{
    const { default: __VLS_7 } = __VLS_3.slots;
    let __VLS_8;
    /** @ts-ignore @type { | typeof __VLS_components.TransitionFade | typeof __VLS_components.TransitionFade} */
    TransitionFade;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
    const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
    const { default: __VLS_13 } = __VLS_11.slots;
    if (__VLS_ctx.attrs.loading) {
        let __VLS_14;
        /** @ts-ignore @type { | typeof __VLS_components.MaxIcon} */
        MaxIcon;
        // @ts-ignore
        const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            icon: "line-md:loading-twotone-loop",
            size: "1.6",
        }));
        const __VLS_16 = __VLS_15({
            icon: "line-md:loading-twotone-loop",
            size: "1.6",
        }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "content-button" },
        });
        /** @type {__VLS_StyleScopedClasses['content-button']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "btn-icon-left" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon-left']} */ ;
        if (__VLS_ctx.icon_left) {
            let __VLS_19;
            /** @ts-ignore @type { | typeof __VLS_components.MaxIconButton} */
            MaxIconButton;
            // @ts-ignore
            const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
                icon: (__VLS_ctx.icon_left),
                size: (__VLS_ctx.attrs.size ?? __VLS_ctx.attrs.sizeIcon ?? __VLS_ctx.attrs.iconSize ?? __VLS_ctx.attrs['size-icon'] ?? __VLS_ctx.attrs['icon-size'] ?? '1.8'),
                ...{ class: "content-button-icon" },
                flex: true,
            }));
            const __VLS_21 = __VLS_20({
                icon: (__VLS_ctx.icon_left),
                size: (__VLS_ctx.attrs.size ?? __VLS_ctx.attrs.sizeIcon ?? __VLS_ctx.attrs.iconSize ?? __VLS_ctx.attrs['size-icon'] ?? __VLS_ctx.attrs['icon-size'] ?? '1.8'),
                ...{ class: "content-button-icon" },
                flex: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_20));
            /** @type {__VLS_StyleScopedClasses['content-button-icon']} */ ;
        }
        if (__VLS_ctx.attrs.labelhtml || __VLS_ctx.attrs.label || __VLS_ctx.attrs['label-html']) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: (`btn-label ${__VLS_ctx.attrs.textLeft !== undefined ? 'text-left' : ''}`) },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.attrs.label ?? __VLS_ctx.attrs.labelhtml ?? __VLS_ctx.attrs['label-html']) }, null, null);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "btn-icon-right" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon-right']} */ ;
        if (__VLS_ctx.icon_right) {
            let __VLS_24;
            /** @ts-ignore @type { | typeof __VLS_components.MaxIconButton} */
            MaxIconButton;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
                icon: (__VLS_ctx.icon_right),
                size: (__VLS_ctx.attrs.size ?? __VLS_ctx.attrs.sizeIcon ?? __VLS_ctx.attrs.iconSize ?? __VLS_ctx.attrs['size-icon'] ?? __VLS_ctx.attrs['icon-size'] ?? '1.8'),
                ...{ class: "content-button-icon" },
                flex: true,
            }));
            const __VLS_26 = __VLS_25({
                icon: (__VLS_ctx.icon_right),
                size: (__VLS_ctx.attrs.size ?? __VLS_ctx.attrs.sizeIcon ?? __VLS_ctx.attrs.iconSize ?? __VLS_ctx.attrs['size-icon'] ?? __VLS_ctx.attrs['icon-size'] ?? '1.8'),
                ...{ class: "content-button-icon" },
                flex: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
            /** @type {__VLS_StyleScopedClasses['content-button-icon']} */ ;
        }
        if (__VLS_ctx.valueBadge) {
            let __VLS_29;
            /** @ts-ignore @type { | typeof __VLS_components.Badge | typeof __VLS_components.Badge} */
            Badge;
            // @ts-ignore
            const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
                size: (__VLS_ctx.attrs['size_badge'] ?? ''),
                value: (parseInt(__VLS_ctx.valueBadge) > 99 ? '99+' : __VLS_ctx.valueBadge),
                severity: (__VLS_ctx.attrs['badge_severity'] ?? __VLS_ctx.attrs['severity_badge'] ?? 'default'),
            }));
            const __VLS_31 = __VLS_30({
                size: (__VLS_ctx.attrs['size_badge'] ?? ''),
                value: (parseInt(__VLS_ctx.valueBadge) > 99 ? '99+' : __VLS_ctx.valueBadge),
                severity: (__VLS_ctx.attrs['badge_severity'] ?? __VLS_ctx.attrs['severity_badge'] ?? 'default'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_30));
        }
        var __VLS_34 = {};
    }
    // @ts-ignore
    [attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, icon_left, icon_left, icon_right, icon_right, valueBadge, valueBadge, valueBadge,];
    var __VLS_11;
    if (__VLS_ctx.attrs.countdown !== undefined) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "countdown-botao" },
        });
        /** @type {__VLS_StyleScopedClasses['countdown-botao']} */ ;
        (__VLS_ctx.attrs.countdown > 0 ? __VLS_ctx.attrs.countdown : '0');
    }
    // @ts-ignore
    [attrs, attrs, attrs,];
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_35 = __VLS_34;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({});
const __VLS_export = {};
export default {};
