import type { MaxSeverity } from './feedback';
export interface MaxProgressBarProps {
    /** Valor numérico atual do progresso ou medidor (null para indeterminado/indisponível) */
    value: number | null;
    /** Valor máximo da escala */
    max?: number;
    /** Modo semântico: progresso de tarefa ou medição de capacidade */
    mode?: 'progress' | 'meter';
    /** Severidade visual e semântica */
    severity?: MaxSeverity;
    /** Rótulo acessível WAI-ARIA obrigatório */
    ariaLabel: string;
    /** Texto descritivo customizado anunciado para tecnologias assistivas */
    valueText?: string;
}
//# sourceMappingURL=progress.d.ts.map