/**
 * Propriedades para o componente MaxDividers.
 */
export interface MaxDividersProps {
    /** Direção do divisor: 'in-column' (colunas horizontais) ou 'in-line' (linhas verticais) */
    direction?: 'in-column' | 'in-line';
    /** Flag booleana de atalho para dividir em duas linhas empilhadas (<MaxDividers in-line>) */
    inLine?: boolean;
    /** Flag booleana de atalho para dividir em duas colunas lado a lado (<MaxDividers in-column>) */
    inColumn?: boolean;
    /** Painel atualmente ativo no mobile (1 para primeiro, 2 para segundo) - controle v-model padrão */
    modelValue?: 1 | 2;
    /** Painel atualmente ativo no mobile com controle v-model:active */
    active?: 1 | 2;
    /** Breakpoint em pixels ou alias ('sm', 'md', 'lg', 'xl') abaixo do qual ativa o modo mobile (padrão 1024) */
    breakpoint?: number | 'sm' | 'md' | 'lg' | 'xl';
    /** Força explicitamente o modo mobile (true) ou desktop (false), ignorando o resize de tela */
    mobile?: boolean;
    /** Proporções entre o primeiro e o segundo painel no desktop (ex: [35, 65] ou [4, 8]) */
    sizes?: [number, number] | string;
    /** Tamanho fixo do primeiro painel no desktop (ex: '380px' ou '30%') */
    firstSize?: string;
    /** Espaçamento entre os painéis no modo desktop (padrão '1rem') */
    gap?: string | number;
    /** Habilita barra divisora arrastável para redimensionamento manual no desktop */
    resizable?: boolean;
    /** Se true, exibe barra de cabeçalho com botão de voltar no topo do segundo painel no mobile */
    showBackButton?: boolean;
    /** Ícone do botão voltar no mobile (padrão 'mdi:arrow-left') */
    backButtonIcon?: string;
    /** Título exibido na barra superior do segundo painel no mobile */
    secondTitle?: string;
    /** Desativa animação de transição deslizante no mobile se true */
    disabledTransition?: boolean;
}
