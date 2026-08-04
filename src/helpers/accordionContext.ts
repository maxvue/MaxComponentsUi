import { inject, type InjectionKey, type Ref } from 'vue';

/** Contexto compartilhado entre MaxAccordion e seus filhos. */
export interface AccordionContext {
    /** Values dos paineis abertos (sempre array, mesmo no modo single). */
    open_values: Readonly<Ref<string[]>>;
    /** Alterna um painel; respeita multiple. */
    toggle: (value: string) => void;
    /** Renderiza o conteudo do painel apenas quando ele abre. */
    lazy: Readonly<Ref<boolean>>;
    /** Abre o painel ao receber foco, sem exigir clique. */
    select_on_focus: Readonly<Ref<boolean>>;
    /** tabindex aplicado aos headers. */
    tabindex: Readonly<Ref<number>>;
    /** Icone exibido quando o painel esta fechado. */
    expand_icon: Readonly<Ref<string | undefined>>;
    /** Icone exibido quando o painel esta aberto. */
    collapse_icon: Readonly<Ref<string | undefined>>;
    /** Prefixo de id para ligar aria-controls/aria-labelledby entre header e conteudo. */
    id_prefix: string;
    /** Registra um header para a navegacao por setas; retorna funcao de desregistro. */
    registerHeader: (value: string, el: HTMLElement, disabled: () => boolean) => () => void;
    /** Move o foco/selecao a partir de uma tecla de navegacao. */
    navigate: (from: string, key: 'next' | 'prev' | 'first' | 'last') => void;
}

/** Contexto que o MaxAccordionPanel fornece ao seu header e conteudo. */
export interface AccordionPanelContext {
    /** Value do painel que envolve o header/conteudo. */
    value: string;
    /** Painel desabilitado. */
    disabled: Readonly<Ref<boolean>>;
}

export const ACCORDION_INJECTION_KEY: InjectionKey<AccordionContext> = Symbol('max-accordion');

export const PANEL_INJECTION_KEY: InjectionKey<AccordionPanelContext> = Symbol('max-accordion-panel');

/**
 * Recupera o contexto de Accordion, falhando com mensagem clara quando o
 * componente for usado fora de um <MaxAccordion>.
 */
export const injectAccordionContext = (component: string): AccordionContext => {
    const context = inject(ACCORDION_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxAccordion>.`);
    return context;
};

/**
 * Recupera o contexto do painel, falhando com mensagem clara quando o
 * componente for usado fora de um <MaxAccordionPanel>.
 */
export const injectPanelContext = (component: string): AccordionPanelContext => {
    const context = inject(PANEL_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxAccordionPanel>.`);
    return context;
};
