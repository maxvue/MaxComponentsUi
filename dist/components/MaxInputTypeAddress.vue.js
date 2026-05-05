import MaxInputSelect from './MaxInputSelect.vue';
const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '' });
const inputValue = ref(props.modelValue);
const emit = defineEmits(['update:modelValue']);
const street = computed(() => attrs.street ?? props.street);
const listTypeAddress = [
    { name: 'Rua', value: 'Rua', values: ['rua', 'r'] },
    { name: 'Avenida', value: 'Avenida', values: ['avenida', 'av', 'ave'] },
    { name: 'Alameda', value: 'Alameda', values: ['alameda', 'al'] },
    { name: 'Praça', value: 'Praça', values: ['praca', 'pra', 'pca'] },
    { name: 'Rodovia', value: 'Rodovia', values: ['rodovia', 'rod'] },
    { name: 'Travessa', value: 'Travessa', values: ['travessa', 'trav', 'trv'] },
    { name: 'Vila', value: 'Vila', values: ['vila', 'vl'] },
    { name: 'Estrada', value: 'Estrada', values: ['estrada', 'est'] },
    { name: 'Viela', value: 'Viela', values: ['viela'] },
    { name: 'Beco', value: 'Beco', values: ['beco'] },
    { name: 'Caminho', value: 'Caminho', values: ['caminho'] },
    { name: 'Largo', value: 'Largo', values: ['largo'] }
];
const toSearchable = (str) => {
    if (!str)
        return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};
watch(street, () => {
    if (street.value) {
        const first_word = toSearchable(street.value.split(' ')[0]);
        for (let item of listTypeAddress)
            if (item.values.includes(first_word)) {
                if (inputValue.value !== item.value) {
                    inputValue.value = item.value;
                    emit('update:modelValue', item.value);
                }
                break;
            }
    }
}, { immediate: true, deep: true });
watch(inputValue, (val) => {
    emit('update:modelValue', val);
});
watch(() => props.modelValue, (val) => {
    inputValue.value = val;
});
const __VLS_defaults = { modelValue: '' };
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
const __VLS_0 = MaxInputSelect;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(__VLS_ctx.attrs),
    options: (__VLS_ctx.listTypeAddress),
    optionLabel: (__VLS_ctx.attrs.optionLabel ?? 'name'),
    optionValue: (__VLS_ctx.attrs.optionValue ?? 'value'),
    modelValue: (__VLS_ctx.inputValue),
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    options: (__VLS_ctx.listTypeAddress),
    optionLabel: (__VLS_ctx.attrs.optionLabel ?? 'name'),
    optionValue: (__VLS_ctx.attrs.optionValue ?? 'value'),
    modelValue: (__VLS_ctx.inputValue),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
var __VLS_3;
// @ts-ignore
[attrs, attrs, attrs, listTypeAddress, inputValue,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
