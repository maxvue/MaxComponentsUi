const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: () => [] });
const emit = defineEmits(['update:modelValue']);
const temp_value = ref(props.modelValue);
const isVisibleFiles = computed(() => attrs.noView === undefined && attrs.noPreview === undefined);
const sizePreview = computed(() => attrs.sizeFiles ?? attrs.sizePreview ?? attrs.size_files ?? attrs.size_preview ?? '');
const dropZoneRef = ref(null);
const feedbackMessage = ref('Pressione Ctrl+V para colar um arquivo ou uma imagem (print).');
watch(temp_value, (val) => {
    emit('update:modelValue', val);
});
watch(() => props.modelValue, (val) => {
    temp_value.value = val;
});
const deleteItem = (indexRemove) => {
    temp_value.value = temp_value.value.filter((_, index) => index !== indexRemove);
};
const handlePaste = (event) => {
    if (!event.clipboardData)
        return;
    const filesFound = [];
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
                const namedFile = new File([file], `pasted-image-${Date.now()}.${file.type.split('/')[1]}`, { type: file.type });
                namedFile.src = URL.createObjectURL(namedFile);
                filesFound.push(namedFile);
            }
        }
    }
    if (filesFound.length === 0 && event.clipboardData.files.length > 0)
        filesFound.push(...Array.from(event.clipboardData.files));
    if (filesFound.length > 0) {
        event.preventDefault();
        temp_value.value = [...temp_value.value, ...filesFound];
        feedbackMessage.value = `${filesFound.length} item(s) colado(s) com sucesso!`;
    }
};
useEventListener(window, 'paste', handlePaste);
const { isOverDropZone } = useDropZone(dropZoneRef, {
    onDrop,
    multiple: true,
    preventDefaultForUnhandled: false
});
function onDrop(files) {
    if (files && files.length > 0)
        temp_value.value = [...temp_value.value, ...files];
}
const __VLS_defaults = { modelValue: () => [] };
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
    ...{ class: "input-file-main-div" },
    ...(__VLS_ctx.attrs),
});
/** @type {__VLS_StyleScopedClasses['input-file-main-div']} */ ;
var __VLS_0 = {
    flex: true,
};
if (!__VLS_ctx.isOverDropZone) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-file-content" },
    });
    /** @type {__VLS_StyleScopedClasses['input-file-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-file-content-icon-label" },
    });
    /** @type {__VLS_StyleScopedClasses['input-file-content-icon-label']} */ ;
    let __VLS_2;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent1(__VLS_2, new __VLS_2({
        i: "lets-icons:upload-light",
        size: "3",
    }));
    const __VLS_4 = __VLS_3({
        i: "lets-icons:upload-light",
        size: "3",
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-file-content-label" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.attrs.label ?? 'Clique aqui, arraste e solte, <br>ou cole (CTRL + V) arquivos para carregar.') }, null, null);
    /** @type {__VLS_StyleScopedClasses['input-file-content-label']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ref: "dropZoneRef",
    ...{ class: (`drop-zone-div ${__VLS_ctx.isOverDropZone ? 'dropping' : ''}`) },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "drop-zone-div-content" },
});
/** @type {__VLS_StyleScopedClasses['drop-zone-div-content']} */ ;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.Icon} */
Icon;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    i: "tabler:drag-drop",
    size: "2.6",
}));
const __VLS_9 = __VLS_8({
    i: "tabler:drag-drop",
    size: "2.6",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
var __VLS_12 = {
    flex: true,
};
if (__VLS_ctx.temp_value.length > 0 && __VLS_ctx.sizePreview === 'mini') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "files-list-mini" },
    });
    /** @type {__VLS_StyleScopedClasses['files-list-mini']} */ ;
    for (const [file, index] of __VLS_vFor((__VLS_ctx.temp_value))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (`preview-${index}`),
        });
        let __VLS_14;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            i: "mdi:file-outline",
            size: "1.5",
        }));
        const __VLS_16 = __VLS_15({
            i: "mdi:file-outline",
            size: "1.5",
        }, ...__VLS_functionalComponentArgsRest(__VLS_15));
        // @ts-ignore
        [attrs, attrs, isOverDropZone, isOverDropZone, temp_value, temp_value, sizePreview,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "files-list-preview" },
    });
    /** @type {__VLS_StyleScopedClasses['files-list-preview']} */ ;
    for (const [file, index] of __VLS_vFor((__VLS_ctx.temp_value))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (`preview-${index}`),
            ...{ class: "files-list-preview-content" },
        });
        /** @type {__VLS_StyleScopedClasses['files-list-preview-content']} */ ;
        if (file.type && file.type.startsWith('image/')) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (file?.src),
            });
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-standard" },
        });
        /** @type {__VLS_StyleScopedClasses['file-standard']} */ ;
        let __VLS_19;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            i: "mdi:file-outline",
            size: "3",
        }));
        const __VLS_21 = __VLS_20({
            i: "mdi:file-outline",
            size: "3",
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-standard-info" },
        });
        /** @type {__VLS_StyleScopedClasses['file-standard-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (file.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "file-standard-info" },
        });
        /** @type {__VLS_StyleScopedClasses['file-standard-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        ((file.size / 1024).toFixed(2));
        __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.temp_value.length > 0 && __VLS_ctx.sizePreview === 'mini'))
                        return;
                    __VLS_ctx.deleteItem(index);
                    // @ts-ignore
                    [temp_value, deleteItem,];
                } },
            ...{ class: "trash-icon-remove-clipboard" },
            pr4: true,
            pt4: true,
        });
        /** @type {__VLS_StyleScopedClasses['trash-icon-remove-clipboard']} */ ;
        let __VLS_24;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            i: "tabler:trash",
            size: "1.3",
            hoverBlueIcon: true,
        }));
        const __VLS_26 = __VLS_25({
            i: "tabler:trash",
            size: "1.3",
            hoverBlueIcon: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        // @ts-ignore
        [];
    }
}
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_13 = __VLS_12;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
