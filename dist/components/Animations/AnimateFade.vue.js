import { AnimatePresence } from 'motion-v';
import { Motion } from 'motion-v';
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
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.AnimatePresence | typeof __VLS_components.AnimatePresence} */
AnimatePresence;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    multiple: true,
    mode: ('wait'),
}));
const __VLS_2 = __VLS_1({
    multiple: true,
    mode: ('wait'),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
if (props.show) {
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }),
    }));
    const __VLS_9 = __VLS_8({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    const { default: __VLS_12 } = __VLS_10.slots;
    var __VLS_13 = {};
    var __VLS_10;
}
else if (!props.show && props.loading === true) {
    let __VLS_15;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }),
        flex: true,
    }));
    const __VLS_17 = __VLS_16({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }),
        flex: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    const { default: __VLS_20 } = __VLS_18.slots;
    let __VLS_21;
    /** @ts-ignore @type { | typeof __VLS_components.Loader} */
    Loader;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
        absolute: true,
        flex: true,
        ...{ style: ({ backgroundColor: props.transparent === true ? 'transparent' : '' }) },
        label: (props.label ?? null),
    }));
    const __VLS_23 = __VLS_22({
        absolute: true,
        flex: true,
        ...{ style: ({ backgroundColor: props.transparent === true ? 'transparent' : '' }) },
        label: (props.label ?? null),
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    var __VLS_18;
}
else if (!props.show && props.error === true) {
    let __VLS_26;
    /** @ts-ignore @type { | typeof __VLS_components.Motion | typeof __VLS_components.Motion} */
    Motion;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }),
        flex: true,
        gridCenter: true,
    }));
    const __VLS_28 = __VLS_27({
        as: "div",
        initial: ({ opacity: 0 }),
        animate: ({ opacity: 1 }),
        exit: ({ opacity: 0 }),
        transition: ({ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }),
        flex: true,
        gridCenter: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    const { default: __VLS_31 } = __VLS_29.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        grid: true,
        center: true,
    });
    if (props.errorIcon) {
        let __VLS_32;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            i: (props.errorIcon ?? 'wordpress:caution'),
            size: "4",
        }));
        const __VLS_34 = __VLS_33({
            i: (props.errorIcon ?? 'wordpress:caution'),
            size: "4",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ style: {} },
    });
    (props.errorMessage);
    var __VLS_29;
}
var __VLS_3;
// @ts-ignore
var __VLS_14 = __VLS_13;
const __VLS_base = (await import('vue')).defineComponent({
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
