type __VLS_Props = {
    /** Valor selecionado */
    modelValue: any;
    /** Lista de opções simples [{ name, value, icon, sub_label }] */
    options?: any[];
    /** Lista de opções agrupadas [{ label, items: [] }] */
    groupOptions?: any[];
    /** Função assíncrona para carregar opções ao abrir o select */
    loadOptions?: () => Promise<any[]>;
};
declare var __VLS_19: {
    option: any;
    selected: boolean;
    index: number;
}, __VLS_36: {
    option: any;
    selected: boolean;
    index: number;
};
type __VLS_Slots = {} & {
    option?: (props: typeof __VLS_19) => any;
} & {
    option?: (props: typeof __VLS_36) => any;
};
declare const __VLS_base: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
    "before-show": (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
    "onBefore-show"?: ((...args: any[]) => any) | undefined;
}>, {
    modelValue: any;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxInputSelect.vue.d.ts.map