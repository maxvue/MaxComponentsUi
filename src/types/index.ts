import type { ButtonProps as PrimeButtonProps } from 'primevue/button';
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
export interface MaxButtonsType extends /* @vue-ignore */ Omit<PrimeButtonProps, 'size' | 'iconPos'> {
    /** Texto de exibição do botão */
    label?: string;
    /** Ícone a ser exibido no botão */
    icon?: string;
    /** Classe do icone  */
    class?: any;
    /** Ícone a ser exibido à esquerda do botão */
    iconRight?: string;
    /** Posição do ícone no botão */
    iconPos?: 'left' | 'right';
    /** Estilo de severidade do botão */
    severity?: 'secondary' | 'success' | 'info' | 'whatsapp' | 'warning' | 'help' | 'danger' | 'contrast';
    /** Tamanho do botão */
    size?: string | undefined | number | null;
    /** Tamanho do ícone do botão */
    sizeIcon?: string | undefined | number | null;
    /** Estado de carregamento do botão */
    loading?: boolean;
    /** Escala de Ampliação ao passar o mouse */
    hoverScale?: number | null | undefined;
    /** Variante visual do botão */
    variant?: 'outlined' | 'text' | 'link';
    /** Alias para o nome do ícone */
    i?: string;
    /** link para abrir em nova aba */
    blank?: string;
    /** Rotação do ícone em graus */
    route?: string | null;
    /** Query data */
    data?: any;
    /** Params data */
    params?: any;
    /** Query data */
    query?: any;
    /** Rotação do ícone em graus */
    rotate?: number;
    /** Inversão do ícone */
    flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
    /** Alias para o tamanho */
    scale?: string | number;
    /** Largura específica */
    width?: string | number;
    /** Altura específica */
    height?: string | number;
    /** Icone escuro referente ao fundo */
    dark?: boolean | string | number | undefined;
    /** Icone claro referente ao fundo */
    light?: boolean | string | number | undefined;
    /** Icone de checagem */
    checked?: boolean | string | number | undefined;
    /** Icone de adição */
    plus?: boolean | string | number | undefined;
    /** Hover color */
    hoverColor?: string | undefined;
    /** Action */
    action?: (data: { event: any; data?: any }) => void;
    /** Tamanho do icone */
    iconSize?: number | string | undefined | null;
    /** Coloca texto em maiúsculo */
    uppercase?: boolean;
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
};

export type DBFile = {
    id: string;
    name?: string | null;
    file_name: string | null;
    label_file_name: string | null;
    extension: string | null;
    thumbnail: string | null;
    document_type: string | null;
    disk: string | null;
    blob?: any;
    objectURL?: string | null;
    src?: string | null;
    file_bloob?: string | null;
    message_type?: string | null;
    data_ai: object | null;
    pdf_count_pages: number | null;
    error_pdf: boolean | null;
    to_request_ai: boolean | null;
    image_inspection: boolean;
    is_send_to_project: boolean | null;
    type: string;
    in_server: boolean | null;
};

export type MenuItem = {
    label?: string;
    items?: MenuItem[];
    command?: string;
    icon?: string;
    active?: boolean;
    url?: string;

};