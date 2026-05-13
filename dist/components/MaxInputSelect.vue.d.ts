import { SelectGroupOptions } from '../types';
type __VLS_Props = {
    /** Valor selecionado */
    modelValue: any;
    /** Função assíncrona para carregar opções ao abrir o select */
    loadOptions?: () => Promise<any[]>;
    /** Ícone principal (ex: 'mdi:user') */
    icon?: string | undefined;
    /** Flag que informa o campo do valor */
    optionValue?: string;
    /** Flag que informa o campo do label */
    optionLabel?: string;
    /** Flag que informa o campo do name */
    optionName?: string;
    /** Ícone posicionado à esquerda */
    iconLeft?: string | undefined;
    /** Ícone posicionado à direita */
    iconRight?: string | undefined;
    /** Alias para o ícone principal */
    i?: string | undefined;
    /** Ícone escuro comparado ao fundo */
    iconDark?: boolean | undefined | number | string;
    /** Ícone claro comparado ao fundo */
    iconLight?: boolean | undefined | number | string;
    /** Estado de conclusão/validação */
    done?: boolean | undefined;
    /** Mensagem ou estado de erro */
    error?: string | null | false | undefined;
    /** Mensagem ou estado de atenção */
    caution?: string | null | false | undefined;
    /** Indica se o campo é obrigatório */
    required?: boolean | undefined;
    /** Ícone da mensagem de feedback */
    iconMessage?: string | undefined;
    /** Default Value */
    default?: string | number | boolean | null | undefined;
    /** Lista de opções simples [{ name, value, icon, sub_label }] */
    options?: any[];
    /** Lista de opções agrupadas [{ label, items: [] }] */
    groupOptions?: SelectGroupOptions;
};
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        option?(_: {
            option: any;
            selected: boolean;
            index: number;
        }): any;
        option?(_: {
            option: any;
            selected: boolean;
            index: number;
        }): any;
    };
    refs: {
        elem: ({
            $props: import('primevue/select').SelectProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
            $slots: import('primevue/select').SelectSlots;
            $emit: ((e: "filter", event: import('primevue/select').SelectFilterEvent) => void) & ((e: "show") => void) & ((e: "hide") => void) & ((e: "update:modelValue", value: any) => void) & ((e: "value-change", value: any) => void) & ((e: "blur", event: Event) => void) & ((e: "change", event: import('primevue/select').SelectChangeEvent) => void) & ((e: "focus", event: Event) => void) & ((e: "before-show") => void) & ((e: "before-hide") => void);
        } & import('primevue/select').SelectMethods) | null;
    };
    rootEl: any;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
    "before-show": (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
    "onBefore-show"?: ((...args: any[]) => any) | undefined;
}>, {
    default: string | number | boolean | null;
    done: boolean;
    modelValue: any;
    error: string | false | null;
    caution: string | false | null;
    required: boolean;
    optionValue: string;
    optionLabel: string;
    optionName: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    elem: ({
        $props: import('primevue/select').SelectProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/select').SelectSlots;
        $emit: ((e: "filter", event: import('primevue/select').SelectFilterEvent) => void) & ((e: "show") => void) & ((e: "hide") => void) & ((e: "update:modelValue", value: any) => void) & ((e: "value-change", value: any) => void) & ((e: "blur", event: Event) => void) & ((e: "change", event: import('primevue/select').SelectChangeEvent) => void) & ((e: "focus", event: Event) => void) & ((e: "before-show") => void) & ((e: "before-hide") => void);
    } & import('primevue/select').SelectMethods) | null;
}, any>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxInputSelect.vue.d.ts.map