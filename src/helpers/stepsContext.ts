import { inject, type InjectionKey, type Ref, type ComputedRef } from 'vue';

export type StepStatus =
    | 'done'
    | 'completed'
    | 'concluido'
    | 'error'
    | 'erro'
    | 'pending'
    | 'pendencia'
    | 'caution'
    | 'alerta';

/**
 * Metadados de um item de step registrado no componente container MaxSteps.
 */
export interface StepItemData {
    /** Identificador único do step (string ou number). */
    id: string | number;
    /** Índice sequencial de montagem do step (0-indexed). */
    index: number;
    /** Título textual do step. */
    title?: string;
    /** Título ou label alternativo do step exibido em visualizações mobile. */
    labelMobile?: string;
    /** Ícone opcional do step. */
    icon?: string;
    /** Indica se o step está desabilitado. */
    disabled?: boolean;
    /** Status do step: concluído, erro ou pendência. */
    status?: StepStatus;
    /** Indica se o step está concluído com sucesso (ícone de Check verde). */
    done?: boolean;
    /** Indica se o step possui erro (ícone de Erro vermelho). */
    error?: boolean;
    /** Indica se o step possui alerta/aviso (ícone de Alerta laranja). */
    caution?: boolean;
    /** Indica se o step possui pendência (alias para caution). */
    pending?: boolean;
    /** Label customizado do botão Avançar deste step específico. */
    nextLabel?: string;
    /** Label customizado do botão Voltar deste step específico. */
    previousLabel?: string;
    /** Callback disparado ao avançar a partir deste step. Retornar false ou Promise<false> bloqueia o avanço. */
    onNext?: () => boolean | void | Promise<boolean | void>;
    /** Callback disparado ao voltar a partir deste step. Retornar false ou Promise<false> bloqueia a volta. */
    onPrevious?: () => boolean | void | Promise<boolean | void>;
    /** Callback disparado ao entrar neste step. */
    onEnter?: () => void;
    /** Callback disparado ao sair deste step. */
    onLeave?: () => void;
}

/**
 * Contexto compartilhado entre MaxSteps e MaxStepItem.
 */
export interface StepsContext {
    /** Identificador ou valor do step ativo no momento. */
    active_step: Ref<string | number | undefined>;
    /** Lista reativa de todos os steps registrados, na ordem de montagem. */
    steps: Ref<StepItemData[]>;
    /** Registra um novo step; retorna função para desregistrar. */
    registerStep: (step: StepItemData) => () => void;
    /** Atualiza as propriedades e callbacks de um step registrado. */
    updateStep: (step: StepItemData) => void;
    /** Executa o avanço para o próximo step respeitando regras de validação. */
    next: () => Promise<boolean>;
    /** Executa o retorno para o step anterior respeitando regras de validação. */
    previous: () => Promise<boolean>;
    /** Navega diretamente para um step alvo pelo seu identificador ou índice. */
    goTo: (id: string | number) => Promise<boolean>;
    /** Executa a ação de conclusão/finalização no último step. */
    finish: () => Promise<void>;
    /** Indica se o step ativo é o primeiro. */
    isFirstStep: ComputedRef<boolean>;
    /** Indica se o step ativo é o último. */
    isLastStep: ComputedRef<boolean>;
    /** Permite clique manual nos cabeçalhos superiores. */
    allowManual: Ref<boolean>;
    /** Bloqueia o avanço a menos que o step atual esteja concluído com done: true. */
    nextOnlyDone: Ref<boolean>;
    /** Exibe o botão de Avançar no rodapé do conteúdo. */
    showNext: Ref<boolean>;
    /** Exibe o botão de Voltar no rodapé do conteúdo. */
    showBack: Ref<boolean>;
    /** Exibe o botão de Concluir no último step. */
    showFinish: Ref<boolean>;
    /** Label resolvido para o botão Avançar do step atual. */
    currentNextLabel: ComputedRef<string>;
    /** Label resolvido para o botão Voltar do step atual. */
    currentPreviousLabel: ComputedRef<string>;
    /** Label resolvido para o botão Concluir. */
    finishLabel: Ref<string>;
    /** Indica se o botão Avançar pode ser acionado considerando nextOnlyDone e done do step atual. */
    canGoNext: ComputedRef<boolean>;
    /** ID único do componente pai para teleports e links de acessibilidade. */
    steps_id: ComputedRef<string | number>;
    /** Suporte a carregamento preguiçoso de conteúdo. */
    lazy: Ref<boolean>;
}

export const STEPS_INJECTION_KEY: InjectionKey<StepsContext> = Symbol('max-steps');

/**
 * Injeta o contexto de Steps, lançando erro descritivo caso usado fora de um <MaxSteps>.
 */
export const injectStepsContext = (component: string): StepsContext => {
    const context = inject(STEPS_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxSteps>.`);

    return context;
};
