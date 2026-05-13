import { SelectGroupOptions } from '../types';
/**
 * Propriedades base para componentes de entrada (inputs).
 * Este componente serve como wrapper para padronizar o layout, ícones e mensagens.
 */
interface Props {
    /** Valor do input (suporta v-model) */
    value?: any;
    /** Valor do input para v-model no Vue 3 */
    modelValue?: any;
    /** Lista de opções simples [{ name, value, icon, sub_label }] */
    class?: string;
    /** Ícone principal (ex: 'mdi:user') */
    icon?: string | undefined;
    /** Alias para o ícone principal */
    i?: string | undefined;
    /** Estado desabilitado do componente */
    disabled?: boolean | undefined;
    /** Ativa o estilo de label flutuante (FloatLabel) */
    float?: boolean | undefined;
    /** Mensagem de feedback ou instrução (alias para message) */
    msg?: string | undefined;
    /** Mensagem de feedback, erro ou aviso exibida abaixo do input */
    message?: string | undefined;
    /** Ícone exibido ao lado da mensagem de feedback */
    iconMessage?: string | undefined;
    /** Rótulo (label) exibido acima ou dentro do campo */
    label?: string | undefined;
    /** Define se o campo foi preenchido corretamente (exibe ícone de check) */
    done?: boolean | undefined;
    /** Mensagem de erro ou estado de erro (exibe em destaque) */
    error?: string | boolean | null | undefined;
    /** Mensagem de atenção ou estado de alerta (exibe em laranja) */
    caution?: string | boolean | null | undefined;
    /** Indica se o preenchimento deste campo é obrigatório (exibe asterisco) */
    required?: boolean | undefined;
    /** Alinha o texto do input ao centro */
    textCenter?: boolean | undefined;
    /** Icone escuro referente ao fundo */
    dark?: boolean | string | number | undefined;
    /** Icone claro referente ao fundo */
    light?: boolean | string | number | undefined;
    /** Default Value */
    default?: string | number | boolean | null | undefined;
    /** Lista de opções simples [{ name, value, icon, sub_label }] */
    options?: any[];
    /** Lista de opções agrupadas [{ label, items: [] }] */
    groupOptions?: SelectGroupOptions;
    /** Ícone posicionado à esquerda */
    iconLeft?: string | undefined;
    /** Ícone posicionado à direita */
    iconRight?: string | undefined;
    /** Valor selecionado */
    loadOptions?: () => Promise<any[]>;
    /** Flag que informa o campo do valor */
    optionValue?: string;
    /** Flag que informa o campo do label */
    optionLabel?: string;
    /** Flag que informa o campo do name */
    optionName?: string;
    /** Ícone escuro comparado ao fundo */
    iconDark?: boolean | undefined | number | string;
    /** Ícone claro comparado ao fundo */
    iconLight?: boolean | undefined | number | string;
}
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        default?(_: {}): any;
    };
    refs: {};
    rootEl: any;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<Props> & Readonly<{}>, {
    value: any;
    dark: string | number | boolean;
    light: string | number | boolean;
    textCenter: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=InputBase.vue.d.ts.map