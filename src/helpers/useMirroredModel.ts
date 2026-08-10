import type { Ref } from 'vue';
import { ref, watch } from 'vue';

export interface UseMirroredModelOptions<T> {
    /** Transforma o valor antes de emitir (ex.: onlyNumbers, toNumber). */
    transform?: (value: T) => T;
    /**
     * Compara valores para decidir se deve reatribuir o ref local quando
     * `props.modelValue` muda (evita eco). Default: igualdade estrita (===).
     */
    compare?: (a: T, b: T) => boolean;
    /**
     * Se true, o watch de emissao roda imediatamente no mount.
     * Default: false.
     */
    immediate?: boolean;
}

/**
 * Encapsula o padrao de v-model espelhado (`temp_value` + par de watches)
 * reimplementado manualmente em varios componentes de input desta lib.
 *
 * Cria um `ref` local inicializado com `props.modelValue`. Um watch no ref
 * local emite `update:modelValue` (aplicando `transform`, se fornecido)
 * sempre que o valor muda. Um segundo watch em `() => props.modelValue`
 * atualiza o ref local quando o valor externo muda, usando `compare` para
 * evitar reatribuir quando os valores ja sao equivalentes — o mesmo tipo de
 * guard que precisou ser adicionado manualmente em componentes como
 * `MaxInputCep.vue` para evitar loops/ecos entre o valor mascarado local e o
 * valor cru vindo do pai.
 *
 * Nota sobre `immediate`: por padrao o watch de emissao NAO roda no mount,
 * para evitar um `update:modelValue` espurio logo na montagem (quando o
 * valor local ja e identico ao que o pai passou). Componentes que dependiam
 * de emissao eager no mount (ex.: para dispararem side effects encadeados
 * assim que o componente monta) devem passar `immediate: true`
 * explicitamente — nao mude o default sem entender o motivo: a Etapa 7b
 * deste projeto teve uma regressao real por perder um comportamento eager
 * ao mover logica para um watch nao-immediate.
 */
export function useMirroredModel<T>(
    props: { modelValue: T },
    emit: (event: 'update:modelValue', value: T) => void,
    options?: UseMirroredModelOptions<T>
): Ref<T> {
    const compare = options?.compare ?? ((a: T, b: T) => a === b);

    const value = ref(props.modelValue) as Ref<T>;

    watch(value, (newValue) => {
        emit('update:modelValue', options?.transform ? options.transform(newValue) : newValue);
    }, { immediate: options?.immediate ?? false });

    watch(() => props.modelValue, (newValue) => {
        if (! compare(newValue, value.value)) value.value = newValue;
    });

    return value;
}
