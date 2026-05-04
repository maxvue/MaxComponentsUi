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
//# sourceMappingURL=index.d.ts.map