/**
 * Propriedades base para todos os componentes da biblioteca.
 */
export interface BaseComponentProps {
    /** Classe CSS personalizada */
    class?: string;
    /** Estilo CSS em linha ou objeto */
    style?: string | Record<string, any>;
}

/**
 * Propriedades específicas para o componente de botão.
 */
export interface ButtonProps extends BaseComponentProps {
    /** Texto de exibição do botão */
    label?: string;
    /** Ícone a ser exibido no botão */
    icon?: string;
    /** Estilo de severidade do botão */
    severity?: 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';
    /** Tamanho do botão */
    size?: 'small' | 'large';
    /** Define se o botão está desabilitado */
    disabled?: boolean;
    /** Estado de carregamento do botão */
    loading?: boolean;
    /** Variante visual do botão */
    variant?: 'outlined' | 'text' | 'link';
}

/**
 * Eventos comuns emitidos pelos componentes.
 */
export interface ComponentEmits {
    /** Emitido quando o componente é clicado */
    click: [event: MouseEvent];
}

export interface SelectItem {
    value: string | number | null | boolean;
    name?: string | null;
    label?: string | null;
    subLabel?: string | null;
    icon?: string | null;
    disabled?: boolean;
    selected?: boolean;
    color?: string | null;
    size?: string | null;
    text_align?: 'left' | 'center' | 'right';
    ddi?: string | number | null;
    sigla?: string | null;
    min?: string | number | null;
    max?: string | number | null;
    fases?: string | number | null;
}

export interface SelectGroupOptionsElement {
    label: string;
    items: SelectItem[];
}[];

export interface SelectGroupOptions extends Array<SelectGroupOptionsElement> {}

export interface SelectOptions extends Array<SelectItem> {}

/**
 * Definição de uma coluna para o componente MaxTableFields.
 */
export interface MaxTableColumn {
    /** Texto do cabeçalho da coluna */
    header: string;
    /** Campo do objeto a ser exibido na célula */
    field: string;
    /** Nome do slot customizado para renderizar o conteúdo da célula */
    slot?: string;
    /** Largura da coluna (ex: '100px', '20%') */
    width?: string;
    /** Largura mínima da coluna */
    minWidth?: string;
    /** Largura máxima da coluna */
    maxWidth?: string;
    /** Largura máxima da coluna */
    size?: string;
    /** Alinhamento do conteúdo da célula */
    align?: 'left' | 'center' | 'right';
    /** Tipo de input a ser renderizado na célula */
    input?: 'text' | 'input' | 'checkbox' | 'select' | 'date' | 'number' | 'increment' | 'textarea' | 'phone-number' | 'auto-complete' | 'auto-complete-api';
    /** Lista de opções para o select */
    options?: any[];
    /** Rota para navegação ao clicar */
    route?: string;
    /** Dados extras: string com caminho (ex: 'brand.id') ou objeto com caminhos (ex: { brand_id: 'brand.id' }) — resolvidos da linha atual */
    data?: string | Record<string, any>;
    /** Texto do placeholder a ser exibido  */
    placeholder?: string;
    /** Título a ser exibido no cabeçalho  */
    title?: string;
    /** Estilo a ser exibido no cabeçalho  */
    style?: object;
    /** Classe a ser exibido no cabeçalho  */
    class?: string | object;
    /** Indica se o campo é obrigatório  */
    required?: boolean;
    /** Tooltip a ser exibido ao passar o mouse */
    tooltip?: boolean;
    /** Função a ser executada quando o valor do campo mudar */
    action?: (data: { row: any; field: string; value: any }) => void;
}

export interface MaxTableButtons {
    /** Identificador único do botão (usado como key no v-for) */
    id?: string | number;
    /** Tamanho do ícone do botão */
    size?: number | string;
    icon?: string;
    i?: string;
    iconLeft?: string;
    iconRight?: string;
    sizeIcon?: number | string;
    iconSize?: number | string;
    route?: string | null;
    params?: any;
    data?: any;
    query?: any;
    dark?: boolean | string | number | undefined;
    light?: boolean | string | number | undefined;
    label?: string | undefined;
    tooltip?: string | null;
    /** Função a ser executada ao clicar no botão */
    action?: (data?: any) => void;
}