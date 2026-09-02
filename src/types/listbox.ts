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
