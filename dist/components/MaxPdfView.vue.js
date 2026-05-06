const { width: screen_width, height: screen_height } = useWindowSize();
const props = defineProps({
    /** URL ou fonte do arquivo PDF */
    file: { default: '' }
});
const size = ref({ width: screen_width.value, height: screen_height.value });
const Zoom = (value) => {
    const amount = 0.05;
    if (value === 'out')
        size.value.width = size.value.width * (1 - amount);
    else if (value === 'in')
        size.value.width = size.value.width * (1 + amount);
};
const is_open = ref(false);
const opacity = ref(0);
const total = ref(0);
const percent = ref(0);
const isLoading = ref(true);
function rendered() {
    isLoading.value = false;
    opacity.value = 0.9;
}
function loaded(event) {
    total.value = event.numPages;
    opacity.value = 1;
}
function progressPdf(event) {
    percent.value = Math.round((event.loaded / event.total) * 100);
    if (percent.value > 99)
        percent.value = 98;
}
function closePDF() {
    opacity.value = 0;
    setTimeout(() => {
        is_open.value = false;
    }, 500);
}
watch(() => props.file, () => {
    opacity.value = 0;
    isLoading.value = true;
    percent.value = 0;
    total.value = 0;
    is_open.value = true;
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.is_open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "viewPDF" },
        ...{ style: ({ opacity: __VLS_ctx.opacity }) },
    });
    /** @type {__VLS_StyleScopedClasses['viewPDF']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePDF) },
        ...{ class: "space" },
    });
    /** @type {__VLS_StyleScopedClasses['space']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "meio" },
    });
    /** @type {__VLS_StyleScopedClasses['meio']} */ ;
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    if (__VLS_ctx.isLoading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (__VLS_ctx.closePDF) },
            ...{ class: "loading" },
        });
        /** @type {__VLS_StyleScopedClasses['loading']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "conjunto" },
        });
        /** @type {__VLS_StyleScopedClasses['conjunto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "texto" },
        });
        /** @type {__VLS_StyleScopedClasses['texto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "circle" },
        });
        /** @type {__VLS_StyleScopedClasses['circle']} */ ;
        let __VLS_6;
        /** @ts-ignore @type { | typeof __VLS_components.ProgressSpinner | typeof __VLS_components.ProgressSpinner} */
        ProgressSpinner;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
            ...{ style: {} },
            strokeWidth: "7",
            animationDuration: ".5s",
            'aria-label': "Custom ProgressSpinner",
        }));
        const __VLS_8 = __VLS_7({
            ...{ style: {} },
            strokeWidth: "7",
            animationDuration: ".5s",
            'aria-label': "Custom ProgressSpinner",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "percent" },
        });
        /** @type {__VLS_StyleScopedClasses['percent']} */ ;
        (__VLS_ctx.percent);
    }
    // @ts-ignore
    [is_open, opacity, closePDF, closePDF, isLoading, percent,];
    var __VLS_3;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pdfDiv" },
    });
    /** @type {__VLS_StyleScopedClasses['pdfDiv']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePDF) },
        ...{ class: "space" },
    });
    /** @type {__VLS_StyleScopedClasses['space']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pdf-div-bar-tools" },
    });
    /** @type {__VLS_StyleScopedClasses['pdf-div-bar-tools']} */ ;
    let __VLS_11;
    /** @ts-ignore @type { | typeof __VLS_components.Botao} */
    Botao;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        ...{ 'onClick': {} },
        icon: "iconamoon:zoom-out-light",
        flex: true,
        text: true,
    }));
    const __VLS_13 = __VLS_12({
        ...{ 'onClick': {} },
        icon: "iconamoon:zoom-out-light",
        flex: true,
        text: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    let __VLS_16;
    const __VLS_17 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.is_open))
                    return;
                __VLS_ctx.Zoom('out');
                // @ts-ignore
                [closePDF, Zoom,];
            } });
    var __VLS_14;
    var __VLS_15;
    let __VLS_18;
    /** @ts-ignore @type { | typeof __VLS_components.Botao} */
    Botao;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        ...{ 'onClick': {} },
        icon: "lucide:zoom-in",
        flex: true,
        text: true,
    }));
    const __VLS_20 = __VLS_19({
        ...{ 'onClick': {} },
        icon: "lucide:zoom-in",
        flex: true,
        text: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    let __VLS_23;
    const __VLS_24 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.is_open))
                    return;
                __VLS_ctx.Zoom('in');
                // @ts-ignore
                [Zoom,];
            } });
    var __VLS_21;
    var __VLS_22;
    let __VLS_25;
    /** @ts-ignore @type { | typeof __VLS_components.Botao} */
    Botao;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        ...{ 'onClick': {} },
        icon: "ic:round-close",
        flex: true,
        text: true,
    }));
    const __VLS_27 = __VLS_26({
        ...{ 'onClick': {} },
        icon: "ic:round-close",
        flex: true,
        text: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    let __VLS_30;
    const __VLS_31 = ({ click: {} },
        { onClick: (__VLS_ctx.closePDF) });
    var __VLS_28;
    var __VLS_29;
}
// @ts-ignore
[closePDF,];
const __VLS_export = (await import('vue')).defineComponent({
    props: {
        /** URL ou fonte do arquivo PDF */
        file: { default: '' }
    },
});
export default {};
