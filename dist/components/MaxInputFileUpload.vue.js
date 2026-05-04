const attrs = useAttrs();
const fileUploadRef = ref(null);
const props = withDefaults(defineProps(), { uploadData: () => ({}), label: '', responseField: 'file' });
const modelValue = defineModel({ default: () => [] });
const files = ref([]);
const uploading = ref(false);
const showError = ref(false);
const emit = defineEmits(['file-click', 'upload-error']);
const displayLabel = computed(() => {
    const isDisabled = attrs.disabled !== undefined && attrs.disabled !== false;
    if (isDisabled)
        return attrs['label-disabled'] ?? attrs.labelDisabled ?? attrs.label_disabled ?? props.label;
    return props.label;
});
watch(showError, (val) => {
    if (val) {
        setTimeout(() => {
            showError.value = false;
            files.value = [];
        }, 3000);
    }
});
const triggerChoose = () => {
    if (fileUploadRef.value) {
        // Tenta disparar o seletor de arquivos através da API do PrimeVue ou fallback
        const chooseButton = fileUploadRef.value.$el.querySelector('.p-fileupload-choose');
        chooseButton?.click();
    }
};
const onSelectHandler = (event) => {
    if (attrs.onSelect)
        return attrs.onSelect(event);
    uploading.value = true;
    files.value = event.files;
};
const onUploadHandler = (event) => {
    if (attrs.onUpload)
        return attrs.onUpload(event);
    uploading.value = false;
    try {
        const response = JSON.parse(event.xhr.response);
        const fileData = props.responseField ? response[props.responseField] : response;
        if (fileData) {
            modelValue.value = [...modelValue.value, fileData];
        }
    }
    catch (e) {
        console.error('MaxInputFileUpload: Erro ao processar resposta de upload', e);
    }
};
const onError = (event) => {
    showError.value = true;
    uploading.value = false;
    emit('upload-error', event);
};
const onBeforeUpload = (event) => {
    if (event.xhr) {
        if (props.token)
            event.xhr.setRequestHeader('X-CSRF-TOKEN', props.token);
        for (const key in props.uploadData) {
            event.formData.append(key, props.uploadData[key]);
        }
        if (files.value.length > 0) {
            const extension = files.value[0].name.split('.').pop();
            event.formData.append('extension', extension);
        }
    }
};
const getFileExtension = (fileName) => fileName ? fileName.split('.').pop()?.toLowerCase() : '';
const __VLS_defaultModels = {
    'modelValue': () => [],
};
let __VLS_modelEmit;
const __VLS_defaults = { uploadData: () => ({}), label: '', responseField: 'file' };
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
    ...{ class: "input-upload-file-main-div" },
    ...(__VLS_ctx.attrs),
});
/** @type {__VLS_StyleScopedClasses['input-upload-file-main-div']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.FileUpload | typeof __VLS_components.FileUpload} */
FileUpload;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onError': {} },
    ...{ 'onBeforeSend': {} },
    ...{ 'onUpload': {} },
    ...{ 'onSelect': {} },
    ref: "fileUploadRef",
    name: "file",
    ...(__VLS_ctx.attrs),
    disabled: (__VLS_ctx.attrs.disabled ?? false),
    accept: (__VLS_ctx.attrs.accept ?? '.pdf, .jpg, .jpeg, .png, .doc, .docx'),
    auto: (__VLS_ctx.attrs.auto ?? true),
    multiple: (__VLS_ctx.attrs.multiple ?? true),
    showCancelButton: (false),
    showUploadButton: (__VLS_ctx.attrs.showUploadButton !== undefined && __VLS_ctx.attrs.showUploadButton !== false),
    withCredentials: (true),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onError': {} },
    ...{ 'onBeforeSend': {} },
    ...{ 'onUpload': {} },
    ...{ 'onSelect': {} },
    ref: "fileUploadRef",
    name: "file",
    ...(__VLS_ctx.attrs),
    disabled: (__VLS_ctx.attrs.disabled ?? false),
    accept: (__VLS_ctx.attrs.accept ?? '.pdf, .jpg, .jpeg, .png, .doc, .docx'),
    auto: (__VLS_ctx.attrs.auto ?? true),
    multiple: (__VLS_ctx.attrs.multiple ?? true),
    showCancelButton: (false),
    showUploadButton: (__VLS_ctx.attrs.showUploadButton !== undefined && __VLS_ctx.attrs.showUploadButton !== false),
    withCredentials: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ error: {} },
    { onError: (__VLS_ctx.onError) });
const __VLS_7 = ({ beforeSend: {} },
    { onBeforeSend: (__VLS_ctx.onBeforeUpload) });
const __VLS_8 = ({ upload: {} },
    { onUpload: (__VLS_ctx.onUploadHandler) });
const __VLS_9 = ({ select: {} },
    { onSelect: (__VLS_ctx.onSelectHandler) });
var __VLS_10 = {};
const { default: __VLS_12 } = __VLS_3.slots;
{
    const { content: __VLS_13 } = __VLS_3.slots;
    const [{ files, uploadedFiles }] = __VLS_vSlot(__VLS_13);
    if ((files.length > 0 || uploadedFiles.length > 0) && !__VLS_ctx.uploading && !__VLS_ctx.showError && (__VLS_ctx.attrs.uploading === false || __VLS_ctx.attrs.uploading === undefined)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (__VLS_ctx.triggerChoose) },
            ...{ class: "label-file-upload" },
        });
        /** @type {__VLS_StyleScopedClasses['label-file-upload']} */ ;
        var __VLS_14 = {};
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text" },
        });
        /** @type {__VLS_StyleScopedClasses['text']} */ ;
        (__VLS_ctx.displayLabel);
    }
    else if (__VLS_ctx.uploading || __VLS_ctx.attrs.uploading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex" },
            'gap-30': true,
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        let __VLS_16;
        /** @ts-ignore @type { | typeof __VLS_components.ProgressSpinner} */
        ProgressSpinner;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
            ...{ style: {} },
            animationDuration: "2s",
        }));
        const __VLS_18 = __VLS_17({
            ...{ style: {} },
            animationDuration: "2s",
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    }
    else if (__VLS_ctx.showError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        var __VLS_21 = {};
    }
    // @ts-ignore
    [attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, onError, onBeforeUpload, onUploadHandler, onSelectHandler, uploading, uploading, showError, showError, triggerChoose, displayLabel,];
}
{
    const { empty: __VLS_23 } = __VLS_3.slots;
    if (__VLS_ctx.files.length === 0 && (__VLS_ctx.attrs.uploading === false || __VLS_ctx.attrs.uploading === undefined)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (__VLS_ctx.triggerChoose) },
            ...{ class: "label-file-upload" },
        });
        /** @type {__VLS_StyleScopedClasses['label-file-upload']} */ ;
        var __VLS_24 = {};
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text" },
        });
        /** @type {__VLS_StyleScopedClasses['text']} */ ;
        (__VLS_ctx.displayLabel);
        if (__VLS_ctx.showError) {
            var __VLS_26 = {};
        }
    }
    // @ts-ignore
    [attrs, attrs, showError, triggerChoose, displayLabel, files,];
}
{
    const { chooseicon: __VLS_28 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chose-icon-div" },
    });
    /** @type {__VLS_StyleScopedClasses['chose-icon-div']} */ ;
    if (__VLS_ctx.uploading) {
        let __VLS_29;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
            icon: "line-md:loading-loop",
            size: "2",
        }));
        const __VLS_31 = __VLS_30({
            icon: "line-md:loading-loop",
            size: "2",
        }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    }
    else {
        let __VLS_34;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
            icon: "quill:folder-open",
            size: "2",
        }));
        const __VLS_36 = __VLS_35({
            icon: "quill:folder-open",
            size: "2",
        }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    }
    // @ts-ignore
    [uploading,];
}
{
    const { uploadicon: __VLS_39 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chose-icon-div" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, value: ('Enviar arquivo') }, null, null);
    /** @type {__VLS_StyleScopedClasses['chose-icon-div']} */ ;
    let __VLS_40;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        icon: "ic:baseline-file-upload",
        size: "2",
    }));
    const __VLS_42 = __VLS_41({
        icon: "ic:baseline-file-upload",
        size: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    // @ts-ignore
    [vTooltip,];
}
{
    const { cancelicon: __VLS_45 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chose-icon-div" },
    });
    /** @type {__VLS_StyleScopedClasses['chose-icon-div']} */ ;
    let __VLS_46;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        icon: "icons8:cancel",
        size: "2",
    }));
    const __VLS_48 = __VLS_47({
        icon: "icons8:cancel",
        size: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "file-upload-content-div" },
    disabled: (__VLS_ctx.attrs.disabled ?? false),
});
/** @type {__VLS_StyleScopedClasses['file-upload-content-div']} */ ;
if (__VLS_ctx.modelValue.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "files-icons" },
    });
    /** @type {__VLS_StyleScopedClasses['files-icons']} */ ;
    for (const [file, index] of __VLS_vFor((__VLS_ctx.modelValue))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue.length > 0))
                        return;
                    __VLS_ctx.$emit('file-click', file);
                    // @ts-ignore
                    [attrs, modelValue, modelValue, $emit,];
                } },
            key: (file.id || index),
            ...{ class: "file-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['file-icon']} */ ;
        if (__VLS_ctx.getFileExtension(file?.file_name) === 'pdf') {
            let __VLS_51;
            /** @ts-ignore @type { | typeof __VLS_components.icon | typeof __VLS_components.Icon} */
            icon;
            // @ts-ignore
            const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
                i: "ph:file-pdf-light",
                size: "1.8",
                p0: true,
            }));
            const __VLS_53 = __VLS_52({
                i: "ph:file-pdf-light",
                size: "1.8",
                p0: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_52));
        }
        if (['jpg', 'jpeg'].includes(__VLS_ctx.getFileExtension(file?.file_name))) {
            let __VLS_56;
            /** @ts-ignore @type { | typeof __VLS_components.icon | typeof __VLS_components.Icon} */
            icon;
            // @ts-ignore
            const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
                i: "ph:file-jpg-light",
                size: "1.8",
                p0: true,
            }));
            const __VLS_58 = __VLS_57({
                i: "ph:file-jpg-light",
                size: "1.8",
                p0: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        }
        if (__VLS_ctx.getFileExtension(file?.file_name) === 'png') {
            let __VLS_61;
            /** @ts-ignore @type { | typeof __VLS_components.icon | typeof __VLS_components.Icon} */
            icon;
            // @ts-ignore
            const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
                i: "ph:file-png-light",
                size: "1.8",
            }));
            const __VLS_63 = __VLS_62({
                i: "ph:file-png-light",
                size: "1.8",
            }, ...__VLS_functionalComponentArgsRest(__VLS_62));
        }
        let __VLS_66;
        /** @ts-ignore @type { | typeof __VLS_components.icon | typeof __VLS_components.Icon} */
        icon;
        // @ts-ignore
        const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
            i: "fa:check-circle",
            ...{ class: "file-check" },
            size: "0.7",
        }));
        const __VLS_68 = __VLS_67({
            i: "fa:check-circle",
            ...{ class: "file-check" },
            size: "0.7",
        }, ...__VLS_functionalComponentArgsRest(__VLS_67));
        /** @type {__VLS_StyleScopedClasses['file-check']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src),
            alt: "Image",
        });
        __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (!file.file_name) }, null, null);
        // @ts-ignore
        [getFileExtension, getFileExtension, getFileExtension,];
    }
}
// @ts-ignore
var __VLS_11 = __VLS_10, __VLS_15 = __VLS_14, __VLS_22 = __VLS_21, __VLS_25 = __VLS_24, __VLS_27 = __VLS_26;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    emits: {
        ...{},
        ...{},
    },
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
