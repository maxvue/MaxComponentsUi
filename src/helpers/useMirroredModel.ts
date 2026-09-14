import type { Ref } from 'vue';
import { ref, watch } from 'vue';

export interface UseMirroredModelOptions<T> {
    /**
     * Transforma o valor antes de emitir (ex.: onlyNumbers, toNumber, toUpperCase).
     * A função transform deve preferencialmente ser idempotente:
     * transform(transform(x)) === transform(x).
     */
    transform?: (value: T) => T;
    /**
     * Compara valores para decidir se deve reatribuir o ref local quando
     * `props.modelValue` muda ou se a nova emissão representa um valor idêntico
     * ao último canônico emitido (evita loops e ecos de round-trip).
     * Default: igualdade estrita (===).
     */
    compare?: (a: T, b: T) => boolean;
    /**
     * Se true, o watch de emissão roda imediatamente no mount.
     * Default: false.
     */
    immediate?: boolean;
}

/**
 * Encapsula o padrão de v-model espelhado (`temp_value` + par de watches)
 * utilizado em componentes de input para desacoplar a formatação/edição local
 * do valor do pai.
 *
 * Cria um `ref` local inicializado com `props.modelValue`.
 * Um watch no ref local calcula o valor canônico (via `transform`, se fornecido)
 * e o emite via `update:modelValue`, guardando o último valor canônico emitido.
 *
 * Um segundo watch em `() => props.modelValue` monitora mudanças externas:
 * - Se o valor externo for equivalente ao valor local ou ao último valor canônico
 *   já emitido (segundo `compare`), a atualização externa é tratada como eco
 *   e o ref local é preservado (evitando perda de formatação ou emissões duplicadas).
 * - Se for uma alteração externa genuína, o ref local é atualizado e o guard
 *   é preparado de modo que uma emissão derivada subsequente ocorra apenas se
 *   a transformação produzir um valor semanticamente novo.
 *
 * Nota sobre `immediate`: por padrão o watch de emissão NÃO roda no mount,
 * para evitar `update:modelValue` espúrio logo na montagem. Componentes que
 * dependem de emissão eager no mount (ex.: `MaxInputCpfCnpj`) devem passar
 * `immediate: true` explicitamente.
 */
export function useMirroredModel<T>(
    props: { modelValue: T },
    emit: (event: 'update:modelValue', value: T) => void,
    options?: UseMirroredModelOptions<T>
): Ref<T> {
    const compare = options?.compare ?? ((a: T, b: T) => a === b);
    const transform = options?.transform;

    const value = ref(props.modelValue) as Ref<T>;

    // Guarda o último valor canônico emitido (ou recebido) para suprimir ecos
    let lastCanonicalEmitted: T | undefined = undefined;

    watch(
        value,
        (newValue) => {
            const canonical = transform ? transform(newValue) : newValue;
            if (lastCanonicalEmitted !== undefined && compare(canonical, lastCanonicalEmitted)) return;

            // Atualizar o guard canônico antes de emitir para prevenir qualquer corrida síncrona
            lastCanonicalEmitted = canonical;
            emit('update:modelValue', canonical);
        },
        { immediate: options?.immediate ?? false }
    );

    watch(
        () => props.modelValue,
        (newExternalValue) => {
            // Se o novo valor da prop já for equivalente ao ref local atual
            if (compare(newExternalValue, value.value)) return;

            // Se o novo valor da prop for equivalente ao último valor canônico que nós mesmos emitimos (eco do pai)
            if (lastCanonicalEmitted !== undefined && compare(newExternalValue, lastCanonicalEmitted)) return;

            // Trata-se de uma alteração externa genuína:
            // Sincroniza o guard com a prop externa para que a emissão subsequente
            // pelo watch local ocorra somente se `transform(newExternalValue)` produzir
            // um valor semanticamente novo em relação ao que o pai forneceu.
            lastCanonicalEmitted = newExternalValue;
            value.value = newExternalValue;
        }
    );

    return value;
}
