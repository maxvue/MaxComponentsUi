import type { ComputedRef, Ref } from 'vue';
import { computed, ref, unref, watch } from 'vue';

export interface UseInputValidationOptions {
    /** Se o campo e obrigatorio (usado para a mensagem de erro de campo vazio). */
    required?: Ref<boolean | undefined> | boolean;
    /** Valor para comparacao opcional, exposto para confirmacao de senha ou equivalentes. */
    targetValue?: Ref<any>;
    /**
     * Override explicito de caution vindo do pai. Quando definido, e retornado
     * DIRETO, sem AND com nenhum estado interno de validacao.
     */
    caution?: Ref<string | boolean | undefined>;
    /** Override explicito de done vindo do pai. Quando definido, e retornado direto. */
    done?: Ref<boolean | undefined>;
    /** Funcao de validacao especifica do componente (ex.: cpfCnpjIsValid, cepIsValid). */
    validator: (value: any) => boolean;
    /** Ref do valor atual sendo validado. */
    value: Ref<any>;
    /** Mensagem de erro a usar quando o valor e invalido. Default: 'Valor inválido'. */
    invalidMessage?: string | Ref<string | undefined> | (() => string | undefined);
    /** Mensagem de erro a usar quando o campo e obrigatorio e esta vazio. Default: 'Campo obrigatório'. */
    requiredMessage?: string | Ref<string | undefined> | (() => string | undefined);
    /** Modo de validação: 'lazy' (padrão: valida após blur/submit) ou 'eager' (imediato no mount). */
    mode?: 'lazy' | 'eager';
    /** Alias para mode === 'eager' */
    immediate?: boolean;
    /** Função opcional para verificar se a entrada atingiu o tamanho/formato completo (para máscaras como CPF/CNPJ, CEP, Cartão). */
    isComplete?: (value: any) => boolean;
}

export interface UseInputValidationResult {
    done: ComputedRef<boolean | null>;
    error: ComputedRef<string | boolean | null>;
    caution: ComputedRef<boolean>;
    touched: Ref<boolean>;
    dirty: Ref<boolean>;
    submitted: Ref<boolean>;
    isValid: ComputedRef<boolean>;
    onBlur: () => void;
    onInput: (val?: any) => void;
    submit: () => boolean;
    reset: () => void;
}

const isEmpty = (val: any): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.trim().length === 0;
    if (Array.isArray(val)) return val.length === 0;
    return false;
};

const resolveMessage = (msg: string | Ref<string | undefined> | (() => string | undefined) | undefined, fallback: string): string => {
    if (typeof msg === 'function') {
        const res = msg();
        return res ?? fallback;
    }
    const res = unref(msg);
    return res ?? fallback;
};

/**
 * Encapsula a politica touched/dirty/submitted e a logica done/error/caution
 * compartilhada pelos componentes de formulario da biblioteca.
 *
 * Politica de feedback:
 * - Campos obrigatorios vazios nao exibem erro no mount (estado neutro: done=null, sem erro).
 * - A validacao e ativada apos blur (onBlur) ou submissao do formulario (submit).
 * - Uma vez em erro, a correcao valida remove o erro imediatamente na proxima digitacao (onInput).
 * - Campos opcionais vazios permanecem em estado neutro (done=null, sem caution).
 * - Overrides explicitos de done e caution pelo pai continuam tendo prioridade absoluta.
 */
export function useInputValidation(options: UseInputValidationOptions): UseInputValidationResult {
    const isEager = Boolean(options.immediate || options.mode === 'eager');
    const touched = ref(isEager);
    const dirty = ref(isEager);
    const submitted = ref(false);
    const hadError = ref(false);

    const isRequired = () => (typeof options.required === 'boolean' ? options.required : options.required?.value) ?? false;

    const isValid = computed(() => {
        if (options.done?.value !== undefined) return options.done.value;
        const val = options.value.value;
        const empty = isEmpty(val);
        if (empty) return !isRequired();

        if (options.targetValue && options.targetValue.value !== undefined) if (val !== options.targetValue.value) return false;

        return options.validator(val);
    });

    const shouldShowError = computed(() => {
        if (options.caution?.value !== undefined) return Boolean(options.caution.value);
        if (options.done?.value !== undefined) return options.done.value === false;
        if (isValid.value) return false;

        const empty = isEmpty(options.value.value);
        if (empty) return isRequired() && (touched.value || submitted.value);

        if (options.isComplete) {
            const complete = options.isComplete(options.value.value);
            if (complete) {
                return true;
            }
            return touched.value || submitted.value || hadError.value;
        }

        return touched.value || submitted.value || hadError.value || dirty.value;
    });

    const done = computed<boolean | null>(() => {
        if (options.done?.value !== undefined) return options.done.value;

        const empty = isEmpty(options.value.value);
        if (empty) {
            if (!isRequired()) return null;
            return touched.value || submitted.value ? false : null;
        }

        if (isValid.value) return true;

        if (options.isComplete) {
            const complete = options.isComplete(options.value.value);
            if (!complete && !touched.value && !submitted.value && !hadError.value) {
                return null;
            }
        }

        return false;
    });

    const caution = computed(() => {
        if (options.caution?.value !== undefined) return Boolean(options.caution.value);
        return shouldShowError.value;
    });

    const error = computed<string | boolean | null>(() => {
        if (options.caution?.value !== undefined && typeof options.caution.value === 'string') return options.caution.value;

        if (!caution.value || isValid.value) return null;
        const empty = isEmpty(options.value.value);
        if (empty && isRequired()) return resolveMessage(options.requiredMessage, 'Campo obrigatório');

        return resolveMessage(options.invalidMessage, 'Valor inválido');
    });

    const onBlur = () => {
        touched.value = true;
        if (!isValid.value) hadError.value = true;
    };

    const onInput = (_val?: any) => {
        dirty.value = true;
        if (isValid.value) hadError.value = false;
    };

    const submit = (): boolean => {
        submitted.value = true;
        touched.value = true;
        if (!isValid.value) hadError.value = true;
        return isValid.value;
    };

    const reset = () => {
        touched.value = false;
        dirty.value = false;
        submitted.value = false;
        hadError.value = false;
    };

    watch(() => options.value.value, () => {
        dirty.value = true;
        if (isValid.value) hadError.value = false;
    });

    return {
        done,
        error,
        caution,
        touched,
        dirty,
        submitted,
        isValid,
        onBlur,
        onInput,
        submit,
        reset
    };
}
