/**
 * Shape recomendado de um item do MaxListBox.
 * Os nomes dos campos são configuráveis pelas props optionValue/optionLabel/
 * optionSubLabel/optionDisabled/optionIcon/optionBadge/optionBadgeColor,
 * então este tipo é um guia, não uma imposição.
 */
export type ListBoxOption = {
    /** Valor único do item (campo definido por optionValue) */
    value?: string | number | null;
    /** Rótulo principal (campo definido por optionLabel) */
    label?: string;
    /** Rótulo secundário (campo definido por optionSubLabel) */
    sub_label?: string;
    /** Ícone do Iconify (ex.: 'mdi:account') */
    icon?: string;
    /** Texto do badge exibido à direita */
    badge?: string | number;
    /** Cor do badge. O valor é repassado verbatim como `background` do
     * MaxBadgeComponent (que aplica direto como cor CSS) — portanto precisa ser
     * um valor CSS válido, ex.: 'var(--blue-600)'. Um token de tema puro como
     * 'blue-600' NÃO funciona. */
    badgeColor?: string;
    /** Item não selecionável (campo definido por optionDisabled) */
    disabled?: boolean;
    [key: string]: any;
};

/** Argumento recebido pela função loadOptions a cada página solicitada. */
export type LoadOptionsContext = {
    /** Página solicitada, iniciando em 1 */
    page: number;
    /** Termo de busca atual (string vazia quando não há filtro) */
    search: string;
    /** Quantidade de itens por página (prop pageSize) */
    pageSize: number;
};

/** Retorno esperado da função loadOptions. */
export type LoadOptionsResult = {
    /** Itens da página solicitada */
    items: any[];
    /** Indica se ainda existem páginas. Quando omitido, é derivado de `total`. */
    hasMore?: boolean;
    /** Total de registros disponíveis no servidor */
    total?: number;
};

/**
 * Papéis ARIA suportados no container MaxBaseVirtualScroller.
 */
export type VirtualScrollerRole = 'listbox' | 'list' | undefined;

/**
 * Papéis ARIA suportados nos itens do MaxBaseVirtualScroller.
 */
export type VirtualScrollerItemRole = 'option' | 'listitem' | undefined;

/**
 * Opções passadas ao slot de cada item no MaxBaseVirtualScroller.
 */
export interface VirtualScrollerSlotOptions {
    index: number;
    count: number;
    first: boolean;
    last: boolean;
    even: boolean;
    odd: boolean;
    selected: boolean;
    focused: boolean;
    disabled: boolean;
}

/**
 * Atributos ARIA passados ao slot de cada item para repasse ou inspeção.
 */
export interface VirtualScrollerItemAriaProps {
    role?: string;
    id?: string;
    'aria-setsize'?: number;
    'aria-posinset'?: number;
    'aria-selected'?: boolean;
    'aria-disabled'?: string;
}

/**
 * Payload emitido ao selecionar uma opção no MaxBaseVirtualScroller.
 */
export interface VirtualScrollerSelectPayload<T = any> {
    index: number;
    item: T;
    value: any;
}

/**
 * Props completas do contrato do MaxBaseVirtualScroller.
 */
export interface MaxBaseVirtualScrollerProps {
    /** Coleção completa a virtualizar */
    items?: any[];
    /** Altura estimada de cada item, em px */
    itemSize?: number;
    /** Estilo aplicado ao container com scroll (ex.: height) */
    style?: Record<string, string> | string;
    /** Itens extras renderizados fora da viewport */
    numToleratedItems?: number;
    /** Papel ARIA do container com scroll ('listbox', 'list' ou indefinido) */
    role?: VirtualScrollerRole;
    /** Papel ARIA atribuído a cada linha/item ('option', 'listitem' ou indefinido) */
    itemRole?: VirtualScrollerItemRole;
    /** Rótulo acessível via aria-label */
    ariaLabel?: string;
    /** ID do elemento que rotula este container via aria-labelledby */
    ariaLabelledby?: string;
    /** ID do item atualmente ativo para foco virtual (aria-activedescendant) */
    ariaActivedescendant?: string;
    /** Índice do item com foco ativo */
    focusedIndex?: number;
    /** Valor selecionado para controle via v-model */
    modelValue?: any;
    /** Habilita seleção de múltiplos itens */
    multiple?: boolean;
    /** Desabilita o componente */
    disabled?: boolean;
    /** Tabindex do elemento container */
    tabindex?: number | string;
    /** Prefixo para os IDs determinísticos dos itens montados */
    idPrefix?: string;
    /** Extrai o valor do item para comparação com modelValue */
    getItemValue?: (item: any, index: number) => any;
    /** Extrai o ID DOM determinístico de um item */
    getItemId?: (index: number, item: any) => string;
    /** Função para indicar se um item específico está desabilitado */
    isItemDisabled?: (item: any, index: number) => boolean;
    /** Função customizada para checar se um item está selecionado */
    isSelected?: (item: any, index: number) => boolean;
    /** Seleciona automaticamente o item ao navegar pelo teclado */
    selectOnFocus?: boolean;
}
