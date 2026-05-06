const attrs = useAttrs();
const props = defineProps({
    /** Mensagem exibida durante o carregamento */
    loadingMessage: {
        type: String,
        default: 'Carregando dados...'
    }
});
/** Linhas expandidas na tabela (suporta v-model) */
const expandedRows = defineModel({ default: () => [] });
const __VLS_defaultModels = {
    'modelValue': () => [],
};
let __VLS_modelEmit;
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
    ...{ class: "tabela-main-div" },
});
/** @type {__VLS_StyleScopedClasses['tabela-main-div']} */ ;
if (!__VLS_ctx.attrs.loading) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.DataTable | typeof __VLS_components.DataTable} */
    DataTable;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        expandedRows: (__VLS_ctx.expandedRows),
        ...(__VLS_ctx.attrs),
    }));
    const __VLS_2 = __VLS_1({
        expandedRows: (__VLS_ctx.expandedRows),
        ...(__VLS_ctx.attrs),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    var __VLS_6 = {};
    {
        const { expansion: __VLS_8 } = __VLS_3.slots;
        const [slotProps] = __VLS_vSlot(__VLS_8);
        var __VLS_9 = {
            ...(slotProps),
        };
        // @ts-ignore
        [attrs, attrs, expandedRows,];
    }
    // @ts-ignore
    [];
    var __VLS_3;
}
else {
    let __VLS_11;
    /** @ts-ignore @type { | typeof __VLS_components.InternalLoading} */
    InternalLoading;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        msg: (__VLS_ctx.loadingMessage),
    }));
    const __VLS_13 = __VLS_12({
        msg: (__VLS_ctx.loadingMessage),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
}
// @ts-ignore
var __VLS_7 = __VLS_6, __VLS_10 = __VLS_9;
// @ts-ignore
[loadingMessage,];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    props: {
        ...{},
        ...{
            /** Mensagem exibida durante o carregamento */
            loadingMessage: {
                type: String,
                default: 'Carregando dados...'
            }
        },
    },
});
const __VLS_export = {};
export default {};
