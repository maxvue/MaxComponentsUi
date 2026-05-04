import { MaybeRefOrGetter } from 'vue';
/**
 * Define o valor em um caminho específico de um objeto.
 * Se o caminho não existir, ele será criado.
 *
 * @param object O objeto a ser modificado.
 * @param path O caminho da propriedade a ser definida (string ou array).
 * @param value O valor a ser definido.
 * @returns Retorna o objeto modificado.
 */
export declare function set<T = any>(object: MaybeRefOrGetter<any>, path: string | string[], value: any): T;
//# sourceMappingURL=set.d.ts.map