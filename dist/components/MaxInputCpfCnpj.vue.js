import { vMaska } from 'maska/vue';
import { isCpf as isCPF, isCnpj as isCNPJ } from '@maxvue/max-use';
const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', done: undefined, required: false, caution: undefined });
const emit = defineEmits(['update:modelValue', 'complete']);
const temp_value = ref(props.modelValue ?? '');
const isDone = ref(props.done ?? null);
const type_mask = ref(null);
// CALCULA LARGURA DO INPUT E ESPAÇAMENTO DAS LETRAS
const el = useTemplateRef('el');
const { width } = useElementSize(el);
const space_letters = computed(() => (width.value ? (width.value - 100) / 30 : 0));
const checkDone = () => {
    isDone.value = done.value;
};
// ATUALIZA O VALOR DO INPUT COM O VALOR DO MODEL E VICE-VERSA
watchDebounced(temp_value, () => {
    const only_numbers = onlyNumbers(temp_value.value);
    if (only_numbers.length === 11 || only_numbers.length === 14) {
        emit('update:modelValue', onlyNumbers(temp_value.value));
        if (done.value)
            emit('complete', onlyNumbers(temp_value.value));
    }
}, { debounce: 500 });
watch(() => props.modelValue, () => {
    if (props.modelValue !== temp_value.value)
        temp_value.value = onlyNumbers(props.modelValue);
});
// CALCULA A MÁSCARA DO INPUT
const maskValue = computed(() => {
    let mask_string = '@';
    if (props.cpf) {
        mask_string = '###.###.###-##@';
        type_mask.value = 'cpf';
    }
    else if (props.cnpj) {
        mask_string = '##.###.###/####-##';
        type_mask.value = 'cnpj';
    }
    else {
        const only_numbers = onlyNumbers(temp_value.value);
        if (only_numbers.length > 11) {
            mask_string = '##.###.###/####-##';
            type_mask.value = 'cnpj';
        }
        else {
            mask_string = '###.###.###-##@';
            type_mask.value = 'cpf';
        }
    }
    return {
        tokens: { '#': { pattern: /[0-9]/ }, '@': { pattern: /[0-9]/, optional: true, recursive: true } },
        mask: mask_string
    };
});
const done = computed(() => {
    if (props.done !== undefined)
        return props.done;
    if (props.cpf)
        return isCPF(temp_value.value);
    if (props.cnpj)
        return isCNPJ(temp_value.value);
    return isCPF(temp_value.value) || isCNPJ(temp_value.value);
});
const caution = computed(() => {
    if (props.caution !== undefined)
        return props.caution;
    const only_numbers = onlyNumbers(temp_value.value);
    if (only_numbers.length === 0)
        return false;
    return !done.value;
});
const error_msg = computed(() => {
    if (!caution.value)
        return null;
    const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
    if (onlyNumbers(temp_value.value).length === 0 && props.required)
        return attrs_error_message ?? 'Campo obrigatório';
    if (type_mask.value === 'cpf')
        return attrs_error_message ?? 'CPF inválido';
    if (type_mask.value === 'cnpj')
        return attrs_error_message ?? 'CNPJ inválido';
    return attrs_error_message ?? 'Documento inválido';
});
const __VLS_defaults = { modelValue: '', done: undefined, required: false, caution: undefined };
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
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.InputBase | typeof __VLS_components.InputBase} */
InputBase;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(props),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
    done: (__VLS_ctx.isDone),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
    done: (__VLS_ctx.isDone),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.InputText} */
InputText;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onBlur': {} },
    ref: "el",
    type: "text",
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    ...{ style: (`letter-spacing: 2px; padding-left: ${__VLS_ctx.space_letters + 8}px`) },
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    ref: "el",
    type: "text",
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    ...{ style: (`letter-spacing: 2px; padding-left: ${__VLS_ctx.space_letters + 8}px`) },
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.checkDone();
            // @ts-ignore
            [error_msg, caution, isDone, temp_value, space_letters, checkDone,];
        } });
__VLS_asFunctionalDirective(__VLS_directives.vMaska, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.maskValue) }, null, null);
var __VLS_14 = {};
var __VLS_10;
var __VLS_11;
// @ts-ignore
[vMaska, maskValue,];
var __VLS_3;
// @ts-ignore
var __VLS_15 = __VLS_14;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
