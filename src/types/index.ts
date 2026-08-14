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
 * Props visuais e de comportamento que o `MaxButtonsType` herdava do `ButtonProps`
 * do PrimeVue. Reproduzidas aqui para manter a superfície pública do tipo após a
 * remoção da dependência.
 *
 * Deliberadamente NÃO reproduzidas: `dt`, `pt`, `ptOptions` e `unstyled` — APIs de
 * passthrough/theming do PrimeVue, sem significado após a migração.
 */
export interface MaxButtonBaseProps {
    /** Identificador único do elemento */
    id?: string;
    /** Desabilita o botão */
    disabled?: boolean;
    /** Estilo apenas com borda */
    outlined?: boolean;
    /** Estilo sem fundo nem borda */
    text?: boolean;
    /** Cantos arredondados */
    rounded?: boolean;
    /** Sombra elevada */
    raised?: boolean;
    /** Aparência de link */
    link?: boolean;
    /** Remove a cor de severidade, mantendo apenas o texto */
    plain?: boolean;
    /** Ocupa toda a largura disponível */
    fluid?: boolean;
    /** Conteúdo do badge */
    badge?: string;
    /** Classe CSS do badge */
    badgeClass?: string;
    /** Severidade visual do badge */
    badgeSeverity?: string;
    /** Ícone exibido durante o carregamento */
    loadingIcon?: string;
    /** Classe CSS aplicada ao ícone */
    iconClass?: string;
    /** Elemento ou componente renderizado como raiz */
    as?: string | Record<string, any>;
    /** Delega a renderização da raiz ao slot padrão */
    asChild?: boolean;
    /** Estilo CSS em linha ou objeto */
    style?: string | Record<string, any>;
    /** Classe CSS personalizada */
    class?: string;
}

/**
 * Propriedades específicas para o componente de botão.
 */
export interface MaxButtonsType extends /* @vue-ignore */ MaxButtonBaseProps {
    /** Texto de exibição do botão */
    label?: string;
    /** Ícone a ser exibido no botão */
    icon?: string;
    /** Classe do icone  */
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
    /** Rota para navegação ao clicar */
    route?: string | null;
    /** Query data */
    data?: any;
    transparent?: boolean;
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
    /** Borda tracejada com fundo transparente */
    dashed?: boolean;
}

/**
 * Propriedades compartilhadas pelos componentes de confirmação
 * (`MaxButtonConfirm`, `MaxIconConfirm`, `MaxTogglePopover`).
 * As props de identidade visual (label, ícone, etc.) variam entre os 3
 * componentes conforme o elemento que cada um dispara (botão de texto,
 * botão de ícone, popover) — aqui ficam apenas as props de conteúdo/
 * comportamento da confirmação em si.
 */
export interface ConfirmProps {
    /** Mensagem de confirmação */
    message?: string;
    /** Icone de mensagem de confirmação */
    messageIcon?: string | null;
    /** Label do botão de não */
    rejectProps?: {
        label: string;
        icon?: string;
        action?: ((event?: any) => void) | undefined;
    };
    /** Label do botão de sim */
    acceptProps?: {
        label: string;
        icon?: string;
        action?: ((event?: any) => void) | undefined;
    };
}

/**
 * Subconjunto de props que a maioria dos componentes de input duplica ao
 * redeclarar, na própria interface, as mesmas props que o `InputBase`
 * (`src/components/InputBase.vue`) já define e repassa via `v-bind="props"`.
 * Ex.: `MaxInputCpfCnpj`, `MaxInputCep`, `MaxInputCoordinateDecimalLat/Lng`,
 * `MaxInputPhoneMail`.
 */
export interface InputBaseProps {
    /** Ícone opcional (ex: 'mdi:email') */
    icon?: string | undefined;
    /** Alias para o ícone */
    i?: string | undefined;
    /** Desabilita o campo */
    disabled?: boolean | undefined;
    /** Ativa estilo FloatLabel */
    float?: boolean | undefined;
    /** Mensagem de feedback (alias) */
    msg?: string | undefined;
    /** Mensagem de feedback */
    message?: string | undefined;
    /** Ícone da mensagem de feedback */
    iconMessage?: string | undefined;
    /** Rótulo do campo */
    label?: string | undefined;
    /** Estado de conclusão/validação manual */
    done?: boolean | undefined;
    /** Mensagem ou estado de erro */
    error?: string | boolean | undefined;
    /** Valor para comparação (opcional) */
    targetValue?: string;
    /** Mensagem ou estado de atenção */
    caution?: string | boolean | undefined;
    /** Define se o campo é obrigatório */
    required?: boolean;
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

// Tipos do MaxChart (formato chart.js).
export type * from './chart';

// Tipos do app shell (MaxApp): loading, usuário e configuração.
export type * from './app';

// Tipos do MaxListBox.
export type * from './listbox';
