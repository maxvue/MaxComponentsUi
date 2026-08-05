import { inject, type InjectionKey, type Ref } from 'vue';

/**
 * Contexto compartilhado entre MaxTabs e seus componentes filhos
 * (MaxTabList, MaxTab, MaxTabPanels, MaxTabPanel).
 */
export interface TabsContext {
    /** Valor do tab atualmente ativo. */
    active_value: Readonly<Ref<string | undefined>>;
    /**
     * Value do primeiro tab habilitado, na ordem de registro. Usado por
     * MaxTab como fallback de tabindex 0 apenas quando nao ha nenhum value
     * ativo definido (active_value undefined), garantindo que o tablist
     * nunca fique inteiramente inalcancavel por teclado (WAI-ARIA exige
     * exatamente um tab com tabindex 0).
     */
    fallback_tab_value: Readonly<Ref<string | undefined>>;
    /** Seleciona um tab pelo seu value. */
    select: (value: string) => void;
    /** Renderiza o conteúdo do painel só quando ativa pela primeira vez. */
    lazy: Readonly<Ref<boolean>>;
    /** Ativa o tab ao receber foco, sem exigir clique. */
    select_on_focus: Readonly<Ref<boolean>>;
    /** tabindex aplicado aos headers. */
    tabindex: Readonly<Ref<number>>;
    /** Prefixo de id para ligar aria-controls/aria-labelledby entre tab e painel. */
    id_prefix: string;
    /** Registra um header para a navegação por setas; retorna função de desregistro. */
    registerTab: (value: string, el: HTMLElement, disabled: () => boolean) => () => void;
    /** Move o foco/seleção a partir de uma tecla de navegação. */
    navigate: (from: string, key: 'next' | 'prev' | 'first' | 'last') => void;
    /** Habilita rolagem horizontal dos headers quando houver overflow. */
    scrollable: Readonly<Ref<boolean>>;
    /** Exibe os botoes de navegacao no modo scrollable. */
    show_navigators: Readonly<Ref<boolean>>;
}

export const TABS_INJECTION_KEY: InjectionKey<TabsContext> = Symbol('max-tabs');

/**
 * Recupera o contexto de Tabs, falhando com mensagem clara quando o
 * componente for usado fora de um <MaxTabs>.
 */
export const injectTabsContext = (component: string): TabsContext => {
    const context = inject(TABS_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxTabs>.`);
    return context;
};
