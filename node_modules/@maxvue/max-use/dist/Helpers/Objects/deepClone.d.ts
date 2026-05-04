import { MaybeRefOrGetter } from 'vue';
/**
 * Cria uma cópia profunda de um valor, lidando com referências circulares e diversos tipos de dados.
 * Semelhante ao _.cloneDeep do Lodash.
 *
 * @param value O valor a ser clonado.
 * @param map Um WeakMap para rastrear referências circulares (uso interno).
 * @returns Uma cópia profunda do valor.
 */
export declare function deepClone<T>(value: MaybeRefOrGetter<T>, map?: WeakMap<object, any>): T;
//# sourceMappingURL=deepClone.d.ts.map