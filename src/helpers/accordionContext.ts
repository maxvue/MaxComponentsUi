import { inject, type InjectionKey, type Ref } from 'vue';

/** Contexto compartilhado entre MaxAccordion e seus MaxAccordionItem. */
export interface AccordionContext {
    /** Values dos itens abertos (sempre array, mesmo no modo single). */
    open_values: Readonly<Ref<string[]>>;
    /** Alterna um item; respeita multiple. */
    toggle: (value: string) => void;
    /** Renderiza o conteudo do item apenas quando ele abre pela primeira vez. */
    lazy: Readonly<Ref<boolean>>;
    /** Icone exibido quando o item esta fechado. */
    expand_icon: Readonly<Ref<string | undefined>>;
    /** Icone exibido quando o item esta aberto. */
    collapse_icon: Readonly<Ref<string | undefined>>;
    /** Prefixo de id para ligar aria-controls/aria-labelledby entre header e conteudo. */
    id_prefix: string;
    /**
     * Gera o value automatico de um item que nao informou `value`, seguindo a
     * ordem de montagem — como o MaxTabItem faz com add_count_tabs.
     */
    nextAutoValue: () => string;
}

export const ACCORDION_INJECTION_KEY: InjectionKey<AccordionContext> = Symbol('max-accordion');

/**
 * Recupera o contexto de Accordion, falhando com mensagem clara quando o
 * componente for usado fora de um <MaxAccordion>.
 */
export const injectAccordionContext = (component: string): AccordionContext => {
    const context = inject(ACCORDION_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxAccordion>.`);
    return context;
};
