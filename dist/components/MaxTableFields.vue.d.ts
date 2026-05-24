import { MaxTableColumn, MaxTableButtons } from '../types';
import { ComputedRef } from 'vue';
type __VLS_Props = {
    /** Lista de valores para preencher a tabela */
    list: any[] | Record<string, any>;
    /** Definição das colunas */
    columns: MaxTableColumn[];
    /** Texto do cabeçalho de ações */
    headerButton?: string;
    /** Identificador único da tabela */
    id?: string;
    /** Mensagem exibida quando a lista está vazia */
    emptyMessage?: string;
    /** Largura da coluna de botões (ex: '120px') */
    buttonsWidth?: string;
    /** Lista de botões */
    buttons?: MaxTableButtons[];
};
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: Partial<Record<`header-${string}`, (_: {
        column: MaxTableColumn;
    }) => any>> & Partial<Record<string, (_: {
        data: any;
        value: any;
        index: number;
        field: string;
    }) => any>> & {
        'buttons-header'?(_: {}): any;
        buttons?(_: {
            data: any;
            index: number;
        }): any;
        empty?(_: {}): any;
    };
    refs: {};
    rootEl: HTMLDivElement;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<__VLS_Props, {
    tableId: ComputedRef<string>;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:field": (payload: {
        row: any;
        field: string;
        value: any;
        index?: number;
    }) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:field"?: ((payload: {
        row: any;
        field: string;
        value: any;
        index?: number;
    }) => any) | undefined;
}>, {
    columns: MaxTableColumn[];
    list: any[] | Record<string, any>;
    emptyMessage: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxTableFields.vue.d.ts.map