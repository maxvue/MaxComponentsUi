export type MaxSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface MaxAlertProps {
    /** Severidade visual e semântica do alerta */
    severity?: MaxSeverity;
    /** Título opcional exibido em destaque */
    title?: string;
    /** Mensagem principal do alerta */
    message?: string | null;
    /** Identificador único do elemento */
    id?: string;
    /** Comportamento da live region WAI-ARIA */
    live?: 'polite' | 'assertive' | 'off';
    /** Indica se o botão de fechar é exibido */
    closable?: boolean;
}

export type MaxQueryStateStatus = 'loading' | 'stale' | 'ready-empty' | 'ready-with-data' | 'error';

export interface MaxQueryStateProps {
    /** Estado atual da consulta */
    state: MaxQueryStateStatus;
    /** Título opcional para estados de erro ou vazio */
    title?: string;
    /** Mensagem explicativa opcional */
    message?: string | null;
    /** Permite ação de tentar novamente em caso de erro ou dados obsoletos */
    retryable?: boolean;
    /** Indica que a operação de recarga está em andamento */
    retrying?: boolean;
}
