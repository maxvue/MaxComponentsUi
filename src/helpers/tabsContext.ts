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
     * MaxTab como fallback de tabindex 0 quando nao ha nenhum value ativo
     * definido, ou quando o value ativo e orfao (nao corresponde a nenhum
     * tab registrado — ex.: removido dinamicamente da lista), garantindo que
     * o tablist nunca fique inteiramente inalcancavel por teclado (WAI-ARIA
     * exige exatamente um tab com tabindex 0).
     */
    fallback_tab_value: Readonly<Ref<string | undefined>>;
    /**
     * Value efetivamente selecionado para fins de exibicao (aria-selected do
     * MaxTab e visibilidade do MaxTabPanel): igual a active_value quando ha
     * um value ativo valido; cai para fallback_tab_value quando nao ha
     * v-model definido (modo nao controlado) ou o value ativo e orfao,
     * replicando o comportamento do sistema legado MaxTabItem de sempre
     * deixar algum tab selecionado.
     */
    effective_active_value: Readonly<Ref<string | undefined>>;
    /**
     * True quando o active_value atual corresponde a um tab registrado.
     * False tanto quando active_value e undefined quanto quando e um value
     * orfao (nao corresponde a nenhum tab). Antes do registro ter ao menos
     * um tab (janela entre a primeira renderizacao do MaxTabs e o onMounted
     * dos MaxTab filhos), fica true de forma conservadora para nao tratar a
     * ausencia temporaria de registro como "value orfao".
     */
    has_registered_active_tab: Readonly<Ref<boolean>>;
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
