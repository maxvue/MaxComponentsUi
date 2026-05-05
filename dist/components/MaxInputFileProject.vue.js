const props = withDefaults(defineProps(), {
    filesRg: () => [],
    filesFatura: () => [],
    filesQuadroAberto: () => [],
    filesQuadroFechado: () => [],
    filesListaEquipamentos: () => [],
    ready: false
});
const emit = defineEmits(['files-selected', 'process-ai']);
// REFS
const drop_zone_ref = ref(null);
const { isOverDropZone } = useDropZone(drop_zone_ref, {
    onDrop,
    multiple: true,
    preventDefaultForUnhandled: false
});
const { open, reset, onChange } = useFileDialog({
    directory: false
});
onChange((files) => {
    if (files)
        emit('files-selected', Array.from(files));
    reset();
});
function onDrop(files) {
    if (files)
        emit('files-selected', files);
}
const __VLS_defaults = {
    filesRg: () => [],
    filesFatura: () => [],
    filesQuadroAberto: () => [],
    filesQuadroFechado: () => [],
    filesListaEquipamentos: () => [],
    ready: false
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
    ...{ onClick: (() => __VLS_ctx.open()) },
    ...{ class: (`input-project-div ${__VLS_ctx.isOverDropZone ? 'in-drop' : 'not-in-drop'}`) },
    ref: "drop_zone_ref",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "open-files" },
    pointer: true,
});
/** @type {__VLS_StyleScopedClasses['open-files']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "instruction" },
});
/** @type {__VLS_StyleScopedClasses['instruction']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Icon} */
Icon;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    icon: "material-symbols:folder-open",
    size: "2",
}));
const __VLS_2 = __VLS_1({
    icon: "material-symbols:folder-open",
    size: "2",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "file-list" },
});
/** @type {__VLS_StyleScopedClasses['file-list']} */ ;
for (const [file] of __VLS_vFor((__VLS_ctx.filesRg))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (file.name),
        ...{ class: "file-item" },
        pointer: true,
    });
    /** @type {__VLS_StyleScopedClasses['file-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, modifiers: { top: true, }, value: ('Documento de identificação') }, null, null);
    let __VLS_5;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        i: "mdi:identification-card",
        size: "2",
    }));
    const __VLS_7 = __VLS_6({
        i: "mdi:identification-card",
        size: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    // @ts-ignore
    [open, isOverDropZone, filesRg, vTooltip,];
}
for (const [file] of __VLS_vFor((__VLS_ctx.filesFatura))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (file.name),
        pointer: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, modifiers: { top: true, }, value: ('Fatura de Energia') }, null, null);
    let __VLS_10;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        i: "fa7-solid:file-invoice-dollar",
        size: "2",
    }));
    const __VLS_12 = __VLS_11({
        i: "fa7-solid:file-invoice-dollar",
        size: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    // @ts-ignore
    [vTooltip, filesFatura,];
}
for (const [file] of __VLS_vFor((__VLS_ctx.filesListaEquipamentos))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (file.name),
        pointer: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, modifiers: { top: true, }, value: ('Kit Fotovoltaico') }, null, null);
    let __VLS_15;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        i: "mingcute:solar-panel-line",
        size: "2",
    }));
    const __VLS_17 = __VLS_16({
        i: "mingcute:solar-panel-line",
        size: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    // @ts-ignore
    [vTooltip, filesListaEquipamentos,];
}
if (__VLS_ctx.ready) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "check-list-upload-files" },
    });
    /** @type {__VLS_StyleScopedClasses['check-list-upload-files']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item" },
    });
    /** @type {__VLS_StyleScopedClasses['item']} */ ;
    let __VLS_20;
    /** @ts-ignore @type { | typeof __VLS_components.IconCheck} */
    IconCheck;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        value: (__VLS_ctx.filesRg.length > 0),
    }));
    const __VLS_22 = __VLS_21({
        value: (__VLS_ctx.filesRg.length > 0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item" },
    });
    /** @type {__VLS_StyleScopedClasses['item']} */ ;
    let __VLS_25;
    /** @ts-ignore @type { | typeof __VLS_components.IconCheck} */
    IconCheck;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        value: (__VLS_ctx.filesFatura.length > 0),
    }));
    const __VLS_27 = __VLS_26({
        value: (__VLS_ctx.filesFatura.length > 0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item" },
    });
    /** @type {__VLS_StyleScopedClasses['item']} */ ;
    let __VLS_30;
    /** @ts-ignore @type { | typeof __VLS_components.IconCheck} */
    IconCheck;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        value: (__VLS_ctx.filesQuadroAberto.length > 0),
    }));
    const __VLS_32 = __VLS_31({
        value: (__VLS_ctx.filesQuadroAberto.length > 0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item" },
    });
    /** @type {__VLS_StyleScopedClasses['item']} */ ;
    let __VLS_35;
    /** @ts-ignore @type { | typeof __VLS_components.IconCheck} */
    IconCheck;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        value: (__VLS_ctx.filesQuadroFechado.length > 0),
    }));
    const __VLS_37 = __VLS_36({
        value: (__VLS_ctx.filesQuadroFechado.length > 0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item" },
    });
    /** @type {__VLS_StyleScopedClasses['item']} */ ;
    let __VLS_40;
    /** @ts-ignore @type { | typeof __VLS_components.IconCheck} */
    IconCheck;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        value: (__VLS_ctx.filesListaEquipamentos.length > 0),
    }));
    const __VLS_42 = __VLS_41({
        value: (__VLS_ctx.filesListaEquipamentos.length > 0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('process-ai');
            // @ts-ignore
            [filesRg, filesFatura, filesListaEquipamentos, ready, filesQuadroAberto, filesQuadroFechado, $emit,];
        } },
    ...{ class: "icon-make-ai" },
});
/** @type {__VLS_StyleScopedClasses['icon-make-ai']} */ ;
let __VLS_45;
/** @ts-ignore @type { | typeof __VLS_components.IconButton} */
IconButton;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    i: "hugeicons:ai-file",
    size: "1.3",
}));
const __VLS_47 = __VLS_46({
    i: "hugeicons:ai-file",
    size: "1.3",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, modifiers: { left: true, }, value: ('Processar arquivos') }, null, null);
// @ts-ignore
[vTooltip,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
