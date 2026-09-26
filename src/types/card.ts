/**
 * Variantes visuais disponíveis para o MaxCard.
 */
export type MaxCardVariant = 'default' | 'add';

/**
 * Propriedades do componente MaxCard.
 */
export interface MaxCardProps {
    /** Variante visual do card ('default' ou 'add') */
    variant?: MaxCardVariant;
    /** Título principal exibido no cabeçalho */
    title?: string;
    /** Subtítulo descritivo exibido abaixo do título */
    subtitle?: string;
    /** Indica se o card está em estado de carregamento com overlay bloqueante */
    loading?: boolean;
    /** Desabilita o card e impede interações de clique e foco */
    disabled?: boolean;
    /** Torna o card interativo e focável via teclado com estilo hover */
    clickable?: boolean;
    /** Ícone exibido no cabeçalho ou centralizado na variante add */
    icon?: string;
}

/**
 * Propriedades do componente MaxSubCard.
 */
export interface MaxSubCardProps {
    /** Título do item aninhado */
    title?: string;
    /** Subtítulo ou detalhes adicionais do item */
    subtitle?: string;
    /** Rótulo ou identificador de status semântico */
    status?: string;
    /** Ícone exibido no cabeçalho compacto */
    icon?: string;
    /** Torna o subcard interativo e focável */
    clickable?: boolean;
    /** Desabilita o subcard */
    disabled?: boolean;
}

/**
 * Representa o estado do payload de filtros do MaxCardList.
 */
export interface MaxCardListFilterPayload {
    search: string;
    category: any;
}

/**
 * Opção de categoria para os filtros do MaxCardList.
 */
export interface MaxCardListCategoryOption {
    label: string;
    value: any;
    icon?: string;
}

/**
 * Propriedades do orquestrador MaxCardList.
 */
export interface MaxCardListProps {
    /** Lista de dados a ser renderizada */
    items?: any[];
    /** Chave identificadora única do item (propriedade do objeto ou função extratora) */
    itemKey?: string | ((item: any, index: number) => string | number);
    /** Largura mínima de cada card em pixels para o auto-cálculo do grid responsivo */
    minCardWidth?: number;
    /** Número fixo de colunas (quando fornecido, sobrescreve o cálculo dinâmico) */
    columns?: number;
    /** Espaçamento em pixels entre os cards */
    gap?: number;
    /** Altura estimada de cada linha para medição inicial do virtualizador (px) */
    estimateSize?: number;
    /** Altura do container com scroll (ex.: '600px', '100%') */
    height?: string | number;
    /** Altura máxima do container com scroll */
    maxHeight?: string | number;
    /** Quantidade de linhas extras renderizadas fora da viewport (overscan) */
    overscan?: number;
    /** Habilita ou desabilita o virtual scroll (padrão true) */
    virtualScroll?: boolean;
    /** Indica se a lista está em estado de carregamento */
    loading?: boolean;
    /** Texto exibido no loader pré-estilizado */
    loadingLabel?: string;
    /** Texto exibido no estado vazio pré-estilizado */
    emptyLabel?: string;
    /** Habilita a barra de filtros (busca e categoria) */
    filterable?: boolean;
    /** Valor da busca para v-model:searchQuery ou v-model:search */
    searchQuery?: string;
    /** Placeholder do campo de pesquisa */
    searchPlaceholder?: string;
    /** Categoria selecionada para v-model:category */
    category?: any;
    /** Lista de categorias disponíveis para filtragem */
    categories?: (MaxCardListCategoryOption | string)[];
    /** Placeholder da opção neutra de categoria */
    categoryPlaceholder?: string;
    /** Posição de renderização do slot #add-card ('top' | 'header' | 'inline') */
    addCardPosition?: 'top' | 'header' | 'inline';
    /** Título opcional da lista */
    title?: string;
    /** Subtítulo opcional da lista */
    subtitle?: string;
    /** Estatísticas para integração com MaxStats via slot #header */
    stats?: any[];
    /** Função customizada de filtragem */
    filterFn?: (item: any, search: string, category: any) => boolean;
    /** Desativa a filtragem interna quando o consumidor gerencia filtros externamente */
    customFilter?: boolean;
    /** Colunas padrão caso a medição do container ainda não esteja disponível */
    defaultColumns?: number;
}

