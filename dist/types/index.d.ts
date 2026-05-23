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
}
export interface SelectGroupOptions extends Array<SelectGroupOptionsElement> {
}
export interface SelectOptions extends Array<SelectItem> {
}
/**
 * Definição de uma coluna para o componente MaxNewTable.
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
    /** Alinhamento do conteúdo da célula */
    align?: 'left' | 'center' | 'right';
    type?: 'default' | 'input' | 'checkbox' | 'select' | 'date' | 'number' | 'textarea';
    name?: string;
    title?: string;
    style?: string | object;
    class?: string | object;
    required?: boolean;
    onChange?: (event: any) => void;
}
//# sourceMappingURL=index.d.ts.map