import type { ComputedRef, Ref } from 'vue';
import { computed } from 'vue';

export interface UseInputValidationOptions {
    /** Se o campo e obrigatorio (usado para a mensagem de erro de campo vazio). */
    required?: Ref<boolean | undefined> | boolean;
    /** Valor para comparacao opcional, exposto para uso futuro por quem consome o composable. */
    targetValue?: Ref<string | undefined>;
    /**
     * Override explicito de caution vindo do pai. Quando definido, e retornado
     * DIRETO, sem AND com nenhum estado interno de validacao — ver correcao
     * do achado 22 abaixo.
     */
    caution?: Ref<string | boolean | undefined>;
    /** Override explicito de done vindo do pai. Quando definido, e retornado direto. */
    done?: Ref<boolean | undefined>;
    /** Funcao de validacao especifica do componente (ex.: cpfCnpjIsValid, cepIsValid). */
    validator: (value: any) => boolean;
    /** Ref do valor atual sendo validado. */
    value: Ref<any>;
    /** Mensagem de erro a usar quando o valor e invalido. Default: 'Valor inválido'. */
    invalidMessage?: string;
    /** Mensagem de erro a usar quando o campo e obrigatorio e esta vazio. Default: 'Campo obrigatório'. */
    requiredMessage?: string;
}

export interface UseInputValidationResult {
    done: ComputedRef<boolean | null>;
    error: ComputedRef<string | boolean | null>;
    caution: ComputedRef<boolean>;
    onBlur: () => void;
}

/**
 * Encapsula a logica done/error/caution comum aos inputs desta lib, hoje
 * reimplementada (com pequenas divergencias) em varios componentes.
 *
 * Corrige o bug do achado 22: a implementacao antiga fazia
 * `caution = props.caution !== undefined ? props.caution && isDone.value === false : ...`,
 * o que suprimia uma caution explicita do pai ate haver blur invalido
 * (por causa do AND com `isDone.value === false`), invertendo a intencao do
 * override. Aqui, quando `options.caution` esta definido, ele e devolvido
 * diretamente, sem nenhum AND com estado interno.
 *
 * `onBlur` e exposto para quem quiser acionar a validacao apenas apos o
 * usuario sair do campo; a integracao fina com o ciclo de vida do
 * componente (quando chamar `onBlur`, se o componente usa esse gate ou nao)
 * continua sendo responsabilidade de quem consome o composable.
 */
export function useInputValidation(options: UseInputValidationOptions): UseInputValidationResult {
    const isRequired = () => (typeof options.required === 'boolean' ? options.required : options.required?.value) ?? false;

    const isValid = computed(() => options.validator(options.value.value));

    const done = computed<boolean | null>(() => {
        if (options.done?.value !== undefined) return options.done.value;
        return isValid.value;
    });

    const caution = computed(() => {
        if (options.caution?.value !== undefined) return !! options.caution.value;
        return done.value === false;
    });

    const error = computed<string | boolean | null>(() => {
        if (! caution.value) return null;
        if (typeof options.caution?.value === 'string') return options.caution.value;
        if (isRequired() && ! options.value.value) return options.requiredMessage ?? 'Campo obrigatório';
        return options.invalidMessage ?? 'Valor inválido';
    });

    const onBlur = () => {
        // Ponto de extensao: hoje a validacao e sempre reativa (computed),
        // entao nao ha estado a atualizar aqui. Exposto para que
        // componentes que queiram um gate de "so valida apos blur"
        // possam evoluir esse comportamento sem mudar o contrato publico.
    };

    return { done, error, caution, onBlur };
}
